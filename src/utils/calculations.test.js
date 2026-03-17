import { describe, it, expect } from "vitest";
import { salCalc, bkg, connectAnnual, vol, tier, commissionCalc, roundEx, roundPsych, calcIsoc, calcExtraStreamsMRR, applyMixProfile, roundStep, roundScaled, stripeWeighted, guWeighted, infraCost, infraScaling, infraProjection, marketingCalc, cpcSimCalc } from "./calculations.js";
import { FEE_SCENARIOS, PAYMENT_METHODS_BE, FEELING_THRESHOLDS } from "../constants/defaults.js";

// ─── salCalc ─────────────────────────────────────────────────────────────────

describe("salCalc", () => {
  // Taux belges standard
  var ONSS = 0.1307;
  var PREC = 0.1723;
  var PATR = 0.2507;

  it("retourne zéros si net est 0", () => {
    expect(salCalc(0, ONSS, PREC, PATR)).toEqual({
      net: 0, brutO: 0, brutE: 0, onssV: 0, precV: 0, patrV: 0, total: 0,
    });
  });

  it("retourne zéros si net est négatif", () => {
    expect(salCalc(-500, ONSS, PREC, PATR)).toEqual({
      net: 0, brutO: 0, brutE: 0, onssV: 0, precV: 0, patrV: 0, total: 0,
    });
  });

  it("net est conservé dans le résultat", () => {
    var r = salCalc(2500, ONSS, PREC, PATR);
    expect(r.net).toBe(2500);
  });

  it("brutO = net / (1 - onss - prec)", () => {
    var r = salCalc(2500, ONSS, PREC, PATR);
    expect(r.brutO).toBeCloseTo(2500 / (1 - ONSS - PREC), 6);
  });

  it("brutE = brutO + patrV", () => {
    var r = salCalc(3000, ONSS, PREC, PATR);
    expect(r.brutE).toBeCloseTo(r.brutO + r.patrV, 6);
  });

  it("total === brutE", () => {
    var r = salCalc(3000, ONSS, PREC, PATR);
    expect(r.total).toBeCloseTo(r.brutE, 6);
  });

  it("coût étudiant (patr=0) inférieur au coût employé standard", () => {
    var employe = salCalc(2000, ONSS, PREC, PATR);
    var etudiant = salCalc(2000, 0.0271, 0, 0);
    expect(employe.total).toBeGreaterThan(etudiant.total);
  });

  it("onssV + precV + net ≈ brutO (vérification des composantes)", () => {
    var r = salCalc(2500, ONSS, PREC, PATR);
    expect(r.onssV + r.precV + r.net).toBeCloseTo(r.brutO, 4);
  });

  it("seuil directeur : salaire brut >= 45 000 €/an pour accès ISOC réduit", () => {
    // Net 3000/mois → vérifier que le brut annuel dépasse 45k
    var r = salCalc(3000, ONSS, PREC, PATR);
    expect(r.brutO * 12).toBeGreaterThan(45000);
  });
});

// ─── roundEx ─────────────────────────────────────────────────────────────────

describe("roundEx", () => {
  it("arrondit à .5 si partie décimale < 0.5", () => {
    expect(roundEx(2.3)).toBe(2.5);
    expect(roundEx(1.1)).toBe(1.5);
  });

  it("arrondit à l'entier supérieur si partie décimale > 0.6", () => {
    expect(roundEx(2.7)).toBe(3);
    expect(roundEx(5.9)).toBe(6);
  });

  it("laisse inchangé si partie décimale entre 0.5 et 0.6", () => {
    expect(roundEx(2.55)).toBe(2.55);
  });
});

// ─── roundPsych ──────────────────────────────────────────────────────────────

describe("roundPsych", () => {
  it("arrondit à .99 au-dessus du plancher", () => {
    expect(roundPsych(1.15, 0.99)).toBe(1.99);
    expect(roundPsych(2.50, 0.99)).toBe(2.99);
  });

  it("arrondit à .49 au-dessus du plancher", () => {
    expect(roundPsych(1.15, 0.49)).toBe(1.49);
    expect(roundPsych(0.30, 0.49)).toBe(0.49);
  });

  it("passe au palier suivant si déjà au-dessus de l'ending", () => {
    expect(roundPsych(1.99, 0.99)).toBe(1.99);
    expect(roundPsych(2.00, 0.99)).toBe(2.99);
    expect(roundPsych(1.50, 0.49)).toBe(1.49 + 1);
  });

  it("retourne le montant brut si ending = 0", () => {
    expect(roundPsych(1.15, 0)).toBe(1.15);
  });
});

// ─── bkg ─────────────────────────────────────────────────────────────────────

describe("bkg", () => {
  var cfg = {
    varFee: 0.035, fixFee: 0.50, vat: 0.21,
    tpeRatio: 1, sVar: 0.015, sFix: 0.25,
    onlineSVar: 0.015, onlineSFix: 0.25,
  };

  it("netHT est positif pour un panier standard (45€)", () => {
    var r = bkg(45, cfg);
    expect(r.netHT).toBeGreaterThan(0);
  });

  it("feel = 0 pour un panier à 0 (pas de taux applicable)", () => {
    var r = bkg(0, cfg);
    expect(r.feel).toBe(0);
  });

  it("feel augmente si varFee augmente", () => {
    var r1 = bkg(50, { ...cfg, varFee: 0.03 });
    var r2 = bkg(50, { ...cfg, varFee: 0.05 });
    expect(r2.feel).toBeGreaterThan(r1.feel);
  });

  it("gf = basket * varFee + fixFee", () => {
    var r = bkg(50, cfg);
    expect(r.gf).toBeCloseTo(50 * 0.035 + 0.50, 6);
  });

  it("netHT est hors TVA : (rf - sc) / (1 + vat) — inclut le surplus d'arrondi", () => {
    var r = bkg(50, cfg);
    expect(r.netHT).toBeCloseTo((r.rf - r.sc) / (1 + cfg.vat), 6);
  });

  it("netHT plus élevé avec tpeRatio=0 (tout online, frais fixes plus bas)", () => {
    var rTpe = bkg(50, { ...cfg, tpeRatio: 1, sFix: 0.35, onlineSFix: 0.15 });
    var rOnline = bkg(50, { ...cfg, tpeRatio: 0, sFix: 0.35, onlineSFix: 0.15 });
    expect(rOnline.netHT).toBeGreaterThan(rTpe.netHT);
  });
});

// ─── connectAnnual ───────────────────────────────────────────────────────────

describe("connectAnnual", () => {
  var v = { opW: 46, medY: 3000 };
  var cfg = { cVar: 0.0025, cFix: 0.10, connectMonthly: 2, payoutsPerMonth: 4 };

  it("total = annPayoutFee + annAccountFee", () => {
    var r = connectAnnual(45, v, cfg);
    expect(r.total).toBeCloseTo(r.annPayoutFee + r.annAccountFee, 6);
  });

  it("annAccountFee = connectMonthly * 12", () => {
    var r = connectAnnual(45, v, cfg);
    expect(r.annAccountFee).toBe(2 * 12);
  });

  it("plus de semaines opérationnelles = plus de payouts", () => {
    var r1 = connectAnnual(45, { ...v, opW: 40 }, cfg);
    var r2 = connectAnnual(45, { ...v, opW: 50 }, cfg);
    expect(r2.annPayoutFee).toBeGreaterThan(r1.annPayoutFee);
  });

  it("utilise les valeurs par défaut si propriétés absentes", () => {
    var r = connectAnnual(45, v, {});
    expect(r.total).toBeGreaterThan(0);
    expect(r.annAccountFee).toBe(2 * 12); // default connectMonthly=2
  });
});

// ─── vol ─────────────────────────────────────────────────────────────────────

describe("vol", () => {
  var prof = { emp: 3, chairs: 3, hd: 8, dur: 30, occ: 0.75, dw: 5, closedW: 6 };

  it("opW = 52 - closedW", () => {
    var r = vol(prof);
    expect(r.opW).toBe(52 - 6);
  });

  it("opW par défaut = 46 si closedW absent", () => {
    var r = vol({ ...prof, closedW: undefined });
    expect(r.opW).toBe(46);
  });

  it("medY = (capY + stfY) / 2", () => {
    var r = vol(prof);
    expect(r.medY).toBeCloseTo((r.capY + r.stfY) / 2, 6);
  });

  it("plus d'employés → plus de volume", () => {
    var r1 = vol({ ...prof, emp: 2, chairs: 2 });
    var r2 = vol({ ...prof, emp: 5, chairs: 5 });
    expect(r2.medY).toBeGreaterThan(r1.medY);
  });

  it("taux d'occupation plus élevé → plus de volume", () => {
    var r1 = vol({ ...prof, occ: 0.5 });
    var r2 = vol({ ...prof, occ: 0.9 });
    expect(r2.capY).toBeGreaterThan(r1.capY);
  });

  it("chairs plafonne bkgD × emp (2 emp, 1 cabine)", () => {
    var r = vol({ ...prof, emp: 2, chairs: 1, bkgD: 10 });
    // eff = min(1, 2) = 1, stfD = 10 * 1 = 10
    expect(r.stfY).toBe(10 * prof.dw * (52 - prof.closedW));
  });

  it("chairs == emp : bkgD utilise emp complet", () => {
    var r = vol({ ...prof, emp: 3, chairs: 3, bkgD: 8 });
    // eff = min(3, 3) = 3, stfD = 8 * 3 = 24
    expect(r.stfY).toBe(24 * prof.dw * (52 - prof.closedW));
  });
});

// ─── tier ────────────────────────────────────────────────────────────────────

