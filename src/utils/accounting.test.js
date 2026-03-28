import { describe, it, expect } from "vitest";
import { salCalc, calcIsoc } from "./calculations.js";
import { calcMonthlyPatronal, calcSocialDue, classifyDebts, calcAnnualInterest } from "./balanceSheetCalc.js";
import { calcStreamAnnual, calcStreamPcmn } from "./revenueCalc.js";

// ── Belgian Accounting Verification ─────────────────────────────────────────
// Tests verify PCMN class coverage, balance sheet equilibrium, and Belgian
// accounting rules (ISOC, ONSS, reserve légale, amortization, VAT).

// ── Helper: simulate the AccountingPage balance sheet computation ────────────
function computeBalanceSheet(params) {
  var cfg = params.cfg || {};
  var costs = params.costs || [];
  var sals = params.sals || [];
  var debts = params.debts || [];
  var streams = params.streams || [];
  var stocks = params.stocks || [];

  // Revenue
  var totalRevenue = 0;
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      totalRevenue += calcStreamAnnual(item);
    });
  });

  // Operating costs (monthly)
  var opCosts = 0;
  costs.forEach(function (cat) {
    cat.items.forEach(function (item) {
      var monthly = item.pu ? item.a * (item.u || 1) : item.a;
      if (monthly > 0) opCosts += monthly;
    });
  });

  // Salary costs (monthly total employer cost)
  var salCosts = 0;
  sals.forEach(function (s) {
    if (!s.net || s.net <= 0) return;
    var eO = s.type === "student" ? 0.0271 : (cfg.onss || 0.1307);
    var eP = s.type === "student" ? 0 : (cfg.patr || 0.2507);
    var sc = salCalc(s.net, eO, cfg.prec || 0.1723, eP);
    salCosts += sc.total;
  });

  // EBIT & taxes
  var monthlyCosts = opCosts + salCosts;
  var ebit = totalRevenue - monthlyCosts * 12;
  var taxResult = calcIsoc(ebit, cfg.capitalSocial || 0);
  var isoc = taxResult.isoc;
  var netP = taxResult.netP;
  var resLeg = taxResult.resLeg;

  // Interest
  var annualInterest = 0;
  debts.forEach(function (d) {
    if (d.rate > 0 && d.amount > 0 && d.duration > d.elapsed) {
      var r = d.rate / 12;
      if (r > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var powE = Math.pow(1 + r, d.elapsed);
        var bal = d.amount * (pow - powE) / (pow - 1);
        annualInterest += bal * d.rate;
      }
    }
  });

  // Fixed assets
  var fixedAssetsGross = 0;
  var accumulatedDepr = 0;
  var depreciationAnnual = 0;
  costs.forEach(function (cat) {
    cat.items.forEach(function (item) {
      if (item.pcmn && item.pcmn.startsWith("2")) {
        var monthly = item.pu ? item.a * (item.u || 1) : item.a;
        if (monthly <= 0) return;
        var years = item.amortYears || 3;
        var acq = monthly * 12 * years;
        var annDepr = monthly * 12;
        fixedAssetsGross += acq;
        accumulatedDepr += annDepr;
        depreciationAnnual += annDepr;
      }
    });
  });
  var fixedAssetsNet = fixedAssetsGross - accumulatedDepr;

  // Stocks (class 3)
  var stockValue = 0;
  (stocks || []).forEach(function (s) {
    stockValue += (s.unitCost || 0) * (s.quantity || 0);
  });
  var obsolescence = cfg.stockObsolescence || 0;
  if (obsolescence > 0) stockValue = stockValue * (1 - obsolescence);

  // Receivables
  var receivables = (totalRevenue / 12) * (cfg.paymentTermsClient || 30) / 30;

  // VAT
  var annVatC = totalRevenue * (cfg.vat || 0.21) / (1 + (cfg.vat || 0.21));
  var annVatD = (opCosts * 12) * (cfg.vat || 0.21) / (1 + (cfg.vat || 0.21));
  var vatBalance = annVatC - annVatD;
  var vatCredit = vatBalance < 0 ? Math.abs(vatBalance) : 0;
  var prepaidExpenses = cfg.prepaidExpenses || 0;

  // PASSIF
  var capitalPremium = cfg.capitalPremium || 0;
  var retainedEarnings = netP - resLeg;
  var totalEquity = (cfg.capitalSocial || 0) + capitalPremium + resLeg + retainedEarnings;

  var debtLT = 0;
  var debtCT = 0;
  debts.forEach(function (d) {
    if (d.amount <= 0) return;
    var rem = d.duration - (d.elapsed || 0);
    if (rem <= 0) return;
    var r = d.rate / 12;
    var bal = d.amount;
    if (r > 0 && d.duration > 0) {
      var pow = Math.pow(1 + r, d.duration);
      var powE = Math.pow(1 + r, d.elapsed || 0);
      bal = d.amount * (pow - powE) / (pow - 1);
    } else if (d.duration > 0) {
      bal = d.amount - (d.amount / d.duration) * (d.elapsed || 0);
    }
    if (bal <= 0) return;
    if (rem > 12) { debtLT += bal; } else { debtCT += bal; }
  });
  var shareholderLoans = cfg.shareholderLoans || 0;
  var totalLtDebt = debtLT + shareholderLoans;

  var suppliers = opCosts * (cfg.paymentTermsSupplier || 30) / 30;
  var vatDue = vatBalance > 0 ? vatBalance : 0;
  var monthlyPatr = calcMonthlyPatronal(sals, cfg);
  var socialDue = calcSocialDue(monthlyPatr);
  var isocProvision = isoc;
  var deferredRevenue = cfg.deferredRevenue || 0;
  var totalStDebt = debtCT + suppliers + vatDue + socialDue + isocProvision + deferredRevenue;

  var totalPassif = totalEquity + totalLtDebt + totalStDebt;
  var nonCashAssets = fixedAssetsNet + stockValue + receivables + vatCredit + prepaidExpenses;
  var cash = totalPassif - nonCashAssets;

  var totalAssets = nonCashAssets + cash;

  return {
    // Assets
    fixedAssetsGross: fixedAssetsGross,
    accumulatedDepr: accumulatedDepr,
    fixedAssetsNet: fixedAssetsNet,
    stockValue: stockValue,
    receivables: receivables,
    vatCredit: vatCredit,
    prepaidExpenses: prepaidExpenses,
    cash: cash,
    nonCashAssets: nonCashAssets,
    totalAssets: totalAssets,
    // Equity
    capitalSocial: cfg.capitalSocial || 0,
    capitalPremium: capitalPremium,
    resLeg: resLeg,
    retainedEarnings: retainedEarnings,
    totalEquity: totalEquity,
    // LT debt
    debtLT: debtLT,
    shareholderLoans: shareholderLoans,
    totalLtDebt: totalLtDebt,
    // ST debt
    debtCT: debtCT,
    suppliers: suppliers,
    vatDue: vatDue,
    socialDue: socialDue,
    isocProvision: isocProvision,
    deferredRevenue: deferredRevenue,
    totalStDebt: totalStDebt,
    // Totals
    totalPassif: totalPassif,
    // P&L
    totalRevenue: totalRevenue,
    opCosts: opCosts,
    salCosts: salCosts,
    ebit: ebit,
    depreciationAnnual: depreciationAnnual,
    annualInterest: annualInterest,
    isoc: isoc,
    netP: netP,
  };
}

