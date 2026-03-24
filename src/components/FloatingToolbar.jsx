import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ChartPie, CurrencyCircleDollar, Receipt, Package, BookOpen,
  Lock, Megaphone, CloudArrowUp, ShoppingCart,
  ChartDonut, UsersFour, Sparkle,
  ArrowSquareOut, Copy, Star,
  Newspaper, Crosshair, Wallet, Funnel, ChartBar,
} from "@phosphor-icons/react";
import { useT, useLang } from "../context";

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

var MODULES = [
  { id: "core", icon: ChartPie, items: CORE_ITEMS, locked: false },
  { id: "marketing", icon: Megaphone, items: MARKETING_ITEMS, locked: true },
  { id: "cloud_infra", icon: CloudArrowUp, items: [], locked: true },
  { id: "ecommerce", icon: ShoppingCart, items: [], locked: true },
  { id: "saas_metrics", icon: ChartDonut, items: [], locked: true },
  { id: "hr_advanced", icon: UsersFour, items: [], locked: true },
  { id: "fundraising", icon: Sparkle, items: [], locked: true },
];

var MODULE_LABELS = {
  core: { fr: "Finance", en: "Finance" },
  marketing: { fr: "Marketing", en: "Marketing" },
  cloud_infra: { fr: "Cloud", en: "Cloud" },
  ecommerce: { fr: "E-commerce", en: "E-commerce" },
  saas_metrics: { fr: "SaaS", en: "SaaS" },
  hr_advanced: { fr: "RH", en: "HR" },
  fundraising: { fr: "Levee", en: "Fundraising" },
};

var MARKETING_TAB_IDS = MARKETING_ITEMS.map(function (item) { return item.id; });

function getModuleForTab(tab) {
  if (MARKETING_TAB_IDS.indexOf(tab) >= 0) return "marketing";
  return "core";
}

function isModuleLocked(mod, unlockedModules) {
  if (!mod || mod.id === "core") return false;
  if (unlockedModules && Object.prototype.hasOwnProperty.call(unlockedModules, mod.id)) {
    return !unlockedModules[mod.id];
  }
  return !!mod.locked;
}

var SHRINK_DELAY = 4000;
var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
var SZ = 40;
var SZ_C = 34;
var SZ_PEAK = 54;

var stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  var styleTag = document.createElement("style");
  styleTag.textContent = ".fc-db{transition:background 0.15s}";
  document.head.appendChild(styleTag);
}

function DockBtn({ iconComp, isActive, isLocked, title, onClick, onCtxMenu, mouseX, compact }) {
  var Icon = iconComp;
  var size = compact ? SZ_C : SZ;
  var peak = compact ? SZ_C : SZ_PEAK;
  var ref = useRef(null);

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
      type="button"
      className="fc-db"
      onClick={isLocked ? undefined : onClick}
      onContextMenu={onCtxMenu}
      style={{
        width: width,
        height: height,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: compact ? 8 : 10,
        background: isActive ? "var(--brand-bg)" : "transparent",
        cursor: isLocked ? "default" : "pointer",
        padding: 0,
        opacity: isLocked ? 0.3 : 1,
        position: "relative",
        transformOrigin: "bottom center",
      }}
    >
      <Icon
        size={compact ? 15 : 19}
        weight={isActive ? "fill" : "regular"}
        color={isActive ? "var(--brand)" : "var(--text-muted)"}
      />
      {isLocked ? (
        <Lock
          size={6}
          weight="bold"
          color="var(--text-faint)"
          style={{ position: "absolute", bottom: 2, right: 2, opacity: 0.7 }}
        />
      ) : null}
    </motion.button>
  );
}

