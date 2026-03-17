import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Sliders, Sun, Moon, CaretDown, UploadSimple, Browsers, Translate, List, X, BookOpen,
  ChartBar, CurrencyCircleDollar, Article, Wallet, Bank, Receipt,
  Users, ChartPie, UsersThree, ShieldCheck, Scales,
  HourglassSimple, ClockCounterClockwise,
} from "@phosphor-icons/react";
import { useTheme, useDevMode } from "../context";
import { useT, useLang } from "../context";
import logo from "../assets/forecrest-lockup-light.svg";
import logoDev from "../assets/forecrest-lockup-accent.svg";
import { APP_NAME, RELEASE_DATE } from "../constants/config";

var NAV_ICON_MAP = {
  overview: ChartBar,
  streams: CurrencyCircleDollar,
  plan: Article,
  cashflow: Wallet,
  debt: Bank,
  opex: Receipt,
  salaries: Users,
  equity: ChartPie,
  captable: UsersThree,
  pact: ShieldCheck,
  accounting: BookOpen,
  ratios: Scales,
  amortissement: HourglassSimple,
  credits: Scales,
  changelog: ClockCounterClockwise,
  set: Sliders,
};

var NAV_STRUCTURE = [
  { type: "standalone", id: "overview" },
  { type: "standalone", id: "plan" },
  { type: "mega", key: "finances", columns: [
    { key: "finances", items: ["streams", "opex", "salaries"] },
  ]},
  { type: "mega", key: "tresorerie", columns: [
    { key: "tresorerie", items: ["cashflow", "debt", "amortissement"] },
  ]},
  { type: "mega", key: "comptabilite", columns: [
    { key: "comptabilite", items: ["accounting", "ratios"] },
  ]},
  { type: "mega", key: "gouvernance", columns: [
    { key: "gouvernance", items: ["equity", "captable", "pact"] },
  ]},
];

function Divider() {
  return <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0, margin: "0 var(--sp-1)" }} />;
}

function IconBtn({ onClick, title, ariaLabel, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32,
        border: "none",
        borderRadius: "var(--r-md)",
        background: active ? "var(--bg-hover)" : "transparent",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ── Mega-menu item with hover state ── */
function MegaItem({ id, active, tab, setTab, onItemClick, t, isRecent }) {
  var [hov, setHov] = useState(false);
  var Icon = NAV_ICON_MAP[id];
  return (
    <button
      onClick={function () { setTab(id); onItemClick(); }}
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: "var(--sp-2)",
        width: "100%", padding: "var(--sp-2)",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--brand-bg)" : hov ? "var(--bg-accordion)" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.15s ease",
      }}
    >
      {Icon ? <Icon size={16} weight={active ? "fill" : "regular"}
        color={active ? "var(--brand)" : "var(--text-muted)"}
        style={{ flexShrink: 0, marginTop: 2 }} /> : null}
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: active ? 600 : 400,
          color: active ? "var(--brand)" : "var(--text-primary)",
          lineHeight: 1.3,
        }}>
          {t.tabs[id]}
          {isRecent ? <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--color-success)", flexShrink: 0,
          }} /> : null}
        </div>
        {t.nav_desc && t.nav_desc[id] ? (
          <div style={{
            fontSize: 11, color: "var(--text-faint)",
            lineHeight: 1.3, marginTop: 2,
          }}>
            {t.nav_desc[id]}
          </div>
        ) : null}
      </div>
    </button>
  );
}

/* ── Compact dropdown panel for nav groups ── */
function DropdownPanel({ group, tab, setTab, t, onEnter, onLeave, onItemClick, anchorRef }) {
  if (!group) return null;
  var allItems = [];
  group.columns.forEach(function (col) { allItems = allItems.concat(col.items); });

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: "absolute", top: "100%",
        left: anchorRef && anchorRef.current ? anchorRef.current.offsetLeft : 0,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "0 0 var(--r-lg) var(--r-lg)",
        boxShadow: "var(--shadow-dropdown)",
        padding: "var(--sp-3)",
        zIndex: 200,
        minWidth: 220,
      }}
    >
      {allItems.map(function (id) {
        var isRecent = id === "changelog" && RELEASE_DATE && (Date.now() - new Date(RELEASE_DATE).getTime()) < 7 * 86400000;
        return (
          <MegaItem key={id} id={id} active={tab === id} tab={tab} setTab={setTab}
            onItemClick={onItemClick} t={t} isRecent={isRecent} />
        );
      })}
    </div>
  );
}

