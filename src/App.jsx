import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import gsap from "gsap";
import { useHotkeys } from "react-hotkeys-hook";
import { useT, useLang, useDevMode } from "./context";
import { openInvestorReport } from "./utils/printReport";

import { DEFAULT_CONFIG, STORAGE_KEY, VERSION } from "./constants/config";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF, REVENUE_DEF, DEBT_DEF, PLAN_SECTIONS_DEF, applyCostPreset } from "./constants/defaults";
import { Banner, PageTransition, DevBanner } from "./components";
import Sidebar from "./components/Sidebar";
import OnboardingWizard from "./components/OnboardingWizard";
import ExportImportModal from "./components/ExportImportModal";
import PresentationMode from "./components/PresentationMode";
import CommandPalette from "./components/KeyboardShortcuts";
import useHistory from "./hooks/useHistory";

import { salCalc, calcIsoc, grantCalc, load, save, setCurrencyDisplay } from "./utils";
import { OverviewPage } from "./pages";
import { OperatingCostsPage } from "./pages";
import { SettingsPage } from "./pages";
import { EquityPage } from "./pages";
import { CapTablePage } from "./pages";
import { PactPage } from "./pages";
import { DebtPage } from "./pages";
import { CashFlowPage } from "./pages";
import { RevenueStreamsPage } from "./pages";
import { AccountingPage } from "./pages";
import { RatiosPage } from "./pages";
import { FinancialPlanPage } from "./pages";
import SharedLinkPage from "./pages/SharedLinkPage";
import { SalaryPage } from "./pages";
import { AmortissementPage } from "./pages";
import { ChangelogPage, CreditsPage, ProfilePage } from "./pages";

function migrateStreams(streams) {
  if (!streams || !streams.length) return JSON.parse(JSON.stringify(REVENUE_DEF));
  // Old flat format: items with {id, name, y1, ...}
  if (streams[0].id && streams[0].name && !streams[0].items) {
    return [{
      cat: "Chiffre d'affaires",
      pcmn: "70",
      items: streams.map(function (s) {
        return { id: s.id, l: s.name, y1: s.y1 || 0, pcmn: "7020", sub: "Services" };
      }),
    }];
  }
  // Already new hierarchical format
  return streams;
}

function defaultSnapshot() {
  return {
    cfg: { ...DEFAULT_CONFIG },
    costs: JSON.parse(JSON.stringify(COST_DEF)),
    sals: JSON.parse(JSON.stringify(SAL_DEF)),
    grants: JSON.parse(JSON.stringify(GRANT_DEF)),
    poolSize: POOL_SIZE_DEF,
    shareholders: JSON.parse(JSON.stringify(CAPTABLE_DEF)),
    roundSim: { ...ROUND_SIM_DEF },
    streams: JSON.parse(JSON.stringify(REVENUE_DEF)),
    esopEnabled: false,
    debts: JSON.parse(JSON.stringify(DEBT_DEF)),
    planSections: JSON.parse(JSON.stringify(PLAN_SECTIONS_DEF)),
  };
}

var PRESET_SCENARIOS = [
  { id: 1, name: "base", color: "var(--text-muted)", build: defaultSnapshot },
];