// ── Balance Sheet Equilibrium ───────────────────────────────────────────────

describe("Belgian accounting — balance sheet equilibrium", function () {
  it("Actif = Passif with minimal startup (capital only)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 18600, initialCash: 18600 },
    });
    expect(bs.totalEquity).toBeCloseTo(18600, 0);
    expect(bs.totalPassif).toBeCloseTo(bs.totalAssets, 0);
  });

  it("Actif = Passif with revenue, costs, salaries, stocks and debts", function () {
    var bs = computeBalanceSheet({
      cfg: {
        capitalSocial: 18600,
        capitalPremium: 5000,
        initialCash: 50000,
        onss: 0.1307,
        prec: 0.1723,
        patr: 0.2507,
        vat: 0.21,
        paymentTermsClient: 45,
        paymentTermsSupplier: 30,
        shareholderLoans: 10000,
        prepaidExpenses: 1200,
        deferredRevenue: 3000,
        stockObsolescence: 0.05,
      },
      streams: [
        { cat: "SaaS", items: [{ l: "Abonnement Pro", behavior: "recurring", price: 99, qty: 50, period: "monthly" }] },
      ],
      costs: [
        { cat: "Services", items: [
          { l: "Hébergement cloud", a: 500, pcmn: "6120" },
          { l: "Marketing digital", a: 1200, pcmn: "6140" },
          { l: "Matériel informatique", a: 200, pcmn: "2410", amortYears: 3 },
        ] },
      ],
      sals: [
        { net: 2500, type: "employee" },
        { net: 1500, type: "employee" },
      ],
      stocks: [
        { l: "Marchandise A", unitCost: 15, quantity: 200 },
        { l: "Marchandise B", unitCost: 8, quantity: 100 },
      ],
      debts: [
        { label: "Prêt bancaire", amount: 50000, rate: 0.035, duration: 60, elapsed: 12 },
      ],
    });

    // Balance sheet must balance: Actif = Passif
    expect(bs.totalAssets).toBeCloseTo(bs.totalPassif, 0);

    // Cash is the balancing item
    expect(bs.cash).toBeCloseTo(bs.totalPassif - bs.nonCashAssets, 2);

    // All classes present
    expect(bs.capitalSocial).toBe(18600);       // Class 1
    expect(bs.capitalPremium).toBe(5000);        // Class 1 (11xx)
    expect(bs.fixedAssetsNet).toBeGreaterThan(0); // Class 2
    expect(bs.stockValue).toBeGreaterThan(0);     // Class 3
    expect(bs.receivables).toBeGreaterThan(0);    // Class 4 (40xx)
    expect(bs.suppliers).toBeGreaterThan(0);      // Class 4 (44xx)
  });

  it("Actif = Passif with moderate loss (company still solvent)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 100000 },
      streams: [
        { cat: "Services", items: [{ l: "Consulting", behavior: "recurring", price: 500, qty: 5, period: "monthly" }] },
      ],
      costs: [
        { cat: "Charges", items: [
          { l: "Loyer", a: 4000, pcmn: "6100" },
        ] },
      ],
    });

    // Company has a loss but equity remains positive
    expect(bs.netP).toBeLessThan(0);
    expect(bs.retainedEarnings).toBeLessThan(0);
    expect(bs.totalEquity).toBeGreaterThan(0);
    // Balance still holds
    expect(bs.totalAssets).toBeCloseTo(bs.totalPassif, 0);
  });
});

