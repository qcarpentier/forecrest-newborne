import { useMemo, useState, useEffect } from "react";
import { brand, ok, err, warn } from "../constants/colors";
import { Card, Row, Accordion, PageLayout } from "../components";
import { InfoTip } from "../components/Tooltip";
import Sparkline from "../components/Sparkline";
import TornadoChart from "../components/TornadoChart";
import ScenarioBanner from "../components/ScenarioBanner";
import { eur, eurShort, pct } from "../utils";
import { DevVal } from "../components";
import { linkSettings } from "../utils/linkSettings";
import { Warning, TrendUp, ChartBar, Receipt, Scales, CurrencyCircleDollar, Gauge, Bank, ChartLine, FilePdf, Users, CaretDown } from "@phosphor-icons/react";
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
  onPrint, profs, setTab,
  scenarios, activeScenario,
  onScenarioSwitch, onScenarioSave, onScenarioDelete, onScenarioDuplicate, onScenarioRename,
  marketingData,
}) {
  var tAll = useT();
  var t = tAll.overview;
  var { lang } = useLang();

  var streamsList = (streams || []).map(function (s) {
    return { label: s.name, mrr: (s.y1 || 0) / 12, color: "var(--brand)", on: true };
  });

  var totalMRR = totalRevenue / 12;
  var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
  var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
  var monthlyRevenue = totalRevenue / 12;
  var isProfitable = monthlyRevenue >= monthlyCosts;
  var netBurn = monthlyCosts - monthlyRevenue;
  var VAL_MULTIPLES = [3, 5, 8, 10];

  // FR / BFR calculations
  var fr = cfg.capitalSocial + resLeg + netP;
  var bfr = -monthlyCosts; // créances ≈ 0 (Stripe), stocks = 0, dettes = 1 mois de charges
  var tresoNette = fr - bfr;

  // LTV / CAC calculations
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
  var [valOpen, setValOpen] = useState(function () {
    try { return JSON.parse(localStorage.getItem("ov-val") || "false"); } catch (e) { return false; }
  });
  var [saasOpen, setSaasOpen] = useState(function () {
    try { return JSON.parse(localStorage.getItem("ov-saas") || "false"); } catch (e) { return false; }
  });

  useEffect(function () { try { localStorage.setItem("ov-bfr", bfrOpen); } catch (e) {} }, [bfrOpen]);
  useEffect(function () { try { localStorage.setItem("ov-val", valOpen); } catch (e) {} }, [valOpen]);
  useEffect(function () { try { localStorage.setItem("ov-saas", saasOpen); } catch (e) {} }, [saasOpen]);

  // Sparkline data: 12-month projection with app download growth
  var sparkData = useMemo(function () {
    var growth = 0.10; // default growth estimate
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

  return (
    <PageLayout title={getGreeting(lang, cfg.userName)} subtitle={t.subtitle} actions={
      onPrint ? (
        <button onClick={onPrint} style={{
          display: "flex", alignItems: "center", gap: "var(--sp-2)",
          padding: "7px 14px", borderRadius: "var(--r-md)",
          border: "1px solid var(--border)", background: "var(--bg-card)",
          fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
          <FilePdf size={15} color="var(--text-muted)" />
          {tAll.settings.io_print_btn}
        </button>
      ) : null
    }>

      {/* ═══════════ SCENARIO BANNER ═══════════ */}
      {scenarios ? (
        <ScenarioBanner
          scenarios={scenarios}
          activeId={activeScenario}
          onSwitch={onScenarioSwitch}
          onSave={onScenarioSave}
          onDelete={onScenarioDelete}
          onDuplicate={onScenarioDuplicate}
          onRename={onScenarioRename}
        />
      ) : null}

      {/* ═══════════ HERO KPIs ═══════════ */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-8)" }}>
        <KpiCard
          label={t.kpi_arr}
          value={cfg.kpiShort !== false ? eurShort(totalRevenue) : eur(totalRevenue)}
          fullValue={eur(totalRevenue)}
          sub={t.kpi_arr_sub}
          color={brand}
          icon={<TrendUp size={16} weight="bold" />}
          spark={sparkData.arr}
          target={targets.arr}
          current={totalRevenue}
        />
        <KpiCard
          label={t.kpi_mrr}
          value={cfg.kpiShort !== false ? eurShort(totalMRR) : eur(totalMRR)}
          fullValue={eur(totalMRR)}
          sub={t.kpi_mrr_sub}
          icon={<ChartBar size={16} weight="bold" />}
          spark={sparkData.mrr}
          target={targets.mrr}
          current={totalMRR}
        />
        <KpiCard
          label={t.kpi_clients}
          value={String(totS)}
          sub={t.kpi_clients_sub}
          icon={<Users size={16} weight="bold" />}
          target={targets.clients}
          current={totS}
          onClick={function () { setTab("forecast"); }}
        />
        <KpiCard
          label={t.kpi_costs}
          value={cfg.kpiShort !== false ? eurShort(monthlyCosts) : eur(monthlyCosts)}
          fullValue={eur(monthlyCosts)}
          sub={t.kpi_costs_sub}
          color={err}
          icon={<Receipt size={16} weight="bold" />}
          spark={sparkData.costs}
          sparkColor={err}
        />
      </div>

      {/* ═══════════ 1. REVENUS ═══════════ */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader
          icon={<CurrencyCircleDollar size={18} weight="bold" />}
          title={t.section_revenue}
          sub={t.section_revenue_sub}
        />

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
              <Row label={t.pnl_revenue} value={<DevVal v={eur(totalRevenue)} f={"sum(signed × netHT × medY) = " + eur(totalRevenue)} />} bold tip={t.tip_revenue} />
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
                {resLeg >= resTarget
                  ? t.pnl_reserve_done(eur(resTarget))
                  : t.pnl_reserve_todo(eur(resTarget), eur(resTarget - resLeg))}
              </div>
            </Accordion>
            </div>

            {!dirOk && ebitda > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-warning-border)", fontSize: 12, color: "var(--color-warning)", display: "flex", gap: "var(--sp-2)", alignItems: "flex-start" }}>
                <Warning size={14} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                {t.pnl_director_warning(eur(dirRem))}
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

      {/* ═══════════ 2. SANTE FINANCIERE ═══════════ */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader
          icon={<Gauge size={18} weight="bold" />}
          title={t.section_health}
          sub={t.section_health_sub}
        />

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

          {/* Stripe negotiation */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.stripe_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.stripe_sub}</p>

            <Row label={t.stripe_volume} value={<DevVal v={eur(mGross)} f={"volume mensuel Stripe = " + eur(mGross)} />} />
            <Row label={t.stripe_threshold} value={eur(cfg.stripeThresh)} tip={t.tip_stripe} />

            <div style={{ marginTop: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)" }}>{t.stripe_progress}</span>
                <span style={{ fontWeight: 700, color: strPct >= 1 ? ok : "var(--text-primary)" }}>{pct(Math.min(strPct, 1))}</span>
              </div>
              <ProgressBar value={strPct} color={strPct >= 1 ? ok : brand} height={8} />
            </div>

            <div style={{ padding: "var(--sp-3)", background: strPct >= 1 ? "var(--color-success-bg)" : "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid " + (strPct >= 1 ? "var(--color-success-border)" : "var(--border-light)"), textAlign: "center" }}>
              {strPct >= 1 ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: ok }}>{t.stripe_reached}</span>
              ) : strNeed > 0 ? (
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.stripe_need(strNeed)}</span>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.stripe_signup}</span>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* ═══════════ 2.5. FONDS DE ROULEMENT & BFR ═══════════ */}
      <section style={{ marginBottom: bfrOpen ? "var(--sp-8)" : "var(--sp-4)" }}>
        <SectionHeader
          icon={<Bank size={18} weight="bold" />}
          title={t.section_bfr}
          sub={t.section_bfr_sub}
          collapsed={!bfrOpen}
          onToggle={function() { setBfrOpen(function(v) { return !v; }); }}
        />

        {!bfrOpen ? null : <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* FR Card */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.fr_title}</h3>
            <Row label={t.fr_capital} value={eur(cfg.capitalSocial)} />
            <Row label={t.fr_reserve} value={eur(resLeg)} />
            <Row label={t.fr_result} value={<DevVal v={eur(netP)} f={"EBITDA - ISOC = " + eur(netP)} />} color={netP >= 0 ? ok : err} />
            <Row label={"− " + t.fr_assets} value={"0 EUR"} color="var(--text-faint)" />
            <Row label={t.fr_label} value={<DevVal v={eur(fr)} f={eur(cfg.capitalSocial) + " + " + eur(resLeg) + " + " + eur(netP) + " = " + eur(fr)} />} bold color={fr >= 0 ? ok : err} last tip={t.tip_fr} />
            <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: fr >= 0 ? "var(--color-success-bg)" : "var(--color-error-bg)", borderRadius: "var(--r-md)", border: "1px solid " + (fr >= 0 ? "var(--color-success-border)" : "var(--color-error-border)"), fontSize: 12, color: fr >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
              {fr >= 0 ? t.fr_positive : t.fr_negative}
            </div>
          </Card>

          {/* BFR Card */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.bfr_title}</h3>
            <Row label={t.bfr_clients} value={"0 EUR"} color="var(--text-faint)" />
            <Row label={t.bfr_stock} value={"0 EUR"} color="var(--text-faint)" />
            <Row label={"− " + t.bfr_suppliers} value={eur(monthlyCosts)} />
            <Row label={t.bfr_label} value={<DevVal v={eur(bfr)} f={"0 + 0 - " + eur(monthlyCosts) + " = " + eur(bfr)} />} bold color={bfr <= 0 ? ok : err} tip={t.tip_bfr} />
            <Row label={t.tn_label} value={<DevVal v={eur(tresoNette)} f={eur(fr) + " - (" + eur(bfr) + ") = " + eur(tresoNette)} />} bold color={tresoNette >= 0 ? ok : err} last tip={t.tip_tn} />
            <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>
                {t.bfr_explain_title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {t.bfr_explain}
              </div>
            </div>
          </Card>
        </div>}
      </section>

      {/* ═══════════ 3. FISCALITE ═══════════ */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader
          icon={<Receipt size={18} weight="bold" />}
          title={t.section_tax}
          sub={t.section_tax_sub}
        />

        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* VAT */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.vat_title}</h3>
            <Row label={t.vat_collected} value={<DevVal v={eur(annVatC)} f={"grossFees × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2) + " = " + eur(annVatC)} />} tip={t.tip_vat_c} />
            <Row label={t.vat_deductible} value={<DevVal v={"- " + eur(annVatD)} f={"stripeFees × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2) + " = " + eur(annVatD)} />} tip={t.tip_vat_d} />
            <Row
              label={vatBalance >= 0 ? t.vat_balance_due : t.vat_balance_credit}
              value={<DevVal v={eur(Math.abs(vatBalance))} f={eur(annVatC) + " - " + eur(annVatD) + " = " + eur(vatBalance)} />}
              bold
              color={vatBalance >= 0 ? err : ok}
              last
            />
            <div style={{ fontSize: 11, color: "var(--text-faint)", paddingTop: "var(--sp-2)" }}>{t.vat_note(pct(cfg.vat))}</div>
          </Card>

          {/* Dividends + fiscal optimization */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.fiscal_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.fiscal_sub}</p>

            <Row label={t.fiscal_capacity} value={<DevVal v={eur(divGross)} f={"netP - réserve légale = " + eur(divGross)} />} tip={t.tip_div_capacity} />
            <Row label={t.fiscal_div_classic} value={<DevVal v={eur(divGross * 0.70)} f={eur(divGross) + " × (1 - 30%) = " + eur(divGross * 0.70)} />} />
            <Row label={t.fiscal_div_vvpr} value={<DevVal v={eur(divGross * 0.85)} f={eur(divGross) + " × (1 - 15%) = " + eur(divGross * 0.85)} />} bold color={ok} last tip={t.tip_vvpr} />

            {divGross > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--color-success-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-success-border)" }}>
                <div style={{ fontSize: 12, color: "var(--color-success)", lineHeight: 1.5 }}>
                  {t.fiscal_vvpr_saving(eur(divGross * 0.85 - divGross * 0.70))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* DRI (Déduction Revenus d'Innovation) */}
        <div style={{ marginTop: "var(--gap-lg)" }}>
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
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>
                  {t.fiscal_dri_not_modeled}. {t.fiscal_dri_note}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Belgian fiscal calendar */}
        <div style={{ marginTop: "var(--gap-lg)" }}>
          <Accordion title={t.fiscal_cal_title} sub={t.fiscal_cal_sub}>
            <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>

              {/* Col 1: TVA + PP */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_tva}</div>
                {[
                  ["T1", t.vat_q1, vatBalance / 4],
                  ["T2", t.vat_q2, vatBalance / 4],
                  ["T3", t.vat_q3, vatBalance / 4],
                  ["T4", t.vat_q4, vatBalance / 4],
                ].map(function ([q, date, amt]) {
                  return (
                    <div key={q} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", minWidth: 24 }}>{q}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--text-tertiary)", paddingLeft: "var(--sp-2)" }}>{date}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: amt >= 0 ? "var(--color-error)" : "var(--color-success)" }}>{eur(Math.abs(amt))}</span>
                    </div>
                  );
                })}

                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "var(--sp-4)", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_pp}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.fiscal_cal_pp_monthly}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>{t.fiscal_cal_pp_quarterly}</div>
                <div style={{ fontSize: 11, color: "var(--color-warning)", lineHeight: 1.4, marginTop: "var(--sp-1)", fontStyle: "italic" }}>{t.fiscal_cal_pp_note}</div>
              </div>

              {/* Col 2: ISOC advances + Social + Annual */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_isoc_adv}</div>
                {[
                  t.fiscal_cal_isoc_adv1,
                  t.fiscal_cal_isoc_adv2,
                  t.fiscal_cal_isoc_adv3,
                  t.fiscal_cal_isoc_adv4,
                ].map(function (label) {
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

      {/* ═══════════ SENSITIVITY ═══════════ */}
      {profs && profs.length > 0 ? (
        <section style={{ marginBottom: "var(--sp-8)" }}>
          <TornadoChart profs={profs} cfg={cfg} baseARR={arrV} monthlyCosts={monthlyCosts} t={t} />
        </section>
      ) : null}

      {/* ═══════════ 4. VALORISATION ═══════════ */}
      <section style={{ marginBottom: valOpen ? "var(--sp-8)" : "var(--sp-4)" }}>
        <SectionHeader
          icon={<Scales size={18} weight="bold" />}
          title={t.section_valuation}
          sub={t.section_valuation_sub}
          collapsed={!valOpen}
          onToggle={function() { setValOpen(function(v) { return !v; }); }}
        />

        {!valOpen ? null : <Card>
          <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-5)" }}>
            {VAL_MULTIPLES.map(function (m) {
              var implied = totalRevenue * m;
              return (
                <div key={m} style={{ textAlign: "center", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", marginBottom: "var(--sp-2)" }}>{m}x ARR</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-1)" }}><DevVal v={eur(implied)} f={eur(totalRevenue) + " × " + m + " = " + eur(implied)} /></div>
                  {totalRevenue > 0 && implied >= 1000000 ? (
                    <span style={{ fontSize: 11, color: ok, fontWeight: 600 }}>&gt; 1M</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.val_targets}</div>
            {[
              { target: "500K", arr: 500000 },
              { target: "1M", arr: 1000000 },
              { target: "5M", arr: 5000000 },
            ].map(function (row) {
              var reqAt5x = row.arr / 5;
              var progress = totalRevenue > 0 ? Math.min(totalRevenue / reqAt5x, 1) : 0;
              return (
                <div key={row.target} style={{ marginBottom: "var(--sp-3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{t.val_target_label(row.target)}</span>
                    <span style={{ fontWeight: 600, color: progress >= 1 ? ok : "var(--text-muted)" }}>
                      {eur(reqAt5x)} ARR {progress >= 1 ? " " : "(" + pct(progress) + ")"}
                    </span>
                  </div>
                  <ProgressBar value={progress} color={progress >= 1 ? ok : brand} height={4} />
                </div>
              );
            })}
          </div>
        </Card>}
      </section>

      {/* ═══════════ 5. METRIQUES SAAS ═══════════ */}
      <section style={{ marginBottom: saasOpen ? "var(--sp-8)" : "var(--sp-4)" }}>
        <SectionHeader
          icon={<ChartLine size={18} weight="bold" />}
          title={t.section_saas}
          sub={linkSettings(t.section_saas_sub, function () { setTab("set"); })}
          collapsed={!saasOpen}
          onToggle={function() { setSaasOpen(function(v) { return !v; }); }}
        />

        {!saasOpen ? null : <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* LTV / CAC breakdown */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.saas_title}</h3>
            <Row label={t.saas_arpu} value={totS > 0 ? <DevVal v={eur(arpuMonthly)} f={eur(totalMRR) + " / " + totS + " clients = " + eur(arpuMonthly)} /> : "–"} color={totS > 0 ? "var(--text-primary)" : "var(--text-faint)"} tip={t.tip_arpu} />
            <Row label={t.saas_ltv} value={ltv > 0 ? <DevVal v={eur(ltv)} f={eur(arpuMonthly) + " / " + pct(churn) + " = " + eur(ltv)} /> : "–"} tip={t.tip_ltv} />
            <div style={{ fontSize: 11, color: "var(--text-faint)", paddingBottom: "var(--sp-3)" }}>
              {ltv > 0 ? t.saas_ltv_sub(pct(churn)) : null}
            </div>
            <Row label={t.saas_cac} value={cac > 0 ? eur(cac) : linkSettings(t.saas_cac_none, function () { setTab("set"); })} color={cac > 0 ? "var(--text-primary)" : "var(--text-faint)"} />
            {cac > 0 ? <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: -6, marginBottom: 6, paddingLeft: 2 }}>{hasMarketing ? t.saas_cac_from_marketing : t.saas_cac_from_settings}</div> : null}
            {hasMarketing ? <Row label={t.saas_roas} value={roas > 0 ? roas.toFixed(2) + "x" : "–"} color={roas >= 1 ? ok : roas > 0 ? warn : "var(--text-faint)"} /> : null}
            {hasMarketing ? <Row label={t.saas_spend} value={eur(marketingData.monthly)} color="var(--text-secondary)" /> : null}
            <Row label={t.saas_ratio} value={ltvCac > 0 ? <DevVal v={ltvCac.toFixed(1) + "x"} f={eur(ltv) + " / " + eur(cac) + " = " + ltvCac.toFixed(1) + "x"} /> : "–"} bold color={ltvCac >= 3 ? ok : ltvCac > 0 ? warn : "var(--text-faint)"} last tip={t.tip_ltvCac} />
          </Card>

          {/* Payback + context */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.saas_payback}</h3>
            {payback > 0 ? (
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: payback <= 12 ? ok : payback <= 24 ? warn : err, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {payback.toFixed(1)}
                  <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>{t.saas_payback_months}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: "var(--sp-1)" }}>{t.tip_payback.split("\n")[0]}</div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: "var(--sp-4)" }}>{t.saas_payback_none}</div>
            )}
            <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>{t.saas_context_title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.saas_context}</div>
            </div>
          </Card>
        </div>}
      </section>

    </PageLayout>
  );
}
