import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { NotePencil, Printer, CaretDown, CaretUp, TrendUp, Users, CurrencyEur, ChartBar } from "@phosphor-icons/react";
import { Card, PageLayout, Button } from "../../components";
import { eur, salCalc } from "../../utils";
import { useT, useLang, useTheme } from "../../context";

// ── Lightweight markdown → HTML for print ────────────────────────────────────

function mdToHtml(md) {
  if (!md) return "";
  var html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, function (m) { return "<ul>" + m + "</ul>"; })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Wrap remaining loose lines in <p>
  html = html.replace(/^(?!<[hulo]|<li|<\/[uo])(.+)$/gm, "<p>$1</p>");
  return html;
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function DataCard({ icon, label, value, color }) {
  var Icon = icon;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-3)",
      padding: "var(--sp-3) var(--sp-4)",
      background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
      border: "1px solid var(--border-light)",
    }}>
      <Icon size={18} weight="duotone" color={color || "var(--brand)"} />
      <div>
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}

function SectionEditor({ number, title, description, value, onChange, expanded, onToggle, dark }) {
  var hasContent = value && value.trim().length > 0;
  var preview = "";
  if (!expanded && hasContent) {
    preview = value.trim().replace(/[#*_~`>\-\[\]()!]/g, "").slice(0, 120);
    if (value.trim().length > 120) preview += "…";
  }

  return (
    <Card sx={{ overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          width: "100%", padding: 0, border: "none", background: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          fontSize: 10, fontWeight: 800, color: "var(--color-on-brand)",
          background: hasContent ? "var(--brand)" : "var(--border-strong)",
          minWidth: 26, height: 26, borderRadius: "var(--r-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          letterSpacing: "0.04em", flexShrink: 0, padding: "0 var(--sp-2)",
        }}>{number}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
          {!expanded && description && !hasContent ? (
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{description}</div>
          ) : null}
          {preview ? (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
          ) : null}
        </div>
        {expanded ? <CaretUp size={16} color="var(--text-muted)" /> : <CaretDown size={16} color="var(--text-muted)" />}
      </button>
      {expanded ? (
        <div style={{ marginTop: "var(--sp-4)" }} data-color-mode={dark ? "dark" : "light"}>
          <MDEditor
            value={value}
            onChange={function (v) { onChange(v || ""); }}
            height={240}
            preview="edit"
            visibleDragbar={false}
            style={{
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border)",
              background: "var(--bg-page)",
            }}
          />
        </div>
      ) : null}
    </Card>
  );
}

// ── Section definitions ─────────────────────────────────────────────────────

var SECTIONS = [
  { id: "summary", n: "01" },
  { id: "problem", n: "02" },
  { id: "solution", n: "03" },
  { id: "market", n: "04" },
  { id: "business_model", n: "05" },
  { id: "financials", n: "06" },
  { id: "team", n: "07" },
  { id: "roadmap", n: "08" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function FinancialPlanPage({
  totalRevenue, monthlyCosts, opCosts, salCosts,
  ebit, netP, sals, cfg,
  planSections, setPlanSections,
}) {
  var t = useT().plan;
  var { lang } = useLang();
  var { dark } = useTheme();
  var [expandedSections, setExpandedSections] = useState({});
  var [started, setStarted] = useState(false);

  var allEmpty = planSections.every(function (s) { return !s.content || s.content.trim() === ""; });

  function updateSection(id, content) {
    setPlanSections(function (prev) {
      return prev.map(function (s) {
        if (s.id === id) return { id: s.id, content: content };
        return s;
      });
    });
  }

  function toggleSection(id) {
    setExpandedSections(function (prev) {
      var n = {};
      Object.keys(prev).forEach(function (k) { n[k] = prev[k]; });
      n[id] = !n[id];
      return n;
    });
  }

  function handleStartWriting() {
    setStarted(true);
    setExpandedSections({ summary: true });
  }

  function expandAll() {
    var ex = {};
    SECTIONS.forEach(function (s) { ex[s.id] = true; });
    setExpandedSections(ex);
  }

  function collapseAll() {
    setExpandedSections({});
  }

  // ── Computed KPIs ──
  var headcount = (sals || []).filter(function (s) { return s.net > 0; }).length;
  var mrrDisplay = totalRevenue / 12;

  // ── Data cards per section ──
  function getDataCards(sectionId) {
    if (sectionId === "business_model") {
      return [
        { icon: CurrencyEur, label: t.data_revenue, value: eur(totalRevenue) },
        { icon: TrendUp, label: t.data_mrr, value: eur(mrrDisplay) },
      ];
    }
    if (sectionId === "financials") {
      return [
        { icon: CurrencyEur, label: t.data_revenue, value: eur(totalRevenue) },
        { icon: ChartBar, label: t.data_costs, value: eur(monthlyCosts * 12) },
        { icon: TrendUp, label: "EBITDA", value: eur(ebit), color: ebit >= 0 ? "var(--color-success)" : "var(--color-error)" },
        { icon: TrendUp, label: t.data_net, value: eur(netP), color: netP >= 0 ? "var(--color-success)" : "var(--color-error)" },
      ];
    }
    if (sectionId === "team") {
      return [
        { icon: Users, label: t.data_headcount, value: String(headcount) },
        { icon: CurrencyEur, label: t.data_payroll, value: eur(salCosts * 12) },
      ];
    }
    return null;
  }

  // ── Empty state ──
  if (allEmpty && !started) {
    return (
      <PageLayout title={t.title} subtitle={t.subtitle_new}>
        <Card>
          <div style={{ textAlign: "center", padding: "var(--sp-8) var(--sp-4)" }}>
            <NotePencil size={48} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-3)" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>
              {t.empty_title}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-5)", maxWidth: 520, margin: "0 auto var(--sp-5)" }}>
              {t.empty_desc}
            </div>
            <Button
              color="primary"
              size="lg"
              onClick={handleStartWriting}
              iconLeading={<NotePencil size={16} />}
            >
              {t.empty_cta}
            </Button>
          </div>
        </Card>
      </PageLayout>
    );
  }

  // ── Print handler ──
  function handlePrint() {
    var companyName = (cfg && cfg.companyName) || "Forecrest";
    var date = new Date().toLocaleDateString(lang === "fr" ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

    var body = "";
    SECTIONS.forEach(function (sec) {
      var sectionData = planSections.find(function (s) { return s.id === sec.id; });
      var val = sectionData ? sectionData.content : "";
      if (!val || !val.trim()) return;

      body += '<div class="section">';
      body += '<div class="sec-head"><span class="sec-num">' + sec.n + '</span><span class="sec-title">' + (t["sec_" + sec.id] || sec.id) + '</span></div>';
      body += '<div class="sec-body">' + mdToHtml(val) + '</div>';
      body += '</div>';

      var cards = getDataCards(sec.id);
      if (cards) {
        body += '<div class="data-strip">';
        cards.forEach(function (dc) {
          body += '<div class="data-card"><span class="dc-label">' + dc.label + '</span><span class="dc-value">' + dc.value + '</span></div>';
        });
        body += '</div>';
      }
    });

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + companyName + ' - ' + t.title + '</title>' +
      '<style>' +
      'body{font-family:"DM Sans",Inter,system-ui,sans-serif;max-width:700px;margin:40px auto;color:#1a1a19;line-height:1.6;padding:0 24px;}' +
      'h1{font-family:"Bricolage Grotesque","DM Sans",sans-serif;font-size:24px;font-weight:800;margin:0 0 4px;}' +
      '.subtitle{font-size:13px;color:#888;margin-bottom:32px;}' +
      '.section{margin-bottom:28px;page-break-inside:avoid;}' +
      '.sec-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}' +
      '.sec-num{font-size:10px;font-weight:800;color:#fff;background:#E8431A;min-width:24px;height:24px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;}' +
      '.sec-title{font-size:18px;font-weight:700;}' +
      '.sec-body{font-size:13px;color:#333;}' +
      '.sec-body h2{font-size:16px;font-weight:700;margin:12px 0 4px;}' +
      '.sec-body h3{font-size:14px;font-weight:700;margin:10px 0 4px;}' +
      '.sec-body h4{font-size:13px;font-weight:700;margin:8px 0 4px;}' +
      '.sec-body p{margin:0 0 8px;}' +
      '.sec-body ul{margin:0 0 8px;padding-left:20px;}' +
      '.sec-body li{margin-bottom:3px;}' +
      '.sec-body code{background:#f0ede7;padding:1px 4px;border-radius:3px;font-size:12px;}' +
      '.data-strip{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;}' +
      '.data-card{background:#f5f2ec;border:1px solid #e0dbd2;border-radius:6px;padding:8px 14px;flex:1;min-width:120px;}' +
      '.dc-label{display:block;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.04em;}' +
      '.dc-value{display:block;font-size:15px;font-weight:700;color:#1a1a19;}' +
      '@media print{body{margin:0;padding:20px;}}' +
      '</style></head><body>' +
      '<h1>' + companyName + '</h1>' +
      '<div class="subtitle">' + t.title + ' - ' + date + '</div>' +
      body +
      '</body></html>';

    var w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(function () { w.print(); }, 300);
    }
  }

  // ── Actions bar ──
  var anyExpanded = SECTIONS.some(function (s) { return expandedSections[s.id]; });

  var actionsNode = (
    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
      <Button color="tertiary" size="sm" onClick={function () { if (anyExpanded) collapseAll(); else expandAll(); }} iconLeading={anyExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}>
        {anyExpanded ? t.collapse_all : t.expand_all}
      </Button>
      <Button color="primary" size="md" onClick={handlePrint} iconLeading={<Printer size={15} />}>
        {t.print}
      </Button>
    </div>
  );

  // ── Render sections with intercalated data cards ──
  var content = [];
  SECTIONS.forEach(function (sec) {
    var sectionData = planSections.find(function (s) { return s.id === sec.id; });
    var val = sectionData ? sectionData.content : "";

    content.push(
      <SectionEditor
        key={sec.id}
        number={sec.n}
        title={t["sec_" + sec.id]}
        description={t["sec_" + sec.id + "_desc"]}
        value={val}
        onChange={function (v) { updateSection(sec.id, v); }}
        expanded={!!expandedSections[sec.id]}
        onToggle={function () { toggleSection(sec.id); }}
        dark={dark}
      />
    );

    var cards = getDataCards(sec.id);
    if (cards) {
      content.push(
        <div key={sec.id + "_data"} style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--sp-3)",
        }}>
          {cards.map(function (dc, i) {
            return <DataCard key={i} icon={dc.icon} label={dc.label} value={dc.value} color={dc.color} />;
          })}
        </div>
      );
    }
  });

  return (
    <PageLayout title={t.title} subtitle={t.subtitle_new} actions={actionsNode}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        {content}
      </div>
    </PageLayout>
  );
}