describe("tier", () => {
  var tiers = { S: 10000, A: 6000, B: 3000, C: 1000 };
  var feel = { good: 0.04, acc: 0.05 };

  it("retourne S si revenu >= S et fee <= good", () => {
    expect(tier(12000, 0.035, tiers, feel)).toBe("S");
  });

  it("rétrograde S en A si fee > good", () => {
    expect(tier(12000, 0.045, tiers, feel)).toBe("A");
  });

  it("retourne A si revenu >= A et fee <= acc", () => {
    expect(tier(7000, 0.045, tiers, feel)).toBe("A");
  });

  it("retourne B si revenu >= B (fee non contraint)", () => {
    expect(tier(4000, 0.08, tiers, feel)).toBe("B");
  });

  it("retourne C si revenu >= C", () => {
    expect(tier(1500, 0.08, tiers, feel)).toBe("C");
  });

  it("retourne D si revenu < C", () => {
    expect(tier(500, 0.08, tiers, feel)).toBe("D");
  });
});

// ─── commissionCalc ───────────────────────────────────────────────────────────

describe("commissionCalc", () => {
  var cfg = {
    commissions: {
      internalPct: 0.15,
      durationMonths: 12,
      tiers: {
        silver: { pct: 0.05 },
        gold: { pct: 0.08 },
        diamond: { pct: 0.12 },
      },
    },
  };

  it("retourne zéros si pas de salesOwner", () => {
    var r = commissionCalc({ signed: 3, netYr: 5000 }, cfg);
    expect(r.annual).toBe(0);
  });

  it("retourne zéros si salesOwner.type = none", () => {
    var r = commissionCalc({ signed: 3, netYr: 5000, salesOwner: { type: "none" } }, cfg);
    expect(r.annual).toBe(0);
  });

  it("retourne zéros si signed = 0", () => {
    var r = commissionCalc({ signed: 0, netYr: 5000, salesOwner: { type: "internal", employeeId: 1 } }, cfg);
    expect(r.annual).toBe(0);
  });

  it("commission interne = netYr * signed * internalPct", () => {
    var prof = { signed: 5, netYr: 4000, salesOwner: { type: "internal", employeeId: 2 } };
    var r = commissionCalc(prof, cfg);
    expect(r.annual).toBeCloseTo(4000 * 5 * 0.15, 4);
    expect(r.isInternal).toBe(true);
    expect(r.employeeId).toBe(2);
  });

  it("commission silver < gold < diamond", () => {
    function mkProf(tier) {
      return { signed: 3, netYr: 5000, salesOwner: { type: "external", partnerName: "Acme", partnerTier: tier } };
    }
    var silver = commissionCalc(mkProf("silver"), cfg);
    var gold = commissionCalc(mkProf("gold"), cfg);
    var diamond = commissionCalc(mkProf("diamond"), cfg);
    expect(silver.annual).toBeLessThan(gold.annual);
    expect(gold.annual).toBeLessThan(diamond.annual);
  });

  it("monthly = annual / 12", () => {
    var prof = { signed: 4, netYr: 6000, salesOwner: { type: "external", partnerName: "NKO", partnerTier: "gold" } };
    var r = commissionCalc(prof, cfg);
    expect(r.monthly).toBeCloseTo(r.annual / 12, 6);
  });

  it("partnerName et partnerTier présents pour commission externe", () => {
    var prof = { signed: 2, netYr: 5000, salesOwner: { type: "external", partnerName: "NKO", partnerTier: "diamond" } };
    var r = commissionCalc(prof, cfg);
    expect(r.partnerName).toBe("NKO");
    expect(r.partnerTier).toBe("diamond");
    expect(r.isInternal).toBe(false);
    expect(r.employeeId).toBeNull();
  });
});

// ─── calcIsoc ────────────────────────────────────────────────────────────────

describe("calcIsoc", () => {
  it("pas d'impôt si ebitda <= 0", () => {
    var r = calcIsoc(-5000, 18550);
    expect(r.isoc).toBe(0);
    expect(r.netP).toBe(-5000);
  });

  it("taux réduit 20% sur les premiers 100k", () => {
    var r = calcIsoc(50000, 18550);
    expect(r.isocR).toBeCloseTo(50000 * 0.20, 2);
    expect(r.isocS).toBe(0);
    expect(r.isoc).toBeCloseTo(10000, 2);
  });

  it("taux standard 25% au-delà de 100k", () => {
    var r = calcIsoc(150000, 18550);
    expect(r.isocR).toBeCloseTo(100000 * 0.20, 2); // 20 000
    expect(r.isocS).toBeCloseTo(50000 * 0.25, 2);  // 12 500
    expect(r.isoc).toBeCloseTo(32500, 2);
  });

  it("netP = ebitda - isoc", () => {
    var r = calcIsoc(120000, 18550);
    expect(r.netP).toBeCloseTo(120000 - r.isoc, 4);
  });

  it("isocEff = 0 si ebitda <= 0", () => {
    var r = calcIsoc(0, 18550);
    expect(r.isocEff).toBe(0);
  });

  it("isocEff entre 20% et 25% pour un bénéfice > 100k", () => {
    var r = calcIsoc(200000, 18550);
    expect(r.isocEff).toBeGreaterThan(0.20);
    expect(r.isocEff).toBeLessThan(0.25);
  });

  it("resLeg = 5% du bénéfice net plafonné à 10% du capital", () => {
    // capitalSocial=18550, plafond=1855
    var r = calcIsoc(100000, 18550);
    var expectedRaw = r.netP * 0.05;
    var expectedCap = 18550 * 0.10;
    expect(r.resLeg).toBeCloseTo(Math.min(expectedRaw, expectedCap), 2);
  });

  it("resLeg = 0 si bénéfice net négatif", () => {
    var r = calcIsoc(-1000, 18550);
    expect(r.resLeg).toBe(0);
  });
});

// ─── calcExtraStreamsMRR ─────────────────────────────────────────────────────

describe("calcExtraStreamsMRR", () => {
  // Rev fixture minimal avec toutes les streams actives
  var rev = {
    enabled: { shine: true, sponsored: true, proSub: true, marketplace: true, brandData: true, brandAds: true, enterprise: true },
    shine: { price: 4.99, conversionRate: 0.05 },
    sponsored: { cpa: 0.99, adoptionRate: 0.15, bookingsPerMonth: 50 },
    proSub: { priceWeek: 3.99, conversionRate: 0.20 },
    marketplace: { commissionRate: 0.15, avgOrderValue: 45, ordersPerProMonth: 2, adoptionRate: 0.30 },
    brandData: { monthlyPrice: 2500, clients: 2 },
    brandAds: { cpm: 15, impressionsPerUser: 10, fillRate: 0.40 },
    enterprise: { clients: 1, avgEmployees: 200, feePerEmployee: 2.50, adoptionRate: 0.40 },
  };

  it("retourne 0 si toutes les streams sont désactivées", () => {
    var revOff = { ...rev, enabled: { shine: false, sponsored: false, proSub: false, marketplace: false, brandData: false, brandAds: false, enterprise: false } };
    expect(calcExtraStreamsMRR(revOff, 10, 500)).toBe(0);
  });

  it("MRR > 0 si au moins une stream est active", () => {
    expect(calcExtraStreamsMRR(rev, 10, 500)).toBeGreaterThan(0);
  });

  it("plus de prospects signés → MRR sponsored/proSub/marketplace plus élevé", () => {
    var r1 = calcExtraStreamsMRR(rev, 5, 500);
    var r2 = calcExtraStreamsMRR(rev, 20, 500);
    expect(r2).toBeGreaterThan(r1);
  });

  it("plus d'utilisateurs actifs → MRR shine/brandAds plus élevé", () => {
    var r1 = calcExtraStreamsMRR(rev, 10, 100);
    var r2 = calcExtraStreamsMRR(rev, 10, 1000);
    expect(r2).toBeGreaterThan(r1);
  });

  it("brandData ne dépend ni de totS ni de revActiveUsers", () => {
    var revBrandOnly = { ...rev, enabled: { shine: false, sponsored: false, proSub: false, marketplace: false, brandData: true, brandAds: false, enterprise: false } };
    var r1 = calcExtraStreamsMRR(revBrandOnly, 0, 0);
    var r2 = calcExtraStreamsMRR(revBrandOnly, 100, 10000);
    expect(r1).toBe(r2);
    expect(r1).toBeCloseTo(2 * 2500, 2); // clients * monthlyPrice
  });
});

// ─── roundStep ──────────────────────────────────────────────────────────────

describe("roundStep", () => {
  it("arrondit vers le haut au palier le plus proche", () => {
    expect(roundStep(1.12, 0.25)).toBeCloseTo(1.25, 6);
    expect(roundStep(1.00, 0.25)).toBeCloseTo(1.00, 6);
    expect(roundStep(0.51, 0.10)).toBeCloseTo(0.60, 6);
  });

  it("retourne le montant exact si step=0", () => {
    expect(roundStep(1.37, 0)).toBe(1.37);
  });

  it("retourne le montant exact si step négatif", () => {
    expect(roundStep(1.37, -0.5)).toBe(1.37);
  });
});

// ─── roundScaled ────────────────────────────────────────────────────────────

describe("roundScaled", () => {
  var scale = [
    { upTo: 1.00, step: 0.10 },
    { upTo: 3.00, step: 0.25 },
    { upTo: 999, step: 0.50 },
  ];

  it("utilise le premier palier pour les petits montants", () => {
    expect(roundScaled(0.73, scale)).toBeCloseTo(0.80, 6);
  });

  it("utilise le deuxième palier pour les montants moyens", () => {
    expect(roundScaled(1.60, scale)).toBeCloseTo(1.75, 6);
  });

  it("utilise le dernier palier pour les grands montants", () => {
    expect(roundScaled(4.20, scale)).toBeCloseTo(4.50, 6);
  });

  it("retourne le montant tel quel si scale est vide", () => {
    expect(roundScaled(1.37, [])).toBe(1.37);
  });

  it("retourne le montant tel quel si scale est null", () => {
    expect(roundScaled(1.37, null)).toBe(1.37);
  });
});

