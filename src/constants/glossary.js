/**
 * Glossary entries — financial terms used across Forecrest.
 * Texts (title, definition, formula desc, interpretation, aliases) live in i18n via glossary_* keys.
 *
 * Each entry:
 *   id         — unique key (maps to i18n: glossary_{id}_title, _def, _interpret, _aliases)
 *   category   — revenue | costs | treasury | fiscal | kpi
 *   formula    — optional computation formula
 *   related[]  — linked glossary entry ids
 *   location   — { tab, section? } where the term is visible in the app
 *   valueKey   — optional key to resolve live value from financials map
 *   interpret  — if true, i18n key glossary_{id}_interpret exists
 *   settings   — optional settings section id for configurable terms
 *   aliases    — if true, i18n key glossary_{id}_aliases exists (comma-separated)
 *   pcmn       — optional PCMN code (Belgian chart of accounts), shown only in accounting/dev mode
 */

export var GLOSSARY_CATEGORIES = [
  { id: "revenue", icon: "TrendUp" },
  { id: "costs", icon: "Wallet" },
  { id: "assets", icon: "Buildings" },
  { id: "treasury", icon: "Vault" },
  { id: "fiscal", icon: "Scales" },
  { id: "kpi", icon: "ChartBar" },
];

export var GLOSSARY = [
  { id: "active_sources", category: "revenue", related: ["annual_revenue"], location: { tab: "streams" } },
  { id: "annual_revenue", category: "revenue", formula: "sum(stream.annual)", related: ["monthly_revenue", "ebitda", "cost_coverage"], location: { tab: "streams" }, valueKey: "annualRevenue", aliases: true, pcmn: "70" },
  { id: "average_revenue_per_source", category: "revenue", formula: "annual_revenue / active_sources", related: ["annual_revenue", "active_sources"], location: { tab: "streams" } },
  { id: "break_even", category: "treasury", formula: "fixed_costs / (1 - variable_costs/revenue)", related: ["cost_coverage", "total_costs"], location: { tab: "overview", section: "analyse" }, interpret: true, aliases: true },
  { id: "burn_rate", category: "treasury", formula: "(total_costs - annual_revenue) / 12", related: ["runway", "treasury"], location: { tab: "cashflow" }, valueKey: "burnRate", interpret: true, aliases: true },
  { id: "cost_coverage", category: "revenue", formula: "(annual_revenue / annual_costs) × 100", related: ["annual_revenue", "break_even"], location: { tab: "streams" }, valueKey: "costCoverage", interpret: true, aliases: true },
  { id: "daily_rate", category: "kpi", related: ["utilization_rate", "annual_revenue"], location: { tab: "overview", section: "analyse" }, aliases: true },
  { id: "depreciation", category: "assets", formula: "acquisition_cost / useful_life", related: ["fixed_assets", "nbv"], location: { tab: "equipment" }, aliases: true, pcmn: "6302" },
  { id: "ebitda", category: "kpi", formula: "annual_revenue - total_costs", related: ["annual_revenue", "total_costs", "ebitda_margin"], location: { tab: "overview", section: "resume" }, valueKey: "ebitda", interpret: true, aliases: true },
  { id: "ebitda_margin", category: "kpi", formula: "(ebitda / annual_revenue) × 100", related: ["ebitda", "annual_revenue"], location: { tab: "overview", section: "analyse" }, valueKey: "ebitdaMargin", interpret: true, aliases: true },
  { id: "fixed_assets", category: "assets", related: ["depreciation", "nbv"], location: { tab: "equipment" }, valueKey: "totalAssets", aliases: true, pcmn: "2" },
  { id: "fixed_costs", category: "costs", related: ["variable_costs", "total_costs", "break_even"], location: { tab: "opex" }, valueKey: "fixedCosts", aliases: true, pcmn: "6" },
  { id: "health_score", category: "kpi", related: ["ebitda_margin", "runway", "cost_coverage"], location: { tab: "overview", section: "analyse" }, interpret: true },
  { id: "ipp", category: "fiscal", related: ["net_profit"], location: { tab: "overview", section: "avance" }, settings: "fiscalite", aliases: true },
  { id: "isoc", category: "fiscal", formula: "20% (first 100K) + 25% (above)", related: ["ebitda", "net_profit"], location: { tab: "overview", section: "avance" }, valueKey: "isoc", settings: "fiscalite", aliases: true, pcmn: "6702" },
  { id: "monthly_revenue", category: "revenue", formula: "sum(stream.monthly)", related: ["annual_revenue", "recurring_revenue"], location: { tab: "streams" }, valueKey: "monthlyRevenue", aliases: true, pcmn: "70" },
  { id: "nbv", category: "assets", formula: "acquisition_cost - cumulated_depreciation", related: ["depreciation", "fixed_assets"], location: { tab: "equipment" }, interpret: true, aliases: true, pcmn: "2x-28" },
  { id: "net_profit", category: "kpi", formula: "ebitda - isoc - depreciation", related: ["ebitda", "isoc"], location: { tab: "overview", section: "resume" }, valueKey: "netProfit", interpret: true, aliases: true },
  { id: "onss", category: "fiscal", formula: "~13.07% employee + ~25% employer", related: ["salary_cost"], location: { tab: "salaries" }, settings: "fiscalite", aliases: true, pcmn: "4530/6210" },
  { id: "recurring_revenue", category: "revenue", formula: "sum(streams where frequency=monthly) × 12", related: ["monthly_revenue", "variable_revenue"], location: { tab: "streams" }, aliases: true, pcmn: "70" },
  { id: "runway", category: "treasury", formula: "treasury / burn_rate", related: ["burn_rate", "treasury"], location: { tab: "cashflow" }, valueKey: "runway", interpret: true, aliases: true },
  { id: "salary_cost", category: "costs", formula: "gross + onss_employer", related: ["total_costs", "onss"], location: { tab: "salaries" }, valueKey: "salaryCost", aliases: true, pcmn: "62" },
  { id: "seasonality", category: "revenue", related: ["monthly_revenue"], location: { tab: "streams" } },
  { id: "total_costs", category: "costs", formula: "fixed_costs + variable_costs + salaries", related: ["ebitda", "break_even"], location: { tab: "opex" }, valueKey: "totalCosts", aliases: true, pcmn: "6" },
  { id: "treasury", category: "treasury", related: ["burn_rate", "runway"], location: { tab: "cashflow" }, valueKey: "treasury", interpret: true, aliases: true, pcmn: "55" },
  { id: "tva", category: "fiscal", related: ["tva_deductible", "tva_collectee"], location: { tab: "overview", section: "avance" }, settings: "fiscalite", aliases: true, pcmn: "411/451" },
  { id: "tva_collectee", category: "fiscal", related: ["tva"], location: { tab: "overview", section: "avance" }, aliases: true, pcmn: "451" },
  { id: "tva_deductible", category: "fiscal", related: ["tva"], location: { tab: "overview", section: "avance" }, aliases: true, pcmn: "411" },
  { id: "utilization_rate", category: "kpi", formula: "billed_days / available_days", related: ["annual_revenue"], location: { tab: "overview", section: "analyse" }, aliases: true },
  { id: "variable_costs", category: "costs", related: ["fixed_costs", "total_costs"], location: { tab: "opex" }, aliases: true },
  { id: "variable_revenue", category: "revenue", formula: "annual_revenue - recurring_revenue", related: ["recurring_revenue", "annual_revenue"], location: { tab: "streams" } },
  { id: "vvprbis", category: "fiscal", related: ["isoc"], location: { tab: "set", section: "fiscalite" }, settings: "fiscalite" },
  { id: "working_capital", category: "treasury", formula: "current_assets - current_liabilities", related: ["treasury"], location: { tab: "overview", section: "avance" }, interpret: true, aliases: true },

  /* Debt & financing */
  { id: "remaining_balance", category: "treasury", related: ["monthly_payment", "annual_interest"], location: { tab: "debt" }, pcmn: "17/42" },
  { id: "monthly_payment", category: "costs", formula: "principal + interest (annuity)", related: ["remaining_balance", "dscr"], location: { tab: "debt" }, pcmn: "42/6500" },
  { id: "annual_interest", category: "costs", formula: "sum(monthly_interest × 12)", related: ["remaining_balance", "dscr"], location: { tab: "debt" }, pcmn: "6500" },
  { id: "dscr", category: "kpi", formula: "ebitda / annual_debt_service", related: ["ebitda", "monthly_payment"], location: { tab: "debt" }, interpret: true },

  /* Stocks */
  { id: "stock_value", category: "assets", formula: "sum(quantity × unit_cost)", related: ["cogs", "stock_rotation"], location: { tab: "stocks" }, pcmn: "3" },
  { id: "cogs", category: "costs", formula: "sum(monthly_consumption × unit_cost)", related: ["stock_value", "stock_rotation"], location: { tab: "stocks" }, aliases: true, pcmn: "60" },
  { id: "stock_rotation", category: "kpi", formula: "(stock_value / annual_cogs) × 365", related: ["stock_value", "cogs"], location: { tab: "stocks" }, interpret: true },
  { id: "stock_coverage", category: "kpi", formula: "stock_value / monthly_cogs", related: ["stock_value", "cogs"], location: { tab: "stocks" }, interpret: true },

  /* Crowdfunding */
  { id: "crowdfunding_goal", category: "treasury", related: ["platform_commission", "net_margin"], location: { tab: "crowdfunding" } },
  { id: "platform_commission", category: "costs", formula: "goal × commission_rate", related: ["crowdfunding_goal", "net_margin"], location: { tab: "crowdfunding" } },
  { id: "tiers_cost", category: "costs", formula: "sum(tier_cost × tier_quantity)", related: ["crowdfunding_goal", "net_margin"], location: { tab: "crowdfunding" } },
  { id: "net_margin", category: "kpi", formula: "goal - commission - tiers_cost", related: ["crowdfunding_goal", "platform_commission", "tiers_cost"], location: { tab: "crowdfunding" } },

  /* Salary */
  { id: "headcount", category: "kpi", related: ["salary_cost", "payroll_ratio"], location: { tab: "salaries" } },
  { id: "avg_salary_cost", category: "costs", formula: "total_salary_cost / headcount", related: ["salary_cost", "headcount"], location: { tab: "salaries" } },
  { id: "payroll_ratio", category: "kpi", formula: "(annual_salary_cost / annual_revenue) × 100", related: ["salary_cost", "annual_revenue"], location: { tab: "salaries" }, interpret: true },
];

export var GLOSSARY_MAP = {};
GLOSSARY.forEach(function (entry) { GLOSSARY_MAP[entry.id] = entry; });
