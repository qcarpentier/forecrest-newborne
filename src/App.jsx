import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useHotkeys } from "react-hotkeys-hook";
import { useT, useLang, useDevMode, useGlossary, useNotifications, useAuth, usePresence } from "./context";
import { PresenceProvider } from "./context/PresenceContext";
import { LockProvider } from "./context/LockContext";
import { openInvestorReport } from "./utils/printReport";

import { DEFAULT_CONFIG, STORAGE_KEY, VERSION, VALID_TABS } from "./constants/config";
import { ACCENT_PALETTE, getChartPalette } from "./constants/colors";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF, REVENUE_DEF, DEBT_DEF, PLAN_SECTIONS_DEF, applyCostPreset } from "./constants/defaults";
import { Banner, PageTransition, DevBanner, NavigationToast } from "./components";
import { PagePerfProvider, PagePerfProfiler } from "./context";
import GlossaryDrawer, { GlossaryFab } from "./components/GlossaryDrawer";
import AccountantBar from "./components/AccountantBar";
import Sidebar from "./components/Sidebar";
import useHistory from "./hooks/useHistory";

import { costItemMonthly, salCalc, calcIsoc, grantCalc, calcBusinessKpis, calcTotalRevenue, calcAffiliationMonthly, calcActualRaised, calcStreamAnnual, migrateStreamsV1ToV2, load, save, setCurrencyDisplay, calcVatCollected, calcVatDeductible, makeId } from "./utils";
import { scheduleSave, loadWithConflictCheck } from "./utils/syncEngine";
import { setAdapter, SupabaseAdapter } from "./utils/storageAdapter";
import { isConfigured as isSupabaseConfigured, isAdminEnabled, getStorageMode, getSupabase } from "./lib/supabase";

/* ── Retry dynamic import on chunk load failure (stale cache after deploy) ── */
function lazyRetry(importFn) {
  return lazy(function () {
    return importFn().catch(function () {
      /* Chunk not found — force reload once */
      var reloaded = sessionStorage.getItem("fc_chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("fc_chunk_reload", "1");
        window.location.reload();
        return new Promise(function () {}); /* never resolves, page reloads */
      }
      sessionStorage.removeItem("fc_chunk_reload");
      return importFn(); /* second attempt after reload */
    });
  });
}

var AuthPage = lazyRetry(function () { return import("./components/AuthPage"); });
var AccountSetupPage = lazyRetry(function () { return import("./components/AccountSetupPage"); });
var RemovedPage = lazyRetry(function () { return import("./components/RemovedPage"); });
var OnboardingPage = lazyRetry(function () { return import("./components/OnboardingPage"); });
var AdminLayout = lazyRetry(function () { return import("./components/AdminLayout"); });
var AdminPage = lazyRetry(function () { return import("./pages/meta/AdminPage"); });
var OnboardingWizard = lazyRetry(function () { return import("./components/OnboardingWizard"); });
var ExportImportModal = lazyRetry(function () { return import("./components/ExportImportModal"); });
var PresentationMode = lazyRetry(function () { return import("./components/PresentationMode"); });
var CommandPalette = lazyRetry(function () { return import("./components/KeyboardShortcuts"); });
var DevCommandPalette = lazyRetry(function () { return import("./components/DevCommandPalette"); });
var FloatingToolbar = lazyRetry(function () { return import("./components/FloatingToolbar"); });
var ChordPalette = lazyRetry(function () { return import("./components/ChordPalette"); });
var SpacingInspector = lazyRetry(function () { return import("./components/SpacingInspector"); });
var CollabBar = lazyRetry(function () { return import("./components/CollabBar"); });
var ShareModal = lazyRetry(function () { return import("./components/ShareModal"); });
var JoinPage = lazyRetry(function () { return import("./components/JoinPage"); });

/* ── Page imports (lazy, grouped by module) ── */
var OverviewPage = lazyRetry(function () { return import("./pages/OverviewPage"); });
var OverviewOnboarding = lazyRetry(function () { return import("./pages/overview/OverviewOnboarding"); });
/* Finance */
var RevenueStreamsPage = lazyRetry(function () { return import("./pages/finance/RevenueStreamsPage"); });
var OperatingCostsPage = lazyRetry(function () { return import("./pages/finance/OperatingCostsPage"); });
var IncomeStatementPage = lazyRetry(function () { return import("./pages/finance/IncomeStatementPage"); });
var BalanceSheetPage = lazyRetry(function () { return import("./pages/finance/BalanceSheetPage"); });
var CashFlowPage = lazyRetry(function () { return import("./pages/finance/CashFlowPage"); });
var AccountingPage = lazyRetry(function () { return import("./pages/finance/AccountingPage"); });
var RatiosPage = lazyRetry(function () { return import("./pages/finance/RatiosPage"); });
var EquityPage = lazyRetry(function () { return import("./pages/finance/EquityPage"); });
var CapTablePage = lazyRetry(function () { return import("./pages/finance/CapTablePage"); });
var PactPage = lazyRetry(function () { return import("./pages/finance/PactPage"); });
var DebtPage = lazyRetry(function () { return import("./pages/finance/DebtPage"); });
var CrowdfundingPage = lazyRetry(function () { return import("./pages/finance/CrowdfundingPage"); });
/* Company */
var SalaryPage = lazyRetry(function () { return import("./pages/company/SalaryPage"); });
var AmortissementPage = lazyRetry(function () { return import("./pages/company/AmortissementPage"); });
var StocksPage = lazyRetry(function () { return import("./pages/company/StocksPage"); });
var ProductionPage = lazyRetry(function () { return import("./pages/company/ProductionPage"); });
var ProfilePage = lazyRetry(function () { return import("./pages/company/ProfilePage"); });
/* Marketing */
var MarketingPage = lazyRetry(function () { return import("./pages/marketing/MarketingPage"); });
/* Analysis */
var SensitivityPage = lazyRetry(function () { return import("./pages/analysis/SensitivityPage"); });
var AffiliationPage = lazyRetry(function () { return import("./pages/analysis/AffiliationPage"); });
/* Tools */
var ToolsPage = lazyRetry(function () { return import("./pages/tools/ToolsPage"); });
/* Meta */
var SettingsPage = lazyRetry(function () { return import("./pages/meta/SettingsPage"); });
var ChangelogPage = lazyRetry(function () { return import("./pages/meta/ChangelogPage"); });
var CreditsPage = lazyRetry(function () { return import("./pages/meta/CreditsPage"); });
var SharedLinkPage = lazyRetry(function () { return import("./pages/meta/SharedLinkPage"); });
var TooltipRegistryPage = lazyRetry(function () { return import("./pages/meta/TooltipRegistryPage"); });
var DebugCalculationsPage = lazyRetry(function () { return import("./pages/meta/DebugCalculationsPage"); });
var DesignTokensPage = lazyRetry(function () { return import("./pages/meta/DesignTokensPage"); });
var RoadmapPage = lazyRetry(function () { return import("./pages/meta/RoadmapPage"); });
var SitemapPage = lazyRetry(function () { return import("./pages/meta/SitemapPage"); });
var ProfileSetupPage = lazyRetry(function () { return import("./components/ProfileSetupPage"); });
var PerformanceMonitorPage = lazyRetry(function () { return import("./pages/meta/PerformanceMonitorPage"); });

function migrateStreams(streams) {
  try {
    if (!streams || !streams.length) return JSON.parse(JSON.stringify(REVENUE_DEF));
    // Legacy flat format: [{id, name, y1}]
    if (streams[0].id && streams[0].name && !streams[0].items) {
      return [{
        cat: "Revenus principaux",
        items: streams.map(function (s) {
          var monthly = Math.round((s.y1 || 0) / 12 * 100) / 100;
          return { id: s.id, l: s.name, behavior: "recurring", price: monthly, qty: monthly > 0 ? 1 : 0, growthRate: 0 };
        }),
      }];
    }
    // V1 hierarchical (y1-based) -> V2 (behavior-based)
    return migrateStreamsV1ToV2(streams);
  } catch (e) {
    console.warn("Stream migration failed, resetting to defaults", e);
    return JSON.parse(JSON.stringify(REVENUE_DEF));
  }
}

function migrateCosts(costs) {
  if (!costs || !costs.length) return costs;
  var idx = 0;
  return costs.map(function (cat) {
    return {
      cat: cat.cat,
      items: (cat.items || []).map(function (item) {
        idx++;
        return Object.assign({}, item, {
          id: item.id || ("cm" + idx),
          freq: item.freq || "monthly",
          type: item.type || "exploitation",
        });
      }),
    };
  });
}

/* ChordIndicator moved to components/ChordPalette.jsx */

function AppLoader({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <span style={{ color: "var(--text-faint)", fontSize: 14 }}>{label}</span>
    </div>
  );
}

function normalizeMarketingState(marketing) {
  var next = Object.assign({}, marketing || {});
  if (next.paid === undefined && next.enabled) next.paid = true;
  if (!next.paid && next.enabled) next.enabled = false;
  return next;
}

