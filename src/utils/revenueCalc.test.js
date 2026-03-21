import { describe, it, expect } from "vitest";
import { calcStreamMonthly, calcStreamAnnual, calcTotalRevenue, calcTotalMRR, calcStreamPcmn, calcStreamMonthlyBreakdown, calcTotalMonthlyBreakdown, migrateStreamsV1ToV2 } from "./revenueCalc.js";

describe("calcStreamMonthly", function () {
  it("recurring: price * qty", function () {
    expect(calcStreamMonthly({ behavior: "recurring", price: 49, qty: 10 })).toBeCloseTo(490, 0);
  });
  it("per_transaction: price * qty", function () {
    expect(calcStreamMonthly({ behavior: "per_transaction", price: 35, qty: 200 })).toBeCloseTo(7000, 0);
  });
  it("per_user: price * qty", function () {
    expect(calcStreamMonthly({ behavior: "per_user", price: 9, qty: 50 })).toBeCloseTo(450, 0);
  });
  it("project: annual / 12", function () {
    expect(calcStreamMonthly({ behavior: "project", price: 12000, qty: 3 })).toBeCloseTo(3000, 0);
  });
  it("daily_rate: annual / 12", function () {
    expect(calcStreamMonthly({ behavior: "daily_rate", price: 500, qty: 180 })).toBeCloseTo(7500, 0);
  });
  it("hourly: price * qty (monthly)", function () {
    expect(calcStreamMonthly({ behavior: "hourly", price: 75, qty: 40 })).toBeCloseTo(3000, 0);
  });
  it("commission: price * qty (monthly)", function () {
    expect(calcStreamMonthly({ behavior: "commission", price: 50, qty: 20 })).toBeCloseTo(1000, 0);
  });
  it("royalty: price * qty (monthly)", function () {
    expect(calcStreamMonthly({ behavior: "royalty", price: 10, qty: 100 })).toBeCloseTo(1000, 0);
  });
  it("one_time: 0 (excluded from MRR)", function () {
    expect(calcStreamMonthly({ behavior: "one_time", price: 5000, qty: 1 })).toBe(0);
  });
  it("handles zero qty", function () {
    expect(calcStreamMonthly({ behavior: "recurring", price: 49, qty: 0 })).toBe(0);
  });
  it("handles missing behavior (defaults to recurring)", function () {
    expect(calcStreamMonthly({ price: 100, qty: 5 })).toBeCloseTo(500, 0);
  });
});

describe("calcStreamAnnual", function () {
  it("recurring: price * qty * 12", function () {
    expect(calcStreamAnnual({ behavior: "recurring", price: 49, qty: 10 })).toBeCloseTo(5880, 0);
  });
  it("project: price * qty (already annual)", function () {
    expect(calcStreamAnnual({ behavior: "project", price: 5000, qty: 6 })).toBeCloseTo(30000, 0);
  });
  it("daily_rate: price * qty (already annual)", function () {
    expect(calcStreamAnnual({ behavior: "daily_rate", price: 500, qty: 180 })).toBeCloseTo(90000, 0);
  });
  it("hourly: price * qty * 12 (monthly → annual)", function () {
    expect(calcStreamAnnual({ behavior: "hourly", price: 75, qty: 40 })).toBeCloseTo(36000, 0);
  });
  it("commission: price * qty * 12 (monthly → annual)", function () {
    expect(calcStreamAnnual({ behavior: "commission", price: 50, qty: 20 })).toBeCloseTo(12000, 0);
  });
  it("royalty: price * qty * 12 (monthly → annual)", function () {
    expect(calcStreamAnnual({ behavior: "royalty", price: 10, qty: 100 })).toBeCloseTo(12000, 0);
  });
  it("one_time: price * qty", function () {
    expect(calcStreamAnnual({ behavior: "one_time", price: 500, qty: 3 })).toBeCloseTo(1500, 0);
  });
});

describe("calcTotalRevenue", function () {
  it("sums all stream annuals", function () {
    var streams = [
      { cat: "A", items: [
        { behavior: "recurring", price: 100, qty: 10 },
        { behavior: "one_time", price: 500, qty: 1 },
      ]},
    ];
    // recurring: 100*10*12 = 12000, one_time: 500*1 = 500
    expect(calcTotalRevenue(streams)).toBeCloseTo(12500, 0);
  });
  it("handles empty streams", function () {
    expect(calcTotalRevenue([])).toBe(0);
    expect(calcTotalRevenue(null)).toBe(0);
  });
});

describe("calcTotalMRR", function () {
  it("sums monthlies (excludes one_time)", function () {
    var streams = [
      { cat: "A", items: [
        { behavior: "recurring", price: 100, qty: 10 },
        { behavior: "one_time", price: 5000, qty: 1 },
      ]},
    ];
    expect(calcTotalMRR(streams)).toBeCloseTo(1000, 0); // only recurring
  });
});

