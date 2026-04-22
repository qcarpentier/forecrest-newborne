import { describe, it, expect } from "vitest";
import { projectHardwareSales, combineProjections } from "./hardwareSalesProjection.js";
import { projectMarketplace } from "./marketplaceProjection.js";

describe("projectHardwareSales - EV pillar", function () {
  var params = {
    salesPlan: [24, 34, 43],
    pricePerUnit: 1230,
    priceGrowthRate: 0.005,
    costPct: 0.484,
    installPct: 0.0807,
    marketingMonthly: 300,
    commercialMonthly: 0,
  };

  var r = projectHardwareSales(params);

  it("produces 3 years", function () {
    expect(r.years.length).toBe(3);
  });

  it("total units sold matches plan", function () {
    expect(r.total.units).toBe(24 + 34 + 43);
  });

  it("CA HT year 1 matches BP image (~29 484 €)", function () {
    expect(r.years[0].caHT).toBeGreaterThan(29000);
    expect(r.years[0].caHT).toBeLessThan(30000);
  });

  it("CA HT year 3 matches BP image (~53 486 €)", function () {
    expect(r.years[2].caHT).toBeGreaterThan(52000);
    expect(r.years[2].caHT).toBeLessThan(55000);
  });

  it("cost is constant fraction of revenue", function () {
    r.years.forEach(function (y) {
      expect(y.unitCost / y.caHT).toBeCloseTo(0.484, 3);
    });
  });

  it("install cost is constant fraction of revenue", function () {
    r.years.forEach(function (y) {
      expect(y.installCost / y.caHT).toBeCloseTo(0.0807, 3);
    });
  });

  it("marketing is 3 600 €/year flat", function () {
    r.years.forEach(function (y) {
      expect(y.marketing).toBeCloseTo(3600, 0);
    });
  });

  it("commercial is 0 (no internal sales team)", function () {
    r.years.forEach(function (y) {
      expect(y.commercial).toBe(0);
    });
  });

  it("year 1 EBITDA matches BP image (~9 235 €)", function () {
    expect(r.years[0].ebitda).toBeGreaterThan(9000);
    expect(r.years[0].ebitda).toBeLessThan(9500);
  });

  it("year 3 EBITDA matches BP image (~19 684 €)", function () {
    expect(r.years[2].ebitda).toBeGreaterThan(19000);
    expect(r.years[2].ebitda).toBeLessThan(20500);
  });

  it("3-year cumulative EBITDA matches BP image (~43 679 €)", function () {
    expect(r.total.ebitda).toBeGreaterThan(42000);
    expect(r.total.ebitda).toBeLessThan(45000);
  });
});

describe("projectHardwareSales - edge cases", function () {
  it("returns empty for empty plan", function () {
    var r = projectHardwareSales({ salesPlan: [] });
    expect(r.years.length).toBe(0);
    expect(r.total.caHT).toBe(0);
  });

  it("costPerUnit takes precedence over costPct", function () {
    var r = projectHardwareSales({
      salesPlan: [10],
      pricePerUnit: 1000,
      costPerUnit: 400,
      costPct: 0.9,
    });
    expect(r.years[0].unitCost).toBe(10 * 400);
  });

  it("installPerUnit takes precedence over installPct", function () {
    var r = projectHardwareSales({
      salesPlan: [10],
      pricePerUnit: 1000,
      installPerUnit: 50,
      installPct: 0.5,
    });
    expect(r.years[0].installCost).toBe(10 * 50);
  });
});

describe("combineProjections - parking + EV", function () {
  var mp = projectMarketplace({
    acquisitionPlan: [792, 1001, 1001],
    churnMonthly: 0.02,
    visitsPerMonth: 5.72,
    priceTTC: 5.41,
    commissionPct: 0.2034,
    vatRate: 0.21,
    stripePct: 0.014,
    stripeFixed: 0.25,
    marketingMonthly: 667,
    infraTiers: [
      { upTo: 100, annualCost: 212 },
      { upTo: 500, annualCost: 330 },
      { upTo: 1000, annualCost: 1000 },
      { upTo: null, annualCost: 2130 },
    ],
    hardwareUnitCost: 60,
    hardwareClientsPerUnit: 3,
    amortAnnual: 1400,
  });
  var hs = projectHardwareSales({
    salesPlan: [24, 34, 43],
    pricePerUnit: 1230,
    priceGrowthRate: 0.005,
    costPct: 0.484,
    installPct: 0.0807,
    marketingMonthly: 300,
  });
  var combined = combineProjections(mp, hs);

  it("combined years length = max of both", function () {
    expect(combined.combined.years.length).toBe(3);
  });

  it("year 1 combined revenue HT ≈ 54 870 € (BP image)", function () {
    expect(combined.combined.years[0].caHT).toBeGreaterThan(54000);
    expect(combined.combined.years[0].caHT).toBeLessThan(60000);
  });

  it("year 3 combined revenue HT ≈ 194 503 € (BP image)", function () {
    expect(combined.combined.years[2].caHT).toBeGreaterThan(180000);
    expect(combined.combined.years[2].caHT).toBeLessThan(200000);
  });

  it("3-year combined cumulative EBITDA ≈ 149 262 € (BP image)", function () {
    // Note: uses EBIT (post-amort) for marketplace + EBITDA for EV
    // because image labels parking "EBITDA" but includes amort (= EBIT accounting).
    var ebitCombined3y = 0;
    combined.combined.years.forEach(function (y) {
      ebitCombined3y += (y.marketplace ? y.marketplace.ebit : 0) + (y.hardwareSales ? y.hardwareSales.ebitda : 0);
    });
    expect(ebitCombined3y).toBeGreaterThan(135000);
    expect(ebitCombined3y).toBeLessThan(160000);
  });

  it("handles null marketplace (only EV)", function () {
    var c = combineProjections(null, hs);
    expect(c.combined.years.length).toBe(3);
    expect(c.combined.total.caHT).toBeCloseTo(hs.total.caHT, 0);
  });

  it("handles null hardwareSales (only marketplace)", function () {
    var c = combineProjections(mp, null);
    expect(c.combined.years.length).toBe(3);
    expect(c.combined.total.caHT).toBeCloseTo(mp.total.commissionHT, 0);
  });
});
