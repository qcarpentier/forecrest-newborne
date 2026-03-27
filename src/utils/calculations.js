// ── Cost item → monthly value (frequency-aware) ─────────────────────────────
// Converts any cost item to its correct monthly equivalent based on freq.

export function costItemMonthly(item) {
  var base = item.pu ? (item.a || 0) * (item.u || 1) : (item.a || 0);
  if (item.freq === "quarterly") return base / 3;
  if (item.freq === "annual") return base / 12;
  if (item.freq === "once") return 0;
  return base;
}

// ── Belgian ISOC (corporate tax) ─────────────────────────────────────────────
// PME reduced rate: 20% on first 100K, 25% on excess.
// Reserve legale: 5% of net profit, capped at 10% of capital social.

export function calcIsoc(taxBase, capitalSocial) {
  var isocR = taxBase > 0 ? Math.min(taxBase, 100000) * 0.20 : 0;
  var isocS = taxBase > 100000 ? (taxBase - 100000) * 0.25 : 0;
  var isoc = isocR + isocS;
  var isocEff = taxBase > 0 ? isoc / taxBase : 0;
  var netP = taxBase - isoc;
  var resLeg = netP > 0 ? Math.min(netP * 0.05, capitalSocial * 0.10) : 0;
  return { isocR: isocR, isocS: isocS, isoc: isoc, isocEff: isocEff, netP: netP, resLeg: resLeg };
}

// ── Belgian salary reverse calculation ───────────────────────────────────────
// brutO = net / (1 - onss - prec)        gross salary from net
// onssV = brutO * onss                   employee ONSS (13.07%)
// precV = brutO * prec                   withholding tax (17.23%)
// patrV = brutO * patr                   employer ONSS (25.07%)
// brutE = brutO + patrV                  total employer cost

export function salCalc(net, onss, prec, patr) {
  if (!net || net <= 0) {
    return { net: 0, brutO: 0, brutE: 0, onssV: 0, precV: 0, patrV: 0, total: 0 };
  }
  var brutO = net / (1 - onss - prec);
  var onssV = brutO * onss;
  var precV = brutO * prec;
  var patrV = brutO * patr;
  var brutE = brutO + patrV;
  return { net: net, brutO: brutO, brutE: brutE, onssV: onssV, precV: precV, patrV: patrV, total: brutE };
}

// ── Multi-year projection engine ─────────────────────────────────────────────
// Projects revenue and costs month-by-month with compound growth rates.

export function projectFinancials(params) {
  var monthlyRevenue = params.monthlyRevenue || 0;
  var monthlyCosts = params.monthlyCosts || 0;
  var initialCash = params.initialCash || 0;
  var revenueGrowth = params.revenueGrowthRate || 0;
  var costEscalation = params.costEscalation || 0;
  var months = params.months || 36;
  var revenueByMonth = params.revenueByMonth || null;
  var costsByMonth = params.costsByMonth || null;

  var revGrowthMonthly = Math.pow(1 + revenueGrowth, 1 / 12) - 1;
  var costGrowthMonthly = Math.pow(1 + costEscalation, 1 / 12) - 1;

  var rows = [];
  var cum = initialCash;
  var rev = monthlyRevenue;
  var cost = monthlyCosts;

  for (var m = 1; m <= months; m++) {
    // If revenueByMonth array is provided, use it instead of compound growth
    if (revenueByMonth && revenueByMonth[m - 1] != null) {
      rev = revenueByMonth[m - 1];
    }
    // If costsByMonth array is provided, use it instead of uniform escalation
    if (costsByMonth && costsByMonth[m - 1] != null) {
      cost = costsByMonth[m - 1];
    }
    var net = rev - cost;
    cum += net;
    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      monthlyRevenue: rev,
      monthlyCosts: cost,
      net: net,
      cumulative: cum,
    });
    if (!revenueByMonth) {
      rev = rev * (1 + revGrowthMonthly);
    }
    if (!costsByMonth) {
      cost = cost * (1 + costGrowthMonthly);
    }
  }

  var years = [];
  var yCount = Math.ceil(months / 12);
  for (var y = 1; y <= yCount; y++) {
    var yRows = rows.filter(function (r) { return r.year === y; });
    var totalRev = 0, totalCost = 0;
    yRows.forEach(function (r) { totalRev += r.monthlyRevenue; totalCost += r.monthlyCosts; });
    years.push({
      year: y,
      revenue: totalRev,
      costs: totalCost,
      ebit: totalRev - totalCost,
      endCash: yRows.length > 0 ? yRows[yRows.length - 1].cumulative : cum,
    });
  }

  var beMonth = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].net >= 0 && monthlyRevenue < monthlyCosts) {
      beMonth = rows[i].month;
      break;
    }
  }

  var zeroMonth = null;
  if (initialCash > 0) {
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].cumulative <= 0) {
        zeroMonth = rows[j].month;
        break;
      }
    }
  }

  return {
    rows: rows,
    years: years,
    beMonth: beMonth,
    zeroMonth: zeroMonth,
    finalCash: rows.length > 0 ? rows[rows.length - 1].cumulative : initialCash,
  };
}