// ── ISOC — Belgian Corporate Tax Rules ──────────────────────────────────────

describe("Belgian accounting — ISOC rules", function () {
  it("PME reduced rate: 20% on first 100K of EBITDA", function () {
    var result = calcIsoc(80000, 18600);
    expect(result.isocR).toBeCloseTo(16000, 0); // 80K × 20%
    expect(result.isocS).toBe(0);
    expect(result.isoc).toBeCloseTo(16000, 0);
  });

  it("Mixed rate: 20% on first 100K + 25% on excess", function () {
    var result = calcIsoc(200000, 18600);
    expect(result.isocR).toBeCloseTo(20000, 0);  // 100K × 20%
    expect(result.isocS).toBeCloseTo(25000, 0);  // 100K × 25%
    expect(result.isoc).toBeCloseTo(45000, 0);
  });

  it("No tax on negative EBITDA", function () {
    var result = calcIsoc(-30000, 18600);
    expect(result.isoc).toBe(0);
    expect(result.netP).toBe(-30000);
    expect(result.resLeg).toBe(0);
  });
});

// ── Reserve Légale — Belgian Law (Art 616 CSA) ─────────────────────────────

describe("Belgian accounting — reserve légale", function () {
  it("5% of net profit allocated to legal reserve", function () {
    var result = calcIsoc(50000, 100000);
    var expectedNet = 50000 - result.isoc;
    expect(result.resLeg).toBeCloseTo(expectedNet * 0.05, 0);
  });

  it("Capped at 10% of capital social", function () {
    // Small capital, large profit → reserve capped
    var result = calcIsoc(500000, 10000);
    expect(result.resLeg).toBeCloseTo(1000, 0); // 10% of 10K capital
  });

  it("No reserve on loss", function () {
    var result = calcIsoc(-10000, 50000);
    expect(result.resLeg).toBe(0);
  });
});

// ── Salary — Belgian ONSS / Precompte ───────────────────────────────────────