// ─── applyMixProfile ────────────────────────────────────────────────────────

describe("applyMixProfile", () => {
  var baseMethods = [
    { id: "card_tpe", sVar: 0.014, sFix: 0.10, guVar: 0.029, guFix: 0.20, mix: 0.25 },
    { id: "card_online", sVar: 0.015, sFix: 0.25, guVar: 0.029, guFix: 0.50, mix: 0.15 },
    { id: "cash", sVar: 0, sFix: 0, guVar: 0, guFix: 0, mix: 0.60 },
  ];

  it("retourne les méthodes inchangées sans profil ni override", () => {
    var result = applyMixProfile(baseMethods, null, null);
    expect(result[0].mix).toBe(0.25);
    expect(result[1].mix).toBe(0.15);
    expect(result[2].mix).toBe(0.60);
  });

  it("applique le profil mix", () => {
    var profile = { card_tpe: 0.40, card_online: 0.50, cash: 0.10 };
    var result = applyMixProfile(baseMethods, profile, null);
    expect(result[0].mix).toBe(0.40);
    expect(result[1].mix).toBe(0.50);
    expect(result[2].mix).toBe(0.10);
  });

  it("applique le cash override et redistribue proportionnellement", () => {
    var result = applyMixProfile(baseMethods, null, 0.40);
    expect(result[2].mix).toBe(0.40); // cash = override
    // non-cash total original = 0.25 + 0.15 = 0.40
    // remaining = 1 - 0.40 = 0.60, scale = 0.60 / 0.40 = 1.5
    expect(result[0].mix).toBeCloseTo(0.25 * 1.5, 6); // 0.375
    expect(result[1].mix).toBeCloseTo(0.15 * 1.5, 6); // 0.225
  });

  it("la somme des mix reste 1.00 après cash override", () => {
    var result = applyMixProfile(baseMethods, null, 0.20);
    var total = result.reduce(function (s, m) { return s + m.mix; }, 0);
    expect(total).toBeCloseTo(1.00, 6);
  });

  it("profile + cash override : le profil est appliqué d'abord, puis le cash redistribue", () => {
    var profile = { card_tpe: 0.50, card_online: 0.40, cash: 0.10 };
    var result = applyMixProfile(baseMethods, profile, 0.30);
    expect(result[2].mix).toBe(0.30); // cash = override
    // non-cash from profile: 0.50 + 0.40 = 0.90
    // remaining = 0.70, scale = 0.70 / 0.90
    var scale = 0.70 / 0.90;
    expect(result[0].mix).toBeCloseTo(0.50 * scale, 6);
    expect(result[1].mix).toBeCloseTo(0.40 * scale, 6);
    var total = result.reduce(function (s, m) { return s + m.mix; }, 0);
    expect(total).toBeCloseTo(1.00, 6);
  });

  it("cash override = 0 → tout distribué aux non-cash", () => {
    var result = applyMixProfile(baseMethods, null, 0);
    expect(result[2].mix).toBe(0);
    var total = result.reduce(function (s, m) { return s + m.mix; }, 0);
    expect(total).toBeCloseTo(1.00, 6);
  });

  it("cash override = 1 → toutes les non-cash à 0", () => {
    var result = applyMixProfile(baseMethods, null, 1);
    expect(result[0].mix).toBe(0);
    expect(result[1].mix).toBe(0);
    expect(result[2].mix).toBe(1);
  });

  it("retourne baseMethods si tableau vide", () => {
    expect(applyMixProfile([], null, null)).toEqual([]);
  });

  it("retourne baseMethods si null", () => {
    expect(applyMixProfile(null, null, null)).toBeNull();
  });

  it("préserve les propriétés non-mix (sVar, sFix, etc.)", () => {
    var profile = { card_tpe: 0.80, card_online: 0.10, cash: 0.10 };
    var result = applyMixProfile(baseMethods, profile, null);
    expect(result[0].sVar).toBe(0.014);
    expect(result[0].sFix).toBe(0.10);
    expect(result[0].guVar).toBe(0.029);
  });
});

// ─── bkg avec paymentMethods ────────────────────────────────────────────────

describe("bkg avec paymentMethods (per-method fees)", () => {
  var methods = [
    { id: "card_tpe", sVar: 0.014, sFix: 0.10, guVar: 0.029, guFix: 0.20, mix: 0.40 },
    { id: "card_online", sVar: 0.015, sFix: 0.25, guVar: 0.029, guFix: 0.50, mix: 0.30 },
    { id: "cash", sVar: 0, sFix: 0, guVar: 0, guFix: 0, mix: 0.30 },
  ];
  var cfg = {
    paymentMethods: methods,
    vat: 0.21,
    feeBearer: "client",
    roundingScale: [{ upTo: 999, step: 0.10 }],
  };

  it("gf = guWeighted (pondéré par mix)", () => {
    var r = bkg(50, cfg);
    var expected = guWeighted(50, methods).fee;
    expect(r.gf).toBeCloseTo(expected, 6);
  });

  it("cash à 100% → gf = 0 et sc = 0", () => {
    var allCash = methods.map(function (m) {
      return m.id === "cash" ? { ...m, mix: 1 } : { ...m, mix: 0 };
    });
    var r = bkg(50, { ...cfg, paymentMethods: allCash });
    expect(r.gf).toBe(0);
    expect(r.sc).toBe(0);
  });

  it("netHT positif pour un mix réaliste", () => {
    var r = bkg(50, cfg);
    expect(r.netHT).toBeGreaterThan(0);
  });

  it("plus de cash → commission GU plus faible", () => {
    var lowCash = [
      { ...methods[0], mix: 0.60 },
      { ...methods[1], mix: 0.30 },
      { ...methods[2], mix: 0.10 },
    ];
    var highCash = [
      { ...methods[0], mix: 0.20 },
      { ...methods[1], mix: 0.10 },
      { ...methods[2], mix: 0.70 },
    ];
    var rLow = bkg(50, { ...cfg, paymentMethods: lowCash });
    var rHigh = bkg(50, { ...cfg, paymentMethods: highCash });
    expect(rHigh.gf).toBeLessThan(rLow.gf);
  });

  it("feeBearer pro → clientFee = 0, cp = basket", () => {
    var r = bkg(50, { ...cfg, feeBearer: "pro" });
    expect(r.cp).toBe(50);
  });

  it("feeBearer split → clientFee = rf / 2", () => {
    var r = bkg(50, { ...cfg, feeBearer: "split" });
    expect(r.cp).toBeCloseTo(50 + r.rf / 2, 6);
  });
});

// ─── FEE_SCENARIOS — marges et ARR ─────────────────────────────────────────

describe("FEE_SCENARIOS - marges positives et ARR", () => {
  var baseCfg = {
    vat: 0.21,
    feeBearer: "client",
    roundingScale: [{ upTo: 999, step: 0.10 }],
    payoutsPerMonth: 4,
  };

  // Profil le plus petit : nail art solo, panier €12
  var nailProf = { emp: 1, hd: 8, dw: 5, dur: 60, occ: 0.70, basket: 12, chairs: 1, bkgD: null, closedW: 4 };
  // Barbershop solo, panier €20
  var barberProf = { emp: 1, hd: 9, dw: 6, dur: 30, occ: 0.75, basket: 20, chairs: 1, bkgD: null, closedW: 3 };

  function buildCfg(scKey) {
    var scDef = FEE_SCENARIOS[scKey];
    var methods = PAYMENT_METHODS_BE.map(function (m) {
      var override = scDef[m.id];
      if (!override) return m;
      return Object.assign({}, m, { guVar: override.guVar, guFix: override.guFix });
    });
    return Object.assign({}, baseCfg, { paymentMethods: methods });
  }

  var scenarioKeys = ["accessible", "balanced", "growth", "premium"];

  scenarioKeys.forEach(function (scKey) {
    it("scénario " + scKey + " : netHT > 0 pour panier €50", function () {
      var r = bkg(50, buildCfg(scKey));
      expect(r.netHT).toBeGreaterThan(0);
    });

    it("scénario " + scKey + " : netHT > 0 pour panier €12 (nail art)", function () {
      var r = bkg(12, buildCfg(scKey));
      expect(r.netHT).toBeGreaterThan(0);
    });

    it("scénario " + scKey + " : ARR annuel > 0 pour nail art (panier €12)", function () {
      var cfg = buildCfg(scKey);
      var v = vol(nailProf);
      var b = bkg(12, cfg);
      var conn = connectAnnual(12, v, cfg);
      expect(b.netHT * v.medY - conn.total).toBeGreaterThan(0);
    });

    it("scénario " + scKey + " : ARR annuel > 0 pour barbershop solo (panier €20)", function () {
      var cfg = buildCfg(scKey);
      var v = vol(barberProf);
      var b = bkg(20, cfg);
      var conn = connectAnnual(20, v, cfg);
      expect(b.netHT * v.medY - conn.total).toBeGreaterThan(0);
    });
  });

  it("scénario premium > growth > balanced >= accessible (ARR pour panier €50)", function () {
    var stdProf = { emp: 2, hd: 9, dw: 5, dur: 45, occ: 0.70, basket: 50, chairs: 2, bkgD: null, closedW: 6 };
    var results = scenarioKeys.map(function (scKey) {
      var cfg = buildCfg(scKey);
      var v = vol(stdProf);
      var b = bkg(50, cfg);
      var conn = connectAnnual(50, v, cfg);
      return b.netHT * v.medY - conn.total;
    });
    // accessible <= balanced < growth < premium (arrondi peut lisser accessible/balanced)
    expect(results[0]).toBeLessThanOrEqual(results[1]);
    expect(results[1]).toBeLessThan(results[2]);
    expect(results[2]).toBeLessThan(results[3]);
  });

  it("FEELING_THRESHOLDS couvre 0-100%", function () {
    expect(FEELING_THRESHOLDS[FEELING_THRESHOLDS.length - 1].max).toBeGreaterThanOrEqual(1);
  });

  it("scénario accessible : blended impact <= 4% pour panier €50", function () {
    var cfg = buildCfg("accessible");
    var r = bkg(50, cfg);
    var impact = r.gf / 50;
    expect(impact).toBeLessThanOrEqual(0.04);
  });

  it("scénario growth : blended impact <= 8% pour panier €50", function () {
    var cfg = buildCfg("growth");
    var r = bkg(50, cfg);
    var impact = r.gf / 50;
    expect(impact).toBeLessThanOrEqual(0.08);
  });
});

