import { PAYMENT_METHODS_BE } from "./defaults.js";

export const DEFAULT_CONFIG = {
  varFee: 0.029,
  fixFee: 0.50,
  feeBearer: "client",  // "client" | "split" | "pro"
  roundingStep: 0.10,
  roundingScale: [
    { upTo: 1.00, step: 0.10 },
    { upTo: 3.00, step: 0.25 },
    { upTo: 999, step: 0.50 },
  ],
  paymentMethods: JSON.parse(JSON.stringify(PAYMENT_METHODS_BE)),
  // Legacy fields kept for backward compat (used if paymentMethods absent)
  sVar: 0.014,
  sFix: 0.10,
  onlineSVar: 0.015,
  onlineSFix: 0.25,
  cVar: 0.0025,
  cFix: 0.10,
  connectMonthly: 2,
  payoutsPerMonth: 4,
  initialCash: 0,
  vat: 0.21,
  capitalSocial: 20000,
  mc: 500,
  tiers: { S: 1000, A: 700, B: 400, C: 200, D: 0 },
  feel: { good: 0.04, acc: 0.05 },
  onss: 0.1307,
  prec: 0.1723,
  patr: 0.2507,
  stripeThresh: 100000,
  churnMonthly: 0.03,
  cacTarget: 0,
  businessType: "saas",  // "saas" | "ecommerce" | "retail" | "services" | "freelancer" | "other"

  // Universal fiscal
  tvaRegime: "quarterly",       // "monthly" | "quarterly" | "exempt"
  fiscalYearStart: "01-01",     // MM-DD
  depreciationMethod: "linear", // "linear" | "declining"
  paymentTermsClient: 30,       // days
  paymentTermsSupplier: 30,     // days
  driEnabled: false,

  // SaaS-specific
  expansionRate: 0.02,
  contractionRate: 0.01,
  revenueGrowthRate: 0.10,
  trialConversionRate: 0.05,

  // E-commerce-specific
  ordersPerMonth: 0,
  monthlyVisitors: 0,
  avgShippingCost: 0,
  returnRate: 0.05,
  fulfillmentCostPerOrder: 0,
  cartAbandonmentRate: 0.70,
  repeatPurchaseRate: 0.25,

  // Retail-specific
  storeSize: 0,
  monthlyFootfall: 0,
  monthlyTransactions: 0,
  shrinkageRate: 0.015,
  avgItemsPerTransaction: 2.5,

  // Services-specific
  avgHourlyRate: 0,
  consultantCount: 0,
  utilizationTarget: 0.75,
  avgProjectMargin: 0.35,
  clientRetentionRate: 0.85,
  revenueConcentrationTop10: 0.40,
  pipelineValue: 0,
  avgProjectDurationWeeks: 4,

  // Freelancer-specific
  dailyRate: 0,
  workingDaysPerYear: 220,
  vacationDays: 20,
  socialContributionRate: 0.2035,
  daysBilled: 0,

  // Class 1 — Equity extras
  capitalPremium: 0,        // PCMN 1100 — share premium (prime d'émission)
  shareholderLoans: 0,      // PCMN 174  — shareholder current accounts (compte courant associé)

  // Class 3 — Stock valuation
  stockValuationMethod: "unit_cost", // "unit_cost" | "fifo" | "weighted_avg"
  stockObsolescence: 0,              // global write-down % on stock value

  // Class 4 — Prepaid / Deferred
  prepaidExpenses: 0,       // PCMN 490 — charges à reporter (annual insurance, licenses)
  deferredRevenue: 0,       // PCMN 493 — produits à reporter (annual SaaS billing, deposits)

  // Projection
  projectionYears: 3,
  costEscalation: 0.02,

  // Alerts
  alertRunwayMonths: 6,
  alertMaxBurn: 0,
  alertMinCoverage: 0.80,
  alertMinMargin: 0,
  companyName: "",
  userName: "",
  legalForm: "",
  tvaNumber: "",
  firstName: "",
  lastName: "",
  userRole: "",
  email: "",
  phone: "",
  address: "",
  animationsEnabled: true,
  showPageIcons: false,   // display page header icons with gradient tint
  accentColor: "coral",  // palette id from ACCENT_PALETTE
  chartPalette: "brand", // "brand" (monochrome gradient) | "multi" (distinct WCAG colors)
  arrTarget: 100000,
  kpiShort: true,
  currency: "EUR",
  exchangeRates: { USD: 1.08, CHF: 0.94 },
  targets: {
    arr: 0,
    mrr: 0,
    clients: 0,
    runway: 0,
    ebitdaMargin: 0,
  },
  devTiming: {
    enterMs: 300,
    initMs: 2500,
    deinitMs: 1800,
    exitMs: 300,
  },
  commissions: {
    internalPct: 0.15,
    durationMonths: 12,
    trainingPrice: 3000,
    tiers: {
      silver:  { pct: 0.05, minClients: 15, sessionsPerYear: 2 },
      gold:    { pct: 0.10, minClients: 90, sessionsPerYear: 3 },
      diamond: { pct: 0.15, minClients: 200, sessionsPerYear: 4 },
    },
  },
};

export const DEFAULT_SALES = {
  chairs: 6,
  emp: 6,
  dw: 5,
  hd: 10,
  dur: 30,
  occ: 0.80,
  basket: 30,
  bkgD: 20,
  closedW: 6,
};

export const STORAGE_KEY = "forecrest";

export const APP_NAME = "Forecrest";

export const VERSION = "0.1.25.0"; // major.minor.feature.fix
export const RELEASE_DATE = "2026-03-25";
