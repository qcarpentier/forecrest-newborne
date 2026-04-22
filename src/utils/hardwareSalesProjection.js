/**
 * Hardware sales projection engine — annual simulation for one-shot hardware sales.
 *
 * Use case: selling physical units (EV charging stations, devices, kits...) with:
 *   - an annual sales plan (units per year)
 *   - selling price per unit (optionally escalated year-over-year)
 *   - variable cost either as pct of selling price or fixed per unit
 *   - installation cost either as pct of revenue or fixed per unit
 *   - flat monthly marketing + commercial budgets
 *
 * Returns years with unit count, revenue HT, costs, and EBITDA.
 */

export function projectHardwareSales(params) {
  var plan = params.salesPlan || [];
  var pricePerUnit = params.pricePerUnit || 0;
  var priceGrowthRate = params.priceGrowthRate || 0;
  var costPerUnit = params.costPerUnit != null ? params.costPerUnit : null;
  var costPct = params.costPct || 0; // fraction of selling price
  var installPerUnit = params.installPerUnit != null ? params.installPerUnit : null;
  var installPct = params.installPct || 0;
  var marketingMonthly = params.marketingMonthly || 0;
  var commercialMonthly = params.commercialMonthly || 0;

  var years = [];
  var total = {
    units: 0, caHT: 0, unitCost: 0, installCost: 0,
    marketing: 0, commercial: 0, opex: 0, ebitda: 0,
  };

  plan.forEach(function (units, i) {
    var yMultiplier = Math.pow(1 + priceGrowthRate, i);
    var priceY = pricePerUnit * yMultiplier;
    var caHT = units * priceY;
    var unitCost = costPerUnit != null
      ? units * costPerUnit * yMultiplier
      : caHT * costPct;
    var installCost = installPerUnit != null
      ? units * installPerUnit * yMultiplier
      : caHT * installPct;
    var marketing = marketingMonthly * 12;
    var commercial = commercialMonthly * 12;
    var opex = unitCost + installCost + marketing + commercial;
    var ebitda = caHT - opex;

    var y = {
      year: i + 1,
      units: units,
      caHT: caHT,
      unitCost: unitCost,
      installCost: installCost,
      marketing: marketing,
      commercial: commercial,
      opex: opex,
      ebitda: ebitda,
    };
    years.push(y);

    total.units += units;
    total.caHT += caHT;
    total.unitCost += unitCost;
    total.installCost += installCost;
    total.marketing += marketing;
    total.commercial += commercial;
    total.opex += opex;
    total.ebitda += ebitda;
  });

  return { years: years, total: total };
}

/**
 * Combine a marketplace projection and a hardware sales projection into
 * a single view: { pillars: { marketplace, hardwareSales }, combined: { years, total } }.
 *
 * `marketplace` is the output of projectMarketplace() (uses `commissionHT` as revenue).
 * `hardwareSales` is the output of projectHardwareSales() (uses `caHT` as revenue).
 */
export function combineProjections(marketplace, hardwareSales) {
  var mp = marketplace || { years: [], total: {} };
  var hs = hardwareSales || { years: [], total: {} };
  var yearsCount = Math.max(
    (mp.years || []).length,
    (hs.years || []).length
  );
  var years = [];
  var totalCaHT = 0;
  var totalOpex = 0;
  var totalEbitda = 0;

  for (var i = 0; i < yearsCount; i++) {
    var my = mp.years && mp.years[i] ? mp.years[i] : null;
    var hy = hs.years && hs.years[i] ? hs.years[i] : null;
    var mpRevenue = my ? (my.commissionHT || 0) : 0;
    var hsRevenue = hy ? (hy.caHT || 0) : 0;
    var mpOpex = my ? (my.opex || 0) : 0;
    var hsOpex = hy ? (hy.opex || 0) : 0;
    var mpEbitda = my ? (my.ebitda || 0) : 0;
    var hsEbitda = hy ? (hy.ebitda || 0) : 0;
    var caHT = mpRevenue + hsRevenue;
    var opex = mpOpex + hsOpex;
    var ebitda = mpEbitda + hsEbitda;
    years.push({
      year: i + 1,
      caHT: caHT,
      opex: opex,
      ebitda: ebitda,
      marketplace: my,
      hardwareSales: hy,
    });
    totalCaHT += caHT;
    totalOpex += opex;
    totalEbitda += ebitda;
  }

  return {
    pillars: { marketplace: mp, hardwareSales: hs },
    combined: {
      years: years,
      total: { caHT: totalCaHT, opex: totalOpex, ebitda: totalEbitda },
    },
  };
}
