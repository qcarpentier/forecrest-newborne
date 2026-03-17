import { describe, it, expect, vi, afterEach } from "vitest";
import { grantCalc } from "../utils/calculations";

// Helper : crée une date ISO dans le passé
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
}

// Helper : crée un grant standard
function makeGrant(overrides) {
  return {
    grantDate: daysAgo(0),
    vestingMonths: 48,
    cliffMonths: 12,
    shares: 1000,
    fairValue: 2,
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

// ─── totalCost ────────────────────────────────────────────────────────────────

describe("grantCalc — totalCost", () => {
  it("totalCost = fairValue * shares", () => {
    var r = grantCalc(makeGrant({ fairValue: 3, shares: 500 }));
    expect(r.totalCost).toBe(1500);
  });

  it("monthlyExpense = totalCost / vestingMonths (pendant vesting)", () => {
    var r = grantCalc(makeGrant({ vestingMonths: 48, shares: 1000, fairValue: 2 }));
    // Grant récent → en cliff → monthlyExpense = totalCost / vm (non nul si pas complet)
    // Ici on est en cliff (0 mois écoulés < 12 mois cliff)
    expect(r.monthlyExpense).toBeCloseTo(2000 / 48, 6);
  });
});

// ─── status: cliff ────────────────────────────────────────────────────────────

describe("grantCalc — statut cliff", () => {
  it("status=cliff si elapsed < cliffMonths", () => {
    // Grant de 1 mois, cliff à 12 mois
    var r = grantCalc(makeGrant({ grantDate: daysAgo(30) }));
    expect(r.status).toBe("cliff");
  });

  it("vestedShares=0 pendant le cliff", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(30) }));
    expect(r.vestedShares).toBe(0);
  });

  it("unvestedShares = shares pendant le cliff", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(30), shares: 800 }));
    expect(r.unvestedShares).toBe(800);
  });
});

// ─── status: vesting ─────────────────────────────────────────────────────────

describe("grantCalc — statut vesting", () => {
  it("status=vesting après le cliff et avant la fin", () => {
    // Cliff 12 mois, vesting 48 mois → après ~18 mois (549 jours) = en vesting
    var r = grantCalc(makeGrant({ grantDate: daysAgo(549) }));
    expect(r.status).toBe("vesting");
  });

  it("vestedShares > 0 après le cliff", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(549) }));
    expect(r.vestedShares).toBeGreaterThan(0);
  });

  it("vestedShares < shares pendant le vesting", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(549) }));
    expect(r.vestedShares).toBeLessThan(1000);
  });

  it("monthlyExpense > 0 pendant le vesting", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(549) }));
    expect(r.monthlyExpense).toBeGreaterThan(0);
  });
});

// ─── status: complete ─────────────────────────────────────────────────────────

describe("grantCalc — statut complete", () => {
  it("status=complete après vestingMonths", () => {
    // 50 mois écoulés, vesting 48 mois
    var r = grantCalc(makeGrant({ grantDate: daysAgo(50 * 30), vestingMonths: 48 }));
    expect(r.status).toBe("complete");
  });

  it("vestedShares = shares à la fin du vesting", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(50 * 30), vestingMonths: 48, shares: 1000 }));
    expect(r.vestedShares).toBe(1000);
  });

  it("monthlyExpense = 0 après la fin du vesting (plus de charge IFRS 2)", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(50 * 30), vestingMonths: 48 }));
    expect(r.monthlyExpense).toBe(0);
  });

  it("unvestedShares = 0 à la fin du vesting", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(50 * 30), vestingMonths: 48, shares: 1000 }));
    expect(r.unvestedShares).toBe(0);
  });
});

// ─── vestedPct ────────────────────────────────────────────────────────────────

describe("grantCalc — vestedPct", () => {
  it("vestedPct = 0 si shares = 0", () => {
    var r = grantCalc(makeGrant({ shares: 0 }));
    expect(r.vestedPct).toBe(0);
  });

  it("vestedPct = 1 après vesting complet", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(50 * 30), vestingMonths: 48 }));
    expect(r.vestedPct).toBe(1);
  });

  it("vestedPct entre 0 et 1 pendant le vesting", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(549) }));
    expect(r.vestedPct).toBeGreaterThan(0);
    expect(r.vestedPct).toBeLessThan(1);
  });
});

// ─── recognizedCost ───────────────────────────────────────────────────────────

describe("grantCalc — recognizedCost", () => {
  it("recognizedCost = 0 au début (pas de charge reconnue)", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(0) }));
    expect(r.recognizedCost).toBeCloseTo(0, 1);
  });

  it("recognizedCost = totalCost après vesting complet", () => {
    var r = grantCalc(makeGrant({ grantDate: daysAgo(50 * 30), vestingMonths: 48, shares: 500, fairValue: 3 }));
    expect(r.recognizedCost).toBeCloseTo(r.totalCost, 1);
  });
});
