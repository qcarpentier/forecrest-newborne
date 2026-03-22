/**
 * stockCalc.js — Stock / inventory calculation utilities (PCMN classe 3)
 *
 * Belgian PCMN accounts:
 * - 30: Approvisionnements (raw materials)
 * - 31: Fournitures (supplies)
 * - 33: Produits en cours (work in progress)
 * - 34: Produits finis (finished goods)
 * - 37: Marchandises (merchandise for resale)
 *
 * Valuation methods: FIFO, weighted average (LIFO not allowed in Belgium)
 */

/**
 * Calculate total stock value (initial inventory).
 * @param {Array} stocks — [{ unitCost, quantity }]
 * @returns {number}
 */
export function calcStockValue(stocks) {
  var total = 0;
  (stocks || []).forEach(function (s) {
    var val = (Number(s.unitCost) || 0) * (Number(s.quantity) || 0);
    if (val > 0) total += val;
  });
  return total;
}

/**
 * Calculate monthly consumption (cost of goods sold proxy).
 * @param {Array} stocks — [{ unitCost, monthlySales }]
 * @returns {number}
 */
export function calcMonthlyCogs(stocks) {
  var total = 0;
  (stocks || []).forEach(function (s) {
    var cogs = (Number(s.unitCost) || 0) * (Number(s.monthlySales) || 0);
    if (cogs > 0) total += cogs;
  });
  return total;
}

/**
 * Calculate stock rotation (turnover) in days.
 * rotation = (stock value / annual COGS) × 365
 * @param {number} stockValue — total stock value
 * @param {number} annualCogs — annual cost of goods sold
 * @returns {number|null} days, or null if no COGS
 */
export function calcStockRotation(stockValue, annualCogs) {
  if (!annualCogs || annualCogs <= 0) return null;
  return Math.round((stockValue / annualCogs) * 365);
}

/**
 * Calculate stock variation (for P&L class 71).
 * variation = closing stock - opening stock
 * Positive = production increase (product), Negative = stock consumed
 * @param {number} openingStock — stock at start of period
 * @param {number} closingStock — stock at end of period
 * @returns {number}
 */
export function calcStockVariation(openingStock, closingStock) {
  return (Number(closingStock) || 0) - (Number(openingStock) || 0);
}

/**
 * Calculate coverage in months (how long stock lasts at current sales rate).
 * @param {number} stockValue — total stock value
 * @param {number} monthlyCogs — monthly cost of goods sold
 * @returns {number|null} months, or null if no sales
 */
export function calcStockCoverage(stockValue, monthlyCogs) {
  if (!monthlyCogs || monthlyCogs <= 0) return null;
  return Math.round((stockValue / monthlyCogs) * 10) / 10;
}
