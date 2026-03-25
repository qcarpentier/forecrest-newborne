import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ChartPie, CurrencyCircleDollar, Receipt, Package, BookOpen,
  Lock, Megaphone, CloudArrowUp, ShoppingCart,
  ChartDonut, UsersFour, Sparkle, CirclesThreePlus, QrCode, Globe,
  ArrowSquareOut, Star, ShieldCheck,
  Newspaper, Crosshair, Wallet, Funnel, ChartBar,
} from "@phosphor-icons/react";
import { useT, useLang, useTheme } from "../context";

var CORE_ITEMS = [
  { id: "overview", icon: ChartBar },
  { id: "streams", icon: CurrencyCircleDollar },
  { id: "opex", icon: Receipt },
  { id: "stocks", icon: Package },
  { id: "accounting", icon: BookOpen },
];

var MARKETING_ITEMS = [
  { id: "marketing", icon: ChartBar },
  { id: "mkt_campaigns", icon: Newspaper },
  { id: "mkt_channels", icon: Crosshair },
  { id: "mkt_budget", icon: Wallet },
  { id: "mkt_conversions", icon: Funnel },
];

var TOOLS_ITEMS = [
  { id: "tool_qr", icon: QrCode },
  { id: "tool_domain", icon: Globe },
  { id: "tool_trademark", icon: ShieldCheck },
];

var MODULES = [
  { id: "core", icon: ChartPie, items: CORE_ITEMS, locked: false },
  { id: "marketing", icon: Megaphone, items: MARKETING_ITEMS, locked: true },
  { id: "cloud_infra", icon: CloudArrowUp, items: [], locked: true },
  { id: "ecommerce", icon: ShoppingCart, items: [], locked: true },
  { id: "saas_metrics", icon: ChartDonut, items: [], locked: true },
  { id: "hr_advanced", icon: UsersFour, items: [], locked: true },
  { id: "fundraising", icon: Sparkle, items: [], locked: true },
  { id: "tools_mod", icon: CirclesThreePlus, items: TOOLS_ITEMS, locked: false, separator: true },
];

var MODULE_LABELS = {
  core: { fr: "Finance", en: "Finance" },
  marketing: { fr: "Marketing", en: "Marketing" },
  cloud_infra: { fr: "Cloud", en: "Cloud" },
  ecommerce: { fr: "E-commerce", en: "E-commerce" },
  saas_metrics: { fr: "SaaS", en: "SaaS" },
  hr_advanced: { fr: "RH", en: "HR" },
  fundraising: { fr: "Levee", en: "Fundraising" },
  tools_mod: { fr: "Outils", en: "Tools" },
};

var MARKETING_TAB_IDS = MARKETING_ITEMS.map(function (item) { return item.id; });
var TOOLS_TAB_IDS = TOOLS_ITEMS.map(function (item) { return item.id; });

function getModuleForTab(tab) {
  if (MARKETING_TAB_IDS.indexOf(tab) >= 0) return "marketing";
  if (TOOLS_TAB_IDS.indexOf(tab) >= 0) return "tools_mod";
  return "core";
}

function isModuleLocked(mod, unlockedModules) {
  if (!mod || mod.id === "core") return false;
  if (unlockedModules && Object.prototype.hasOwnProperty.call(unlockedModules, mod.id)) {
    return !unlockedModules[mod.id];
  }
  return !!mod.locked;
}

function isModulePreviewable(mod) {
  return !!mod && mod.id === "marketing";
}

var SHRINK_DELAY = 4000;
var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
var EASE_ARRAY = [0.22, 1, 0.36, 1];
var SZ = 40;
var SZ_C = 34;
var SZ_PEAK = 54;

var stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  var styleTag = document.createElement("style");
  styleTag.textContent =
    ".fc-db{transition:background 0.15s,border-color 0.15s,box-shadow 0.15s,opacity 0.15s}" +
    ".fc-db[data-locked=\"false\"]:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,0.24),0 8px 16px rgba(14,14,13,0.08)}" +
    ".fc-db[data-previewable=\"true\"]:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,0.24),0 8px 16px rgba(14,14,13,0.08)}" +
    "[data-theme=\"dark\"] .fc-db[data-locked=\"false\"]:hover{box-shadow:none;background:rgba(255,255,255,0.05)}" +
    "[data-theme=\"dark\"] .fc-db[data-previewable=\"true\"]:hover{box-shadow:none;background:rgba(255,255,255,0.05)}" +
    ".fc-db:focus-visible{outline:none;box-shadow:0 0 0 3px var(--brand-border),0 0 0 1px var(--brand)}";
  document.head.appendChild(styleTag);
}