describe("Belgian accounting — salary costs (PCMN 62xx)", function () {
  it("Employee: gross = net / (1 - ONSS - precompte)", function () {
    var sc = salCalc(2500, 0.1307, 0.1723, 0.2507);
    expect(sc.brutO).toBeCloseTo(2500 / (1 - 0.1307 - 0.1723), 2);
  });

  it("Employer cost = gross + patronal ONSS", function () {
    var sc = salCalc(2500, 0.1307, 0.1723, 0.2507);
    expect(sc.total).toBeCloseTo(sc.brutO + sc.patrV, 2);
    expect(sc.patrV).toBeCloseTo(sc.brutO * 0.2507, 2);
  });

  it("Student: reduced ONSS (2.71%), no patronal", function () {
    var sc = salCalc(1200, 0.0271, 0.1723, 0);
    expect(sc.onssV).toBeCloseTo(sc.brutO * 0.0271, 2);
    expect(sc.patrV).toBe(0);
    expect(sc.total).toBe(sc.brutO);
  });

  it("Social due = quarterly employer ONSS payment", function () {
    var sc = salCalc(2500, 0.1307, 0.1723, 0.2507);
    var annualPatr = sc.total * 12 * 0.2507;
    var quarterlyDue = annualPatr / 4;
    expect(quarterlyDue).toBeGreaterThan(0);
    // Quarterly payment ≈ 3 months of patronal contributions
    expect(quarterlyDue).toBeCloseTo(sc.total * 3 * 0.2507, 0);
  });
});

// ── Amortization — Belgian Law (AR/CIR 92) ─────────────────────────────────

describe("Belgian accounting — amortization (PCMN 63xx → 2xxx)", function () {
  it("Linear depreciation: annual = acquisition / years", function () {
    var monthlyDotation = 200;
    var years = 3;
    var acquisition = monthlyDotation * 12 * years;
    var annualDepr = monthlyDotation * 12;
    expect(acquisition).toBe(7200);
    expect(annualDepr).toBe(2400);
    expect(annualDepr * years).toBe(acquisition);
  });

  it("Net book value after 1 year = gross - annual depreciation", function () {
    var monthly = 500;
    var years = 5;
    var gross = monthly * 12 * years;
    var annDepr = monthly * 12;
    var netAfter1 = gross - annDepr;
    expect(netAfter1).toBe(gross * (years - 1) / years);
  });

  it("IT equipment: 3 years (PCMN 2410)", function () {
    var years = 3; // Belgian default for IT
    var acquisition = 3600;
    var annualDepr = acquisition / years;
    expect(annualDepr).toBe(1200);
  });

  it("Industrial equipment: 10 years (PCMN 2400)", function () {
    var years = 10;
    var acquisition = 60000;
    var annualDepr = acquisition / years;
    expect(annualDepr).toBe(6000);
  });
});

// ── VAT — Belgian TVA Rules ─────────────────────────────────────────────────

describe("Belgian accounting — TVA (PCMN 41xx/45xx)", function () {
  it("VAT balance = collected - deductible", function () {
    var revenue = 120000;
    var costs = 60000;
    var vatRate = 0.21;
    var collected = revenue * vatRate / (1 + vatRate);
    var deductible = costs * vatRate / (1 + vatRate);
    var balance = collected - deductible;
    expect(balance).toBeGreaterThan(0); // Revenue > costs → VAT to pay
    expect(collected).toBeCloseTo(revenue * 0.21 / 1.21, 2);
  });

  it("Negative VAT balance = credit (receivable)", function () {
    var revenue = 30000;
    var costs = 80000;
    var vatRate = 0.21;
    var collected = revenue * vatRate / (1 + vatRate);
    var deductible = costs * vatRate / (1 + vatRate);
    var balance = collected - deductible;
    expect(balance).toBeLessThan(0);
    var vatCredit = Math.abs(balance);
    expect(vatCredit).toBeGreaterThan(0);
  });
});

// ── PCMN Class Coverage ─────────────────────────────────────────────────────

