import { useMemo, useState } from "react";
import { Scales, CaretDown, CaretUp } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageLayout, KpiCard, SelectDropdown, NumberField, PaletteToggle } from "../components";
import { eur, eurShort, calcMonthlyPatronal, calcSocialDue } from "../utils";
import { useT } from "../context";

/**
 * Bilan previsionnel -- PCMN belge
 * Actif (classes 2-5) / Passif (classes 1, 4)
 * Projection a fin Y1, Y2, Y3
 */

/* ── Recharts custom tooltip ── */
function ChartTooltip(props) {
  if (!props.active || !props.payload) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "var(--sp-2) var(--sp-3)", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{props.label}</div>
      {props.payload.filter(function (entry) { return entry.value !== 0; }).map(function (entry) {
        return (
          <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
            {entry.name}: {eur(entry.value)}
          </div>
        );
      })}
    </div>
  );
}

/* ── Balance row (unchanged) ── */
function BalanceRow({ label, value, bold, color, indent, border, pcmn, showPcmn, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-2)",
      padding: (bold ? "var(--sp-2)" : "var(--sp-1)") + " 0",
      borderTop: border ? "2px solid var(--border)" : undefined,
    }}>
      {showPcmn && pcmn ? <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-faint)", width: 32, flexShrink: 0 }}>{pcmn}</span> : null}
      <span style={{
        flex: 1, fontSize: bold ? 13 : 12,
        fontWeight: bold ? 700 : 400,
        color: color || (bold ? "var(--text-primary)" : sub ? "var(--text-muted)" : "var(--text-secondary)"),
        paddingLeft: indent ? (sub ? 32 : 16) : 0,
        fontStyle: sub ? "italic" : "normal",
      }}>{label}</span>
      <span style={{
        fontSize: bold ? 14 : 12,
        fontWeight: bold ? 700 : 500,
        color: color || "var(--text-primary)",
        fontVariantNumeric: "tabular-nums",
        fontFamily: bold ? "'Bricolage Grotesque', sans-serif" : "inherit",
        minWidth: 100, textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

/* ── Balance column — full year detail (unchanged) ── */
function BalanceColumn({ year, data, showPcmn, t }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
      {/* ACTIF */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
          {t.assets_title || "Actif"} — {t.year_label || "Annee"} {year}
        </div>

        {/* Actifs immobilises (classe 2) */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "var(--sp-2) 0 var(--sp-1)" }}>
          {t.fixed_assets || "Actifs immobilises"}
        </div>
        <BalanceRow label={t.gross_assets || "Immobilisations brutes"} value={eur(data.grossAssets)} indent pcmn="2" showPcmn={showPcmn} />
        <BalanceRow label={t.cumul_dep || "Amortissements cumules"} value={eur(-data.cumulDep)} indent pcmn="28" showPcmn={showPcmn} sub />
        <BalanceRow label={t.net_assets || "Immobilisations nettes"} value={eur(data.netAssets)} bold />

        {/* Actifs circulants (classes 3-5) */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "var(--sp-3) 0 var(--sp-1)" }}>
          {t.current_assets || "Actifs circulants"}
        </div>
        {data.stockValue > 0 ? <BalanceRow label={t.stocks || "Stocks"} value={eur(data.stockValue)} indent pcmn="3" showPcmn={showPcmn} /> : null}
        {data.receivables > 0 ? <BalanceRow label={t.receivables || "Creances commerciales"} value={eur(data.receivables)} indent pcmn="40" showPcmn={showPcmn} /> : null}
        {data.vatCredit > 0 ? <BalanceRow label={t.vat_credit || "TVA a recuperer"} value={eur(data.vatCredit)} indent pcmn="41" showPcmn={showPcmn} /> : null}
        {data.prepaidExpenses > 0 ? <BalanceRow label={t.prepaid || "Charges a reporter"} value={eur(data.prepaidExpenses)} indent pcmn="490" showPcmn={showPcmn} /> : null}
        <BalanceRow label={t.cash || "Tresorerie"} value={eur(data.cash)} indent pcmn="55" showPcmn={showPcmn} />
        <BalanceRow label={t.total_current || "Total actifs circulants"} value={eur(data.totalCurrentAssets)} bold />

        <BalanceRow label={t.total_assets || "TOTAL ACTIF"} value={eur(data.totalAssets)} bold border color="var(--text-primary)" />
      </div>

      {/* PASSIF */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
          {t.liabilities_title || "Passif"} — {t.year_label || "Annee"} {year}
        </div>

        {/* Capitaux propres (classe 1) */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "var(--sp-2) 0 var(--sp-1)" }}>
          {t.equity || "Capitaux propres"}
        </div>
        <BalanceRow label={t.capital || "Capital social"} value={eur(data.capital)} indent pcmn="10" showPcmn={showPcmn} />
        {data.capitalPremium > 0 ? <BalanceRow label={t.share_premium || "Prime d'emission"} value={eur(data.capitalPremium)} indent pcmn="11" showPcmn={showPcmn} /> : null}
        {data.reserves > 0 ? <BalanceRow label={t.reserves || "Reserve legale"} value={eur(data.reserves)} indent pcmn="13" showPcmn={showPcmn} /> : null}
        <BalanceRow label={t.retained || "Resultat reporte"} value={eur(data.retainedEarnings)} indent pcmn="14" showPcmn={showPcmn} color={data.retainedEarnings >= 0 ? undefined : "var(--color-error)"} />
        <BalanceRow label={t.total_equity || "Total capitaux propres"} value={eur(data.totalEquity)} bold />

        {/* Dettes > 1 an (classe 17) */}
        {data.ltDebt > 0 || data.shareholderLoans > 0 ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "var(--sp-3) 0 var(--sp-1)" }}>
              {t.lt_debt || "Dettes a plus d'un an"}
            </div>
            {data.ltDebt > 0 ? <BalanceRow label={t.bank_loans || "Emprunts"} value={eur(data.ltDebt)} indent pcmn="17" showPcmn={showPcmn} /> : null}
            {data.shareholderLoans > 0 ? <BalanceRow label={t.shareholder_loans || "Compte courant associe"} value={eur(data.shareholderLoans)} indent pcmn="174" showPcmn={showPcmn} /> : null}
          </>
        ) : null}

        {/* Dettes < 1 an (classe 4) */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "var(--sp-3) 0 var(--sp-1)" }}>
          {t.st_debt || "Dettes a un an au plus"}
        </div>
        {data.stDebt > 0 ? <BalanceRow label={t.st_bank || "Remboursements <1 an"} value={eur(data.stDebt)} indent pcmn="42" showPcmn={showPcmn} /> : null}
        {data.suppliers > 0 ? <BalanceRow label={t.suppliers || "Dettes fournisseurs"} value={eur(data.suppliers)} indent pcmn="44" showPcmn={showPcmn} /> : null}
        {data.vatDue > 0 ? <BalanceRow label={t.vat_due || "TVA a payer"} value={eur(data.vatDue)} indent pcmn="45" showPcmn={showPcmn} /> : null}
        {data.socialDue > 0 ? <BalanceRow label={t.social_due || "ONSS a payer"} value={eur(data.socialDue)} indent pcmn="45" showPcmn={showPcmn} /> : null}
        {data.isocProvision > 0 ? <BalanceRow label={t.isoc_provision || "Provision ISOC"} value={eur(data.isocProvision)} indent pcmn="45" showPcmn={showPcmn} /> : null}
        {data.deferredRevenue > 0 ? <BalanceRow label={t.deferred_revenue || "Produits a reporter"} value={eur(data.deferredRevenue)} indent pcmn="493" showPcmn={showPcmn} /> : null}
        <BalanceRow label={t.total_st || "Total dettes court terme"} value={eur(data.totalStDebt)} bold />

        <BalanceRow label={t.total_liabilities || "TOTAL PASSIF"} value={eur(data.totalLiabilities)} bold border color="var(--text-primary)" />

        {/* Balance check */}
        {Math.abs(data.totalAssets - data.totalLiabilities) > 1 ? (
          <div style={{ marginTop: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-error-bg)", borderRadius: "var(--r-md)", fontSize: 11, color: "var(--color-error)", fontWeight: 600 }}>
            {t.balance_error || "Ecart actif/passif"} : {eur(data.totalAssets - data.totalLiabilities)}
          </div>
        ) : null}
        {data.totalEquity < 0 ? (
          <div style={{ marginTop: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-error-bg)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--color-error)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-error)", marginBottom: 2 }}>{t.warn_negative_equity_title || "Fonds propres negatifs"}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>{t.warn_negative_equity_desc || "Les pertes cumulees depassent le capital. Obligation legale de convoquer une assemblee generale (art. 332 CSA)."}</div>
          </div>
        ) : null}
        {data.cash < 0 ? (
          <div style={{ marginTop: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--color-warning)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)", marginBottom: 2 }}>{t.warn_negative_cash_title || "Tresorerie negative"}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>{t.warn_negative_cash_desc || "Le besoin en financement depasse les ressources disponibles. Un apport de capital ou un emprunt est necessaire."}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Financing plan (unchanged) ── */
function FinancingPlan({ cfg, assets, debts, stocks, y1, showPcmn, t }) {
  /* Sources */
  var capital = cfg.capitalSocial || 0;
  var capitalPremium = cfg.capitalPremium || 0;
  var shareholderLoans = cfg.shareholderLoans || 0;
  var totalLoans = 0;
  (debts || []).forEach(function (d) { totalLoans += d.amount || 0; });
  var selfFinancing = y1.retainedEarnings > 0 ? y1.retainedEarnings : 0;
  var totalSources = capital + capitalPremium + shareholderLoans + totalLoans + selfFinancing;

  /* Uses */
  var totalInvestments = 0;
  (assets || []).forEach(function (a) { totalInvestments += a.amount || 0; });
  var stockValue = 0;
  (stocks || []).forEach(function (s) { stockValue += (s.unitCost || 0) * (s.quantity || 0); });
  var bfr = (y1.receivables || 0) + stockValue - (y1.suppliers || 0);
  var totalUses = totalInvestments + (bfr > 0 ? bfr : 0);
  var surplus = totalSources - totalUses;

  var rowStyle = function (bold) {
    return {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: (bold ? "var(--sp-2)" : "var(--sp-1)") + " 0",
      fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400,
      color: bold ? "var(--text-primary)" : "var(--text-secondary)",
    };
  };

  return (
    <div style={{ marginTop: "var(--gap-lg)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
      {/* Sources */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
          {t.fp_sources || "Sources de financement"}
        </div>
        {capital > 0 ? <div style={rowStyle()}><span>{t.fp_capital || "Capital social"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(capital)}</span></div> : null}
        {capitalPremium > 0 ? <div style={rowStyle()}><span>{t.fp_premium || "Prime d'emission"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(capitalPremium)}</span></div> : null}
        {shareholderLoans > 0 ? <div style={rowStyle()}><span>{t.fp_shareholder || "Compte courant associe"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(shareholderLoans)}</span></div> : null}
        {totalLoans > 0 ? <div style={rowStyle()}><span>{t.fp_loans || "Emprunts"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(totalLoans)}</span></div> : null}
        {selfFinancing > 0 ? <div style={rowStyle()}><span>{t.fp_self || "Autofinancement (resultat Y1)"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(selfFinancing)}</span></div> : null}
        <div style={Object.assign({}, rowStyle(true), { borderTop: "2px solid var(--border)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" })}>
          <span>{t.fp_total_sources || "Total sources"}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(totalSources)}</span>
        </div>
      </div>

      {/* Uses */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
          {t.fp_uses || "Emplois"}
        </div>
        {totalInvestments > 0 ? <div style={rowStyle()}><span>{t.fp_investments || "Investissements"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(totalInvestments)}</span></div> : null}
        {stockValue > 0 ? <div style={rowStyle()}><span>{t.fp_stock || "Stock initial"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(stockValue)}</span></div> : null}
        {bfr > 0 ? <div style={rowStyle()}><span>{t.fp_bfr || "Besoin en fonds de roulement"}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(bfr)}</span></div> : null}
        <div style={Object.assign({}, rowStyle(true), { borderTop: "2px solid var(--border)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" })}>
          <span>{t.fp_total_uses || "Total emplois"}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(totalUses)}</span>
        </div>

        {/* Surplus / Deficit */}
        <div style={{
          marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)",
          borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600,
          background: surplus >= 0 ? "var(--color-success-bg)" : "var(--color-error-bg)",
          color: surplus >= 0 ? "var(--color-success)" : "var(--color-error)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span>{surplus >= 0 ? (t.fp_surplus || "Excedent") : (t.fp_deficit || "Deficit")}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(surplus)}</span>
        </div>
      </div>
    </div>
  );
}

export default function BalanceSheetPage({ cfg, setCfg, assets, stocks, debts, sals, totalRevenue, monthlyCosts, annVatC, annVatD, annualInterest, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var t = useT().balance_sheet || {};
  var [horizon, setHorizon] = useState(3);
  var [showDetail, setShowDetail] = useState(false);
  var showPcmn = cfg.showPcmn;

  function cfgSet(key, val) { setCfg(function (prev) { return Object.assign({}, prev, { [key]: val }); }); }

  var yearData = useMemo(function () {
    var years = [];
    var escalation = cfg.costEscalation || 0.02;
    var revenueGrowth = cfg.revenueGrowthRate || 0.10;
    var cumulatedResult = 0;
    var cumulatedReserves = 0;

    for (var y = 1; y <= horizon; y++) {
      var costMul = Math.pow(1 + escalation, y - 1);
      var revMul = Math.pow(1 + revenueGrowth, y - 1);

      /* P&L for this year (simplified) */
      var annRev = totalRevenue * revMul;
      var annCost = monthlyCosts * 12 * costMul;
      var yEbitda = annRev - annCost;
      var yInterest = (annualInterest || 0) * costMul;
      var yEbt = yEbitda - yInterest;
      var yIsoc = yEbt > 0 ? (yEbt <= 100000 ? yEbt * 0.20 : 100000 * 0.20 + (yEbt - 100000) * 0.25) : 0;
      var yNet = yEbt - yIsoc;
      var yResLeg = yNet > 0 ? Math.min(yNet * 0.05, Math.max(0, cfg.capitalSocial * 0.10 - cumulatedReserves)) : 0;
      cumulatedReserves += yResLeg;
      cumulatedResult += yNet - yResLeg;

      /* ACTIF */
      var grossAssets = 0;
      var cumulDep = 0;
      (assets || []).forEach(function (a) {
        if (a.amount > 0 && a.years > 0) {
          grossAssets += a.amount;
          var annDep = (a.amount - (a.residual || 0)) / a.years;
          var yearsElapsed = (a.elapsed || 0) + y;
          cumulDep += Math.min(annDep * yearsElapsed, a.amount - (a.residual || 0));
        }
      });
      var netAssets = grossAssets - cumulDep;

      var stockValue = 0;
      (stocks || []).forEach(function (s) { stockValue += (s.unitCost || 0) * (s.quantity || 0); });
      var obsolescence = cfg.stockObsolescence || 0;
      if (obsolescence > 0) stockValue = stockValue * (1 - obsolescence);

      /* Creances = CA mensuel x delai clients (jours) / 30 */
      var monthlyRev = annRev / 12;
      var receivables = monthlyRev * (cfg.paymentTermsClient || 30) / 30;

      /* TVA credit/debit -- use actual calculated values from tvaCalc */
      var yVatC = (annVatC || 0) * revMul;
      var yVatD = (annVatD || 0) * costMul;
      var yVatBalance = yVatC - yVatD;
      var vatCredit = yVatBalance < 0 ? Math.abs(yVatBalance) / 4 : 0; // quarterly avg
      var vatDue = yVatBalance > 0 ? yVatBalance / 4 : 0;

      /* Cash = initial + cumulated net results + debts received - debt repayments - investments */
      var debtInflows = 0;
      var ltDebt = 0;
      var stDebt = 0;
      (debts || []).forEach(function (d) {
        debtInflows += d.amount || 0;
        var monthlyPayment = 0;
        if (d.duration > 0 && d.rate > 0) {
          var r = d.rate / 12;
          monthlyPayment = d.amount * r / (1 - Math.pow(1 + r, -d.duration));
        } else if (d.duration > 0) {
          monthlyPayment = d.amount / d.duration;
        }
        var elapsed = (d.elapsed || 0) + y * 12;
        var remaining;
        if (d.rate > 0 && d.duration > 0) {
          var rr = d.rate / 12;
          var pow = Math.pow(1 + rr, d.duration);
          var powN = Math.pow(1 + rr, elapsed);
          remaining = elapsed >= d.duration ? 0 : d.amount * (pow - powN) / (pow - 1);
        } else {
          remaining = Math.max(0, d.amount - (d.amount / Math.max(d.duration, 1)) * elapsed);
        }
        var monthsLeft = d.duration - elapsed;
        if (monthsLeft > 12) {
          ltDebt += remaining - monthlyPayment * 12;
          stDebt += monthlyPayment * 12;
        } else {
          stDebt += remaining;
        }
      });

      /*
       * Cash derived from balance equation:
       * Total Passif = Equity + LT Debt + ST Debt
       * Total Actif = Net Assets + Stocks + Receivables + VATcredit + Cash
       * Cash = Total Passif - (Net Assets + Stocks + Receivables + VATcredit)
       *
       * This ensures Actif always equals Passif.
       */
      /* Class 1 -- Equity (PCMN 10, 11, 13, 14) */
      var capitalPremium = cfg.capitalPremium || 0;
      var totalEquity = cfg.capitalSocial + capitalPremium + cumulatedReserves + cumulatedResult;

      /* Class 1 -- LT debt (PCMN 17, 174) */
      var shareholderLoans = cfg.shareholderLoans || 0;
      var totalLtDebt = (ltDebt > 0 ? ltDebt : 0) + shareholderLoans;

      /* Class 4 -- ST debt (PCMN 42, 44, 45, 493) */
      var monthlyCostY = annCost / 12;
      var suppliers = monthlyCostY * (cfg.paymentTermsSupplier || 30) / 30;
      var socialDue = calcSocialDue(calcMonthlyPatronal(sals, cfg)) * costMul;
      var isocProvision = yIsoc;
      var deferredRevenue = cfg.deferredRevenue || 0;
      var totalStDebt = (stDebt > 0 ? stDebt : 0) + suppliers + vatDue + socialDue + isocProvision + deferredRevenue;

      /* Balance equation: Cash = Total Passif - Non-cash Assets */
      var totalPassif = totalEquity + totalLtDebt + totalStDebt;
      var prepaidExpenses = cfg.prepaidExpenses || 0;
      var nonCashAssets = netAssets + stockValue + receivables + vatCredit + prepaidExpenses;
      var cash = totalPassif - nonCashAssets;

      var totalCurrentAssets = stockValue + receivables + vatCredit + prepaidExpenses + cash;
      var totalAssetsY = netAssets + totalCurrentAssets;
      var totalLiabilitiesY = totalPassif;

      years.push({
        year: y,
        grossAssets: grossAssets, cumulDep: cumulDep, netAssets: netAssets,
        stockValue: stockValue, receivables: receivables, vatCredit: vatCredit,
        prepaidExpenses: prepaidExpenses, cash: cash,
        totalCurrentAssets: totalCurrentAssets, totalAssets: totalAssetsY,
        capital: cfg.capitalSocial, capitalPremium: capitalPremium,
        reserves: cumulatedReserves, retainedEarnings: cumulatedResult,
        totalEquity: totalEquity, ltDebt: ltDebt > 0 ? ltDebt : 0,
        shareholderLoans: shareholderLoans,
        stDebt: stDebt > 0 ? stDebt : 0, suppliers: suppliers, vatDue: vatDue, socialDue: socialDue,
        isocProvision: isocProvision, deferredRevenue: deferredRevenue,
        totalStDebt: totalStDebt, totalLiabilities: totalLiabilitiesY,
      });
    }
    return years;
  }, [cfg, assets, stocks, debts, sals, totalRevenue, monthlyCosts, annualInterest, annVatC, annVatD, horizon]);

  var y1 = yearData[0] || {};

  /* ── Chart data ── */
  var chartData = yearData.map(function (d) {
    return {
      name: (t.year_label || "Annee") + " " + d.year,
      netAssets: d.netAssets,
      stocks: d.stockValue,
      receivables: d.receivables,
      cash: Math.max(0, d.cash),
      equity: d.totalEquity,
      ltDebt: d.ltDebt + (d.shareholderLoans || 0),
      stDebt: d.totalStDebt,
    };
  });

  return (
    <PageLayout title={t.title || "Bilan previsionnel"} subtitle={t.subtitle || "Projection de la situation patrimoniale de l'entreprise a la fin de chaque exercice."} icon={Scales} iconColor="var(--text-muted)">

      {/* ── 1. KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_assets || "Total actif Y1"} value={y1.totalAssets != null ? eurShort(y1.totalAssets) : "\u2014"} fullValue={y1.totalAssets != null ? eur(y1.totalAssets) : undefined} />
        <KpiCard label={t.kpi_equity || "Capitaux propres Y1"} value={y1.totalEquity != null ? eurShort(y1.totalEquity) : "\u2014"} fullValue={y1.totalEquity != null ? eur(y1.totalEquity) : undefined} />
        <KpiCard label={t.kpi_cash || "Tresorerie Y1"} value={y1.cash != null ? eurShort(y1.cash) : "\u2014"} fullValue={y1.cash != null ? eur(y1.cash) : undefined} glossaryKey="treasury" />
        <KpiCard label={t.kpi_debt_ratio || "Ratio d'endettement"} value={y1.totalEquity !== 0 ? (Math.abs((y1.ltDebt + y1.totalStDebt) / y1.totalEquity)).toFixed(2) + "x" : "\u2014"} />
      </div>

      {/* ── 2. Chart card — stacked bar composition ── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.chart_title || "Composition du bilan"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
            <SelectDropdown value={String(horizon)} onChange={function (v) { setHorizon(parseInt(v, 10)); }} height={36} width="140px"
            options={[
              { value: "1", label: "1 " + (t.year || "an") },
              { value: "2", label: "2 " + (t.years || "ans") },
              { value: "3", label: "3 " + (t.years || "ans") },
            ]}
          />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={8} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={function (v) { return eurShort(v); }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={function (value) { return <span style={{ color: "var(--text-secondary)" }}>{value}</span>; }} />
            {/* Assets side */}
            <Bar dataKey="netAssets" name={t.net_assets || "Immobilisations nettes"} stackId="assets" fill={chartPalette[4 % chartPalette.length]} />
            <Bar dataKey="stocks" name={t.stocks || "Stocks"} stackId="assets" fill={chartPalette[5 % chartPalette.length]} />
            <Bar dataKey="receivables" name={t.receivables || "Creances"} stackId="assets" fill={chartPalette[1 % chartPalette.length]} />
            <Bar dataKey="cash" name={t.cash || "Tresorerie"} stackId="assets" fill={chartPalette[2 % chartPalette.length]} />
            {/* Liabilities side */}
            <Bar dataKey="equity" name={t.equity || "Capitaux propres"} stackId="liabilities" fill={chartPalette[0 % chartPalette.length]} />
            <Bar dataKey="ltDebt" name={t.lt_debt || "Dettes LT"} stackId="liabilities" fill={chartPalette[3 % chartPalette.length]} />
            <Bar dataKey="stDebt" name={t.st_debt || "Dettes CT"} stackId="liabilities" fill={chartPalette[6 % chartPalette.length]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 3. Assumptions card — 2-column grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          {
            title: t.hyp_client_title || "Delai clients",
            hint: t.hyp_client_hint || "Delai moyen en jours avant de recevoir le paiement.",
            input: <NumberField value={cfg.paymentTermsClient || 30} onChange={function (v) { cfgSet("paymentTermsClient", v); }} min={0} max={180} step={15} width="100px" suf={" " + (t.hyp_days || "jours")} />,
          },
          {
            title: t.hyp_supplier_title || "Delai fournisseurs",
            hint: t.hyp_supplier_hint || "Delai moyen en jours avant de payer vos fournisseurs.",
            input: <NumberField value={cfg.paymentTermsSupplier || 30} onChange={function (v) { cfgSet("paymentTermsSupplier", v); }} min={0} max={180} step={15} width="100px" suf={" " + (t.hyp_days || "jours")} />,
          },
        ].map(function (card, ci) {
          return (
            <div key={ci} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.4 }}>
                    {card.hint}
                  </div>
                </div>
                {card.input}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Detailed year tables — collapsed by default ── */}
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <button
          onClick={function () { setShowDetail(function (prev) { return !prev; }); }}
          style={{
            display: "flex", alignItems: "center", gap: "var(--sp-2)",
            padding: "var(--sp-2) var(--sp-4)",
            border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
            background: "var(--bg-card)", color: "var(--text-secondary)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            width: "100%", justifyContent: "center",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          {showDetail ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
          {showDetail ? (t.hide_details || "Masquer le detail") : (t.show_details || "Voir le detail comptable")}
        </button>

        {showDetail ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)", marginTop: "var(--gap-md)" }}>
            {yearData.map(function (data) {
              return <BalanceColumn key={data.year} year={data.year} data={data} showPcmn={showPcmn} t={t} />;
            })}
          </div>
        ) : null}
      </div>

      {/* ── 5. Financing Plan — Sources vs Uses ── */}
      <FinancingPlan cfg={cfg} assets={assets} debts={debts} stocks={stocks} y1={y1} showPcmn={showPcmn} t={t} />
    </PageLayout>
  );
}
