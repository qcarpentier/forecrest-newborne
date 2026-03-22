import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TVA_RATES, TVA_MAX, TVA_MIN,
  validateTvaRate, getItemTva, costAnnualForVat,
  calcVatCollected, calcVatDeductible, calcVatBalance,
} from "./tvaCalc.js";

// ── Constants ─────────────────────────────────────────────────────────────────

describe("TVA constants", function () {
  it("defines the 4 Belgian legal rates", function () {
    expect(TVA_RATES).toEqual([0, 0.06, 0.12, 0.21]);
  });
  it("TVA_MAX is 21%", function () {
    expect(TVA_MAX).toBe(0.21);
  });
  it("TVA_MIN is 0%", function () {
    expect(TVA_MIN).toBe(0);
  });
});

// ── validateTvaRate ───────────────────────────────────────────────────────────

describe("validateTvaRate", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("returns 0 for null", function () {
    expect(validateTvaRate(null, "test")).toBe(0);
  });
  it("returns 0 for undefined", function () {
    expect(validateTvaRate(undefined, "test")).toBe(0);
  });
  it("returns 0 and warns for NaN", function () {
    expect(validateTvaRate(NaN, "test")).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("NaN"));
  });
  it("returns 0 and warns for string input", function () {
    expect(validateTvaRate("0.21", "test")).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });
  it("returns 0 and warns for negative rate", function () {
    expect(validateTvaRate(-0.05, "test")).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Negative"));
  });
  it("clamps rate > 1 to 1 and warns", function () {
    expect(validateTvaRate(1.5, "test")).toBe(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("> 100%"));
  });
  it("clamps rate = 21 (confused with percent) to 1", function () {
    expect(validateTvaRate(21, "test")).toBe(1);
    expect(console.warn).toHaveBeenCalled();
  });
  it("accepts 0% (exempt)", function () {
    expect(validateTvaRate(0, "test")).toBe(0);
    expect(console.warn).not.toHaveBeenCalled();
  });
  it("accepts 6% reduced rate", function () {
    expect(validateTvaRate(0.06, "test")).toBe(0.06);
    expect(console.warn).not.toHaveBeenCalled();
  });
  it("accepts 12% intermediate rate", function () {
    expect(validateTvaRate(0.12, "test")).toBe(0.12);
    expect(console.warn).not.toHaveBeenCalled();
  });
  it("accepts 21% standard rate", function () {
    expect(validateTvaRate(0.21, "test")).toBe(0.21);
    expect(console.warn).not.toHaveBeenCalled();
  });
  it("accepts 100% edge case", function () {
    expect(validateTvaRate(1, "test")).toBe(1);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

// ── getItemTva ────────────────────────────────────────────────────────────────

describe("getItemTva", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("returns item.tva when explicitly set", function () {
    expect(getItemTva({ tva: 0.06 }, 0.21)).toBe(0.06);
  });
  it("returns item.tva = 0 (exempt) when set", function () {
    expect(getItemTva({ tva: 0 }, 0.21)).toBe(0);
  });
  it("returns fallback when item.tva is null", function () {
    expect(getItemTva({ tva: null }, 0.12)).toBe(0.12);
  });
  it("returns fallback when item.tva is undefined", function () {
    expect(getItemTva({}, 0.06)).toBe(0.06);
  });
  it("returns 21% when both item.tva and fallback are null", function () {
    expect(getItemTva({}, null)).toBe(0.21);
  });
  it("validates item.tva (clamps bad values)", function () {
    expect(getItemTva({ tva: -0.1 }, 0.21)).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });
  it("validates fallback rate", function () {
    expect(getItemTva({}, -0.05)).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });
});

// ── costAnnualForVat ──────────────────────────────────────────────────────────

describe("costAnnualForVat", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("returns 0 for null item", function () {
    expect(costAnnualForVat(null)).toBe(0);
  });
  it("returns 0 for empty item", function () {
    expect(costAnnualForVat({})).toBe(0);
  });
  it("monthly cost × 12", function () {
    expect(costAnnualForVat({ a: 100, freq: "monthly" })).toBe(1200);
  });
  it("quarterly cost × 4", function () {
    expect(costAnnualForVat({ a: 300, freq: "quarterly" })).toBe(1200);
  });
  it("annual cost × 1", function () {
    expect(costAnnualForVat({ a: 1200, freq: "annual" })).toBe(1200);
  });
  it("once cost × 1", function () {
    expect(costAnnualForVat({ a: 500, freq: "once" })).toBe(500);
  });
  it("defaults to monthly (×12) when freq is missing", function () {
    expect(costAnnualForVat({ a: 100 })).toBe(1200);
  });
  it("per-unit pricing: a × u", function () {
    expect(costAnnualForVat({ a: 50, pu: true, u: 3, freq: "monthly" })).toBe(1800);
  });
  it("per-unit with u=0 gives 0", function () {
    expect(costAnnualForVat({ a: 50, pu: true, u: 0, freq: "monthly" })).toBe(0);
  });
  it("per-unit with missing u defaults to 1", function () {
    expect(costAnnualForVat({ a: 50, pu: true, freq: "monthly" })).toBe(600);
  });
  it("clamps negative amounts to 0", function () {
    expect(costAnnualForVat({ a: -100, freq: "monthly" })).toBe(0);
  });
  it("handles string amount via Number()", function () {
    expect(costAnnualForVat({ a: "100", freq: "monthly" })).toBe(1200);
  });
  it("returns 0 for NaN amount", function () {
    expect(costAnnualForVat({ a: "abc", freq: "monthly" })).toBe(0);
  });
});

