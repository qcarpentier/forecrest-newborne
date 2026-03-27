import { useState, useMemo, useEffect } from "react";
import {
  Megaphone, TrendUp, CurrencyCircleDollar, Users, Target,
  Plus, Trash, PencilSimple, Funnel as FunnelIcon, Crosshair,
  Envelope, ArrowDown, ArrowRight, Copy, Newspaper,
} from "@phosphor-icons/react";
import {
  PageLayout, KpiCard, Card, Button, DataTable, Badge, Wizard,
  Modal, ModalFooter, ModalSideNav, SearchInput, FilterDropdown, SelectDropdown,
  ExportButtons, DevOptionsButton, DonutChart, ChartLegend, PaletteToggle,
  ActionBtn, ConfirmDeleteModal, DatePicker, CurrencyInput, NumberField,
  FinanceLink,
} from "../../components";
import ModulePaywall from "../../components/ModulePaywall";
import { eur, eurShort, pct, makeId, calcTotalRevenue } from "../../utils";
import { useT, useLang, useDevMode } from "../../context";

/* ── Shared styles ── */
var labelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" };

/* ── Channel metadata ── */
var CHANNEL_META = {
  meta:      { label: { fr: "Facebook & Instagram", en: "Facebook & Instagram" }, desc: { fr: "Publicité sur les réseaux Meta.", en: "Advertising on Meta networks." }, badge: "brand", icon: Target, defaultCpc: 0.80, defaultCtr: 0.02, defaultConvRate: 0.03, defaultAov: 50 },
  google:    { label: { fr: "Google", en: "Google" }, desc: { fr: "Apparaître dans les résultats de recherche et sur YouTube.", en: "Appear in search results and on YouTube." }, badge: "info", icon: Target, defaultCpc: 1.50, defaultCtr: 0.035, defaultConvRate: 0.04, defaultAov: 60 },
  linkedin:  { label: { fr: "LinkedIn", en: "LinkedIn" }, desc: { fr: "Toucher des professionnels et décideurs.", en: "Reach professionals and decision-makers." }, badge: "warning", icon: Users, defaultCpc: 5.00, defaultCtr: 0.008, defaultConvRate: 0.02, defaultAov: 120 },
  tiktok:    { label: { fr: "TikTok", en: "TikTok" }, desc: { fr: "Publicité vidéo courte pour un public jeune.", en: "Short video ads for a younger audience." }, badge: "success", icon: TrendUp, defaultCpc: 0.40, defaultCtr: 0.015, defaultConvRate: 0.02, defaultAov: 35 },
  seo:       { label: { fr: "Référencement naturel", en: "Organic search (SEO)" }, desc: { fr: "Être trouvé sur Google sans payer de pub.", en: "Be found on Google without paying for ads." }, badge: "gray", icon: TrendUp, defaultCpc: 0, defaultCtr: 0.05, defaultConvRate: 0.05, defaultAov: 50 },
  email:     { label: { fr: "E-mailing", en: "Email marketing" }, desc: { fr: "Campagnes e-mail et newsletters.", en: "Email campaigns and newsletters." }, badge: "info", icon: Envelope, defaultCpc: 0.10, defaultCtr: 0.03, defaultConvRate: 0.04, defaultAov: 40 },
};
var CHANNEL_KEYS = Object.keys(CHANNEL_META);

var OBJECTIVE_META = {
  awareness:  { label: { fr: "Notoriété", en: "Awareness" }, badge: "info" },
  traffic:    { label: { fr: "Trafic", en: "Traffic" }, badge: "brand" },
  conversion: { label: { fr: "Conversion", en: "Conversion" }, badge: "success" },
  leads:      { label: { fr: "Leads", en: "Leads" }, badge: "warning" },
};

var STATUS_META = {
  draft:     { label: { fr: "Brouillon", en: "Draft" }, badge: "gray" },
  active:    { label: { fr: "Active", en: "Active" }, badge: "success" },
  paused:    { label: { fr: "En pause", en: "Paused" }, badge: "warning" },
  completed: { label: { fr: "Terminée", en: "Completed" }, badge: "info" },
};

/* ── Fake data for paywall preview ── */
var FAKE_KPIS = [
  { label: "Budget mensuel", value: "2 450,00 €" },
  { label: "CAC", value: "18,50 €" },
  { label: "ROAS", value: "3.2x" },
  { label: "Leads / mois", value: "132" },
];

var FAKE_CHANNELS = [
  { id: "f1", channel: "meta", name: "Campagne Facebook Lead Gen", budget: 800, cpc: 0.65, clicks: 1230, conversions: 42 },
  { id: "f2", channel: "google", name: "Google Search Brand", budget: 1200, cpc: 1.80, clicks: 667, conversions: 58 },
  { id: "f3", channel: "linkedin", name: "LinkedIn B2B Decision Makers", budget: 450, cpc: 5.20, clicks: 87, conversions: 12 },
];

/* ── Helper: safe divide ── */
function safeDiv(a, b) { return b > 0 ? a / b : 0; }

/* ── Compute channel KPIs (shared) ── */
function computeChannelKpis(channels) {
  var totalBudget = 0;
  var totalConversions = 0;
  var totalRevenue = 0;
  var activeCount = 0;
  var totalClicks = 0;
  var totalImpressions = 0;
  var enabled = (channels || []).filter(function (ch) { return ch.enabled !== false; });

  enabled.forEach(function (ch) {
    var b = ch.monthlyBudget || 0;
    var cpc = ch.cpc || 1;
    var ctr = ch.ctr || 0.02;
    var convRate = ch.conversionRate || 0;
    var aov = ch.avgOrderValue || 0;

    totalBudget += b;
    var clicks = safeDiv(b, cpc);
    totalClicks += clicks;
    var impressions = ctr > 0 ? clicks / ctr : 0;
    totalImpressions += impressions;
    var conv = clicks * convRate;
    totalConversions += conv;
    totalRevenue += conv * aov;
    if (b > 0) activeCount++;
  });

  return {
    totalBudget: totalBudget,
    totalConversions: totalConversions,
    totalRevenue: totalRevenue,
    activeCount: activeCount,
    totalClicks: totalClicks,
    totalImpressions: totalImpressions,
    avgCac: safeDiv(totalBudget, totalConversions),
    avgRoas: safeDiv(totalRevenue, totalBudget),
  };
}