function CtxMenu({ x, y, item, onClose, onNavigate, lang }) {
  var isFr = lang !== "en";

  useEffect(function () {
    function onDown() { onClose(); }
    window.addEventListener("mousedown", onDown);
    return function () { window.removeEventListener("mousedown", onDown); };
  }, [onClose]);

  var rows = item.locked
    ? [{ label: isFr ? "Bientot disponible" : "Coming soon", icon: Star, disabled: true }]
    : [
        {
          label: isFr ? "Ouvrir" : "Open",
          icon: ArrowSquareOut,
          action: function () { onNavigate(item.id); onClose(); },
        },
        {
          label: isFr ? "Ouvrir dans un nouvel onglet" : "Open in new tab",
          icon: Copy,
          action: function () { window.open("#/" + item.id, "_blank"); onClose(); },
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

export default function FloatingToolbar({ tab, setTab, visible, setActiveModule, unlockedModules }) {
  var t = useT();
  var { lang } = useLang();
  var tb = t.tabs || {};
  var lk = lang === "en" ? "en" : "fr";

  var [activeModId, setActiveModId] = useState("core");
  var [compact, setCompact] = useState(false);
  var [hovered, setHovered] = useState(false);
  var [ctxMenu, setCtxMenu] = useState(null);
  var timerRef = useRef(null);
  var mouseX = useMotionValue(Infinity);

  useEffect(function () {
    var modId = getModuleForTab(tab);
    setActiveModId(modId);
    if (setActiveModule) setActiveModule(modId);
  }, [tab, setActiveModule]);

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
    if (!mod || isModuleLocked(mod, unlockedModules)) return;

    if (activeModId === modId && modId !== "core") {
      setActiveModId("core");
      setTab("overview");
      return;
    }

    setActiveModId(modId);
    if (mod.items.length > 0) setTab(mod.items[0].id);
    else setTab("overview");
  }

  injectStyles();
  if (visible === false) return null;

  var isCompact = compact && !hovered;
  var activeMod = MODULES.find(function (mod) { return mod.id === activeModId; }) || MODULES[0];
  var activeItems = activeMod.items;
  var activeIdx = MODULES.findIndex(function (mod) { return mod.id === activeModId; });
  var leftMods = MODULES.slice(0, activeIdx);
  var rightMods = MODULES.slice(activeIdx + 1);

  return createPortal(
    <>
      <motion.div
        onMouseMove={function (e) { mouseX.set(e.pageX); }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        initial={{ x: "-50%", y: 20, opacity: 0 }}
        animate={{ x: "-50%", y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          bottom: isCompact ? 16 : 18,
          left: "var(--fc-content-center, 50%)",
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: isCompact ? "4px 6px" : "5px 8px",
          borderRadius: isCompact ? 14 : 16,
          background: "var(--bg-card-translucent)",
          backdropFilter: "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: "blur(20px) saturate(1.6)",
          border: "1px solid var(--border-light)",
          boxShadow: isCompact
            ? "0 2px 12px rgba(0,0,0,0.07)"
            : "0 6px 28px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)",
          transition: "padding 0.3s " + EASE + ", border-radius 0.3s " + EASE + ", bottom 0.3s " + EASE,
        }}
      >
        <AnimatePresence initial={false}>
          {leftMods.map(function (mod) {
            var locked = isModuleLocked(mod, unlockedModules);
            var labels = MODULE_LABELS[mod.id] || {};
            var title = (labels[lk] || labels.fr || mod.id) + (locked ? (lk === "fr" ? " (bientot)" : " (coming soon)") : "");
            return (
              <motion.div
                key={mod.id}
                initial={{ width: 0, opacity: 0, scale: 0.8 }}
                animate={{ width: "auto", opacity: 1, scale: 1 }}
                exit={{ width: 0, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden", flexShrink: 0 }}
              >
                <DockBtn
                  iconComp={mod.icon}
                  isActive={false}
                  isLocked={locked}
                  title={title}
                  onClick={function () { handleModSel(mod.id); }}
                  onCtxMenu={function (e) {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, item: { id: mod.id, locked: locked } });
                  }}
                  mouseX={mouseX}
                  compact={isCompact}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeModId}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              background: "var(--bg-accordion)",
              border: "1px solid var(--border-light)",
              borderRadius: isCompact ? 10 : 12,
              padding: isCompact ? "1px 2px" : "2px 3px",
            }}
          >
            {activeItems.map(function (item) {
              return (
                <DockBtn
                  key={item.id}
                  iconComp={item.icon}
                  isActive={tab === item.id}
                  isLocked={false}
                  title={tb[item.id] || item.id}
                  onClick={function () { setTab(item.id); }}
                  onCtxMenu={function (e) {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, item: item });
                  }}
                  mouseX={mouseX}
                  compact={isCompact}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {rightMods.map(function (mod) {
            var locked = isModuleLocked(mod, unlockedModules);
            var labels = MODULE_LABELS[mod.id] || {};
            var title = (labels[lk] || labels.fr || mod.id) + (locked ? (lk === "fr" ? " (bientot)" : " (coming soon)") : "");
            return (
              <motion.div
                key={mod.id}
                initial={{ width: 0, opacity: 0, scale: 0.8 }}
                animate={{ width: "auto", opacity: 1, scale: 1 }}
                exit={{ width: 0, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden", flexShrink: 0 }}
              >
                <DockBtn
                  iconComp={mod.icon}
                  isActive={false}
                  isLocked={locked}
                  title={title}
                  onClick={function () { handleModSel(mod.id); }}
                  onCtxMenu={function (e) {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, item: { id: mod.id, locked: locked } });
                  }}
                  mouseX={mouseX}
                  compact={isCompact}
                />
              </motion.div>
            );
          })}
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
