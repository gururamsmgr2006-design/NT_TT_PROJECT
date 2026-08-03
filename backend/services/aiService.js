// services/aiService.js — AI Provider Abstraction Layer (RESILIENT PIPELINE)
// Supports: Gemini (primary), Groq, OpenRouter, OpenAI (fallback waterfall)
//
// Guarantees:
//   - Never throws to callers. callAI() and callAIForJSON() always resolve.
//   - Provider failures are retried once (only for transient errors), then
//     the pipeline falls through the provider waterfall, then a short-lived
//     response cache, then a deterministic local fallback.
//   - 100% backward compatible: same exports, same function signatures,
//     same env var names, same SYSTEM_PROMPTS content.

const https = require('https');
const crypto = require('crypto');

// ── Config (all optional, all default to current behavior) ─────
const DEFAULT_TIMEOUT_MS   = parseInt(process.env.AI_TIMEOUT_MS) || 15000;      // per-request timeout
const RETRY_BASE_MS        = parseInt(process.env.AI_RETRY_BASE_MS) || 400;     // backoff base
const CACHE_TTL_MS         = parseInt(process.env.AI_CACHE_TTL_MS) || 10 * 60 * 1000; // 10 min
const CACHE_MAX_ENTRIES    = parseInt(process.env.AI_CACHE_MAX_ENTRIES) || 100;
const RETRYABLE_STATUSES   = new Set([429, 500, 502, 503]);

// ── Language Instructions (unchanged) ───────────────────────────
const LANG_INSTRUCTIONS = {
  en: 'Respond in English.',
  ta: 'Respond in Tamil (தமிழ்). Use clear, natural Tamil.',
  hi: 'Respond in Hindi (हिंदी). Use clear, natural Hindi.',
  kn: 'Respond in Kannada (ಕನ್ನಡ). Use clear, natural Kannada.',
  te: 'Respond in Telugu (తెలుగు). Use clear, natural Telugu.',
};

function getLangInstruction(lang = 'en') {
  return LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.en;
}

// ── Tagged error helper (carries retry/auth metadata) ───────────
function taggedError(message, props = {}) {
  const err = new Error(message);
  return Object.assign(err, props);
}

// ── Low-level HTTP with timeout ──────────────────────────────────
function jsonPost(url, payload, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(taggedError('Invalid JSON response from AI provider', { retryable: false })); }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(taggedError(`Request timed out after ${timeoutMs}ms`, { retryable: true, timeout: true }));
    });
    req.on('error', (err) => {
      reject(taggedError(err.message, { retryable: true, networkError: true }));
    });
    req.write(body);
    req.end();
  });
}

// Converts a non-2xx HTTP response into a classified, tagged error.
function throwForStatus(providerLabel, res) {
  const status = res.status;
  const detail = JSON.stringify(res.body?.error || res.body || {}).slice(0, 300);
  throw taggedError(`${providerLabel} API error ${status}: ${detail}`, {
    status,
    retryable: RETRYABLE_STATUSES.has(status),
    authError: status === 401 || status === 403,
  });
}

function missingKeyError(envVarName) {
  return taggedError(`${envVarName} not set`, { retryable: false, authError: true, configError: true });
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// ── Providers (same request shape/behavior as before, now with
//    timeouts and classified errors for retry/waterfall logic) ──

async function callGemini(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw missingKeyError('GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const payload = {
    system_instruction: { parts: [{ text: `${systemPrompt}\n\n${getLangInstruction(lang)}` }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS) || 2048 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };
  const res = await jsonPost(url, payload);
  if (res.status !== 200) throwForStatus('Gemini', res);
  const text = res.body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw taggedError('Empty response from Gemini', { retryable: true });
  return text;
}

async function callGroq(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw missingKeyError('GROQ_API_KEY');
  const res = await jsonPost(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: `${systemPrompt}\n\n${getLangInstruction(lang)}` }, ...messages],
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 2048,
      temperature: 0.7,
    },
    { Authorization: `Bearer ${apiKey}` }
  );
  if (res.status !== 200) throwForStatus('Groq', res);
  const text = res.body?.choices?.[0]?.message?.content;
  if (!text) throw taggedError('Empty response from Groq', { retryable: true });
  return text;
}