/* ── Fake preview component (shown behind paywall) ── */
function FakePreview({ lk }) {
  return (
    <div>
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {FAKE_KPIS.map(function (kpi) {
          return <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />;
        })}
      </div>
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {lk === "fr" ? "Répartition du budget" : "Budget breakdown"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <svg width={80} height={80} viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
              <circle cx={40} cy={40} r={30} fill="none" stroke="var(--brand)" strokeWidth={10} strokeDasharray="58 130" transform="rotate(-90 40 40)" />
              <circle cx={40} cy={40} r={30} fill="none" stroke="var(--color-info)" strokeWidth={10} strokeDasharray="45 143" strokeDashoffset={-58} transform="rotate(-90 40 40)" />
              <circle cx={40} cy={40} r={30} fill="none" stroke="var(--color-warning)" strokeWidth={10} strokeDasharray="28 160" strokeDashoffset={-103} transform="rotate(-90 40 40)" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[{ l: "Meta Ads", p: "33%", c: "var(--brand)" }, { l: "Google Ads", p: "49%", c: "var(--color-info)" }, { l: "LinkedIn", p: "18%", c: "var(--color-warning)" }].map(function (r) {
                return (
                  <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{r.l}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.p}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {lk === "fr" ? "Performance par canal" : "Channel performance"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {[{ l: "Meta", w: "65%", v: "ROAS 3.8x" }, { l: "Google", w: "85%", v: "ROAS 4.2x" }, { l: "LinkedIn", w: "35%", v: "ROAS 1.9x" }].map(function (b) {
              return (
                <div key={b.l}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                    <span>{b.l}</span><span style={{ fontWeight: 600 }}>{b.v}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: b.w, background: "var(--brand)", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>{lk === "fr" ? "Campagne" : "Campaign"}</span>
          <span style={{ textAlign: "right" }}>Budget</span>
          <span style={{ textAlign: "right" }}>CPC</span>
          <span style={{ textAlign: "right" }}>Clicks</span>
          <span style={{ textAlign: "right" }}>Conversions</span>
        </div>
        {FAKE_CHANNELS.map(function (ch) {
          var m = CHANNEL_META[ch.channel];
          return (
            <div key={ch.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <span style={{ fontWeight: 500 }}>{ch.name}</span>
                {m ? <Badge color={m.badge} size="sm">{m.label[lk]}</Badge> : null}
              </div>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(ch.budget)}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(ch.cpc)}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{String(ch.clicks)}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--brand)" }}>{String(ch.conversions)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Marketing Wizard (post-unlock) ── */
function MarketingWizard({ onFinish, lang, mt }) {
  var lk = lang === "en" ? "en" : "fr";
  var [channels, setChannels] = useState({ meta: true, google: true });
  var [budget, setBudget] = useState(1000);

  var steps = [
    {
      key: "intro",
      content: (
        <div style={{ textAlign: "center" }}>
          <Megaphone size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
            {mt.pg_title}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)", textAlign: "left" }}>
            {mt.pg_wiz_step1_desc}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", textAlign: "left" }}>
            {[
              { icon: Target, title: mt.pg_wiz_where_title, desc: mt.pg_wiz_where_desc },
              { icon: TrendUp, title: mt.pg_wiz_profitable_title, desc: mt.pg_wiz_profitable_desc },
              { icon: CurrencyCircleDollar, title: mt.pg_wiz_connected_title, desc: mt.pg_wiz_connected_desc },
            ].map(function (card, ci) {
              var CIcon = card.icon;
              return (
                <div key={ci} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", padding: "var(--sp-3)", background: "var(--bg-accordion)" }}>
                  <CIcon size={20} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-2)" }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{card.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      key: "channels",
      content: (
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
            {mt.pg_wiz_channels_title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
            {mt.pg_wiz_channels_subtitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {CHANNEL_KEYS.map(function (ck) {
              var m = CHANNEL_META[ck];
              var isActive = channels[ck];
              return (
                <button key={ck} type="button" onClick={function () { setChannels(function (prev) { var nc = Object.assign({}, prev); nc[ck] = !nc[ck]; return nc; }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-3)",
                    padding: "var(--sp-3) var(--sp-4)",
                    border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                    borderRadius: "var(--r-lg)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                    cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s, background 0.15s",
                  }}>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--brand)" : "var(--text-primary)" }}>{m.label[lk]}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{m.desc[lk]}</div>
                  </div>
                  {isActive ? (
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1.5 4.5L4 7L9.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: "1.5px solid var(--border-strong)", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ),
      canAdvance: Object.keys(channels).some(function (k) { return channels[k]; }),
    },
    {
      key: "budget",
      content: (
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
            {mt.pg_wiz_budget_title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-5)", textAlign: "center" }}>
            {mt.pg_wiz_budget_subtitle}
          </div>
          <div style={{ maxWidth: 300, margin: "0 auto" }}>
            <label style={labelStyle}>{mt.pg_wiz_budget_label}</label>
            <CurrencyInput value={budget} onChange={setBudget} suffix="€" width="100%" height={48} />
          </div>
          {budget > 0 ? (
            <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", maxWidth: 300, margin: "var(--sp-4) auto 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{mt.pg_kpi_annual_budget}</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(budget * 12)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>{mt.pg_wiz_auto_cost_note}</span>
              </div>
            </div>
          ) : null}
        </div>
      ),
      canAdvance: budget > 0,
    },
  ];

  function handleFinish() {
    var activeChannels = [];
    Object.keys(channels).forEach(function (k) { if (channels[k]) activeChannels.push(k); });
    onFinish({ channels: activeChannels, budget: budget });
  }

  return (
    <Wizard
      steps={steps}
      onFinish={handleFinish}
      finishLabel={mt.pg_wiz_finish}
      finishIcon={<Megaphone size={16} />}
      finishDisabled={budget <= 0}
    />
  );
}

/* ──────────────────────────────────────────────────────────────
   ACQUISITION OVERVIEW (new landing page for "marketing" tab)
   ────────────────────────────────────────────────────────────── */
function AcquisitionOverview({ channels, lk, mt, setTab, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var kpis = computeChannelKpis(channels);

  /* DonutChart data */
  var budgetDistribution = useMemo(function () {
    var dist = {};
    (channels || []).filter(function (ch) { return ch.enabled !== false && (ch.monthlyBudget || 0) > 0; }).forEach(function (ch) {
      var m = CHANNEL_META[ch.platform];
      var label = m ? m.label[lk] : ch.platform;
      dist[label] = (dist[label] || 0) + ch.monthlyBudget;
    });
    return dist;
  }, [channels, lk]);

  var channelMeta = useMemo(function () {
    var meta = {};
    (channels || []).filter(function (ch) { return ch.enabled !== false; }).forEach(function (ch) {
      var m = CHANNEL_META[ch.platform];
      if (m) {
        var label = m.label[lk];
        meta[label] = { label: { fr: label, en: label }, badge: m.badge };
      }
    });
    return meta;
  }, [channels, lk]);

  /* Top channel by ROAS */
  var topChannel = useMemo(function () {
    var best = null;
    var bestRoas = 0;
    (channels || []).filter(function (ch) { return ch.enabled !== false && (ch.monthlyBudget || 0) > 0; }).forEach(function (ch) {
      var clicks = safeDiv(ch.monthlyBudget || 0, ch.cpc || 1);
      var conv = clicks * (ch.conversionRate || 0);
      var rev = conv * (ch.avgOrderValue || 0);
      var roas = safeDiv(rev, ch.monthlyBudget || 0);
      if (roas > bestRoas) { bestRoas = roas; best = ch; }
    });
    if (!best) return null;
    var m = CHANNEL_META[best.platform];
    return { label: m ? m.label[lk] : best.platform, badge: m ? m.badge : "gray", roas: bestRoas };
  }, [channels, lk]);

  /* Mini funnel data */
  var funnelSteps = [
    { label: mt.pg_funnel_impressions, value: Math.round(kpis.totalImpressions) },
    { label: mt.pg_funnel_clicks, value: Math.round(kpis.totalClicks) },
    { label: mt.pg_funnel_conversions, value: Math.round(kpis.totalConversions) },
    { label: mt.pg_funnel_revenue, value: kpis.totalRevenue, isCurrency: true },
  ];

  var quickActions = [
    { id: "mkt_channels", icon: Crosshair, title: mt.pg_acq_card_channels_title, desc: mt.pg_acq_card_channels_desc },
    { id: "mkt_campaigns", icon: Newspaper, title: mt.pg_acq_card_campaigns_title, desc: mt.pg_acq_card_campaigns_desc },
    { id: "mkt_conversions", icon: FunnelIcon, title: mt.pg_acq_card_conversions_title, desc: mt.pg_acq_card_conversions_desc },
  ];

  var metricCards = [
    { term: "cac", label: mt.pg_metric_cac_label, explain: mt.pg_acq_cac_explain, gloss: mt.pg_glossary_cac, value: kpis.totalConversions > 0 ? eurShort(kpis.avgCac) : "—" },
    { term: "roas", label: mt.pg_metric_roas_label, explain: mt.pg_acq_roas_explain, gloss: mt.pg_glossary_roas, value: kpis.avgRoas > 0 ? kpis.avgRoas.toFixed(1) + "x" : "—" },
    { term: "cpc", label: mt.pg_metric_cpc_label, explain: mt.pg_acq_cpc_explain, gloss: mt.pg_glossary_cpc, value: null },
    { term: "ctr", label: mt.pg_metric_ctr_label, explain: mt.pg_acq_ctr_explain, gloss: mt.pg_glossary_ctr, value: null },
    { term: "ltv", label: mt.pg_metric_ltv_label, explain: mt.pg_acq_ltv_explain, gloss: mt.pg_glossary_ltv, value: null },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={mt.pg_kpi_total_budget} value={eurShort(kpis.totalBudget)} fullValue={eur(kpis.totalBudget)} />
        <KpiCard label={mt.pg_kpi_avg_cac} value={kpis.totalConversions > 0 ? eurShort(kpis.avgCac) : "—"} fullValue={kpis.totalConversions > 0 ? eur(kpis.avgCac) : undefined} glossaryKey="cac" />
        <KpiCard label={mt.pg_kpi_avg_roas} value={kpis.avgRoas > 0 ? kpis.avgRoas.toFixed(1) + "x" : "—"} glossaryKey="roas" />
        <KpiCard label={mt.pg_kpi_active_channels} value={String(kpis.activeCount)} />
      </div>

      {/* Educational card — 2 columns */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Left: explanation */}
        <Card sx={{ padding: "var(--sp-5)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {mt.pg_acq_what_title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)" }}>
            {mt.pg_acq_what_body}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {mt.pg_acq_how_title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {mt.pg_acq_how_body}{" "}
            <FinanceLink term="cac" label={mt.pg_metric_cac_label} desc={mt.pg_glossary_cac} /> {lk === "fr" ? "désigne ce coût." : "refers to this cost."}
          </div>
        </Card>

        {/* Right: mini funnel + top channel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          {/* Mini funnel */}
          <Card sx={{ padding: "var(--sp-4)", flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
              {mt.pg_funnel_title}
            </div>
            {kpis.activeCount > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {funnelSteps.map(function (step, i) {
                  var prev = i > 0 ? funnelSteps[i - 1] : null;
                  var dropOff = prev && prev.value > 0 && !prev.isCurrency && !step.isCurrency
                    ? ((prev.value - step.value) / prev.value)
                    : null;
                  var widthPct = funnelSteps[0].value > 0 && !step.isCurrency
                    ? Math.max(30, (step.value / funnelSteps[0].value) * 100)
                    : 100;
                  var colors = [
                    { bg: "var(--brand-bg)", border: "var(--brand-border)", text: "var(--brand)" },
                    { bg: "var(--color-info-bg)", border: "var(--color-info-border)", text: "var(--color-info)" },
                    { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "var(--color-warning)" },
                    { bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-success)" },
                  ];
                  var c = colors[i] || colors[0];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                      <div style={{
                        width: widthPct + "%", height: 40,
                        background: c.bg, border: "1px solid " + c.border,
                        borderRadius: "var(--r-md)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-2)",
                        padding: "0 var(--sp-3)", transition: "width 0.3s ease",
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                          {step.isCurrency ? eurShort(step.value) : String(step.value)}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{step.label}</span>
                      </div>
                      {dropOff !== null ? (
                        <span style={{ fontSize: 10, fontWeight: 600, color: c.text, whiteSpace: "nowrap" }}>
                          <ArrowDown size={9} style={{ verticalAlign: "middle", marginRight: 2 }} />
                          {(dropOff * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-faint)", textAlign: "center", padding: "var(--sp-4)" }}>
                {mt.pg_insights_no_data}
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-3)", lineHeight: 1.5 }}>
              {mt.pg_acq_funnel_explain}
            </div>
          </Card>

          {/* Top channel */}
          {topChannel ? (
            <Card sx={{ padding: "var(--sp-4)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
                {mt.pg_insights_top_channel}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                <Badge color={topChannel.badge} size="sm" dot>{topChannel.label}</Badge>
                <span style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-primary)" }}>
                  {topChannel.roas.toFixed(1)}x
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <FinanceLink term="roas" label={mt.pg_metric_roas_label} desc={mt.pg_glossary_roas} />
                </span>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Quick action cards — 3 columns */}
      <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {quickActions.map(function (action) {
          var AIcon = action.icon;
          return (
            <Card key={action.id} sx={{ padding: "var(--sp-4)", cursor: "pointer", transition: "border-color 0.15s", display: "flex", flexDirection: "column" }}
              onClick={function () { setTab(action.id); }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--brand-bg)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AIcon size={18} weight="duotone" color="var(--brand)" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{action.title}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, flex: 1 }}>{action.desc}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--brand)", marginTop: "var(--sp-3)" }}>
                {mt.pg_acq_next_step} <ArrowRight size={12} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Metrics explained — 5 cards */}
      <Card sx={{ padding: "var(--sp-5)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-4)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {mt.pg_acq_metrics_title}
        </div>
        <div className="resp-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--sp-3)" }}>
          {metricCards.map(function (mc) {
            return (
              <div key={mc.term} style={{ padding: "var(--sp-3)", border: "1px solid var(--border-light)", borderRadius: "var(--r-md)", background: "var(--bg-accordion)", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  <FinanceLink term={mc.term} label={mc.label} desc={mc.gloss} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, flex: 1 }}>
                  {mc.explain}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginTop: "var(--sp-2)" }}>
                  {mc.value || "—"}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* DonutChart if channels exist */}
      {Object.keys(budgetDistribution).length > 1 ? (
        <Card sx={{ padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {mt.pg_chart_budget_breakdown}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ChartLegend palette={chartPalette} distribution={budgetDistribution} meta={channelMeta} total={kpis.totalBudget} lk={lk}>
            <DonutChart data={budgetDistribution} palette={chartPalette} />
          </ChartLegend>
        </Card>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   CHANNELS TAB
   ────────────────────────────────────────────────────────────── */
function ChannelsTab({ channels, setChannelsData, lk, mt, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var [search, setSearch] = useState("");
  var [modalOpen, setModalOpen] = useState(false);
  var [editIdx, setEditIdx] = useState(-1);
  var [form, setForm] = useState({});
  var [confirmDelete, setConfirmDelete] = useState(null);
  var { devMode } = useDevMode();

  var enabledChannels = useMemo(function () {
    return (channels || []).filter(function (ch) { return ch.enabled !== false; });
  }, [channels]);

  var filtered = useMemo(function () {
    if (!search) return channels || [];
    var q = search.toLowerCase();
    return (channels || []).filter(function (ch) {
      var m = CHANNEL_META[ch.platform];
      var label = m ? m.label[lk] : ch.platform;
      return label.toLowerCase().indexOf(q) >= 0;
    });
  }, [channels, search, lk]);

  var kpis = computeChannelKpis(channels);

  /* DonutChart data */
  var budgetDistribution = useMemo(function () {
    var dist = {};
    enabledChannels.forEach(function (ch) {
      if ((ch.monthlyBudget || 0) > 0) {
        var m = CHANNEL_META[ch.platform];
        var label = m ? m.label[lk] : ch.platform;
        dist[label] = (dist[label] || 0) + ch.monthlyBudget;
      }
    });
    return dist;
  }, [enabledChannels, lk]);

  var channelMeta = useMemo(function () {
    var meta = {};
    enabledChannels.forEach(function (ch) {
      var m = CHANNEL_META[ch.platform];
      if (m) {
        var label = m.label[lk];
        meta[label] = { label: { fr: label, en: label }, badge: m.badge };
      }
    });
    return meta;
  }, [enabledChannels, lk]);

  /* Top channel by ROAS */
  var topChannel = useMemo(function () {
    var best = null;
    var bestRoas = 0;
    enabledChannels.filter(function (ch) { return (ch.monthlyBudget || 0) > 0; }).forEach(function (ch) {
      var clicks = safeDiv(ch.monthlyBudget || 0, ch.cpc || 1);
      var conv = clicks * (ch.conversionRate || 0);
      var rev = conv * (ch.avgOrderValue || 0);
      var roas = safeDiv(rev, ch.monthlyBudget || 0);
      if (roas > bestRoas) { bestRoas = roas; best = ch; }
    });
    if (!best) return null;
    var m = CHANNEL_META[best.platform];
    return { label: m ? m.label[lk] : best.platform, badge: m ? m.badge : "gray", roas: bestRoas };
  }, [enabledChannels, lk]);

  function openAdd() {
    setEditIdx(-1);
    setForm({ platform: "meta", monthlyBudget: 500, cpc: CHANNEL_META.meta.defaultCpc, ctr: CHANNEL_META.meta.defaultCtr, conversionRate: CHANNEL_META.meta.defaultConvRate, avgOrderValue: CHANNEL_META.meta.defaultAov, enabled: true });
    setModalOpen(true);
  }

  function openEdit(idx) {
    setEditIdx(idx);
    setForm(Object.assign({}, (channels || [])[idx]));
    setModalOpen(true);
  }

  function saveChannel() {
    var next = (channels || []).slice();
    if (editIdx >= 0) {
      next[editIdx] = Object.assign({}, next[editIdx], form);
    } else {
      next.push(Object.assign({ id: makeId("mch"), enabled: true }, form));
    }
    setChannelsData(next);
    setModalOpen(false);
  }

  function removeChannel(idx) {
    var next = (channels || []).slice();
    next.splice(idx, 1);
    setChannelsData(next);
    setConfirmDelete(null);
  }

  function cloneChannel(idx) {
    var next = (channels || []).slice();
    var original = next[idx];
    var clone = Object.assign({}, original, { id: makeId("mch") });
    next.splice(idx + 1, 0, clone);
    setChannelsData(next);
  }

  function bulkDeleteChannels(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    var next = (channels || []).filter(function (ch) { return !idSet[ch.id]; });
    setChannelsData(next);
  }

  function onPlatformChange(platform) {
    var m = CHANNEL_META[platform];
    setForm(function (prev) {
      return Object.assign({}, prev, {
        platform: platform,
        cpc: m ? m.defaultCpc : prev.cpc,
        ctr: m ? m.defaultCtr : prev.ctr,
        conversionRate: m ? m.defaultConvRate : prev.conversionRate,
        avgOrderValue: m ? m.defaultAov : prev.avgOrderValue,
      });
    });
  }

  /* Estimate for modal */
  var estClicks = Math.round(safeDiv(form.monthlyBudget || 0, form.cpc || 1));
  var estConv = Math.round(estClicks * (form.conversionRate || 0));

  var columns = useMemo(function () {
    return [
      {
        id: "platform", header: mt.pg_col_channel,
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        accessorFn: function (row) { var m = CHANNEL_META[row.platform]; return m ? m.label[lk] : row.platform; },
        cell: function (info) {
          var ch = info.row.original;
          var m = CHANNEL_META[ch.platform];
          return m ? <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge> : ch.platform;
        },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{mt.pg_footer_total}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{(channels || []).length} {mt.pg_footer_channels}</span>
            </>
          );
        },
      },
      {
        id: "budget", header: mt.pg_col_budget_mo,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.monthlyBudget || 0; },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(kpis.totalBudget)}</span>; },
      },
      {
        id: "cpc", header: mt.pg_col_cpc,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.cpc || 0; },
        cell: function (info) { return eur(info.getValue()); },
      },
      {
        id: "ctr", header: mt.pg_col_ctr,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.ctr || 0; },
        cell: function (info) { return pct(info.getValue()); },
      },
      {
        id: "convRate", header: mt.pg_col_conv_rate,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.conversionRate || 0; },
        cell: function (info) { return pct(info.getValue()); },
      },
      {
        id: "clicks", header: mt.pg_col_est_clicks,
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return Math.round(safeDiv(row.monthlyBudget || 0, row.cpc || 1)); },
        cell: function (info) { return String(info.getValue()); },
        footer: function () {
          var tot = 0;
          enabledChannels.forEach(function (ch) { tot += Math.round(safeDiv(ch.monthlyBudget || 0, ch.cpc || 1)); });
          return <span style={{ fontWeight: 600 }}>{String(tot)}</span>;
        },
      },
      {
        id: "conversions", header: mt.pg_col_est_conv,
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) {
          var clicks = safeDiv(row.monthlyBudget || 0, row.cpc || 1);
          return Math.round(clicks * (row.conversionRate || 0));
        },
        cell: function (info) { return <span style={{ fontWeight: 600, color: "var(--brand)" }}>{String(info.getValue())}</span>; },
        footer: function () { return <span style={{ fontWeight: 600, color: "var(--brand)" }}>{String(Math.round(kpis.totalConversions))}</span>; },
      },
      {
        id: "cac", header: mt.pg_col_cac,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) {
          var clicks = safeDiv(row.monthlyBudget || 0, row.cpc || 1);
          var conv = clicks * (row.conversionRate || 0);
          return conv > 0 ? (row.monthlyBudget || 0) / conv : Infinity;
        },
        cell: function (info) {
          var v = info.getValue();
          return v === Infinity || !isFinite(v) ? <span style={{ color: "var(--text-faint)" }}>—</span> : eur(v);
        },
      },
      {
        id: "roas", header: mt.pg_col_roas,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) {
          var clicks = safeDiv(row.monthlyBudget || 0, row.cpc || 1);
          var conv = clicks * (row.conversionRate || 0);
          var rev = conv * (row.avgOrderValue || 0);
          return safeDiv(rev, row.monthlyBudget || 0);
        },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? <span style={{ fontWeight: 600 }}>{v.toFixed(1) + "x"}</span> : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "actions", header: "",
        enableSorting: false, meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = info.row.index;
          return (
            <div style={{ display: "inline-flex", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={mt.pg_edit} onClick={function () { openEdit(idx); }} />
              <ActionBtn icon={<Copy size={14} />} title={mt.pg_clone} onClick={function () { cloneChannel(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={mt.pg_delete} variant="danger" onClick={function () { setConfirmDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [channels, enabledChannels, kpis, lk, mt]);

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={mt.pg_search_channels} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? <DevOptionsButton
          onRandomize={function () {
            var demo = [];
            ["meta", "google", "linkedin", "tiktok", "seo"].forEach(function (k) {
              var m = CHANNEL_META[k];
              demo.push({
                id: makeId("mch"), platform: k, enabled: true,
                monthlyBudget: Math.round((200 + Math.random() * 1800) / 50) * 50,
                cpc: m.defaultCpc * (0.7 + Math.random() * 0.6),
                ctr: m.defaultCtr * (0.8 + Math.random() * 0.4),
                conversionRate: m.defaultConvRate * (0.7 + Math.random() * 0.6),
                avgOrderValue: m.defaultAov * (0.8 + Math.random() * 0.4),
              });
            });
            setChannelsData(demo);
          }}
          onClear={function () { setChannelsData([]); }}
        /> : null}
        <ExportButtons columns={columns} data={filtered} filename="marketing-channels" />
        <Button color="primary" size="lg" iconLeading={<Plus size={14} weight="bold" />} onClick={openAdd}>
          {mt.pg_add}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Target size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{mt.pg_empty_channels}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>{mt.pg_empty_channels_hint}</div>
      <Button color="primary" size="md" iconLeading={<Plus size={14} weight="bold" />} onClick={openAdd}>
        {mt.pg_add}
      </Button>
    </div>
  );

  /* Selected platform meta for modal */
  var selectedMeta = CHANNEL_META[form.platform || "meta"] || CHANNEL_META.meta;
  var SelIcon = selectedMeta.icon;

  return (
    <div>
      {/* KPI Cards */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={mt.pg_kpi_total_budget} value={eurShort(kpis.totalBudget)} fullValue={eur(kpis.totalBudget)} />
        <KpiCard label={mt.pg_kpi_avg_cac} value={kpis.totalConversions > 0 ? eurShort(kpis.avgCac) : "—"} fullValue={kpis.totalConversions > 0 ? eur(kpis.avgCac) : undefined} glossaryKey="cac" />
        <KpiCard label={mt.pg_kpi_avg_roas} value={kpis.avgRoas > 0 ? kpis.avgRoas.toFixed(1) + "x" : "—"} glossaryKey="roas" />
        <KpiCard label={mt.pg_kpi_active_channels} value={String(kpis.activeCount)} />
      </div>

      {/* Insights section — 2 columns */}
      {Object.keys(budgetDistribution).length > 1 ? (
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
          {/* Left: Donut chart */}
          <Card sx={{ padding: "var(--sp-4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-3)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {mt.pg_chart_budget_breakdown}
              </div>
              <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
            </div>
            <ChartLegend palette={chartPalette} distribution={budgetDistribution} meta={channelMeta} total={kpis.totalBudget} lk={lk}>
              <DonutChart data={budgetDistribution} palette={chartPalette} />
            </ChartLegend>
          </Card>

          {/* Right: Top channel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
            {topChannel ? (
              <Card sx={{ padding: "var(--sp-4)", flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
                  {mt.pg_insights_top_channel}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
                  <Badge color={topChannel.badge} size="sm" dot>{topChannel.label}</Badge>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-primary)", marginBottom: 4 }}>
                  {topChannel.roas.toFixed(1)}x
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <FinanceLink term="roas" label={mt.pg_metric_roas_label} desc={mt.pg_glossary_roas} />
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={240}
        pageSize={10}
        dimRow={function (row) { return !row.monthlyBudget || row.monthlyBudget <= 0; }}
        getRowId={function (row) { return row.id; }}
        selectable
        scrollable
        onDeleteSelected={bulkDeleteChannels}
        deleteSelectedLabel={mt.pg_bulk_delete}
        showFooter
      />

      {/* Channel Modal — split-panel */}
      <Modal open={modalOpen} onClose={function () { setModalOpen(false); }} size="lg" height={540} hideClose>
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <ModalSideNav
            title={mt.pg_modal_platform}
            items={CHANNEL_KEYS.map(function (ck) {
              var m = CHANNEL_META[ck];
              return { key: ck, icon: m.icon, label: m.label[lk] };
            })}
            selected={form.platform || "meta"}
            onSelect={onPlatformChange}
            width={200}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Header */}
            <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
                <SelIcon size={16} weight="duotone" color="var(--text-secondary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                  {selectedMeta.label[lk]}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>
                  {selectedMeta.desc[lk]}
                </div>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="custom-scroll" style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-3)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                <div>
                  <label style={labelStyle}>{mt.pg_modal_monthly_budget}</label>
                  <CurrencyInput value={form.monthlyBudget || 0} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { monthlyBudget: v }); }); }} suffix="€" width="100%" />
                </div>
                <div>
                  <label style={labelStyle}>{mt.pg_col_cpc}</label>
                  <CurrencyInput value={form.cpc || 0} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { cpc: v }); }); }} suffix="€" width="100%" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                <div>
                  <label style={labelStyle}>{mt.pg_col_ctr} (%)</label>
                  <NumberField value={((form.ctr || 0) * 100)} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { ctr: v / 100 }); }); }} suffix="%" width="100%" />
                </div>
                <div>
                  <label style={labelStyle}>{mt.pg_modal_conv_rate}</label>
                  <NumberField value={((form.conversionRate || 0) * 100)} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { conversionRate: v / 100 }); }); }} suffix="%" width="100%" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{mt.pg_modal_avg_order}</label>
                <CurrencyInput value={form.avgOrderValue || 0} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { avgOrderValue: v }); }); }} suffix="€" width="100%" />
              </div>

              {/* Estimate preview */}
              {(form.monthlyBudget || 0) > 0 ? (
                <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                    {mt.pg_modal_estimate}
                  </div>
                  <div style={{ display: "flex", gap: "var(--sp-4)", fontSize: 13 }}>
                    <span><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{String(estClicks)}</span> <span style={{ color: "var(--text-muted)" }}>{mt.pg_modal_est_clicks}</span></span>
                    <span><span style={{ fontWeight: 700, color: "var(--brand)" }}>{String(estConv)}</span> <span style={{ color: "var(--text-muted)" }}>{mt.pg_modal_est_conv}</span></span>
                  </div>
                </div>
              ) : null}
            </div>

            <ModalFooter>
              <Button onClick={function () { setModalOpen(false); }}>{mt.pg_cancel}</Button>
              <Button color="primary" onClick={saveChannel}>{editIdx >= 0 ? mt.pg_save : mt.pg_add}</Button>
            </ModalFooter>
          </div>
        </div>
      </Modal>

      {confirmDelete !== null ? (
        <ConfirmDeleteModal
          onConfirm={function () { removeChannel(confirmDelete); }}
          onCancel={function () { setConfirmDelete(null); }}
          t={{ confirm_delete_title: mt.pg_confirm_channel, confirm_delete_msg: mt.pg_confirm_msg, confirm_delete_yes: mt.pg_confirm_yes, confirm_delete_no: mt.pg_confirm_no }}
        />
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   CAMPAIGNS TAB
   ────────────────────────────────────────────────────────────── */
function CampaignsTab({ campaigns, setCampaignsData, channels, lk, mt }) {
  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("");
  var [channelFilter, setChannelFilter] = useState("");
  var { devMode } = useDevMode();
  var [modalOpen, setModalOpen] = useState(false);
  var [editIdx, setEditIdx] = useState(-1);
  var [form, setForm] = useState({});
  var [confirmDelete, setConfirmDelete] = useState(null);
  var [activeSubTab, setActiveSubTab] = useState("all");

  var channelMap = useMemo(function () {
    var map = {};
    (channels || []).forEach(function (ch) { map[ch.id] = ch; });
    return map;
  }, [channels]);

  /* Tab counts */
  var tabCounts = useMemo(function () {
    var counts = { all: (campaigns || []).length, draft: 0, active: 0, paused: 0, completed: 0 };
    (campaigns || []).forEach(function (c) {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return counts;
  }, [campaigns]);

  var filtered = useMemo(function () {
    var items = campaigns || [];
    if (activeSubTab !== "all") items = items.filter(function (c) { return c.status === activeSubTab; });
    if (statusFilter) items = items.filter(function (c) { return c.status === statusFilter; });
    if (channelFilter) items = items.filter(function (c) { return c.channelId === channelFilter; });
    if (search) {
      var q = search.toLowerCase();
      items = items.filter(function (c) { return (c.name || "").toLowerCase().indexOf(q) >= 0; });
    }
    return items;
  }, [campaigns, activeSubTab, statusFilter, channelFilter, search]);

  function openAdd() {
    setEditIdx(-1);
    setForm({ name: "", channelId: (channels && channels.length > 0) ? channels[0].id : "", objective: "conversion", startDate: new Date().toISOString().slice(0, 10), endDate: "", budget: 500, status: "draft" });
    setModalOpen(true);
  }

  function openEdit(idx) {
    var original = (campaigns || [])[idx];
    setEditIdx(idx);
    setForm(Object.assign({}, original));
    setModalOpen(true);
  }

  function saveCampaign() {
    var next = (campaigns || []).slice();
    if (editIdx >= 0) {
      next[editIdx] = Object.assign({}, next[editIdx], form);
    } else {
      next.push(Object.assign({ id: makeId("mcp") }, form));
    }
    setCampaignsData(next);
    setModalOpen(false);
  }

  function removeCampaign(idx) {
    var next = (campaigns || []).slice();
    next.splice(idx, 1);
    setCampaignsData(next);
    setConfirmDelete(null);
  }

  function cloneCampaign(idx) {
    var next = (campaigns || []).slice();
    var original = next[idx];
    var clone = Object.assign({}, original, { id: makeId("mcp"), name: (original.name || "") + " " + mt.pg_copy_suffix });
    next.splice(idx + 1, 0, clone);
    setCampaignsData(next);
  }

  function bulkDeleteCampaigns(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    var next = (campaigns || []).filter(function (c) { return !idSet[c.id]; });
    setCampaignsData(next);
  }

  var channelFilterOptions = [{ value: "", label: mt.pg_filter_all_channels }].concat(
    (channels || []).map(function (ch) {
      var m = CHANNEL_META[ch.platform];
      return { value: ch.id, label: m ? m.label[lk] : ch.platform };
    })
  );

  var channelSelectOptions = (channels || []).map(function (ch) {
    var m = CHANNEL_META[ch.platform];
    return { value: ch.id, label: m ? m.label[lk] : ch.platform };
  });

  var objectiveOptions = Object.keys(OBJECTIVE_META).map(function (k) {
    return { value: k, label: OBJECTIVE_META[k].label[lk] };
  });

  var statusSelectOptions = Object.keys(STATUS_META).map(function (k) {
    return { value: k, label: STATUS_META[k].label[lk] };
  });

  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: mt.pg_col_name,
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        cell: function (info) { return info.getValue() || <span style={{ color: "var(--text-faint)" }}>—</span>; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{mt.pg_footer_total}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{filtered.length} {mt.pg_footer_campaigns}</span>
            </>
          );
        },
      },
      {
        id: "channel", header: mt.pg_col_channel,
        enableSorting: true, meta: { align: "left" },
        accessorFn: function (row) {
          var ch = channelMap[row.channelId];
          if (!ch) return "";
          var m = CHANNEL_META[ch.platform];
          return m ? m.label[lk] : ch.platform;
        },
        cell: function (info) {
          var row = info.row.original;
          var ch = channelMap[row.channelId];
          if (!ch) return <span style={{ color: "var(--text-faint)" }}>—</span>;
          var m = CHANNEL_META[ch.platform];
          return m ? <Badge color={m.badge} size="sm">{m.label[lk]}</Badge> : ch.platform;
        },
      },
      {
        id: "objective", header: mt.pg_col_objective,
        enableSorting: true, meta: { align: "left" },
        accessorFn: function (row) { var o = OBJECTIVE_META[row.objective]; return o ? o.label[lk] : row.objective; },
        cell: function (info) {
          var row = info.row.original;
          var o = OBJECTIVE_META[row.objective];
          return o ? <Badge color={o.badge} size="sm">{o.label[lk]}</Badge> : row.objective;
        },
      },
      {
        id: "dates", header: mt.pg_col_dates,
        enableSorting: true, meta: { align: "left" },
        accessorFn: function (row) { return row.startDate || ""; },
        cell: function (info) {
          var row = info.row.original;
          var s = row.startDate || "—";
          var e = row.endDate || "...";
          return <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{s + " → " + e}</span>;
        },
      },
      {
        id: "budget", header: "Budget",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.budget || 0; },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () {
          var tot = 0;
          filtered.forEach(function (c) { tot += c.budget || 0; });
          return <span style={{ fontWeight: 600 }}>{eur(tot)}</span>;
        },
      },
      {
        id: "status", header: mt.pg_col_status,
        enableSorting: true, meta: { align: "center" },
        accessorFn: function (row) { var s = STATUS_META[row.status]; return s ? s.label[lk] : row.status; },
        cell: function (info) {
          var row = info.row.original;
          var s = STATUS_META[row.status];
          return s ? <Badge color={s.badge} size="sm" dot>{s.label[lk]}</Badge> : row.status;
        },
      },
      {
        id: "actions", header: "",
        enableSorting: false, meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = info.row.index;
          return (
            <div style={{ display: "inline-flex", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={mt.pg_edit} onClick={function () { openEdit(idx); }} />
              <ActionBtn icon={<Copy size={14} />} title={mt.pg_clone} onClick={function () { cloneCampaign(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={mt.pg_delete} variant="danger" onClick={function () { setConfirmDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [campaigns, channelMap, filtered, lk, mt]);

  /* Sub-tabs */
  var subTabs = [
    { key: "all", label: mt.pg_tab_all, count: tabCounts.all },
    { key: "draft", label: STATUS_META.draft.label[lk], count: tabCounts.draft },
    { key: "active", label: STATUS_META.active.label[lk], count: tabCounts.active },
    { key: "paused", label: STATUS_META.paused.label[lk], count: tabCounts.paused },
    { key: "completed", label: STATUS_META.completed.label[lk], count: tabCounts.completed },
  ];

  var statusFilterOptions = [{ value: "", label: mt.pg_filter_all_statuses }].concat(
    Object.keys(STATUS_META).map(function (k) { return { value: k, label: STATUS_META[k].label[lk] }; })
  );

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={mt.pg_search_campaigns} />
        <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={statusFilterOptions} />
        <FilterDropdown value={channelFilter} onChange={setChannelFilter} options={channelFilterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? <DevOptionsButton
          onRandomize={function () {
            var demo = [];
            var statuses = Object.keys(STATUS_META);
            var objectives = Object.keys(OBJECTIVE_META);
            ["Campagne été", "Promo rentrée", "Black Friday", "Lancement produit"].forEach(function (name, i) {
              demo.push({
                id: makeId("mcp"), name: name,
                channelId: (channels && channels.length > 0) ? channels[i % channels.length].id : "",
                objective: objectives[i % objectives.length],
                startDate: "2026-0" + (i + 3) + "-01",
                endDate: "2026-0" + (i + 4) + "-30",
                budget: Math.round((300 + Math.random() * 2000) / 50) * 50,
                status: statuses[i % statuses.length],
              });
            });
            setCampaignsData(demo);
          }}
          onClear={function () { setCampaignsData([]); }}
        /> : null}
        <ExportButtons columns={columns} data={filtered} filename="marketing-campaigns" />
        <Button color="primary" size="lg" iconLeading={<Plus size={14} weight="bold" />} onClick={openAdd}>
          {mt.pg_add}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Megaphone size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{mt.pg_empty_campaigns}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>{mt.pg_empty_campaigns_hint}</div>
      <Button color="primary" size="md" iconLeading={<Plus size={14} weight="bold" />} onClick={openAdd}>
        {mt.pg_add}
      </Button>
    </div>
  );

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {subTabs.map(function (st) {
          var isActive = st.key === activeSubTab;
          return (
            <button key={st.key} type="button" onClick={function () { setActiveSubTab(st.key); }}
              style={{
                padding: "var(--sp-2) var(--sp-4)", fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                background: "transparent", border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: "var(--sp-2)",
              }}>
              {st.label}
              {st.count > 0 ? (
                <span style={{
                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                  padding: "2px 6px", borderRadius: 99,
                  background: isActive ? "var(--brand)" : "var(--bg-accordion)",
                  color: isActive ? "white" : "var(--text-muted)",
                }}>
                  {st.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={240}
        pageSize={10}
        dimRow={function (row) { return !(row.name || "").trim(); }}
        getRowId={function (row) { return row.id; }}
        selectable
        scrollable
        onDeleteSelected={bulkDeleteCampaigns}
        deleteSelectedLabel={mt.pg_bulk_delete}
        showFooter
      />

      {/* Campaign Modal */}
      <Modal open={modalOpen} onClose={function () { setModalOpen(false); }} size="md"
        title={editIdx >= 0 ? mt.pg_modal_edit_campaign : mt.pg_modal_add_campaign}
        icon={<Megaphone size={20} weight="duotone" />}
      >
        <div style={{ padding: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <div>
            <label style={labelStyle}>{mt.pg_modal_campaign_name}</label>
            <input type="text" value={form.name || ""} onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { name: e.target.value }); }); }}
              placeholder={mt.pg_modal_campaign_placeholder}
              autoFocus
              style={{ width: "100%", height: 40, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "0 var(--sp-3)", fontSize: 13, fontFamily: "inherit", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
            <div>
              <label style={labelStyle}>{mt.pg_modal_channel_label}</label>
              <SelectDropdown value={form.channelId || ""} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { channelId: v }); }); }}
                options={channelSelectOptions} placeholder="..." width="100%" />
            </div>
            <div>
              <label style={labelStyle}>{mt.pg_modal_objective}</label>
              <SelectDropdown value={form.objective || "conversion"} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { objective: v }); }); }}
                options={objectiveOptions} width="100%" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
            <div>
              <label style={labelStyle}>{mt.pg_modal_start_date}</label>
              <DatePicker value={form.startDate || ""} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { startDate: v }); }); }} />
            </div>
            <div>
              <label style={labelStyle}>{mt.pg_modal_end_date}</label>
              <DatePicker value={form.endDate || ""} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { endDate: v }); }); }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
            <div>
              <label style={labelStyle}>Budget</label>
              <CurrencyInput value={form.budget || 0} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { budget: v }); }); }} suffix="€" width="100%" />
            </div>
            <div>
              <label style={labelStyle}>{mt.pg_modal_status}</label>
              <SelectDropdown value={form.status || "draft"} onChange={function (v) { setForm(function (p) { return Object.assign({}, p, { status: v }); }); }}
                options={statusSelectOptions} width="100%" />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button onClick={function () { setModalOpen(false); }}>{mt.pg_cancel}</Button>
          <Button color="primary" onClick={saveCampaign} disabled={!(form.name || "").trim()}>
            {editIdx >= 0 ? mt.pg_save : mt.pg_add}
          </Button>
        </ModalFooter>
      </Modal>

      {confirmDelete !== null ? (
        <ConfirmDeleteModal
          onConfirm={function () { removeCampaign(confirmDelete); }}
          onCancel={function () { setConfirmDelete(null); }}
          t={{ confirm_delete_title: mt.pg_confirm_campaign, confirm_delete_msg: mt.pg_confirm_msg, confirm_delete_yes: mt.pg_confirm_yes, confirm_delete_no: mt.pg_confirm_no }}
        />
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   BUDGET TAB
   ────────────────────────────────────────────────────────────── */
function BudgetTab({ channels, totalRevenue, lk, mt, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var enabledChannels = (channels || []).filter(function (ch) { return ch.enabled !== false && (ch.monthlyBudget || 0) > 0; });

  var totalBudgetMonthly = 0;
  enabledChannels.forEach(function (ch) { totalBudgetMonthly += ch.monthlyBudget || 0; });
  var totalBudgetAnnual = totalBudgetMonthly * 12;
  var pctOfRevenue = totalRevenue > 0 ? totalBudgetAnnual / totalRevenue : 0;

  var budgetDistribution = useMemo(function () {
    var dist = {};
    enabledChannels.forEach(function (ch) {
      var m = CHANNEL_META[ch.platform];
      var label = m ? m.label[lk] : ch.platform;
      dist[label] = (dist[label] || 0) + (ch.monthlyBudget || 0);
    });
    return dist;
  }, [enabledChannels, lk]);

  var channelMeta = useMemo(function () {
    var meta = {};
    enabledChannels.forEach(function (ch) {
      var m = CHANNEL_META[ch.platform];
      if (m) {
        var label = m.label[lk];
        meta[label] = { label: { fr: label, en: label }, badge: m.badge };
      }
    });
    return meta;
  }, [enabledChannels, lk]);

  var summaryColumns = useMemo(function () {
    return [
      {
        id: "channel", header: mt.pg_col_channel,
        enableSorting: true, meta: { align: "left", minWidth: 140, grow: true },
        accessorFn: function (row) { return row.label; },
        cell: function (info) {
          var row = info.row.original;
          var m = CHANNEL_META[row.platform];
          return m ? <Badge color={m.badge} size="sm" dot>{row.label}</Badge> : row.label;
        },
        footer: function () { return <span style={{ fontWeight: 600 }}>{mt.pg_footer_total}</span>; },
      },
      {
        id: "budget", header: mt.pg_col_budget_mo,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.monthlyBudget; },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalBudgetMonthly)}</span>; },
      },
      {
        id: "pct", header: mt.pg_col_pct_total,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return totalBudgetMonthly > 0 ? row.monthlyBudget / totalBudgetMonthly : 0; },
        cell: function (info) { return pct(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>100%</span>; },
      },
      {
        id: "cac", header: mt.pg_col_cac,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) {
          var clicks = safeDiv(row.monthlyBudget, row.cpc || 1);
          var conv = clicks * (row.conversionRate || 0);
          return conv > 0 ? row.monthlyBudget / conv : Infinity;
        },
        cell: function (info) {
          var v = info.getValue();
          return isFinite(v) ? eur(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "roas", header: mt.pg_col_roas,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) {
          var clicks = safeDiv(row.monthlyBudget, row.cpc || 1);
          var conv = clicks * (row.conversionRate || 0);
          var rev = conv * (row.avgOrderValue || 0);
          return safeDiv(rev, row.monthlyBudget);
        },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? v.toFixed(1) + "x" : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
    ];
  }, [enabledChannels, totalBudgetMonthly, lk, mt]);

  var summaryData = useMemo(function () {
    return enabledChannels.map(function (ch) {
      var m = CHANNEL_META[ch.platform];
      return {
        id: ch.id,
        platform: ch.platform,
        label: m ? m.label[lk] : ch.platform,
        monthlyBudget: ch.monthlyBudget || 0,
        cpc: ch.cpc || 0,
        conversionRate: ch.conversionRate || 0,
        avgOrderValue: ch.avgOrderValue || 0,
      };
    });
  }, [enabledChannels, lk]);

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CurrencyCircleDollar size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{mt.pg_empty_budget}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>{mt.pg_empty_budget_hint}</div>
    </div>
  );

  return (
    <div>
      {/* KPI Cards */}
      <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={mt.pg_kpi_monthly_budget} value={eurShort(totalBudgetMonthly)} fullValue={eur(totalBudgetMonthly)} />
        <KpiCard label={mt.pg_kpi_annual_budget} value={eurShort(totalBudgetAnnual)} fullValue={eur(totalBudgetAnnual)} />
        <KpiCard label={mt.pg_kpi_pct_revenue} value={totalRevenue > 0 ? pct(pctOfRevenue) : "—"} />
      </div>

      {/* DonutChart */}
      {Object.keys(budgetDistribution).length > 1 ? (
        <Card sx={{ padding: "var(--sp-4)", marginBottom: "var(--gap-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {mt.pg_chart_budget_by_channel}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ChartLegend palette={chartPalette} distribution={budgetDistribution} meta={channelMeta} total={totalBudgetMonthly} lk={lk}>
            <DonutChart data={budgetDistribution} palette={chartPalette} />
          </ChartLegend>
        </Card>
      ) : null}

      {/* Summary table */}
      <DataTable
        columns={summaryColumns}
        data={summaryData}
        emptyState={emptyNode}
        emptyMinHeight={200}
        scrollable
        getRowId={function (row) { return row.id; }}
        showFooter
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   CONVERSIONS TAB
   ────────────────────────────────────────────────────────────── */
function ConversionsTab({ channels, lk, mt }) {
  var enabledChannels = (channels || []).filter(function (ch) { return ch.enabled !== false && (ch.monthlyBudget || 0) > 0; });

  var kpis = computeChannelKpis(channels);

  /* Funnel steps */
  var funnelSteps = [
    { label: mt.pg_funnel_impressions, value: Math.round(kpis.totalImpressions) },
    { label: mt.pg_funnel_clicks, value: Math.round(kpis.totalClicks) },
    { label: mt.pg_funnel_conversions, value: Math.round(kpis.totalConversions) },
    { label: mt.pg_funnel_revenue, value: kpis.totalRevenue, isCurrency: true },
  ];

  /* Per-channel comparison table sorted by ROAS desc */
  var channelRows = useMemo(function () {
    return enabledChannels.map(function (ch) {
      var m = CHANNEL_META[ch.platform];
      var b = ch.monthlyBudget || 0;
      var cpc = ch.cpc || 1;
      var ctr = ch.ctr || 0.02;
      var convRate = ch.conversionRate || 0;
      var aov = ch.avgOrderValue || 0;

      var clicks = safeDiv(b, cpc);
      var impressions = ctr > 0 ? clicks / ctr : 0;
      var conv = clicks * convRate;
      var rev = conv * aov;
      var roas = safeDiv(rev, b);
      var cac = safeDiv(b, conv);

      return {
        id: ch.id,
        platform: ch.platform,
        label: m ? m.label[lk] : ch.platform,
        badge: m ? m.badge : "gray",
        impressions: Math.round(impressions),
        clicks: Math.round(clicks),
        ctr: ctr,
        conversions: Math.round(conv),
        convRate: convRate,
        cac: cac,
        roas: roas,
      };
    }).sort(function (a, b) { return b.roas - a.roas; });
  }, [enabledChannels, lk]);

  var comparisonColumns = useMemo(function () {
    return [
      {
        id: "channel", header: mt.pg_col_channel,
        enableSorting: true, meta: { align: "left", minWidth: 140, grow: true },
        accessorFn: function (row) { return row.label; },
        cell: function (info) {
          var row = info.row.original;
          return <Badge color={row.badge} size="sm" dot>{row.label}</Badge>;
        },
      },
      {
        id: "impressions", header: mt.pg_col_impressions,
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return row.impressions; },
        cell: function (info) { return String(info.getValue()); },
      },
      {
        id: "clicks", header: mt.pg_col_clicks,
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return row.clicks; },
        cell: function (info) { return String(info.getValue()); },
      },
      {
        id: "ctr", header: mt.pg_col_ctr,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.ctr; },
        cell: function (info) { return pct(info.getValue()); },
      },
      {
        id: "conversions", header: mt.pg_col_conversions,
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return row.conversions; },
        cell: function (info) { return <span style={{ fontWeight: 600, color: "var(--brand)" }}>{String(info.getValue())}</span>; },
      },
      {
        id: "convRate", header: mt.pg_col_conv_rate_short,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.convRate; },
        cell: function (info) { return pct(info.getValue()); },
      },
      {
        id: "cac", header: mt.pg_col_cac,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.cac; },
        cell: function (info) {
          var v = info.getValue();
          return isFinite(v) && v > 0 ? eur(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "roas", header: mt.pg_col_roas,
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.roas; },
        cell: function (info) {
          var v = info.getValue();
          var color = v >= 3 ? "var(--color-success)" : v >= 1 ? "var(--color-warning)" : "var(--color-error)";
          return <span style={{ fontWeight: 700, color: color }}>{v > 0 ? v.toFixed(1) + "x" : "—"}</span>;
        },
      },
    ];
  }, [channelRows, lk, mt]);

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FunnelIcon size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{mt.pg_empty_conversions}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>{mt.pg_empty_conversions_hint}</div>
    </div>
  );

  return (
    <div>
      {/* KPI Cards */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={mt.pg_kpi_avg_cac} value={kpis.totalConversions > 0 ? eurShort(kpis.avgCac) : "—"} fullValue={kpis.totalConversions > 0 ? eur(kpis.avgCac) : undefined} glossaryKey="cac" />
        <KpiCard label={mt.pg_kpi_avg_roas} value={kpis.avgRoas > 0 ? kpis.avgRoas.toFixed(1) + "x" : "—"} glossaryKey="roas" />
        <KpiCard label={mt.pg_kpi_conversions_mo} value={String(Math.round(kpis.totalConversions))} />
        <KpiCard label={mt.pg_kpi_cost_per_conv} value={kpis.totalConversions > 0 ? eurShort(safeDiv(kpis.totalBudget, kpis.totalConversions)) : "—"} fullValue={kpis.totalConversions > 0 ? eur(safeDiv(kpis.totalBudget, kpis.totalConversions)) : undefined} />
      </div>

      {/* Funnel card */}
      <Card sx={{ padding: "var(--sp-4)", marginBottom: "var(--gap-md)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-4)" }}>
          {mt.pg_funnel_title}
        </div>
        {kpis.activeCount > 0 ? (
          <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {funnelSteps.map(function (step, i) {
              var prev = i > 0 ? funnelSteps[i - 1] : null;
              var dropOff = prev && prev.value > 0 && !prev.isCurrency && !step.isCurrency
                ? ((prev.value - step.value) / prev.value)
                : null;
              var widthPct = funnelSteps[0].value > 0 && !step.isCurrency
                ? Math.max(20, (step.value / funnelSteps[0].value) * 100)
                : 100;

              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {dropOff !== null ? (
                    <div style={{ position: "absolute", top: -18, left: -8, fontSize: 10, color: "var(--color-error)", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                      <ArrowDown size={10} />
                      {(dropOff * 100).toFixed(0) + "%"}
                    </div>
                  ) : null}
                  <div style={{
                    width: widthPct + "%", minHeight: 56,
                    background: i === 0 ? "var(--brand-bg)" : i === funnelSteps.length - 1 ? "var(--color-success-bg)" : "var(--bg-accordion)",
                    border: "1px solid " + (i === funnelSteps.length - 1 ? "var(--color-success-border)" : "var(--border-light)"),
                    borderRadius: "var(--r-md)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    padding: "var(--sp-2)",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {step.isCurrency ? eurShort(step.value) : String(step.value)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>{step.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-faint)", textAlign: "center", padding: "var(--sp-4)" }}>
            {mt.pg_empty_conversions_hint}
          </div>
        )}
      </Card>

      {/* Comparison DataTable */}
      <DataTable
        columns={comparisonColumns}
        data={channelRows}
        emptyState={emptyNode}
        emptyMinHeight={200}
        scrollable
        getRowId={function (row) { return row.id; }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────── */
export default function MarketingPage({ marketing, setMarketing, cfg, activeTab, setTab, isPaid, isEnabled, onOpenModuleSettings, costs, setCosts, streams, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var t = useT();
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var mt = t.marketing || {};
  var modulePaid = isPaid === true;
  var moduleEnabled = isEnabled === true;

  /* Derived state from marketing object */
  var mktChannels = marketing.channelData || [];
  var mktCampaigns = marketing.campaigns || [];

  /* Revenue from streams for Budget tab */
  var annualRevenue = useMemo(function () {
    return calcTotalRevenue(streams);
  }, [streams]);

  function handleWizardFinish(data) {
    var channelData = data.channels.map(function (platform) {
      var m = CHANNEL_META[platform];
      var share = data.channels.length > 0 ? Math.round(data.budget / data.channels.length) : 0;
      return {
        id: makeId("mch"), platform: platform, enabled: true,
        monthlyBudget: share,
        cpc: m ? m.defaultCpc : 1,
        ctr: m ? m.defaultCtr : 0.02,
        conversionRate: m ? m.defaultConvRate : 0.03,
        avgOrderValue: m ? m.defaultAov : 50,
      };
    });

    setMarketing(function (prev) {
      return Object.assign({}, prev, {
        showWizard: false,
        channels: data.channels,
        budget: data.budget,
        channelData: channelData,
        campaigns: [],
      });
    });
  }

  function setChannelsData(nextChannels) {
    setMarketing(function (prev) {
      return Object.assign({}, prev, { channelData: nextChannels });
    });
  }

  function setCampaignsData(nextCampaigns) {
    setMarketing(function (prev) {
      return Object.assign({}, prev, { campaigns: nextCampaigns });
    });
  }

  /* ── Auto-link marketing channels to operating costs ── */
  useEffect(function () {
    if (!moduleEnabled || !setCosts) return;

    var enabledChannels = (mktChannels || []).filter(function (ch) {
      return ch.enabled !== false && (ch.monthlyBudget || 0) > 0;
    });

    setCosts(function (prev) {
      var cats = (prev || []).map(function (cat) {
        var filtered = (cat.items || []).filter(function (c) {
          if (!c._linkedMarketing) return true;
          return enabledChannels.some(function (ch) { return ch.id === c._linkedMarketing; });
        });
        var updated = filtered.map(function (c) {
          if (!c._linkedMarketing) return c;
          var ch = null;
          enabledChannels.forEach(function (ec) { if (ec.id === c._linkedMarketing) ch = ec; });
          if (!ch) return c;
          var m = CHANNEL_META[ch.platform];
          var label = m ? m.label[lk] : ch.platform;
          var prefix = mt.pg_cost_prefix || "Pub —";
          return Object.assign({}, c, {
            l: prefix + " " + label,
            a: Math.round(ch.monthlyBudget * 100) / 100,
            freq: "monthly", pcmn: "6130",
            _readOnly: true, _linkedPage: "marketing",
          });
        });
        return Object.assign({}, cat, { items: updated });
      });

      enabledChannels.forEach(function (ch) {
        var found = false;
        cats.forEach(function (cat) {
          (cat.items || []).forEach(function (c) {
            if (c._linkedMarketing === ch.id) found = true;
          });
        });
        if (!found && cats.length > 0) {
          var m = CHANNEL_META[ch.platform];
          var label = m ? m.label[lk] : ch.platform;
          var prefix = mt.pg_cost_prefix || "Pub —";
          cats[0] = Object.assign({}, cats[0], {
            items: (cats[0].items || []).concat([{
              id: makeId("cost"),
              l: prefix + " " + label,
              a: Math.round(ch.monthlyBudget * 100) / 100,
              freq: "monthly", pcmn: "6130", pu: false, u: 1,
              _linkedMarketing: ch.id, _readOnly: true, _linkedPage: "marketing",
            }]),
          });
        }
      });

      return cats;
    });
  }, [mktChannels, moduleEnabled, lk]);

  /* ── Paywall ── */
  if (!modulePaid) {
    var features = [mt.pg_pw_feat_1, mt.pg_pw_feat_2, mt.pg_pw_feat_3, mt.pg_pw_feat_4, mt.pg_pw_feat_5, mt.pg_pw_feat_6];

    return (
      <PageLayout
        title={mt.pg_title}
        subtitle={mt.pg_subtitle}
        icon={Megaphone} iconColor="#3B82F6"
      >
        <ModulePaywall
          preview={<FakePreview lk={lk} />}
          moduleId="marketing"
          icon={Megaphone}
          title={mt.pg_pw_title}
          subtitle={mt.pg_pw_subtitle}
          features={features}
          ctaDisabled={true}
          ctaLabel={mt.pg_pw_cta}
          price={mt.pg_pw_price}
        />
      </PageLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <PageLayout
        title={mt.pg_title}
        subtitle={mt.pg_subtitle}
        icon={Megaphone} iconColor="#3B82F6"
      >
        <Card sx={{ padding: "var(--sp-6)", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <Megaphone size={56} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-3)" }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>
            {mt.pg_disabled_title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "var(--sp-5)" }}>
            {mt.pg_disabled_desc}
          </div>
          <Button color="primary" size="lg" onClick={onOpenModuleSettings}>
            {mt.pg_disabled_cta}
          </Button>
        </Card>
      </PageLayout>
    );
  }

  if (marketing.showWizard) {
    return (
      <PageLayout
        title={mt.pg_title}
        subtitle={mt.pg_wiz_subtitle}
        icon={Megaphone} iconColor="#3B82F6"
      >
        <MarketingWizard onFinish={handleWizardFinish} lang={lang} mt={mt} />
      </PageLayout>
    );
  }

  /* ── Active tab titles + subtitles ── */
  var titles = {
    marketing: mt.pg_title,
    mkt_channels: mt.pg_title_channels,
    mkt_campaigns: mt.pg_title_campaigns,
    mkt_budget: mt.pg_title_budget,
    mkt_conversions: mt.pg_title_conversions,
  };
  var subtitles = {
    marketing: mt.pg_subtitle,
    mkt_channels: mt.pg_subtitle_channels,
    mkt_campaigns: mt.pg_subtitle_campaigns,
    mkt_budget: mt.pg_subtitle_budget,
    mkt_conversions: mt.pg_subtitle_conversions,
  };

  var currentTab = activeTab || "marketing";

  return (
    <PageLayout
      title={titles[currentTab] || mt.pg_title}
      subtitle={subtitles[currentTab] || mt.pg_subtitle}
      icon={Megaphone} iconColor="#3B82F6"
    >
      {currentTab === "marketing" ? (
        <AcquisitionOverview
          channels={mktChannels} lk={lk} mt={mt} setTab={setTab}
          chartPalette={chartPalette} chartPaletteMode={chartPaletteMode}
          onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
        />
      ) : null}

      {currentTab === "mkt_channels" ? (
        <ChannelsTab
          channels={mktChannels} setChannelsData={setChannelsData} lk={lk} mt={mt}
          chartPalette={chartPalette} chartPaletteMode={chartPaletteMode}
          onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
        />
      ) : null}

      {currentTab === "mkt_campaigns" ? (
        <CampaignsTab
          campaigns={mktCampaigns} setCampaignsData={setCampaignsData}
          channels={mktChannels} lk={lk} mt={mt}
        />
      ) : null}

      {currentTab === "mkt_budget" ? (
        <BudgetTab
          channels={mktChannels} totalRevenue={annualRevenue} lk={lk} mt={mt}
          chartPalette={chartPalette} chartPaletteMode={chartPaletteMode}
          onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
        />
      ) : null}

      {currentTab === "mkt_conversions" ? (
        <ConversionsTab channels={mktChannels} lk={lk} mt={mt} />
      ) : null}
    </PageLayout>
  );
}
