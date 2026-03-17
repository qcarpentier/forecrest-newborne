import { CheckCircle, Warning, XCircle, TrendUp, Printer } from "@phosphor-icons/react";
import { ok, err } from "../constants/colors";
import { Card, PageLayout } from "../components";
import { eur, pct, salCalc } from "../utils";
import { useT, useLang } from "../context";
import { openPlanReport } from "../utils/printReport";

// ── Local helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: "var(--gap-md)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: subtitle ? "var(--sp-2)" : 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "var(--color-on-brand)",
          background: "var(--brand)",
          minWidth: 26, height: 26, borderRadius: "var(--r-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          letterSpacing: "0.04em", flexShrink: 0, padding: "0 var(--sp-2)",
        }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{title}</div>
      </div>
      {subtitle ? <div style={{ fontSize: 13, color: "var(--text-secondary)", paddingLeft: 38 }}>{subtitle}</div> : null}
    </div>
  );
}

function PlanRow({ label, value, color, bold, note }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "baseline", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)" }}>
      <div>
        <span style={{ fontSize: 13, color: bold ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: bold ? 600 : 400 }}>{label}</span>
        {note ? <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{note}</div> : null}
      </div>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || "var(--text-primary)", textAlign: "right", paddingLeft: "var(--sp-4)" }}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "var(--sp-3)", marginTop: "var(--sp-1)" }}>
      {children}
    </div>
  );
}