async function callOpenRouter(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw missingKeyError('OPENROUTER_API_KEY');
  const res = await jsonPost(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'system', content: `${systemPrompt}\n\n${getLangInstruction(lang)}` }, ...messages],
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 2048,
      temperature: 0.7,
    },
    { Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': process.env.FRONTEND_URL || 'https://talenttrack.app', 'X-Title': 'TalentTrack AI' }
  );
  if (res.status !== 200) throwForStatus('OpenRouter', res);
  const text = res.body?.choices?.[0]?.message?.content;
  if (!text) throw taggedError('Empty response from OpenRouter', { retryable: true });
  return text;
}

async function callOpenAI(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw missingKeyError('OPENAI_API_KEY');
  const res = await jsonPost(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: `${systemPrompt}\n\n${getLangInstruction(lang)}` }, ...messages],
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 2048,
      temperature: 0.7,
    },
    { Authorization: `Bearer ${apiKey}` }
  );
  if (res.status !== 200) throwForStatus('OpenAI', res);
  const text = res.body?.choices?.[0]?.message?.content;
  if (!text) throw taggedError('Empty response from OpenAI', { retryable: true });
  return text;
}

const PROVIDER_FN = { gemini: callGemini, groq: callGroq, openrouter: callOpenRouter, openai: callOpenAI };
const PROVIDER_PRIORITY = ['gemini', 'groq', 'openrouter', 'openai'];

// ── Response cache (short-lived, exact-match) ───────────────────
const responseCache = new Map();

function makeCacheKey(systemPrompt, lang, messages) {
  const raw = `${systemPrompt}::${lang}::${JSON.stringify(messages)}`;
  return crypto.createHash('sha1').update(raw).digest('hex');
}
function getCache(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry.value;
}
function setCache(key, value) {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, time: Date.now() });
}

// ── Lightweight in-memory metrics (for debugging/log visibility) ─
const _metrics = { calls: 0, providerSuccess: {}, providerFailure: {}, retries: 0, cacheHits: 0, localFallbacks: 0 };
function recordSuccess(provider) { _metrics.providerSuccess[provider] = (_metrics.providerSuccess[provider] || 0) + 1; }
function recordFailure(provider) { _metrics.providerFailure[provider] = (_metrics.providerFailure[provider] || 0) + 1; }

// ── One provider attempt, with a single retry for transient errors
async function attemptProviderWithRetry(name, fn, messages, systemPrompt, lang, postProcess) {
  let retries = 0;
  for (let attempt = 0; attempt <= 1; attempt += 1) {
    try {
      const raw = await fn(messages, systemPrompt, lang);
      try {
        const value = postProcess ? postProcess(raw) : raw;
        recordSuccess(name);
        return { ok: true, value, retries };
      } catch (postErr) {
        console.log(`[${name}] response failed validation (${postErr.message}). Trying next provider.`);
        recordFailure(name);
        return { ok: false, retries };
      }
    } catch (err) {
      const label = err.timeout ? 'TIMEOUT' : (err.status || (err.authError ? 'AUTH' : 'ERROR'));
      console.log(`[${name}] ${label} — ${err.message}`);
      const canRetry = !err.authError && err.retryable && attempt === 0;
      if (!canRetry) {
        recordFailure(name);
        break;
      }
      retries += 1;
      _metrics.retries += 1;
      const backoff = RETRY_BASE_MS * 2 ** attempt + Math.floor(Math.random() * 150);
      console.log(`[${name}] retryable error. Retrying in ${backoff}ms...`);
      await sleep(backoff);
    }
  }
  console.log(`[${name}] failed${retries ? ` after ${retries} retry` : ''}. Falling through waterfall.`);
  return { ok: false, retries };
}