function DockBtn({ iconComp, isActive, isLocked, isPreviewable, title, onClick, onCtxMenu, mouseX, compact, dark }) {
  var Icon = iconComp;
  var size = compact ? SZ_C : SZ;
  var peak = compact ? SZ_C : SZ_PEAK;
  var ref = useRef(null);
  var isSoftLocked = isLocked && isPreviewable;

  var dist = useTransform(mouseX, function (value) {
    if (!ref.current || compact) return 200;
    var bounds = ref.current.getBoundingClientRect();
    return value - bounds.x - bounds.width / 2;
  });
  var springCfg = { mass: 0.1, stiffness: 150, damping: 12 };
  var width = useSpring(useTransform(dist, [-120, 0, 120], [size, peak, size]), springCfg);
  var height = useSpring(useTransform(dist, [-120, 0, 120], [size, peak, size]), springCfg);

  return (
    <motion.button
      ref={ref}
      title={title}
      aria-label={title}
      aria-disabled={isLocked && !isPreviewable}
      data-locked={isLocked ? "true" : "false"}
      data-previewable={isPreviewable ? "true" : "false"}
      type="button"
      className="fc-db"
      onClick={onClick}
      onContextMenu={onCtxMenu}
      style={{
        width: width,
        height: height,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: isActive ? "1px solid var(--brand-border)" : "1px solid transparent",
        borderRadius: compact ? 8 : 10,
        background: isActive ? "var(--brand-bg-hover, var(--brand-bg))" : "transparent",
        cursor: (isLocked && !isPreviewable) ? "default" : "pointer",
        padding: 0,
        opacity: isSoftLocked ? 1 : (isLocked ? 0.58 : 1),
        position: "relative",
        transformOrigin: "bottom center",
        boxShadow: isActive
          ? (dark
            ? "none"
            : "inset 0 1px 0 rgba(255,255,255,0.26), 0 8px 18px rgba(232,67,26,0.14)")
          : "none",
        backgroundImage: isActive
          ? (dark
            ? "none"
            : "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 68%)")
          : "none",
        zIndex: isActive ? 2 : 1,
      }}
    >
      <Icon
        size={compact ? 15 : 19}
        weight={isActive ? "fill" : "regular"}
        color={(isLocked && !isPreviewable)
          ? "var(--text-faint)"
          : (isActive ? "var(--brand-hover, var(--brand))" : "var(--text-tertiary)")}
      />
      {isLocked ? (
        <span
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-card-translucent)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <Lock
            size={7}
            weight="bold"
            color="var(--text-secondary)"
          />
        </span>
      ) : null}
    </motion.button>
  );
}