export default function App() {
  var t = useT();
  var { lang } = useLang();
  var { devMode, toggle: toggleDevMode } = useDevMode();
  var { setFinancials: setGlossaryFinancials, registerSetTab: registerGlossarySetTab, setCurrentTab: setGlossaryCurrentTab } = useGlossary();
  var { clearDot } = useNotifications();
  var [devBannerVisible, setDevBannerVisible] = useState(devMode);
  var MARKETING_TABS = ["marketing", "mkt_campaigns", "mkt_channels", "mkt_budget", "mkt_conversions"];
  var TOOLS_TABS = ["tool_qr", "tool_domain", "tool_trademark", "tool_employee", "tool_freelance", "tool_costing", "tool_currency", "tool_vat"];

  /* ── URL routing: /{slug}/{tab} with pushState ── */
  function slugify(str) {
    return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dashboard";
  }

  function getTabFromPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    /* Last segment = tab, or check hash fallback for old URLs */
    var candidate = parts.length >= 2 ? parts[parts.length - 1] : parts.length === 1 ? parts[0] : "";
    if (VALID_TABS.indexOf(candidate) >= 0) return candidate;
    /* Legacy hash fallback: /#/overview → /dashboard/overview */
    var h = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    if (VALID_TABS.indexOf(h) >= 0) return h;
    return "overview";
  }

  var [tab, setTabRaw] = useState(getTabFromPath);
  var [settingsSection, setSettingsSection] = useState(null);
  var [adminSection, setAdminSection] = useState("overview");
  var [navToast, setNavToast] = useState(null);
  function setTab(id, opts) {
    var nextId = id;
    if (MARKETING_TABS.indexOf(id) >= 0) {
      if (!marketingPaid) nextId = "marketing";
      else if (!marketingEnabled && id !== "marketing") nextId = "marketing";
    }
    setTabRaw(nextId);
    clearDot(nextId);
    var slug = slugify(cfg && cfg.companyName);
    window.history.pushState(null, "", "/" + slug + "/" + nextId);
    if (opts && opts.section) { setSettingsSection(opts.section); } else { setSettingsSection(null); }
  }
  function navigateWithToast(targetTab) {
    var fromTab = tab;
    setTab(targetTab);
    setNavToast({ from: fromTab, key: Date.now() });
  }
  useEffect(function () { window.scrollTo(0, 0); }, [tab]);

  /* ── Detect /join?token=... URL for invitation flow ── */
  useEffect(function () {
    var path = window.location.pathname;
    if (path === "/join" || path === "/join/") {
      var params = new URLSearchParams(window.location.search);
      var tkn = params.get("token");
      if (tkn) setJoinFlow({ token: tkn });
    }
  }, []);


  /* Set initial URL if on root */
  useEffect(function () {
    if (ready && cfg && (window.location.pathname === "/" || window.location.pathname === "")) {
      var slug = slugify(cfg.companyName);
      window.history.replaceState(null, "", "/" + slug + "/" + tab);
    }
  }, [ready, cfg && cfg.companyName]);

  /* Global animation toggle — applies .no-transition to <html> */
  useEffect(function () {
    if (!cfg) return;
    if (cfg.animationsEnabled === false) {
      document.documentElement.classList.add("no-transition");
    } else {
      document.documentElement.classList.remove("no-transition");
    }
  }, [cfg && cfg.animationsEnabled]);
  var _showPageIcons = cfg ? !!cfg.showPageIcons : false;
  useEffect(function () {
    document.documentElement.dataset.pageIcons = _showPageIcons ? "1" : "0";
    window.dispatchEvent(new CustomEvent("fc-page-icons", { detail: _showPageIcons }));
  }, [_showPageIcons]);
  useEffect(function () { registerGlossarySetTab(setTab); }, [registerGlossarySetTab]);
  useEffect(function () { setGlossaryCurrentTab(tab); }, [tab, setGlossaryCurrentTab]);
  useEffect(function () {
    function onNav(e) { if (e.detail) setTab(e.detail); }
    function onPopState() { setTabRaw(getTabFromPath()); }
    window.addEventListener("nav-tab", onNav);
    window.addEventListener("popstate", onPopState);
    return function () { window.removeEventListener("nav-tab", onNav); window.removeEventListener("popstate", onPopState); };
  }, []);
  var [ready, setReady] = useState(false);
  var [cloudDataLoaded, setCloudDataLoaded] = useState(false);
  var [cfg, setCfg] = useState({ ...DEFAULT_CONFIG });
  var dtApp = (cfg && cfg.devTiming) || {};
  var deinitTotal = (dtApp.deinitMs != null ? dtApp.deinitMs : 1800) + (dtApp.exitMs != null ? dtApp.exitMs : 300);
  useEffect(function () {
    if (devMode) { setDevBannerVisible(true); return; }
    var id = setTimeout(function () { setDevBannerVisible(false); }, deinitTotal);
    return function () { clearTimeout(id); };
  }, [devMode]);
  // Apply accent color as CSS variable overrides
  useEffect(function () {
    var id = cfg.accentColor || "coral";
    var c = ACCENT_PALETTE.find(function (p) { return p.id === id; });
    if (!c) return;
    var styleId = "fc-accent-style";
    var el = document.getElementById(styleId);
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }
    var r = c.rgb[0]; var g = c.rgb[1]; var b = c.rgb[2];
    el.textContent =
      ":root{--brand:" + c.hex + ";--brand-bg:rgba(" + r + "," + g + "," + b + ",0.08);--brand-bg-hover:rgba(" + r + "," + g + "," + b + ",0.16);--brand-border:rgba(" + r + "," + g + "," + b + ",0.22);--brand-hover:" + c.hover + ";--brand-gradient-end:" + c.gradient + "}" +
      "[data-theme=\"dark\"]{--brand:" + c.hex + ";--brand-bg:rgba(" + r + "," + g + "," + b + ",0.14);--brand-bg-hover:rgba(" + r + "," + g + "," + b + ",0.24);--brand-border:rgba(" + r + "," + g + "," + b + ",0.30);--brand-hover:" + c.hoverDark + ";--brand-gradient-end:" + c.gradient + "}";
  }, [cfg.accentColor]);

  // Compute chart palette based on accent color + palette mode
  var accentObj = ACCENT_PALETTE.find(function (p) { return p.id === (cfg.accentColor || "coral"); }) || ACCENT_PALETTE[0];
  var chartPaletteMode = cfg.chartPalette || "brand";
  var chartPalette = useMemo(function () {
    return getChartPalette(chartPaletteMode, accentObj.rgb, accentObj.hex);
  }, [chartPaletteMode, cfg.accentColor]);
  var onChartPaletteChange = function (mode) { setCfg(function (prev) { return Object.assign({}, prev, { chartPalette: mode }); }); };
  var accentRgb = accentObj.rgb;

  var [costs, setCosts] = useState(JSON.parse(JSON.stringify(COST_DEF)));
  var [sals, setSals] = useState(JSON.parse(JSON.stringify(SAL_DEF)));
  var [grants, setGrants] = useState(JSON.parse(JSON.stringify(GRANT_DEF)));
  var [poolSize, setPoolSize] = useState(POOL_SIZE_DEF);
  var [shareholders, setShareholders] = useState(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
  var [roundSim, setRoundSim] = useState({ ...ROUND_SIM_DEF });
  var [streams, setStreams] = useState(JSON.parse(JSON.stringify(REVENUE_DEF)));
  var [esopEnabled, setEsopEnabled] = useState(false);
  var [debts, setDebts] = useState(JSON.parse(JSON.stringify(DEBT_DEF)));
  var [crowdfunding, setCrowdfunding] = useState({ enabled: false, name: "", platform: "ulule", goal: 0, url: "", tiers: [], startDate: "", endDate: "", raised: 0, status: "planning" });
  var [stocks, setStocks] = useState([]);
  var [marketing, setMarketing] = useState({});
  var [affiliation, setAffiliation] = useState({});
  var [production, setProduction] = useState({});
  var [assets, setAssets] = useState([]);
  var [planSections, setPlanSections] = useState(JSON.parse(JSON.stringify(PLAN_SECTIONS_DEF)));
  var [showOnboarding, setShowOnboarding] = useState(false);
  var [showExport, setShowExport] = useState(false);
  var [presMode, setPresMode] = useState(false);
  var [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  var [showCmdPalette, setShowCmdPalette] = useState(false);
  var [showDevPalette, setShowDevPalette] = useState(false);
  var [showSpacingInspector, setShowSpacingInspector] = useState(false);
  var [showShareModal, setShowShareModal] = useState(false);
  var [joinFlow, setJoinFlow] = useState(null);
  var [removedFromWorkspace, setRemovedFromWorkspace] = useState(false);

  /* ── Listen for fc-open-share event (from Settings > Team) ── */
  useEffect(function () {
    function onOpenShare() { setShowShareModal(true); }
    window.addEventListener("fc-open-share", onOpenShare);
    return function () { window.removeEventListener("fc-open-share", onOpenShare); };
  }, []);
  var [onboardingTasksSkipped, setOnboardingTasksSkipped] = useState(function () {
    try { var k = "forecrest_onboarding_skip_" + ((typeof auth !== "undefined" && auth.user) ? auth.user.id : ""); return localStorage.getItem(k) === "true"; } catch (e) { return false; }
  });
  var [accountSetupDone, setAccountSetupDone] = useState(function () {
    try { return localStorage.getItem("forecrest_account_setup_done") === "true"; } catch (e) { return false; }
  });
  var [showToolbar, setShowToolbar] = useState(true);
  var [activeModule, setActiveModule] = useState("core");
  var marketingPaid = useMemo(function () {
    return devMode || !!(marketing && (marketing.paid || (marketing.paid === undefined && marketing.enabled)));
  }, [marketing, devMode]);
  var marketingEnabled = useMemo(function () {
    return devMode || !!(marketingPaid && marketing && marketing.enabled);
  }, [marketingPaid, marketing, devMode]);
  var paidModules = useMemo(function () {
    return { marketing: marketingPaid };
  }, [marketingPaid]);
  var unlockedModules = useMemo(function () {
    return { marketing: marketingEnabled, tools_mod: true };
  }, [marketingEnabled]);

  useEffect(function () {
    var mod = (MARKETING_TABS.indexOf(tab) >= 0 && marketingEnabled) ? "marketing" : (TOOLS_TABS.indexOf(tab) >= 0) ? "tools_mod" : "core";
    setActiveModule(mod);
  }, [tab, marketingEnabled]);

  useEffect(function () {
    if (MARKETING_TABS.indexOf(tab) < 0) return;
    if (!marketingPaid && tab !== "marketing") {
      setTab("marketing");
      return;
    }
    if (marketingPaid && !marketingEnabled && tab !== "marketing") {
      setTab("marketing");
    }
  }, [tab, marketingPaid, marketingEnabled]);

  var mainRef = useRef(null);
  useEffect(function () {
    function updateCenter() {
      if (!mainRef.current) return;
      var rect = mainRef.current.getBoundingClientRect();
      var center = rect.left + rect.width / 2;
      document.documentElement.style.setProperty("--fc-content-center", center + "px");
    }
    updateCenter();
    window.addEventListener("resize", updateCenter);
    var resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && mainRef.current) {
      resizeObserver = new ResizeObserver(updateCenter);
      resizeObserver.observe(mainRef.current);
    }
    var obs = new MutationObserver(updateCenter);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return function () {
      window.removeEventListener("resize", updateCenter);
      obs.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [sidebarCollapsed, devBannerVisible, activeModule, tab]);
  var [sharedLink, setSharedLink] = useState(null);
  var dashRef = useRef(null);
  var overlayRef = useRef(null);
  var fromOnboarding = useRef(false);
  var hasLocalData = useRef(false);

  var getSnapshot = useCallback(function () {
    return { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections };
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections]);

  var applySnapshot = useCallback(function (d) {
    if (d.cfg) setCfg(d.cfg);
    if (d.costs) setCosts(d.costs);
    if (d.sals) setSals(d.sals);
    if (d.grants) setGrants(d.grants);
    if (d.poolSize !== undefined) setPoolSize(d.poolSize);
    if (d.shareholders) setShareholders(d.shareholders);
    if (d.roundSim) setRoundSim(d.roundSim);
    if (d.streams) setStreams(d.streams);
    if (d.esopEnabled !== undefined) setEsopEnabled(d.esopEnabled);
    if (d.debts) setDebts(d.debts);
    if (d.crowdfunding) setCrowdfunding(d.crowdfunding);
    if (d.stocks) setStocks(d.stocks);
    if (d.marketing) setMarketing(normalizeMarketingState(d.marketing));
    if (d.affiliation) setAffiliation(d.affiliation);
    if (d.production) setProduction(d.production);
    if (d.assets) setAssets(d.assets);
    if (d.planSections) setPlanSections(d.planSections);
  }, []);

  var getFullSnapshot = useCallback(function () {
    return { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding, stocks, marketing, affiliation, production };
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding, stocks, marketing, affiliation, production]);

  var history = useHistory(getSnapshot, applySnapshot);

  var historyTimer = useRef(null);
  useEffect(function () {
    if (!ready || showOnboarding) return;
    clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(function () { history.push(); }, 400);
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections, ready, showOnboarding, history]);

  useEffect(function () {
    var m = t.meta && t.meta[tab];
    var pageTitle = m ? m.title : (t.meta ? t.meta.site : "Forecrest");
    var company = cfg && cfg.companyName;
    document.title = company ? (pageTitle + " \u2014 " + company) : pageTitle;
    var el = document.querySelector('meta[name="description"]');
    if (m && m.desc) {
      if (!el) { el = document.createElement("meta"); el.name = "description"; document.head.appendChild(el); }
      el.content = m.desc;
    }
  }, [tab, t]);

  useEffect(function () {
    var hashData = null;
    var hashError = false;

    if (window.location.hash && window.location.hash.length > 1) {
      var raw = window.location.hash.slice(1);
      /* Legacy #/tab URL → redirect to path-based */
      if (raw.charAt(0) === "/" && raw.length < 60) {
        var legacyTab = raw.slice(1).toLowerCase();
        if (VALID_TABS.indexOf(legacyTab) >= 0) {
          window.history.replaceState(null, "", "/" + legacyTab);
        }
      }
      /* Shared-link decode (base64 data, no / prefix) */
      if (raw.charAt(0) !== "/" && raw.length > 50) {
        try {
          if (raw.length > 500000) throw new Error("hash too large");
          hashData = JSON.parse(decodeURIComponent(atob(raw)));
          window.history.replaceState(null, "", window.location.pathname);
        } catch (e) {
          hashError = true;
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }

    if (hashData) {
      setSharedLink({ status: "valid", data: hashData });
    } else if (hashError) {
      setSharedLink({ status: "error" });
    }

    load(STORAGE_KEY).then(function (s) {
      if (s) {
        hasLocalData.current = true;
        if (s.streams) s.streams = migrateStreams(s.streams);
        if (s.costs) s.costs = migrateCosts(s.costs);
        if (s.marketing) s.marketing = normalizeMarketingState(s.marketing);
        // Migrate salary objects: add shareholder field if missing
        if (s.sals && Array.isArray(s.sals)) {
          s.sals = s.sals.map(function (sal) {
            if (sal.shareholder === undefined) sal.shareholder = false;
            return sal;
          });
        }
        // Migrate shareholder objects: add fromSalary field if missing
        if (s.shareholders && Array.isArray(s.shareholders)) {
          s.shareholders = s.shareholders.map(function (sh) {
            if (sh.fromSalary === undefined) sh.fromSalary = null;
            return sh;
          });
        }
        if (!hashData) applySnapshot(s);
      } else if (!hashData && !hashError) {
        // setShowOnboarding(true); /* temporarily disabled */
        fromOnboarding.current = true;
      }
      setReady(true);
    });
  }, []);

  useEffect(function () {
    if (ready && !showOnboarding) save(STORAGE_KEY, { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding, stocks, marketing, affiliation, production });
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding, stocks, marketing, affiliation, production, ready, showOnboarding]);

  /* ── Cloud sync refs (declared early for hoisting) ── */
  var migrationDone = useRef(false);
  var lastLoadedWs = useRef(null);

  /* ── Cloud sync: dual-write when logged in ── */
  var auth = useAuth();
  useEffect(function () {
    if (!ready || !auth.user || auth.storageMode !== "cloud" || !auth.workspaceId) return;
    /* Don't write to cloud until we've loaded from it first (prevents overwriting shared data with empty state) */
    if (!migrationDone.current) return;
    var blob = { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding, stocks, marketing, affiliation, production };
    scheduleSave(auth.workspaceId, blob);
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding, stocks, marketing, affiliation, production, ready, auth.user, auth.storageMode, auth.workspaceId]);

  /* ── Per-user onboarding skip flag ── */
  useEffect(function () {
    if (!auth.user) { setOnboardingTasksSkipped(false); return; }
    try {
      var key = "forecrest_onboarding_skip_" + auth.user.id;
      setOnboardingTasksSkipped(localStorage.getItem(key) === "true");
    } catch (e) { setOnboardingTasksSkipped(false); }
  }, [auth.user && auth.user.id]);

  /* ── Re-check sessionStorage join token when user authenticates ── */
  useEffect(function () {
    if (!auth.user || joinFlow) return;
    try {
      var savedToken = sessionStorage.getItem("forecrest_join_token");
      if (savedToken) setJoinFlow({ token: savedToken });
    } catch (e) {}
  }, [auth.user]);

  /* ── Cloud data load: on first login or workspace change ── */
  useEffect(function () {
    if (!auth.user || !auth.workspaceId) return;

    /* Skip if same workspace already loaded */
    if (migrationDone.current && lastLoadedWs.current === auth.workspaceId) return;
    migrationDone.current = true;
    lastLoadedWs.current = auth.workspaceId;

    /* Non-owners: ALWAYS load from cloud (they join a shared workspace) */
    if (auth.isOwner === false) {
      var sb = getSupabase();
      if (sb) {
        /* Check if membership is still active */
        sb.rpc("get_workspace_members", { ws_id: auth.workspaceId }).then(function (memRes) {
          if (memRes.data) {
            var myMembership = memRes.data.find(function (m) { return m.user_id === auth.user.id; });
            if (!myMembership || myMembership.status === "removed") {
              setRemovedFromWorkspace(true);
              return;
            }
          }
        });

        sb.from("workspaces")
          .select("app_state")
          .eq("id", auth.workspaceId)
          .single()
          .then(function (res) {
            if (res.data && res.data.app_state && Object.keys(res.data.app_state).length > 0) {
              applySnapshot(res.data.app_state);
            }
            setCloudDataLoaded(true);
          });
      }
      return;
    }

    /* Owner: compare timestamps (may have local-first data) */
    loadWithConflictCheck(auth.workspaceId).then(function (result) {
      if (!result) { setCloudDataLoaded(true); return; }
      if (result.source === "cloud" && result.data && Object.keys(result.data).length > 0) {
        applySnapshot(result.data);
      }
      setCloudDataLoaded(true);
    });
  }, [auth.user, auth.workspaceId, auth.isOwner, applySnapshot]);

  // ── Salary → Cap Table sync ──
  useEffect(function () {
    if (!ready || !sals) return;
    setShareholders(function (prev) {
      var updated = JSON.parse(JSON.stringify(prev));
      var changed = false;

      // Create/update synced shareholders for sals with shareholder=true
      sals.forEach(function (s) {
        if (!s.shareholder) return;
        var existing = updated.find(function (sh) { return sh.fromSalary === s.id; });
        if (!existing) {
          var newId = updated.length ? Math.max.apply(null, updated.map(function (sh) { return sh.id; })) + 1 : 0;
          updated.push({
            id: newId, name: s.role, cl: "common", shares: 1000,
            price: 2, date: new Date().toISOString().slice(0, 10), fromSalary: s.id,
          });
          changed = true;
        } else if (existing.name !== s.role) {
          existing.name = s.role;
          changed = true;
        }
      });

      // Remove synced shareholders for sals with shareholder=false
      sals.forEach(function (s) {
        if (s.shareholder) return;
        var idx = updated.findIndex(function (sh) { return sh.fromSalary === s.id; });
        if (idx >= 0) {
          updated.splice(idx, 1);
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [sals, ready]);

  useEffect(function () {
    if (!fromOnboarding.current) return;
    if (showOnboarding) return;
    fromOnboarding.current = false;
    var overlay = overlayRef.current;
    var dash = dashRef.current;
    if (!overlay || !dash) return;

    var logoEl = document.querySelector("header img");
    var rect = logoEl ? logoEl.getBoundingClientRect() : null;
    var logoX = rect ? Math.round(rect.left + rect.width / 2) : 48;
    var logoY = rect ? Math.round(rect.top + rect.height / 2) : 29;

    var tl = gsap.timeline({
      onComplete: function () {
        gsap.set(overlay, { display: "none", clipPath: "" });
      },
    });
    tl.set(overlay, { display: "block", clipPath: "circle(150% at " + logoX + "px " + logoY + "px)" });
    tl.to(overlay, { clipPath: "circle(0% at " + logoX + "px " + logoY + "px)", duration: 0.5, ease: "power2.inOut" });
    tl.fromTo(dash, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.25");

    return function () {
      document.documentElement.style.overflowX = "";
      tl.kill();
      gsap.set([overlay, dash], { clearProps: "all" });
    };
  }, [showOnboarding]);

  setCurrencyDisplay(cfg.currency, cfg.exchangeRates, lang === "en" ? "en-US" : "fr-FR");

  // Global keyboard shortcuts
  var hotkeyOpts = { preventDefault: true, enableOnFormTags: false };

  useHotkeys("mod+z", function () { history.undo(); }, hotkeyOpts, [history]);
  useHotkeys("mod+shift+z, mod+y", function () { history.redo(); }, hotkeyOpts, [history]);
  useHotkeys("mod+s", function () {
    if (auth.user && auth.storageMode === "cloud") {
      setShowShareModal(true);
    } else {
      setShowExport(true);
    }
  }, hotkeyOpts, [auth.user, auth.storageMode]);
  useHotkeys("mod+p", function () { setPresMode(function (v) { return !v; }); }, hotkeyOpts);
  useHotkeys("mod+k", function () { setShowCmdPalette(function (v) { return !v; }); }, hotkeyOpts);
  useHotkeys("mod+shift+d", function () {
    /* Dev mode: admin only in cloud, anyone in self-hosted/local */
    var mode = getStorageMode();
    if (mode === "cloud" && !(auth.user && auth.user.role === "admin")) return;
    toggleDevMode();
  }, hotkeyOpts, [toggleDevMode, auth.user]);
  useHotkeys("mod+shift+e", function () { setCfg(function (prev) { return Object.assign({}, prev, { showPcmn: !prev.showPcmn }); }); }, hotkeyOpts, []);
  useHotkeys("mod+shift+k", function () { if (devMode) setShowDevPalette(function (v) { return !v; }); }, hotkeyOpts, [devMode]);
  useHotkeys("mod+b", function () { setShowToolbar(function (v) { return !v; }); }, hotkeyOpts);

  // Chord-based navigation (Linear-style: G then O = Overview)
  var [chordPending, setChordPending] = useState(null);
  var chordRef = useRef(null);
  var chordTimerRef = useRef(null);
  var CHORD_NAV = useRef({
    o: "overview", r: "streams", c: "opex", e: "salaries",
    q: "equipment", s: "stocks", t: "cashflow", f: "debt",
    d: "income_statement", b: "balance_sheet", a: "accounting",
    k: "ratios", n: "sensitivity", i: "equity", p: "captable",
  });

  useEffect(function () {
    function isInput(e) {
      var tag = e.target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
    }
    function onKeyDown(e) {
      if (isInput(e)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // If chord is pending, try to resolve
      if (chordRef.current) {
        var key = e.key.toLowerCase();
        // G again or Escape dismisses chord
        if (key === "g" || e.key === "Escape") {
          e.preventDefault();
          chordRef.current = null;
          clearTimeout(chordTimerRef.current);
          setChordPending(null);
          return;
        }
        var dest = CHORD_NAV.current[key];
        chordRef.current = null;
        clearTimeout(chordTimerRef.current);
        setChordPending(null);
        if (dest) {
          e.preventDefault();
          setTab(dest);
        }
        return;
      }

      // Start chord on "g" (Go to…)
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        chordRef.current = "g";
        setChordPending("g");
        chordTimerRef.current = setTimeout(function () {
          chordRef.current = null;
          setChordPending(null);
        }, 9000);
        return;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return function () {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(chordTimerRef.current);
    };
  }, []);

  // ── Financial calculations ──

  var opCosts = useMemo(function () {
    var t = 0;
    costs.forEach(function (c) {
      c.items.forEach(function (i) { t += costItemMonthly(i); });
    });
    return t;
  }, [costs]);

  var salCosts = useMemo(function () {
    var t = 0;
    sals.forEach(function (s) {
      if (s.type === "independant") {
        t += s.net; // Independant: net invoice = business cost (no employer charges)
      } else {
        var eO = s.type === "student" ? 0.0271 : cfg.onss;
        var eP = s.type === "student" ? 0 : cfg.patr;
        t += salCalc(s.net, eO, cfg.prec, eP).total;
      }
    });
    return t;
  }, [sals, cfg]);

  var esopMonthly = useMemo(function () {
    if (!grants || !grants.length) return 0;
    return grants.reduce(function (sum, g) {
      return sum + grantCalc(g).monthlyExpense;
    }, 0);
  }, [grants]);

  var monthlyCosts = opCosts + salCosts + (esopEnabled ? esopMonthly : 0);

  var totalRevenue = useMemo(function () {
    var rev = calcTotalRevenue(streams) + calcAffiliationMonthly(affiliation) * 12;
    /* Add crowdfunding as one-time revenue when funds are received */
    if (crowdfunding && crowdfunding.enabled) {
      var cfStatus = crowdfunding.status || "planning";
      var cfModel = crowdfunding.fundingModel || "all_or_nothing";
      /* Completed = always count. Failed + flexible model = funds still received */
      if (cfStatus === "completed" || (cfStatus === "failed" && cfModel === "flexible")) {
        rev += calcActualRaised(crowdfunding.tiers, crowdfunding.donations || 0);
      }
    }
    return rev;
  }, [streams, affiliation, crowdfunding]);

  var annC = monthlyCosts * 12;
  // Note: 'ebit' includes depreciation (from opCosts items with PCMN 63xx).
  // True EBITDA would add back depreciation, but we use EBIT for tax base.
  var ebit = totalRevenue - annC;
  var annualInterest = 0;
  debts.forEach(function (d) {
    if (d.rate > 0 && d.amount > 0 && d.duration > (d.elapsed || 0)) {
      var r = d.rate / 12;
      if (r > 0) {
        var pow = Math.pow(1 + r, d.duration);
        var elapsed = d.elapsed || 0;
        var powBegin = Math.pow(1 + r, elapsed);
        var balanceBegin = d.amount * (pow - powBegin) / (pow - 1);
        var elapsedEnd = Math.min(elapsed + 12, d.duration);
        var balanceEnd = elapsedEnd >= d.duration ? 0 : d.amount * (pow - Math.pow(1 + r, elapsedEnd)) / (pow - 1);
        var avgBalance = (balanceBegin + balanceEnd) / 2;
        annualInterest += avgBalance * d.rate;
      }
    }
  });
  var ebt = ebit - annualInterest;
  var { isocR, isocS, isoc, isocEff, netP, resLeg } = calcIsoc(ebt, cfg.capitalSocial);
  var resTarget = cfg.capitalSocial * 0.10;
  var dirRem = 0;
  sals.forEach(function (s) {
    var eO = s.type === "student" ? 0.0271 : cfg.onss;
    var eP = s.type === "student" ? 0 : cfg.patr;
    dirRem += salCalc(s.net, eO, cfg.prec, eP).brutO;
  });
  var dirOk = dirRem >= 45000;
  var divGross = netP > 0 ? Math.max(netP - resLeg, 0) : 0;
  /* Per-line TVA calculation */
  var annVatC = calcVatCollected(streams, cfg.vat || 0.21);
  var annVatD = calcVatDeductible(costs, cfg.vat || 0.21);
  var vatBalance = annVatC - annVatD;

  var bizKpis = useMemo(function () {
    return calcBusinessKpis(cfg.businessType, {
      totalRevenue: totalRevenue, monthlyCosts: monthlyCosts,
      ebit: ebit, netP: netP, cfg: cfg, sals: sals,
      streams: streams, debts: debts,
    });
  }, [cfg, totalRevenue, monthlyCosts, ebit, netP, sals, streams, debts]);

  /* Push financial values to glossary context for live display */
  useEffect(function () {
    var totalMRR = totalRevenue / 12;
    setGlossaryFinancials({
      monthlyRevenue: totalMRR,
      annualRevenue: totalRevenue,
      totalCosts: annC,
      fixedCosts: annC, /* simplified — could split fixed/variable */
      ebit: ebit,
      ebitMargin: totalRevenue > 0 ? Math.round(ebit / totalRevenue * 100) : 0,
      netProfit: netP,
      isoc: isoc,
      burnRate: ebit < 0 ? Math.abs(ebit / 12) : 0,
      runway: ebit < 0 && (cfg.initialCash || 0) > 0 ? Math.round((cfg.initialCash || 0) / Math.abs(ebit / 12)) : null,
      treasury: cfg.initialCash || 0,
      costCoverage: annC > 0 ? Math.round(totalRevenue / annC * 100) : null,
      salaryCost: salCosts * 12,
      showPcmn: cfg.showPcmn || false,
    });
  }, [totalRevenue, annC, ebit, netP, isoc, cfg.initialCash, cfg.showPcmn, salCosts, setGlossaryFinancials]);

  function handlePrint() {
    var ebitMargin = totalRevenue > 0 ? ebit / totalRevenue : 0;
    var monthlyRevenue = totalRevenue / 12;
    var isProfitable = monthlyRevenue >= monthlyCosts;
    var netBurn = monthlyCosts - monthlyRevenue;
    var frV = cfg.capitalSocial + resLeg + netP;
    var recDays = cfg.receivableDays || 30;
    var payDays = cfg.payableDays || 30;
    var bfrV = totalRevenue * recDays / 365 - monthlyCosts * 12 * payDays / 365;
    openInvestorReport({
      totalRevenue: totalRevenue, totalMRR: totalRevenue / 12, totS: 0,
      monthlyCosts: monthlyCosts, ebit: ebit, ebitMargin: ebitMargin, netP: netP,
      isProfitable: isProfitable, netBurn: netBurn,
      divGross: divGross, fr: frV, bfr: bfrV, tresoNette: (cfg.initialCash || 0) - bfrV,
      ltv: 0, ltvCac: 0, payback: 0, arpuMonthly: 0,
      cfg: cfg, resLeg: resLeg, isoc: isoc, vatBalance: vatBalance,
    }, lang);
  }

  var [pendingAdd, setPendingAdd] = useState(null);
  var [pendingEdit, setPendingEdit] = useState(null);
  var [pendingDuplicate, setPendingDuplicate] = useState(null);

  function handleQuickAdd(target, label) {
    setPendingAdd({ target: target, label: label });
    setTab(target);
  }
  function clearPendingAdd() { setPendingAdd(null); }

  function handleQuickEdit(targetTab, itemId) {
    setTab(targetTab);
    setPendingEdit({ target: targetTab, itemId: itemId });
  }
  function clearPendingEdit() { setPendingEdit(null); }

  function handleQuickDuplicate(targetTab, itemId) {
    setTab(targetTab);
    setPendingDuplicate({ target: targetTab, itemId: itemId });
  }
  function clearPendingDuplicate() { setPendingDuplicate(null); }

  function randomizeAll() {
    // Revenue streams
    setStreams([{ cat: "Revenus", items: [
      { id: makeId("r"), l: "Abonnement SaaS", behavior: "recurring", price: 29 + Math.floor(Math.random() * 70), qty: 5 + Math.floor(Math.random() * 50), growthRate: 0.05 + Math.random() * 0.15, seasonProfile: "flat" },
      { id: makeId("r"), l: "Consulting projets", behavior: "project", price: 2000 + Math.floor(Math.random() * 8000), qty: 1 + Math.floor(Math.random() * 3), growthRate: 0, seasonProfile: "flat" },
      { id: makeId("r"), l: "Commission partenaires", behavior: "commission", price: 500 + Math.floor(Math.random() * 2000), qty: 2 + Math.floor(Math.random() * 6), growthRate: 0.1, seasonProfile: "flat" },
    ]}]);
    // Costs
    setCosts([{ cat: "Charges", items: [
      { id: makeId("c"), l: "Loyer bureau", a: 400 + Math.floor(Math.random() * 800), freq: "monthly", pu: false, u: 1, pcmn: "6100", type: "exploitation" },
      { id: makeId("c"), l: "Hébergement cloud", a: 50 + Math.floor(Math.random() * 200), freq: "monthly", pu: true, u: 1 + Math.floor(Math.random() * 3), pcmn: "6120", type: "exploitation" },
      { id: makeId("c"), l: "Publicité Meta", a: 200 + Math.floor(Math.random() * 1000), freq: "monthly", pu: false, u: 1, pcmn: "6130", type: "exploitation" },
      { id: makeId("c"), l: "Comptable", a: 100 + Math.floor(Math.random() * 200), freq: "monthly", pu: false, u: 1, pcmn: "6140", type: "exploitation" },
      { id: makeId("c"), l: "Assurance RC Pro", a: 300 + Math.floor(Math.random() * 400), freq: "annual", pu: false, u: 1, pcmn: "6150", type: "exploitation" },
    ]}]);
    // Team (preserve salary-linked shareholders)
    setSals([
      { id: makeId("s"), role: "CEO / Fondateur", type: "director", net: 2500 + Math.floor(Math.random() * 1500), shareholder: true, benefits: [{ id: "car", amount: 400 + Math.floor(Math.random() * 200), label: "Voiture de société" }], duration: "cdi" },
      { id: makeId("s"), role: "Développeur Full-Stack", type: "employee", net: 2000 + Math.floor(Math.random() * 1000), shareholder: false, benefits: [{ id: "laptop", amount: 50, label: "Laptop" }], duration: "cdi" },
      { id: makeId("s"), role: "Designer freelance", type: "independant", net: 350 + Math.floor(Math.random() * 150), shareholder: false, benefits: [], duration: "cdi" },
    ]);
    // Equipment
    setAssets([
      { id: makeId("a"), label: "MacBook Pro", amount: 2500 + Math.floor(Math.random() * 1000), years: 3, method: "linear", residual: 0, category: "it" },
      { id: makeId("a"), label: "Mobilier de bureau", amount: 800 + Math.floor(Math.random() * 600), years: 5, method: "linear", residual: 0, category: "furniture" },
      { id: makeId("a"), label: "Vélo cargo", amount: 2000 + Math.floor(Math.random() * 1000), years: 5, method: "linear", residual: 200, category: "vehicle" },
    ]);
    // Stocks
    setStocks([
      { id: makeId("st"), name: "T-shirts imprimés", category: "merchandise", unitCost: 8 + Math.floor(Math.random() * 5), sellingPrice: 25 + Math.floor(Math.random() * 10), quantity: 50 + Math.floor(Math.random() * 150), monthlySales: 10 + Math.floor(Math.random() * 20) },
      { id: makeId("st"), name: "Emballages carton", category: "supplies", unitCost: 0.5, sellingPrice: 0, quantity: 200 + Math.floor(Math.random() * 300), monthlySales: 30 + Math.floor(Math.random() * 40) },
    ]);
    // Debts
    setDebts([
      { id: makeId("d"), label: "Prêt bancaire Starteo", type: "bank", amount: 25000 + Math.floor(Math.random() * 50000), rate: 0.03 + Math.random() * 0.03, duration: 48 + Math.floor(Math.random() * 24), elapsed: 0 },
      { id: makeId("d"), label: "Subside régional", type: "subsidy", amount: 5000 + Math.floor(Math.random() * 15000), rate: 0, duration: 1, elapsed: 0 },
    ]);
    // Shareholders (preserve salary-synced)
    var linked = shareholders.filter(function (sh) { return sh.fromSalary != null; });
    var nextId = linked.length ? Math.max.apply(null, linked.map(function (s) { return s.id; })) + 1 : 100;
    setShareholders(linked.concat([
      { id: nextId, name: "Alice Martin", cl: "common", shares: 4000 + Math.floor(Math.random() * 4000), price: 1 + Math.floor(Math.random() * 3), date: "2025-01-15", fromSalary: null },
      { id: nextId + 1, name: "Venture Fund SA", cl: "preferred", shares: 1000 + Math.floor(Math.random() * 3000), price: 5 + Math.floor(Math.random() * 10), date: "2025-06-01", fromSalary: null },
    ]));
    // Config
    setCfg(function (prev) { return Object.assign({}, prev, { initialCash: 10000 + Math.floor(Math.random() * 40000), capitalSocial: 18600 }); });
  }

  var currentTabItems = useMemo(function () {
    var items = [];
    if (tab === "opex") {
      (costs || []).forEach(function (cat) {
        (cat.items || []).forEach(function (item) {
          items.push({ id: item.id, label: item.l || "" });
        });
      });
    } else if (tab === "streams") {
      (streams || []).forEach(function (cat) {
        (cat.items || []).forEach(function (item) {
          items.push({ id: item.id, label: item.l || "" });
        });
      });
    } else if (tab === "salaries") {
      (sals || []).forEach(function (s) { items.push({ id: s.id, label: s.role || "" }); });
    } else if (tab === "equipment") {
      (assets || []).forEach(function (a) { items.push({ id: a.id, label: a.label || "" }); });
    } else if (tab === "stocks") {
      (stocks || []).forEach(function (s) { items.push({ id: s.id, label: s.name || "" }); });
    } else if (tab === "debt") {
      (debts || []).forEach(function (d) { items.push({ id: d.id, label: d.name || "" }); });
    }
    return items;
  }, [tab, costs, streams, sals, assets, stocks, debts]);

  var allTabItems = useMemo(function () {
    var opexItems = [];
    (costs || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) { opexItems.push({ id: item.id, label: item.l || "" }); });
    });
    var streamsItems = [];
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) { streamsItems.push({ id: item.id, label: item.l || "" }); });
    });
    return {
      opex: opexItems,
      streams: streamsItems,
      salaries: (sals || []).map(function (s) { return { id: s.id, label: s.role || "" }; }),
      equipment: (assets || []).map(function (a) { return { id: a.id, label: a.label || "" }; }),
      stocks: (stocks || []).map(function (s) { return { id: s.id, label: s.name || "" }; }),
      debt: (debts || []).map(function (d) { return { id: d.id, label: d.name || "" }; }),
    };
  }, [costs, streams, sals, assets, stocks, debts]);

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span style={{ color: "var(--text-faint)", fontSize: 14 }}>{t.loading}</span>
      </div>
    );
  }

  /* ── Auth loading: show blank screen while restoring session (prevents dashboard flash) ── */
  if (ready && isSupabaseConfigured() && auth.loading) {
    return <AppLoader label={t.loading} />;
  }

  /* ── Auth wall: block access if Supabase is configured but user not logged in ── */
  if (ready && isSupabaseConfigured() && !auth.user && !auth.loading) {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <AuthPage />
      </Suspense>
    );
  }

  /* ── Removed from workspace: show removed page ── */
  if (removedFromWorkspace && ready) {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <RemovedPage />
      </Suspense>
    );
  }

  /* ── Join flow: invitation acceptance page ── */
  if (joinFlow && ready) {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <JoinPage
          token={joinFlow.token}
          onComplete={function () {
            setJoinFlow(null);
            /* Force load cloud data from the shared workspace (bypass timestamp check) */
            var wsId = auth.workspaceId;
            if (wsId) {
              var sb = getSupabase();
              if (sb) {
                sb.from("workspaces")
                  .select("app_state")
                  .eq("id", wsId)
                  .single()
                  .then(function (res) {
                    if (res.data && res.data.app_state && Object.keys(res.data.app_state).length > 0) {
                      applySnapshot(res.data.app_state);
                    }
                  });
              }
              if (auth.loadWorkspaceMembers) auth.loadWorkspaceMembers(wsId);
            }
          }}
        />
      </Suspense>
    );
  }

  /* ── Account setup wall: first login — collect name, DOB, gender, terms ── */
  /* Check both localStorage (legacy) and Supabase profileComplete flag */
  var profileDone = accountSetupDone || (auth.user && auth.user.profileComplete === true);
  if (ready && auth.user && !auth.loading && !profileDone) {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <AccountSetupPage onComplete={function (data) {
          setAccountSetupDone(true);
          /* Pre-fill cfg with first/last name if owner */
          if (auth.isOwner !== false && data) {
            setCfg(function (prev) {
              var n = Object.assign({}, prev);
              if (data.firstName && !n.firstName) n.firstName = data.firstName;
              if (data.lastName && !n.lastName) n.lastName = data.lastName;
              return n;
            });
          }
        }} />
      </Suspense>
    );
  }

  /* ── Onboarding wall: force profile setup if companyName empty ── */
  /* Skip for non-owners — they join an existing workspace, no need to onboard */
  /* In local mode (no auth) or when cloud data hasn't loaded yet, skip onboarding check */
  var waitingForCloud = auth.user && auth.workspaceId && !cloudDataLoaded;
  var needsOnboarding = ready && !waitingForCloud && auth.isOwner !== false && cfg && !cfg.companyName;
  /* Also trigger if authenticated user has no workspace yet (new signup) */
  if (!needsOnboarding && ready && auth.user && !auth.workspaceId && !auth.loading) {
    needsOnboarding = true;
  }
  if (needsOnboarding) {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <OnboardingPage onComplete={function (updates) {
          var finalize = function () {
            setCfg(function (prev) { return Object.assign({}, prev, updates); });
          };
          /* If no workspace yet, create one first */
          if (auth.user && !auth.workspaceId && auth.createWorkspace) {
            auth.createWorkspace(auth.user.id, updates.companyName || "Mon entreprise").then(finalize);
          } else {
            finalize();
          }
        }} />
      </Suspense>
    );
  }

  if (sharedLink && ready) {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <SharedLinkPage
          sharedLink={sharedLink}
          onAccept={function () {
            if (sharedLink.data) applySnapshot(sharedLink.data);
            setSharedLink(null);
          }}
          onDismiss={function () {
            setSharedLink(null);
            if (!hasLocalData.current) {
              // setShowOnboarding(true); /* temporarily disabled */
              fromOnboarding.current = true;
            }
          }}
        />
      </Suspense>
    );
  }

  if (showOnboarding) {
    return (
      <div style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", background: "var(--bg-page)", minHeight: "100vh", color: "var(--text-primary)" }}>
        <Suspense fallback={<AppLoader label={t.loading} />}>
          <OnboardingWizard
            sals={sals} costs={costs} cfg={cfg} streams={streams}
            setSals={setSals} setCosts={setCosts} setCfg={setCfg} setStreams={setStreams}
            onComplete={function () { setShowOnboarding(false); }}
          />
        </Suspense>
      </div>
    );
  }

  /* ── Admin layout: completely separate from main dashboard ── */
  if (tab === "admin" && isAdminEnabled() && auth.user && auth.user.role === "admin") {
    return (
      <Suspense fallback={<AppLoader label={t.loading} />}>
        <AdminLayout
          section={adminSection}
          setSection={setAdminSection}
          setTab={setTab}
        >
          <AdminPage section={adminSection} />
        </AdminLayout>
      </Suspense>
    );
  }

  /* ── Wrap with collaboration providers when logged in ── */
  var collabEnabled = !!(auth.user && auth.storageMode === "cloud" && auth.workspaceId);

  var mainContent = (
    <>
      <DevBanner cfg={cfg} />
      <AccountantBar cfg={cfg} visible={cfg && cfg.showPcmn && !devBannerVisible} />
      <div ref={dashRef} style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", display: "flex", background: "var(--bg-page)", minHeight: "100vh", color: "var(--text-primary)", paddingTop: (devBannerVisible || (cfg && cfg.showPcmn)) ? 32 : 0, transition: "padding-top 0.3s ease" }}>
        <Sidebar
          tab={tab} setTab={setTab}
          onOpenExport={function () { setShowExport(true); }}
          onOpenSearch={function () { setShowCmdPalette(true); }}
          collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
          cfg={cfg}
          totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
          devBannerVisible={devBannerVisible}
          activeModule={activeModule} setActiveModule={setActiveModule}
          paidModules={paidModules}
          unlockedModules={unlockedModules}
        />

        <main ref={mainRef} style={{ flex: 1, padding: "var(--page-py) var(--page-px)", maxWidth: "var(--page-max)", margin: "0 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
          {auth.user && auth.storageMode === "cloud" ? (
            <Suspense fallback={null}>
              <CollabBar
                onOpenShare={function () { setShowShareModal(true); }}
                onViewAll={function () { setTab("set", { section: "team" }); }}
                currentTab={tab}
                tabLabels={t.tabs}
              />
            </Suspense>
          ) : null}
          <PagePerfProvider devMode={devMode}>
          <Suspense fallback={null}>
            <PagePerfProfiler tabKey={tab}>
            <PageTransition tabKey={tab} animate={!cfg || cfg.animationsEnabled !== false}>
            {tab === "overview" ? (
              (function () {
                if (!onboardingTasksSkipped && auth.isOwner !== false) {
                  return <OverviewOnboarding cfg={cfg} streams={streams} costs={costs} sals={sals} setTab={setTab} onQuickAdd={handleQuickAdd} onSkip={function () { try { var k = "forecrest_onboarding_skip_" + (auth.user ? auth.user.id : ""); localStorage.setItem(k, "true"); } catch (e) {} setOnboardingTasksSkipped(true); }} />;
                }
                return <OverviewPage
                  totalRevenue={totalRevenue}
                  monthlyCosts={monthlyCosts} annC={annC}
                  ebit={ebit} annualInterest={annualInterest}
                  isocR={isocR} isocS={isocS} isoc={isoc} isocEff={isocEff}
                  netP={netP} resLeg={resLeg} resTarget={resTarget} dirRem={dirRem} dirOk={dirOk}
                  divGross={divGross} cfg={cfg}
                  annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
                  streams={streams} debts={debts} onPrint={handlePrint} setTab={setTab} onNavigate={navigateWithToast}
                  bizKpis={bizKpis}
                />;
              })()
            ) : null}

            {tab === "accounting" ? (
              <AccountingPage
                costs={costs} sals={sals} cfg={cfg} debts={debts} streams={streams} stocks={stocks} assets={assets}
                totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                opCosts={opCosts} salCosts={salCosts}
                ebit={ebit} isoc={isoc} isocR={isocR} isocS={isocS} isocEff={isocEff} netP={netP} resLeg={resLeg}
                annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
                esopMonthly={esopMonthly} esopEnabled={esopEnabled}
                setCosts={setCosts} onNavigate={navigateWithToast}
                onRandomizeAll={randomizeAll}
                chartPalette={chartPalette}
              />
            ) : null}

            {tab === "income_statement" ? (
              <IncomeStatementPage
                streams={streams} costs={costs} cfg={cfg} assets={assets} stocks={stocks}
                salCosts={salCosts} annualInterest={annualInterest}
                setCfg={setCfg}
                chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
              />
            ) : null}

            {tab === "balance_sheet" ? (
              <BalanceSheetPage
                cfg={cfg} setCfg={setCfg} assets={assets} stocks={stocks} debts={debts} sals={sals}
                totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                annVatC={annVatC} annVatD={annVatD} annualInterest={annualInterest}
                chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
              />
            ) : null}

            {tab === "ratios" ? (
              <RatiosPage
                cfg={cfg} totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                ebit={ebit} netP={netP} resLeg={resLeg} debts={debts}
                sals={sals} salCosts={salCosts} stocks={stocks}
                esopMonthly={esopMonthly} esopEnabled={esopEnabled}
                bizKpis={bizKpis}
              />
            ) : null}

            {tab === "streams" ? (
              <RevenueStreamsPage cfg={cfg} streams={streams} setStreams={setStreams} annC={annC} businessType={cfg.businessType} debts={debts} affiliation={affiliation} setTab={setTab} showPcmn={cfg.showPcmn} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} pendingAdd={pendingAdd && pendingAdd.target === "streams" ? pendingAdd : null} onClearPendingAdd={clearPendingAdd} pendingEdit={pendingEdit && pendingEdit.target === "streams" ? pendingEdit : null} onClearPendingEdit={clearPendingEdit} pendingDuplicate={pendingDuplicate && pendingDuplicate.target === "streams" ? pendingDuplicate : null} onClearPendingDuplicate={clearPendingDuplicate} />
            ) : null}

            {tab === "cashflow" ? (
              <CashFlowPage
                totalRevenue={totalRevenue}
                monthlyCosts={monthlyCosts} annC={annC}
                ebit={ebit}
                debts={debts} salCosts={salCosts} assets={assets}
                annVatC={annVatC} annVatD={annVatD}
                cfg={cfg} setCfg={setCfg} setTab={setTab}
                streams={streams} setStreams={setStreams}
                costs={costs} setCosts={setCosts}
                chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
              />
            ) : null}

            {tab === "opex" ? (
              <OperatingCostsPage
                costs={costs} setCosts={setCosts}
                cfg={cfg} streams={streams}
                totalRevenue={totalRevenue} debts={debts} assets={assets} sals={sals} crowdfunding={crowdfunding} stocks={stocks} setTab={setTab} onNavigate={navigateWithToast} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
                pendingAdd={pendingAdd && pendingAdd.target === "opex" ? pendingAdd : null} onClearPendingAdd={clearPendingAdd}
                pendingEdit={pendingEdit && pendingEdit.target === "opex" ? pendingEdit : null} onClearPendingEdit={clearPendingEdit}
                pendingDuplicate={pendingDuplicate && pendingDuplicate.target === "opex" ? pendingDuplicate : null} onClearPendingDuplicate={clearPendingDuplicate}
              />
            ) : null}

            {tab === "salaries" ? (
              <SalaryPage sals={sals} setSals={setSals} cfg={cfg} salCosts={salCosts} arrV={totalRevenue} assets={assets} setAssets={setAssets} setTab={setTab} onNavigate={navigateWithToast} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} pendingAdd={pendingAdd && pendingAdd.target === "salaries" ? pendingAdd : null} onClearPendingAdd={clearPendingAdd} pendingEdit={pendingEdit && pendingEdit.target === "salaries" ? pendingEdit : null} onClearPendingEdit={clearPendingEdit} pendingDuplicate={pendingDuplicate && pendingDuplicate.target === "salaries" ? pendingDuplicate : null} onClearPendingDuplicate={clearPendingDuplicate} esopEnabled={esopEnabled} />
            ) : null}

            {tab === "equipment" ? (
              <AmortissementPage assets={assets} setAssets={setAssets} cfg={cfg} setTab={setTab} onNavigate={navigateWithToast} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} pendingAdd={pendingAdd && pendingAdd.target === "equipment" ? pendingAdd : null} onClearPendingAdd={clearPendingAdd} pendingEdit={pendingEdit && pendingEdit.target === "equipment" ? pendingEdit : null} onClearPendingEdit={clearPendingEdit} pendingDuplicate={pendingDuplicate && pendingDuplicate.target === "equipment" ? pendingDuplicate : null} onClearPendingDuplicate={clearPendingDuplicate} />
            ) : null}

            {tab === "changelog" ? (
              <ChangelogPage />
            ) : null}

            {tab === "credits" ? (
              <CreditsPage />
            ) : null}


            {tab === "sensitivity" ? (
              <SensitivityPage
                totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                salCosts={salCosts} ebit={ebit} cfg={cfg}
              />
            ) : null}

            {tab === "equity" ? (
              <EquityPage cfg={cfg} grants={grants} setGrants={setGrants} poolSize={poolSize} setPoolSize={setPoolSize} esopEnabled={esopEnabled} setEsopEnabled={setEsopEnabled} sals={sals} setSals={setSals} setTab={setTab} onNavigate={navigateWithToast} shareholders={shareholders} />
            ) : null}

            {tab === "captable" ? (
              <CapTablePage
                shareholders={shareholders} setShareholders={setShareholders}
                grants={grants} sals={sals}
                cfg={cfg} setCfg={setCfg}
                chartPalette={chartPalette} chartPaletteMode={chartPaletteMode}
                onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
                setTab={setTab} onNavigate={navigateWithToast}
                esopEnabled={esopEnabled} poolSize={poolSize}
              />
            ) : null}

            {tab === "pact" ? (
              <PactPage cfg={cfg} setCfg={setCfg} shareholders={shareholders} setTab={setTab} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentObj.rgb} />
            ) : null}

            {tab === "debt" ? (
              <DebtPage debts={debts} setDebts={setDebts} ebit={ebit} capitalSocial={cfg.capitalSocial} cfg={cfg} setCfg={setCfg} setTab={setTab} onNavigate={navigateWithToast} crowdfunding={crowdfunding} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} pendingAdd={pendingAdd && pendingAdd.target === "debt" ? pendingAdd : null} onClearPendingAdd={clearPendingAdd} pendingEdit={pendingEdit && pendingEdit.target === "debt" ? pendingEdit : null} onClearPendingEdit={clearPendingEdit} pendingDuplicate={pendingDuplicate && pendingDuplicate.target === "debt" ? pendingDuplicate : null} onClearPendingDuplicate={clearPendingDuplicate} />
            ) : null}

            {tab === "crowdfunding" ? (
              <CrowdfundingPage appCfg={cfg} crowdfunding={crowdfunding} setCrowdfunding={setCrowdfunding} setTab={setTab} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} />
            ) : null}

            {tab === "affiliation" ? (
              <AffiliationPage appCfg={cfg} affiliation={affiliation} setAffiliation={setAffiliation} setTab={setTab} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} />
            ) : null}

            {tab === "production" ? (
              <ProductionPage appCfg={cfg} production={production} setProduction={setProduction} streams={streams} setStreams={setStreams} costs={costs} setCosts={setCosts} sals={sals} stocks={stocks} setStocks={setStocks} setTab={setTab} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} />
            ) : null}

            {TOOLS_TABS.indexOf(tab) >= 0 ? (
              <ToolsPage activeTab={tab} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} />
            ) : null}

            {tab === "stocks" ? (
              <StocksPage stocks={stocks} setStocks={setStocks} cfg={cfg} setTab={setTab} chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb} pendingAdd={pendingAdd && pendingAdd.target === "stocks" ? pendingAdd : null} onClearPendingAdd={clearPendingAdd} pendingEdit={pendingEdit && pendingEdit.target === "stocks" ? pendingEdit : null} onClearPendingEdit={clearPendingEdit} pendingDuplicate={pendingDuplicate && pendingDuplicate.target === "stocks" ? pendingDuplicate : null} onClearPendingDuplicate={clearPendingDuplicate} />
            ) : null}

            {tab === "marketing" || tab === "mkt_campaigns" || tab === "mkt_channels" || tab === "mkt_budget" || tab === "mkt_conversions" ? (
              <MarketingPage
                marketing={marketing}
                setMarketing={setMarketing}
                cfg={cfg}
                activeTab={tab}
                setTab={setTab}
                isPaid={marketingPaid}
                isEnabled={marketingEnabled}
                costs={costs}
                setCosts={setCosts}
                streams={streams}
                onOpenModuleSettings={function () { setTab("set", { section: "modules" }); }}
                chartPalette={chartPalette} chartPaletteMode={chartPaletteMode} onChartPaletteChange={onChartPaletteChange} accentRgb={accentRgb}
              />
            ) : null}

            {tab === "profile" ? (
              <ProfilePage cfg={cfg} setCfg={setCfg} />
            ) : null}

            {tab === "set" ? (
              <SettingsPage
                cfg={cfg} setCfg={setCfg} setCosts={setCosts}
                setSals={setSals}
                setGrants={setGrants} setPoolSize={setPoolSize}
                setShareholders={setShareholders} setRoundSim={setRoundSim}
                setStreams={setStreams} setEsopEnabled={setEsopEnabled}
                marketing={marketing} setMarketing={setMarketing}
                initialSection={settingsSection}
                getSnapshot={getFullSnapshot}
              />
            ) : null}

            {/* Admin renders in dedicated AdminLayout — see gate above */}

            {tab === "dev-tooltips" && devMode ? (
              <TooltipRegistryPage />
            ) : null}

            {tab === "dev-calc" && devMode ? (
              <DebugCalculationsPage
                cfg={cfg} totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                ebit={ebit} netP={netP} costs={costs} sals={sals}
                streams={streams} debts={debts} grants={grants}
                esopMonthly={esopMonthly} esopEnabled={esopEnabled}
                opCosts={opCosts} salCosts={salCosts}
                isoc={isoc} isocR={isocR} isocS={isocS} isocEff={isocEff}
                annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
                resLeg={resLeg} bizKpis={bizKpis}
              />
            ) : null}

            {tab === "dev-tokens" && devMode ? (
              <DesignTokensPage />
            ) : null}

            {tab === "dev-roadmap" && devMode ? (
              <RoadmapPage />
            ) : null}

            {tab === "dev-sitemap" && devMode ? (
              <SitemapPage />
            ) : null}

            {tab === "dev-perf" && devMode ? (
              <PerformanceMonitorPage />
            ) : null}

            </PageTransition>
            </PagePerfProfiler>
          </Suspense>
          </PagePerfProvider>
        </main>

      </div>

      {presMode ? (
        <Suspense fallback={null}>
          <PresentationMode
            data={{
              companyName: cfg.companyName,
              totalRevenue: totalRevenue,
              ebit: ebit,
              ebitMargin: totalRevenue > 0 ? ebit / totalRevenue : 0,
              netP: netP,
              monthlyCosts: monthlyCosts,
              arpuMonthly: 0,
              ltv: 0,
              ltvCac: 0,
              isProfitable: totalRevenue / 12 >= monthlyCosts,
              runway: totalRevenue / 12 < monthlyCosts ? (cfg.initialCash || 0) / (monthlyCosts - totalRevenue / 12) : Infinity,
              netBurn: monthlyCosts - totalRevenue / 12,
              cash: cfg.initialCash || 0,
            }}
            t={t.overview}
            onClose={function () { setPresMode(false); }}
          />
        </Suspense>
      ) : null}

      <Suspense fallback={null}>
        <CommandPalette
          open={showCmdPalette}
          onClose={function () { setShowCmdPalette(false); }}
          setTab={setTab}
          tab={tab}
          currentTabItems={currentTabItems}
          allTabItems={allTabItems}
          onUndo={function () { history.undo(); }}
          onRedo={function () { history.redo(); }}
          onExport={function () { setShowExport(true); }}
          onShare={function () { setShowShareModal(true); }}
          onPresentation={function () { setPresMode(function (v) { return !v; }); }}
          onToggleAccounting={function () { setCfg(function (prev) { return Object.assign({}, prev, { showPcmn: !prev.showPcmn }); }); }}
          accountingMode={cfg && cfg.showPcmn}
          onToggleToolbar={function () { setShowToolbar(function (v) { return !v; }); }}
          toolbarVisible={showToolbar}
          onAdd={handleQuickAdd}
          onEdit={handleQuickEdit}
          onDuplicate={handleQuickDuplicate}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DevCommandPalette
          open={showDevPalette}
          onClose={function () { setShowDevPalette(false); }}
          setTab={setTab}
          onRandomizeAll={randomizeAll}
          onToggleSpacingInspector={function () { setShowSpacingInspector(function (v) { return !v; }); }}
          onResetOnboarding={function () { setCfg(function (prev) { return Object.assign({}, prev, { companyName: "" }); }); }}
          onResetTasks={function () {
            setOnboardingTasksSkipped(false);
            setStreams(JSON.parse(JSON.stringify(REVENUE_DEF)));
            setCosts(JSON.parse(JSON.stringify(COST_DEF)));
            setSals(JSON.parse(JSON.stringify(SAL_DEF)));
            setTab("overview");
          }}
        />
      </Suspense>

      {showSpacingInspector ? (
        <Suspense fallback={null}>
          <SpacingInspector enabled={showSpacingInspector} onClose={function () { setShowSpacingInspector(false); }} />
        </Suspense>
      ) : null}

      {chordPending ? (
        <Suspense fallback={null}>
          <ChordPalette
            chordNav={CHORD_NAV.current}
            onSelect={function (tabId) { setTab(tabId); setChordPending(null); }}
            onDismiss={function () { setChordPending(null); }}
          />
        </Suspense>
      ) : null}

      {navToast ? (
        <NavigationToast
          key={navToast.key}
          fromTab={navToast.from}
          onBack={function () { setTab(navToast.from); }}
          onDismiss={function () { setNavToast(null); }}
        />
      ) : null}

      <GlossaryDrawer />
      <GlossaryFab />

      <Suspense fallback={null}>
        <FloatingToolbar
          tab={tab}
          setTab={setTab}
          visible={showToolbar}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          unlockedModules={unlockedModules}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ExportImportModal
          open={showExport}
          onClose={function () { setShowExport(false); }}
          cfg={cfg} costs={costs} sals={sals}
          grants={grants} poolSize={poolSize} shareholders={shareholders}
          roundSim={roundSim} streams={streams} esopEnabled={esopEnabled} debts={debts}
          planSections={planSections}
          setCfg={setCfg} setCosts={setCosts} setSals={setSals}
          setGrants={setGrants} setPoolSize={setPoolSize}
          setShareholders={setShareholders} setRoundSim={setRoundSim}
          setStreams={setStreams} setEsopEnabled={setEsopEnabled} setDebts={setDebts}
          setPlanSections={setPlanSections}
        />
      </Suspense>

      {/* ── Share Modal ── */}
      {showShareModal ? (
        <Suspense fallback={null}>
          <ShareModal
            open={showShareModal}
            onClose={function () { setShowShareModal(false); }}
            workspaceId={auth.workspaceId}
            workspaceName={cfg ? cfg.companyName : ""}
            isPro={false}
            isSolo={cfg && (cfg.legalForm === "ei" || cfg.legalForm === "EI")}
          />
        </Suspense>
      ) : null}

      {createPortal(
        <div ref={overlayRef} style={{
          display: "none", position: "fixed", inset: 0, zIndex: 999,
          background: "var(--brand)", pointerEvents: "none",
        }} />,
        document.body
      )}
    </>
  );

  if (collabEnabled) {
    return (
      <PresenceProvider
        workspaceId={auth.workspaceId}
        userId={auth.user.id}
        displayName={auth.user.displayName}
      >
        <LockProvider
          workspaceId={auth.workspaceId}
          userId={auth.user.id}
          displayName={auth.user.displayName}
        >
          {mainContent}
        </LockProvider>
      </PresenceProvider>
    );
  }

  return mainContent;
}