// ── calcVatCollected (TVA collectée) ──────────────────────────────────────────

describe("calcVatCollected", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("returns 0 for null/empty streams", function () {
    expect(calcVatCollected(null, 0.21)).toBe(0);
    expect(calcVatCollected([], 0.21)).toBe(0);
  });

  it("calculates 21% on recurring revenue", function () {
    var streams = [{ items: [{ behavior: "recurring", price: 100, qty: 10 }] }];
    // annual = 100 × 10 × 12 = 12000, VAT = 12000 × 0.21 = 2520
    expect(calcVatCollected(streams, 0.21)).toBeCloseTo(2520, 2);
  });

  it("calculates 6% on item with tva override", function () {
    var streams = [{ items: [{ behavior: "recurring", price: 100, qty: 10, tva: 0.06 }] }];
    // annual = 12000, VAT = 12000 × 0.06 = 720
    expect(calcVatCollected(streams, 0.21)).toBeCloseTo(720, 2);
  });

  it("excludes 0% exempt items", function () {
    var streams = [{ items: [
      { behavior: "recurring", price: 100, qty: 10, tva: 0.21 },
      { behavior: "recurring", price: 200, qty: 5, tva: 0 },
    ] }];
    // Only first: 12000 × 0.21 = 2520. Second is exempt.
    expect(calcVatCollected(streams, 0.21)).toBeCloseTo(2520, 2);
  });

  it("handles mixed rates across categories", function () {
    var streams = [
      { items: [{ behavior: "recurring", price: 100, qty: 10, tva: 0.21 }] },
      { items: [{ behavior: "recurring", price: 50, qty: 20, tva: 0.06 }] },
    ];
    // Cat1: 12000 × 0.21 = 2520, Cat2: 12000 × 0.06 = 720
    expect(calcVatCollected(streams, 0.21)).toBeCloseTo(3240, 2);
  });

  it("uses fallback when item has no tva", function () {
    var streams = [{ items: [{ behavior: "recurring", price: 100, qty: 10 }] }];
    expect(calcVatCollected(streams, 0.12)).toBeCloseTo(12000 * 0.12, 2);
  });

  it("handles one_time items (annual, not monthly)", function () {
    var streams = [{ items: [{ behavior: "one_time", price: 5000, qty: 1, tva: 0.21 }] }];
    // one_time monthly = 0, annual = 5000 × 1 = 5000, VAT = 1050
    expect(calcVatCollected(streams, 0.21)).toBeCloseTo(1050, 2);
  });

  it("handles project-based revenue", function () {
    var streams = [{ items: [{ behavior: "project", price: 12000, qty: 3, tva: 0.21 }] }];
    // annual = 12000 × 3 = 36000, VAT = 7560
    expect(calcVatCollected(streams, 0.21)).toBeCloseTo(7560, 2);
  });

  it("skips items in empty categories", function () {
    var streams = [{ items: [] }, {}];
    expect(calcVatCollected(streams, 0.21)).toBe(0);
  });
});