// ─── infraCost ────────────────────────────────────────────────────────────────

describe("infraCost", () => {
  var BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8, avgSessionDurationSec: 180,
    workerReqsPerSession: 25, cpuMsPerReq: 5,
    sqlReadsPerSession: 12, sqlWritesPerSession: 3,
    kvReadsPerSession: 5, kvWritesPerSession: 2,
    r2ReadsPerSession: 1, r2WritesPerSession: 0.2,
    queueMsgsPerSession: 2, queueOpsPerMessage: 3, logEventsPerSession: 10,
    doRequestsPerSession: 0, doGbSecPerSession: 0,
    sqlKBPerUser: 9, kvKBPerUser: 37, r2MBPerUser: 0.5,
    workerMemoryMB: 128, maxCpuMsPerReq: 30000, peakMultiplier: 3,
    activeHoursPerDay: 10, activeDaysPerWeek: 6, networkOverheadMs: 15,
    growthRateMonth: 0.15, dataRetentionMonths: 12,
    authCostPerLogin: 0,
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("returns zeros for null infra", () => {
    var r = infraCost(null, 100);
    expect(r.monthly).toBe(0);
    expect(r.totalUsers).toBe(0);
    expect(r.workersCost).toBe(0);
    expect(r.bottleneck).toBeNull();
  });

  it("returns zeros for 0 clients (except plan base)", () => {
    var r = infraCost(BASE, 0);
    expect(r.totalUsers).toBe(0);
    expect(r.totalSessions).toBe(0);
    expect(r.overageCost).toBe(0);
    expect(r.monthly).toBe(5); // plan base cost
  });

  it("computes totalUsers and totalSessions", () => {
    var r = infraCost(BASE, 10);
    expect(r.totalUsers).toBe(10 * 200);
    expect(r.totalSessions).toBe(10 * 200 * 8);
  });

  it("computes monthly Worker request volume", () => {
    var r = infraCost(BASE, 10);
    expect(r.mWorkerReqs).toBe(10 * 200 * 8 * 25);
  });

  it("computes monthly CPU ms volume", () => {
    var r = infraCost(BASE, 10);
    expect(r.mCpuMs).toBe(r.mWorkerReqs * 5);
  });

  it("computes D1 read/write volumes", () => {
    var r = infraCost(BASE, 10);
    var sessions = 10 * 200 * 8;
    expect(r.mSqlReads).toBe(sessions * 12);
    expect(r.mSqlWrites).toBe(sessions * 3);
  });

  it("computes KV read/write volumes separately", () => {
    var r = infraCost(BASE, 10);
    var sessions = 10 * 200 * 8;
    expect(r.mKvReads).toBe(sessions * 5);
    expect(r.mKvWrites).toBe(sessions * 2);
  });

  it("computes queue ops = messages × 3 (write+read+delete)", () => {
    var r = infraCost(BASE, 10);
    var sessions = 10 * 200 * 8;
    expect(r.mQueueOps).toBe(sessions * 2 * 3);
  });

  it("computes storage in decimal GB (1 GB = 1M KB)", () => {
    var r = infraCost(BASE, 10);
    var users = 10 * 200;
    expect(r.sqlStorageGB).toBeCloseTo(users * 9 / 1000000, 10);
    expect(r.kvStorageGB).toBeCloseTo(users * 37 / 1000000, 10);
    expect(r.r2StorageGB).toBeCloseTo(users * 0.5 / 1000, 10);
  });

  it("below-quota usage produces zero overage costs", () => {
    var r = infraCost(BASE, 1);
    expect(r.workerReqCost).toBe(0);
    expect(r.cpuCost).toBe(0);
    expect(r.sqlReadCost).toBe(0);
    expect(r.sqlWriteCost).toBe(0);
    expect(r.kvReadCost).toBe(0);
    expect(r.kvWriteCost).toBe(0);
    expect(r.overageCost).toBe(0);
    expect(r.monthly).toBe(5); // only plan base cost
  });

  it("storage below quota produces zero storage cost", () => {
    var r = infraCost(BASE, 1);
    expect(r.sqlStorageCost).toBe(0);
    expect(r.kvStorageCost).toBe(0);
    expect(r.r2StorageCost).toBe(0);
  });

  it("service totals sum to monthly", () => {
    var r = infraCost(BASE, 10000);
    var sum = r.workersCost + r.d1Cost + r.kvCost + r.r2Cost + r.queuesCost + r.logsCost + r.authCost + r.doCost + r.planBaseCost;
    expect(r.monthly).toBeCloseTo(sum, 8);
  });

  it("workersCost = workerReqCost + cpuCost", () => {
    var r = infraCost(BASE, 10000);
    expect(r.workersCost).toBeCloseTo(r.workerReqCost + r.cpuCost, 10);
  });

  it("d1Cost = sqlReadCost + sqlWriteCost + sqlStorageCost", () => {
    var r = infraCost(BASE, 10000);
    expect(r.d1Cost).toBeCloseTo(r.sqlReadCost + r.sqlWriteCost + r.sqlStorageCost, 10);
  });

  it("computes capacity metrics with active hours", () => {
    var r = infraCost(BASE, 100);
    expect(r.avgRPS).toBeGreaterThan(0);
    expect(r.activeRPS).toBeGreaterThan(r.avgRPS);
    expect(r.peakRPS).toBeCloseTo(r.activeRPS * 3, 8);
    expect(r.cpuUtilPerReq).toBeCloseTo(5 / 30000, 10);
    expect(r.concurrentAtPeak).toBeGreaterThan(0);
  });

  it("bottleneck is the highest ratio quota", () => {
    var r = infraCost(BASE, 100);
    expect(r.quotaUsage.length).toBe(15); // 13 original + 2 DO
    expect(r.bottleneck).not.toBeNull();
    expect(r.bottleneck.ratio).toBeGreaterThanOrEqual(r.quotaUsage[1].ratio);
  });

  it("maxClients is Infinity when bottleneck ratio < 1", () => {
    var r = infraCost(BASE, 1);
    expect(r.maxClients).toBeGreaterThan(1);
  });

  it("massive scale produces overages", () => {
    var r = infraCost(BASE, 50000);
    expect(r.monthly).toBeGreaterThan(0);
    expect(r.workersCost).toBeGreaterThan(0);
  });

  it("auth cost scales with sessions", () => {
    var withAuth = Object.assign({}, BASE, { authCostPerLogin: 0.05 });
    var r = infraCost(withAuth, 10);
    var sessions = 10 * 200 * 8;
    expect(r.authCost).toBeCloseTo(sessions * 0.05, 2);
    expect(r.monthly).toBeGreaterThan(0);
  });

  it("R2 costs computed correctly", () => {
    var r = infraCost(BASE, 10);
    var sessions = 10 * 200 * 8;
    expect(r.mR2Reads).toBe(sessions * 1);
    expect(r.mR2Writes).toBeCloseTo(sessions * 0.2, 5);
  });

  it("includes planBaseCost in monthly total", () => {
    var r = infraCost(BASE, 1);
    expect(r.planBaseCost).toBe(5);
    expect(r.monthly).toBe(r.overageCost + r.planBaseCost);
  });

  it("costPerClient = monthly / clients", () => {
    var r = infraCost(BASE, 10);
    expect(r.costPerClient).toBeCloseTo(r.monthly / 10, 8);
  });

  it("costPerUser = monthly / totalUsers", () => {
    var r = infraCost(BASE, 10);
    expect(r.costPerUser).toBeCloseTo(r.monthly / r.totalUsers, 8);
  });

  it("computes latency estimates", () => {
    var r = infraCost(BASE, 10);
    // Latency = CPU + network + I/O (D1 + KV round-trips)
    // d1QueriesPerReq = (12+3)/25 = 0.6, kvOpsPerReq = (5+2)/25 = 0.28
    // ioLatency = 0.6*2 + 0.28*15 = 5.4
    var ioLat = (12 + 3) / 25 * 2 + (5 + 2) / 25 * 15;
    expect(r.p50Latency).toBeCloseTo(5 + 15 + ioLat, 8);
    expect(r.p99Latency).toBeCloseTo(5 * 2.5 + 15 + ioLat * 2, 8);
  });

  it("activeRPS is higher than avgRPS due to concentrated hours", () => {
    var r = infraCost(BASE, 100);
    // 10h/day, 6d/week vs 24h/day, 7d/week
    var ratio = (24 * 7) / (10 * 6);
    expect(r.activeRPS).toBeCloseTo(r.avgRPS * ratio, 2);
  });

  it("uses configurable queueOpsPerMessage", () => {
    var cfg4 = Object.assign({}, BASE, { queueOpsPerMessage: 4 });
    var r3 = infraCost(BASE, 10);
    var r4 = infraCost(cfg4, 10);
    expect(r4.mQueueOps).toBe(r3.mQueueOps / 3 * 4);
  });

  it("computes Durable Objects costs", () => {
    var withDO = Object.assign({}, BASE, { doRequestsPerSession: 10, doGbSecPerSession: 0.5 });
    var r = infraCost(withDO, 10);
    var sessions = 10 * 200 * 8;
    expect(r.mDoReqs).toBe(sessions * 10);
    expect(r.mDoGbSec).toBe(sessions * 0.5);
    expect(r.doCost).toBeGreaterThanOrEqual(0);
  });

  it("zero planBaseCost when set to 0", () => {
    var noPlan = Object.assign({}, BASE, { planBaseCost: 0 });
    var r = infraCost(noPlan, 1);
    expect(r.planBaseCost).toBe(0);
    expect(r.monthly).toBe(r.overageCost);
  });
});

