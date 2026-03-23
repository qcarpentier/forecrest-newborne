import { salCalc } from "./calculations";

/**
 * Compute total monthly patronal contributions (ONSS patronale) from salary list.
 * This is the correct base for socialDue calculation (not total employer cost).
 *
 * Belgian ONSS patronal: ~25.07% on gross salary (brutO).
 * Students: 0% patronal.
 * Independants: no ONSS (invoiced directly).
 *
 * @param {Array} sals - salary items [{net, type, ...}]
 * @param {Object} cfg - {onss, prec, patr}
 * @returns {number} total monthly patronal contribution
 */
export function calcMonthlyPatronal(sals, cfg) {
  var total = 0;
  (sals || []).forEach(function (s) {
    if (!s.net || s.net <= 0) return;
    if (s.type === "independant") return; // no employer contributions
    var eO = s.type === "student" ? 0.0271 : (cfg.onss || 0.1307);
    var eP = s.type === "student" ? 0 : (cfg.patr || 0.2507);
    var sc = salCalc(s.net, eO, cfg.prec || 0.1723, eP);
    total += sc.patrV;
  });
  return total;
}

/**
 * Compute quarterly ONSS social due (dettes sociales à payer).
 * Belgian quarterly declaration: total annual patronal / 4.
 *
 * @param {number} monthlyPatronal - from calcMonthlyPatronal()
 * @returns {number} quarterly social due
 */
export function calcSocialDue(monthlyPatronal) {
  return monthlyPatronal * 12 / 4;
}

/**
 * Classify remaining debt balance as LT (>12 months) or CT (≤12 months).
 *
 * @param {Array} debts - [{amount, rate, duration, elapsed, label}]
 * @returns {{debtLT: number, debtCT: number}}
 */
export function classifyDebts(debts) {
  var debtLT = 0;
  var debtCT = 0;
  (debts || []).forEach(function (d) {
    if (!d.amount || d.amount <= 0) return;
    var rem = d.duration - (d.elapsed || 0);
    if (rem <= 0) return;
    var r = (d.rate || 0) / 12;
    var bal = d.amount;
    if (r > 0 && d.duration > 0) {
      var pow = Math.pow(1 + r, d.duration);
      var powE = Math.pow(1 + r, d.elapsed || 0);
      bal = d.amount * (pow - powE) / (pow - 1);
    } else if (d.duration > 0) {
      bal = d.amount - (d.amount / d.duration) * (d.elapsed || 0);
    }
    if (bal <= 0) return;
    if (rem > 12) { debtLT += bal; } else { debtCT += bal; }
  });
  return { debtLT: debtLT, debtCT: debtCT };
}

/**
 * Compute annual interest expense from debts.
 *
 * @param {Array} debts
 * @returns {number} annual interest
 */
export function calcAnnualInterest(debts) {
  var total = 0;
  (debts || []).forEach(function (d) {
    if (!d.rate || d.rate <= 0 || !d.amount || d.amount <= 0) return;
    if (d.duration <= (d.elapsed || 0)) return;
    var r = d.rate / 12;
    if (r > 0) {
      var pow = Math.pow(1 + r, d.duration);
      var powE = Math.pow(1 + r, d.elapsed || 0);
      var bal = d.amount * (pow - powE) / (pow - 1);
      total += bal * d.rate;
    }
  });
  return total;
}
