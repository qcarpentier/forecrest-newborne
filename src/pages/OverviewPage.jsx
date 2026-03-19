import { useMemo, useState, useEffect } from "react";
import { brand, ok, err, warn } from "../constants/colors";
import { Card, Row, Accordion, PageLayout, Button } from "../components";
import { InfoTip } from "../components/Tooltip";
import Sparkline from "../components/Sparkline";
import ExplainerBox from "../components/ExplainerBox";
import BreakEvenChart from "../components/BreakEvenChart";
import { eur, eurShort, pct, calcHealthScore } from "../utils";
import { calcStreamMonthly } from "../utils/revenueCalc";
import { DevVal } from "../components";
import { linkSettings } from "../utils/linkSettings";
import { Warning, TrendUp, ChartBar, Receipt, Scales, CurrencyCircleDollar, Gauge, Bank, ChartLine, FilePdf, Users, CaretDown, Vault, Hourglass } from "@phosphor-icons/react";
import { useT, useLang } from "../context";

/* ─── tiny helpers ─── */

function KpiCard({ label, value, fullValue, sub, color, icon, spark, sparkColor, target, current, onClick }) {
  var progress = target && target > 0 && current != null ? Math.min(current / target, 1) : null;
  var hit = progress !== null && progress >= 1;
  var hasTooltip = fullValue && fullValue !== String(value) && !/^0[.,]?0*\s/.test(fullValue);
  var [hover, setHover] = useState(false);
  return (
    <Card onClick={onClick} sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)", position: "relative", cursor: onClick ? "pointer" : undefined, borderLeft: hit ? "3px solid var(--color-success)" : progress !== null ? "3px solid var(--color-warning)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        {icon ? <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span> : null}
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, flex: 1 }}>{String(label)}</span>
        {spark ? <Sparkline data={spark} color={sparkColor || color || "var(--brand)"} width={72} height={22} /> : null}
      </div>
      <div
        onMouseEnter={hasTooltip ? function () { setHover(true); } : undefined}
        onMouseLeave={hasTooltip ? function () { setHover(false); } : undefined}
        style={{ fontSize: 28, fontWeight: 700, color: color || "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em", position: "relative", cursor: hasTooltip ? "help" : undefined }}
      >
        {String(value)}
        {hasTooltip && hover ? (
          <span style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: 0,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", boxShadow: "var(--shadow-dropdown)",
            padding: "4px 10px", fontSize: 13, fontWeight: 600,
            color: "var(--text-primary)", whiteSpace: "nowrap", zIndex: 100,
            pointerEvents: "none",
          }}>
            {fullValue}
          </span>
        ) : null}
      </div>
      {progress !== null ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: progress * 100 + "%", background: hit ? "var(--color-success)" : "var(--color-warning)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: hit ? "var(--color-success)" : "var(--text-faint)", whiteSpace: "nowrap" }}>{Math.round(progress * 100)}%</span>
        </div>
      ) : null}
      {sub ? <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{sub}</div> : null}
    </Card>
  );
}

function SectionHeader({ icon, title, sub, collapsed, onToggle }) {
  return (
    <div
      style={{ marginBottom: collapsed ? "var(--sp-2)" : "var(--sp-4)", cursor: onToggle ? "pointer" : undefined, userSelect: "none" }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: sub && !collapsed ? "var(--sp-1)" : 0 }}>
        {icon ? <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span> : null}
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", flex: 1 }}>{String(title)}</h2>
        {onToggle ? (
          <CaretDown size={14} weight="bold" color="var(--text-faint)"
            style={{ transition: "transform 200ms", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", flexShrink: 0 }} />
        ) : null}
      </div>
      {sub && !collapsed ? <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{sub}</p> : null}
    </div>
  );
}

function ProgressBar({ value, color, height }) {
  var clamped = Math.max(0, Math.min(value, 1));
  return (
    <div style={{ height: height || 6, background: "var(--border)", borderRadius: height || 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: clamped * 100 + "%", background: color || brand, borderRadius: height || 6, transition: "width 0.4s ease" }} />
    </div>
  );
}

function StatusBadge({ label, positive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 600,
      background: positive ? "var(--color-success-bg)" : "var(--color-error-bg)",
      color: positive ? "var(--color-success)" : "var(--color-error)",
      border: "1px solid " + (positive ? "var(--color-success-border)" : "var(--color-error-border)"),
    }}>
      {String(label)}
    </span>
  );
}

/* ─── BFR simulation helpers ─── */

