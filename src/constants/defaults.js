export const PCMN_OPTS = [
  { c: "1000", l: "Capital souscrit" },
  { c: "1300", l: "Réserve légale" },
  { c: "1700", l: "Dettes à plus d'un an" },
  { c: "2110", l: "Brevets et marques" },
  { c: "2400", l: "Matériel" },
  { c: "2410", l: "Matériel informatique" },
  { c: "6100", l: "Loyers" },
  { c: "6120", l: "Fournitures informatiques" },
  { c: "6125", l: "Logiciels et licences" },
  { c: "6130", l: "Honoraires" },
  { c: "6135", l: "Commissions commerciales externes" },
  { c: "6131", l: "Honoraires comptables" },
  { c: "6132", l: "Honoraires juridiques" },
  { c: "6140", l: "Publicité et marketing" },
  { c: "6141", l: "Assurances" },
  { c: "6150", l: "Déplacements" },
  { c: "6160", l: "Frais divers" },
  { c: "4110", l: "TVA sur achats (déductible)" },
  { c: "4200", l: "Dettes à un an au plus" },
  { c: "4510", l: "TVA sur ventes (collectée)" },
  { c: "6200", l: "Rémunérations brutes" },
  { c: "6210", l: "ONSS patronal" },
  { c: "6302", l: "Dotations aux amortissements" },
  { c: "6500", l: "Charges financières (intérêts)" },
  { c: "6700", l: "ISOC" },
  { c: "7000", l: "Ventes de produits finis" },
  { c: "7010", l: "Ventes de marchandises" },
  { c: "7020", l: "Ventes de services" },
  { c: "7030", l: "Commissions et courtages" },
  { c: "7400", l: "Subsides d'exploitation" },
  { c: "7410", l: "Aides à l'emploi" },
  { c: "7500", l: "Autres produits d'exploitation" },
  { c: "7510", l: "Plus-values de réalisation" },
  { c: "7600", l: "Produits financiers" },
];

export const SUB_OPTS = [
  "Cloud", "Software", "Marketing", "Legal", "Assurances",
  "Loyers", "Divers", "Brevets", "Materiel", "Amortissement",
  "Remunerations", "Commissions",
];

export const COST_DEF = [];

/* Cost type classification */
export var COST_TYPES = [
  { id: "exploitation", pcmnRange: ["61", "62", "63", "64"] },
  { id: "non_recurring", pcmnRange: ["21", "24", "66"] },
  { id: "financial", pcmnRange: ["65"] },
];

/* Cost frequency options */
export var COST_FREQUENCIES = {
  monthly: { multiplier: 12 },
  quarterly: { multiplier: 4 },
  annual: { multiplier: 1 },
  once: { multiplier: 1 },
};

export var COST_AMOUNTS = {
  bootstrap: [
    [5, 10, 10],
    [0, 0, 20, 0, 8],
    [50, 50],
    [100, 0, 50],
    [50, 20],
    [15, 30, 15],
  ],
  standard: [
    [25, 30, 25],
    [12, 8, 40, 30, 99],
    [300, 200],
    [250, 50, 100],
    [100, 50],
    [20, 50, 30],
  ],
  scaleup: [
    [100, 100, 50],
    [15, 10, 60, 100, 99],
    [1500, 500],
    [500, 150, 200],
    [200, 100],
    [25, 100, 50],
  ],
};

export function applyCostPreset(preset) {
  var costs = JSON.parse(JSON.stringify(COST_DEF));
  var amounts = COST_AMOUNTS[preset];
  if (!amounts) return costs;
  costs.forEach(function (cat, ci) {
    if (amounts[ci]) {
      cat.items.forEach(function (item, ii) {
        if (amounts[ci][ii] !== undefined) item.a = amounts[ci][ii];
      });
    }
  });
  return costs;
}

export const SAL_DEF = [];

export var ROLE_PRESETS = [
  { role: "CEO / Fondateur", cat: "founders", founder: true },
  { role: "CTO", cat: "founders", founder: true },
  { role: "COO", cat: "founders", founder: true },
  { role: "CFO", cat: "founders", founder: true },
  { role: "CMO", cat: "founders", founder: true },
  { role: "CPO", cat: "founders", founder: true },
  { role: "Lead Dev", cat: "tech", founder: false },
  { role: "Dev Senior", cat: "tech", founder: false },
  { role: "Dev Junior", cat: "tech", founder: false },
  { role: "DevOps", cat: "tech", founder: false },
  { role: "Data Scientist", cat: "tech", founder: false },
  { role: "Sales Manager", cat: "business", founder: false },
  { role: "Account Manager", cat: "business", founder: false },
  { role: "Business Dev", cat: "business", founder: false },
  { role: "Office Manager", cat: "ops", founder: false },
  { role: "RH", cat: "ops", founder: false },
  { role: "Legal", cat: "ops", founder: false },
  { role: "Finance", cat: "ops", founder: false },
  { role: "Marketing Manager", cat: "marketing", founder: false },
  { role: "Growth Hacker", cat: "marketing", founder: false },
  { role: "Content Manager", cat: "marketing", founder: false },
];

