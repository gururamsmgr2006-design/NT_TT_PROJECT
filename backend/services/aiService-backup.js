// services/aiService.js — AI Provider Abstraction Layer (UPDATED with new prompts)
// Supports: Gemini (primary), Groq, OpenRouter, OpenAI (fallback waterfall)

const https = require('https');

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

function jsonPost(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
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
        catch (e) { reject(new Error('Invalid JSON response from AI provider')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callGemini(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
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
      { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',      threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };
  const res = await jsonPost(url, payload);
  if (res.status === 503) throw new Error('Gemini temporarily overloaded');
  if (res.status !== 200) throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(res.body?.error)}`);
  const text = res.body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

async function callGroq(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
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
  if (res.status !== 200) throw new Error(JSON.stringify(res.body));
  return res.body.choices[0].message.content;
}

async function callOpenRouter(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
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
  if (res.status !== 200) throw new Error(`OpenRouter API error ${res.status}`);
  const text = res.body?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenRouter');
  return text;
}

async function callOpenAI(messages, systemPrompt, lang = 'en') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
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
  if (res.status !== 200) throw new Error(`OpenAI API error ${res.status}`);
  const text = res.body?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');
  return text;
}

async function callAI(messages, systemPrompt = '', lang = 'en') {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const PROVIDERS = { gemini: callGemini, groq: callGroq, openrouter: callOpenRouter, openai: callOpenAI };
  const primary = PROVIDERS[provider] || callGemini;
  try {
    return await primary(messages, systemPrompt, lang);
  } catch (primaryErr) {
    console.error(`[AI] Primary (${provider}) failed:`, primaryErr.message);
    const fallbacks = Object.entries(PROVIDERS).filter(([k]) => k !== provider).map(([, fn]) => fn);
    for (const fallback of fallbacks) {
      try { return await fallback(messages, systemPrompt, lang); }
      catch (e) { console.error('[AI] Fallback failed:', e.message); }
    }
    throw new Error('All AI providers failed. Check API keys and network.');
  }
}

async function callAIForJSON(prompt, systemPrompt = '', lang = 'en') {
  const jsonSystem = `${systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON. No markdown, no explanation, no code fences. Pure JSON only.`;
  const raw = await callAI([{ role: 'user', content: prompt }], jsonSystem, lang);
  const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
  try { return JSON.parse(cleaned); }
  catch {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[1]);
    throw new Error('AI returned invalid JSON: ' + cleaned.slice(0, 200));
  }
}

// ── System Prompts ─────────────────────────────────────────────
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