function HealthBadge({ level, t }) {
  var cfg = {
    good:     { color: ok,                    icon: CheckCircle, bg: "var(--color-success-bg)",  border: "var(--color-success-border)" },
    ok:       { color: "var(--color-info)",   icon: TrendUp,     bg: "var(--color-info-bg)",     border: "var(--color-info-border)" },
    weak:     { color: "var(--color-warning)", icon: Warning,    bg: "var(--color-warning-bg)",  border: "var(--color-warning-border)" },
    critical: { color: err,                   icon: XCircle,     bg: "var(--color-error-bg)",    border: "var(--color-error-border)" },
  };
  var c = cfg[level] || cfg.weak;
  var Icon = c.icon;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-4)", borderRadius: "var(--r-lg)", background: c.bg, border: "1px solid " + c.border }}>
      <Icon size={16} weight="bold" color={c.color} />
      <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{t["health_" + level]}</span>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  var pctVal = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: (pctVal * 100).toFixed(1) + "%", background: color || "var(--brand)", borderRadius: 3, transition: "width 0.3s ease" }} />
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--border)", margin: "var(--gap-lg) 0" }} />;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FinancialPlanPage({
  arrV, totalRevenue, extraStreamsMRR, monthlyCosts, opCosts, salCosts,
  ebitda, isoc, isocEff, netP, resLeg, divGross,
  annVatC, annVatD, vatBalance,
  totS, dirOk, cfg, strPct, strNeed, rev, sals, scenariosComp,
}) {
  var t = useT().plan;
  var { lang } = useLang();

  // ── Unit economics ──
  var arpuMonthly = totS > 0 ? (arrV / 12 + extraStreamsMRR) / totS : 0;
  var churn = (cfg && cfg.churnMonthly) || 0.03;
  var ltv = churn > 0 ? arpuMonthly / churn : 0;
  var cacV = (cfg && cfg.cacTarget) || 0;
  var ltvCac = cacV > 0 && ltv > 0 ? ltv / cacV : 0;
  var payback = cacV > 0 && arpuMonthly > 0 ? cacV / arpuMonthly : 0;
  var marginPct = totalRevenue > 0 ? ebitda / totalRevenue : 0;
  var monthlyRevenue = totalRevenue / 12;
  var netBurn = monthlyCosts - monthlyRevenue;
  var capitalSocial = (cfg && cfg.capitalSocial) || 0;
  var runway = netBurn > 0 && capitalSocial > 0 ? Math.round(capitalSocial / netBurn) : null;
  var avgNetYr = totS > 0 ? arrV / totS : 0;
  var beClients = avgNetYr > 0 && monthlyCosts > 0 ? Math.ceil(monthlyCosts * 12 / avgNetYr) : null;
  var currentScenario = (cfg && cfg.feeScenario) || "growth";
  var divNetVvpr = divGross * 0.85;
  var divNetClassic = divGross * 0.70;

  // ── Salary breakdown ──
  var salBreakdown = (sals || []).filter(function (s) { return s.net > 0; }).map(function (s) {
    var eO = s.type === "student" ? 0.0271 : (cfg.onss || 0.274);
    var eP = s.type === "student" ? 0 : (cfg.patr || 0.25);
    var c = salCalc(s.net, eO, cfg.prec || 0.02, eP);
    return { role: s.role, net: s.net, brutO: c.brutO, total: c.total };
  });

  // ── Per-stream MRR ──
  var en = (rev && rev.enabled) || {};
  var revActiveUsers = rev ? Math.round(rev.app.monthlyDownloads * 12 * rev.app.activeRate) : 0;
  var mrrProSub = (en.proSub && rev) ? Math.round(totS * rev.proSub.conversionRate) * rev.proSub.priceWeek * 4.33 : 0;
  var mrrShine = (en.shine && rev) ? Math.round(revActiveUsers * rev.shine.conversionRate) * rev.shine.price : 0;
  var mrrMarketplace = (en.marketplace && rev) ? Math.round(totS * rev.marketplace.adoptionRate) * rev.marketplace.ordersPerProMonth * rev.marketplace.avgOrderValue * rev.marketplace.commissionRate : 0;
  var mrrBrand = rev ? ((en.brandData ? rev.brandData.clients * rev.brandData.monthlyPrice : 0) + (en.brandAds ? revActiveUsers * rev.brandAds.impressionsPerUser * rev.brandAds.fillRate * rev.brandAds.cpm / 1000 : 0)) : 0;
  var mrrEnterprise = (en.enterprise && rev) ? rev.enterprise.clients * rev.enterprise.avgEmployees * rev.enterprise.adoptionRate * rev.enterprise.feePerEmployee : 0;
  var mrrSponsored = (en.sponsored && rev) ? Math.round(totS * rev.sponsored.adoptionRate) * rev.sponsored.bookingsPerMonth * rev.sponsored.cpa : 0;

  // ── Health score ──
  var healthLevel = (function () {
    if (totS === 0) return "critical";
    if (ebitda < 0) return (netBurn > monthlyCosts * 0.5) ? "critical" : "weak";
    if (ltvCac > 0 && ltvCac < 1) return "weak";
    if (ebitda >= 0 && (ltvCac >= 3 || cacV === 0) && (runway == null || runway >= 12)) return "good";
    return "ok";
  })();

  // ── Recommendations (for print report only) ──
  var recs = [];
  if (totS === 0) recs.push(t.recommend_no_clients);
  else {
    if (ebitda < 0) recs.push(t.recommend_negative_ebitda);
    if (cacV > 0 && ltvCac > 0 && ltvCac < 3) recs.push(t.recommend_low_ltv_cac);
    if (!dirOk) recs.push(t.recommend_dir_rem);
    if (runway != null && runway < 6) recs.push(t.recommend_runway_short);
    if (strNeed > 0) recs.push(t.recommend_stripe_thresh);
    if (recs.length === 0) recs.push(t.recommend_all_good);
  }

  // ── Revenue streams table ──
  var streams = [
    { name: t.model_platform_name,    desc: t.model_platform_desc,    type: t.model_type_txn,       mrr: arrV / 12,      active: true },
    { name: t.model_saas_name,        desc: t.model_saas_desc,        type: t.model_type_recurring, mrr: mrrProSub,      active: !!en.proSub },
    { name: t.model_shine_name,       desc: t.model_shine_desc,       type: t.model_type_recurring, mrr: mrrShine,       active: !!en.shine },
    { name: t.model_marketplace_name, desc: t.model_marketplace_desc, type: t.model_type_txn,       mrr: mrrMarketplace, active: !!en.marketplace },
    { name: t.model_brand_name,       desc: t.model_brand_desc,       type: t.model_type_licensing, mrr: mrrBrand,       active: !!(en.brandData || en.brandAds) },
    { name: t.model_enterprise_name,  desc: t.model_enterprise_desc,  type: t.model_type_recurring, mrr: mrrEnterprise,  active: !!en.enterprise },
    { name: t.model_sponsored_name,   desc: t.model_sponsored_desc,   type: t.model_type_txn,       mrr: mrrSponsored,   active: !!en.sponsored },
  ];

  var typeColor = {};
  typeColor[t.model_type_recurring] = "var(--color-success)";
  typeColor[t.model_type_txn]       = "var(--brand)";
  typeColor[t.model_type_licensing] = "var(--color-info)";

  // ── Print handler ──
  function handlePrint() {
    openPlanReport({
      arrV: arrV, totalRevenue: totalRevenue, extraStreamsMRR: extraStreamsMRR,
      monthlyCosts: monthlyCosts, opCosts: opCosts, salCosts: salCosts,
      ebitda: ebitda, isoc: isoc, isocEff: isocEff, netP: netP,
      divGross: divGross, vatBalance: vatBalance, annVatC: annVatC, annVatD: annVatD,
      totS: totS, cfg: cfg,
      arpuMonthly: arpuMonthly, ltv: ltv, ltvCac: ltvCac, payback: payback,
      marginPct: marginPct, runway: runway, beClients: beClients,
      healthLevel: healthLevel, recs: recs, streams: streams, t: t,
      salBreakdown: salBreakdown, salCostsAnnual: salCosts * 12,
      capitalSocial: capitalSocial, resLeg: resLeg,
      divNetVvpr: divNetVvpr, divNetClassic: divNetClassic,
      scenariosComp: scenariosComp,
    }, lang);
  }

  var printBtn = (
    <button
      onClick={handlePrint}
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-4)", borderRadius: "var(--r-md)", border: "none", background: "var(--brand)", color: "var(--color-on-brand)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
    >
      <Printer size={15} />
      {t.print}
    </button>
  );

  return (
    <PageLayout title={t.title} subtitle={t.subtitle} actions={printBtn}>

      {/* ── HERO ── */}
      <div style={{ borderRadius: "var(--r-lg)", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-gradient-end) 100%)", padding: "var(--sp-6)", marginBottom: "var(--gap-lg)", color: "var(--color-on-brand)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.72, marginBottom: "var(--sp-3)" }}>Forecrest — {t.report_label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.38, marginBottom: "var(--sp-3)", maxWidth: 680 }}>{t.hero_tagline}</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.65, maxWidth: 660, marginBottom: "var(--sp-5)" }}>{t.hero_body}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)" }}>
          {[
            { value: t.hero_stat_market,  label: t.hero_stat_market_label },
            { value: t.hero_stat_cagr,    label: t.hero_stat_cagr_label },
            { value: t.hero_stat_apps,    label: t.hero_stat_apps_label },
            { value: t.hero_stat_streams, label: t.hero_stat_streams_label },
          ].map(function (s, i) {
            return (
              <div key={i} style={{ background: "var(--overlay-glass)", borderRadius: "var(--r-md)", padding: "var(--sp-3) var(--sp-4)" }}>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: "var(--sp-1)" }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 01 — PROBLEM ── */}
      <SectionHeader label="01" title={t.section_problem} subtitle={t.problem_sub} />
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, margin: "0 0 var(--gap-md)" }}>{t.problem_intro}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { title: t.prob_clients_title, points: [t.prob_clients_1, t.prob_clients_2, t.prob_clients_3] },
          { title: t.prob_pros_title,    points: [t.prob_pros_1,    t.prob_pros_2,    t.prob_pros_3] },
          { title: t.prob_brands_title,  points: [t.prob_brands_1,  t.prob_brands_2,  t.prob_brands_3] },
          { title: t.prob_corp_title,    points: [t.prob_corp_1,    t.prob_corp_2] },
        ].map(function (col, i) {
          return (
            <Card key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                {col.points.map(function (p, j) {
                  return (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-2)" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-error)", flexShrink: 0, marginTop: 7 }} />
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{p}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Divider />

      {/* ── 02 — SOLUTION ── */}
      <SectionHeader label="02" title={t.section_solution} subtitle={t.solution_sub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { title: t.sol_app1_title, badge: t.sol_app1_badge, desc: t.sol_app1_desc, color: "var(--brand)" },
          { title: t.sol_app2_title, badge: t.sol_app2_badge, desc: t.sol_app2_desc, color: "var(--color-success)" },
          { title: t.sol_app3_title, badge: t.sol_app3_badge, desc: t.sol_app3_desc, color: "var(--color-info)" },
          { title: t.sol_app4_title, badge: t.sol_app4_badge, desc: t.sol_app4_desc, color: "var(--color-warning)" },
        ].map(function (app, i) {
          return (
            <Card key={i} sx={{ borderLeft: "3px solid " + app.color }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{app.title}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: app.color, background: "var(--bg-accordion)", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.04em" }}>{app.badge}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{app.desc}</div>
            </Card>
          );
        })}
      </div>

      <Divider />

      {/* ── 03 — BUSINESS MODEL ── */}
      <SectionHeader label="03" title={t.section_model} subtitle={t.model_sub} />
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 80px", gap: "var(--sp-3)", paddingBottom: "var(--sp-2)", marginBottom: "var(--sp-1)", borderBottom: "2px solid var(--border)" }}>
          {[t.model_col_source, t.model_col_type, t.model_col_mrr, t.model_col_status].map(function (h, i) {
            return (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i >= 2 ? "right" : "left" }}>{h}</div>
            );
          })}
        </div>
        {streams.map(function (s, i) {
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 80px", gap: "var(--sp-3)", padding: "var(--sp-3) 0", borderBottom: i < streams.length - 1 ? "1px solid var(--border-light)" : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{s.desc}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: typeColor[s.type] || "var(--text-secondary)", background: "var(--bg-accordion)", padding: "2px 8px", borderRadius: 20 }}>{s.type}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.mrr > 0 ? "var(--text-primary)" : "var(--text-faint)", textAlign: "right" }}>
                {s.mrr > 0 ? eur(s.mrr) : "—"}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.active ? ok : "var(--text-faint)", background: s.active ? "var(--color-success-bg)" : "var(--bg-accordion)", padding: "2px 8px", borderRadius: 20, border: "1px solid " + (s.active ? "var(--color-success-border)" : "var(--border)") }}>
                  {s.active ? t.model_live : t.model_projected}
                </span>
              </div>
            </div>
          );
        })}
      </Card>

      <Divider />

      {/* ── 04 — COMPETITIVE ADVANTAGE ── */}
      <SectionHeader label="04" title={t.section_moat} subtitle={t.moat_sub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-4)" }}>
        {[
          { title: t.moat_collect_title,  desc: t.moat_collect_desc,  n: "01" },
          { title: t.moat_intel_title,    desc: t.moat_intel_desc,    n: "02" },
          { title: t.moat_activate_title, desc: t.moat_activate_desc, n: "03" },
          { title: t.moat_network_title,  desc: t.moat_network_desc,  n: "04" },
        ].map(function (step, i) {
          return (
            <Card key={i}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--brand)", opacity: 0.22, marginBottom: "var(--sp-2)", lineHeight: 1 }}>{step.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>{step.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{step.desc}</div>
            </Card>
          );
        })}
      </div>
      <Card sx={{ marginBottom: "var(--gap-lg)", borderColor: "var(--brand)" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, fontStyle: "italic" }}>{t.moat_differentiator}</div>
      </Card>

      <Divider />

      {/* ── 05 — WHY NOW ── */}
      <SectionHeader label="05" title={t.section_why_now} subtitle={t.why_now_sub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { title: t.why1_title, desc: t.why1_desc },
          { title: t.why2_title, desc: t.why2_desc },
          { title: t.why3_title, desc: t.why3_desc },
          { title: t.why4_title, desc: t.why4_desc },
        ].map(function (w, i) {
          return (
            <Card key={i}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>{w.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{w.desc}</div>
            </Card>
          );
        })}
      </div>

      <Divider />

      {/* ── 06 — FINANCIAL PERFORMANCE ── */}
      <SectionHeader label="06" title={t.section_performance} subtitle={t.performance_sub} />

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { label: t.kpi_arr,     value: eur(arrV),                        color: arrV >= 0 ? "var(--brand)" : err,   accent: arrV >= 0 ? "var(--brand)" : err },
          { label: t.kpi_mrr,     value: eur(arrV / 12 + extraStreamsMRR), color: "var(--text-primary)",              accent: "var(--brand)" },
          { label: t.kpi_ebitda,  value: eur(ebitda),                      color: ebitda >= 0 ? ok : err,             accent: ebitda >= 0 ? ok : err },
          { label: t.kpi_net,     value: eur(netP),                        color: netP >= 0 ? ok : err,               accent: netP >= 0 ? ok : err },
          { label: t.kpi_clients, value: String(totS),                     color: "var(--text-primary)",              accent: "var(--text-faint)" },
          { label: t.kpi_arpu,    value: eur(arpuMonthly),                 color: "var(--text-primary)",              accent: "var(--text-faint)" },
        ].map(function (k, i) {
          return (
            <Card key={i} sx={{ padding: "var(--sp-3) var(--sp-4)", borderTop: "2px solid " + k.accent }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: "var(--sp-1)" }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* P&L + Health 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)", alignItems: "start", marginBottom: "var(--gap-lg)" }}>

        {/* Left: P&L */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          <Card>
            <SectionTitle>{t.section_revenue}</SectionTitle>
            <PlanRow label={t.revenue_platform} value={eur(arrV)} color={arrV >= 0 ? ok : err} />
            <PlanRow label={t.revenue_streams} value={eur(extraStreamsMRR * 12)} />
            <PlanRow label={t.revenue_total} value={eur(totalRevenue)} bold color={totalRevenue >= 0 ? "var(--text-primary)" : err} />
            <div style={{ margin: "var(--sp-4) 0 var(--sp-2)" }}>
              <SectionTitle>{t.section_costs}</SectionTitle>
            </div>
            <PlanRow label={t.costs_opex} value={eur(opCosts * 12)} />
            <PlanRow label={t.costs_salaries} value={eur(salCosts * 12)} />
            <PlanRow label={t.costs_total} value={eur(monthlyCosts * 12)} bold />
            <div style={{ margin: "var(--sp-4) 0 var(--sp-2)" }}>
              <SectionTitle>{t.section_profit}</SectionTitle>
            </div>
            <PlanRow label={t.profit_ebitda} value={eur(ebitda)} bold color={ebitda >= 0 ? ok : err} />
            <PlanRow label={t.profit_isoc} value={eur(isoc)} color={isoc > 0 ? "var(--color-warning)" : "var(--text-muted)"} />
            <PlanRow label={t.profit_net} value={eur(netP)} bold color={netP >= 0 ? ok : err} />
            {divGross > 0 && <PlanRow label={t.profit_dividends} value={eur(divGross)} color="var(--color-info)" />}
          </Card>
          <Card>
            <SectionTitle>{t.section_tax}</SectionTitle>
            <PlanRow label={t.tax_vat_balance} value={eur(vatBalance)} note={eur(annVatC) + " " + t.tax_vat_col_abbr + " - " + eur(annVatD) + " " + t.tax_vat_ded_abbr} />
            <PlanRow label={t.tax_isoc_rate} value={isocEff > 0 ? pct(isocEff) : "0 %"} note={t.tax_isoc_note} />
          </Card>
        </div>

        {/* Right: Health + metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-4)", flexWrap: "wrap", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{t.health_label}</span>
              <HealthBadge level={healthLevel} t={t} />
            </div>
            {runway != null && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", marginBottom: "var(--sp-3)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: "var(--sp-1)" }}>{t.kpi_runway}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: runway >= 12 ? ok : runway >= 6 ? "var(--color-warning)" : err }}>
                    {runway} {t.kpi_runway_unit}
                  </div>
                </div>
                {beClients != null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: "var(--sp-1)" }}>{t.kpi_breakeven}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: totS >= beClients ? ok : "var(--color-warning)" }}>{beClients}</div>
                  </div>
                )}
              </div>
            )}
            {strPct != null && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-1)" }}>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.metric_stripe_vol}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{pct(strPct)}</span>
                </div>
                <ProgressBar value={strPct} max={1} color={strPct >= 1 ? ok : "var(--brand)"} />
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle>{t.section_metrics}</SectionTitle>
            <PlanRow label={t.metric_margin} value={pct(marginPct)} color={marginPct >= 0.20 ? ok : marginPct >= 0 ? "var(--color-warning)" : err} />
            {cacV > 0 && <PlanRow label={t.metric_cac} value={eur(cacV)} />}
            {ltv > 0 && <PlanRow label={t.metric_ltv} value={eur(ltv)} />}
            {cacV > 0 && ltvCac > 0 && (
              <PlanRow
                label={t.metric_ltv_cac}
                value={ltvCac.toFixed(1) + "x"}
                color={ltvCac >= 3 ? ok : ltvCac >= 1 ? "var(--color-warning)" : err}
                bold
              />
            )}
            {cacV > 0 && payback > 0 && <PlanRow label={t.metric_payback} value={payback.toFixed(1)} />}
            <PlanRow label={t.scenario_current} value={currentScenario.charAt(0).toUpperCase() + currentScenario.slice(1)} />
          </Card>
        </div>
      </div>

      {/* Masse salariale (inside section 06) */}
      {salBreakdown.length > 0 && (
        <Card>
          <SectionTitle>{t.section_payroll}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--sp-3)", paddingBottom: "var(--sp-2)", marginBottom: "var(--sp-1)", borderBottom: "2px solid var(--border)" }}>
            {[t.payroll_col_role, t.payroll_col_net, t.payroll_col_brut, t.payroll_col_total].map(function (h, i) {
              return <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i > 0 ? "right" : "left" }}>{h}</div>;
            })}
          </div>
          {salBreakdown.map(function (s, i) {
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--sp-3)", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.role}</span>
                <span style={{ fontSize: 13, textAlign: "right", color: "var(--text-faint)" }}>{eur(s.net)}</span>
                <span style={{ fontSize: 13, textAlign: "right", color: "var(--text-secondary)" }}>{eur(s.brutO)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: "var(--text-primary)" }}>{eur(s.total)}</span>
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--sp-3)", padding: "var(--sp-3) 0 0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t.payroll_total}</span>
            <span /><span />
            <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: "var(--text-primary)" }}>{eur(salCosts * 12)}</span>
          </div>
        </Card>
      )}

      <Divider />

      {/* ── 07 — STRUCTURE DU CAPITAL & DIVIDENDES ── */}
      <SectionHeader label="07" title={t.section_capital} subtitle={t.capital_sub} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)", marginBottom: "var(--gap-lg)" }}>
        <Card>
          <SectionTitle>{t.capital_section_equity}</SectionTitle>
          <PlanRow label={t.capital_social}   value={eur(capitalSocial)} />
          <PlanRow label={t.capital_reserves} value={eur(resLeg)} />
          <PlanRow label={t.capital_total}    value={eur(capitalSocial + resLeg)} bold />
        </Card>
        <Card>
          <SectionTitle>{t.capital_dividends}</SectionTitle>
          <PlanRow label={t.dividends_capacity}    value={eur(divGross)}     color={divGross > 0 ? ok : "var(--text-faint)"} bold />
          <PlanRow label={t.dividends_net_vvprbis} value={eur(divNetVvpr)}   color={divNetVvpr > 0 ? ok : "var(--text-faint)"} note={t.tax_withholding_15} />
          <PlanRow label={t.dividends_net_classic} value={eur(divNetClassic)} note={t.tax_withholding_30} />
        </Card>
      </div>

      <Divider />

      {/* ── 08 — COMPARAISON DES SCÉNARIOS ── */}
      <SectionHeader label="08" title={t.section_scenarios} subtitle={t.scenarios_sub} />
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 1fr 1fr", gap: "var(--sp-3)", paddingBottom: "var(--sp-2)", marginBottom: "var(--sp-1)", borderBottom: "2px solid var(--border)" }}>
          {[t.scenarios_col_name, t.scenarios_col_clients, t.scenarios_col_arr, t.scenarios_col_costs, t.scenarios_col_result].map(function (h, i) {
            return <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: i > 0 ? "right" : "left" }}>{h}</div>;
          })}
        </div>
        {(scenariosComp || []).map(function (sc, i) {
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 1fr 1fr", gap: "var(--sp-3)", padding: "var(--sp-3) var(--sp-2)", borderBottom: i < (scenariosComp.length - 1) ? "1px solid var(--border-light)" : "none", alignItems: "center", background: sc.isActive ? "var(--bg-accordion)" : "transparent", borderRadius: sc.isActive ? "var(--r-sm)" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: sc.isActive ? 700 : 400, color: "var(--text-primary)" }}>{sc.name}</span>
                {sc.isActive && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--brand)", background: "var(--overlay-glass-subtle)", padding: "1px 6px", borderRadius: 20, border: "1px solid var(--border)" }}>{t.scenarios_active}</span>}
              </div>
              <span style={{ fontSize: 13, textAlign: "right", color: "var(--text-secondary)" }}>{sc.totS}</span>
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: sc.arrV > 0 ? "var(--text-primary)" : "var(--text-faint)" }}>{eur(sc.arrV)}</span>
              <span style={{ fontSize: 13, textAlign: "right", color: "var(--text-secondary)" }}>{eur(sc.monthlyCosts)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: sc.netP >= 0 ? ok : err }}>{eur(sc.netP)}</span>
            </div>
          );
        })}
      </Card>

      <Divider />

      {/* ── 09 — POSITIONING ── */}
      <SectionHeader label="09" title={t.section_positioning} subtitle={t.positioning_sub} />
      <Card>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{t.positioning_desc}</div>
      </Card>

    </PageLayout>
  );
}