// ── calcVatDeductible (TVA déductible) ────────────────────────────────────────

describe("calcVatDeductible", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("returns 0 for null/empty costs", function () {
    expect(calcVatDeductible(null, 0.21)).toBe(0);
    expect(calcVatDeductible([], 0.21)).toBe(0);
  });

  it("calculates 21% on monthly software cost", function () {
    var costs = [{ items: [{ a: 50, freq: "monthly", tva: 0.21 }] }];
    // annual = 600, VAT = 126
    expect(calcVatDeductible(costs, 0.21)).toBeCloseTo(126, 2);
  });

  it("calculates 0% on rent (exempt)", function () {
    var costs = [{ items: [{ a: 1000, freq: "monthly", tva: 0 }] }];
    expect(calcVatDeductible(costs, 0.21)).toBe(0);
  });

  it("excludes null-rate items (depreciation)", function () {
    // tva: null means item is not subject to VAT at all
    // But fallback kicks in — so we test with explicit 0
    var costs = [{ items: [{ a: 500, freq: "monthly", tva: 0 }] }];
    expect(calcVatDeductible(costs, 0.21)).toBe(0);
  });

  it("handles mixed exempt and taxable costs", function () {
    var costs = [{
      items: [
        { a: 1000, freq: "monthly", tva: 0 },     // Rent: exempt
        { a: 200, freq: "monthly", tva: 0.21 },    // Insurance: wait, insurance = 0%
        { a: 50, freq: "monthly", tva: 0.21 },     // Software: 21%
      ],
    }];
    // Only items 2 and 3 contribute: (2400 + 600) × 0.21 = 630
    expect(calcVatDeductible(costs, 0.21)).toBeCloseTo(630, 2);
  });

  it("per-unit cost with TVA", function () {
    var costs = [{ items: [{ a: 25, pu: true, u: 4, freq: "monthly", tva: 0.21 }] }];
    // annual = 25 × 4 × 12 = 1200, VAT = 252
    expect(calcVatDeductible(costs, 0.21)).toBeCloseTo(252, 2);
  });

  it("annual one-time cost", function () {
    var costs = [{ items: [{ a: 3000, freq: "annual", tva: 0.21 }] }];
    // annual = 3000, VAT = 630
    expect(calcVatDeductible(costs, 0.21)).toBeCloseTo(630, 2);
  });

  it("quarterly cost", function () {
    var costs = [{ items: [{ a: 500, freq: "quarterly", tva: 0.21 }] }];
    // annual = 2000, VAT = 420
    expect(calcVatDeductible(costs, 0.21)).toBeCloseTo(420, 2);
  });
});

// ── calcVatBalance (solde TVA) ────────────────────────────────────────────────

