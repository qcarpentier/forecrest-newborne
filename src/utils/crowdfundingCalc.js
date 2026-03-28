/**
 * crowdfundingCalc.js — Crowdfunding campaign calculation utilities
 *
 * Platform commissions (Belgian/European platforms):
 * - Ulule:             8% commission, 0% payment
 * - KissKissBankBank:  8% commission, 0% payment
 * - Kickstarter:       5% commission, 3.5% payment
 * - Indiegogo:         5% commission, 0% payment
 * - GoFundMe:          0% commission, 2.9% payment
 * - Other:             custom rate
 *
 * All calculations use amounts HT (excl. VAT).
 */

/**
 * Calculate total tier costs (production + fulfillment).
 * @param {Array} tiers — [{ unitCost: number, quantity: number }]
 * @returns {number} total cost (≥ 0)
 */
export function calcTiersCost(tiers) {
  var total = 0;
  (tiers || []).forEach(function (ti) {
    var cost = (Number(ti.unitCost) || 0) * (Number(ti.quantity) || 0);
    if (cost > 0) total += cost;
  });
  return total;
}

/**
 * Calculate total platform commission amount.
 * @param {number} goal       — campaign goal amount
 * @param {number} commission — platform commission rate (e.g. 0.08)
 * @param {number} payment    — payment processing rate (e.g. 0.035)
 * @returns {number} commission amount (≥ 0)
 */
export function calcCommissionAmount(goal, commission, payment) {
  var g = Number(goal) || 0;
  var c = Number(commission) || 0;
  var p = Number(payment) || 0;
  if (g < 0 || c < 0 || p < 0) return 0;
  return g * (c + p);
}

/**
 * Calculate total commission percentage (commission + payment).
 * @param {number} commission — platform commission rate
 * @param {number} payment    — payment processing rate
 * @returns {number} total percentage (0–1)
 */
export function calcCommissionPct(commission, payment) {
  return (Number(commission) || 0) + (Number(payment) || 0);
}

/**
 * Calculate net margin after commission and tier costs.
 * @param {number} goal       — campaign goal
 * @param {number} commission — platform commission rate
 * @param {number} payment    — payment processing rate
 * @param {Array}  tiers      — tier data
 * @returns {number} net margin (can be negative if costs exceed goal)
 */
export function calcNetMargin(goal, commission, payment, tiers) {
  var g = Number(goal) || 0;
  var commAmount = calcCommissionAmount(g, commission, payment);
  var tiersCost = calcTiersCost(tiers);
  return g - commAmount - tiersCost;
}

/**
 * Calculate campaign progress percentage.
 * @param {number} raised — amount actually raised
 * @param {number} goal   — campaign goal
 * @returns {number} progress (0–1+, can exceed 1 if over-funded)
 */
export function calcProgress(raised, goal) {
  var g = Number(goal) || 0;
  var r = Number(raised) || 0;
  if (g <= 0) return 0;
  return r / g;
}

/**
 * Calculate total raised from per-tier backers + free donations.
 * Each tier: backers × price (what the backer pays, not the production cost).
 * @param {Array}  tiers     — [{ price: number, backers: number }]
 * @param {number} donations — free donations without tier (montant libre)
 * @returns {number} total raised (≥ 0)
 */
export function calcActualRaised(tiers, donations) {
  var total = Number(donations) || 0;
  if (total < 0) total = 0;
  (tiers || []).forEach(function (ti) {
    var raised = (Number(ti.backers) || 0) * (Number(ti.price) || 0);
    if (raised > 0) total += raised;
  });
  return total;
}

/**
 * Calculate actual production cost based on real backers (not projected quantity).
 * @param {Array} tiers — [{ unitCost: number, backers: number }]
 * @returns {number} actual cost (≥ 0)
 */
export function calcActualTiersCost(tiers) {
  var total = 0;
  (tiers || []).forEach(function (ti) {
    var cost = (Number(ti.unitCost) || 0) * (Number(ti.backers) || 0);
    if (cost > 0) total += cost;
  });
  return total;
}
