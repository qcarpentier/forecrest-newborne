import { describe, it, expect } from "vitest";
import { salCalc, calcIsoc, grantCalc, indepCalc, calcHealthScore, projectFinancials } from "./calculations.js";
import { calcBusinessKpis } from "./kpis.js";

// ── salCalc ──────────────────────────────────────────────────────────────────

describe("salCalc", function () {
  it("returns zero for zero net", function () {
    var r = salCalc(0, 0.1307, 0.1723, 0.2507);
    expect(r.net).toBe(0);
    expect(r.total).toBe(0);
  });

  it("computes Belgian employee salary breakdown", function () {
    var r = salCalc(2000, 0.1307, 0.1723, 0.2507);
    expect(r.net).toBe(2000);
    expect(r.brutO).toBeCloseTo(2000 / (1 - 0.1307 - 0.1723), 1);
    expect(r.onssV).toBeCloseTo(r.brutO * 0.1307, 1);
    expect(r.precV).toBeCloseTo(r.brutO * 0.1723, 1);
    expect(r.patrV).toBeCloseTo(r.brutO * 0.2507, 1);
    expect(r.brutE).toBeCloseTo(r.brutO + r.patrV, 1);
    expect(r.total).toBe(r.brutE);
  });

  it("computes student reduced ONSS", function () {
    var r = salCalc(1000, 0.0271, 0.1723, 0);
    expect(r.onssV).toBeCloseTo(r.brutO * 0.0271, 1);
    expect(r.patrV).toBe(0);
    expect(r.total).toBe(r.brutO);
  });

  it("handles negative net", function () {
    var r = salCalc(-100, 0.1307, 0.1723, 0.2507);
    expect(r.total).toBe(0);
  });
});

// ── calcIsoc ─────────────────────────────────────────────────────────────────

describe("calcIsoc", function () {
  it("returns zero for negative EBITDA", function () {
    var r = calcIsoc(-10000, 20000);
    expect(r.isoc).toBe(0);
    expect(r.netP).toBe(-10000);
  });

  it("applies 20% PME rate under 100K", function () {
    var r = calcIsoc(50000, 20000);
    expect(r.isocR).toBe(10000);
    expect(r.isocS).toBe(0);
    expect(r.isoc).toBe(10000);
    expect(r.isocEff).toBeCloseTo(0.20, 2);
  });

  it("applies 20%+25% for EBITDA above 100K", function () {
    var r = calcIsoc(200000, 20000);
    expect(r.isocR).toBe(20000);
    expect(r.isocS).toBe(25000);
    expect(r.isoc).toBe(45000);
  });

  it("computes reserve legale", function () {
    var r = calcIsoc(50000, 20000);
    expect(r.resLeg).toBe(2000);
  });

  it("caps reserve legale at 10% of capital", function () {
    var r = calcIsoc(500000, 10000);
    expect(r.resLeg).toBe(1000);
  });
});

// ── indepCalc ────────────────────────────────────────────────────────────────

describe("indepCalc", function () {
  it("returns zero for zero income", function () {
    var r = indepCalc(0);
    expect(r.netAnnual).toBe(0);
    expect(r.socialContrib).toBe(0);
  });

  it("computes social contributions at 20.5%", function () {
    var r = indepCalc(50000);
    expect(r.socialContrib).toBeCloseTo(50000 * 0.205, 0);
  });

  it("computes progressive IPP tax", function () {
    var r = indepCalc(50000);
    expect(r.taxEstimate).toBeGreaterThan(0);
    expect(r.netAfterTax).toBeLessThan(50000);
    expect(r.netAfterTax).toBeGreaterThan(0);
  });

  it("computes monthly net", function () {
    var r = indepCalc(60000);
    expect(r.netMonthly).toBeCloseTo(r.netAfterTax / 12, 0);
  });

  it("totalCost equals netAnnual for independants", function () {
    var r = indepCalc(40000);
    expect(r.totalCost).toBe(40000);
  });

  it("handles negative income", function () {
    var r = indepCalc(-5000);
    expect(r.netAnnual).toBe(0);
  });
});

// ── projectFinancials ────────────────────────────────────────────────────────

describe("projectFinancials", function () {
  it("projects flat revenue and costs over 12 months", function () {
    var r = projectFinancials({
      monthlyRevenue: 10000,
      monthlyCosts: 8000,
      initialCash: 5000,
      months: 12,
    });
    expect(r.rows.length).toBe(12);
    expect(r.rows[0].net).toBeCloseTo(2000, 0);
    expect(r.rows[11].cumulative).toBeCloseTo(5000 + 2000 * 12, 0);
    expect(r.years.length).toBe(1);
  });

  it("applies revenue growth", function () {
    var r = projectFinancials({
      monthlyRevenue: 10000,
      monthlyCosts: 10000,
      initialCash: 0,
      revenueGrowthRate: 0.50,
      months: 12,
    });
    expect(r.rows[11].monthlyRevenue).toBeGreaterThan(r.rows[0].monthlyRevenue);
  });

  it("detects cash-zero month", function () {
    var r = projectFinancials({
      monthlyRevenue: 5000,
      monthlyCosts: 10000,
      initialCash: 20000,
      months: 12,
    });
    expect(r.zeroMonth).toBe(4);
  });

  it("returns null zeroMonth when profitable", function () {
    var r = projectFinancials({
      monthlyRevenue: 15000,
      monthlyCosts: 10000,
      initialCash: 5000,
      months: 12,
    });
    expect(r.zeroMonth).toBeNull();
  });

  it("computes year summaries", function () {
    var r = projectFinancials({
      monthlyRevenue: 10000,
      monthlyCosts: 8000,
      initialCash: 0,
      months: 36,
    });
    expect(r.years.length).toBe(3);
    expect(r.years[0].revenue).toBeCloseTo(120000, -2);
    expect(r.years[0].ebitda).toBeCloseTo(24000, -2);
  });
});

