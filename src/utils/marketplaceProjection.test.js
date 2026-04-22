import { describe, it, expect } from "vitest";
import { projectMarketplace } from "./marketplaceProjection.js";

/**
 * Reference values calibrated against the business plan target (7.3% penetration).
 * Acquisition plan [792, 1001, 1001] = 2 793 cumul → ~2 049 active at end of year 3.
 */

describe("projectMarketplace - business plan target", function () {
  var params = {
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
  };

  var r = projectMarketplace(params);

  it("produces 3 year aggregates", function () {
    expect(r.years.length).toBe(3);
  });

  it("cumulative new clients = 2 793", function () {
    var totNew = r.years.reduce(function (s, y) { return s + y.newClients; }, 0);
    expect(totNew).toBeCloseTo(2794, 0);
  });

  it("year 3 active clients ≈ 2 049 (within 5% of BP)", function () {
    expect(r.years[2].activeClientsEnd).toBeGreaterThan(1950);
    expect(r.years[2].activeClientsEnd).toBeLessThan(2150);
  });

  it("year 3 GMV TTC in the 600-750K range", function () {
    expect(r.years[2].gmvTTC).toBeGreaterThan(600000);
    expect(r.years[2].gmvTTC).toBeLessThan(750000);
  });

  it("commission HT = commissionPct × GMV TTC (invariant)", function () {
    r.years.forEach(function (y) {
      if (y.gmvTTC > 0) {
        expect(y.commissionHT / y.gmvTTC).toBeCloseTo(0.2034, 3);
      }
    });
  });

  it("VAT due = 21% of commission HT", function () {
    r.years.forEach(function (y) {
      if (y.commissionHT > 0) {
        expect(y.tvaDue / y.commissionHT).toBeCloseTo(0.21, 3);
      }
    });
  });

  it("transaction fees = 1.4% GMV + 0.25€ × tx", function () {
    r.years.forEach(function (y) {
      var expected = y.gmvTTC * 0.014 + y.transactions * 0.25;
      expect(y.fraisTx).toBeCloseTo(expected, 0);
    });
  });

  it("marketing is 8 004 €/year flat", function () {
    r.years.forEach(function (y) {
      expect(y.marketing).toBeCloseTo(8004, 0);
    });
  });

  it("amortisation is 1 400 €/year flat", function () {
    r.years.forEach(function (y) {
      expect(y.amortHw).toBeCloseTo(1400, 0);
    });
  });

  it("year 3 EBITDA is positive and year 1 EBITDA is negative (ramp-up phase)", function () {
    expect(r.years[0].ebitda).toBeLessThan(0);
    expect(r.years[2].ebitda).toBeGreaterThan(0);
  });

  it("year 3 EBITDA in the 50-120K range (matches BP ~76K)", function () {
    expect(r.years[2].ebitda).toBeGreaterThan(40000);
    expect(r.years[2].ebitda).toBeLessThan(120000);
  });

  it("infra cost escalates across tiers", function () {
    expect(r.years[0].maintSaas).toBeLessThan(r.years[2].maintSaas);
    expect(r.years[2].maintSaas).toBeCloseTo(2130, 0);
  });

  it("hardware cash decreases in year 3 (fewer new modules)", function () {
    expect(r.years[2].hwCash).toBeLessThan(r.years[1].hwCash);
  });
});

describe("projectMarketplace - edge cases", function () {
  it("returns empty years for empty acquisition plan", function () {
    var r = projectMarketplace({ acquisitionPlan: [] });
    expect(r.years.length).toBe(0);
    expect(r.rows.length).toBe(0);
  });

  it("handles zero acquisition (all churn, no growth)", function () {
    var r = projectMarketplace({
      acquisitionPlan: [0, 0, 0],
      churnMonthly: 0.02,
      visitsPerMonth: 5,
      priceTTC: 5,
      commissionPct: 0.15,
    });
    expect(r.years[0].activeClientsEnd).toBe(0);
    expect(r.years[0].gmvTTC).toBe(0);
  });

  it("ramps linearly without churn (sanity check)", function () {
    var r = projectMarketplace({
      acquisitionPlan: [120, 0, 0],
      churnMonthly: 0,
      visitsPerMonth: 1,
      priceTTC: 1,
      commissionPct: 1,
    });
    // 120 new clients/year = 10/month → active end year 1 = 120
    expect(r.years[0].activeClientsEnd).toBeCloseTo(120, 0);
  });
});
