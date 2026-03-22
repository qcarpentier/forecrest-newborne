import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useHotkeys } from "react-hotkeys-hook";
import { useT, useLang, useDevMode, useGlossary } from "./context";
import { openInvestorReport } from "./utils/printReport";

import { DEFAULT_CONFIG, STORAGE_KEY, VERSION } from "./constants/config";
import { ACCENT_PALETTE } from "./constants/colors";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF, REVENUE_DEF, DEBT_DEF, PLAN_SECTIONS_DEF, applyCostPreset } from "./constants/defaults";
import { Banner, PageTransition, DevBanner } from "./components";
import GlossaryDrawer, { GlossaryFab } from "./components/GlossaryDrawer";
import AccountantBar from "./components/AccountantBar";
import Sidebar from "./components/Sidebar";
import OnboardingWizard from "./components/OnboardingWizard";
import ExportImportModal from "./components/ExportImportModal";
import PresentationMode from "./components/PresentationMode";
import CommandPalette from "./components/KeyboardShortcuts";
import DevCommandPalette from "./components/DevCommandPalette";
import useHistory from "./hooks/useHistory";

import { salCalc, calcIsoc, grantCalc, calcBusinessKpis, calcTotalRevenue, migrateStreamsV1ToV2, load, save, setCurrencyDisplay } from "./utils";
import { OverviewPage } from "./pages";
import { OperatingCostsPage } from "./pages";
import { SettingsPage } from "./pages";
import { EquityPage } from "./pages";
import { CapTablePage } from "./pages";
import { PactPage } from "./pages";
import { DebtPage } from "./pages";
import { CrowdfundingPage } from "./pages";
import { CashFlowPage } from "./pages";
import { RevenueStreamsPage } from "./pages";
import { AccountingPage } from "./pages";
import { RatiosPage } from "./pages";

import SharedLinkPage from "./pages/SharedLinkPage";
import { SalaryPage } from "./pages";
import { AmortissementPage } from "./pages";
import { ChangelogPage, CreditsPage, ProfilePage, SensitivityPage } from "./pages";
import TooltipRegistryPage from "./pages/TooltipRegistryPage";
import DebugCalculationsPage from "./pages/DebugCalculationsPage";
import DesignTokensPage from "./pages/DesignTokensPage";

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