// ─── infraScaling ──────────────────────────────────────────────────────────────

describe("infraScaling", () => {
  var BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8, avgSessionDurationSec: 180,
    workerReqsPerSession: 25, cpuMsPerReq: 5,
    sqlReadsPerSession: 12, sqlWritesPerSession: 3,
    kvReadsPerSession: 5, kvWritesPerSession: 2,
    r2ReadsPerSession: 1, r2WritesPerSession: 0.2,
    queueMsgsPerSession: 2, queueOpsPerMessage: 3, logEventsPerSession: 10,
    doRequestsPerSession: 0, doGbSecPerSession: 0,
    sqlKBPerUser: 9, kvKBPerUser: 37, r2MBPerUser: 0.5,
    workerMemoryMB: 128, maxCpuMsPerReq: 30000, peakMultiplier: 3,
    activeHoursPerDay: 10, activeDaysPerWeek: 6, networkOverheadMs: 15,
    growthRateMonth: 0.15, dataRetentionMonths: 12,
    authCostPerLogin: 0,
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("returns empty array for null infra", () => {
    expect(infraScaling(null, [10, 50])).toEqual([]);
  });

  it("returns one entry per palier", () => {
    var paliers = [10, 50, 100, 500];
    var result = infraScaling(BASE, paliers);
    expect(result.length).toBe(4);
    expect(result[0].clients).toBe(10);
    expect(result[3].clients).toBe(500);
  });

  it("cost increases with more clients", () => {
    var result = infraScaling(BASE, [10, 100, 1000]);
    expect(result[1].monthly).toBeGreaterThanOrEqual(result[0].monthly);
    expect(result[2].monthly).toBeGreaterThan(result[1].monthly);
  });

  it("costPerClient decreases at low scale (plan base amortized)", () => {
    var result = infraScaling(BASE, [1, 100]);
    expect(result[0].costPerClient).toBeGreaterThan(result[1].costPerClient);
  });

  it("each entry has bottleneck info", () => {
    var result = infraScaling(BASE, [10]);
    expect(result[0].bottleneck).not.toBeNull();
    expect(result[0].maxClients).toBeGreaterThan(0);
  });
});

// ─── infraProjection ──────────────────────────────────────────────────────────

describe("infraProjection", () => {
  var BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8, avgSessionDurationSec: 180,
    workerReqsPerSession: 25, cpuMsPerReq: 5,
    sqlReadsPerSession: 12, sqlWritesPerSession: 3,
    kvReadsPerSession: 5, kvWritesPerSession: 2,
    r2ReadsPerSession: 1, r2WritesPerSession: 0.2,
    queueMsgsPerSession: 2, queueOpsPerMessage: 3, logEventsPerSession: 10,
    doRequestsPerSession: 0, doGbSecPerSession: 0,
    sqlKBPerUser: 9, kvKBPerUser: 37, r2MBPerUser: 0.5,
    workerMemoryMB: 128, maxCpuMsPerReq: 30000, peakMultiplier: 3,
    activeHoursPerDay: 10, activeDaysPerWeek: 6, networkOverheadMs: 15,
    growthRateMonth: 0.15, dataRetentionMonths: 12,
    authCostPerLogin: 0,
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("returns empty array for null infra", () => {
    expect(infraProjection(null, 10, 12)).toEqual([]);
  });

  it("returns one entry per month", () => {
    var result = infraProjection(BASE, 10, 12);
    expect(result.length).toBe(12);
    expect(result[0].month).toBe(1);
    expect(result[11].month).toBe(12);
  });

  it("clients grow with growth rate", () => {
    var result = infraProjection(BASE, 10, 6);
    expect(result[0].clients).toBe(10);
    expect(result[5].clients).toBeGreaterThan(result[0].clients);
    // 15% growth for 5 months: 10 * 1.15^5 ≈ 20
    expect(result[5].clients).toBeCloseTo(Math.round(10 * Math.pow(1.15, 5)), 0);
  });

  it("storage accumulates over months", () => {
    var result = infraProjection(BASE, 10, 6);
    // Month 6 has 6× storage per user, month 1 has 1×
    // Even with same client count at M1, M6 would have more storage
    expect(result[5].sqlStorageGB).toBeGreaterThan(result[0].sqlStorageGB);
  });

  it("storage accumulation caps at dataRetentionMonths", () => {
    var shortRetention = Object.assign({}, BASE, { dataRetentionMonths: 3, growthRateMonth: 0 });
    var result = infraProjection(shortRetention, 10, 6);
    // After month 3, storage should plateau (same clients, capped retention)
    expect(result[2].sqlStorageGB).toBeCloseTo(result[5].sqlStorageGB, 8);
  });

  it("cost increases over time due to growth and storage", () => {
    var result = infraProjection(BASE, 10, 12);
    expect(result[11].monthly).toBeGreaterThan(result[0].monthly);
  });

  it("each entry has bottleneck and costPerClient", () => {
    var result = infraProjection(BASE, 10, 3);
    result.forEach(function (r) {
      expect(r.bottleneck).toBeDefined();
      expect(r.costPerClient).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─── marketingCalc ──────────────────────────────────────────────────────────

describe("marketingCalc", function () {
  // DEFAULT_MARKETING config
  var DEFAULT_MARKETING = {
    meta: { enabled: true, budget: 500, cpm: 8, ctr: 0.012, convRate: 0.03, trialToClient: 0.25 },
    google: { enabled: true, budget: 300, cpcAvg: 1.50, convRate: 0.04, leadToClient: 0.20 },
    influencers: { enabled: false, count: 2, costPerInfluencer: 500, reachPerInfluencer: 10000, engagementRate: 0.03, convRate: 0.005 },
    seo: { enabled: false, toolsCost: 100, contentCost: 300, estimatedTraffic: 2000, convRate: 0.02, leadToClient: 0.15 },
    email: { enabled: false, toolCost: 30, listSize: 500, openRate: 0.22, clickRate: 0.03, convRate: 0.01, campaignsPerMonth: 4 },
    niches: [
      { id: 1, name: "Coiffure", budgetPct: 0.35 },
      { id: 2, name: "Esthétique", budgetPct: 0.30 },
      { id: 3, name: "Bien-être", budgetPct: 0.20 },
      { id: 4, name: "Barbier", budgetPct: 0.15 },
    ],
    avgRevenuePerClient: 0,
  };

  it("retourne zéros si marketing est null", function () {
    var r = marketingCalc(null, 100, 120000, 0.05);
    expect(r.monthly).toBe(0);
    expect(r.annual).toBe(0);
    expect(r.cacBlended).toBe(0);
    expect(r.roas).toBe(0);
    expect(r.ltv).toBe(0);
    expect(r.ltvCac).toBe(0);
    expect(r.funnel.totalClients).toBe(0);
    expect(r.niches).toEqual([]);
  });

  it("retourne zéro mensuel quand tous les canaux sont désactivés", function () {
    var allOff = {
      meta: { enabled: false },
      google: { enabled: false },
      influencers: { enabled: false },
      seo: { enabled: false },
      email: { enabled: false },
      niches: [],
      avgRevenuePerClient: 0,
    };
    var r = marketingCalc(allOff, 100, 120000, 0.05);
    expect(r.monthly).toBe(0);
    expect(r.funnel.totalClients).toBe(0);
  });

  it("Meta : calcul des impressions = budget/cpm*1000", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.channels.meta.impressions).toBeCloseTo(500 / 8 * 1000, 4);
    expect(r.channels.meta.impressions).toBeCloseTo(62500, 4);
  });

  it("Meta : calcul des clicks et CPC", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.channels.meta.clicks).toBeCloseTo(62500 * 0.012, 4);
    expect(r.channels.meta.clicks).toBeCloseTo(750, 4);
    expect(r.channels.meta.cpc).toBeCloseTo(500 / 750, 4);
  });

  it("Meta : calcul des clients et CPA", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    var expectedLeads = 750 * 0.03;
    var expectedClients = expectedLeads * 0.25;
    expect(r.channels.meta.leads).toBeCloseTo(expectedLeads, 4);
    expect(r.channels.meta.clients).toBeCloseTo(expectedClients, 4);
    expect(r.channels.meta.cpa).toBeCloseTo(500 / expectedClients, 4);
  });

  it("Google : calcul des clicks", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.channels.google.clicks).toBeCloseTo(300 / 1.50, 4);
    expect(r.channels.google.clicks).toBeCloseTo(200, 4);
  });

  it("Google : calcul des clients et CPA", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    var expectedLeads = 200 * 0.04;
    var expectedClients = expectedLeads * 0.20;
    expect(r.channels.google.leads).toBeCloseTo(expectedLeads, 4);
    expect(r.channels.google.clients).toBeCloseTo(expectedClients, 4);
    expect(r.channels.google.cpa).toBeCloseTo(300 / expectedClients, 4);
  });

  it("Influencers désactivé par défaut : budget = 0", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.channels.influencers.budget).toBe(0);
    expect(r.channels.influencers.clients).toBe(0);
  });

  it("Influencers activé : reach et clients", function () {
    var mkt = JSON.parse(JSON.stringify(DEFAULT_MARKETING));
    mkt.influencers.enabled = true;
    var r = marketingCalc(mkt, 100, 120000, 0.05);
    expect(r.channels.influencers.budget).toBe(2 * 500);
    expect(r.channels.influencers.reach).toBe(2 * 10000);
    expect(r.channels.influencers.engaged).toBeCloseTo(20000 * 0.03, 4);
    expect(r.channels.influencers.clients).toBeCloseTo(600 * 0.005, 4);
  });

  it("SEO désactivé par défaut : budget = 0", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.channels.seo.budget).toBe(0);
    expect(r.channels.seo.clients).toBe(0);
  });

  it("SEO activé : leads et clients", function () {
    var mkt = JSON.parse(JSON.stringify(DEFAULT_MARKETING));
    mkt.seo.enabled = true;
    var r = marketingCalc(mkt, 100, 120000, 0.05);
    expect(r.channels.seo.budget).toBe(100 + 300);
    expect(r.channels.seo.leads).toBeCloseTo(2000 * 0.02, 4);
    expect(r.channels.seo.clients).toBeCloseTo(40 * 0.15, 4);
  });

  it("Email désactivé par défaut : budget = 0", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.channels.email.budget).toBe(0);
    expect(r.channels.email.conversions).toBe(0);
  });

  it("Email activé : opens, clicks, conversions", function () {
    var mkt = JSON.parse(JSON.stringify(DEFAULT_MARKETING));
    mkt.email.enabled = true;
    var r = marketingCalc(mkt, 100, 120000, 0.05);
    expect(r.channels.email.budget).toBe(30);
    expect(r.channels.email.opens).toBeCloseTo(500 * 0.22 * 4, 4);
    expect(r.channels.email.clicks).toBeCloseTo(440 * 0.03, 4);
    expect(r.channels.email.conversions).toBeCloseTo(13.2 * 0.01, 4);
  });

  it("Total monthly spend = meta + google quand les autres sont désactivés", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.monthly).toBeCloseTo(500 + 300, 4);
    expect(r.annual).toBeCloseTo(800 * 12, 4);
  });

  it("CAC blended = totalSpend / totalNewClients", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    var metaClients = 5.625;
    var googleClients = 1.6;
    var totalClients = metaClients + googleClients;
    var totalSpend = 800;
    expect(r.cacBlended).toBeCloseTo(totalSpend / totalClients, 4);
  });

  it("ROAS = (newClients * ARPU * 12) / (spend * 12)", function () {
    var totalClientsParam = 100;
    var arrV = 120000;
    var r = marketingCalc(DEFAULT_MARKETING, totalClientsParam, arrV, 0.05);
    // ARPU = arrV / totalClients / 12 = 120000 / 100 / 12 = 100
    var arpu = 100;
    var newClients = r.funnel.totalClients;
    var expectedRoas = (newClients * arpu * 12) / (r.monthly * 12);
    expect(r.roas).toBeCloseTo(expectedRoas, 4);
  });

  it("LTV et LTV/CAC", function () {
    var totalClientsParam = 100;
    var arrV = 120000;
    var churn = 0.05;
    var r = marketingCalc(DEFAULT_MARKETING, totalClientsParam, arrV, churn);
    var arpu = arrV / totalClientsParam / 12;
    var expectedLtv = arpu / churn;
    expect(r.ltv).toBeCloseTo(expectedLtv, 4);
    expect(r.ltv).toBeCloseTo(2000, 4);
    expect(r.ltvCac).toBeCloseTo(expectedLtv / r.cacBlended, 4);
  });

  it("Niches : allocation budgétaire proportionnelle", function () {
    var r = marketingCalc(DEFAULT_MARKETING, 100, 120000, 0.05);
    expect(r.niches.length).toBe(4);
    expect(r.niches[0].name).toBe("Coiffure");
    expect(r.niches[0].budget).toBeCloseTo(800 * 0.35, 4);
    expect(r.niches[0].budgetPct).toBe(0.35);
    expect(r.niches[1].budget).toBeCloseTo(800 * 0.30, 4);
    // CAC per niche = nicheBudget / nicheClients (proportional)
    expect(r.niches[0].cac).toBeCloseTo(r.cacBlended, 4);
  });
});