export const PROF_DEF = [
  { label: "Spa (premium)", basket: 180, emp: 5, dw: 6, hd: 10, dur: 90, occ: 0.75, chairs: 5, bkgD: 5 },
  { label: "Hair salon (mixed)", basket: 50, emp: 5, dw: 5, hd: 9, dur: 45, occ: 0.75, chairs: 5, bkgD: 9 },
  { label: "Beauty inst (med)", basket: 85, emp: 4, dw: 6, hd: 9, dur: 55, occ: 0.75, chairs: 4, bkgD: 7 },
  { label: "Hair salon F (med)", basket: 60, emp: 4, dw: 5, hd: 9, dur: 50, occ: 0.75, chairs: 4, bkgD: 8 },
  { label: "Spa (entry)", basket: 110, emp: 3, dw: 6, hd: 8, dur: 75, occ: 0.75, chairs: 3, bkgD: 5 },
  { label: "Yoga studio", basket: 25, emp: 2, dw: 6, hd: 8, dur: 60, occ: 0.75, chairs: 2, bkgD: 6 },
  { label: "Barbershop (team)", basket: 22, emp: 3, dw: 6, hd: 10, dur: 25, occ: 0.75, chairs: 3, bkgD: 18 },
  { label: "Beauty inst (sm)", basket: 70, emp: 2, dw: 5, hd: 8, dur: 60, occ: 0.75, chairs: 2, bkgD: 6 },
  { label: "Hair salon F (sm)", basket: 55, emp: 2, dw: 5, hd: 8, dur: 50, occ: 0.75, chairs: 2, bkgD: 7 },
  { label: "Sports coach", basket: 60, emp: 1, dw: 5, hd: 8, dur: 60, occ: 0.75, chairs: 1, bkgD: 6 },
  { label: "Barbershop (solo)", basket: 20, emp: 1, dw: 5, hd: 8, dur: 25, occ: 0.75, chairs: 1, bkgD: 14 },
  { label: "Nail art", basket: 12, emp: 2, dw: 6, hd: 8, dur: 50, occ: 0.75, chairs: 2, bkgD: 7 },
];

export const GRANT_DEF = [];

export const CAPTABLE_DEF = [];

// Revenue streams — legacy flat format (kept for migration compat)
export var STREAMS_DEF = [
  { id: "s1", name: "Abonnement SaaS", y1: 0 },
  { id: "s2", name: "Services / consulting", y1: 0 },
];

// Revenue — hierarchical model (classe 7 PCMN)
// Revenue streams — v2 behavior-based format
export var REVENUE_DEF = [];

export const REVENUE_PCMN_OPTS = [
  { c: "7000", l: "Ventes de produits finis" },
  { c: "7010", l: "Ventes de marchandises" },
  { c: "7020", l: "Ventes de services" },
  { c: "7030", l: "Commissions et courtages" },
  { c: "7400", l: "Subsides d'exploitation" },
  { c: "7410", l: "Aides à l'emploi" },
  { c: "7500", l: "Autres produits d'exploitation" },
  { c: "7510", l: "Plus-values de réalisation" },
  { c: "7600", l: "Produits financiers" },
];

export const REVENUE_SUB_OPTS = [
  "Abonnements", "Services", "Licences", "E-commerce",
  "Commissions", "Subsides", "Publicité", "Marketplace",
  "Consulting", "Formation", "Divers",
];