// ── grantCalc ────────────────────────────────────────────────────────────────

describe("grantCalc", function () {
  it("computes vesting for a fresh grant", function () {
    var g = {
      grantDate: new Date().toISOString(),
      vestingMonths: 48,
      cliffMonths: 12,
      fairValue: 1,
      shares: 10000,
    };
    var r = grantCalc(g);
    expect(r.status).toBe("cliff");
    expect(r.vestedShares).toBe(0);
    expect(r.monthlyExpense).toBeCloseTo(10000 / 48, 0);
  });

  it("returns complete for old grant", function () {
    var past = new Date();
    past.setFullYear(past.getFullYear() - 5);
    var g = {
      grantDate: past.toISOString(),
      vestingMonths: 48,
      cliffMonths: 12,
      fairValue: 1,
      shares: 10000,
    };
    var r = grantCalc(g);
    expect(r.status).toBe("complete");
    expect(r.vestedShares).toBe(10000);
    expect(r.monthlyExpense).toBe(0);
  });
});

// ── calcHealthScore ──────────────────────────────────────────────────────────

describe("calcHealthScore", function () {
  it("returns score for zero data", function () {
    var r = calcHealthScore({ totalRevenue: 0, monthlyCosts: 0, ebitda: 0, cfg: {} });
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it("returns high score for profitable business", function () {
    var r = calcHealthScore({
      totalRevenue: 500000,
      monthlyCosts: 30000,
      ebitda: 140000,
      cfg: { initialCash: 100000 },
    });
    expect(r.profitability).toBeGreaterThan(70);
    expect(r.total).toBeGreaterThan(70);
  });

  it("returns low score for burning business", function () {
    var r = calcHealthScore({
      totalRevenue: 10000,
      monthlyCosts: 20000,
      ebitda: -230000,
      cfg: { initialCash: 5000 },
    });
    expect(r.profitability).toBeLessThan(30);
    expect(r.total).toBeLessThan(30);
  });
});

// ── calcBusinessKpis ─────────────────────────────────────────────────────────

describe("calcBusinessKpis", function () {
  var baseParams = {
    totalRevenue: 120000,
    monthlyCosts: 8000,
    ebitda: 24000,
    netP: 18000,
    cfg: { churnMonthly: 0.03, cacTarget: 500, revenueGrowthRate: 0.20, expansionRate: 0.02, contractionRate: 0.01, trialConversionRate: 0.05 },
    sals: [{ net: 2000, type: "employee" }],
    streams: [],
    debts: [],
  };

  it("returns SaaS KPIs", function () {
    var r = calcBusinessKpis("saas", baseParams);
    expect(r.type).toBe("saas");
    expect(r.kpis.length).toBeGreaterThan(10);
    var mrr = r.kpis.find(function (k) { return k.id === "mrr"; });
    expect(mrr.value).toBeCloseTo(10000, 0);
  });

  it("returns E-commerce KPIs", function () {
    var p = { ...baseParams, cfg: { ...baseParams.cfg, ordersPerMonth: 500, monthlyVisitors: 10000, avgShippingCost: 5, returnRate: 0.05 } };
    var r = calcBusinessKpis("ecommerce", p);
    expect(r.type).toBe("ecommerce");
    var aov = r.kpis.find(function (k) { return k.id === "aov"; });
    expect(aov.value).toBeCloseTo(120000 / 6000, 0);
  });

  it("returns Retail KPIs", function () {
    var p = { ...baseParams, cfg: { ...baseParams.cfg, storeSize: 100, monthlyFootfall: 5000, monthlyTransactions: 2000 } };
    var r = calcBusinessKpis("retail", p);
    expect(r.type).toBe("retail");
    var revM2 = r.kpis.find(function (k) { return k.id === "revenue_per_m2"; });
    expect(revM2.value).toBeCloseTo(1200, 0);
  });

  it("returns Services KPIs", function () {
    var p = { ...baseParams, cfg: { ...baseParams.cfg, avgHourlyRate: 80, consultantCount: 3, utilizationTarget: 0.75 } };
    var r = calcBusinessKpis("services", p);
    expect(r.type).toBe("services");
    var revPC = r.kpis.find(function (k) { return k.id === "revenue_per_consultant"; });
    expect(revPC.value).toBeCloseTo(40000, 0);
  });

  it("returns Freelancer KPIs", function () {
    var p = { ...baseParams, cfg: { ...baseParams.cfg, dailyRate: 500, workingDaysPerYear: 220, vacationDays: 20, daysBilled: 180, socialContributionRate: 0.2035 } };
    var r = calcBusinessKpis("freelancer", p);
    expect(r.type).toBe("freelancer");
    var util = r.kpis.find(function (k) { return k.id === "utilization"; });
    expect(util.value).toBeCloseTo(180 / 200, 2);
  });

  it("returns generic KPIs for unknown type", function () {
    var r = calcBusinessKpis("unknown", baseParams);
    expect(r.type).toBe("other");
    expect(r.kpis.length).toBeGreaterThan(0);
  });
});
