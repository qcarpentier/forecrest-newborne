import { describe, it, expect } from "vitest";
import { calcStreamMonthly, calcStreamAnnual, calcTotalRevenue, calcTotalMRR, calcStreamPcmn, migrateStreamsV1ToV2 } from "./revenueCalc.js";

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
