/**
 * PerformanceMonitorPage — Dev-only runtime telemetry dashboard.
 *
 * Auto-discovers pages from import.meta.glob, groups by module folder,
 * and displays React Profiler metrics collected by PagePerfContext.
 */
import { useState, useMemo, useEffect } from "react";
import {
  Lightning, Trash, ArrowClockwise, Timer, Pulse, Eye, CheckCircle,
  WarningCircle, CircleNotch, MinusCircle, Gauge,
} from "@phosphor-icons/react";
import { PageLayout, Card, KpiCard, Badge, DataTable, Button, ButtonUtility } from "../../components";
import { usePagePerf } from "../../context";
import { VALID_TABS } from "../../constants/config";

/* ── Auto-discover pages from file system via Vite glob ── */
var rootPages = import.meta.glob("/src/pages/*.jsx", { eager: false });
var subPages = import.meta.glob("/src/pages/*/*.jsx", { eager: false });
var allGlob = Object.assign({}, rootPages, subPages);

/* Parse glob keys into structured page entries: { module, file, tab } */
var PAGE_REGISTRY = (function () {
  var registry = [];
  var keys = Object.keys(allGlob);

  keys.forEach(function (key) {
    /* key format: /src/pages/finance/RevenueStreamsPage.jsx or /src/pages/OverviewPage.jsx */
    var rel = key.replace("/src/pages/", "").replace(".jsx", "");
    var parts = rel.split("/");
    if (parts.length === 1) {
      registry.push({ module: "core", file: parts[0], path: key });
    } else if (parts.length === 2) {
      registry.push({ module: parts[0], file: parts[1], path: key });
    }
  });

  /* Filter out test files, helpers, index files — keep only *Page files */
  return registry.filter(function (entry) {
    return entry.file.indexOf("test") < 0
      && entry.file !== "index"
      && entry.file !== "helpers"
      && entry.file.indexOf("Page") >= 0;
  });
})();

/* Module metadata: label, color, icon */
var MODULE_META = {
  core:      { label: "Core",        badge: "brand" },
  finance:   { label: "Finance",     badge: "success" },
  company:   { label: "Entreprise",  badge: "info" },
  marketing: { label: "Marketing",   badge: "warning" },
  analysis:  { label: "Analyse",     badge: "brand" },
  tools:     { label: "Outils",      badge: "gray" },
  meta:      { label: "Système",     badge: "gray" },
  overview:  { label: "Overview",    badge: "brand" },
};

/* Map file names to approximate tab IDs */
var FILE_TO_TAB = {
  OverviewPage: "overview",
  RevenueStreamsPage: "streams",
  OperatingCostsPage: "opex",
  IncomeStatementPage: "income_statement",
  BalanceSheetPage: "balance_sheet",
  CashFlowPage: "cashflow",
  AccountingPage: "accounting",
  RatiosPage: "ratios",
  EquityPage: "equity",
  CapTablePage: "captable",
  PactPage: "pact",
  DebtPage: "debt",
  CrowdfundingPage: "crowdfunding",
  SalaryPage: "salaries",
  AmortissementPage: "equipment",
  StocksPage: "stocks",
  ProductionPage: "production",
  ProfilePage: "profile",
  MarketingPage: "marketing",
  SensitivityPage: "sensitivity",
  AffiliationPage: "affiliation",
  ToolsPage: "tool_qr",
  SettingsPage: "set",
  ChangelogPage: "changelog",
  CreditsPage: "credits",
  SharedLinkPage: "overview",
  RoadmapPage: "dev-roadmap",
  SitemapPage: "dev-sitemap",
  DebugCalculationsPage: "dev-calc",
  DesignTokensPage: "dev-tokens",
  TooltipRegistryPage: "dev-tooltips",
  PerformanceMonitorPage: "dev-perf",
  FinancialPlanPage: null,
};

/* Performance tier badges */
function perfTier(ms) {
  if (ms == null || ms <= 0) return { label: "—", badge: "gray" };
  if (ms < 8) return { label: "S", badge: "tier-s" };
  if (ms < 16) return { label: "A", badge: "tier-a" };
  if (ms < 33) return { label: "B", badge: "tier-b" };
  if (ms < 50) return { label: "C", badge: "tier-c" };
  return { label: "D", badge: "tier-d" };
}

function mountTier(ms) {
  if (ms == null || ms <= 0) return { label: "—", badge: "gray" };
  if (ms < 50) return { label: "S", badge: "tier-s" };
  if (ms < 100) return { label: "A", badge: "tier-a" };
  if (ms < 200) return { label: "B", badge: "tier-b" };
  if (ms < 500) return { label: "C", badge: "tier-c" };
  return { label: "D", badge: "tier-d" };
}