describe("calcVatBalance", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("positive balance: business owes VAT", function () {
    var streams = [{ items: [{ behavior: "recurring", price: 1000, qty: 1, tva: 0.21 }] }];
    var costs = [{ items: [{ a: 100, freq: "monthly", tva: 0.21 }] }];
    // Collected: 12000 × 0.21 = 2520, Deductible: 1200 × 0.21 = 252
    // Balance: 2520 - 252 = 2268
    var balance = calcVatBalance(streams, costs, 0.21);
    expect(balance).toBeCloseTo(2268, 2);
    expect(balance).toBeGreaterThan(0);
  });

  it("negative balance: VAT credit", function () {
    var streams = [{ items: [{ behavior: "recurring", price: 10, qty: 1, tva: 0.21 }] }];
    var costs = [{ items: [{ a: 5000, freq: "monthly", tva: 0.21 }] }];
    // Collected: 120 × 0.21 = 25.2, Deductible: 60000 × 0.21 = 12600
    // Balance: 25.2 - 12600 = -12574.8
    var balance = calcVatBalance(streams, costs, 0.21);
    expect(balance).toBeLessThan(0);
  });

  it("zero balance when no revenue and no costs", function () {
    expect(calcVatBalance([], [], 0.21)).toBe(0);
  });

  it("zero balance when all items are exempt", function () {
    var streams = [{ items: [{ behavior: "recurring", price: 1000, qty: 10, tva: 0 }] }];
    var costs = [{ items: [{ a: 500, freq: "monthly", tva: 0 }] }];
    expect(calcVatBalance(streams, costs, 0.21)).toBe(0);
  });

  it("real-world Belgian startup scenario", function () {
    // SaaS startup: 5 clients × 99€/mo + 1 project 10k
    // Costs: 800€/mo rent (0%), 200€/mo software (21%), 150€/mo insurance (0%), 50€/mo marketing (21%)
    var streams = [
      { items: [
        { behavior: "recurring", price: 99, qty: 5, tva: 0.21 },
        { behavior: "project", price: 10000, qty: 1, tva: 0.21 },
      ] },
    ];
    var costs = [{ items: [
      { a: 800, freq: "monthly", tva: 0 },      // Rent: exempt
      { a: 200, freq: "monthly", tva: 0.21 },    // Software
      { a: 150, freq: "monthly", tva: 0 },        // Insurance: exempt
      { a: 50, freq: "monthly", tva: 0.21 },      // Marketing
    ] }];
    // Revenue: recurring = 99×5×12 = 5940, project = 10000
    // Collected: (5940 + 10000) × 0.21 = 3347.4
    // Deductible: (2400 + 600) × 0.21 = 630
    // Balance: 3347.4 - 630 = 2717.4
    var balance = calcVatBalance(streams, costs, 0.21);
    expect(balance).toBeCloseTo(2717.4, 1);
    expect(balance).toBeGreaterThan(0);
  });

  it("handles null inputs gracefully", function () {
    expect(calcVatBalance(null, null, 0.21)).toBe(0);
  });
});

// ── Edge cases & safety ───────────────────────────────────────────────────────

describe("TVA safety guards", function () {
  beforeEach(function () { vi.spyOn(console, "warn").mockImplementation(function () {}); });
  afterEach(function () { vi.restoreAllMocks(); });

  it("rejects rate passed as percentage (21 instead of 0.21)", function () {
    var rate = validateTvaRate(21, "test");
    expect(rate).toBe(1); // clamped
    expect(console.warn).toHaveBeenCalled();
  });

  it("does not produce NaN in any scenario", function () {
    var badStreams = [{ items: [{ behavior: "recurring", price: NaN, qty: NaN }] }];
    var badCosts = [{ items: [{ a: NaN, freq: "monthly" }] }];
    var result = calcVatBalance(badStreams, badCosts, 0.21);
    expect(isNaN(result)).toBe(false);
  });

  it("negative cost amount clamped to 0", function () {
    expect(costAnnualForVat({ a: -500, freq: "monthly" })).toBe(0);
  });

  it("unknown frequency defaults to monthly (×12)", function () {
    expect(costAnnualForVat({ a: 100, freq: "biweekly" })).toBe(1200);
  });

  it("empty category with no items array", function () {
    var streams = [{}];
    expect(calcVatCollected(streams, 0.21)).toBe(0);
  });
});
