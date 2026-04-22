/**
 * Marketplace projection engine — month-by-month simulation.
 *
 * Models a commission-based marketplace (e.g. parking BtoC) with:
 *   - monthly new client acquisition (per-year plan spread uniformly across 12 months)
 *   - monthly churn on the active pool
 *   - transactions = active clients × visits/month
 *   - GMV = transactions × avg ticket TTC
 *   - commission HT = GMV × commission rate (on GMV TTC)
 *   - VAT due on commission HT
 *   - Stripe-style variable fees (% of GMV + fixed per transaction)
 *   - tiered infrastructure cost (step function on active client count)
 *   - hardware deployed pro-rata (1 unit per N clients) — cash expense when new units purchased
 *   - flat amortisation (établissement + matériel informatique)
 *   - flat monthly marketing budget
 *
 * Returns rows (per month) and aggregated years.
 */

function resolveTier(tiers, n) {
  if (!tiers || !tiers.length) return 0;
  var clients = Math.max(0, Number(n) || 0);
  for (var i = 0; i < tiers.length; i++) {
    var upTo = tiers[i].upTo;
    if (upTo == null || clients <= upTo) return tiers[i].annualCost || 0;
  }
  return tiers[tiers.length - 1].annualCost || 0;
}

export function projectMarketplace(params) {
  if (!params.acquisitionPlan) return { rows: [], years: [], total: {} };
  var yearsCount = params.acquisitionPlan.length;
  var months = yearsCount * 12;
  var churn = params.churnMonthly || 0;
  var visits = params.visitsPerMonth || 0;
  var priceTTC = params.priceTTC || 0;
  var commissionPct = params.commissionPct || 0;
  var vatRate = params.vatRate || 0;
  var stripePct = params.stripePct || 0;
  var stripeFixed = params.stripeFixed || 0;
  var marketingMonthly = params.marketingMonthly || 0;
  var tiers = params.infraTiers || [];
  var hardwareUnitCost = params.hardwareUnitCost || 0;
  var clientsPerUnit = Math.max(1, params.hardwareClientsPerUnit || 1);
  var amortAnnual = params.amortAnnual || 0;

  // Build monthly new-client series: spread each year's plan uniformly over 12 months.
  var monthlyNew = [];
  for (var y = 0; y < yearsCount; y++) {
    var yearTotal = params.acquisitionPlan[y] || 0;
    var perMonth = yearTotal / 12;
    for (var mm = 0; mm < 12; mm++) monthlyNew.push(perMonth);
  }

  var activeClients = 0;
  var modulesDeployed = 0;
  var rows = [];

  for (var m = 0; m < months; m++) {
    // apply churn to previous month's active pool, then add new clients
    activeClients = activeClients * (1 - churn) + monthlyNew[m];

    // hardware deployment: keep at least ceil(active / clientsPerUnit) modules
    var needed = Math.ceil(activeClients / clientsPerUnit);
    var newModules = Math.max(0, needed - modulesDeployed);
    modulesDeployed = needed;

    var tx = activeClients * visits;
    var gmvTTC = tx * priceTTC;
    var commissionHT = gmvTTC * commissionPct;
    var tvaDue = commissionHT * vatRate;
    var fraisTx = gmvTTC * stripePct + tx * stripeFixed;
    var infraMonth = resolveTier(tiers, activeClients) / 12;
    var hwCash = newModules * hardwareUnitCost;
    var marketing = marketingMonthly;
    var amortMonth = amortAnnual / 12;
    var opexMonth = fraisTx + infraMonth + hwCash + marketing;
    var totalCosts = opexMonth + amortMonth;
    var ebitda = commissionHT - opexMonth;
    var ebit = ebitda - amortMonth;

    rows.push({
      month: m + 1,
      year: Math.floor(m / 12) + 1,
      newClients: monthlyNew[m],
      activeClients: activeClients,
      modulesDeployed: modulesDeployed,
      newModules: newModules,
      transactions: tx,
      gmvTTC: gmvTTC,
      commissionHT: commissionHT,
      tvaDue: tvaDue,
      fraisTx: fraisTx,
      maintSaas: infraMonth,
      hwCash: hwCash,
      amortHw: amortMonth,
      marketing: marketing,
      opex: opexMonth,
      totalCosts: totalCosts,
      ebitda: ebitda,
      ebit: ebit,
    });
  }

  // Aggregate per year
  var years = [];
  for (var yr = 1; yr <= yearsCount; yr++) {
    var yRows = rows.filter(function (r) { return r.year === yr; });
    var agg = {
      year: yr,
      newClients: 0,
      activeClientsEnd: 0,
      transactions: 0,
      gmvTTC: 0,
      commissionHT: 0,
      tvaDue: 0,
      fraisTx: 0,
      maintSaas: 0,
      hwCash: 0,
      amortHw: 0,
      marketing: 0,
      opex: 0,
      totalCosts: 0,
      ebitda: 0,
      ebit: 0,
    };
    yRows.forEach(function (r) {
      agg.newClients += r.newClients;
      agg.transactions += r.transactions;
      agg.gmvTTC += r.gmvTTC;
      agg.commissionHT += r.commissionHT;
      agg.tvaDue += r.tvaDue;
      agg.fraisTx += r.fraisTx;
      agg.maintSaas += r.maintSaas;
      agg.hwCash += r.hwCash;
      agg.amortHw += r.amortHw;
      agg.marketing += r.marketing;
      agg.opex += r.opex;
      agg.totalCosts += r.totalCosts;
      agg.ebitda += r.ebitda;
      agg.ebit += r.ebit;
    });
    agg.activeClientsEnd = yRows.length ? yRows[yRows.length - 1].activeClients : 0;
    years.push(agg);
  }

  var total = {
    newClients: 0, transactions: 0, gmvTTC: 0, commissionHT: 0,
    tvaDue: 0, fraisTx: 0, maintSaas: 0, hwCash: 0, amortHw: 0,
    marketing: 0, opex: 0, totalCosts: 0, ebitda: 0, ebit: 0,
  };
  years.forEach(function (y2) {
    Object.keys(total).forEach(function (k) { total[k] += y2[k]; });
  });

  return { rows: rows, years: years, total: total };
}