// Revenue behavior templates per business type
export var REVENUE_BEHAVIOR_TEMPLATES = {
  saas: [
    { l: "Abonnement mensuel", behavior: "recurring", price: 49, qty: 0 },
    { l: "Licence annuelle", behavior: "recurring", price: 499, qty: 0 },
    { l: "Usage plateforme", behavior: "per_user", price: 9, qty: 0 },
    { l: "Frais de mise en place", behavior: "one_time", price: 500, qty: 0 },
    { l: "Support premium", behavior: "recurring", price: 99, qty: 0 },
    { l: "Commission marketplace", behavior: "commission", price: 2, qty: 0 },
    { l: "Licence SDK", behavior: "royalty", price: 50, qty: 0 },
    { l: "Consulting technique", behavior: "hourly", price: 150, qty: 0 },
  ],
  ecommerce: [
    { l: "Vente de produits", behavior: "per_transaction", price: 35, qty: 0 },
    { l: "Commission marketplace", behavior: "commission", price: 5, qty: 0 },
    { l: "Box abonnement", behavior: "recurring", price: 29, qty: 0 },
    { l: "Dropshipping", behavior: "per_transaction", price: 15, qty: 0 },
    { l: "Abonnement fidélité", behavior: "recurring", price: 10, qty: 0 },
    { l: "Vente B2B", behavior: "per_transaction", price: 150, qty: 0 },
    { l: "Produits digitaux", behavior: "per_transaction", price: 19, qty: 0 },
    { l: "Licence contenu", behavior: "royalty", price: 5, qty: 0 },
  ],
  retail: [
    { l: "Vente en magasin", behavior: "per_transaction", price: 25, qty: 0 },
    { l: "Vente en ligne", behavior: "per_transaction", price: 30, qty: 0 },
    { l: "Cartes cadeaux", behavior: "one_time", price: 50, qty: 0 },
    { l: "Click & collect", behavior: "per_transaction", price: 20, qty: 0 },
    { l: "Programme fidélité", behavior: "recurring", price: 5, qty: 0 },
    { l: "Location d'espace", behavior: "recurring", price: 500, qty: 0 },
    { l: "Commission dépôt-vente", behavior: "commission", price: 10, qty: 0 },
    { l: "Ateliers", behavior: "hourly", price: 30, qty: 0 },
  ],
  services: [
    { l: "Mission consulting", behavior: "project", price: 5000, qty: 0 },
    { l: "Formation", behavior: "daily_rate", price: 800, qty: 0 },
    { l: "Retainer mensuel", behavior: "recurring", price: 2000, qty: 0 },
    { l: "Projet au forfait", behavior: "project", price: 15000, qty: 0 },
    { l: "Prestation horaire", behavior: "hourly", price: 120, qty: 0 },
    { l: "Apport d'affaires", behavior: "commission", price: 500, qty: 0 },
    { l: "Licence IP", behavior: "royalty", price: 200, qty: 0 },
    { l: "Audit", behavior: "one_time", price: 3000, qty: 0 },
  ],
  freelancer: [
    { l: "Journée de travail", behavior: "daily_rate", price: 500, qty: 0 },
    { l: "Prestation horaire", behavior: "hourly", price: 75, qty: 0 },
    { l: "Projet au forfait", behavior: "project", price: 5000, qty: 0 },
    { l: "Accompagnement mensuel", behavior: "recurring", price: 300, qty: 0 },
    { l: "Royalties", behavior: "royalty", price: 100, qty: 0 },
    { l: "Affiliation", behavior: "commission", price: 50, qty: 0 },
    { l: "Produit digital", behavior: "per_transaction", price: 29, qty: 0 },
    { l: "Sponsoring", behavior: "one_time", price: 500, qty: 0 },
  ],
  other: [
    { l: "Abonnement", behavior: "recurring", price: 100, qty: 0 },
    { l: "Vente ponctuelle", behavior: "one_time", price: 500, qty: 0 },
    { l: "Vente unitaire", behavior: "per_transaction", price: 25, qty: 0 },
    { l: "Prestation sur mesure", behavior: "project", price: 2000, qty: 0 },
    { l: "Prestation horaire", behavior: "hourly", price: 80, qty: 0 },
    { l: "Courtage", behavior: "commission", price: 50, qty: 0 },
    { l: "Licence", behavior: "royalty", price: 150, qty: 0 },
    { l: "Location", behavior: "recurring", price: 300, qty: 0 },
  ],
};

export var BUSINESS_TYPES = [
  { id: "saas" },
  { id: "ecommerce" },
  { id: "retail" },
  { id: "services" },
  { id: "freelancer" },
  { id: "other" },
];

/* ── Seasonality profiles ──
 * Each profile is an array of 12 monthly coefficients (Jan→Dec).
 * 1.0 = average month. Sum of coefficients = 12.0.
 * Applied: monthlyRevenue = baseMonthly × coefficient[month]
 */