export default function App() {
  var t = useT();
  var { lang } = useLang();
  var { devMode, toggle: toggleDevMode } = useDevMode();
  var { setFinancials: setGlossaryFinancials, registerSetTab: registerGlossarySetTab, setCurrentTab: setGlossaryCurrentTab } = useGlossary();
  var [devBannerVisible, setDevBannerVisible] = useState(devMode);
  // Hash-based routing: /#/overview, /#/streams, etc.
  var VALID_TABS = ["overview","streams","opex","salaries","cashflow","debt","equipment","accounting","ratios","sensitivity","equity","captable","pact","set","profile","changelog","credits","dev-tooltips","dev-calc","dev-tokens"];
  function getTabFromHash() {
    var h = window.location.hash.replace(/^#\/?/, "");
    return VALID_TABS.indexOf(h) >= 0 ? h : "overview";
  }
  var [tab, setTabRaw] = useState(getTabFromHash);
  var [settingsSection, setSettingsSection] = useState(null);
  function setTab(id, opts) {
    setTabRaw(id);
    window.history.replaceState(null, "", "#/" + id);
    if (opts && opts.section) { setSettingsSection(opts.section); } else { setSettingsSection(null); }
  }
  useEffect(function () { window.scrollTo(0, 0); }, [tab]);

  /* Global animation toggle — applies .no-transition to <html> */
  useEffect(function () {
    if (!cfg) return;
    if (cfg.animationsEnabled === false) {
      document.documentElement.classList.add("no-transition");
    } else {
      document.documentElement.classList.remove("no-transition");
    }
  }, [cfg && cfg.animationsEnabled]);
  useEffect(function () { registerGlossarySetTab(setTab); }, [registerGlossarySetTab]);
  useEffect(function () { setGlossaryCurrentTab(tab); }, [tab, setGlossaryCurrentTab]);
  useEffect(function () {
    function onNav(e) { if (e.detail) setTab(e.detail); }
    function onHash() { setTabRaw(getTabFromHash()); }
    window.addEventListener("nav-tab", onNav);
    window.addEventListener("hashchange", onHash);
    return function () { window.removeEventListener("nav-tab", onNav); window.removeEventListener("hashchange", onHash); };
  }, []);
  var [ready, setReady] = useState(false);
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

  var [costs, setCosts] = useState(JSON.parse(JSON.stringify(COST_DEF)));
  var [sals, setSals] = useState(JSON.parse(JSON.stringify(SAL_DEF)));
  var [grants, setGrants] = useState(JSON.parse(JSON.stringify(GRANT_DEF)));
  var [poolSize, setPoolSize] = useState(POOL_SIZE_DEF);
  var [shareholders, setShareholders] = useState(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
  var [roundSim, setRoundSim] = useState({ ...ROUND_SIM_DEF });
  var [streams, setStreams] = useState(JSON.parse(JSON.stringify(REVENUE_DEF)));
  var [esopEnabled, setEsopEnabled] = useState(false);
  var [debts, setDebts] = useState(JSON.parse(JSON.stringify(DEBT_DEF)));
  var [crowdfunding, setCrowdfunding] = useState({ enabled: false, name: "", platform: "ulule", goal: 0, url: "", tiers: [] });
  var [assets, setAssets] = useState([]);
  var [planSections, setPlanSections] = useState(JSON.parse(JSON.stringify(PLAN_SECTIONS_DEF)));
  var [showOnboarding, setShowOnboarding] = useState(false);
  var [showExport, setShowExport] = useState(false);
  var [presMode, setPresMode] = useState(false);
  var [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  var [showCmdPalette, setShowCmdPalette] = useState(false);
  var [showDevPalette, setShowDevPalette] = useState(false);
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
    if (d.assets) setAssets(d.assets);
    if (d.planSections) setPlanSections(d.planSections);
  }, []);

  var history = useHistory(getSnapshot, applySnapshot);

  var historyTimer = useRef(null);
  useEffect(function () {
    if (!ready || showOnboarding) return;
    clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(function () { history.push(); }, 400);
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections, ready, showOnboarding, history]);

  useEffect(function () {
    var m = t.meta && t.meta[tab];
    document.title = m ? m.title : (t.meta ? t.meta.site : "Forecrest");
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
      // Skip navigation hashes like #/overview — only try shared-link decode
      if (raw.charAt(0) !== "/") {
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
    if (ready && !showOnboarding) save(STORAGE_KEY, { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, crowdfunding });
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, assets, planSections, ready, showOnboarding]);

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
  var tabMap = useRef({ "1": "overview", "2": "streams", "3": "opex", "4": "salaries", "5": "cashflow", "6": "debt", "7": "accounting", "8": "ratios" });
  var hotkeyOpts = { preventDefault: true, enableOnFormTags: false };

  useHotkeys("mod+z", function () { history.undo(); }, hotkeyOpts, [history]);
  useHotkeys("mod+shift+z, mod+y", function () { history.redo(); }, hotkeyOpts, [history]);
  useHotkeys("mod+s", function () { setShowExport(true); }, hotkeyOpts);
  useHotkeys("mod+p", function () { setPresMode(function (v) { return !v; }); }, hotkeyOpts);
  // Documentation link removed (Astro docs deleted)
  useHotkeys("mod+k", function () { setShowCmdPalette(function (v) { return !v; }); }, hotkeyOpts);
  useHotkeys("mod+shift+d", function () { toggleDevMode(); }, hotkeyOpts, [toggleDevMode]);
  useHotkeys("mod+shift+e", function () { setCfg(function (prev) { return Object.assign({}, prev, { showPcmn: !prev.showPcmn }); }); }, hotkeyOpts, []);
  useHotkeys("mod+shift+k", function () { if (devMode) setShowDevPalette(function (v) { return !v; }); }, hotkeyOpts, [devMode]);
  useHotkeys("1,2,3,4,5,6,7,8,9", function (e) {
    var tab = tabMap.current[e.key];
    if (tab) setTab(tab);
  }, { enableOnFormTags: false });

  // ── Financial calculations ──

  var opCosts = useMemo(function () {
    var t = 0;
    costs.forEach(function (c) {
      c.items.forEach(function (i) { t += i.pu ? i.a * (i.u || 1) : i.a; });
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
    return calcTotalRevenue(streams);
  }, [streams]);

  var annC = monthlyCosts * 12;
  var ebitda = totalRevenue - annC;
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
  var ebt = ebitda - annualInterest;
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
  var annVatC = cfg.vat > 0 ? totalRevenue * cfg.vat / (1 + cfg.vat) : 0;
  var annVatD = cfg.vat > 0 ? monthlyCosts * 12 * cfg.vat / (1 + cfg.vat) : 0;
  var vatBalance = annVatC - annVatD;

  var bizKpis = useMemo(function () {
    return calcBusinessKpis(cfg.businessType, {
      totalRevenue: totalRevenue, monthlyCosts: monthlyCosts,
      ebitda: ebitda, netP: netP, cfg: cfg, sals: sals,
      streams: streams, debts: debts,
    });
  }, [cfg, totalRevenue, monthlyCosts, ebitda, netP, sals, streams, debts]);

  /* Push financial values to glossary context for live display */
  useEffect(function () {
    var totalMRR = totalRevenue / 12;
    setGlossaryFinancials({
      monthlyRevenue: totalMRR,
      annualRevenue: totalRevenue,
      totalCosts: annC,
      fixedCosts: annC, /* simplified — could split fixed/variable */
      ebitda: ebitda,
      ebitdaMargin: totalRevenue > 0 ? Math.round(ebitda / totalRevenue * 100) : 0,
      netProfit: netP,
      isoc: isoc,
      burnRate: ebitda < 0 ? Math.abs(ebitda / 12) : 0,
      runway: ebitda < 0 && (cfg.initialCash || 0) > 0 ? Math.round((cfg.initialCash || 0) / Math.abs(ebitda / 12)) : null,
      treasury: cfg.initialCash || 0,
      costCoverage: annC > 0 ? Math.round(totalRevenue / annC * 100) : null,
      salaryCost: salCosts * 12,
    });
  }, [totalRevenue, annC, ebitda, netP, isoc, cfg.initialCash, salCosts, setGlossaryFinancials]);

  function handlePrint() {
    var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
    var monthlyRevenue = totalRevenue / 12;
    var isProfitable = monthlyRevenue >= monthlyCosts;
    var netBurn = monthlyCosts - monthlyRevenue;
    var frV = cfg.capitalSocial + resLeg + netP;
    var bfrV = -monthlyCosts;
    openInvestorReport({
      totalRevenue: totalRevenue, totalMRR: totalRevenue / 12, totS: 0,
      monthlyCosts: monthlyCosts, ebitda: ebitda, ebitdaMargin: ebitdaMargin, netP: netP,
      isProfitable: isProfitable, netBurn: netBurn,
      divGross: divGross, fr: frV, bfr: bfrV, tresoNette: frV - bfrV,
      ltv: 0, ltvCac: 0, payback: 0, arpuMonthly: 0,
      cfg: cfg, resLeg: resLeg, isoc: isoc, vatBalance: vatBalance,
    }, lang);
  }

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <span style={{ color: "var(--text-faint)", fontSize: 14 }}>{t.loading}</span>
      </div>
    );
  }

  if (sharedLink && ready) {
    return (
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
    );
  }

  if (showOnboarding) {
    return (
      <div style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", background: "var(--bg-page)", minHeight: "100vh", color: "var(--text-primary)" }}>
        <OnboardingWizard
          sals={sals} costs={costs} cfg={cfg} streams={streams}
          setSals={setSals} setCosts={setCosts} setCfg={setCfg} setStreams={setStreams}
          onComplete={function () { setShowOnboarding(false); }}
        />
      </div>
    );
  }

  return (
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
        />

        <main style={{ flex: 1, padding: "var(--page-py) var(--page-px)", maxWidth: "var(--page-max)", margin: "0 auto", minWidth: 0 }}>
          <PageTransition tabKey={tab} animate={!cfg || cfg.animationsEnabled !== false}>
            {tab === "overview" ? (
              <OverviewPage
                totalRevenue={totalRevenue}
                monthlyCosts={monthlyCosts} annC={annC}
                ebitda={ebitda} annualInterest={annualInterest}
                isocR={isocR} isocS={isocS} isoc={isoc} isocEff={isocEff}
                netP={netP} resLeg={resLeg} resTarget={resTarget} dirRem={dirRem} dirOk={dirOk}
                divGross={divGross} cfg={cfg}
                annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
                streams={streams} debts={debts} onPrint={handlePrint} setTab={setTab}
                bizKpis={bizKpis}
              />
            ) : null}

            {tab === "accounting" ? (
              <AccountingPage
                costs={costs} sals={sals} cfg={cfg} debts={debts} streams={streams}
                totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                opCosts={opCosts} salCosts={salCosts}
                ebitda={ebitda} isoc={isoc} netP={netP} resLeg={resLeg}
                annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
                esopMonthly={esopMonthly} esopEnabled={esopEnabled}
                setCosts={setCosts}
              />
            ) : null}

            {tab === "ratios" ? (
              <RatiosPage
                cfg={cfg} totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                ebitda={ebitda} netP={netP} resLeg={resLeg} debts={debts}
                sals={sals} salCosts={salCosts}
                esopMonthly={esopMonthly} esopEnabled={esopEnabled}
                bizKpis={bizKpis}
              />
            ) : null}

            {tab === "streams" ? (
              <RevenueStreamsPage streams={streams} setStreams={setStreams} annC={annC} businessType={cfg.businessType} />
            ) : null}

            {tab === "cashflow" ? (
              <CashFlowPage
                totalRevenue={totalRevenue}
                monthlyCosts={monthlyCosts} annC={annC}
                ebitda={ebitda}
                cfg={cfg} setCfg={setCfg} setTab={setTab}
              />
            ) : null}

            {tab === "opex" ? (
              <OperatingCostsPage
                costs={costs} setCosts={setCosts}
                cfg={cfg}
                totalRevenue={totalRevenue} debts={debts} assets={assets} sals={sals} crowdfunding={crowdfunding} setTab={setTab}
              />
            ) : null}

            {tab === "salaries" ? (
              <SalaryPage sals={sals} setSals={setSals} cfg={cfg} salCosts={salCosts} arrV={totalRevenue} assets={assets} setAssets={setAssets} setTab={setTab} />
            ) : null}

            {tab === "equipment" ? (
              <AmortissementPage assets={assets} setAssets={setAssets} cfg={cfg} setTab={setTab} />
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
                salCosts={salCosts} ebitda={ebitda} cfg={cfg}
              />
            ) : null}

            {tab === "equity" ? (
              <EquityPage grants={grants} setGrants={setGrants} poolSize={poolSize} setPoolSize={setPoolSize} esopEnabled={esopEnabled} setEsopEnabled={setEsopEnabled} sals={sals} />
            ) : null}

            {tab === "captable" ? (
              <CapTablePage
                shareholders={shareholders} setShareholders={setShareholders}
                roundSim={roundSim} setRoundSim={setRoundSim}
                grants={grants} sals={sals}
                cfg={cfg} setCfg={setCfg}
              />
            ) : null}

            {tab === "pact" ? (
              <PactPage cfg={cfg} setCfg={setCfg} />
            ) : null}

            {tab === "debt" ? (
              <DebtPage debts={debts} setDebts={setDebts} ebitda={ebitda} capitalSocial={cfg.capitalSocial} setTab={setTab} crowdfunding={crowdfunding} />
            ) : null}

            {tab === "crowdfunding" ? (
              <CrowdfundingPage crowdfunding={crowdfunding} setCrowdfunding={setCrowdfunding} setTab={setTab} />
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
                initialSection={settingsSection}
              />
            ) : null}

            {tab === "dev-tooltips" && devMode ? (
              <TooltipRegistryPage />
            ) : null}

            {tab === "dev-calc" && devMode ? (
              <DebugCalculationsPage
                cfg={cfg} totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                ebitda={ebitda} netP={netP} costs={costs} sals={sals}
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

          </PageTransition>
        </main>

      </div>

      {presMode ? (
        <PresentationMode
          data={{
            companyName: cfg.companyName,
            totalRevenue: totalRevenue,
            ebitda: ebitda,
            ebitdaMargin: totalRevenue > 0 ? ebitda / totalRevenue : 0,
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
      ) : null}

      <CommandPalette
        open={showCmdPalette}
        onClose={function () { setShowCmdPalette(false); }}
        setTab={setTab}
        onUndo={function () { history.undo(); }}
        onRedo={function () { history.redo(); }}
        onExport={function () { setShowExport(true); }}
        onPresentation={function () { setPresMode(function (v) { return !v; }); }}
        onToggleAccounting={function () { setCfg(function (prev) { return Object.assign({}, prev, { showPcmn: !prev.showPcmn }); }); }}
        accountingMode={cfg && cfg.showPcmn}
      />

      <DevCommandPalette
        open={showDevPalette}
        onClose={function () { setShowDevPalette(false); }}
        setTab={setTab}
      />

      <GlossaryDrawer />
      <GlossaryFab />

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

      {createPortal(
        <div ref={overlayRef} style={{
          display: "none", position: "fixed", inset: 0, zIndex: 999,
          background: "var(--brand)", pointerEvents: "none",
        }} />,
        document.body
      )}
    </>
  );
}