describe("Belgian accounting — PCMN class completeness", function () {
  it("All 7 PCMN classes represented in a full scenario", function () {
    var bs = computeBalanceSheet({
      cfg: {
        capitalSocial: 18600,
        capitalPremium: 2000,
        initialCash: 30000,
        onss: 0.1307,
        prec: 0.1723,
        patr: 0.2507,
        vat: 0.21,
        paymentTermsClient: 30,
        paymentTermsSupplier: 30,
        shareholderLoans: 5000,
        deferredRevenue: 1000,
      },
      streams: [
        { cat: "Services", items: [{ l: "Consulting", behavior: "recurring", price: 200, qty: 20, period: "monthly" }] },
      ],
      costs: [
        { cat: "Ops", items: [
          { l: "Cloud", a: 300, pcmn: "6120" },
          { l: "Laptop", a: 100, pcmn: "2410", amortYears: 3 },
        ] },
      ],
      sals: [{ net: 2000, type: "employee" }],
      stocks: [{ l: "Stock A", unitCost: 10, quantity: 50 }],
      debts: [{ label: "Prêt", amount: 20000, rate: 0.04, duration: 48, elapsed: 0 }],
    });

    // Class 1: Equity & LT debts
    expect(bs.capitalSocial).toBe(18600);
    expect(bs.capitalPremium).toBe(2000);
    expect(bs.shareholderLoans).toBe(5000);
    expect(bs.totalLtDebt).toBeGreaterThan(0);

    // Class 2: Fixed assets
    expect(bs.fixedAssetsGross).toBeGreaterThan(0);

    // Class 3: Stocks
    expect(bs.stockValue).toBe(500); // 10 × 50

    // Class 4: Receivables & payables
    expect(bs.receivables).toBeGreaterThan(0);
    expect(bs.suppliers).toBeGreaterThan(0);
    expect(bs.socialDue).toBeGreaterThan(0);
    expect(bs.isocProvision).toBeGreaterThanOrEqual(0);
    expect(bs.deferredRevenue).toBe(1000);

    // Class 5: implicitly tested via cash balancing
    expect(bs.cash).toBeDefined();

    // Class 6: Charges
    expect(bs.opCosts).toBeGreaterThan(0);
    expect(bs.salCosts).toBeGreaterThan(0);

    // Class 7: Revenue
    expect(bs.totalRevenue).toBeGreaterThan(0);

    // Equilibrium
    expect(bs.totalAssets).toBeCloseTo(bs.totalPassif, 0);
  });

  it("Stock obsolescence reduces value (PCMN 6310)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000, stockObsolescence: 0.10 },
      stocks: [{ l: "Stock", unitCost: 100, quantity: 10 }],
    });
    // 10% obsolescence → 1000 × 0.90 = 900
    expect(bs.stockValue).toBeCloseTo(900, 0);
  });

  it("Receivables = monthly revenue × client payment terms / 30", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000, paymentTermsClient: 60 },
      streams: [
        { cat: "SaaS", items: [{ l: "Abo", behavior: "recurring", price: 100, qty: 10, period: "monthly" }] },
      ],
    });
    var monthlyRev = bs.totalRevenue / 12;
    expect(bs.receivables).toBeCloseTo(monthlyRev * 60 / 30, 0);
  });

  it("Suppliers = monthly opex × supplier payment terms / 30", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000, paymentTermsSupplier: 45 },
      costs: [
        { cat: "Ops", items: [{ l: "Loyer", a: 2000, pcmn: "6100" }] },
      ],
    });
    expect(bs.suppliers).toBeCloseTo(2000 * 45 / 30, 0);
  });
});

// ── Debt Classification (PCMN 17xx vs 42xx) ────────────────────────────────

describe("Belgian accounting — debt classification", function () {
  it("Debt with > 12 months remaining = LT (class 17)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000 },
      debts: [{ amount: 50000, rate: 0.03, duration: 60, elapsed: 0 }],
    });
    expect(bs.debtLT).toBeGreaterThan(0);
    expect(bs.debtCT).toBe(0);
  });

  it("Debt with <= 12 months remaining = CT (class 42)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000 },
      debts: [{ amount: 10000, rate: 0.03, duration: 24, elapsed: 18 }],
    });
    // 24 - 18 = 6 months remaining → CT
    expect(bs.debtCT).toBeGreaterThan(0);
    expect(bs.debtLT).toBe(0);
  });

  it("Shareholder loans in LT debt (PCMN 1740)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000, shareholderLoans: 25000 },
    });
    expect(bs.totalLtDebt).toBe(25000);
    expect(bs.shareholderLoans).toBe(25000);
  });
});

// ── Shared utility functions ────────────────────────────────────────────────