// ── Full waterfall: primary -> retry -> fallback providers -> cache
async function runWaterfall({ messages, systemPrompt, lang, postProcess, cacheKey }) {
  const start = Date.now();
  _metrics.calls += 1;

  const configuredPrimary = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const order = [configuredPrimary, ...PROVIDER_PRIORITY.filter((p) => p !== configuredPrimary)]
    .filter((p) => PROVIDER_FN[p]);

  let totalRetries = 0;
  const trail = [];

  for (const providerName of order) {
    const result = await attemptProviderWithRetry(
      providerName, PROVIDER_FN[providerName], messages, systemPrompt, lang, postProcess
    );
    totalRetries += result.retries;
    trail.push(`${providerName}${result.ok ? '✓' : '✗'}`);
    if (result.ok) {
      if (cacheKey) setCache(cacheKey, result.value);
      console.log(`[AI Pipeline] ${trail.join(' → ')} | used=${providerName} retries=${totalRetries} time=${Date.now() - start}ms`);
      return { value: result.value, provider: providerName, retries: totalRetries, allFailed: false };
    }
  }

  // All providers exhausted — try the cache before giving up.
  if (cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) {
      _metrics.cacheHits += 1;
      console.log(`[AI Pipeline] ${trail.join(' → ')} | all providers failed, served from cache (retries=${totalRetries}, time=${Date.now() - start}ms)`);
      return { value: cached, provider: 'cache', retries: totalRetries, allFailed: false };
    }
  }

  _metrics.localFallbacks += 1;
  console.log(`[AI Pipeline] ${trail.join(' → ')} | all providers + cache failed, using local fallback (retries=${totalRetries}, time=${Date.now() - start}ms)`);
  return { value: null, provider: 'local-fallback', retries: totalRetries, allFailed: true };
}

// ── JSON extraction with progressive repair ─────────────────────
function tryParseJSON(raw) {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try { return JSON.parse(cleaned); } catch (_) { /* fall through */ }

  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    const candidate = match[1];
    try { return JSON.parse(candidate); } catch (_) { /* fall through */ }

    // Common model slip-ups: trailing commas, stray control chars.
    const repaired = candidate
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    try { return JSON.parse(repaired); } catch (_) { /* fall through */ }
  }

  throw new Error('AI returned invalid JSON: ' + cleaned.slice(0, 200));
}

// ── Local (offline) fallbacks — always return something useful ──
function identifyCategory(systemPrompt) {
  for (const [key, val] of Object.entries(SYSTEM_PROMPTS)) {
    if (systemPrompt && systemPrompt.startsWith(val)) return key;
  }
  return 'career';
}

const OFFLINE_INTRO = {
  en: "I'm currently unable to reach the AI servers due to heavy traffic. Here's some general guidance in the meantime:",
  ta: 'அதிக போக்குவரத்து காரணமாக தற்போது AI சேவையகங்களை அணுக முடியவில்லை. இதற்கிடையில் சில பொதுவான வழிகாட்டுதல்கள்:',
  hi: 'भारी ट्रैफ़िक के कारण फ़िलहाल AI सर्वर तक नहीं पहुंचा जा सका। इस बीच कुछ सामान्य मार्गदर्शन:',
  kn: 'ಹೆಚ್ಚಿನ ಟ್ರಾಫಿಕ್ ಕಾರಣ ಪ್ರಸ್ತುತ AI ಸರ್ವರ್‌ಗಳನ್ನು ತಲುಪಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ಈ ಮಧ್ಯೆ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ:',
  te: 'అధిక ట్రాఫిక్ కారణంగా ప్రస్తుతం AI సర్వర్‌లను చేరుకోలేకపోతున్నాము. ఈలోగా కొన్ని సాధారణ సూచనలు:',
};