function DelayPills({ value, onChange, options, label }) {
  return (
    <div style={{ marginBottom: "var(--sp-3)" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(function (d) {
          var active = d === value;
          return (
            <button key={d} onClick={function () { onChange(d); }} style={{
              height: 36, minWidth: 44, padding: "0 14px", borderRadius: "var(--r-full)",
              border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
              background: active ? "var(--brand)" : "transparent",
              color: active ? "#fff" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 150ms",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              {d + " j"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CashCycleViz({ clientDelay, supplierDelay, clientLabel, supplierLabel }) {
  var maxDay = Math.max(clientDelay, supplierDelay, 1);
  var clientPct = (clientDelay / maxDay) * 100;
  var supplierPct = (supplierDelay / maxDay) * 100;
  var gap = clientDelay - supplierDelay;

  return (
    <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", marginBottom: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
        <Hourglass size={14} weight="duotone" color="var(--text-muted)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Cycle de trésorerie</span>
      </div>
      <div style={{ marginBottom: "var(--sp-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{clientLabel}</span>
          <div style={{ flex: 1, height: 14, background: "var(--border)", borderRadius: 7, overflow: "hidden", position: "relative" }}>
            <div style={{ height: "100%", width: Math.max(clientPct, 2) + "%", background: clientDelay > supplierDelay ? "var(--color-warning)" : "var(--color-success)", borderRadius: 7, transition: "width 300ms ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", width: 40, textAlign: "right" }}>{clientDelay + " j"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{supplierLabel}</span>
          <div style={{ flex: 1, height: 14, background: "var(--border)", borderRadius: 7, overflow: "hidden", position: "relative" }}>
            <div style={{ height: "100%", width: Math.max(supplierPct, 2) + "%", background: supplierDelay >= clientDelay ? "var(--color-warning)" : "var(--color-success)", borderRadius: 7, transition: "width 300ms ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", width: 40, textAlign: "right" }}>{supplierDelay + " j"}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--sp-2)", marginTop: "var(--sp-2)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Décalage</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: gap <= 0 ? "var(--color-success)" : gap <= 30 ? "var(--color-warning)" : "var(--color-error)" }}>
          {gap <= 0 ? gap + " j" : "+" + gap + " j"}
        </span>
      </div>
    </div>
  );
}

/* ─── SVG donut ─── */

function HealthDonut({ score, items }) {
  var r = 32;
  var circ = 2 * Math.PI * r;
  var pctV = Math.max(0, Math.min(score, 100)) / 100;
  var color = score >= 75 ? "var(--color-success)" : score >= 50 ? "var(--color-warning)" : "var(--color-error)";

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "var(--sp-3)" }}>
        <svg width={80} height={80} viewBox="0 0 80 80">
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth={7} />
          <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={pctV * circ + " " + circ}
            strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
          <text x={40} y={40} textAnchor="middle" dominantBaseline="central"
            fontSize={22} fontWeight={700} fill={color}
            fontFamily="'Bricolage Grotesque','DM Sans',sans-serif">{score}</text>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(function (item) {
          var c = item.value >= 75 ? "var(--color-success)" : item.value >= 50 ? "var(--color-warning)" : "var(--color-error)";
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", width: 72, flexShrink: 0 }}>{item.label}</span>
              <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: item.value + "%", background: c, borderRadius: 3, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", width: 24, textAlign: "right" }}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── main component ─── */

function getGreeting(lang, userName) {
  var h = new Date().getHours();
  var greetings = {
    fr: h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir",
    en: h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
  };
  var g = greetings[lang] || greetings.fr;
  return userName ? g + ", " + userName : g;
}

export default function OverviewPage({
  arrV, totalRevenue, extraStreamsMRR, streams,
  monthlyCosts, totS, annC, ebitda, annualInterest,
  isocR, isocS, isoc, isocEff, netP,
  resLeg, resTarget, dirRem, dirOk,
  divGross, mGross, strPct, strNeed, cfg,
  annVatC, annVatD, vatBalance,
  onPrint, profs, setTab, debts,
  marketingData, bizKpis,
}) {
  var tAll = useT();
  var t = tAll.overview;
  var { lang } = useLang();

  /* ─── dismissible tip ─── */
  var [tipDismissed, setTipDismissed] = useState(function () {
    try { return localStorage.getItem("ov-tip-dismissed") === "1"; } catch (e) { return false; }
  });
  function dismissTip() {
    setTipDismissed(true);
    try { localStorage.setItem("ov-tip-dismissed", "1"); } catch (e) {}
  }

  /* ─── health score ─── */
  var health = useMemo(function () {
    return calcHealthScore({
      totalRevenue: totalRevenue,
      monthlyCosts: monthlyCosts,
      ebitda: ebitda,
      cfg: cfg,
      revY1: totalRevenue,
    });
  }, [totalRevenue, monthlyCosts, ebitda, cfg]);

  /* ─── shared values ─── */
  var streamsList = [];
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      streamsList.push({ label: item.l || item.name, mrr: calcStreamMonthly(item), color: "var(--brand)", on: true });
    });
  });

  var totalMRR = totalRevenue / 12;
  var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
  var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
  var monthlyRevenue = totalRevenue / 12;
  var isProfitable = monthlyRevenue >= monthlyCosts;
  var netBurn = monthlyCosts - monthlyRevenue;
  var VAL_MULTIPLES = [3, 5, 8, 10];

  var totalDebt = 0;
  (debts || []).forEach(function (d) { if (d.amount > 0) totalDebt += d.amount; });

  var fr = cfg.capitalSocial + resLeg + netP;
  var bfr = -monthlyCosts;
  var tresoNette = fr - bfr;

  var clientReceivable = monthlyRevenue * (clientDelay / 30);
  var supplierPayable = monthlyCosts * (supplierDelay / 30);
  var bfrSim = clientReceivable - supplierPayable;
  var cashCycleDays = clientDelay - supplierDelay;
  var tresoSim = fr - bfrSim;

  var targets = cfg.targets || {};
  var arpuMonthly = totS > 0 ? totalMRR / totS : 0;
  var churn = cfg.churnMonthly || 0.03;
  var ltv = churn > 0 ? arpuMonthly / churn : 0;
  var hasMarketing = marketingData && marketingData.cacBlended > 0;
  var cac = hasMarketing ? marketingData.cacBlended : (cfg.cacTarget || 0);
  var ltvCac = cac > 0 && ltv > 0 ? ltv / cac : 0;
  var payback = cac > 0 && arpuMonthly > 0 ? cac / arpuMonthly : 0;
  var roas = hasMarketing ? marketingData.roas : 0;

  var [bfrOpen, setBfrOpen] = useState(function () {
    try { return JSON.parse(localStorage.getItem("ov-bfr") || "false"); } catch (e) { return false; }
  });

  var [advancedOpen, setAdvancedOpen] = useState(false);

  var [clientDelay, setClientDelay] = useState(30);
  var [supplierDelay, setSupplierDelay] = useState(30);

  useEffect(function () { try { localStorage.setItem("ov-bfr", bfrOpen); } catch (e) {} }, [bfrOpen]);

  var sparkData = useMemo(function () {
    var growth = 0.10;
    var mrrNow = totalMRR;
    var arrPts = [], mrrPts = [], costPts = [];
    for (var m = 0; m < 12; m++) {
      var factor = Math.pow(1 + growth, m);
      var mrr = mrrNow * factor;
      mrrPts.push(mrr);
      arrPts.push(mrr * 12);
      costPts.push(monthlyCosts);
    }
    return { arr: arrPts, mrr: mrrPts, costs: costPts };
  }, [totalMRR, monthlyCosts]);

  /* ─── print button ─── */
  var actionsNode = onPrint ? (
    <Button color="primary" size="sm" onClick={onPrint} iconLeading={<FilePdf size={14} weight="bold" />}>
      {tAll.settings.io_print_btn}
    </Button>
  ) : null;

  return (
    <PageLayout title={getGreeting(lang, cfg.userName || cfg.firstName)} subtitle={t.subtitle} actions={actionsNode}>

      {!tipDismissed ? (
        <ExplainerBox variant="tip" title={t.simple_tip_title} onClose={dismissTip}>
          {t.simple_tip_body}
        </ExplainerBox>
      ) : null}

      {/* ── KPIs ── */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-8)" }}>
        <KpiCard label={t.simple_kpi_revenue} value={eurShort(totalRevenue)} fullValue={eur(totalRevenue)} color={totalRevenue > 0 ? brand : undefined} icon={<TrendUp size={16} weight="bold" />} spark={sparkData.arr} sparkColor={brand} />
        <KpiCard label={t.simple_kpi_mrr} value={eurShort(totalMRR)} fullValue={eur(totalMRR)} icon={<ChartBar size={16} weight="bold" />} spark={sparkData.mrr} />
        <KpiCard label={t.simple_kpi_costs} value={eurShort(monthlyCosts)} fullValue={eur(monthlyCosts)} color={monthlyCosts > 0 ? err : undefined} icon={<Receipt size={16} weight="bold" />} spark={sparkData.costs} sparkColor={err} />
        <KpiCard label={t.simple_kpi_treasury} value={eurShort(tresoNette)} fullValue={eur(tresoNette)} color={tresoNette >= 0 ? ok : err} icon={<Vault size={16} weight="bold" />} />
      </div>

      {/* ── Break-Even Chart ── */}
      {(totalRevenue > 0 || monthlyCosts > 0) ? (
        <section style={{ marginBottom: "var(--sp-8)" }}>
          <SectionHeader icon={<ChartLine size={18} weight="bold" />} title={t.breakeven_title || "Seuil de rentabilité"} sub={t.breakeven_sub || "Projection mensuelle revenus vs charges"} />
          <Card>
            <BreakEvenChart monthlyRevenue={monthlyRevenue} monthlyCosts={monthlyCosts} growthRate={0.10} t={t} />
          </Card>
        </section>
      ) : null}

      {/* ── 1. REVENUS & RÉSULTAT ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<CurrencyCircleDollar size={18} weight="bold" />} title={t.section_revenue} sub={t.section_revenue_sub} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* P&L */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.pnl_title}</h3>
            {extraStreamsMRR > 0 ? (
              <>
                <Row label={t.pnl_revenue_platform} value={<DevVal v={eur(arrV)} f={"sum(signed × netHT × medY) = " + eur(arrV)} />} />
                <Row label={t.pnl_revenue_streams} value={<DevVal v={eur(extraStreamsMRR * 12)} f={eur(extraStreamsMRR) + "/mois × 12 = " + eur(extraStreamsMRR * 12)} />} />
                <Row label={t.pnl_revenue} value={<DevVal v={eur(totalRevenue)} f={eur(arrV) + " + " + eur(extraStreamsMRR * 12) + " = " + eur(totalRevenue)} />} bold tip={t.tip_revenue} />
              </>
            ) : (
              <Row label={t.pnl_revenue} value={<DevVal v={eur(totalRevenue)} f={"sum(streams Y1) = " + eur(totalRevenue)} />} bold tip={t.tip_revenue} />
            )}
            <Row label={t.pnl_opex} value={<DevVal v={"- " + eur(annC)} f={eur(monthlyCosts) + "/mois × 12 = " + eur(annC)} />} tip={t.tip_opex} />
            <Row label="EBITDA" value={<DevVal v={eur(ebitda)} f={eur(totalRevenue) + " - " + eur(annC) + " = " + eur(ebitda)} />} bold color={ebitda >= 0 ? ok : err} last={annualInterest <= 0} tip={t.tip_ebitda} />
            {annualInterest > 0 ? <Row label={t.pnl_interest} value={"- " + eur(annualInterest)} tip={t.tip_interest} /> : null}
            {annualInterest > 0 ? <Row label={t.pnl_ebt} value={<DevVal v={eur(ebitda - annualInterest)} f={eur(ebitda) + " - " + eur(annualInterest) + " = " + eur(ebitda - annualInterest)} />} bold color={ebitda - annualInterest >= 0 ? ok : err} last /> : null}

            <div style={{ marginTop: "var(--sp-4)" }}>
              <Accordion title={t.pnl_tax_detail} sub={t.pnl_tax_detail_sub}>
                <Row label={t.pnl_isoc20} value={<DevVal v={isocR > 0 ? "- " + eur(isocR) : "0 EUR"} f={"min(EBT, 100k) × 20% = " + eur(isocR)} />} tip={t.tip_isoc_pme} />
                <Row label={t.pnl_isoc25} value={<DevVal v={isocS > 0 ? "- " + eur(isocS) : "0 EUR"} f={"max(EBT - 100k, 0) × 25% = " + eur(isocS)} />} tip={t.tip_isoc_std} />
                <Row label={t.pnl_isoc_total(pct(isocEff))} value={<DevVal v={isoc > 0 ? "- " + eur(isoc) : "0 EUR"} f={eur(isocR) + " + " + eur(isocS) + " = " + eur(isoc)} />} bold />
                <Row label={t.pnl_net} value={<DevVal v={eur(netP)} f={eur(ebitda - annualInterest) + " - " + eur(isoc) + " = " + eur(netP)} />} bold color={netP >= 0 ? ok : err} />
                <Row label={t.pnl_reserve} value={eur(resLeg)} last tip={t.tip_reserve} />
                <div style={{ fontSize: 11, color: "var(--text-faint)", paddingTop: "var(--sp-1)" }}>
                  {resLeg >= resTarget ? t.pnl_reserve_done(eur(resTarget)) : t.pnl_reserve_todo(eur(resTarget), eur(resTarget - resLeg))}
                </div>
              </Accordion>
            </div>

            {!dirOk && ebitda > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-warning-border)", fontSize: 12, color: "var(--color-warning)", display: "flex", gap: "var(--sp-2)", alignItems: "flex-start" }}>
                <Warning size={14} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                {t.pnl_director_warning(eur(dirRem))}
              </div>
            ) : null}

            {totalDebt > 0 ? (
              <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-2)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <Bank size={14} weight="bold" color="var(--text-muted)" />
                    {t.simple_financing_title || "Financement"}
                  </span>
                  <button onClick={function () { setTab("debt"); }} style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.simple_financing_detail || "Détail"}</button>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-4)" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.simple_financing_total || "Emprunts"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{eur(totalDebt)}</div>
                  </div>
                  {annualInterest > 0 ? (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.simple_financing_interest || "Intérêts"}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: err }}>{eur(annualInterest)}{t.simple_financing_per_year || "/an"}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>

          {/* Revenue streams */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.streams_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.streams_sub}</p>
            {streamsList.map(function (s, i) {
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: i < streamsList.length - 1 ? "1px solid var(--border-light)" : "none", opacity: s.on ? 1 : 0.4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.on ? s.color : "var(--border-strong)", display: "inline-block", marginRight: "var(--sp-2)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.mrr > 0 ? "var(--text-primary)" : "var(--text-faint)" }}><DevVal v={eur(s.mrr)} f={s.label + " = " + eur(s.mrr) + "/mois"} /></span>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--sp-3)", marginTop: "var(--sp-2)", borderTop: "2px solid var(--border)" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.streams_total_mrr}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)" }}><DevVal v={eur(totalMRR)} f={eur(arrV / 12) + " + " + eur(extraStreamsMRR) + " = " + eur(totalMRR)} /></span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── 2. SANTÉ FINANCIÈRE ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<Gauge size={18} weight="bold" />} title={t.section_health} sub={t.section_health_sub} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* Health metrics */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t.health_title}</h3>
              <StatusBadge label={isProfitable ? t.health_profitable : t.health_deficit} positive={isProfitable} />
            </div>
            {[
              { label: t.health_ebitda_margin, value: ebitdaMargin, pctVal: pct(ebitdaMargin), color: ebitdaMargin >= 0.20 ? ok : ebitdaMargin >= 0 ? warn : err, tip: t.tip_ebitda_margin },
              { label: t.health_net_margin, value: netMargin, pctVal: pct(netMargin), color: netMargin >= 0.10 ? ok : netMargin >= 0 ? warn : err, tip: t.tip_net_margin },
            ].map(function (bar) {
              return (
                <div key={bar.label} style={{ marginBottom: "var(--sp-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                      {bar.label}
                      {bar.tip ? <InfoTip tip={bar.tip} width={240} /> : null}
                    </span>
                    <span style={{ fontWeight: 700, color: bar.color }}>{bar.pctVal}</span>
                  </div>
                  <ProgressBar value={Math.max(0, Math.min(bar.value, 1))} color={bar.color} height={6} />
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
              <Row label={t.health_burn} value={isProfitable ? "0 EUR" : <DevVal v={eur(netBurn)} f={eur(monthlyCosts) + " - " + eur(monthlyRevenue) + " = " + eur(netBurn)} />} color={isProfitable ? ok : err} tip={t.tip_burn} />
              <Row label={t.health_coverage} value={monthlyCosts > 0 ? <DevVal v={pct(Math.min(monthlyRevenue / monthlyCosts, 1))} f={eur(monthlyRevenue) + " / " + eur(monthlyCosts) + " = " + pct(monthlyRevenue / monthlyCosts)} /> : "–"} color={monthlyRevenue >= monthlyCosts ? ok : warn} last tip={t.tip_coverage} />
            </div>
          </Card>

          {/* Health score donut */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-3)" }}>{t.simple_health_title}</h3>
            <HealthDonut
              score={health.total}
              items={[
                { label: t.simple_health_profitability, value: health.profitability },
                { label: t.simple_health_liquidity, value: health.liquidity },
                { label: t.simple_health_solvency, value: health.solvency },
              ]}
            />
          </Card>
        </div>
      </section>

      {/* ── 3. BFR & FONDS DE ROULEMENT ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<Bank size={18} weight="bold" />} title={t.bfr_sim_title || "Fonds de roulement & BFR"} sub={t.bfr_sim_sub || "Comprenez l'équilibre entre vos ressources permanentes et vos besoins de trésorerie."} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* Fonds de Roulement */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.fr_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.bfr_sim_fr_desc || "Ressources stables disponibles pour financer votre activité courante."}</p>
            <Row label={t.fr_capital} value={<DevVal v={eur(cfg.capitalSocial)} f={"Capital social = " + eur(cfg.capitalSocial)} />} />
            <Row label={t.fr_reserve} value={eur(resLeg)} />
            <Row label={t.fr_result} value={<DevVal v={eur(netP)} f={"EBITDA - ISoc = " + eur(netP)} />} color={netP >= 0 ? ok : err} />
            <Row label={t.fr_label} value={<DevVal v={eur(fr)} f={eur(cfg.capitalSocial) + " + " + eur(resLeg) + " + " + eur(netP) + " = " + eur(fr)} />} bold color={fr >= 0 ? ok : err} last tip={t.tip_fr} />
            <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: fr >= 0 ? "var(--color-success-bg)" : "var(--color-error-bg)", borderRadius: "var(--r-md)", border: "1px solid " + (fr >= 0 ? "var(--color-success-border)" : "var(--color-error-border)"), fontSize: 12, color: fr >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
              {fr >= 0 ? t.fr_positive : t.fr_negative}
            </div>

            <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>{t.bfr_sim_fr_explain_title || "Qu'est-ce que le FR ?"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.bfr_sim_fr_explain || "Le fonds de roulement représente l'excédent de ressources durables (capital, réserves, bénéfices) après financement des immobilisations. Un FR positif signifie que vous avez un coussin de sécurité pour couvrir vos besoins à court terme."}</div>
            </div>
          </Card>

          {/* BFR & Micro Simulation */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.bfr_sim_bfr_title || "Simulation du BFR"}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.bfr_sim_bfr_desc || "Ajustez les délais de paiement pour voir l'impact sur votre trésorerie."}</p>

            <DelayPills
              label={t.bfr_sim_client_delay || "Délai encaissement clients"}
              value={clientDelay}
              onChange={setClientDelay}
              options={[0, 15, 30, 45, 60, 90]}
            />
            <DelayPills
              label={t.bfr_sim_supplier_delay || "Délai paiement fournisseurs"}
              value={supplierDelay}
              onChange={setSupplierDelay}
              options={[0, 15, 30, 45, 60]}
            />

            <CashCycleViz
              clientDelay={clientDelay}
              supplierDelay={supplierDelay}
              clientLabel={t.bfr_sim_client_bar || "Clients"}
              supplierLabel={t.bfr_sim_supplier_bar || "Fournisseurs"}
            />

            <Row label={t.bfr_clients} value={<DevVal v={eur(clientReceivable)} f={eur(monthlyRevenue) + " × (" + clientDelay + "/30) = " + eur(clientReceivable)} />} />
            <Row label={"− " + t.bfr_suppliers} value={<DevVal v={eur(supplierPayable)} f={eur(monthlyCosts) + " × (" + supplierDelay + "/30) = " + eur(supplierPayable)} />} />
            <Row label={t.bfr_label} value={<DevVal v={eur(bfrSim)} f={eur(clientReceivable) + " - " + eur(supplierPayable) + " = " + eur(bfrSim)} />} bold color={bfrSim <= 0 ? ok : err} tip={t.tip_bfr} />

            <div style={{ marginTop: "var(--sp-3)", borderTop: "2px solid var(--border)", paddingTop: "var(--sp-3)" }}>
              <Row label={t.tn_label} value={<DevVal v={eur(tresoSim)} f={eur(fr) + " - " + eur(bfrSim) + " = " + eur(tresoSim)} />} bold color={tresoSim >= 0 ? ok : err} last tip={t.tip_tn} />
            </div>

            {cashCycleDays > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-warning-border)", fontSize: 12, color: "var(--color-warning)", display: "flex", gap: "var(--sp-2)", alignItems: "flex-start" }}>
                <Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{typeof t.bfr_sim_gap_warning === "function" ? t.bfr_sim_gap_warning(cashCycleDays) : "Vos clients vous paient " + cashCycleDays + "j après que vous ayez payé vos fournisseurs."}</span>
              </div>
            ) : (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-success-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-success-border)", fontSize: 12, color: "var(--color-success)" }}>
                {t.bfr_sim_gap_ok || "Vos fournisseurs vous financent — vous encaissez avant ou en même temps que vous payez."}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ── 4. TVA & FISCALITÉ ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<Receipt size={18} weight="bold" />} title={t.section_tax} sub={t.section_tax_sub} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.vat_title}</h3>
            <Row label={t.vat_collected} value={<DevVal v={eur(annVatC)} f={"CA × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2) + " = " + eur(annVatC)} />} tip={t.tip_vat_c} />
            <Row label={t.vat_deductible} value={<DevVal v={"- " + eur(annVatD)} f={"charges × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2) + " = " + eur(annVatD)} />} tip={t.tip_vat_d} />
            <Row label={vatBalance >= 0 ? t.vat_balance_due : t.vat_balance_credit} value={<DevVal v={eur(Math.abs(vatBalance))} f={eur(annVatC) + " - " + eur(annVatD) + " = " + eur(vatBalance)} />} bold color={vatBalance >= 0 ? err : ok} last />
            <div style={{ fontSize: 11, color: "var(--text-faint)", paddingTop: "var(--sp-2)" }}>{t.vat_note(pct(cfg.vat))}</div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.fiscal_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.fiscal_sub}</p>
            <Row label={t.fiscal_capacity} value={<DevVal v={eur(divGross)} f={"netP - réserve légale = " + eur(divGross)} />} tip={t.tip_div_capacity} />
            <Row label={t.fiscal_div_classic} value={<DevVal v={eur(divGross * 0.70)} f={eur(divGross) + " × (1 - 30%) = " + eur(divGross * 0.70)} />} />
            <Row label={t.fiscal_div_vvpr} value={<DevVal v={eur(divGross * 0.85)} f={eur(divGross) + " × (1 - 15%) = " + eur(divGross * 0.85)} />} bold color={ok} last tip={t.tip_vvpr} />
            {divGross > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--color-success-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-success-border)" }}>
                <div style={{ fontSize: 12, color: "var(--color-success)", lineHeight: 1.5 }}>{t.fiscal_vvpr_saving(eur(divGross * 0.85 - divGross * 0.70))}</div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* DRI — only when explicitly enabled in settings */}
        {cfg.driEnabled ? <div style={{ marginTop: "var(--gap-lg)" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-3)" }}>
              <div style={{ width: 4, minHeight: 60, background: "var(--brand)", borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 var(--sp-2)", color: "var(--text-primary)" }}>{t.fiscal_dri_title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-3)", lineHeight: 1.5 }}>{t.fiscal_dri_desc}</p>
                <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap", marginBottom: "var(--sp-3)" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>{t.fiscal_dri_rate}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand)" }}>85%</div>
                  </div>
                  {isoc > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>{t.fiscal_dri_impact}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: ok }}><DevVal v={eur(isoc * 0.85 * 0.80)} f={eur(isoc) + " × 85% × 80% = " + eur(isoc * 0.85 * 0.80)} /></div>
                    </div>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: ok }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: ok }}>{t.fiscal_dri_eligible}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>{t.fiscal_dri_not_modeled}. {t.fiscal_dri_note}</div>
              </div>
            </div>
          </Card>
        </div> : null}

        {/* Fiscal calendar */}
        <div style={{ marginTop: "var(--gap-lg)" }}>
          <Accordion title={t.fiscal_cal_title} sub={t.fiscal_cal_sub}>
            <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_tva}</div>
                {[["T1", t.vat_q1, vatBalance / 4], ["T2", t.vat_q2, vatBalance / 4], ["T3", t.vat_q3, vatBalance / 4], ["T4", t.vat_q4, vatBalance / 4]].map(function (row) {
                  return (
                    <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", minWidth: 24 }}>{row[0]}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--text-tertiary)", paddingLeft: "var(--sp-2)" }}>{row[1]}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: row[2] >= 0 ? "var(--color-error)" : "var(--color-success)" }}>{eur(Math.abs(row[2]))}</span>
                    </div>
                  );
                })}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "var(--sp-4)", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_pp}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.fiscal_cal_pp_monthly}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>{t.fiscal_cal_pp_quarterly}</div>
                <div style={{ fontSize: 11, color: "var(--color-warning)", lineHeight: 1.4, marginTop: "var(--sp-1)", fontStyle: "italic" }}>{t.fiscal_cal_pp_note}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_isoc_adv}</div>
                {[t.fiscal_cal_isoc_adv1, t.fiscal_cal_isoc_adv2, t.fiscal_cal_isoc_adv3, t.fiscal_cal_isoc_adv4].map(function (label) {
                  return (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isoc > 0 ? "var(--color-error)" : "var(--text-faint)" }}>{isoc > 0 ? eur(isoc / 4) : "–"}</span>
                    </div>
                  );
                })}
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: "var(--sp-1)", marginBottom: "var(--sp-3)" }}>{t.fiscal_cal_isoc_adv_note}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_soc}</div>
                {[t.fiscal_cal_soc1, t.fiscal_cal_soc2, t.fiscal_cal_soc3, t.fiscal_cal_soc4].map(function (label) {
                  return <div key={label} style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "3px 0", borderBottom: "1px solid var(--border-light)" }}>{label}</div>;
                })}
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: "var(--sp-1)", marginBottom: "var(--sp-3)" }}>{t.fiscal_cal_soc_note}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_annual}</div>
                {[t.fiscal_cal_annual_ag, t.fiscal_cal_annual_bnb, t.fiscal_cal_annual_isoc].map(function (label) {
                  return <div key={label} style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "3px 0", borderBottom: "1px solid var(--border-light)" }}>{label}</div>;
                })}
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: "var(--sp-1)" }}>{t.fiscal_cal_annual_note}</div>
              </div>
            </div>
          </Accordion>
        </div>
      </section>

      {/* ── Vue avancée (collapsible divider) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", margin: "var(--sp-8) 0 var(--sp-4)", cursor: "pointer", userSelect: "none" }} onClick={function () { setAdvancedOpen(function (v) { return !v; }); }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "var(--sp-2)", whiteSpace: "nowrap" }}>
          {t.advanced_divider || "Vue avancée"}
          <CaretDown size={12} weight="bold" color="var(--text-faint)" style={{ transition: "transform 200ms", transform: advancedOpen ? "rotate(0deg)" : "rotate(-90deg)" }} />
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {advancedOpen ? (
        <>
          {/* Business-Type KPIs — dynamic per cfg.businessType */}
          {bizKpis && bizKpis.kpis && bizKpis.kpis.length > 0 ? (
            <section style={{ marginBottom: "var(--sp-8)" }}>
              <SectionHeader
                icon={<ChartLine size={18} weight="bold" />}
                title={(t.section_metrics || "Métriques") + " " + (t["biz_" + cfg.businessType] || cfg.businessType)}
                sub={t.section_metrics_sub || linkSettings(t.section_saas_sub || "", function () { setTab("set"); })}
              />
              <Card>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "var(--sp-4)",
                }}>
                  {bizKpis.kpis.map(function (kpi) {
                    var label = t["kpi_" + cfg.businessType + "_" + kpi.id] || t["kpi_" + kpi.id] || kpi.id.replace(/_/g, " ");
                    var displayValue = "–";
                    if (kpi.value != null && !isNaN(kpi.value) && kpi.value !== 0) {
                      if (kpi.format === "eur") displayValue = eur(kpi.value);
                      else if (kpi.format === "pct") displayValue = pct(kpi.value);
                      else if (kpi.format === "ratio") displayValue = kpi.value.toFixed(1) + "x";
                      else if (kpi.format === "months") displayValue = kpi.value.toFixed(1) + " mois";
                      else displayValue = typeof kpi.value === "number" ? kpi.value.toLocaleString() : String(kpi.value);
                    }
                    // Color logic
                    var color = "var(--text-primary)";
                    if (kpi.format === "pct" && kpi.value > 0) color = "var(--color-success)";
                    if (kpi.id === "churn_rate" || kpi.id === "cart_abandonment" || kpi.id === "return_rate" || kpi.id === "shrinkage_rate") {
                      color = kpi.value > 0.10 ? err : kpi.value > 0.05 ? warn : ok;
                    }
                    if (kpi.id === "quick_ratio" || kpi.id === "ltv_cac" || kpi.id === "pipeline_coverage") {
                      color = kpi.value >= 3 ? ok : kpi.value >= 1 ? warn : err;
                    }
                    if (kpi.id === "rule_of_40") {
                      color = kpi.value >= 40 ? ok : kpi.value >= 20 ? warn : err;
                    }
                    if (kpi.id === "utilization") {
                      color = kpi.value >= 0.75 ? ok : kpi.value >= 0.50 ? warn : err;
                    }

                    return (
                      <div key={kpi.id} style={{
                        padding: "var(--sp-3)",
                        background: "var(--bg-accordion)",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--border-light)",
                      }}>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-1)" }}>
                          {label}
                        </div>
                        <div style={{
                          fontSize: 18, fontWeight: 700, color: color,
                          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
                          letterSpacing: "-0.5px",
                        }}>
                          {displayValue}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          ) : null}

          {/* Valuation */}
          <section style={{ marginBottom: "var(--sp-8)" }}>
            <SectionHeader
              icon={<Scales size={18} weight="bold" />}
              title={t.section_valuation}
              sub={t.section_valuation_sub}
            />
            <Card>
              <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-5)" }}>
                {VAL_MULTIPLES.map(function (m) {
                  var implied = totalRevenue * m;
                  return (
                    <div key={m} style={{ textAlign: "center", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", marginBottom: "var(--sp-2)" }}>{m}x ARR</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-1)" }}><DevVal v={eur(implied)} f={eur(totalRevenue) + " × " + m + " = " + eur(implied)} /></div>
                      {totalRevenue > 0 && implied >= 1000000 ? <span style={{ fontSize: 11, color: ok, fontWeight: 600 }}>&gt; 1M</span> : null}
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.val_targets}</div>
                {[{ target: "500K", arr: 500000 }, { target: "1M", arr: 1000000 }, { target: "5M", arr: 5000000 }].map(function (row) {
                  var reqAt5x = row.arr / 5;
                  var progress = totalRevenue > 0 ? Math.min(totalRevenue / reqAt5x, 1) : 0;
                  return (
                    <div key={row.target} style={{ marginBottom: "var(--sp-3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--text-secondary)" }}>{t.val_target_label(row.target)}</span>
                        <span style={{ fontWeight: 600, color: progress >= 1 ? ok : "var(--text-muted)" }}>{eur(reqAt5x)} ARR {progress >= 1 ? " " : "(" + pct(progress) + ")"}</span>
                      </div>
                      <ProgressBar value={progress} color={progress >= 1 ? ok : brand} height={4} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        </>
      ) : null}

      {/* ── Quick navigation ── */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)" }}>
        {[
          { label: t.simple_nav_revenue, tab: "streams", icon: <TrendUp size={16} weight="bold" /> },
          { label: t.simple_nav_costs, tab: "opex", icon: <Receipt size={16} weight="bold" /> },
          { label: t.simple_nav_salaries, tab: "salaries", icon: <Users size={16} weight="bold" /> },
          { label: t.simple_nav_cashflow, tab: "cashflow", icon: <CurrencyCircleDollar size={16} weight="bold" /> },
        ].map(function (nav) {
          return (
            <button key={nav.tab} onClick={function () { setTab(nav.tab); }} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-2)",
              padding: "var(--sp-3) var(--sp-4)", borderRadius: "var(--r-md)", border: "1px solid var(--border)",
              background: "var(--bg-card)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
            }}>
              <span style={{ color: "var(--text-muted)", display: "flex" }}>{nav.icon}</span>
              {nav.label}
            </button>
          );
        })}
      </div>

    </PageLayout>
  );
}