export var SEASONALITY_PROFILES = {
  flat:          { coefs: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] },
  summer_peak:   { coefs: [0.7, 0.7, 0.8, 0.9, 1.1, 1.3, 1.4, 1.3, 1.0, 0.8, 0.7, 0.7] /* tourisme, HoReCa, événementiel */ },
  winter_peak:   { coefs: [1.1, 0.9, 0.8, 0.8, 0.8, 0.8, 0.7, 0.7, 0.9, 1.0, 1.4, 1.5] /* retail mode, cadeaux, énergie */ },
  black_friday:  { coefs: [0.8, 0.7, 0.7, 0.8, 0.8, 0.8, 0.7, 0.8, 0.9, 1.0, 1.5, 1.8] /* e-commerce Q4 */ },
  back_to_school:{ coefs: [0.8, 0.7, 0.7, 0.8, 0.8, 0.8, 0.7, 0.8, 1.4, 1.3, 1.1, 0.9] /* formation, éducation, B2B */ },
  year_start:    { coefs: [1.4, 1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.7, 0.9, 1.0, 1.0, 1.0] /* consulting, budgets corporate */ },
  year_end:      { coefs: [0.8, 0.8, 1.3, 0.9, 0.8, 0.8, 0.7, 0.7, 0.9, 1.0, 1.1, 1.5] /* audit, clôture, B2B */ },
  bimodal:       { coefs: [0.8, 0.8, 1.1, 1.3, 1.2, 0.8, 0.7, 0.7, 1.1, 1.3, 1.1, 0.8] /* mode, jardinage: printemps + automne */ },
  summer_dip:    { coefs: [1.1, 1.1, 1.1, 1.1, 1.0, 0.9, 0.6, 0.6, 1.0, 1.1, 1.1, 1.1] /* B2B, services pro: creux été */ },
};

export var SEASONALITY_DEFAULT = {
  saas: "flat", ecommerce: "black_friday", retail: "winter_peak",
  services: "summer_dip", freelancer: "summer_dip", other: "flat",
};

export var PLAN_SECTIONS_DEF = [
  { id: "summary", content: "" },
  { id: "problem", content: "" },
  { id: "solution", content: "" },
  { id: "market", content: "" },
  { id: "business_model", content: "" },
  { id: "financials", content: "" },
  { id: "team", content: "" },
  { id: "roadmap", content: "" },
];

export const ROUND_SIM_DEF = { raise: 500000, preMoney: 2000000 };

export const POOL_SIZE_DEF = 20000;

export const DEBT_DEF = [];

// Stripe published rates per payment method (Belgium, 2026-03).
// Source: https://stripe.com/fr-be/pricing  +  /pricing/local-payment-methods
// sVar/sFix = Stripe cost.  guVar/guFix = Forecrest commission charged.
// mix = default share of total transactions for a typical beauty establishment.
export var PAYMENT_METHODS_BE = [
  // ── Terminal (Stripe Terminal) ──
  // Cartes EEE : 1,4% + 0,10€
  { id: "card_tpe",              sVar: 0.014,  sFix: 0.10, guVar: 0.029, guFix: 0.20, channel: "tpe",    mix: 0.25 },
  // Bancontact (carte physique sur TPE) : même tarif carte EEE 1,4% + 0,10€
  { id: "bancontact_tpe",        sVar: 0.014,  sFix: 0.10, guVar: 0.025, guFix: 0.15, channel: "tpe",    mix: 0.12 },
  // Cartes non-EEE (touristes) : 2,9% + 0,10€
  { id: "card_intl_tpe",         sVar: 0.029,  sFix: 0.10, guVar: 0.045, guFix: 0.20, channel: "tpe",    mix: 0.03 },
  // ── Online ──
  // Cartes EEE standard : 1,5% + 0,25€
  { id: "card_online",           sVar: 0.015,  sFix: 0.25, guVar: 0.029, guFix: 0.50, channel: "online", mix: 0.13 },
  // Cartes EEE premium (Amex, etc.) : 1,9% + 0,25€
  { id: "card_premium_online",   sVar: 0.019,  sFix: 0.25, guVar: 0.035, guFix: 0.50, channel: "online", mix: 0.02 },
  // Cartes internationales (hors EEE) : 3,25% + 0,25€
  { id: "card_intl_online",      sVar: 0.0325, sFix: 0.25, guVar: 0.049, guFix: 0.50, channel: "online", mix: 0.02 },
  // Bancontact online : 0% + 0,35€ flat
  { id: "bancontact_online",     sVar: 0,      sFix: 0.35, guVar: 0.015, guFix: 0.50, channel: "online", mix: 0.08 },
  // ── Virements ──
  // SEPA Direct Debit : 0% + 0,35€
  { id: "sepa_debit",            sVar: 0,      sFix: 0.35, guVar: 0.010, guFix: 0.35, channel: "online", mix: 0.03 },
  // SEPA Bank Transfer : 0,5% (plafonné 5€)
  { id: "sepa_transfer",         sVar: 0.005,  sFix: 0,    guVar: 0.010, guFix: 0,    channel: "online", mix: 0.02 },
  // ── Cash ──
  { id: "cash",                  sVar: 0,      sFix: 0,    guVar: 0,     guFix: 0,    channel: "cash",   mix: 0.30 },
];