function statusIcon(status) {
  if (status === "mounted") return <CheckCircle size={14} weight="fill" color="var(--color-success)" />;
  if (status === "loading") return <CircleNotch size={14} weight="bold" color="var(--color-warning)" style={{ animation: "spin 1s linear infinite" }} />;
  if (status === "error") return <WarningCircle size={14} weight="fill" color="var(--color-error)" />;
  return <MinusCircle size={14} color="var(--text-faint)" />;
}

function statusLabel(status) {
  if (status === "mounted") return "Mounted";
  if (status === "loading") return "Loading";
  if (status === "error") return "Error";
  return "Idle";
}

function fmtMs(ms) {
  if (ms == null || ms <= 0) return "—";
  if (ms < 1) return "<1 ms";
  return ms.toFixed(1) + " ms";
}

function timeSince(ts) {
  if (!ts) return "—";
  var diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60000) return Math.floor(diff / 1000) + "s ago";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  return Math.floor(diff / 3600000) + "h ago";
}

export default function PerformanceMonitorPage() {
  var { getMetrics, clearMetrics } = usePagePerf();
  var [moduleFilter, setModuleFilter] = useState("all");
  var [tick, setTick] = useState(0);

  /* Poll metrics every 2s to avoid render loops */
  useEffect(function () {
    var id = setInterval(function () { setTick(function (t) { return t + 1; }); }, 2000);
    return function () { clearInterval(id); };
  }, []);
  var metrics = getMetrics();

  /* Build flat rows with metrics */
  var rows = useMemo(function () {
    return PAGE_REGISTRY.map(function (entry) {
      var tab = FILE_TO_TAB[entry.file] || null;
      var m = tab ? (metrics[tab] || {}) : {};
      return {
        id: entry.module + "/" + entry.file,
        module: entry.module,
        file: entry.file,
        tab: tab,
        inValidTabs: tab ? VALID_TABS.indexOf(tab) >= 0 : false,
        status: m.status || "idle",
        mountTime: m.mountTime || 0,
        renderTime: m.renderTime || 0,
        baseDuration: m.baseDuration || 0,
        renderCount: m.renderCount || 0,
        lastVisit: m.lastVisit || 0,
      };
    });
  }, [metrics, tick]);

  /* Module list for filter */
  var modules = useMemo(function () {
    var seen = {};
    PAGE_REGISTRY.forEach(function (e) { seen[e.module] = true; });
    return Object.keys(seen).sort();
  }, []);

  var filtered = useMemo(function () {
    if (moduleFilter === "all") return rows;
    return rows.filter(function (r) { return r.module === moduleFilter; });
  }, [rows, moduleFilter]);

  /* KPIs */
  var kpis = useMemo(function () {
    var visited = 0;
    var totalRender = 0;
    var totalMount = 0;
    var slowest = null;
    var fastest = null;
    rows.forEach(function (r) {
      if (r.status === "mounted") {
        visited++;
        totalRender += r.renderTime;
        totalMount += r.mountTime;
        if (!slowest || r.mountTime > slowest.mountTime) slowest = r;
        if (!fastest || (r.mountTime > 0 && r.mountTime < fastest.mountTime)) fastest = r;
      }
    });
    return {
      totalPages: PAGE_REGISTRY.length,
      visitedPages: visited,
      avgRender: visited > 0 ? totalRender / visited : 0,
      avgMount: visited > 0 ? totalMount / visited : 0,
      slowest: slowest,
      fastest: fastest,
    };
  }, [rows]);

  var columns = useMemo(function () {
    return [
      {
        id: "status", header: "",
        enableSorting: true, meta: { align: "center", width: 36 },
        accessorFn: function (row) { return row.status; },
        cell: function (info) { return statusIcon(info.getValue()); },
      },
      {
        id: "module", header: "Module",
        enableSorting: true, meta: { align: "left" },
        accessorFn: function (row) { return row.module; },
        cell: function (info) {
          var mod = MODULE_META[info.getValue()] || { label: info.getValue(), badge: "gray" };
          return <Badge color={mod.badge} size="sm">{mod.label}</Badge>;
        },
      },
      {
        id: "page", header: "Page",
        enableSorting: true, meta: { align: "left", minWidth: 180, grow: true },
        accessorFn: function (row) { return row.file; },
        cell: function (info) {
          var row = info.row.original;
          return (
            <div>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{info.getValue().replace("Page", "")}</span>
              {row.tab ? (
                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-faint)", fontFamily: "ui-monospace, monospace" }}>#{row.tab}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "mountTime", header: "Mount",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.mountTime; },
        cell: function (info) {
          var v = info.getValue();
          var tier = mountTier(v);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtMs(v)}</span>
              <Badge color={tier.badge} size="sm">{tier.label}</Badge>
            </div>
          );
        },
      },
      {
        id: "renderTime", header: "Render",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.renderTime; },
        cell: function (info) {
          var v = info.getValue();
          var tier = perfTier(v);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtMs(v)}</span>
              <Badge color={tier.badge} size="sm">{tier.label}</Badge>
            </div>
          );
        },
      },
      {
        id: "renderCount", header: "Renders",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.renderCount; },
        cell: function (info) {
          var v = info.getValue();
          return <span style={{ fontVariantNumeric: "tabular-nums", color: v > 10 ? "var(--color-warning)" : "var(--text-secondary)" }}>{v || "—"}</span>;
        },
      },
      {
        id: "lastVisit", header: "Last visit",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.lastVisit; },
        cell: function (info) {
          return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeSince(info.getValue())}</span>;
        },
      },
      {
        id: "registered", header: "Route",
        enableSorting: true, meta: { align: "center", width: 60 },
        accessorFn: function (row) { return row.inValidTabs; },
        cell: function (info) {
          var ok = info.getValue();
          return ok
            ? <CheckCircle size={14} weight="fill" color="var(--color-success)" />
            : <WarningCircle size={14} weight="fill" color="var(--text-faint)" />;
        },
      },
    ];
  }, []);

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button type="button" onClick={function () { setModuleFilter("all"); }}
            style={{
              padding: "4px 10px", fontSize: 12, fontWeight: moduleFilter === "all" ? 700 : 400,
              border: "1px solid " + (moduleFilter === "all" ? "var(--brand)" : "var(--border)"),
              borderRadius: "var(--r-sm)", cursor: "pointer", fontFamily: "inherit",
              background: moduleFilter === "all" ? "var(--brand-bg)" : "transparent",
              color: moduleFilter === "all" ? "var(--brand)" : "var(--text-muted)",
            }}>
            All ({PAGE_REGISTRY.length})
          </button>
          {modules.map(function (mod) {
            var isActive = moduleFilter === mod;
            var count = PAGE_REGISTRY.filter(function (e) { return e.module === mod; }).length;
            var meta = MODULE_META[mod] || { label: mod };
            return (
              <button key={mod} type="button" onClick={function () { setModuleFilter(mod); }}
                style={{
                  padding: "4px 10px", fontSize: 12, fontWeight: isActive ? 700 : 400,
                  border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                  borderRadius: "var(--r-sm)", cursor: "pointer", fontFamily: "inherit",
                  background: isActive ? "var(--brand-bg)" : "transparent",
                  color: isActive ? "var(--brand)" : "var(--text-muted)",
                }}>
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        <ButtonUtility icon={<Trash size={16} />} title="Clear metrics" onClick={clearMetrics} variant="danger" />
      </div>
    </>
  );

  return (
    <PageLayout
      title="Performance Monitor"
      subtitle={"Runtime telemetry — " + PAGE_REGISTRY.length + " pages discovered across " + modules.length + " modules"}
      icon={Gauge}
      iconColor="var(--color-dev)"
    >
      {/* KPIs */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard
          label="Pages discovered"
          value={String(kpis.totalPages)}
          sub={kpis.visitedPages + " visited"}
        />
        <KpiCard
          label="Avg mount time"
          value={fmtMs(kpis.avgMount)}
          sub={kpis.slowest ? "Slowest: " + kpis.slowest.file.replace("Page", "") : "—"}
        />
        <KpiCard
          label="Avg render time"
          value={fmtMs(kpis.avgRender)}
          sub={kpis.fastest ? "Fastest: " + kpis.fastest.file.replace("Page", "") : "—"}
        />
        <KpiCard
          label="Modules"
          value={String(modules.length)}
          sub={modules.join(", ")}
        />
      </div>

      {/* Tier legend */}
      <Card sx={{ padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--gap-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>Tiers:</span>
          <span><Badge color="tier-s" size="sm">S</Badge> &lt;8ms render / &lt;50ms mount</span>
          <span><Badge color="tier-a" size="sm">A</Badge> &lt;16ms / &lt;100ms</span>
          <span><Badge color="tier-b" size="sm">B</Badge> &lt;33ms / &lt;200ms</span>
          <span><Badge color="tier-c" size="sm">C</Badge> &lt;50ms / &lt;500ms</span>
          <span><Badge color="tier-d" size="sm">D</Badge> &gt;50ms / &gt;500ms</span>
        </div>
      </Card>

      {/* DataTable */}
      <DataTable
        data={filtered}
        columns={columns}
        toolbar={toolbarNode}
        pageSize={50}
        getRowId={function (row) { return row.id; }}
        scrollable
        dimRow={function (row) { return row.status === "idle"; }}
      />
    </PageLayout>
  );
}