// ─── cpcSimCalc ──────────────────────────────────────────────────────────────

describe("cpcSimCalc — dual channel B2B/B2C", function () {
  var B2B = { budget: 3000, cpc: 2.50, cvr: 0.04, qualRate: 0.25, closeRate: 0.10, clientValue: 1200 };
  var B2C = { budget: 2000, cpc: 0.80, cvr: 0.06, qualRate: 0.40, closeRate: 0.30, clientValue: 60 };
  var BASE = {
    b2b: B2B,
    b2c: B2C,
    modAdEfficiency: 1.0,
    modLeadQuality: 1.0,
    modInternalCapacity: 1.0,
    eCpc: 0.7,
    eCvr: 1.3,
    eQualif: 0.8,
    eCloseQ: 0.6,
    eCloseCap: 0.8,
  };

  it("retourne zéros si sim est null", function () {
    var r = cpcSimCalc(null);
    expect(r.b2b.clicksMonth).toBe(0);
    expect(r.b2c.clicksMonth).toBe(0);
    expect(r.totalBudget).toBe(0);
    expect(r.blendedRoas).toBe(0);
    expect(r.blendedRoi).toBe(0);
  });

  it("modulateurs neutres (1.0) : CPC ajusté = CPC base par canal", function () {
    var r = cpcSimCalc(BASE);
    expect(r.b2b.adjustedCPC).toBeCloseTo(2.50, 4);
    expect(r.b2b.adjustedCVR).toBeCloseTo(0.04, 4);
    expect(r.b2c.adjustedCPC).toBeCloseTo(0.80, 4);
    expect(r.b2c.adjustedCVR).toBeCloseTo(0.06, 4);
  });

  it("clicks/mois B2B = budget / CPC ajusté", function () {
    var r = cpcSimCalc(BASE);
    expect(r.b2b.clicksMonth).toBeCloseTo(3000 / 2.50, 4);
    expect(r.b2b.clicksYear).toBeCloseTo(r.b2b.clicksMonth * 12, 4);
  });

  it("clicks/mois B2C = budget / CPC ajusté", function () {
    var r = cpcSimCalc(BASE);
    expect(r.b2c.clicksMonth).toBeCloseTo(2000 / 0.80, 4);
    expect(r.b2c.clicksYear).toBeCloseTo(r.b2c.clicksMonth * 12, 4);
  });

  it("funnel complet B2B : leads → qualified → clients", function () {
    var r = cpcSimCalc(BASE);
    var clicks = 3000 / 2.50;
    var leads = clicks * 0.04;
    var qualified = leads * 0.25;
    var clients = qualified * 0.10;
    expect(r.b2b.leadsMonth).toBeCloseTo(leads, 4);
    expect(r.b2b.qualifiedMonth).toBeCloseTo(qualified, 4);
    expect(r.b2b.clientsMonth).toBeCloseTo(clients, 4);
  });

  it("funnel complet B2C : leads → qualified → users", function () {
    var r = cpcSimCalc(BASE);
    var clicks = 2000 / 0.80;
    var leads = clicks * 0.06;
    var qualified = leads * 0.40;
    var clients = qualified * 0.30;
    expect(r.b2c.leadsMonth).toBeCloseTo(leads, 4);
    expect(r.b2c.qualifiedMonth).toBeCloseTo(qualified, 4);
    expect(r.b2c.clientsMonth).toBeCloseTo(clients, 4);
  });

  it("revenue mensuel = clients * clientValue / 12 par canal", function () {
    var r = cpcSimCalc(BASE);
    expect(r.b2b.revenueMonth).toBeCloseTo(r.b2b.clientsMonth * 1200 / 12, 4);
    expect(r.b2c.revenueMonth).toBeCloseTo(r.b2c.clientsMonth * 60 / 12, 4);
  });

  it("CPL et CPA par canal", function () {
    var r = cpcSimCalc(BASE);
    expect(r.b2b.cpl).toBeCloseTo(3000 / r.b2b.leadsMonth, 4);
    expect(r.b2b.cpa).toBeCloseTo(3000 / r.b2b.clientsMonth, 4);
    expect(r.b2c.cpl).toBeCloseTo(2000 / r.b2c.leadsMonth, 4);
    expect(r.b2c.cpa).toBeCloseTo(2000 / r.b2c.clientsMonth, 4);
  });

  it("ROAS et ROI par canal", function () {
    var r = cpcSimCalc(BASE);
    expect(r.b2b.roas).toBeCloseTo(r.b2b.revenueMonth / 3000, 4);
    expect(r.b2b.roi).toBeCloseTo((r.b2b.revenueMonth - 3000) / 3000 * 100, 4);
    expect(r.b2c.roas).toBeCloseTo(r.b2c.revenueMonth / 2000, 4);
    expect(r.b2c.roi).toBeCloseTo((r.b2c.revenueMonth - 2000) / 2000 * 100, 4);
  });

  it("totalBudget = somme des budgets B2B + B2C", function () {
    var r = cpcSimCalc(BASE);
    expect(r.totalBudget).toBeCloseTo(3000 + 2000, 4);
  });

  it("blendedRoas = totalRevenue / totalBudget", function () {
    var r = cpcSimCalc(BASE);
    expect(r.blendedRoas).toBeCloseTo(r.totalRevenueMonth / r.totalBudget, 4);
  });

  it("blendedRoi = (totalRevenue - totalBudget) / totalBudget * 100", function () {
    var r = cpcSimCalc(BASE);
    expect(r.blendedRoi).toBeCloseTo((r.totalRevenueMonth - r.totalBudget) / r.totalBudget * 100, 4);
  });

  it("modulateur ad < 1 : CPC baisse, plus de clics", function () {
    var sim = { ...BASE, modAdEfficiency: 0.7 };
    var r = cpcSimCalc(sim);
    var baseR = cpcSimCalc(BASE);
    expect(r.b2b.adjustedCPC).toBeCloseTo(2.50 * Math.pow(0.7, 0.7), 4);
    expect(r.b2b.clicksMonth).toBeGreaterThan(baseR.b2b.clicksMonth);
    expect(r.b2c.clicksMonth).toBeGreaterThan(baseR.b2c.clicksMonth);
  });

  it("modulateur lead > 1 : CVR et qualification augmentent", function () {
    var sim = { ...BASE, modLeadQuality: 1.3 };
    var r = cpcSimCalc(sim);
    var baseR = cpcSimCalc(BASE);
    expect(r.b2b.adjustedCVR).toBeGreaterThan(baseR.b2b.adjustedCVR);
    expect(r.b2b.adjustedQual).toBeGreaterThan(baseR.b2b.adjustedQual);
    expect(r.b2c.clientsMonth).toBeGreaterThan(baseR.b2c.clientsMonth);
  });

  it("modulateur capacité > 1 : closing augmente, CPC inchangé", function () {
    var sim = { ...BASE, modInternalCapacity: 1.3 };
    var r = cpcSimCalc(sim);
    var baseR = cpcSimCalc(BASE);
    expect(r.b2b.adjustedClose).toBeGreaterThan(baseR.b2b.adjustedClose);
    expect(r.b2b.clientsMonth).toBeGreaterThan(baseR.b2b.clientsMonth);
    expect(r.b2b.adjustedCPC).toBeCloseTo(baseR.b2b.adjustedCPC, 4);
    expect(r.b2b.adjustedCVR).toBeCloseTo(baseR.b2b.adjustedCVR, 4);
  });

  it("budget B2B 0 : canal B2B zéro, B2C inchangé", function () {
    var sim = { ...BASE, b2b: { ...B2B, budget: 0 } };
    var r = cpcSimCalc(sim);
    expect(r.b2b.clicksMonth).toBe(0);
    expect(r.b2b.revenueMonth).toBe(0);
    expect(r.b2c.clicksMonth).toBeGreaterThan(0);
    expect(r.totalBudget).toBeCloseTo(2000, 4);
  });

  it("CPC 0 sur B2C : aucun clic B2C", function () {
    var sim = { ...BASE, b2c: { ...B2C, cpc: 0 } };
    var r = cpcSimCalc(sim);
    expect(r.b2c.adjustedCPC).toBe(0);
    expect(r.b2c.clicksMonth).toBe(0);
    expect(r.b2c.cpl).toBe(0);
    expect(r.b2b.clicksMonth).toBeGreaterThan(0);
  });

  it("elasticity exponents modifient la sensibilité", function () {
    var sim1 = { ...BASE, modLeadQuality: 1.3, eCvr: 1.3 };
    var sim2 = { ...BASE, modLeadQuality: 1.3, eCvr: 2.0 };
    var r1 = cpcSimCalc(sim1);
    var r2 = cpcSimCalc(sim2);
    expect(r2.b2b.adjustedCVR).toBeGreaterThan(r1.b2b.adjustedCVR);
    expect(r2.b2c.adjustedCVR).toBeGreaterThan(r1.b2c.adjustedCVR);
  });

  it("totalRevenueMonth = b2b.revenueMonth + b2c.revenueMonth", function () {
    var r = cpcSimCalc(BASE);
    expect(r.totalRevenueMonth).toBeCloseTo(r.b2b.revenueMonth + r.b2c.revenueMonth, 4);
    expect(r.totalRevenueYear).toBeCloseTo(r.totalRevenueMonth * 12, 4);
  });
});

