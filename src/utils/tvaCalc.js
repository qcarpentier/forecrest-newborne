/**
 * tvaCalc.js — Belgian TVA (VAT) calculation engine
 *
 * FISCAL RULES (Belgian law):
 * - Standard rate: 21% (most goods & services)
 * - Intermediate: 12% (social housing, restaurant food)
 * - Reduced:       6% (basic necessities, books, water)
 * - Exempt:        0% (rent, insurance, medical, education, financial services)
 *
 * ARCHITECTURE:
 * - All prices are HT (hors taxe / excl. VAT). TVA is added on top.
 * - Each item can override its rate via item.tva (null = use fallback).
 * - Fallback = category default rate or cfg.vat (global setting).
 * - Items with tvaRate: null in metadata are NOT subject to VAT
 *   (depreciation, financial charges, meal vouchers).
 *
 * SAFETY:
 * - Every function validates inputs before computing.
 * - Invalid rates (negative, > 100%) trigger console.warn and are clamped.
 * - NaN propagation is blocked at every stage.
 * - Functions return 0 (not NaN/undefined) on invalid input.
 */

import { calcStreamAnnual } from "./revenueCalc.js";

/* ── Belgian legal VAT rates ── */
export var TVA_RATES = [0, 0.06, 0.12, 0.21];
export var TVA_MAX = 0.21;
export var TVA_MIN = 0;

/**
 * Validate and sanitize a TVA rate.
 * Returns a safe numeric rate, or 0 if invalid.
 * Logs a warning for out-of-range values.
 *
 * @param {number} rate   — the rate to validate
 * @param {string} context — description for warning messages
 * @returns {number} sanitized rate (0 ≤ rate ≤ 1)
 */
export function validateTvaRate(rate, context) {
  if (rate == null) return 0;
  if (typeof rate !== "number" || isNaN(rate)) {
    console.warn("[TVA] Invalid rate (NaN/non-number) in " + (context || "unknown") + ". Using 0%.");
    return 0;
  }
  if (rate < 0) {
    console.warn("[TVA] Negative rate " + rate + " in " + (context || "unknown") + ". Clamped to 0%.");
    return 0;
  }
  if (rate > 1) {
    console.warn("[TVA] Rate > 100% (" + (rate * 100).toFixed(1) + "%) in " + (context || "unknown") + ". Clamped to 100%.");
    return 1;
  }
  return rate;
}

/**
 * Resolve the effective TVA rate for an item.
 * Priority: item.tva (explicit override) > fallback (category default / cfg.vat).
 *
 * @param {object} item     — { tva?: number|null, name?: string }
 * @param {number} fallback — default rate from category metadata or cfg.vat
 * @returns {number} effective TVA rate (validated, 0 ≤ rate ≤ 1)
 */
export function getItemTva(item, fallback) {
  var context = (item && item.name) || "item";
  if (item && item.tva != null) return validateTvaRate(item.tva, context);
  return validateTvaRate(fallback != null ? fallback : 0.21, context + " (fallback)");
}

/**
 * Annual cost for a single operating cost item.
 * Supports per-unit pricing (item.pu) and frequency multipliers.
 *
 * Frequency map:
 *   monthly   → ×12
 *   quarterly → ×4
 *   annual    → ×1
 *   once      → ×1
 *
 * @param {object} item — { a: number, pu?: boolean, u?: number, freq?: string }
 * @returns {number} annual cost (≥ 0, never NaN)
 */
export function costAnnualForVat(item) {
  if (!item) return 0;
  var a = Number(item.a) || 0;
  if (a < 0) a = 0;
  var total = item.pu ? a * (item.u != null ? (Number(item.u) || 0) : 1) : a;
  var freqMap = { monthly: 12, quarterly: 4, annual: 1, once: 1 };
  var multiplier = freqMap[item.freq] || 12;
  var result = total * multiplier;
  if (isNaN(result)) {
    console.warn("[TVA] NaN in costAnnualForVat for item " + (item.name || "unknown") + ". Returning 0.");
    return 0;
  }
  return result;
}

/**
 * Calculate total collected VAT from revenue streams (TVA collectée).
 * This is the VAT the business charges to clients on sales.
 *
 * Formula per item: annual_revenue_HT × tva_rate
 * Total: Σ across all items in all categories
 *
 * @param {Array} streams       — [{ items: [{ tva?, behavior, price, qty }] }]
 * @param {number} fallbackRate — default rate (cfg.vat || 0.21)
 * @returns {number} total collected VAT (≥ 0, never NaN)
 */
export function calcVatCollected(streams, fallbackRate) {
  var total = 0;
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      var rate = getItemTva(item, fallbackRate);
      if (rate > 0) {
        var annual = calcStreamAnnual(item);
        if (isNaN(annual)) {
          console.warn("[TVA] NaN annual revenue for stream '" + (item.name || "unknown") + "'. Skipping.");
          return;
        }
        var vat = annual * rate;
        if (isNaN(vat)) {
          console.warn("[TVA] NaN VAT for stream '" + (item.name || "unknown") + "'. Skipping.");
          return;
        }
        total += vat;
      }
    });
  });
  return isNaN(total) ? 0 : total;
}

/**
 * Calculate total deductible VAT from cost items (TVA déductible).
 * This is the VAT the business paid on purchases and can reclaim.
 *
 * Formula per item: annual_cost_HT × tva_rate
 * Total: Σ across all items in all categories
 *
 * Items with tva === null or tva === 0 are excluded (exempt, not subject to VAT).
 *
 * @param {Array} costs         — [{ items: [{ tva?, a, pu?, u?, freq? }] }]
 * @param {number} fallbackRate — default rate (cfg.vat || 0.21)
 * @returns {number} total deductible VAT (≥ 0, never NaN)
 */
export function calcVatDeductible(costs, fallbackRate) {
  var total = 0;
  (costs || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      var rate = getItemTva(item, fallbackRate);
      if (rate > 0) {
        var annual = costAnnualForVat(item);
        if (isNaN(annual)) {
          console.warn("[TVA] NaN annual cost for item '" + (item.name || "unknown") + "'. Skipping.");
          return;
        }
        var vat = annual * rate;
        if (isNaN(vat)) {
          console.warn("[TVA] NaN VAT for cost '" + (item.name || "unknown") + "'. Skipping.");
          return;
        }
        total += vat;
      }
    });
  });
  return isNaN(total) ? 0 : total;
}

/**
 * Net VAT balance (solde TVA).
 *
 *   balance = collected − deductible
 *
 *   > 0 → business owes VAT to the state
 *   < 0 → business has a VAT credit (reimbursable)
 *   = 0 → neutral
 *
 * In Belgium, VAT declarations are filed monthly or quarterly
 * depending on cfg.tvaRegime.
 *
 * @param {Array}  streams      — revenue categories
 * @param {Array}  costs        — cost categories
 * @param {number} fallbackRate — global default (cfg.vat)
 * @returns {number} net VAT balance (can be negative)
 */
export function calcVatBalance(streams, costs, fallbackRate) {
  var collected = calcVatCollected(streams, fallbackRate);
  var deductible = calcVatDeductible(costs, fallbackRate);
  var balance = collected - deductible;
  if (isNaN(balance)) {
    console.warn("[TVA] NaN in VAT balance. collected=" + collected + " deductible=" + deductible + ". Returning 0.");
    return 0;
  }
  return balance;
}