// Fee scenarios: predefined guVar/guFix profiles per payment method.
// "growth" matches PAYMENT_METHODS_BE defaults.
export var FEE_SCENARIOS = {
  accessible: {
    card_tpe:            { guVar: 0.020, guFix: 0.15 },
    bancontact_tpe:      { guVar: 0.019, guFix: 0.13 },
    card_intl_tpe:       { guVar: 0.035, guFix: 0.15 },
    card_online:         { guVar: 0.021, guFix: 0.35 },
    card_premium_online: { guVar: 0.025, guFix: 0.35 },
    card_intl_online:    { guVar: 0.039, guFix: 0.35 },
    bancontact_online:   { guVar: 0.008, guFix: 0.42 },
    sepa_debit:          { guVar: 0.005, guFix: 0.40 },
    sepa_transfer:       { guVar: 0.008, guFix: 0 },
    cash:                { guVar: 0, guFix: 0 },
  },
  balanced: {
    card_tpe:            { guVar: 0.022, guFix: 0.15 },
    bancontact_tpe:      { guVar: 0.020, guFix: 0.13 },
    card_intl_tpe:       { guVar: 0.038, guFix: 0.15 },
    card_online:         { guVar: 0.024, guFix: 0.35 },
    card_premium_online: { guVar: 0.028, guFix: 0.35 },
    card_intl_online:    { guVar: 0.042, guFix: 0.35 },
    bancontact_online:   { guVar: 0.010, guFix: 0.42 },
    sepa_debit:          { guVar: 0.007, guFix: 0.38 },
    sepa_transfer:       { guVar: 0.008, guFix: 0 },
    cash:                { guVar: 0, guFix: 0 },
  },
  growth: {
    card_tpe:            { guVar: 0.029, guFix: 0.20 },
    bancontact_tpe:      { guVar: 0.025, guFix: 0.15 },
    card_intl_tpe:       { guVar: 0.045, guFix: 0.20 },
    card_online:         { guVar: 0.029, guFix: 0.50 },
    card_premium_online: { guVar: 0.035, guFix: 0.50 },
    card_intl_online:    { guVar: 0.049, guFix: 0.50 },
    bancontact_online:   { guVar: 0.015, guFix: 0.50 },
    sepa_debit:          { guVar: 0.010, guFix: 0.35 },
    sepa_transfer:       { guVar: 0.010, guFix: 0 },
    cash:                { guVar: 0, guFix: 0 },
  },
  premium: {
    card_tpe:            { guVar: 0.039, guFix: 0.30 },
    bancontact_tpe:      { guVar: 0.035, guFix: 0.25 },
    card_intl_tpe:       { guVar: 0.055, guFix: 0.30 },
    card_online:         { guVar: 0.039, guFix: 0.65 },
    card_premium_online: { guVar: 0.045, guFix: 0.65 },
    card_intl_online:    { guVar: 0.059, guFix: 0.65 },
    bancontact_online:   { guVar: 0.025, guFix: 0.60 },
    sepa_debit:          { guVar: 0.015, guFix: 0.50 },
    sepa_transfer:       { guVar: 0.015, guFix: 0 },
    cash:                { guVar: 0, guFix: 0 },
  },
};

// Client price sensitivity thresholds (adjusted per research).
// <2.5% = fluide, 2.5–4% = sensible, >4% = friction.
export var FEELING_THRESHOLDS = [
  { max: 0.025, key: "fluide" },
  { max: 0.04,  key: "sensible" },
  { max: 1,     key: "friction" },
];

// Mix profiles: predefined payment method distributions by establishment type.
// Each profile maps method id → mix share (must sum to 1.00).
// Infrastructure variable costs — cloud provider pricing, request counts, storage.
// Used by infraCost() to compute per-session and per-user variable costs.
// ── Load intensity scale ─────────────────────────────────────────────────────
export var LOAD_INTENSITIES = [
  { id: "conservative", multiplier: 0.6 },
  { id: "moderate",     multiplier: 0.8 },
  { id: "baseline",     multiplier: 1.0 },
  { id: "aggressive",   multiplier: 1.5 },
  { id: "stress_test",  multiplier: 2.5 },
];