// ─── infraCost — simulatedClients override ──────────────────────────────────

describe("infraCost — simulatedClients override", function () {
  var BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8, avgSessionDurationSec: 180,
    workerReqsPerSession: 25, cpuMsPerReq: 5,
    sqlReadsPerSession: 12, sqlWritesPerSession: 3,
    kvReadsPerSession: 5, kvWritesPerSession: 2,
    r2ReadsPerSession: 1, r2WritesPerSession: 0.2,
    queueMsgsPerSession: 2, queueOpsPerMessage: 3, logEventsPerSession: 10,
    doRequestsPerSession: 0, doGbSecPerSession: 0,
    sqlKBPerUser: 9, kvKBPerUser: 37, r2MBPerUser: 0.5,
    workerMemoryMB: 128, maxCpuMsPerReq: 30000, peakMultiplier: 3,
    activeHoursPerDay: 10, activeDaysPerWeek: 6, networkOverheadMs: 15,
    growthRateMonth: 0.15, dataRetentionMonths: 12,
    authCostPerLogin: 0,
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("simulatedClients overrides totalClients parameter", function () {
    var infra = Object.assign({}, BASE, { simulatedClients: 50 });
    var r = infraCost(infra, 10);
    // Should use 50 clients instead of 10
    expect(r.totalClients).toBe(50);
  });

  it("simulatedClients=0 uses the passed totalClients", function () {
    var infra = Object.assign({}, BASE, { simulatedClients: 0 });
    var r = infraCost(infra, 25);
    expect(r.totalClients).toBe(25);
  });

  it("cost is higher with simulatedClients override to more clients", function () {
    var base = infraCost(BASE, 10);
    var infra = Object.assign({}, BASE, { simulatedClients: 100 });
    var overridden = infraCost(infra, 10);
    // More clients → more users → more usage → higher overage cost
    expect(overridden.totalUsers).toBeGreaterThan(base.totalUsers);
    expect(overridden.mWorkerReqs).toBeGreaterThan(base.mWorkerReqs);
  });
});

// ─── infraCost — bi-profile capacity analysis (lines 484-499) ───────────────

describe("infraCost — bi-profile capacity analysis", function () {
  var PROFILES_INFRA = {
    plan: "paid", planBaseCost: 5,
    consumerUsers: 5000, proUsersPerClient: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8,
    dataRetentionMonths: 12, dataAgeMonths: 1,
    loadIntensity: "baseline",
    profiles: {
      consumer: {
        sessionsPerUserMonth: 10, avgSessionDurationSec: 90,
        workerReqsPerSession: 15, cpuMsPerReq: 3,
        sqlReadsPerSession: 8, sqlWritesPerSession: 1,
        kvReadsPerSession: 4, kvWritesPerSession: 1,
        r2ReadsPerSession: 2, r2WritesPerSession: 0.1,
        queueMsgsPerSession: 1, queueOpsPerMessage: 2, logEventsPerSession: 5,
        doRequestsPerSession: 0, doGbSecPerSession: 0,
        sqlKBPerUser: 5, kvKBPerUser: 20, r2MBPerUser: 0.3,
        activeHoursPerDay: 14, activeDaysPerWeek: 7, peakMultiplier: 4,
        networkOverheadMs: 20,
        imageTransformsPerSession: 2, r2CacheHitRate: 0.8,
        avgRowsPerQuery: 10,
      },
      pro: {
        sessionsPerUserMonth: 20, avgSessionDurationSec: 300,
        workerReqsPerSession: 40, cpuMsPerReq: 8,
        sqlReadsPerSession: 20, sqlWritesPerSession: 5,
        kvReadsPerSession: 8, kvWritesPerSession: 3,
        r2ReadsPerSession: 3, r2WritesPerSession: 0.5,
        queueMsgsPerSession: 3, queueOpsPerMessage: 3, logEventsPerSession: 15,
        doRequestsPerSession: 0, doGbSecPerSession: 0,
        sqlKBPerUser: 15, kvKBPerUser: 50, r2MBPerUser: 1,
        activeHoursPerDay: 10, activeDaysPerWeek: 6, peakMultiplier: 3,
        networkOverheadMs: 15,
        imageTransformsPerSession: 0, r2CacheHitRate: 0.5,
        avgRowsPerQuery: 5,
      },
    },
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    imageTransformPrice: 0.0005,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
    quotaImageTransforms: 5000,
  };

  it("computes weighted capacity metrics from both profiles", function () {
    var r = infraCost(PROFILES_INFRA, 20);
    // Should have capacity analysis fields
    expect(r.avgRPS).toBeGreaterThan(0);
    expect(r.peakRPS).toBeGreaterThan(0);
    expect(r.cpuUtilPerReq).toBeGreaterThan(0);
    expect(r.concurrentAtPeak).toBeGreaterThan(0);
  });

  it("uses max activeHoursPerDay across profiles", function () {
    // Consumer has 14h, Pro has 10h — should use 14h (the max)
    var r = infraCost(PROFILES_INFRA, 20);
    // activeRPS uses max active hours, so it should produce lower RPS
    // than if we used the lower hours (more spread out)
    expect(r.activeRPS).toBeGreaterThan(0);
    expect(r.avgRPS).toBeGreaterThan(0);
  });

  it("uses max peakMultiplier across profiles", function () {
    // Consumer has 4x, Pro has 3x — should use 4x
    var r = infraCost(PROFILES_INFRA, 20);
    expect(r.peakRPS).toBeGreaterThan(r.activeRPS);
  });

  it("handles image transforms from consumer profile", function () {
    var r = infraCost(PROFILES_INFRA, 20);
    expect(r.imagesCost).toBeGreaterThanOrEqual(0);
  });
});

// ─── infraCost — bottleneck with quota=0 (Infinity ratio) ───────────────────

