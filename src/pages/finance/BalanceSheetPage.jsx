import { useMemo, useState } from "react";
import { Scales, CaretDown, CaretUp } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  Warning, Wallet, TrendDown, CheckCircle, Scales as ScalesIcon,
  Lightbulb, Info, ShieldCheck,
} from "@phosphor-icons/react";
import {
  PageLayout, KpiCard, SelectDropdown, NumberField, PaletteToggle,
  AlertCard, FinanceLink, Button, Card, DataTable, Badge,
  SearchInput, FilterDropdown, ExportButtons, InsightCarousel, StackedBar,
} from "../../components";
import { eur, eurShort, calcMonthlyPatronal, calcSocialDue } from "../../utils";
import { useT } from "../../context";

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
    <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
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
          <div style={{ marginTop: "var(--sp-3)" }}>
            <AlertCard color="error" title={t.warn_negative_equity_title || "Fonds propres négatifs"}>
              {t.warn_negative_equity_desc || "Les pertes cumulées dépassent le capital social. En droit belge, le conseil d'administration doit convoquer une assemblée générale extraordinaire."}{" "}
              <FinanceLink term="equity" label={t.warn_equity_link || "fonds propres"} desc={t.warn_equity_link_desc || "Capitaux propres = capital social + réserves + résultat reporté."} />
            </AlertCard>
          </div>
        ) : null}
        {data.cash < 0 ? (
          <div style={{ marginTop: "var(--sp-3)" }}>
            <AlertCard color="warning" title={t.warn_negative_cash_title || "Trésorerie négative"}>
              {t.warn_negative_cash_desc || "Le besoin en financement dépasse les ressources disponibles."}{" "}
              <FinanceLink term="cashflow" label={t.warn_cash_link || "trésorerie"} desc={t.warn_cash_link_desc || "L'argent disponible pour faire face aux dépenses courantes."} />
            </AlertCard>
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

  /* ── Insight cards for InsightCarousel ── */
  var debtRatio = y1.totalEquity !== 0 ? Math.abs((y1.ltDebt + y1.totalStDebt) / y1.totalEquity) : 0;
  var lk = (useT()._lang || "fr") === "en" ? "en" : "fr";
  var insightCards = [];
  if (y1.totalEquity < 0) {
    insightCards.push({
      id: "neg_equity", icon: Warning, color: "error",
      title: lk === "fr" ? "Fonds propres négatifs" : "Negative equity",
      body: lk === "fr"
        ? <span>Les pertes cumulées dépassent le capital. Envisagez une augmentation de capital ou un apport en <FinanceLink term="equity" label="compte courant" desc="Capitaux propres = capital + réserves + résultat reporté." />.</span>
        : <span>Cumulated losses exceed capital. Consider a capital increase or <FinanceLink term="equity" label="shareholder loan" desc="Equity = capital + reserves + retained earnings." />.</span>,
    });
  }
  if (y1.cash < 0) {
    insightCards.push({
      id: "neg_cash", icon: Wallet, color: "warning",
      title: lk === "fr" ? "Trésorerie négative" : "Negative cash",
      body: lk === "fr"
        ? <span>Il manque <strong>{eur(Math.abs(y1.cash))}</strong> pour couvrir vos dépenses. Un emprunt ou un apport peut combler ce <FinanceLink term="cashflow" label="besoin de trésorerie" desc="L'argent disponible pour les dépenses courantes." />.</span>
        : <span>You need <strong>{eur(Math.abs(y1.cash))}</strong> more to cover expenses. A loan or contribution can fill this <FinanceLink term="cashflow" label="cash need" desc="Cash available for day-to-day operations." />.</span>,
    });
  }
  if (debtRatio > 0.7 && y1.totalEquity > 0) {
    insightCards.push({
      id: "high_debt", icon: TrendDown, color: "warning",
      title: lk === "fr" ? "Endettement élevé" : "High leverage",
      body: lk === "fr"
        ? <span>Votre ratio d'endettement est de {debtRatio.toFixed(1)}x. Au-delà de 0,7x, les banques considèrent que le risque est élevé.</span>
        : <span>Your debt ratio is {debtRatio.toFixed(1)}x. Above 0.7x, banks consider the risk to be high.</span>,
    });
  }
  var surplus = (function () {
    var totalSources = (cfg.capitalSocial || 0) + (cfg.capitalPremium || 0) + (cfg.shareholderLoans || 0);
    (debts || []).forEach(function (d) { totalSources += d.amount || 0; });
    if (y1.retainedEarnings > 0) totalSources += y1.retainedEarnings;
    var totalInvestments = 0;
    (assets || []).forEach(function (a) { totalInvestments += a.amount || 0; });
    var stockV = 0;
    (stocks || []).forEach(function (s) { stockV += (s.unitCost || 0) * (s.quantity || 0); });
    var bfr = (y1.receivables || 0) + stockV - (y1.suppliers || 0);
    return totalSources - totalInvestments - (bfr > 0 ? bfr : 0);
  })();
  if (surplus > 0) {
    insightCards.push({
      id: "surplus", icon: CheckCircle, color: "success",
      title: lk === "fr" ? "Excédent de financement" : "Financing surplus",
      body: lk === "fr"
        ? <span>Vos sources dépassent vos besoins de <strong>{eur(surplus)}</strong>. C'est un bon signe de solidité financière.</span>
        : <span>Your sources exceed needs by <strong>{eur(surplus)}</strong>. This is a good sign of financial strength.</span>,
    });
  }

  /* Default tips when no alerts — always show at least 2 useful cards */
  if (insightCards.length === 0) {
    insightCards.push(
      {
        id: "tip_balance", icon: Lightbulb, color: "info",
        title: lk === "fr" ? "Le bilan, c'est quoi ?" : "What is a balance sheet?",
        body: lk === "fr"
          ? <span>Le bilan montre ce que votre entreprise possède (<FinanceLink term="fixed_assets" label="actif" desc="Tout ce que possède l'entreprise : équipements, stocks, trésorerie." />) et ce qu'elle doit (<FinanceLink term="equity" label="passif" desc="Comment l'actif est financé : capital, emprunts, dettes fournisseurs." />). Les deux totaux doivent toujours être égaux.</span>
          : <span>The balance sheet shows what your company owns (<FinanceLink term="fixed_assets" label="assets" desc="Everything the company owns: equipment, stock, cash." />) and what it owes (<FinanceLink term="equity" label="liabilities" desc="How assets are financed: capital, loans, supplier debts." />). Both totals must always match.</span>,
      },
      {
        id: "tip_equity", icon: ShieldCheck, color: "brand",
        title: lk === "fr" ? "Capitaux propres positifs" : "Positive equity",
        body: lk === "fr"
          ? "Des capitaux propres positifs signifient que votre entreprise a plus de valeur que de dettes. C'est un indicateur de solidité que les banques et investisseurs regardent en premier."
          : "Positive equity means your company is worth more than it owes. This is a key indicator of strength that banks and investors look at first.",
      }
    );
  }

  /* ── StackedBar data for asset/liability breakdown ── */
  var [breakdownSide, setBreakdownSide] = useState("assets");
  var [breakdownYear, setBreakdownYear] = useState(1);
  var bkData = yearData.find(function (yd) { return yd.year === breakdownYear; }) || y1;
  var bkBarData = {};
  var bkLabels = {};
  if (breakdownSide === "assets") {
    if (bkData.netAssets > 0) { bkBarData.netAssets = bkData.netAssets; bkLabels.netAssets = lk === "fr" ? "Immobilisations" : "Fixed assets"; }
    if (bkData.stockValue > 0) { bkBarData.stocks = bkData.stockValue; bkLabels.stocks = "Stocks"; }
    if (bkData.receivables > 0) { bkBarData.receivables = bkData.receivables; bkLabels.receivables = lk === "fr" ? "Créances" : "Receivables"; }
    if (bkData.cash > 0) { bkBarData.cash = bkData.cash; bkLabels.cash = lk === "fr" ? "Trésorerie" : "Cash"; }
  } else {
    if (bkData.totalEquity !== 0) { bkBarData.equity = Math.abs(bkData.totalEquity); bkLabels.equity = lk === "fr" ? "Capitaux propres" : "Equity"; }
    if ((bkData.ltDebt || 0) + (bkData.shareholderLoans || 0) > 0) { bkBarData.ltDebt = (bkData.ltDebt || 0) + (bkData.shareholderLoans || 0); bkLabels.ltDebt = lk === "fr" ? "Dettes LT" : "LT Debt"; }
    if (bkData.totalStDebt > 0) { bkBarData.stDebt = bkData.totalStDebt; bkLabels.stDebt = lk === "fr" ? "Dettes CT" : "ST Debt"; }
  }

  /* ── DataTable rows for balance sheet detail — with collapsible sections ── */
  var [bsSearch, setBsSearch] = useState("");
  var [bsSideFilter, setBsSideFilter] = useState("all");
  var [collapsedSections, setCollapsedSections] = useState({});

  function toggleSection(sectionId) {
    setCollapsedSections(function (prev) { var nc = Object.assign({}, prev); nc[sectionId] = !nc[sectionId]; return nc; });
  }

  var BS_SECTIONS = [
    { id: "sec_fixed", side: "assets", label: t.fixed_assets || "Actifs immobilisés", pcmn: "Cl. 2", items: [
      { id: "grossAssets", pcmn: "2", label: t.gross_assets || "Immobilisations brutes", fn: function (d) { return d.grossAssets; } },
      { id: "cumulDep", pcmn: "28", label: t.cumul_dep || "Amortissements cumulés", fn: function (d) { return -d.cumulDep; } },
      { id: "netAssets", pcmn: "20-28", label: t.net_assets || "Immobilisations nettes", bold: true, fn: function (d) { return d.netAssets; } },
    ]},
    { id: "sec_current", side: "assets", label: t.current_assets || "Actifs circulants", pcmn: "Cl. 3-5", items: [
      { id: "stockValue", pcmn: "30-37", label: t.stocks || "Stocks", fn: function (d) { return d.stockValue; } },
      { id: "receivables", pcmn: "40", label: t.receivables || "Créances commerciales", fn: function (d) { return d.receivables; } },
      { id: "vatCredit", pcmn: "41", label: t.vat_credit || "TVA à récupérer", fn: function (d) { return d.vatCredit; } },
      { id: "cash", pcmn: "55-57", label: t.cash || "Trésorerie", fn: function (d) { return d.cash; } },
    ]},
    { id: "sec_total_assets", side: "assets", total: true, label: t.total_assets || "TOTAL ACTIF", items: [] },
    { id: "sec_equity", side: "liabilities", label: t.equity || "Capitaux propres", pcmn: "Cl. 1", items: [
      { id: "capital", pcmn: "10", label: t.capital || "Capital social", fn: function (d) { return d.capital; } },
      { id: "capitalPremium", pcmn: "11", label: t.share_premium || "Prime d'émission", fn: function (d) { return d.capitalPremium; } },
      { id: "reserves", pcmn: "13", label: t.reserves || "Réserve légale", fn: function (d) { return d.reserves; } },
      { id: "retained", pcmn: "14", label: t.retained || "Résultat reporté", negative: true, fn: function (d) { return d.retainedEarnings; } },
      { id: "totalEquity", pcmn: "", label: t.total_equity || "Total capitaux propres", bold: true, fn: function (d) { return d.totalEquity; } },
    ]},
    { id: "sec_lt_debt", side: "liabilities", label: t.lt_debt || "Dettes à plus d'un an", pcmn: "Cl. 17", items: [
      { id: "ltDebt", pcmn: "17", label: t.bank_loans || "Emprunts", fn: function (d) { return d.ltDebt; } },
      { id: "shareholderLoans", pcmn: "174", label: t.shareholder_loans || "Compte courant associé", fn: function (d) { return d.shareholderLoans; } },
    ]},
    { id: "sec_st_debt", side: "liabilities", label: t.st_debt || "Dettes à un an au plus", pcmn: "Cl. 4", items: [
      { id: "suppliers", pcmn: "44", label: t.suppliers || "Dettes fournisseurs", fn: function (d) { return d.suppliers; } },
      { id: "vatDue", pcmn: "45", label: t.vat_due || "TVA à payer", fn: function (d) { return d.vatDue; } },
      { id: "socialDue", pcmn: "45", label: t.social_due || "ONSS à payer", fn: function (d) { return d.socialDue; } },
      { id: "isocProv", pcmn: "45", label: t.isoc_provision || "Provision ISOC", fn: function (d) { return d.isocProvision; } },
    ]},
    { id: "sec_total_liabilities", side: "liabilities", total: true, label: t.total_liabilities || "TOTAL PASSIF", items: [] },
  ];

  var bsTableRows = useMemo(function () {
    var rows = [];
    BS_SECTIONS.forEach(function (section) {
      if (bsSideFilter !== "all" && section.side !== bsSideFilter) return;

      /* Total rows (no children) */
      if (section.total) {
        var totalObj = { id: section.id, pcmn: "", label: section.label, side: section.side, bold: true, total: true, isSection: false };
        yearData.forEach(function (d) {
          totalObj["y" + d.year] = section.id === "sec_total_assets" ? d.totalAssets : d.totalLiabilities;
        });
        rows.push(totalObj);
        return;
      }

      /* Section header row */
      var sectionTotal = {};
      yearData.forEach(function (d) {
        var sum = 0;
        section.items.forEach(function (item) { sum += Math.abs(item.fn(d) || 0); });
        sectionTotal["y" + d.year] = sum;
      });
      var headerObj = Object.assign({ id: section.id, pcmn: section.pcmn || "", label: section.label, side: section.side, bold: true, isSection: true, collapsed: !!collapsedSections[section.id], itemCount: section.items.length }, sectionTotal);
      rows.push(headerObj);

      /* Child rows (hidden when collapsed) */
      if (!collapsedSections[section.id]) {
        section.items.forEach(function (item) {
          if (bsSearch.trim()) {
            var q = bsSearch.trim().toLowerCase();
            if (item.label.toLowerCase().indexOf(q) < 0 && (item.pcmn || "").indexOf(q) < 0) return;
          }
          var obj = { id: item.id, pcmn: item.pcmn || "", label: item.label, side: section.side, bold: item.bold, indent: !item.bold, negative: item.negative, isSection: false };
          yearData.forEach(function (d) { obj["y" + d.year] = item.fn(d); });
          rows.push(obj);
        });
      }
    });
    return rows;
  }, [yearData, bsSearch, bsSideFilter, collapsedSections]);

  var bsTableCols = useMemo(function () {
    var cols = [
      {
        id: "pcmn", header: "PCMN", enableSorting: false, meta: { align: "center", width: 70 },
        accessorFn: function (r) { return r.pcmn; },
        cell: function (info) {
          var r = info.row.original;
          var v = info.getValue();
          if (r.isSection) return <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)" }}>{v}</span>;
          return v ? <Badge color="gray" size="sm">{v}</Badge> : null;
        },
      },
      {
        id: "label", header: lk === "fr" ? "Libellé" : "Label",
        enableSorting: false, meta: { align: "left", minWidth: 220, grow: true },
        accessorFn: function (r) { return r.label; },
        cell: function (info) {
          var r = info.row.original;
          if (r.isSection) {
            return (
              <div
                onClick={function () { toggleSection(r.id); }}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
              >
                {r.collapsed
                  ? <CaretDown size={12} weight="bold" color="var(--text-muted)" />
                  : <CaretUp size={12} weight="bold" color="var(--text-muted)" />}
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{r.label}</span>
                <span style={{ fontSize: 11, color: "var(--text-faint)" }}>({r.itemCount})</span>
              </div>
            );
          }
          return <span style={{ fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400, color: r.total ? "var(--text-primary)" : r.bold ? "var(--text-primary)" : "var(--text-secondary)", paddingLeft: r.indent ? 12 : 0 }}>{r.label}</span>;
        },
      },
    ];
    yearData.forEach(function (d) {
      var yKey = "y" + d.year;
      cols.push({
        id: yKey, header: (t.year_label || "Année") + " " + d.year,
        enableSorting: false, meta: { align: "right" },
        accessorFn: function (r) { return r[yKey]; },
        cell: function (info) {
          var r = info.row.original;
          var v = info.getValue() || 0;
          var isNeg = r.negative && v < 0;
          if (r.isSection) return <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(v)}</span>;
          return <span style={{ fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400, fontVariantNumeric: "tabular-nums", fontFamily: r.bold ? "'Bricolage Grotesque', sans-serif" : "inherit", color: isNeg ? "var(--color-error)" : r.bold ? "var(--text-primary)" : "var(--text-secondary)" }}>{eur(v)}</span>;
        },
      });
    });
    return cols;
  }, [yearData, lk, t, collapsedSections]);

  var bsSideOptions = [
    { value: "all", label: lk === "fr" ? "Actif + Passif" : "Assets + Liabilities" },
    { value: "assets", label: lk === "fr" ? "Actif" : "Assets" },
    { value: "liabilities", label: lk === "fr" ? "Passif" : "Liabilities" },
  ];

  return (
    <PageLayout title={t.title || "Bilan previsionnel"} subtitle={t.subtitle || "Projection de la situation patrimoniale de l'entreprise a la fin de chaque exercice."} icon={Scales} iconColor="var(--text-muted)">

      {/* ── 1. KPI cards ── */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-md)" }}>
        <KpiCard label={t.kpi_assets || "Total actif Y1"} value={y1.totalAssets != null ? eurShort(y1.totalAssets) : "\u2014"} fullValue={y1.totalAssets != null ? eur(y1.totalAssets) : undefined} />
        <KpiCard label={t.kpi_equity || "Capitaux propres Y1"} value={y1.totalEquity != null ? eurShort(y1.totalEquity) : "\u2014"} fullValue={y1.totalEquity != null ? eur(y1.totalEquity) : undefined} />
        <KpiCard label={t.kpi_cash || "Tresorerie Y1"} value={y1.cash != null ? eurShort(y1.cash) : "\u2014"} fullValue={y1.cash != null ? eur(y1.cash) : undefined} glossaryKey="treasury" />
        <KpiCard label={t.kpi_debt_ratio || "Ratio d'endettement"} value={y1.totalEquity !== 0 ? debtRatio.toFixed(2) + "x" : "\u2014"} />
      </div>

      {/* ── 1b. Insight Carousel — always below KPIs ── */}
      <InsightCarousel cards={insightCards} />

      {/* ── 2. Chart composition — fullwidth ── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.chart_title || "Composition du bilan"}
          </div>
          <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={8} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={function (v) { return eurShort(v); }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={function (value) { return <span style={{ color: "var(--text-secondary)" }}>{value}</span>; }} />
            <Bar dataKey="netAssets" name={t.net_assets || "Immobilisations"} stackId="assets" fill={chartPalette[4 % chartPalette.length]} />
            <Bar dataKey="stocks" name={t.stocks || "Stocks"} stackId="assets" fill={chartPalette[5 % chartPalette.length]} />
            <Bar dataKey="receivables" name={t.receivables || "Créances"} stackId="assets" fill={chartPalette[1 % chartPalette.length]} />
            <Bar dataKey="cash" name={t.cash || "Trésorerie"} stackId="assets" fill={chartPalette[2 % chartPalette.length]} />
            <Bar dataKey="equity" name={t.equity || "Capitaux propres"} stackId="liabilities" fill={chartPalette[0 % chartPalette.length]} />
            <Bar dataKey="ltDebt" name={t.lt_debt || "Dettes LT"} stackId="liabilities" fill={chartPalette[3 % chartPalette.length]} />
            <Bar dataKey="stDebt" name={t.st_debt || "Dettes CT"} stackId="liabilities" fill={chartPalette[6 % chartPalette.length]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 3. StackedBar breakdown — fullwidth ── */}
      <Card sx={{ padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {lk === "fr" ? "Répartition" : "Breakdown"}
          </div>
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
            {/* Toggle switch Actif / Passif */}
            <div style={{ display: "flex", height: 40, borderRadius: "var(--r-md)", border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
              {["assets", "liabilities"].map(function (side) {
                var isActive = breakdownSide === side;
                var label = side === "assets" ? (lk === "fr" ? "Actif" : "Assets") : (lk === "fr" ? "Passif" : "Liabilities");
                return (
                  <button key={side} type="button" onClick={function () { setBreakdownSide(side); }}
                    style={{
                      padding: "0 14px", fontSize: 12, fontWeight: isActive ? 600 : 400,
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                      background: isActive ? "var(--brand)" : "transparent",
                      color: isActive ? "white" : "var(--text-muted)",
                      transition: "background 0.15s, color 0.15s",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
            <FilterDropdown value={String(breakdownYear)} onChange={function (v) { setBreakdownYear(parseInt(v, 10)); }} options={yearData.map(function (yd) {
              return { value: String(yd.year), label: (t.year_label || "Année") + " " + yd.year };
            })} />
          </div>
        </div>
        <StackedBar data={bkBarData} labels={bkLabels} palette={chartPalette} formatter={function (v) { return eur(v); }} />
      </Card>

      {/* ── 4. Hypothèses ── */}
      <Card sx={{ padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-4)" }}>
          {lk === "fr" ? "Hypothèses" : "Assumptions"}
        </div>
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
          <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{t.hyp_client_title || "Délai clients"}</span>
              <NumberField value={cfg.paymentTermsClient || 30} onChange={function (v) { cfgSet("paymentTermsClient", v); }} min={0} max={180} step={15} width="90px" suf={" " + (t.hyp_days || "j")} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>{t.hyp_client_hint || "Délai moyen en jours avant de recevoir le paiement."}</div>
          </div>
          <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{t.hyp_supplier_title || "Délai fournisseurs"}</span>
              <NumberField value={cfg.paymentTermsSupplier || 30} onChange={function (v) { cfgSet("paymentTermsSupplier", v); }} min={0} max={180} step={15} width="90px" suf={" " + (t.hyp_days || "j")} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>{t.hyp_supplier_hint || "Délai moyen en jours avant de payer vos fournisseurs."}</div>
          </div>
        </div>
      </Card>

      {/* ── 5. DataTable Bilan ── */}
      <DataTable
        data={bsTableRows}
        columns={bsTableCols}
        toolbar={
          <>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={bsSearch} onChange={setBsSearch} placeholder={lk === "fr" ? "Rechercher un poste…" : "Search a line item…"} />
              <FilterDropdown value={bsSideFilter} onChange={setBsSideFilter} options={bsSideOptions} />
              <FilterDropdown value={String(horizon)} onChange={function (v) { setHorizon(parseInt(v, 10)); }} options={[
                { value: "1", label: "1 " + (t.year || "an") },
                { value: "2", label: "2 " + (t.years || "ans") },
                { value: "3", label: "3 " + (t.years || "ans") },
              ]} />
            </div>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
              <ExportButtons columns={bsTableCols} data={bsTableRows} filename="bilan" />
            </div>
          </>
        }
        getRowId={function (row) { return row.id; }}
        highlightRow={function (row) { return row.isSection; }}
        compact
        showFooter={false}
        pageSize={50}
      />

      {/* ── 5. Financing Plan — Sources vs Uses ── */}
      <FinancingPlan cfg={cfg} assets={assets} debts={debts} stocks={stocks} y1={y1} showPcmn={showPcmn} t={t} />
    </PageLayout>
  );
}