// ── Belgian independant / freelancer calculation ─────────────────────────────
// Social contributions ~20.5% of net professional income (quarterly provisional)
// IPP (personal income tax) via progressive brackets (2026 rates)

export function indepCalc(netAnnual) {
  if (!netAnnual || netAnnual <= 0) {
    return { netAnnual: 0, socialContrib: 0, taxEstimate: 0, netAfterTax: 0, netMonthly: 0, totalCost: 0 };
  }
  var socialPct = 0.205;
  var socialContrib = netAnnual * socialPct;

  var taxable = Math.max(netAnnual - socialContrib, 0);

  var tax = 0;
  var brackets = [
    { limit: 15820, rate: 0.25 },
    { limit: 27920, rate: 0.40 },
    { limit: 48320, rate: 0.45 },
    { limit: Infinity, rate: 0.50 },
  ];
  var prev = 0;
  brackets.forEach(function (b) {
    if (taxable > prev) {
      var slice = Math.min(taxable, b.limit) - prev;
      if (slice > 0) tax += slice * b.rate;
    }
    prev = b.limit;
  });

  var taxFree = Math.min(taxable, 10160);
  tax = Math.max(tax - taxFree * 0.25, 0);
  tax = tax * 1.07; // municipal surcharge ~7%

  var netAfterTax = netAnnual - socialContrib - tax;
  return {
    netAnnual: netAnnual,
    socialContrib: socialContrib,
    taxEstimate: tax,
    netAfterTax: netAfterTax,
    netMonthly: netAfterTax / 12,
    totalCost: netAnnual,
  };
}

// ── ESOP / Grant vesting calculation ─────────────────────────────────────────

export function grantCalc(g) {
  var grantMs = new Date(g.grantDate).getTime();
  var elapsed = Math.max(0, (Date.now() - grantMs) / (1000 * 60 * 60 * 24 * 30.44));
  var vm = g.vestingMonths || 1;
  var cm = g.cliffMonths || 0;
  var totalCost = g.fairValue * g.shares;
  var monthlyExpense = totalCost / vm;
  var isComplete = elapsed >= vm;
  var inCliff = elapsed < cm;
  var vestedShares = isComplete ? g.shares : inCliff ? 0 : Math.floor(g.shares * elapsed / vm);
  var recognizedCost = Math.min(elapsed, vm) / vm * totalCost;
  return {
    elapsed: Math.round(elapsed),
    vestedShares: vestedShares,
    unvestedShares: g.shares - vestedShares,
    vestedPct: g.shares > 0 ? vestedShares / g.shares : 0,
    monthlyExpense: isComplete ? 0 : monthlyExpense,
    totalCost: totalCost,
    recognizedCost: recognizedCost,
    status: isComplete ? "complete" : inCliff ? "cliff" : "vesting",
  };
}

// ── Health score (0-100) ─────────────────────────────────────────────────────

export function calcHealthScore(params) {
  var totalRevenue = params.totalRevenue || 0;
  var monthlyCosts = params.monthlyCosts || 0;
  var ebitda = params.ebit || params.ebitda || 0;
  var cfg = params.cfg || {};

  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function lerp(val, lo, hi, outLo, outHi) {
    if (val <= lo) return outLo;
    if (val >= hi) return outHi;
    return outLo + (val - lo) / (hi - lo) * (outHi - outLo);
  }

  var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
  var profitability;
  if (ebitdaMargin < -0.20) profitability = 0;
  else if (ebitdaMargin < 0) profitability = 25 + (ebitdaMargin + 0.20) / 0.20 * 25;
  else if (ebitdaMargin < 0.10) profitability = 50 + ebitdaMargin / 0.10 * 25;
  else profitability = 75 + Math.min((ebitdaMargin - 0.10) / 0.10 * 25, 25);

  var cash = cfg.initialCash || 0;
  var monthlyRevenue = totalRevenue / 12;
  var burn = monthlyCosts - monthlyRevenue;
  var runway = burn > 0 && cash > 0 ? cash / burn : (monthlyRevenue >= monthlyCosts ? 24 : 0);
  var liquidity = lerp(runway, 0, 12, 0, 100);

  var annC = monthlyCosts * 12;
  var coverage = annC > 0 ? totalRevenue / annC : 0;
  var solvency = lerp(coverage, 0, 1.5, 0, 100);

  var total = Math.round((clamp(profitability) + clamp(liquidity) + clamp(solvency)) / 3);

  return {
    total: total,
    profitability: clamp(profitability),
    liquidity: clamp(liquidity),
    solvency: clamp(solvency),
  };
}