export default function App() {
  var t = useT();
  var { lang } = useLang();
  var { devMode, toggle: toggleDevMode } = useDevMode();
  var [devBannerVisible, setDevBannerVisible] = useState(devMode);
  var dtApp = (cfg && cfg.devTiming) || {};
  var deinitTotal = (dtApp.deinitMs != null ? dtApp.deinitMs : 1800) + (dtApp.exitMs != null ? dtApp.exitMs : 300);
  useEffect(function () {
    if (devMode) { setDevBannerVisible(true); return; }
    var id = setTimeout(function () { setDevBannerVisible(false); }, deinitTotal);
    return function () { clearTimeout(id); };
  }, [devMode]);
  // Hash-based routing: /#/overview, /#/streams, etc.
  var VALID_TABS = ["overview","plan","streams","opex","salaries","cashflow","debt","amortissement","accounting","ratios","equity","captable","pact","set","profile","changelog","credits"];
  function getTabFromHash() {
    var h = window.location.hash.replace(/^#\/?/, "");
    return VALID_TABS.indexOf(h) >= 0 ? h : "overview";
  }
  var [tab, setTabRaw] = useState(getTabFromHash);
  function setTab(id) {
    setTabRaw(id);
    window.history.replaceState(null, "", "#/" + id);
  }
  useEffect(function () { window.scrollTo(0, 0); }, [tab]);
  useEffect(function () {
    function onNav(e) { if (e.detail) setTab(e.detail); }
    function onHash() { setTabRaw(getTabFromHash()); }
    window.addEventListener("nav-tab", onNav);
    window.addEventListener("hashchange", onHash);
    return function () { window.removeEventListener("nav-tab", onNav); window.removeEventListener("hashchange", onHash); };
  }, []);
  var [ready, setReady] = useState(false);
  var [cfg, setCfg] = useState({ ...DEFAULT_CONFIG });
  var [costs, setCosts] = useState(JSON.parse(JSON.stringify(COST_DEF)));
  var [sals, setSals] = useState(JSON.parse(JSON.stringify(SAL_DEF)));
  var [scenarios, setScenarios] = useState(function () {
    return PRESET_SCENARIOS.map(function (ps) {
      return { id: ps.id, name: ps.name, color: ps.color, data: ps.build() };
    });
  });
  var [activeScenario, setActiveScenario] = useState(1);
  var [grants, setGrants] = useState(JSON.parse(JSON.stringify(GRANT_DEF)));
  var [poolSize, setPoolSize] = useState(POOL_SIZE_DEF);
  var [shareholders, setShareholders] = useState(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
  var [roundSim, setRoundSim] = useState({ ...ROUND_SIM_DEF });
  var [streams, setStreams] = useState(JSON.parse(JSON.stringify(REVENUE_DEF)));
  var [esopEnabled, setEsopEnabled] = useState(false);
  var [debts, setDebts] = useState(JSON.parse(JSON.stringify(DEBT_DEF)));
  var [planSections, setPlanSections] = useState(JSON.parse(JSON.stringify(PLAN_SECTIONS_DEF)));
  var [showOnboarding, setShowOnboarding] = useState(false);
  var [showExport, setShowExport] = useState(false);
  var [presMode, setPresMode] = useState(false);
  var [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  var [showCmdPalette, setShowCmdPalette] = useState(false);
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
      try {
        var encoded = window.location.hash.slice(1);
        if (encoded.length > 500000) throw new Error("hash too large");
        hashData = JSON.parse(decodeURIComponent(atob(encoded)));
        window.history.replaceState(null, "", window.location.pathname);
      } catch (e) {
        hashError = true;
        window.history.replaceState(null, "", window.location.pathname);
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
        setShowOnboarding(true);
        fromOnboarding.current = true;
      }
      setReady(true);
    });
    load(STORAGE_KEY + "_sc").then(function (sc) {
      if (sc && Array.isArray(sc) && sc.length > 0) {
        setScenarios(sc);
        var aId = sc[0].id;
        setActiveScenario(aId);
      }
    });
  }, []);

  useEffect(function () {
    if (ready && !showOnboarding) save(STORAGE_KEY, { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections });
  }, [cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections, ready, showOnboarding]);

  useEffect(function () {
    if (ready) save(STORAGE_KEY + "_sc", scenarios);
  }, [scenarios, ready]);

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

  // Scenario management
  var COLORS = ["var(--text-muted)", "var(--color-success)", "var(--color-warning)", "var(--color-error)", "var(--brand)"];

  function scenarioSnapshot() {
    return { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts, planSections };
  }

  function handleScenarioSwitch(id) {
    setScenarios(function (prev) {
      var updated = prev.map(function (sc) {
        if (sc.id === activeScenario) return { ...sc, data: scenarioSnapshot() };
        return sc;
      });
      var target = updated.find(function (s) { return s.id === id; });
      applySnapshot(target && target.data ? target.data : defaultSnapshot());
      setActiveScenario(id);
      return updated;
    });
  }

  function handleScenarioSave() {
    var newId = Date.now();
    setScenarios(function (prev) {
      var updated = prev.map(function (sc) {
        if (sc.id === activeScenario) return { ...sc, data: scenarioSnapshot() };
        return sc;
      });
      var color = COLORS[updated.length % COLORS.length];
      return updated.concat({ id: newId, name: t.scenarios.new_scenario, color: color, data: JSON.parse(JSON.stringify(scenarioSnapshot())) });
    });
    setActiveScenario(newId);
  }

  function handleScenarioDelete(id) {
    setScenarios(function (prev) {
      if (prev.length <= 1) return prev;
      var remaining = prev.filter(function (s) { return s.id !== id; });
      if (activeScenario === id && remaining.length > 0) {
        var target = remaining[0];
        applySnapshot(target.data || defaultSnapshot());
        setActiveScenario(target.id);
      }
      return remaining;
    });
  }

  function handleScenarioDuplicate(id) {
    var src = scenarios.find(function (s) { return s.id === id; });
    if (!src) return;
    var data = id === activeScenario ? scenarioSnapshot() : (src.data || scenarioSnapshot());
    var newId = Date.now();
    var color = COLORS[scenarios.length % COLORS.length];
    setScenarios(function (prev) {
      return prev.concat({ id: newId, name: src.name + t.scenarios.copy_suffix, color: color, data: JSON.parse(JSON.stringify(data)) });
    });
  }

  function handleScenarioRename(id, name) {
    setScenarios(function (prev) {
      return prev.map(function (sc) {
        if (sc.id === id) return { ...sc, name: name };
        return sc;
      });
    });
  }

  // Global keyboard shortcuts
  var tabMap = useRef({ "1": "overview", "2": "plan", "3": "streams", "4": "opex", "5": "salaries", "6": "cashflow", "7": "debt", "8": "accounting", "9": "ratios" });
  var hotkeyOpts = { preventDefault: true, enableOnFormTags: false };

  useHotkeys("mod+z", function () { history.undo(); }, hotkeyOpts, [history]);
  useHotkeys("mod+shift+z, mod+y", function () { history.redo(); }, hotkeyOpts, [history]);
  useHotkeys("mod+s", function () { setShowExport(true); }, hotkeyOpts);
  useHotkeys("mod+p", function () { setPresMode(function (v) { return !v; }); }, hotkeyOpts);
  // Documentation link removed (Astro docs deleted)
  useHotkeys("mod+k", function () { setShowCmdPalette(function (v) { return !v; }); }, hotkeyOpts);
  useHotkeys("mod+shift+d", function () { toggleDevMode(); }, hotkeyOpts, [toggleDevMode]);
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
    var total = 0;
    streams.forEach(function (cat) {
      (cat.items || []).forEach(function (item) { total += (item.y1 || 0); });
    });
    return total;
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
            setShowOnboarding(true);
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
      <div ref={dashRef} style={{ fontFamily: "'DM Sans',Inter,system-ui,sans-serif", display: "flex", background: "var(--bg-page)", minHeight: "100vh", color: "var(--text-primary)", paddingTop: devBannerVisible ? 32 : 0, transition: "padding-top 0.3s ease" }}>
        <Sidebar
          tab={tab} setTab={setTab}
          onOpenExport={function () { setShowExport(true); }}
          onOpenSearch={function () { setShowCmdPalette(true); }}
          collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
          cfg={cfg}
          totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
        />

        <main style={{ flex: 1, padding: "var(--page-py) var(--page-px)", maxWidth: "var(--page-max)", margin: "0 auto", minWidth: 0 }}>
          <PageTransition tabKey={tab}>
            {tab === "overview" ? (
              <OverviewPage
                arrV={0} totalRevenue={totalRevenue} extraStreamsMRR={0}
                monthlyCosts={monthlyCosts} totS={0} annC={annC}
                ebitda={ebitda} annualInterest={annualInterest}
                isocR={isocR} isocS={isocS} isoc={isoc} isocEff={isocEff}
                netP={netP} resLeg={resLeg} resTarget={resTarget} dirRem={dirRem} dirOk={dirOk}
                divGross={divGross} mGross={0} strPct={0} strNeed={0} cfg={cfg}
                annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
                streams={streams} debts={debts} onPrint={handlePrint} profs={[]} setTab={setTab}
                marketingData={{ monthly: 0, annual: 0, channels: [] }}
              />
            ) : null}

            {tab === "plan" ? (
              <FinancialPlanPage
                totalRevenue={totalRevenue}
                monthlyCosts={monthlyCosts} opCosts={opCosts} salCosts={salCosts}
                ebitda={ebitda} netP={netP}
                sals={sals} cfg={cfg}
                planSections={planSections} setPlanSections={setPlanSections}
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
                commData={{ total: 0, monthlyCost: 0, byEmployee: {}, byPartner: {} }}
                infraData={{ monthly: 0, annual: 0 }}
              />
            ) : null}

            {tab === "ratios" ? (
              <RatiosPage
                cfg={cfg} totalRevenue={totalRevenue} monthlyCosts={monthlyCosts}
                ebitda={ebitda} netP={netP} resLeg={resLeg} debts={debts}
                sals={sals} salCosts={salCosts}
                esopMonthly={esopMonthly} esopEnabled={esopEnabled}
              />
            ) : null}

            {tab === "streams" ? (
              <RevenueStreamsPage streams={streams} setStreams={setStreams} annC={annC} />
            ) : null}

            {tab === "cashflow" ? (
              <CashFlowPage
                arrV={0} totalRevenue={totalRevenue} extraStreamsMRR={0}
                monthlyCosts={monthlyCosts} annC={annC}
                ebitda={ebitda} netP={netP} totS={0}
                cfg={cfg} setCfg={setCfg}
              />
            ) : null}

            {tab === "opex" ? (
              <OperatingCostsPage
                costs={costs} setCosts={setCosts} sals={sals}
                cfg={cfg} monthlyCosts={monthlyCosts} salCosts={salCosts} opCosts={opCosts}
                arrV={0} resLeg={resLeg} isoc={isoc} setTab={setTab}
                infraData={{ monthly: 0, annual: 0 }}
                marketingData={{ monthly: 0, annual: 0, channels: [] }}
              />
            ) : null}

            {tab === "salaries" ? (
              <SalaryPage sals={sals} setSals={setSals} cfg={cfg} salCosts={salCosts} arrV={totalRevenue} setTab={setTab} />
            ) : null}

            {tab === "amortissement" ? (
              <AmortissementPage costs={costs} setCosts={setCosts} cfg={cfg} />
            ) : null}

            {tab === "changelog" ? (
              <ChangelogPage />
            ) : null}

            {tab === "credits" ? (
              <CreditsPage />
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
              <DebtPage debts={debts} setDebts={setDebts} ebitda={ebitda} capitalSocial={cfg.capitalSocial} />
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
              />
            ) : null}
          </PageTransition>
        </main>

      </div>

      {presMode ? (
        <PresentationMode
          data={{
            companyName: cfg.companyName,
            totalRevenue: totalRevenue,
            totS: 0,
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
      />

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

      <div ref={overlayRef} style={{
        display: "none", position: "fixed", inset: 0, zIndex: 999,
        background: "var(--brand)", pointerEvents: "none",
      }} />
    </>
  );
}