const OFFLINE_TIPS = {
  career: '- Apply consistently; prioritize quality over quantity.\n- Tailor your resume keywords to each job description.\n- Practice the STAR method for interview answers.\n- Follow up on applications after about a week.',
  resume: '- Use standard section headers (Experience, Education, Skills) for ATS parsing.\n- Quantify achievements with numbers wherever possible.\n- Avoid tables/graphics in the main body.\n- Mirror keywords from the job description naturally.',
  skillGap: '- Focus on the 2-3 skills most requested in your target job postings.\n- Prefer project-based learning over passive courses.\n- Add each new skill to a live project or portfolio piece.',
  roadmap: '- Break your goal into 3-month milestones.\n- Pair each skill with a certification or shippable project.\n- Re-evaluate your roadmap every quarter against job postings.',
  jobMatch: '- Re-check postings for your top 5 must-have skills.\n- Prioritize roles where you meet 70%+ of requirements.\n- Customize your resume summary per application.',
  digitalTwin: '- Review your resume, skills, and certifications for completeness.\n- Compare your profile against 2-3 target job postings.\n- Identify one high-leverage skill to build next.',
  employability: '- Complete your profile (skills, certifications, projects, links).\n- Get a resume review and fix ATS formatting issues.\n- Add at least one quantifiable project outcome.',
  escapeVelocity: '- List skills that transfer directly to your target role.\n- Identify 1-2 credentials that would close the gap fastest.\n- Network with people already in the target role.',
  insights: '- Keep your profile and resume up to date for sharper insights.\n- Track applications and interview outcomes weekly.\n- Revisit your career goals every few months.',
  marketIntelligence: '- Cross-check emerging skills against 3+ recent job postings.\n- Weight in-demand skills higher than trending-but-niche ones.\n- Reassess market fit every quarter.',
};

function localTextFallback(systemPrompt, lang) {
  const category = identifyCategory(systemPrompt);
  const intro = OFFLINE_INTRO[lang] || OFFLINE_INTRO.en;
  const tips = OFFLINE_TIPS[category] || OFFLINE_TIPS.career;
  return `${intro}\n\n${tips}\n\nPlease try again shortly for a personalized AI response.`;
}

function localJSONFallback(systemPrompt, lang) {
  const category = identifyCategory(systemPrompt);
  const note = 'AI service is temporarily unavailable — showing general guidance. Please retry shortly for a personalized result.';

  const templates = {
    resume: () => ({
      overallScore: 50, atsScore: 50, careerReadinessScore: 50,
      strengths: [], weaknesses: [], missingSkills: [], extractedSkills: [],
      formattingFeedback: note,
      keywordAnalysis: { found: [], missing: [] },
      improvementSuggestions: OFFLINE_TIPS.resume.split('\n').map((s) => s.replace(/^-\s*/, '')),
      certificationSuggestions: [], projectSuggestions: [], interviewPrepTopics: [],
      careerReadinessBreakdown: {},
      _offline: true,
    }),
    skillGap: () => ({
      matchPercentage: 0, presentSkills: [], missingSkills: [], learningPath: [],
      summary: note, _offline: true,
    }),
    roadmap: () => ({ summary: note, milestones: [], phases: [], _offline: true }),
    jobMatch: () => ({ matchScore: 0, matchedSkills: [], missingSkills: [], explanation: note, _offline: true }),
    digitalTwin: () => ({
      currentIdentity: { summary: note, careerHealthScore: 0, skillStrengthScore: 0, marketValueScore: 0 },
      careerPaths: [], topRecommendedPath: '', _offline: true,
    }),
    employability: () => ({
      totalScore: 0, breakdown: {}, improvementRecommendations: [note],
      topStrength: '', criticalGap: note, _offline: true,
    }),
    escapeVelocity: () => ({ transferableSkills: [], summary: note, transitions: [], _offline: true }),
    insights: () => ({
      insights: [{ type: 'risk', icon: '⚠️', title: 'AI temporarily unavailable', message: note, impact: 'low', actionRequired: 'Retry shortly.', metric: '' }],
      profileCompletenessPct: 0, _offline: true,
    }),
    marketIntelligence: () => ({ summary: note, emergingSkills: [], decliningSkills: [], cityDemand: {}, _offline: true }),
  };

  const build = templates[category] || (() => ({ summary: note, _offline: true }));
  return build();
}

// ── Public API (SIGNATURES UNCHANGED) ────────────────────────────

async function callAI(messages, systemPrompt = '', lang = 'en') {
  const cacheKey = makeCacheKey(systemPrompt, lang, messages);
  const result = await runWaterfall({ messages, systemPrompt, lang, postProcess: null, cacheKey });
  if (!result.allFailed) return result.value;
  console.log('[AI Pipeline] Returning local text fallback (no crash).');
  return localTextFallback(systemPrompt, lang);
}

