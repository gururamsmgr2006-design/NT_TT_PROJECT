// models/MarketIntelligence.js — Cached AI market data (24hr TTL)
const mongoose = require('mongoose');

const MarketIntelligenceSchema = new mongoose.Schema({
  scope: { type: String, default: 'india', index: true },

  emergingSkills: [{
    skill:      { type: String },
    growthRate: { type: String },
    demandScore:{ type: Number },
    avgSalary:  { type: String },
    reason:     { type: String },
  }],

  decliningSkills: [{
    skill:       { type: String },
    declineRate: { type: String },
    reason:      { type: String },
  }],

  fastestGrowingCareers: [{
    career:     { type: String },
    growth:     { type: String },
    avgSalary:  { type: String },
    demand:     { type: String },
    openings:   { type: String },
  }],

  cityDemand: [{
    city:            { type: String },
    topSkills:       [{ type: String }],
    avgSalary:       { type: String },
    growthOutlook:   { type: String },
    topCompanies:    [{ type: String }],
  }],

  industryHealth: [{
    industry:      { type: String },
    healthScore:   { type: Number, min: 0, max: 100 },
    growthOutlook: { type: String },
    hiringTrend:   { type: String },
    avgSalary:     { type: String },
  }],

  forecasts: {
    sixMonths:  [{ type: String }],
    oneYear:    [{ type: String }],
    threeYears: [{ type: String }],
    fiveYears:  [{ type: String }],
  },

  salaryIntelligence: [{
    role:       { type: String },
    entry:      { type: String },
    mid:        { type: String },
    senior:     { type: String },
    trend:      { type: String },
  }],

  technologyTrends:   [{ type: String }],
  hiringTrends:       [{ type: String }],
  emergingOpportunities: [{ type: String }],

  cachedAt:  { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

// TTL auto-delete
MarketIntelligenceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('MarketIntelligence', MarketIntelligenceSchema);