function CtxMenu({ x, y, item, onClose, onNavigate, lang }) {
  var t = useT();
  var isFr = lang !== "en";

  useEffect(function () {
    function onDown() { onClose(); }
    window.addEventListener("mousedown", onDown);
    return function () { window.removeEventListener("mousedown", onDown); };
  }, [onClose]);

  var rows = item.locked
    ? [{ label: t.dock_coming_soon || (isFr ? "Bientôt disponible" : "Coming soon"), icon: Star, disabled: true }]
    : [
        {
          label: t.dock_open || (isFr ? "Ouvrir" : "Open"),
          icon: ArrowSquareOut,
          action: function () { onNavigate(item.id); onClose(); },
        },
      ];

  return createPortal(
    <div
      onMouseDown={function (e) { e.stopPropagation(); }}
      style={{
        position: "fixed",
        left: x,
        bottom: window.innerHeight - y + 8,
        zIndex: 600,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-modal)",
        padding: 4,
        minWidth: 180,
        animation: "tooltipIn 0.12s ease",
      }}
    >
      {rows.map(function (row, index) {
        var RowIcon = row.icon;
        return (
          <button
            key={index}
            type="button"
            disabled={row.disabled}
            onMouseDown={function (e) {
              e.preventDefault();
              if (!row.disabled && row.action) row.action();
            }}
            onMouseEnter={function (e) {
              if (!row.disabled) e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              border: "none",
              borderRadius: "var(--r-md)",
              background: "transparent",
              color: row.disabled ? "var(--text-faint)" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: row.disabled ? "default" : "pointer",
              opacity: row.disabled ? 0.5 : 1,
            }}
          >
            <RowIcon size={14} color={row.disabled ? "var(--text-faint)" : "var(--text-muted)"} />
            {row.label}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

export default function FloatingToolbar({ tab, setTab, visible, activeModule, setActiveModule, unlockedModules }) {
  var t = useT();
  var { lang } = useLang();
  var { dark } = useTheme();
  var tb = t.tabs || {};
  var lk = lang === "en" ? "en" : "fr";

  var [activeModId, setActiveModId] = useState("core");
  var [compact, setCompact] = useState(false);
  var [hovered, setHovered] = useState(false);
  var [ctxMenu, setCtxMenu] = useState(null);
  var timerRef = useRef(null);
  var mouseX = useMotionValue(Infinity);

  useEffect(function () {
    var tabModId = getModuleForTab(tab);
    var tabMod = MODULES.find(function (mod) { return mod.id === tabModId; });
    var modId = (tabMod && isModuleLocked(tabMod, unlockedModules)) ? tabModId : (activeModule || tabModId);
    setActiveModId(modId);
    if (setActiveModule && !(tabMod && isModuleLocked(tabMod, unlockedModules))) setActiveModule(modId);
  }, [tab, activeModule, setActiveModule, unlockedModules]);

  useEffect(function () {
    function reset() {
      setCompact(false);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(function () { setCompact(true); }, SHRINK_DELAY);
    }
    reset();
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return function () {
      clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, []);

  function onEnter() {
    setHovered(true);
    setCompact(false);
    clearTimeout(timerRef.current);
  }

  function onLeave() {
    setHovered(false);
    mouseX.set(Infinity);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(function () { setCompact(true); }, SHRINK_DELAY);
  }

  function handleModSel(modId) {
    var mod = MODULES.find(function (entry) { return entry.id === modId; });
    if (!mod) return;
    if (isModuleLocked(mod, unlockedModules)) {
      if (isModulePreviewable(mod)) {
        setActiveModId(mod.id);
        setTab("marketing");
      }
      return;
    }

    if (activeModId === modId && modId !== "core") {
      setActiveModId("core");
      setTab("overview");
      return;
    }

    setActiveModId(modId);
    if (setActiveModule) setActiveModule(modId);
    if (mod.items.length > 0) setTab(mod.items[0].id);
    else setTab("overview");
  }

  injectStyles();
  if (visible === false) return null;

  var isCompact = compact && !hovered;
  var activeMod = MODULES.find(function (mod) { return mod.id === activeModId; }) || MODULES[0];
  var activeModLocked = isModuleLocked(activeMod, unlockedModules);
  var activeItems = activeModLocked
    ? [{ id: activeMod.id, icon: Star, discover: true }]
    : activeMod.items;
  var activeIdx = MODULES.findIndex(function (mod) { return mod.id === activeModId; });
  var leftMods = MODULES.slice(0, activeIdx);
  var rightMods = MODULES.slice(activeIdx + 1);

  function renderCollapsedMod(mod) {
    var locked = isModuleLocked(mod, unlockedModules);
    var previewable = isModulePreviewable(mod);
    var labels = MODULE_LABELS[mod.id] || {};
    var title = (labels[lk] || labels.fr || mod.id) + ((locked && !previewable) ? (lk === "fr" ? " (bientôt)" : " (coming soon)") : "");
    return (
      <motion.div
        key={mod.id}
        initial={{ width: 0, opacity: 0, scale: 0.8 }}
        animate={{ width: "auto", opacity: 1, scale: 1 }}
        exit={{ width: 0, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.22, ease: EASE_ARRAY }}
        style={{ overflow: "hidden", flexShrink: 0, position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 4 }}
      >
        {mod.separator ? <div style={{ width: 1, height: isCompact ? 20 : 26, background: dark ? "rgba(255,255,255,0.1)" : "var(--border)", borderRadius: 1, flexShrink: 0 }} /> : null}
        <DockBtn
          iconComp={mod.icon}
          isActive={false}
          isLocked={locked}
          isPreviewable={locked && previewable}
          title={title}
          onClick={function () { handleModSel(mod.id); }}
          onCtxMenu={function (e) {
            e.preventDefault();
            setCtxMenu({ x: e.clientX, y: e.clientY, item: { id: mod.id, locked: locked && !previewable } });
          }}
          mouseX={mouseX}
          compact={isCompact}
          dark={dark}
        />
      </motion.div>
    );
  }

  return createPortal(
    <>
      <motion.div
        onMouseMove={function (e) { mouseX.set(e.pageX); }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        initial={{ x: "-50%", y: 20, opacity: 0 }}
        animate={{ x: "-50%", y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_ARRAY }}
        style={{
          position: "fixed",
          bottom: isCompact ? 16 : 18,
          left: "var(--fc-content-center, 50%)",
          zIndex: 500,
          isolation: "isolate",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: isCompact ? "4px 6px" : "5px 8px",
          borderRadius: isCompact ? 14 : 16,
          background: dark
            ? "rgba(18,22,26,0.72)"
            : "linear-gradient(180deg, var(--overlay-glass) 0%, rgba(255,255,255,0.02) 100%), var(--bg-card-translucent)",
          backdropFilter: dark ? "blur(20px) saturate(1.02)" : "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: dark ? "blur(20px) saturate(1.02)" : "blur(20px) saturate(1.6)",
          border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.16)",
          boxShadow: isCompact
            ? (dark
              ? "0 8px 18px rgba(0,0,0,0.18)"
              : "0 8px 24px rgba(14,14,13,0.10), inset 0 1px 0 rgba(255,255,255,0.30)")
            : (dark
              ? "0 12px 28px rgba(0,0,0,0.20)"
              : "0 18px 40px rgba(14,14,13,0.14), 0 6px 16px rgba(14,14,13,0.08), inset 0 1px 0 rgba(255,255,255,0.34)"),
          transition: "padding 0.3s " + EASE + ", border-radius 0.3s " + EASE + ", bottom 0.3s " + EASE,
        }}
      >
        {!dark ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 1,
              borderRadius: isCompact ? 13 : 15,
              background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0) 62%)",
              pointerEvents: "none",
              opacity: isCompact ? 0.7 : 1,
            }}
          />
        ) : null}
        {!dark ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "20%",
              right: "20%",
              top: -12,
              height: isCompact ? 20 : 28,
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(232,67,26,0.18) 0%, rgba(232,67,26,0) 72%)",
              filter: "blur(14px)",
              opacity: isCompact ? 0.4 : 0.75,
              pointerEvents: "none",
            }}
          />
        ) : null}
        <AnimatePresence initial={false}>
          {leftMods.map(renderCollapsedMod)}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeModId}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: EASE_ARRAY }}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: 0,
              background: dark
                ? "rgba(255,255,255,0.035)"
                : "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%), var(--bg-accordion)",
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--border)",
              borderRadius: isCompact ? 10 : 12,
              padding: isCompact ? "1px 2px" : "2px 3px",
              boxShadow: dark
                ? "none"
                : "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 14px rgba(14,14,13,0.06)",
            }}
          >
            {!dark ? (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 1,
                  borderRadius: isCompact ? 9 : 11,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%)",
                  pointerEvents: "none",
                }}
              />
            ) : null}
            {activeItems.map(function (item) {
              var itemTitle = item.discover
                ? ((lk === "fr" ? "Decouvrir " : "Discover ") + ((MODULE_LABELS[item.id] && (MODULE_LABELS[item.id][lk] || MODULE_LABELS[item.id].fr)) || item.id))
                : (tb[item.id] || item.id);
              return (
                <DockBtn
                  key={item.id}
                  iconComp={item.icon}
                  isActive={item.discover ? getModuleForTab(tab) === item.id : tab === item.id}
                  isLocked={false}
                  isPreviewable={!!item.discover}
                  title={itemTitle}
                  onClick={function () { setTab(item.id); }}
                  onCtxMenu={function (e) {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, item: item });
                  }}
                  mouseX={mouseX}
                  compact={isCompact}
                  dark={dark}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {rightMods.map(renderCollapsedMod)}
        </AnimatePresence>

      </motion.div>

      {ctxMenu ? (
        <CtxMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          item={ctxMenu.item}
          onClose={function () { setCtxMenu(null); }}
          onNavigate={setTab}
          lang={lang}
        />
      ) : null}
    </>,
    document.body
  );
}