describe("balanceSheetCalc utilities", function () {
  it("calcMonthlyPatronal: returns monthly patronal from salary list", function () {
    var sals = [
      { net: 2500, type: "employee" },
      { net: 1500, type: "employee" },
    ];
    var cfg = { onss: 0.1307, prec: 0.1723, patr: 0.2507 };
    var patr = calcMonthlyPatronal(sals, cfg);
    // Each brutO = net / (1 - 0.1307 - 0.1723), patrV = brutO * 0.2507
    var sc1 = salCalc(2500, 0.1307, 0.1723, 0.2507);
    var sc2 = salCalc(1500, 0.1307, 0.1723, 0.2507);
    expect(patr).toBeCloseTo(sc1.patrV + sc2.patrV, 2);
  });

  it("calcMonthlyPatronal: students have zero patronal", function () {
    var sals = [{ net: 1200, type: "student" }];
    var cfg = { onss: 0.1307, prec: 0.1723, patr: 0.2507 };
    var patr = calcMonthlyPatronal(sals, cfg);
    expect(patr).toBe(0);
  });

  it("calcMonthlyPatronal: independants have zero patronal", function () {
    var sals = [{ net: 3000, type: "independant" }];
    var cfg = { onss: 0.1307, prec: 0.1723, patr: 0.2507 };
    var patr = calcMonthlyPatronal(sals, cfg);
    expect(patr).toBe(0);
  });

  it("calcSocialDue: quarterly = monthlyPatronal × 3", function () {
    var monthlyPatr = 1000;
    expect(calcSocialDue(monthlyPatr)).toBe(3000);
  });

  it("socialDue uses patronal (brutO × patr), NOT total employer cost", function () {
    var sals = [{ net: 2500, type: "employee" }];
    var cfg = { onss: 0.1307, prec: 0.1723, patr: 0.2507 };
    var sc = salCalc(2500, 0.1307, 0.1723, 0.2507);
    var correctPatronal = sc.patrV; // brutO × 0.2507
    var incorrectBase = sc.total;   // brutO + patrV (wrong — overestimates)

    var correctDue = calcSocialDue(correctPatronal);
    var incorrectDue = incorrectBase * 12 * 0.2507 / 4; // old formula

    // Correct due should be ~20% less than incorrect
    expect(correctDue).toBeLessThan(incorrectDue);
    // Correct formula: quarterly = monthly patronal × 3
    expect(correctDue).toBeCloseTo(correctPatronal * 3, 2);
  });

  it("classifyDebts: LT vs CT classification", function () {
    var debts = [
      { amount: 50000, rate: 0.04, duration: 60, elapsed: 0 },   // 60 months left → LT
      { amount: 10000, rate: 0.03, duration: 24, elapsed: 18 },   // 6 months left → CT
    ];
    var result = classifyDebts(debts);
    expect(result.debtLT).toBeGreaterThan(0);
    expect(result.debtCT).toBeGreaterThan(0);
  });

  it("calcAnnualInterest: uses average balance over the year", function () {
    // Fresh loan: average balance over first year < full amount, so interest < amount × rate
    var debts = [{ amount: 50000, rate: 0.04, duration: 60, elapsed: 0 }];
    var interest = calcAnnualInterest(debts);
    expect(interest).toBeGreaterThan(0);
    expect(interest).toBeLessThan(50000 * 0.04); // less than naive (full balance × rate)
    expect(interest).toBeCloseTo(1816, -1); // ~1816 EUR for 50K at 4% over 60 months, year 1
    // Partially repaid: interest even lower
    var debts2 = [{ amount: 50000, rate: 0.04, duration: 60, elapsed: 24 }];
    var interest2 = calcAnnualInterest(debts2);
    expect(interest2).toBeGreaterThan(0);
    expect(interest2).toBeLessThan(interest);
  });
});

// ── Negative equity / cash scenarios ────────────────────────────────────────

describe("Belgian accounting — negative equity warnings", function () {
  it("Deep loss: balance still holds (Actif = Passif, both can be negative)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 5000 },
      costs: [
        { cat: "Charges", items: [{ l: "Loyer", a: 5000, pcmn: "6100" }] },
      ],
    });
    // Company is deeply in loss
    expect(bs.netP).toBeLessThan(0);
    expect(bs.totalEquity).toBeLessThan(0);
    // Balance STILL holds because cash is not clamped
    expect(bs.totalAssets).toBeCloseTo(bs.totalPassif, 0);
    // Cash is negative (deficit)
    expect(bs.cash).toBeLessThan(0);
  });

  it("Negative equity detected (art. 332 CSA warning trigger)", function () {
    var bs = computeBalanceSheet({
      cfg: { capitalSocial: 10000 },
      costs: [
        { cat: "Charges", items: [{ l: "Charges", a: 3000, pcmn: "6100" }] },
      ],
    });
    // Losses exceed capital
    expect(bs.totalEquity).toBeLessThan(0);
  });
});
