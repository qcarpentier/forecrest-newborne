import { describe, it, expect } from "vitest";
import {
  calcTiersCost, calcCommissionAmount, calcCommissionPct,
  calcNetMargin, calcProgress, calcActualRaised, calcActualTiersCost,
} from "./crowdfundingCalc.js";

// ── calcTiersCost ─────────────────────────────────────────────────────────────

describe("calcTiersCost", function () {
  it("returns 0 for null/empty tiers", function () {
    expect(calcTiersCost(null)).toBe(0);
    expect(calcTiersCost([])).toBe(0);
  });
  it("sums unitCost × quantity", function () {
    var tiers = [
      { unitCost: 12, quantity: 20 },
      { unitCost: 0, quantity: 50 },
      { unitCost: 35, quantity: 10 },
    ];
    // 240 + 0 + 350 = 590
    expect(calcTiersCost(tiers)).toBe(590);
  });
  it("handles missing fields", function () {
    var tiers = [{ unitCost: 10 }, { quantity: 5 }, {}];
    expect(calcTiersCost(tiers)).toBe(0);
  });
  it("ignores negative costs", function () {
    var tiers = [{ unitCost: -5, quantity: 10 }];
    expect(calcTiersCost(tiers)).toBe(0);
  });
  it("handles string values via Number()", function () {
    var tiers = [{ unitCost: "15", quantity: "10" }];
    expect(calcTiersCost(tiers)).toBe(150);
  });
});

// ── calcCommissionAmount ──────────────────────────────────────────────────────

describe("calcCommissionAmount", function () {
  it("Ulule: 8% on 10000", function () {
    expect(calcCommissionAmount(10000, 0.08, 0)).toBe(800);
  });
  it("Kickstarter: 5% + 3.5% on 10000", function () {
    expect(calcCommissionAmount(10000, 0.05, 0.035)).toBeCloseTo(850, 2);
  });
  it("GoFundMe: 0% + 2.9% on 10000", function () {
    expect(calcCommissionAmount(10000, 0, 0.029)).toBeCloseTo(290, 2);
  });
  it("returns 0 for zero goal", function () {
    expect(calcCommissionAmount(0, 0.08, 0)).toBe(0);
  });
  it("returns 0 for negative goal", function () {
    expect(calcCommissionAmount(-5000, 0.08, 0)).toBe(0);
  });
  it("returns 0 for NaN inputs", function () {
    expect(calcCommissionAmount(NaN, 0.08, 0)).toBe(0);
  });
});

// ── calcCommissionPct ─────────────────────────────────────────────────────────

describe("calcCommissionPct", function () {
  it("Ulule: 8% + 0% = 8%", function () {
    expect(calcCommissionPct(0.08, 0)).toBe(0.08);
  });
  it("Kickstarter: 5% + 3.5% = 8.5%", function () {
    expect(calcCommissionPct(0.05, 0.035)).toBeCloseTo(0.085, 4);
  });
  it("handles NaN as 0", function () {
    expect(calcCommissionPct(NaN, 0.05)).toBe(0.05);
  });
});

// ── calcNetMargin ─────────────────────────────────────────────────────────────

describe("calcNetMargin", function () {
  it("positive margin: goal exceeds costs", function () {
    var tiers = [{ unitCost: 12, quantity: 20 }, { unitCost: 0, quantity: 50 }];
    // Goal 10000, commission 8% = 800, tiers = 240
    // Net = 10000 - 800 - 240 = 8960
    expect(calcNetMargin(10000, 0.08, 0, tiers)).toBe(8960);
  });

  it("negative margin: costs exceed goal", function () {
    var tiers = [{ unitCost: 100, quantity: 100 }];
    // Goal 5000, commission 8% = 400, tiers = 10000
    // Net = 5000 - 400 - 10000 = -5400
    expect(calcNetMargin(5000, 0.08, 0, tiers)).toBe(-5400);
  });

  it("zero tiers", function () {
    // Goal 10000, Kickstarter 8.5% = 850
    // Net = 10000 - 850 = 9150
    expect(calcNetMargin(10000, 0.05, 0.035, [])).toBeCloseTo(9150, 2);
  });

  it("GoFundMe real scenario", function () {
    var tiers = [
      { unitCost: 12, quantity: 50 },   // 600
      { unitCost: 25, quantity: 15 },    // 375
      { unitCost: 0, quantity: 100 },    // 0
    ];
    // Goal 15000, GoFundMe 2.9% = 435, tiers = 975
    // Net = 15000 - 435 - 975 = 13590
    expect(calcNetMargin(15000, 0, 0.029, tiers)).toBeCloseTo(13590, 0);
  });
});

// ── calcProgress ──────────────────────────────────────────────────────────────

describe("calcProgress", function () {
  it("50% funded", function () {
    expect(calcProgress(5000, 10000)).toBe(0.5);
  });
  it("100% funded", function () {
    expect(calcProgress(10000, 10000)).toBe(1);
  });
  it("over-funded (150%)", function () {
    expect(calcProgress(15000, 10000)).toBe(1.5);
  });
  it("0% when nothing raised", function () {
    expect(calcProgress(0, 10000)).toBe(0);
  });
  it("returns 0 for zero goal", function () {
    expect(calcProgress(5000, 0)).toBe(0);
  });
  it("returns 0 for negative goal", function () {
    expect(calcProgress(5000, -1000)).toBe(0);
  });
  it("handles NaN gracefully", function () {
    expect(calcProgress(NaN, 10000)).toBe(0);
    expect(calcProgress(5000, NaN)).toBe(0);
  });
});

// ── calcActualRaised ──────────────────────────────────────────────────────────

describe("calcActualRaised", function () {
  it("returns 0 for no tiers and no donations", function () {
    expect(calcActualRaised([], 0)).toBe(0);
  });
  it("sums backers × price + donations", function () {
    var tiers = [
      { price: 25, backers: 10 },
      { price: 50, backers: 5 },
    ];
    // 250 + 250 + 100 donations = 600
    expect(calcActualRaised(tiers, 100)).toBe(600);
  });
  it("ignores tiers with 0 backers", function () {
    var tiers = [
      { price: 25, backers: 0 },
      { price: 50, backers: 3 },
    ];
    expect(calcActualRaised(tiers, 0)).toBe(150);
  });
  it("handles free tiers (price = 0)", function () {
    var tiers = [{ price: 0, backers: 100 }];
    expect(calcActualRaised(tiers, 50)).toBe(50);
  });
  it("handles null inputs", function () {
    expect(calcActualRaised(null, null)).toBe(0);
  });
});

// ── calcActualTiersCost ───────────────────────────────────────────────────────

describe("calcActualTiersCost", function () {
  it("returns 0 for empty tiers", function () {
    expect(calcActualTiersCost([])).toBe(0);
  });
  it("sums unitCost × backers", function () {
    var tiers = [
      { unitCost: 12, backers: 10 },
      { unitCost: 0, backers: 50 },
      { unitCost: 35, backers: 5 },
    ];
    // 120 + 0 + 175 = 295
    expect(calcActualTiersCost(tiers)).toBe(295);
  });
  it("ignores tiers with 0 backers", function () {
    var tiers = [{ unitCost: 12, backers: 0 }];
    expect(calcActualTiersCost(tiers)).toBe(0);
  });
});
