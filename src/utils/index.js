export { eur, eurShort, pct, nm, makeId, setCurrencyDisplay } from "./formatters";
export { costItemMonthly, resolveTier, salCalc, calcIsoc, grantCalc, indepCalc, calcHealthScore, projectFinancials } from "./calculations";
export { load, save } from "./storage";
export { calcBusinessKpis } from "./kpis";
export { calcStreamMonthly, calcStreamAnnual, calcStreamAnnualYear, calcStreamMonthlyYear, calcStreamPcmn, calcTotalRevenue, calcTotalMRR, calcStreamMonthlyBreakdown, calcTotalMonthlyBreakdown, getDriverLabel, getPriceLabel, migrateStreamsV1ToV2, calcAffiliationMonthly, calcMonthlyGMV, calcMonthlyTransactions, calcAvgActiveClients, REVENUE_BEHAVIORS } from "./revenueCalc";
export { projectMarketplace } from "./marketplaceProjection";
export { TVA_RATES, TVA_MAX, TVA_MIN, validateTvaRate, costAnnualForVat, getItemTva, calcVatCollected, calcVatDeductible, calcVatBalance } from "./tvaCalc";
export { calcTiersCost, calcCommissionAmount, calcCommissionPct, calcNetMargin, calcProgress, calcActualRaised, calcActualTiersCost } from "./crowdfundingCalc";
export { calcStockValue, calcMonthlyCogs, calcStockRotation, calcStockVariation, calcStockCoverage, forecastStock, calcItemAutonomy, calcDaysToReorder, calcMonthlyReorderCost, countAlertItems } from "./stockCalc";
export { calcMonthlyPatronal, calcSocialDue, classifyDebts, calcAnnualInterest } from "./balanceSheetCalc";
export { cx, sortCx } from "./cx";
export {
  buildViewerSnapshot, encodeViewerSnapshot, decodeViewerSnapshot, getViewerPayloadFromUrl,
  VIEWER_FORMAT_VERSION, VIEWER_URL_SOFT_LIMIT, VIEWER_URL_HARD_LIMIT,
} from "./viewerSnapshot";
