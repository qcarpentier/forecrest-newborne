import { describe, it, expect, beforeEach } from "vitest";
import { eur, eurShort, pct, nm, setCurrencyDisplay } from "./formatters.js";

// ─── eur ─────────────────────────────────────────────────────────────────────

describe("eur", () => {
  beforeEach(() => setCurrencyDisplay("EUR", {}, "fr-FR"));

  it("formate un entier", () => {
    expect(eur(1000)).toBe("1 000.00 EUR");
  });

  it("formate un décimal", () => {
    expect(eur(1234.5)).toBe("1 234.50 EUR");
  });

  it("gère null → 0.00", () => {
    expect(eur(null)).toBe("0.00 EUR");
  });

  it("gère NaN → 0.00", () => {
    expect(eur(NaN)).toBe("0.00 EUR");
  });

  it("gère Infinity → 0.00", () => {
    expect(eur(Infinity)).toBe("0.00 EUR");
  });

  it("gère les négatifs", () => {
    expect(eur(-500)).toBe("-500.00 EUR");
  });

  it("applique le taux de change USD", () => {
    setCurrencyDisplay("USD", { USD: 1.08 }, "en-US");
    var result = eur(1000);
    expect(result).toContain("USD");
    expect(result).toContain("1 080.00");
  });
});

// ─── eurShort ────────────────────────────────────────────────────────────────

describe("eurShort", () => {
  beforeEach(() => setCurrencyDisplay("EUR", {}, "fr-FR"));

  it("formate les millions (1 500 000 → 1.50M)", () => {
    expect(eurShort(1500000)).toBe("1.50M EUR");
  });

  it("formate les grands millions sans décimale (> 10M)", () => {
    expect(eurShort(12000000)).toBe("12.0M EUR");
  });

  it("formate les milliers (42 500 → 42.5k)", () => {
    expect(eurShort(42500)).toBe("42.5k EUR");
  });

  it("formate les grands milliers sans décimale (>= 100k)", () => {
    expect(eurShort(150000)).toBe("150k EUR");
  });

  it("formate les petites valeurs sans suffixe", () => {
    expect(eurShort(750)).toBe("750 EUR");
  });

  it("gère les négatifs", () => {
    expect(eurShort(-5000)).toBe("-5.0k EUR");
  });

  it("gère null → 0", () => {
    expect(eurShort(null)).toBe("0 EUR");
  });

  it("gère zéro", () => {
    expect(eurShort(0)).toBe("0 EUR");
  });
});

// ─── pct ─────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("formate 0.175 → 17.5%", () => {
    expect(pct(0.175)).toBe("17.5%");
  });

  it("formate 1 → 100.0%", () => {
    expect(pct(1)).toBe("100.0%");
  });

  it("formate 0 → 0.0%", () => {
    expect(pct(0)).toBe("0.0%");
  });

  it("gère null → 0.0%", () => {
    expect(pct(null)).toBe("0.0%");
  });

  it("gère NaN → 0.0%", () => {
    expect(pct(NaN)).toBe("0.0%");
  });

  it("gère les négatifs", () => {
    expect(pct(-0.05)).toBe("-5.0%");
  });

  it("taux ONSS patronal belge (25.07%)", () => {
    expect(pct(0.2507)).toBe("25.1%");
  });
});

// ─── nm ──────────────────────────────────────────────────────────────────────

describe("nm", () => {
  beforeEach(() => setCurrencyDisplay("EUR", {}, "fr-FR"));

  it("arrondit à l'entier", () => {
    // fr-FR utilise l'espace fine insécable (\u202f) comme séparateur de milliers
    expect(nm(1234.7)).toMatch(/1.235/);
    expect(nm(1234.7)).toContain("235");
  });

  it("gère null → 0", () => {
    expect(nm(null)).toBe("0");
  });

  it("gère NaN → 0", () => {
    expect(nm(NaN)).toBe("0");
  });

  it("gère zéro", () => {
    expect(nm(0)).toBe("0");
  });
});
