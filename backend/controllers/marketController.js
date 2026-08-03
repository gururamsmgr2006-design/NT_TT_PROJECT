// controllers/marketController.js — Market Intelligence (Skill Radar + Trends)
const MarketIntelligence = require('../models/MarketIntelligence');
const { callAIForJSON, SYSTEM_PROMPTS } = require('../services/aiService');

const CACHE_HOURS = parseInt(process.env.MARKET_INTEL_REFRESH_HOURS) || 24;

async function getOrGenerate(scope = 'india') {
  const existing = await MarketIntelligence.findOne({ scope });
  if (existing && existing.cachedAt && (Date.now() - existing.cachedAt < CACHE_HOURS * 3600000)) {
    return { data: existing, fresh: false };
  }

  const prompt = `Generate comprehensive Indian job market intelligence for ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.

Return JSON:
{
  "emergingSkills": [{"skill":"string","growthRate":"string","demandScore":<0-100>,"avgSalary":"string","reason":"string"}],
  "decliningSkills": [{"skill":"string","declineRate":"string","reason":"string"}],
  "fastestGrowingCareers": [{"career":"string","growth":"string","avgSalary":"string","demand":"string","openings":"string"}],
  "cityDemand": [{"city":"string","topSkills":["string"],"avgSalary":"string","growthOutlook":"string","topCompanies":["string"]}],
  "industryHealth": [{"industry":"string","healthScore":<0-100>,"growthOutlook":"string","hiringTrend":"string","avgSalary":"string"}],
  "forecasts": {
    "sixMonths": ["string"],
    "oneYear": ["string"],
    "threeYears": ["string"],
    "fiveYears": ["string"]
  },
  "salaryIntelligence": [{"role":"string","entry":"string","mid":"string","senior":"string","trend":"string"}],
  "technologyTrends": ["string"],
  "hiringTrends": ["string"],
  "emergingOpportunities": ["string"]
}

Include data for: Bangalore, Mumbai, Hyderabad, Delhi NCR, Pune, Chennai, Kolkata.
Cover: AI/ML, Cloud, Cybersecurity, FinTech, EdTech, HealthTech, GreenTech sectors.
Use ₹LPA salary format. Be specific and data-driven.`;

  const result = await callAIForJSON(prompt, SYSTEM_PROMPTS.marketIntelligence);
  const now = new Date();
  const data = await MarketIntelligence.findOneAndUpdate(
    { scope },
    { ...result, scope, cachedAt: now, expiresAt: new Date(now.getTime() + CACHE_HOURS * 3600000) },
    { upsert: true, new: true }
  );
  return { data, fresh: true };
}

exports.getSkillRadar = async (req, res, next) => {
  try {
    const { data, fresh } = await getOrGenerate('india');
    res.json({
      success: true, fresh, cachedAt: data.cachedAt,
      emergingSkills:  data.emergingSkills  || [],
      decliningSkills: data.decliningSkills || [],
      fastestGrowingCareers: data.fastestGrowingCareers || [],
      cityDemand:      data.cityDemand      || [],
      forecasts:       data.forecasts       || {},
      salaryIntelligence: data.salaryIntelligence || [],
    });
  } catch (error) { next(error); }
};

exports.getMarketTrends = async (req, res, next) => {
  try {
    const { data, fresh } = await getOrGenerate('india');
    res.json({
      success: true, fresh, cachedAt: data.cachedAt,
      industryHealth:         data.industryHealth         || [],
      fastestGrowingCareers:  data.fastestGrowingCareers  || [],
      technologyTrends:       data.technologyTrends       || [],
      hiringTrends:           data.hiringTrends           || [],
      emergingOpportunities:  data.emergingOpportunities  || [],
      salaryIntelligence:     data.salaryIntelligence     || [],
      forecasts:              data.forecasts              || {},
    });
  } catch (error) { next(error); }
};

exports.forceRefresh = async (req, res, next) => {
  try {
    await MarketIntelligence.deleteMany({ scope: 'india' });
    const { data } = await getOrGenerate('india');
    res.json({ success: true, message: 'Market intelligence refreshed.', cachedAt: data.cachedAt });
  } catch (error) { next(error); }
};
