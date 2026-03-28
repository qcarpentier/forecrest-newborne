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

/**
 * Forecast stock level over N months.
 * When stock drops below minStock, an automatic reorder of reorderQty is triggered.
 * @param {Object} item — { quantity, monthlySales, minStock, reorderQty }
 * @param {number} months — forecast horizon (default 6)
 * @returns {Array} [{ month, stock, belowMin, reordered }]
 */
export function forecastStock(item, months) {
  var projections = [];
  var current = Number(item.quantity) || 0;
  var monthlyUse = Number(item.monthlySales) || 0;
  var minStock = Number(item.minStock) || 0;
  var reorderQty = Number(item.reorderQty) || 0;

  for (var m = 0; m < (months || 6); m++) {
    current = current - monthlyUse;
    var reordered = false;
    if (current < minStock && reorderQty > 0) {
      current += reorderQty;
      reordered = true;
    }
    projections.push({
      month: m + 1,
      stock: Math.max(current, 0),
      belowMin: current < minStock,
      reordered: reordered,
    });
  }
  return projections;
}

/**
 * Calculate autonomy in days for a single stock item.
 * @param {Object} item — { quantity, monthlySales }
 * @returns {number|null} days of stock remaining, or null if no consumption
 */
export function calcItemAutonomy(item) {
  var qty = Number(item.quantity) || 0;
  var monthly = Number(item.monthlySales) || 0;
  if (monthly <= 0) return null;
  return Math.round((qty / monthly) * 30);
}

/**
 * Estimate the next reorder date (days from now) for an item.
 * @param {Object} item — { quantity, monthlySales, minStock }
 * @returns {number|null} days until stock hits minStock, or null
 */
export function calcDaysToReorder(item) {
  var qty = Number(item.quantity) || 0;
  var monthly = Number(item.monthlySales) || 0;
  var minStock = Number(item.minStock) || 0;
  if (monthly <= 0) return null;
  var surplus = qty - minStock;
  if (surplus <= 0) return 0; // already below min
  return Math.round((surplus / monthly) * 30);
}

/**
 * Calculate estimated monthly reorder cost for all stock items.
 * @param {Array} stocks — [{ unitCost, monthlySales }]
 * @returns {number}
 */
export function calcMonthlyReorderCost(stocks) {
  var total = 0;
  (stocks || []).forEach(function (s) {
    total += (Number(s.unitCost) || 0) * (Number(s.monthlySales) || 0);
  });
  return total;
}

/**
 * Count items below their minimum stock threshold.
 * @param {Array} stocks — [{ quantity, minStock }]
 * @returns {number}
 */
export function countAlertItems(stocks) {
  var count = 0;
  (stocks || []).forEach(function (s) {
    var qty = Number(s.quantity) || 0;
    var min = Number(s.minStock) || 0;
    if (min > 0 && qty < min) count++;
  });
  return count;
}