export var DEFAULT_INFRA = {
  // ── Plan ──
  plan: "paid",
  planBaseCost: 5,
  budgetMax: 0,
  simulatedUsers: 0,      // Override total users (0 = auto from pipeline)
  simulatedClients: 0,    // Override establishments (0 = auto from pipeline)
  loadIntensity: "baseline",

  // ── Usage parameters ──
  consumerUsers: 0,           // total consumer users (decoupled from establishments)
  usersPerClient: 150,       // legacy fallback: consumer users per establishment
  proUsersPerClient: 1,      // 1 compte pro par établissement par défaut
  sessionsPerUserMonth: 4,

  // ── Projection ──
  growthRateMonth: 0.15,
  consumerGrowthRateMonth: 0.10,  // consumer user growth (often faster/slower than establishments)
  dataRetentionMonths: 24,
  dataAgeMonths: 1,           // Months of operation (storage accumulates)

  // ── R2 CDN cache ──
  r2CacheHitRate: 0.85,      // 85% of R2 reads served from Workers Cache API (edge)

  // ── I/O latency (wall time, not billed CPU) ──
  d1LatencyMs: 2,            // ~2ms per D1 query round-trip (same region)
  kvLatencyMs: 15,           // ~15ms avg KV read (global, ~5ms if cached at edge)

  // ── Legacy flat session profile (backward compat, used when profiles is absent) ──
  avgSessionDurationSec: 90,
  peakMultiplier: 3.5,
  activeHoursPerDay: 14,
  activeDaysPerWeek: 7,
  networkOverheadMs: 20,
  workerReqsPerSession: 14,
  cpuMsPerReq: 3,
  sqlReadsPerSession: 16,
  sqlWritesPerSession: 2,
  kvReadsPerSession: 5,
  kvWritesPerSession: 1,
  r2ReadsPerSession: 2,
  r2WritesPerSession: 0.05,
  queueMsgsPerSession: 1.5,
  queueOpsPerMessage: 3,
  doRequestsPerSession: 1,
  doGbSecPerSession: 0.001,
  sqlKBPerUser: 8,
  kvKBPerUser: 12,
  r2MBPerUser: 0.3,
  logEventsPerSession: 8,

  // ── Bi-profile mode ────────────────────────────────────────────────────────
  profiles: {
    // ── App Consommateur (mobile) ─────────────────────────────────────────
    // Parcours : ouverture → feed "pour vous" → scroll galeries photos →
    //   fiche établissement → services → équipier → créneau → paiement
    // + bots/crawlers (~15%), notifications push, rappels
    consumer: {
      workerReqsPerSession: 12,   // feed, recherche, fiche, booking, paiement
      cpuMsPerReq: 2,             // API légères (auth, cache, lectures)
      sqlReadsPerSession: 10,     // profil, feed reco, établissement, créneaux
      avgRowsPerQuery: 5,         // D1 bills per ROW — feed/search queries return ~5 rows avg
      sqlWritesPerSession: 1,     // ~30% des sessions réservent : RDV + planning
      kvReadsPerSession: 4,       // token, préfs, feature flags, cache reco
      kvWritesPerSession: 0.5,    // refresh token occasionnel
      r2ReadsPerSession: 5,       // galeries photos salons, portfolios, avis photos
      r2WritesPerSession: 0.05,   // rare : upload photo profil/avis
      imageTransformsPerSession: 3, // resize/WebP pour galeries (Cloudflare Images)
      queueMsgsPerSession: 1,     // confirmation, rappels, analytics
      doRequestsPerSession: 0.5,  // verrou créneau (~30% sessions × 2 appels)
      doGbSecPerSession: 0.0005,  // verrou léger
      logEventsPerSession: 6,
      sqlKBPerUser: 5,            // profil + historique RDV + préfs
      kvKBPerUser: 8,             // tokens, cache reco, préfs
      r2MBPerUser: 0.4,           // photo profil, photos avis
      avgSessionDurationSec: 75,  // mix consultation rapide + réservation complète
      activeHoursPerDay: 16,      // 7h–23h (utilisateurs consultent le soir)
      activeDaysPerWeek: 7,
      peakMultiplier: 4,          // rush 18h–21h, notifications groupées
      networkOverheadMs: 25,      // réseau mobile 4G/5G
    },
    // ── App Pro (tablette/desktop) ────────────────────────────────────────
    // Parcours : POS caisse, gestion agenda, validation RDV, fiche client,
    //   dashboard analytics, charts CA/fréquentation, gestion équipe
    pro: {
      workerReqsPerSession: 28,   // POS ops, planning, analytics, dashboards
      cpuMsPerReq: 6,             // agrégations analytics, rapports, charts
      sqlReadsPerSession: 35,     // agenda, clients, historique, transactions, stats
      avgRowsPerQuery: 15,        // D1 bills per ROW — analytics/dashboard queries return ~15 rows avg
      sqlWritesPerSession: 8,     // encaissements, mise à jour planning, notes client
      kvReadsPerSession: 8,       // config salon, feature flags, cache dashboard
      kvWritesPerSession: 3,      // mise à jour cache, préfs opérateur
      r2ReadsPerSession: 0.5,     // peu d'images côté pro (logo, export)
      r2WritesPerSession: 0.1,    // upload photos réalisations, export PDF
      imageTransformsPerSession: 0.1, // rare côté pro (logo, export)
      queueMsgsPerSession: 3,     // notifications client, sync agenda, webhooks
      doRequestsPerSession: 4,    // planning temps réel, verrous, WebSocket-like
      doGbSecPerSession: 0.005,   // objets persistants pour agenda live
      logEventsPerSession: 14,    // audit trail POS, sécurité, monitoring
      sqlKBPerUser: 25,           // historique transactions, fiches clients, analytics
      kvKBPerUser: 20,            // cache dashboard, rapports, config
      r2MBPerUser: 0.1,           // exports, logos, peu de médias
      avgSessionDurationSec: 300, // sessions longues (journée de travail)
      activeHoursPerDay: 10,      // 8h–18h heures d'ouverture
      activeDaysPerWeek: 6,       // 6j/7 (fermé dimanche)
      peakMultiplier: 2.5,        // rush midi et fin de journée
      networkOverheadMs: 12,      // WiFi / réseau local
    },
  },

  // ── Worker resource limits ──
  workerMemoryMB: 128,
  maxCpuMsPerReq: 30000,

  // ── Auth & Logging ──
  authCostPerLogin: 0.00,

  // ── Cloudflare pricing (paid plan, $ per unit) ──
  // Workers: $0.30/M requests, $0.02/M CPU-ms
  workerReqPrice: 0.0000003,
  cpuMsPrice: 0.00000002,
  // D1: $0.001/M rows read, $1.00/M rows written, $0.75/GB-month
  sqlReadPrice: 0.000000001,
  sqlWritePrice: 0.000001,
  sqlStoragePrice: 0.75,
  // KV: $0.50/M reads, $5.00/M writes, $0.50/GB-month
  kvReadPrice: 0.0000005,
  kvWritePrice: 0.000005,
  kvStoragePrice: 0.50,
  // R2: $0.36/M Class B (read), $4.50/M Class A (write), $0.015/GB-month
  r2ReadPrice: 0.00000036,
  r2WritePrice: 0.0000045,
  r2StoragePrice: 0.015,
  // Queues: $0.40/M operations (write+read+delete = 3 ops per msg)
  queueOpPrice: 0.0000004,
  // Workers Logs: $0.60/M events
  logEventPrice: 0.0000006,
  // Durable Objects: $0.15/M requests, $12.50/M GB-sec
  doReqPrice: 0.00000015,
  doGbSecPrice: 0.0000125,
  // Cloudflare Images: $1.00/1000 unique transformations
  imageTransformPrice: 0.001,

  // ── Paid plan quotas (monthly) ──
  quotaWorkerReqs: 10000000,
  quotaCpuMs: 30000000,
  quotaSqlReads: 25000000000,
  quotaSqlWrites: 50000000,
  quotaKvReads: 10000000,
  quotaKvWrites: 1000000,
  quotaR2Reads: 10000000,
  quotaR2Writes: 1000000,
  quotaQueueOps: 1000000,
  quotaSqlStorageGB: 5,
  quotaKvStorageGB: 1,
  quotaR2StorageGB: 10,
  quotaLogEvents: 20000000,
  quotaDoReqs: 1000000,
  quotaDoGbSec: 400000,
};