function ScenarioCompact({ scenarios, activeId, onSwitch, onSave, t }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function () {
    if (!open) return;
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return function () { document.removeEventListener("mousedown", onClick); };
  }, [open]);

  if (!scenarios || scenarios.length === 0) return null;

  function displayName(sc) { return sc ? (t.scenarios[sc.name] || sc.name) : t.scenarios.base; }
  var active = scenarios.find(function (s) { return s.id === activeId; });
  var activeName = displayName(active);
  var activeColor = active ? (active.color || "var(--text-muted)") : "var(--text-muted)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={function () { setOpen(!open); }}
        title={t.scenarios.banner_title + " — " + activeName}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32,
          border: "none", borderRadius: "var(--r-md)",
          background: open ? "var(--bg-hover)" : "transparent",
          cursor: "pointer", position: "relative",
        }}
      >
        <Browsers size={15} color="var(--text-muted)" />
        <span style={{ position: "absolute", bottom: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: activeColor, border: "1.5px solid var(--bg-card)" }} />
      </button>

      {open ? (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 200,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-dropdown)",
          padding: "var(--sp-2)", zIndex: 200,
        }}>
          {scenarios.map(function (sc) {
            var isActive = sc.id === activeId;
            return (
              <button
                key={sc.id}
                onClick={function () { if (!isActive) { onSwitch(sc.id); } setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-2)", width: "100%",
                  padding: "var(--sp-2) var(--sp-3)", border: "none", borderRadius: "var(--r-md)",
                  background: isActive ? "var(--brand-bg)" : "transparent",
                  cursor: "pointer", fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--brand)" : "var(--text-primary)",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.color || "var(--text-muted)", flexShrink: 0 }} />
                {displayName(sc)}
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid var(--border)", margin: "var(--sp-1) 0" }} />
          <button
            onClick={function () { onSave(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "var(--sp-2)", width: "100%",
              padding: "var(--sp-2) var(--sp-3)", border: "none", borderRadius: "var(--r-md)",
              background: "transparent", cursor: "pointer", fontSize: 12,
              color: "var(--brand)", fontWeight: 500, textAlign: "left",
            }}
          >
            + {t.scenarios.new_scenario}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LangToggle({ lang, toggleLang }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);
  var OPTS = [{ value: "fr", label: "Fran\u00e7ais" }, { value: "en", label: "English" }];

  useEffect(function () {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return function () { document.removeEventListener("mousedown", handleClick); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <IconBtn onClick={function () { setOpen(!open); }} title="Change language / Changer la langue" active={open}>
        <Translate size={15} color="var(--text-muted)" />
      </IconBtn>
      {open ? (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-dropdown)",
          padding: "var(--sp-2)", minWidth: 140, zIndex: 200,
        }}>
          {OPTS.map(function (opt) {
            var active = lang === opt.value;
            return (
              <button
                key={opt.value}
                onClick={function () { if (!active) toggleLang(); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-3)",
                  width: "100%", padding: "var(--sp-2) var(--sp-3)",
                  border: "none", borderRadius: "var(--r-md)",
                  background: active ? "var(--brand-bg)" : "transparent",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "var(--brand)" : "var(--text-primary)",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function useIsMobile(breakpoint) {
  var bp = breakpoint || 900;
  var [mobile, setMobile] = useState(typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(function () {
    function onResize() { setMobile(window.innerWidth < bp); }
    window.addEventListener("resize", onResize);
    return function () { window.removeEventListener("resize", onResize); };
  }, [bp]);
  return mobile;
}

function MobileMenu({ tab, setTab, t, onClose, scenarios, activeScenario, onScenarioSwitch, onScenarioSave, lang, toggleLang }) {
  useEffect(function () {
    var prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return function () {
      document.documentElement.style.overflowY = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function renderItem(id, indent) {
    var a = tab === id;
    var Icon = NAV_ICON_MAP[id];
    return (
      <button
        key={id}
        onClick={function () { setTab(id); onClose(); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", textAlign: "left",
          padding: "var(--sp-2) var(--sp-3) var(--sp-2) " + (indent || "var(--sp-5)"),
          border: "none", borderRadius: "var(--r-md)",
          background: a ? "var(--brand-bg)" : "transparent",
          color: a ? "var(--brand)" : "var(--text-primary)",
          fontSize: 14, fontWeight: a ? 600 : 400, cursor: "pointer",
        }}
      >
        {Icon ? <Icon size={14} weight={a ? "fill" : "regular"} color={a ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} /> : null}
        {t.tabs[id]}
      </button>
    );
  }

  return createPortal(
    <div
      onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, top: 56, zIndex: 100,
        background: "rgba(0,0,0,0.3)",
      }}
    >
      <div style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-dropdown)",
        padding: "var(--sp-3) var(--sp-4)",
        maxHeight: "calc(100vh - 56px)",
        overflowY: "auto",
      }}>
        {NAV_STRUCTURE.map(function (item, idx) {
          if (item.type === "standalone") {
            var Icon = NAV_ICON_MAP[item.id];
            var active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={function () { setTab(item.id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", textAlign: "left",
                  padding: "var(--sp-3) var(--sp-3)", border: "none", borderRadius: "var(--r-md)",
                  background: active ? "var(--brand-bg)" : "transparent",
                  color: active ? "var(--brand)" : "var(--text-primary)",
                  fontSize: 14, fontWeight: active ? 600 : 400, cursor: "pointer",
                }}
              >
                {Icon ? <Icon size={14} weight={active ? "fill" : "regular"} color={active ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} /> : null}
                {t.tabs[item.id]}
              </button>
            );
          }

          if (item.type === "mega") {
            var allItems = [];
            item.columns.forEach(function (col) { allItems = allItems.concat(col.items); });
            return (
              <div key={item.key} style={{ marginTop: idx > 0 ? "var(--sp-2)" : 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: 0.5, color: "var(--text-faint)",
                  padding: "var(--sp-2) var(--sp-3) var(--sp-1)",
                  borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
                  paddingTop: idx > 0 ? "var(--sp-3)" : "var(--sp-2)",
                }}>
                  {t.nav[item.key]}
                </div>
                {allItems.map(function (id) {
                  return renderItem(id);
                })}
              </div>
            );
          }

          return (
            <div key={item.key} style={{ marginTop: idx > 0 ? "var(--sp-2)" : 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: 0.5, color: "var(--text-faint)",
                padding: "var(--sp-2) var(--sp-3) var(--sp-1)",
                borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
                paddingTop: idx > 0 ? "var(--sp-3)" : "var(--sp-2)",
              }}>
                {t.nav[item.key]}
              </div>
              {item.items.map(function (id) {
                return renderItem(id);
              })}
            </div>
          );
        })}

        {/* Scenarios */}
        {scenarios && scenarios.length > 0 ? (
          <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" }}>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 0.5, color: "var(--text-faint)",
              padding: "var(--sp-2) var(--sp-3) var(--sp-1)",
            }}>
              {t.scenarios.banner_title}
            </div>
            {scenarios.map(function (sc) {
              var isAct = sc.id === activeScenario;
              return (
                <button
                  key={sc.id}
                  onClick={function () { if (!isAct) onScenarioSwitch(sc.id); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", textAlign: "left",
                    padding: "var(--sp-2) var(--sp-3) var(--sp-2) var(--sp-5)",
                    border: "none", borderRadius: "var(--r-md)",
                    background: isAct ? "var(--brand-bg)" : "transparent",
                    color: isAct ? "var(--brand)" : "var(--text-primary)",
                    fontSize: 14, fontWeight: isAct ? 600 : 400, cursor: "pointer",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.color || "var(--text-muted)", flexShrink: 0 }} />
                  {t.scenarios[sc.name] || sc.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Language + Settings */}
        <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" }}>
          <button
            onClick={function () { toggleLang(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", textAlign: "left",
              padding: "var(--sp-3) var(--sp-3)", border: "none", borderRadius: "var(--r-md)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 14, fontWeight: 400, cursor: "pointer",
            }}
          >
            <Translate size={14} color="var(--text-muted)" />
            {lang === "fr" ? "English" : "Fran\u00e7ais"}
          </button>
          <button
            onClick={function () { setTab("set"); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", textAlign: "left",
              padding: "var(--sp-3) var(--sp-3)", border: "none", borderRadius: "var(--r-md)",
              background: tab === "set" ? "var(--brand-bg)" : "transparent",
              color: tab === "set" ? "var(--brand)" : "var(--text-primary)",
              fontSize: 14, fontWeight: tab === "set" ? 600 : 400, cursor: "pointer",
            }}
          >
            <Sliders size={14} color={tab === "set" ? "var(--brand)" : "var(--text-muted)"} />
            {t.tabs.set}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Header({ tab, setTab, onOpenExport, scenarios, activeScenario, onScenarioSwitch, onScenarioSave, cfg }) {
  var { dark, toggle } = useTheme();
  var { lang, toggleLang } = useLang();
  var t = useT();
  var devCtx = useDevMode();
  var devRaw = devCtx && devCtx.devMode;
  var [devActive, setDevActive] = useState(devRaw);

  var dt = (cfg && cfg.devTiming) || {};
  var enterMs = dt.enterMs != null ? dt.enterMs : 300;
  var initMs = dt.initMs != null ? dt.initMs : 2500;
  var deinitMs = dt.deinitMs != null ? dt.deinitMs : 1800;
  var exitMs = dt.exitMs != null ? dt.exitMs : 300;

  useEffect(function () {
    if (devRaw) {
      // Delay to match DevBanner "ready" phase (enterMs + initMs)
      var id = setTimeout(function () { setDevActive(true); }, enterMs + initMs);
      return function () { clearTimeout(id); };
    } else {
      // Delay hiding to match DevBanner deinit + exit
      var id = setTimeout(function () { setDevActive(false); }, deinitMs + exitMs);
      return function () { clearTimeout(id); };
    }
  }, [devRaw]);
  var isMobile = useIsMobile(900);
  var [mobileOpen, setMobileOpen] = useState(false);
  var [hoveredGroup, setHoveredGroup] = useState(null);
  var navLeaveTimer = useRef(null);
  var groupRefs = useRef({});

  function handleGroupEnter(key) {
    if (navLeaveTimer.current) clearTimeout(navLeaveTimer.current);
    setHoveredGroup(key);
  }
  function handleNavLeave() {
    navLeaveTimer.current = setTimeout(function () { setHoveredGroup(null); }, 100);
  }
  function handlePanelEnter() {
    if (navLeaveTimer.current) clearTimeout(navLeaveTimer.current);
  }

  // Close mobile menu when switching to desktop
  useEffect(function () {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: devActive ? 32 : 0,
        zIndex: 50,
        transition: "top 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "var(--page-max)",
          margin: "0 auto",
          padding: "0 var(--page-px)",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-4)",
        }}
      >
        {/* Logo */}
        <img
          key={devActive ? "dev" : "prod"}
          src={devActive ? logoDev : logo}
          alt={APP_NAME}
          style={{
            height: 28, cursor: "pointer", flexShrink: 0,
            animation: "devLogoIn 0.35s ease-out",
          }}
          onClick={function () { setTab("overview"); }}
        />

        {/* Desktop Nav */}
        {!isMobile ? (
          <nav style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", flex: 1, flexWrap: "nowrap", position: "relative", alignSelf: "stretch" }}
            onMouseLeave={handleNavLeave}
          >
            {NAV_STRUCTURE.map(function (item) {
              if (item.type === "mega") {
                var allItems = [];
                item.columns.forEach(function (col) { allItems = allItems.concat(col.items); });
                var isActive = allItems.includes(tab);
                var isHovered = hoveredGroup === item.key;
                if (!groupRefs.current[item.key]) groupRefs.current[item.key] = { current: null };
                return (
                  <button
                    key={item.key}
                    ref={function (el) { groupRefs.current[item.key].current = el; }}
                    onMouseEnter={function () { handleGroupEnter(item.key); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--sp-1)",
                      padding: "0 var(--sp-3)", height: 40, border: "none",
                      background: "transparent",
                      color: isActive || isHovered ? "var(--brand)" : "var(--text-secondary)",
                      fontSize: 13, fontWeight: isActive ? 600 : 500,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {t.nav[item.key]}
                    <CaretDown size={12}
                      style={{ transition: "transform 150ms", transform: isHovered ? "rotate(180deg)" : "rotate(0deg)" }}
                      color={isActive || isHovered ? "var(--brand)" : "var(--text-muted)"} />
                  </button>
                );
              }
              var active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={function () { setTab(item.id); }}
                  onMouseEnter={function () { setHoveredGroup(null); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--sp-3)",
                    height: 40,
                    border: "none",
                    background: "transparent",
                    color: active ? "var(--brand)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.tabs[item.id]}
                </button>
              );
            })}

            {/* Compact dropdown for hovered group */}
            {hoveredGroup ? (
              <DropdownPanel
                group={NAV_STRUCTURE.find(function (i) { return i.key === hoveredGroup; })}
                tab={tab}
                setTab={setTab}
                t={t}
                onEnter={handlePanelEnter}
                onLeave={handleNavLeave}
                onItemClick={function () { setHoveredGroup(null); }}
                anchorRef={groupRefs.current[hoveredGroup]}
              />
            ) : null}
          </nav>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Right zone */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", flexShrink: 0 }}>

          {/* Scenario picker (hide on very small screens) */}
          {!isMobile ? (
            <ScenarioCompact
              scenarios={scenarios}
              activeId={activeScenario}
              onSwitch={onScenarioSwitch}
              onSave={onScenarioSave}
              t={t}
            />
          ) : null}

          {/* Utility icons: Export · Lang · Theme */}
          <IconBtn onClick={onOpenExport} title={t.settings.io_title} ariaLabel={t.settings.io_title}>
            <UploadSimple size={15} color="var(--text-muted)" />
          </IconBtn>

          <a href={"/docs/" + lang + "/"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--r-md)", background: "transparent", flexShrink: 0, textDecoration: "none" }} title="Documentation">
            <BookOpen size={15} color="var(--text-muted)" />
          </a>

          {!isMobile ? <LangToggle lang={lang} toggleLang={toggleLang} /> : null}

          <IconBtn
            onClick={function (e) { toggle(e.clientX, e.clientY); }}
            ariaLabel={dark ? t.toggle_theme_light : t.toggle_theme_dark}
            active={dark}
          >
            {dark
              ? <Sun size={15} weight="fill" color="var(--color-sun)" />
              : <Moon size={15} color="var(--text-muted)" />}
          </IconBtn>

          {!isMobile ? (
            <>
              <Divider />
              <button
                onClick={function () { setTab("set"); }}
                aria-label={t.tabs.set}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 12px",
                  height: 30,
                  border: "1px solid " + (tab === "set" ? "var(--brand)" : "var(--border)"),
                  borderRadius: "var(--r-full)",
                  background: tab === "set" ? "var(--brand-bg)" : "transparent",
                  color: tab === "set" ? "var(--brand)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Sliders size={13} color={tab === "set" ? "var(--brand)" : "var(--text-muted)"} />
                {t.tabs.set}
              </button>
            </>
          ) : null}

          {/* Mobile hamburger */}
          {isMobile ? (
            <>
              <Divider />
              <IconBtn onClick={function () { setMobileOpen(!mobileOpen); }} ariaLabel="Menu" active={mobileOpen}>
                {mobileOpen
                  ? <X size={18} color="var(--text-primary)" />
                  : <List size={18} color="var(--text-primary)" />}
              </IconBtn>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && mobileOpen ? (
        <MobileMenu tab={tab} setTab={setTab} t={t} onClose={function () { setMobileOpen(false); }} scenarios={scenarios} activeScenario={activeScenario} onScenarioSwitch={onScenarioSwitch} onScenarioSave={onScenarioSave} lang={lang} toggleLang={toggleLang} />
      ) : null}
    </header>
  );
}