describe("calcStreamPcmn", function () {
  it("returns correct PCMN for each behavior", function () {
    expect(calcStreamPcmn({ behavior: "recurring" })).toBe("7020");
    expect(calcStreamPcmn({ behavior: "per_transaction" })).toBe("7010");
    expect(calcStreamPcmn({ behavior: "hourly" })).toBe("7020");
    expect(calcStreamPcmn({ behavior: "commission" })).toBe("7030");
    expect(calcStreamPcmn({ behavior: "royalty" })).toBe("7500");
    expect(calcStreamPcmn({ behavior: "one_time" })).toBe("7500");
  });
  it("defaults to 7020 for unknown behavior", function () {
    expect(calcStreamPcmn({ behavior: "xyz" })).toBe("7020");
  });
});

describe("migrateStreamsV1ToV2", function () {
  it("migrates v1 format to v2", function () {
    var v1 = [
      { cat: "CA", pcmn: "70", items: [
        { id: "r1", l: "SaaS", y1: 12000, pcmn: "7020", sub: "Abo" },
        { id: "r2", l: "Produits", y1: 6000, pcmn: "7010", sub: "E-com" },
      ]},
    ];
    var v2 = migrateStreamsV1ToV2(v1);
    expect(v2[0].items[0].behavior).toBe("recurring");
    expect(v2[0].items[0].price).toBeCloseTo(1000, 0); // 12000/12
    expect(v2[0].items[1].behavior).toBe("per_transaction");
  });

  it("returns v2 format unchanged", function () {
    var v2 = [{ cat: "A", items: [{ id: "r1", l: "X", behavior: "recurring", price: 49, qty: 10 }] }];
    var result = migrateStreamsV1ToV2(v2);
    expect(result[0].items[0].behavior).toBe("recurring");
    expect(result[0].items[0].price).toBe(49);
  });

  it("handles empty", function () {
    expect(migrateStreamsV1ToV2([])).toEqual([]);
    expect(migrateStreamsV1ToV2(null)).toBeNull();
  });
});

var TEST_PROFILES = {
  flat: { coefs: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  summer_peak: { coefs: [0.7, 0.7, 0.8, 0.9, 1.1, 1.3, 1.4, 1.3, 1.0, 0.8, 0.7, 0.7] },
};

describe("calcStreamMonthlyBreakdown", function () {
  it("flat profile returns same value for all months", function () {
    var bd = calcStreamMonthlyBreakdown({ behavior: "recurring", price: 100, qty: 10, seasonProfile: "flat" }, TEST_PROFILES);
    expect(bd).toHaveLength(12);
    bd.forEach(function (v) { expect(v).toBeCloseTo(1000, 0); });
  });

  it("applies seasonal coefficients", function () {
    var bd = calcStreamMonthlyBreakdown({ behavior: "recurring", price: 100, qty: 10, seasonProfile: "summer_peak" }, TEST_PROFILES);
    expect(bd[0]).toBeCloseTo(700, 0);  // Jan: 1000 * 0.7
    expect(bd[6]).toBeCloseTo(1400, 0); // Jul: 1000 * 1.4
  });

  it("defaults to flat when no seasonProfile", function () {
    var bd = calcStreamMonthlyBreakdown({ behavior: "recurring", price: 50, qty: 4 }, TEST_PROFILES);
    bd.forEach(function (v) { expect(v).toBeCloseTo(200, 0); });
  });

  it("defaults to flat for unknown profile", function () {
    var bd = calcStreamMonthlyBreakdown({ behavior: "recurring", price: 50, qty: 4, seasonProfile: "nonexistent" }, TEST_PROFILES);
    bd.forEach(function (v) { expect(v).toBeCloseTo(200, 0); });
  });

  it("works with annual behaviors (project)", function () {
    var bd = calcStreamMonthlyBreakdown({ behavior: "project", price: 12000, qty: 1, seasonProfile: "summer_peak" }, TEST_PROFILES);
    // base monthly = 12000/12 = 1000
    expect(bd[6]).toBeCloseTo(1400, 0); // Jul peak
  });
});

describe("calcTotalMonthlyBreakdown", function () {
  it("aggregates multiple streams", function () {
    var streams = [{ cat: "A", items: [
      { behavior: "recurring", price: 100, qty: 10, seasonProfile: "flat" },
      { behavior: "recurring", price: 50, qty: 20, seasonProfile: "flat" },
    ]}];
    var bd = calcTotalMonthlyBreakdown(streams, TEST_PROFILES);
    // 1000 + 1000 = 2000 per month
    bd.forEach(function (v) { expect(v).toBeCloseTo(2000, 0); });
  });

  it("mixes seasonal profiles", function () {
    var streams = [{ cat: "A", items: [
      { behavior: "recurring", price: 100, qty: 10, seasonProfile: "flat" },
      { behavior: "recurring", price: 100, qty: 10, seasonProfile: "summer_peak" },
    ]}];
    var bd = calcTotalMonthlyBreakdown(streams, TEST_PROFILES);
    expect(bd[0]).toBeCloseTo(1700, 0);  // 1000 + 700
    expect(bd[6]).toBeCloseTo(2400, 0);  // 1000 + 1400
  });

  it("handles empty streams", function () {
    var bd = calcTotalMonthlyBreakdown([], TEST_PROFILES);
    bd.forEach(function (v) { expect(v).toBe(0); });
  });
});