async function callAIForJSON(prompt, systemPrompt = '', lang = 'en') {
  const jsonSystem = `${systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON. No markdown, no explanation, no code fences. Pure JSON only.`;
  const messages = [{ role: 'user', content: prompt }];
  const cacheKey = makeCacheKey(jsonSystem, lang, messages);
  const result = await runWaterfall({ messages, systemPrompt: jsonSystem, lang, postProcess: tryParseJSON, cacheKey });
  if (!result.allFailed) return result.value;
  console.log('[AI Pipeline] Returning local JSON fallback (no crash).');
  return localJSONFallback(systemPrompt, lang);
}

// ── System Prompts (UNCHANGED) ───────────────────────────────────
const SYSTEM_PROMPTS = {
  career: `You are CareerGuide AI — TalentTrack's expert career assistant and personal AI mentor.
You help job seekers with: job search strategies, resume advice, interview preparation, skill development,
salary negotiation, career transitions, industry insights, goal planning, and daily recommendations.
Be concise, practical, and encouraging. Use bullet points where appropriate.
Always tailor advice to the user's context.`,

  resume: `You are an expert resume reviewer, ATS specialist, and career readiness coach for the Indian job market.
Analyze resumes thoroughly and provide actionable feedback.
Focus on: ATS compatibility, keyword optimization, impact statements, formatting, certifications, projects, and Indian job market alignment.
Be specific, honest, and constructive.`,

  skillGap: `You are a technical skills assessment expert for the Indian tech industry.
Compare user skills against role requirements accurately.
Provide prioritized learning paths with specific resources (free courses, certifications).
Be direct about skill gaps and realistic about timelines in the Indian context.`,

  roadmap: `You are a career development strategist specializing in the Indian tech ecosystem.
Create detailed, realistic career roadmaps with Indian salary benchmarks.
Include specific skills, certifications, projects, timelines, and Indian company examples.`,

  jobMatch: `You are an explainable AI job matching specialist.
Analyze candidate profiles against job requirements and provide transparent, data-driven match scores.
Always explain WHY a job is or is not recommended. Be specific about matched/missing skills.`,

  digitalTwin: `You are an AI Career Intelligence specialist creating a Career Digital Twin for an Indian professional.
Analyze the user's complete career profile and generate:
1. Current career identity assessment with scores
2. Future career path simulations (5 paths) with Indian salary data, demand levels, and timelines
Be data-driven, use Indian job market context, and provide realistic predictions.
Use Indian salary ranges (₹LPA format).`,

  employability: `You are an employability assessment AI for the Indian job market.
Calculate a comprehensive Employability Score (0-1000) across 9 dimensions.
Be precise with scoring and provide specific, actionable improvement recommendations.
Use Indian industry benchmarks and hiring standards.`,

  escapeVelocity: `You are a career transition specialist for India's job market.
Help professionals identify transferable skills and optimal career transition paths.
Analyze current role, detect transferable skills, and recommend viable transitions.
Include realistic timelines, difficulty levels, and salary increases in Indian context (₹LPA).`,

  insights: `You are an AI career analyst generating personalized insights for Indian professionals.
Based on the user's career profile data, generate specific, actionable insights about:
opportunities detected, risks identified, salary intelligence, hidden skill value, and career readiness.
Be specific with numbers and percentages. Make insights feel personal and urgent.`,

  marketIntelligence: `You are an Indian labor market intelligence AI with deep knowledge of India's tech ecosystem.
Generate accurate, data-driven market intelligence covering:
emerging/declining skills, fastest growing careers, city-wise demand, industry health, salary trends.
Focus on Bangalore, Mumbai, Hyderabad, Delhi, Pune, Chennai, Kolkata.
Provide realistic 6-month, 1-year, 3-year, and 5-year forecasts for India's job market.`,
};

module.exports = { callAI, callAIForJSON, SYSTEM_PROMPTS, getLangInstruction };