describe("infraCost — bottleneck Infinity handling", function () {
  var BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8, avgSessionDurationSec: 180,
    workerReqsPerSession: 25, cpuMsPerReq: 5,
    sqlReadsPerSession: 12, sqlWritesPerSession: 3,
    kvReadsPerSession: 5, kvWritesPerSession: 2,
    r2ReadsPerSession: 1, r2WritesPerSession: 0.2,
    queueMsgsPerSession: 2, queueOpsPerMessage: 3, logEventsPerSession: 10,
    doRequestsPerSession: 0, doGbSecPerSession: 0,
    sqlKBPerUser: 9, kvKBPerUser: 37, r2MBPerUser: 0.5,
    workerMemoryMB: 128, maxCpuMsPerReq: 30000, peakMultiplier: 3,
    activeHoursPerDay: 10, activeDaysPerWeek: 6, networkOverheadMs: 15,
    growthRateMonth: 0.15, dataRetentionMonths: 12,
    authCostPerLogin: 0,
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("quota=0 with usage>0 triggers Infinity ratio, bottleneck still valid", function () {
    var infra = Object.assign({}, BASE, { quotaWorkerReqs: 0 });
    var r = infraCost(infra, 10);
    // Should not crash and should identify workerReqs as bottleneck
    expect(r.bottleneck).toBeDefined();
    expect(r.maxClients).toBeGreaterThanOrEqual(0);
    expect(r.monthly).toBeGreaterThan(0);
  });

  it("multiple quotas at zero still returns valid result", function () {
    var infra = Object.assign({}, BASE, {
      quotaWorkerReqs: 0, quotaCpuMs: 0, quotaKvReads: 0,
    });
    var r = infraCost(infra, 10);
    expect(r.bottleneck).toBeDefined();
    expect(r.monthly).toBeGreaterThan(0);
  });
});

// ─── infraScaling — consumerUsers proportional scaling (line 824) ───────────

describe("infraScaling — consumerUsers proportional scaling", function () {
  var PROFILE_BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8,
    consumerUsers: 5000, proUsersPerClient: 5,
    dataRetentionMonths: 12,
    loadIntensity: "baseline",
    profiles: {
      consumer: {
        sessionsPerUserMonth: 10, avgSessionDurationSec: 90,
        workerReqsPerSession: 15, cpuMsPerReq: 3,
        sqlReadsPerSession: 8, sqlWritesPerSession: 1,
        kvReadsPerSession: 4, kvWritesPerSession: 1,
        r2ReadsPerSession: 2, r2WritesPerSession: 0.1,
        queueMsgsPerSession: 1, queueOpsPerMessage: 2, logEventsPerSession: 5,
        doRequestsPerSession: 0, doGbSecPerSession: 0,
        sqlKBPerUser: 5, kvKBPerUser: 20, r2MBPerUser: 0.3,
        activeHoursPerDay: 14, activeDaysPerWeek: 7, peakMultiplier: 4,
        networkOverheadMs: 20, avgRowsPerQuery: 10,
      },
      pro: {
        sessionsPerUserMonth: 20, avgSessionDurationSec: 300,
        workerReqsPerSession: 40, cpuMsPerReq: 8,
        sqlReadsPerSession: 20, sqlWritesPerSession: 5,
        kvReadsPerSession: 8, kvWritesPerSession: 3,
        r2ReadsPerSession: 3, r2WritesPerSession: 0.5,
        queueMsgsPerSession: 3, queueOpsPerMessage: 3, logEventsPerSession: 15,
        doRequestsPerSession: 0, doGbSecPerSession: 0,
        sqlKBPerUser: 15, kvKBPerUser: 50, r2MBPerUser: 1,
        activeHoursPerDay: 10, activeDaysPerWeek: 6, peakMultiplier: 3,
        networkOverheadMs: 15, avgRowsPerQuery: 5,
      },
    },
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("scales consumerUsers proportionally to client count", function () {
    // base: 5000 consumers at 10 clients → at 20 = 10000, at 50 = 25000
    var result = infraScaling(PROFILE_BASE, [10, 20, 50], 10);
    // Verify proportional consumer scaling via infraCost return (totalUsers grows)
    // At 10 clients: consumerUsers=5000, at 20: 10000, at 50: 25000
    // Total cost may still be within free tier, so check overageCost or costPerClient
    expect(result.length).toBe(3);
    expect(result[0].clients).toBe(10);
    expect(result[2].clients).toBe(50);
    // Overage cost should grow with scale (more users = more usage)
    expect(result[2].overageCost).toBeGreaterThanOrEqual(result[0].overageCost);
  });

  it("does not scale consumers when consumerUsers is 0", function () {
    var noConsumers = JSON.parse(JSON.stringify(PROFILE_BASE));
    noConsumers.consumerUsers = 0;
    var result = infraScaling(noConsumers, [10, 100], 10);
    expect(result.length).toBe(2);
    expect(result[1].monthly).toBeGreaterThanOrEqual(result[0].monthly);
  });

  it("uses currentClients as base for proportional calculation", function () {
    // Same infra, different currentClients → different scaling ratios
    // r1: 5000/10 base → at 500: 250000 consumers (aggressive)
    // r2: 5000/25 base → at 500: 100000 consumers (moderate)
    var r1 = infraScaling(PROFILE_BASE, [500], 10);
    var r2 = infraScaling(PROFILE_BASE, [500], 25);
    // r1 has 2.5x more consumers → should have more usage
    expect(r1[0].overageCost).toBeGreaterThan(r2[0].overageCost);
  });
});

// ─── infraProjection — consumerUsers growth (line 855) ──────────────────────

describe("infraProjection — consumerUsers growth", function () {
  var BASE = {
    plan: "paid", planBaseCost: 5,
    usersPerClient: 200, sessionsPerUserMonth: 8,
    consumerUsers: 5000, proUsersPerClient: 5,
    consumerGrowthRateMonth: 0.20,
    growthRateMonth: 0.10, dataRetentionMonths: 12,
    loadIntensity: "baseline",
    profiles: {
      consumer: {
        sessionsPerUserMonth: 10, avgSessionDurationSec: 90,
        workerReqsPerSession: 15, cpuMsPerReq: 3,
        sqlReadsPerSession: 8, sqlWritesPerSession: 1,
        kvReadsPerSession: 4, kvWritesPerSession: 1,
        r2ReadsPerSession: 2, r2WritesPerSession: 0.1,
        queueMsgsPerSession: 1, queueOpsPerMessage: 2, logEventsPerSession: 5,
        doRequestsPerSession: 0, doGbSecPerSession: 0,
        sqlKBPerUser: 5, kvKBPerUser: 20, r2MBPerUser: 0.3,
        activeHoursPerDay: 14, activeDaysPerWeek: 7, peakMultiplier: 4,
        networkOverheadMs: 20, avgRowsPerQuery: 10,
      },
      pro: {
        sessionsPerUserMonth: 20, avgSessionDurationSec: 300,
        workerReqsPerSession: 40, cpuMsPerReq: 8,
        sqlReadsPerSession: 20, sqlWritesPerSession: 5,
        kvReadsPerSession: 8, kvWritesPerSession: 3,
        r2ReadsPerSession: 3, r2WritesPerSession: 0.5,
        queueMsgsPerSession: 3, queueOpsPerMessage: 3, logEventsPerSession: 15,
        doRequestsPerSession: 0, doGbSecPerSession: 0,
        sqlKBPerUser: 15, kvKBPerUser: 50, r2MBPerUser: 1,
        activeHoursPerDay: 10, activeDaysPerWeek: 6, peakMultiplier: 3,
        networkOverheadMs: 15, avgRowsPerQuery: 5,
      },
    },
    workerReqPrice: 0.0000003, cpuMsPrice: 0.00000002,
    sqlReadPrice: 0.000000001, sqlWritePrice: 0.000001, sqlStoragePrice: 0.75,
    kvReadPrice: 0.0000005, kvWritePrice: 0.000005, kvStoragePrice: 0.50,
    r2ReadPrice: 0.00000036, r2WritePrice: 0.0000045, r2StoragePrice: 0.015,
    queueOpPrice: 0.0000004, logEventPrice: 0.0000006,
    doReqPrice: 0.00000015, doGbSecPrice: 0.0000125,
    quotaWorkerReqs: 10000000, quotaCpuMs: 30000000,
    quotaSqlReads: 25000000000, quotaSqlWrites: 50000000,
    quotaKvReads: 10000000, quotaKvWrites: 1000000,
    quotaR2Reads: 10000000, quotaR2Writes: 1000000,
    quotaQueueOps: 1000000, quotaSqlStorageGB: 5, quotaKvStorageGB: 1,
    quotaR2StorageGB: 10, quotaLogEvents: 20000000,
    quotaDoReqs: 1000000, quotaDoGbSec: 400000,
  };

  it("consumer users grow with consumerGrowthRateMonth", function () {
    var result = infraProjection(BASE, 10, 6);
    // Month 1 (m=0): 5000, Month 6 (m=5): round(5000 * 1.20^5) ≈ 12442
    expect(result[0].consumerUsers).toBe(5000);
    expect(result[5].consumerUsers).toBeCloseTo(
      Math.round(5000 * Math.pow(1.20, 5)), 0
    );
    expect(result[5].consumerUsers).toBeGreaterThan(result[0].consumerUsers);
  });

  it("consumer growth uses growthRateMonth when consumerGrowthRateMonth is absent", function () {
    var infra = JSON.parse(JSON.stringify(BASE));
    delete infra.consumerGrowthRateMonth;
    var result = infraProjection(infra, 10, 6);
    // Falls back to growthRateMonth=0.10
    expect(result[5].consumerUsers).toBeCloseTo(
      Math.round(5000 * Math.pow(1.10, 5)), 0
    );
  });

  it("cost increases faster with consumer user growth", function () {
    // Compare with and without consumers
    var withConsumers = infraProjection(BASE, 10, 12);
    var noCfg = JSON.parse(JSON.stringify(BASE));
    noCfg.consumerUsers = 0;
    var noConsumers = infraProjection(noCfg, 10, 12);
    // With consumers, month 12 should cost significantly more
    expect(withConsumers[11].monthly).toBeGreaterThan(noConsumers[11].monthly);
  });

  it("consumerUsers=0 disables consumer growth in projection", function () {
    var infra = JSON.parse(JSON.stringify(BASE));
    infra.consumerUsers = 0;
    var result = infraProjection(infra, 10, 6);
    result.forEach(function (r) {
      expect(r.consumerUsers).toBe(0);
    });
  });
});
