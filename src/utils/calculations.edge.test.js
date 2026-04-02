import { describe, it, expect } from "vitest";
import { costItemMonthly, projectFinancials } from "./calculations.js";

describe("costItemMonthly edge cases", function () {
  it("converts quarterly cost to monthly", function () {
    expect(costItemMonthly({ a: 1200, freq: "quarterly", pu: false })).toBe(400);
  });

  it("converts annual per-unit cost to monthly", function () {
    expect(costItemMonthly({ a: 10, u: 24, pu: true, freq: "annual" })).toBe(20);
  });

  it("ignores one-off costs in monthly view", function () {
    expect(costItemMonthly({ a: 5000, freq: "once", pu: false })).toBe(0);
  });
});

describe("projectFinancials edge cases", function () {
  it("detects break-even from explicit monthly arrays", function () {
    var result = projectFinancials({
      initialCash: 1000,
      months: 4,
      revenueByMonth: [2000, 3000, 8000, 9000],
      costsByMonth: [5000, 5000, 6000, 6000],
    });

    expect(result.beMonth).toBe(3);
  });

  it("detects zero cash even when starting cash is zero", function () {
    var result = projectFinancials({
      monthlyRevenue: 1000,
      monthlyCosts: 2000,
      initialCash: 0,
      months: 3,
    });

    expect(result.zeroMonth).toBe(1);
  });
});
