import { describe, it, expect } from "vitest";
import { costItemMonthly, resolveTier, salCalc, calcIsoc, grantCalc, indepCalc, calcHealthScore, projectFinancials, calcBelgianProgressiveTax, calcBelgianIndependentSocialContrib } from "./calculations.js";
import { calcBusinessKpis } from "./kpis.js";

// ── costItemMonthly — variable_revenue ───────────────────────────────────────

describe("costItemMonthly - variable_revenue", function () {
  it("returns 0 for empty ctx", function () {
    var item = { kind: "variable_revenue", pctOfRevenue: 0.014, perTransaction: 0.25 };
    expect(costItemMonthly(item)).toBe(0);
  });

  it("applies pct to monthly revenue", function () {
    var item = { kind: "variable_revenue", pctOfRevenue: 0.014 };
    var r = costItemMonthly(item, { totalRevenue: 120000 });
    expect(r).toBeCloseTo(10000 * 0.014, 4);
  });

  it("adds perTransaction × monthlyTransactions", function () {
    var item = { kind: "variable_revenue", perTransaction: 0.25 };
    var r = costItemMonthly(item, { monthlyTransactions: 5000 });
    expect(r).toBeCloseTo(1250, 4);
  });

  it("combines pct + per-transaction (Stripe case on GMV)", function () {
    var item = { kind: "variable_revenue", pctOfRevenue: 0.014, perTransaction: 0.25, basis: "gmv" };
    var r = costItemMonthly(item, { monthlyGMV: 30000, monthlyTransactions: 5000 });
    expect(r).toBeCloseTo(30000 * 0.014 + 5000 * 0.25, 4);
  });

  it("uses totalRevenue when basis is revenue (default)", function () {
    var item = { kind: "variable_revenue", pctOfRevenue: 0.10 };
    var r = costItemMonthly(item, { totalRevenue: 120000, monthlyGMV: 999999 });
    expect(r).toBeCloseTo(10000 * 0.10, 4);
  });
});

// ── costItemMonthly — tiered_clients + resolveTier ───────────────────────────

describe("costItemMonthly - tiered_clients", function () {
  var tiers = [
    { upTo: 100, annualCost: 212 },
    { upTo: 500, annualCost: 330 },
    { upTo: 1000, annualCost: 1000 },
    { upTo: null, annualCost: 2130 },
  ];

  it("returns first tier when clients <= first upTo", function () {
    var item = { kind: "tiered_clients", tiers: tiers };
    expect(costItemMonthly(item, { avgActiveClients: 50 })).toBeCloseTo(212 / 12, 4);
  });

  it("resolves mid tier for 300 clients", function () {
    var item = { kind: "tiered_clients", tiers: tiers };
    expect(costItemMonthly(item, { avgActiveClients: 300 })).toBeCloseTo(330 / 12, 4);
  });

  it("uses last tier when clients exceed all bounds", function () {
    var item = { kind: "tiered_clients", tiers: tiers };
    expect(costItemMonthly(item, { avgActiveClients: 10000 })).toBeCloseTo(2130 / 12, 4);
  });

  it("returns 0 when tiers array is empty", function () {
    var item = { kind: "tiered_clients", tiers: [] };
    expect(costItemMonthly(item, { avgActiveClients: 500 })).toBe(0);
  });

  it("treats negative client count as zero", function () {
    expect(resolveTier(tiers, -10)).toBe(212);
  });
});

// ── costItemMonthly — hardware_per_clients ───────────────────────────────────

describe("costItemMonthly - hardware_per_clients", function () {
  it("computes dynamic hardware cost from clients ratio", function () {
    var item = { kind: "hardware_per_clients", unitCost: 200, clientsPerUnit: 3, amortYears: 2 };
    var r = costItemMonthly(item, { avgActiveClients: 565 });
    var expectedAnnual = (565 / 3) * 200 / 2;
    expect(r * 12).toBeCloseTo(expectedAnnual, 2);
  });

  it("returns 0 without clients", function () {
    var item = { kind: "hardware_per_clients", unitCost: 200, clientsPerUnit: 3, amortYears: 2 };
    expect(costItemMonthly(item, {})).toBe(0);
  });

  it("protects against zero divisors", function () {
    var item = { kind: "hardware_per_clients", unitCost: 100, clientsPerUnit: 0, amortYears: 0 };
    var r = costItemMonthly(item, { avgActiveClients: 10 });
    // clientsPerUnit clamped to 1, amortYears clamped to 1 → 10 × 100 / 1 / 12
    expect(r).toBeCloseTo(10 * 100 / 12, 2);
  });
});

// ── costItemMonthly — legacy items (retrocompat) ─────────────────────────────

describe("costItemMonthly - legacy items", function () {
  it("handles monthly items without kind", function () {
    expect(costItemMonthly({ a: 100, freq: "monthly" })).toBe(100);
  });

  it("handles annual items", function () {
    expect(costItemMonthly({ a: 1200, freq: "annual" })).toBe(100);
  });

  it("handles quarterly items", function () {
    expect(costItemMonthly({ a: 300, freq: "quarterly" })).toBe(100);
  });

  it("multiplies per-user amount by user count", function () {
    expect(costItemMonthly({ a: 10, freq: "monthly", pu: true, u: 5 })).toBe(50);
  });
});

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

  it("does not apply legal reserve to SRL when legal form is explicit", function () {
    var r = calcIsoc(50000, 20000, { legalForm: "SRL" });
    expect(r.resLeg).toBe(0);
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
    expect(r.socialContrib).toBeCloseTo(50000 * 0.205, 2);
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

  it("uses indexed 2026 personal tax brackets", function () {
    var tax = calcBelgianProgressiveTax(38000, { incomeYear: 2026, municipalSurchargeRate: 0 });
    expect(tax).toBeCloseTo(10321.5, 2);
  });

  it("uses indexed 2026 independent social bands", function () {
    var contrib = calcBelgianIndependentSocialContrib(90000);
    expect(contrib).toBeCloseTo(17500.555836, 4);
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
    expect(r.years[0].ebit).toBeCloseTo(24000, -2);
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
    var r = calcHealthScore({ totalRevenue: 0, monthlyCosts: 0, ebit: 0, cfg: {} });
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it("returns high score for profitable business", function () {
    var r = calcHealthScore({
      totalRevenue: 500000,
      monthlyCosts: 30000,
      ebit: 140000,
      cfg: { initialCash: 100000 },
    });
    expect(r.profitability).toBeGreaterThan(70);
    expect(r.total).toBeGreaterThan(70);
  });

  it("returns low score for burning business", function () {
    var r = calcHealthScore({
      totalRevenue: 10000,
      monthlyCosts: 20000,
      ebit: -230000,
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
    ebit: 24000,
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