// Plan presets — quotas + base cost per Cloudflare plan tier
export var PLAN_PRESETS = {
  free: {
    planBaseCost: 0,
    quotaWorkerReqs: 100000 * 30,    // 100K/day ≈ 3M/month
    quotaCpuMs: 10 * 100000 * 30,    // 10ms/req × daily reqs
    quotaSqlReads: 5000000 * 30,     // 5M/day
    quotaSqlWrites: 100000 * 30,     // 100K/day
    quotaKvReads: 100000 * 30,       // 100K/day
    quotaKvWrites: 1000 * 30,        // 1K/day
    quotaR2Reads: 10000000,
    quotaR2Writes: 1000000,
    quotaQueueOps: 0,                // not available on free
    quotaSqlStorageGB: 5,
    quotaKvStorageGB: 1,
    quotaR2StorageGB: 10,
    quotaLogEvents: 0,               // not available on free
    quotaDoReqs: 0,
    quotaDoGbSec: 0,
  },
  paid: {
    planBaseCost: 5,
    quotaWorkerReqs: 10000000,
    quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000,
    quotaSqlWrites: 50000000,
    quotaKvReads: 10000000,
    quotaKvWrites: 1000000,
    quotaR2Reads: 10000000,
    quotaR2Writes: 1000000,
    quotaQueueOps: 1000000,
    quotaSqlStorageGB: 5,
    quotaKvStorageGB: 1,
    quotaR2StorageGB: 10,
    quotaLogEvents: 20000000,
    quotaDoReqs: 1000000,
    quotaDoGbSec: 400000,
  },
  enterprise: {
    planBaseCost: 0,                 // custom pricing
    quotaWorkerReqs: 100000000,
    quotaCpuMs: 300000000,
    quotaSqlReads: 250000000000,
    quotaSqlWrites: 500000000,
    quotaKvReads: 100000000,
    quotaKvWrites: 10000000,
    quotaR2Reads: 100000000,
    quotaR2Writes: 10000000,
    quotaQueueOps: 10000000,
    quotaSqlStorageGB: 50,
    quotaKvStorageGB: 10,
    quotaR2StorageGB: 100,
    quotaLogEvents: 200000000,
    quotaDoReqs: 10000000,
    quotaDoGbSec: 4000000,
  },
};

export var MIX_PROFILES = {
  urban: {
    card_tpe: 0.20, bancontact_tpe: 0.10, card_intl_tpe: 0.05,
    card_online: 0.25, card_premium_online: 0.04, card_intl_online: 0.03,
    bancontact_online: 0.13, sepa_debit: 0.05, sepa_transfer: 0.05,
    cash: 0.10,
  },
  mixed: {
    card_tpe: 0.25, bancontact_tpe: 0.12, card_intl_tpe: 0.03,
    card_online: 0.13, card_premium_online: 0.02, card_intl_online: 0.02,
    bancontact_online: 0.08, sepa_debit: 0.03, sepa_transfer: 0.02,
    cash: 0.30,
  },
  traditional: {
    card_tpe: 0.22, bancontact_tpe: 0.12, card_intl_tpe: 0.02,
    card_online: 0.05, card_premium_online: 0.01, card_intl_online: 0.01,
    bancontact_online: 0.03, sepa_debit: 0.02, sepa_transfer: 0.02,
    cash: 0.50,
  },
};

// ── Marketing Digital ────────────────────────────────────────────────────────
// null = module disabled. Object = enabled with channel configs.
export var DEFAULT_MARKETING = {
  // ── Meta Ads (Facebook / Instagram) ──
  meta: {
    enabled: true,
    budget: 500,           // EUR/mois
    cpm: 8,                // coût pour 1000 impressions
    ctr: 0.012,            // taux de clic (1.2%)
    convRate: 0.03,        // visiteur → trial
    trialToClient: 0.25,   // trial → client signé
  },
  // ── Google Ads (Search + Display) ──
  google: {
    enabled: true,
    budget: 300,           // EUR/mois
    cpcAvg: 1.50,          // coût par clic moyen
    convRate: 0.04,        // clic → lead
    leadToClient: 0.20,    // lead → client signé
  },
  // ── Influenceurs ──
  influencers: {
    enabled: false,
    count: 2,
    costPerInfluencer: 500, // EUR/mois
    reachPerInfluencer: 10000,
    engagementRate: 0.03,
    convRate: 0.005,        // engagé → acquisition
  },
  // ── SEO / Content ──
  seo: {
    enabled: false,
    toolsCost: 100,          // Semrush/Ahrefs mensuel
    contentCost: 300,        // rédaction mensuelle
    estimatedTraffic: 2000,  // visiteurs organiques/mois
    convRate: 0.02,          // visiteur → lead
    leadToClient: 0.15,      // lead → client signé
  },
  // ── Email / CRM ──
  email: {
    enabled: false,
    toolCost: 30,            // Mailchimp/Brevo mensuel
    listSize: 500,
    openRate: 0.22,
    clickRate: 0.03,
    convRate: 0.01,          // clic → acquisition
    campaignsPerMonth: 4,
  },
  // ── Niches cibles ──
  niches: [
    { id: 1, name: "Coiffure", budgetPct: 0.35 },
    { id: 2, name: "Esthétique", budgetPct: 0.30 },
    { id: 3, name: "Barbier", budgetPct: 0.20 },
    { id: 4, name: "Spa / Bien-être", budgetPct: 0.15 },
  ],
  // 0 = auto depuis pipeline (arrV / totS / 12)
  avgRevenuePerClient: 0,
  // CPC Simulator — null = disabled
  cpcSim: null,
};

export var CPC_SIM_DEF = {
  // B2B — Acquisition d'établissements (salons, spas, instituts)
  b2b: {
    budget: 3000,
    cpc: 2.50,
    cvr: 0.04,
    qualRate: 0.25,
    closeRate: 0.10,
    clientValue: 1200,   // ARR par établissement signé
  },
  // B2C — Acquisition d'utilisateurs finaux (app consommateur)
  b2c: {
    budget: 2000,
    cpc: 0.80,
    cvr: 0.06,
    qualRate: 0.40,      // téléchargement → utilisateur actif
    closeRate: 0.30,     // actif → utilisateur récurrent
    clientValue: 60,     // valeur annuelle (Shine+, usage indirect)
  },
  // Modulateurs partagés
  modAdEfficiency: 1.0,
  modLeadQuality: 1.0,
  modInternalCapacity: 1.0,
  // Exposants d'élasticité partagés
  eCpc: 0.7,
  eCvr: 1.3,
  eQualif: 0.8,
  eCloseQ: 0.6,
  eCloseCap: 0.8,
};
