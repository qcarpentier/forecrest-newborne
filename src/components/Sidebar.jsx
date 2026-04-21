import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlass, CaretDown, CaretUp, CaretLeft, CaretRight,
  ChartBar, CurrencyCircleDollar, Wallet, Bank, Receipt,
  Users, ChartPie, UsersThree, ShieldCheck, Scales, BookOpen,
  HourglassSimple, ClockCounterClockwise, Translate,
  GearSix, Sun, Moon, UploadSimple, List, X,
  CurrencyEur, TreeStructure, Gavel, Buildings, SquaresFour, Package,
  TrendUp, ChartLine, Megaphone, Sparkle, Lock, Target,
  Crosshair, Funnel, Newspaper, Handshake, CirclesThreePlus, QrCode, Globe,
  UserCircle, Briefcase, CookingPot, CurrencyDollar, Percent, SignOut, UserMinus, WarningCircle,
  ShareNetwork,
} from "@phosphor-icons/react";
import SidebarModal, { ModalBody as SidebarModalBody, ModalFooter as SidebarModalFooter } from "./Modal";
import Button from "./Button";
import { useTheme, useGlossary, useAuth } from "../context";
import { useT, useLang, useNotifications } from "../context";
import { APP_NAME } from "../constants/config";
import { DESIGN_SYSTEM_SECTIONS, getDefaultDesignSystemItemId, getDesignSystemItem } from "../constants/designSystem";
import { isAdminEnabled, getSupabase } from "../lib/supabase";
import useRecentPages from "../hooks/useRecentPages";
import useBreakpoint from "../hooks/useBreakpoint";

/* ─── Inline SVG logo ─── */
function ForecrestIcon({ size }) {
  var s = size || 28;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" style={{ display: "block" }}>
      <rect width="32" height="32" rx="7" fill="var(--brand)" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
        fill="#fff" fontSize="20" fontWeight="800"
        fontFamily="'Bricolage Grotesque','DM Sans',sans-serif">F</text>
    </svg>
  );
}

function ForecrestLockup({ height }) {
  var h = height || 26;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <ForecrestIcon size={h} />
      <span style={{
        fontSize: 18, fontWeight: 800, color: "var(--text-primary)",
        fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
        letterSpacing: "-0.02em", lineHeight: 1,
      }}>Forecrest</span>
    </div>
  );
}

var BTN_H = 44; // sidebar button height — min 44px per WCAG touch target

/* Pages flagged for redesign in roadmap phase 0 — show warning dot in nav */
var NEEDS_REDESIGN = { overview: true };

var modSwitchStyleInjected = false;
function injectModSwitchStyle() {
  if (modSwitchStyleInjected) return;
  modSwitchStyleInjected = true;
  var s = document.createElement("style");
  s.textContent = [
    "@keyframes fc-mod-switch{from{opacity:0;transform:translateX(-12px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}",
    "@keyframes fc-nav-in{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}",
    ".fc-nav-animate{animation:fc-nav-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both}",
    "@keyframes fcGlint{0%{background:var(--brand-bg)}100%{background:transparent}}",
    ".fc-row-highlight{animation:fcGlint 2s ease forwards}",
    "@keyframes fcDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.7}}",
  ].join("");
  document.head.appendChild(s);
}
injectModSwitchStyle();

var NAV_ICON_MAP = {
  overview: ChartBar,
  streams: CurrencyCircleDollar,
  opex: Receipt,
  salaries: Users,
  cashflow: Wallet,
  debt: Bank,
  crowdfunding: UsersThree,
  equipment: HourglassSimple,
  stocks: Package,
  income_statement: TreeStructure,
  balance_sheet: Scales,
  accounting: BookOpen,
  ratios: TrendUp,
  sensitivity: ChartLine,
  equity: ChartPie,
  captable: UsersThree,
  pact: ShieldCheck,
  affiliation: Handshake,
  production: CookingPot,
  tools: CirclesThreePlus,
  tool_qr: QrCode,
  tool_domain: Globe,
  tool_employee: UserCircle,
  tool_freelance: Briefcase,
  tool_costing: Scales,
  tool_currency: CurrencyDollar,
  tool_vat: Percent,
  tool_trademark: Gavel,
  marketing: Target,
  mkt_campaigns: Newspaper,
  mkt_channels: Crosshair,
  mkt_budget: CurrencyEur,
  mkt_conversions: Funnel,
  "design-system": Package,
  "button": Sparkle,
  "button-group": SquaresFour,
  "action-btn": List,
  "button-utility": GearSix,
  "search-input": MagnifyingGlass,
  "select-dropdown": CaretDown,
  "number-field": Percent,
  "currency-input": CurrencyEur,
  "date-picker": ClockCounterClockwise,
  "filter-dropdown": Funnel,
  "badge": ShieldCheck,
  "card": BookOpen,
  "avatar": UserCircle,
  "kpi-card": ChartBar,
  "accordion": List,
  "modal": ShareNetwork,
  "color-tokens": Package,
  "semantic-mapping": TreeStructure,
};

var GROUP_ICON_MAP = {
  activite: CurrencyEur,
  argent: Wallet,
  documents: BookOpen,
  analyse: ChartLine,
  societe: Gavel,
  tool_identity: Globe,
  tool_simulators: UserCircle,
  tool_calculators: Percent,
  actions: Sparkle,
  inputs: Funnel,
  display: Package,
  structure: TreeStructure,
};

function getDesignSystemSelectionFromHash() {
  var raw = (window.location.hash || "").replace(/^#/, "");
  if (raw.indexOf("ds/") === 0) raw = raw.slice(3);
  return getDesignSystemItem(raw) ? raw : getDefaultDesignSystemItemId();
}

/* ── Module definitions ── */
var APP_MODULES = {
  core: {
    id: "core",
    icon: ForecrestIcon,
    label: { fr: "Finance", en: "Finance" },
    desc: { fr: "Plan financier", en: "Financial plan" },
    letter: "F",
    color: "var(--brand)",
    sections: [
      { id: "overview", type: "item" },
      { id: "activite", type: "group", items: ["streams", "opex", "salaries", "equipment", "stocks", "production"] },
      { id: "argent", type: "group", items: ["cashflow", "debt", "crowdfunding", "affiliation"] },
      { id: "documents", type: "group", items: ["income_statement", "balance_sheet", "accounting"] },
      { id: "analyse", type: "group", items: ["ratios", "sensitivity"] },
      { id: "societe", type: "group", items: ["equity", "captable", "pact"] },
    ],
  },
  marketing: {
    id: "marketing",
    icon: Megaphone,
    label: { fr: "Marketing", en: "Marketing" },
    desc: { fr: "Acquisition & budget", en: "Acquisition & budget" },
    letter: "M",
    color: "#3B82F6",
    sections: [
      { id: "marketing", type: "item" },
      { id: "mkt_campaigns", type: "item" },
      { id: "mkt_channels", type: "item" },
      { id: "mkt_budget", type: "item" },
      { id: "mkt_conversions", type: "item" },
    ],
  },
  tools_mod: {
    id: "tools_mod",
    icon: CirclesThreePlus,
    label: { fr: "Outils", en: "Tools" },
    desc: { fr: "Outils pratiques", en: "Practical tools" },
    letter: "O",
    color: "#8B5CF6",
    sections: [
      { id: "tool_qr", type: "item" },
      { id: "tool_identity", type: "group", items: ["tool_domain", "tool_trademark"] },
      { id: "tool_simulators", type: "group", items: ["tool_employee", "tool_freelance", "tool_costing"] },
      { id: "tool_calculators", type: "group", items: ["tool_vat", "tool_currency"] },
    ],
  },
};
var MODULE_KEYS = Object.keys(APP_MODULES);

function NavItem({ id, tab, setTab, collapsed, t, indent, showDot, onClearDot, showRedesign }) {
  var Icon = NAV_ICON_MAP[id];
  var active = tab === id;
  var [hov, setHov] = useState(false);
  return (
    <button
      onClick={function () {
        setTab(id);
        if (showDot && onClearDot) onClearDot(id);
      }}
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
      title={collapsed ? (t.tabs[id] || id) : undefined}
      style={{
        position: "relative",
        display: "flex", alignItems: "center",
        gap: 10, width: "100%",
        height: indent ? BTN_H - 4 : BTN_H,
        padding: collapsed ? "0" : (indent ? "0 12px 0 44px" : "0 12px"),
        justifyContent: collapsed ? "center" : "flex-start",
        border: "none", borderRadius: 8,
        background: active ? "var(--brand-bg)" : hov ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", transition: "background 0.1s",
        marginBottom: 2, userSelect: "none",
      }}
    >
      {Icon && !indent ? (
        <Icon
          size={20}
          weight={active ? "fill" : "regular"}
          color={active ? "var(--brand)" : "var(--text-muted)"}
          style={{ flexShrink: 0 }}
        />
      ) : null}
      {!collapsed ? (
        <span style={{
          fontSize: 14, fontWeight: active ? 600 : 500,
          color: active ? "var(--brand)" : hov ? "var(--text-primary)" : "var(--text-secondary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {t.tabs[id] || id}
        </span>
      ) : null}
      {showDot ? (
        <span style={{
          position: "absolute", top: 4, right: 4,
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--brand)",
          boxShadow: "0 0 0 2px var(--bg-card)",
          animation: "fcDotPulse 2s ease-in-out infinite",
        }} />
      ) : null}
      {showRedesign && !collapsed ? (
        <span title={t.redesign_hint || "Page à améliorer"} style={{
          marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
          background: "var(--color-warning)", flexShrink: 0,
          boxShadow: "0 0 0 2px var(--bg-card)",
        }} />
      ) : null}
    </button>
  );
}

function NavGroup({ section, tab, setTab, collapsed, t, hasDotFn, onClearDot }) {
  var hasActive = section.items.some(function (id) { return id === tab; });
  var [open, setOpen] = useState(hasActive);
  var GroupIcon = GROUP_ICON_MAP[section.id];
  var groupHasDot = hasDotFn ? section.items.some(function (id) { return hasDotFn(id); }) : false;

  useEffect(function () {
    if (hasActive && !open) setOpen(true);
  }, [hasActive]);

  /* Auto-open group when a child gets a notification dot */
  useEffect(function () {
    if (groupHasDot && !open) setOpen(true);
  }, [groupHasDot]);

  if (collapsed) {
    return (
      <div style={{ marginBottom: 4 }}>
        <div style={{ height: 1, background: "var(--border-light)", margin: "6px 4px" }} />
        {section.items.map(function (id) {
          var itemHasDot = hasDotFn ? hasDotFn(id) : false;
          return <NavItem key={id} id={id} tab={tab} setTab={setTab} collapsed={true} t={t} showDot={itemHasDot} onClearDot={onClearDot} showRedesign={NEEDS_REDESIGN[id]} />;
        })}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={function () { setOpen(!open); }}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", height: BTN_H, padding: "0 12px",
          border: "none", borderRadius: 8,
          background: hasActive && !open ? "var(--brand-bg)" : "transparent",
          cursor: "pointer", userSelect: "none",
        }}
      >
        {GroupIcon ? (
          <GroupIcon
            size={20}
            weight={hasActive ? "fill" : "regular"}
            color={hasActive ? "var(--brand)" : "var(--text-muted)"}
            style={{ flexShrink: 0 }}
          />
        ) : null}
        <span style={{
          fontSize: 14, fontWeight: hasActive ? 600 : 500, flex: 1, textAlign: "left",
          color: hasActive ? "var(--brand)" : "var(--text-secondary)",
        }}>
          {t.nav[section.id] || section.id}
        </span>
        {groupHasDot && !open ? (
          <span style={{
            position: "absolute", top: 4, right: 4,
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--brand)",
            boxShadow: "0 0 0 2px var(--bg-card)",
            animation: "fcDotPulse 2s ease-in-out infinite",
          }} />
        ) : null}
        <CaretDown
          size={14}
          color={hasActive ? "var(--brand)" : "var(--text-ghost)"}
          style={{ transition: "transform 0.15s", transform: open ? "rotate(0)" : "rotate(-90deg)", flexShrink: 0 }}
        />
      </button>
      {open ? (
        <div style={{ paddingTop: 2 }}>
          {section.items.map(function (id) {
            var itemHasDot = hasDotFn ? hasDotFn(id) : false;
            return <NavItem key={id} id={id} tab={tab} setTab={setTab} collapsed={false} t={t} indent showDot={itemHasDot} onClearDot={onClearDot} showRedesign={NEEDS_REDESIGN[id]} />;
          })}
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({ icon, label, onClick, color }) {
  var [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={function () { setH(true); }}
      onMouseLeave={function () { setH(false); }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", height: BTN_H, padding: "0 12px",
        border: "none", borderRadius: 8,
        background: h ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", fontSize: 14, fontWeight: 500,
        color: color || "var(--text-secondary)", textAlign: "left",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileFooter({ cfg, collapsed, dark, toggle, lang, toggleLang, onOpenExport, setTab, t }) {
  var authCtx = useAuth();
  var showAdmin = isAdminEnabled() && authCtx && authCtx.user && authCtx.user.role === "admin";
  var [open, setOpen] = useState(false);
  var [confirmLeave, setConfirmLeave] = useState(false);
  var ref = useRef(null);
  var btnRef = useRef(null);
  var [menuPos, setMenuPos] = useState({ bottom: 0, left: 0, width: 240 });
  var isNonOwner = authCtx && authCtx.isOwner === false;

  useEffect(function () {
    if (!open) return;
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return function () { document.removeEventListener("mousedown", onClick); };
  }, [open]);

  useEffect(function () {
    if (open && btnRef.current) {
      var rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left - 4,
        width: rect.width + 8,
      });
    }
  }, [open]);

  var companyName = cfg.companyName || (lang === "fr" ? "Mon entreprise" : "My company");
  /* Always show the logged-in user's own name, not the legal representative */
  var userName = (authCtx && authCtx.user && authCtx.user.displayName)
    ? authCtx.user.displayName
    : (cfg.userName || "");
  var profileEmpty = !cfg.companyName && !userName;
  var initialsSource = (authCtx && authCtx.user && authCtx.user.displayName) ? authCtx.user.displayName : companyName;
  var initials = (initialsSource || "?").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();

  function close() { setOpen(false); }

  var dropupMenu = open && !collapsed ? createPortal(
    <div ref={ref} style={{
      position: "fixed", bottom: menuPos.bottom, left: menuPos.left, width: menuPos.width,
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "0 -8px 24px -4px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.06)",
      padding: 6, zIndex: 200,
    }}>
      <MenuRow icon={<Buildings size={18} color="var(--text-muted)" />} label={lang === "fr" ? "Profil entreprise" : "Company profile"} onClick={function () { setTab("profile"); close(); }} />
      <MenuRow icon={<GearSix size={18} color="var(--text-muted)" />} label={t.tabs.set || "Settings"} onClick={function () { setTab("set"); close(); }} />
      {showAdmin ? (
        <MenuRow icon={<ShieldCheck size={18} color="var(--brand)" />} label="Admin" onClick={function () { setTab("admin"); close(); }} />
      ) : null}
      {!(authCtx && authCtx.storageMode === "cloud") ? (
        <MenuRow icon={<UploadSimple size={18} color="var(--text-muted)" />} label="Export / Import" onClick={function () { onOpenExport(); close(); }} />
      ) : null}

      <div style={{ height: 1, background: "var(--border-light)", margin: "4px 6px" }} />

      <MenuRow icon={<ClockCounterClockwise size={18} color="var(--text-muted)" />} label={t.tabs.changelog || "Changelog"} onClick={function () { setTab("changelog"); close(); }} />
      <MenuRow icon={<Scales size={18} color="var(--text-muted)" />} label={t.tabs.credits || "Credits"} onClick={function () { setTab("credits"); close(); }} />

      <div style={{ height: 1, background: "var(--border-light)", margin: "4px 6px" }} />

      <MenuRow icon={<Translate size={18} color="var(--text-muted)" />} label={lang === "fr" ? "English" : "Français"} onClick={function () { toggleLang(); close(); }} />
      <MenuRow
        icon={dark ? <Sun size={18} weight="fill" color="var(--color-sun)" /> : <Moon size={18} color="var(--text-muted)" />}
        label={dark ? "Light mode" : "Dark mode"}
        onClick={function () { toggle(); close(); }}
      />
      {authCtx && authCtx.user ? (
        <>
          <div style={{ height: 1, background: "var(--border-light)", margin: "4px 6px" }} />
          <MenuRow
            icon={<SignOut size={18} color="var(--color-error)" />}
            label={lang === "fr" ? "Se d\u00e9connecter" : "Log out"}
            onClick={function () { authCtx.signOut(); close(); }}
            color="var(--color-error)"
          />
        </>
      ) : null}
    </div>,
    document.body
  ) : null;

  return (
    <div style={{
      paddingTop: 12, position: "relative",
    }}>
      {dropupMenu}
      {profileEmpty ? <style>{"@keyframes fc-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}"}</style> : null}

      <button
        ref={btnRef}
        onClick={function () { if (collapsed) { setTab("set"); } else { setOpen(!open); } }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", height: 56, padding: collapsed ? "0" : "0 8px",
          justifyContent: collapsed ? "center" : "flex-start",
          border: "none", borderRadius: 8,
          background: open ? "var(--bg-hover)" : "transparent",
          cursor: "pointer", transition: "background 0.1s",
          userSelect: "none",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, fontWeight: 700,
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            letterSpacing: "-0.3px",
          }}>
            {initials}
          </div>
          <div style={{
            position: "absolute", bottom: -1, right: -1,
            width: 12, height: 12, borderRadius: "50%",
            background: profileEmpty ? "var(--color-warning)" : "var(--color-success)",
            border: "2.5px solid var(--bg-card)",
            animation: profileEmpty ? "fc-pulse 2s ease-in-out infinite" : "none",
          }} />
        </div>

        {!collapsed ? (
          <>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}>
                {companyName}
              </div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}>
                {profileEmpty
                  ? (lang === "fr" ? "Configurer votre profil" : "Set up your profile")
                  : (userName || (lang === "fr" ? "Configurer le profil" : "Set up profile"))}
              </div>
            </div>
            <CaretUp size={16} color="var(--text-ghost)" style={{ flexShrink: 0 }} />
          </>
        ) : null}
      </button>

    </div>
  );
}

function SidebarInsight({ totalRevenue, monthlyCosts, collapsed, onClick, t, lang }) {
  if (collapsed) return null;
  var annCosts = monthlyCosts * 12;
  var coverage = annCosts > 0 ? Math.min(totalRevenue / annCosts, 1.5) : 0;
  var coveragePct = Math.round(coverage * 100);
  var isProfitable = totalRevenue >= annCosts && annCosts > 0;
  var noData = totalRevenue === 0 && monthlyCosts === 0;
  if (noData) return null;

  var color = isProfitable ? "var(--color-success)" : coverage >= 0.6 ? "var(--color-warning)" : "var(--color-error)";
  var bgColor = isProfitable ? "var(--color-success-bg)" : coverage >= 0.6 ? "var(--color-warning-bg)" : "var(--color-error-bg)";
  var barPct = Math.min(coveragePct, 100);

  var label = lang === "fr"
    ? (isProfitable ? "Rentable" : "Couverture des charges")
    : (isProfitable ? "Profitable" : "Cost coverage");
  var sub = lang === "fr"
    ? (isProfitable ? "Vos revenus couvrent vos charges" : "Vos revenus couvrent " + coveragePct + "% de vos charges")
    : (isProfitable ? "Revenue covers all costs" : "Revenue covers " + coveragePct + "% of costs");

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "var(--sp-3)", marginBottom: 12,
        background: bgColor, border: "1px solid var(--border-light)",
        borderRadius: 10, cursor: "pointer", textAlign: "left",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: color }}>{coveragePct}%</span>
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: barPct + "%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{sub}</div>
    </button>
  );
}

var PROFILE_CHECKS_FR = [
  { key: "_onboarding", label: "Créer un compte", always: true },
  { key: "companyName", label: "Nom de l'entreprise" },
  { key: "legalForm", label: "Forme juridique" },
  { key: "firstName", label: "Responsable légal" },
  { key: "email", label: "Email de contact" },
];
var PROFILE_CHECKS_EN = [
  { key: "_onboarding", label: "Create account", always: true },
  { key: "companyName", label: "Company name" },
  { key: "legalForm", label: "Legal form" },
  { key: "firstName", label: "Legal representative" },
  { key: "email", label: "Contact email" },
];

var CONFETTI_COLORS = ["#E8431A", "#22C55E", "#F59E0B", "#3B82F6", "#A855F7", "#EC4899"];
var CONFETTI_CSS = "@keyframes fc-confetti{0%{opacity:1;transform:translate(var(--tx),0) rotate(0deg)}100%{opacity:0;transform:translate(var(--tx2),var(--ty)) rotate(var(--tr))}}@keyframes fc-card-out{0%{opacity:1;transform:scale(1)}60%{opacity:1;transform:scale(1.02)}100%{opacity:0;transform:scale(0.95)}}";

function ConfettiOverlay() {
  var pieces = [];
  for (var i = 0; i < 24; i++) {
    var left = 20 + Math.random() * 60;
    var tx = (Math.random() - 0.5) * 80;
    var tx2 = tx + (Math.random() - 0.5) * 40;
    var ty = -(40 + Math.random() * 80);
    var tr = (Math.random() - 0.5) * 720;
    var delay = Math.random() * 0.3;
    var dur = 0.8 + Math.random() * 0.6;
    var size = 4 + Math.random() * 4;
    var color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    var isCircle = Math.random() > 0.5;
    pieces.push(
      <div key={i} style={{
        position: "absolute", left: left + "%", bottom: "50%",
        width: size, height: size,
        borderRadius: isCircle ? "50%" : 1,
        background: color,
        "--tx": tx + "px", "--tx2": tx2 + "px", "--ty": ty + "px", "--tr": tr + "deg",
        animation: "fc-confetti " + dur + "s ease-out " + delay + "s forwards",
        pointerEvents: "none",
      }} />
    );
  }
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>{pieces}</div>;
}

function ProfileCompletion({ cfg, collapsed, onClick, lang }) {
  if (collapsed) return null;
  var checks = lang === "fr" ? PROFILE_CHECKS_FR : PROFILE_CHECKS_EN;
  var done = 0;
  checks.forEach(function (c) { if (c.always || cfg[c.key]) done++; });
  var isComplete = done === checks.length;

  var [celebrating, setCelebrating] = useState(false);
  var [hidden, setHidden] = useState(false);
  var prevDoneRef = useRef(done);

  useEffect(function () {
    if (isComplete && prevDoneRef.current < checks.length) {
      setCelebrating(true);
      var t1 = setTimeout(function () { setHidden(true); }, 2400);
      return function () { clearTimeout(t1); };
    }
    prevDoneRef.current = done;
  }, [isComplete, done]);

  if (hidden) return null;
  if (isComplete && !celebrating) return null;

  var pct = (done / checks.length) * 100;

  return (
    <>
      <style>{CONFETTI_CSS}</style>
      <div style={{
        width: "100%", padding: "var(--sp-3)", marginBottom: 8,
        background: celebrating ? "var(--color-success-bg)" : "var(--bg-accordion)",
        border: "1px solid " + (celebrating ? "var(--color-success-border)" : "var(--border-light)"),
        borderRadius: 10, textAlign: "left", position: "relative", overflow: "hidden",
        animation: celebrating ? "fc-card-out 0.5s ease-in 1.9s forwards" : "none",
      }}>
        {celebrating ? <ConfettiOverlay /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: celebrating ? "var(--color-success)" : "var(--text-primary)" }}>
            {celebrating
              ? (lang === "fr" ? "Profil complet !" : "Profile complete!")
              : (lang === "fr" ? "Compléter le profil" : "Complete profile")}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: celebrating ? "var(--color-success)" : "var(--text-faint)" }}>
            {done + "/" + checks.length}
          </span>
        </div>
        <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: pct + "%", background: celebrating ? "var(--color-success)" : "var(--brand)", borderRadius: 3, transition: "width 0.4s ease" }} />
        </div>
        {!celebrating ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {checks.map(function (c) {
                var ok = c.always || !!cfg[c.key];
                return (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: ok ? "var(--text-faint)" : "var(--text-secondary)" }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: ok ? "var(--color-success)" : "var(--border)",
                      border: ok ? "none" : "1.5px solid var(--border-strong)",
                    }}>
                      {ok ? <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                    </div>
                    <span style={{ textDecoration: ok ? "line-through" : "none" }}>{c.label}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={onClick}
              style={{
                width: "100%", height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                background: "var(--bg-card)", color: "var(--text-secondary)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              {lang === "fr" ? "Continuer" : "Continue setup"}
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

function UpgradeTeaser({ collapsed, lang, onOpen }) {
  if (collapsed) return null;

  return (
    <div style={{
      width: "100%", padding: "var(--sp-3)", marginBottom: 8,
      background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
      borderRadius: 10, position: "relative",
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", marginBottom: 4 }}>
        {lang === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 8 }}>
        {lang === "fr"
          ? "Module premium verrouille. Vous pouvez decouvrir la page de presentation, mais la navigation detaillee reste cachee tant que le module n'est pas paye."
          : "Premium module locked. You can discover the overview page, but detailed navigation stays hidden until the module is paid."}
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, color: "var(--brand)",
        border: "none", background: "transparent", cursor: "pointer", padding: 0,
        fontFamily: "inherit",
      }}>
        {lang === "fr" ? "Decouvrir le module" : "Discover module"}
        <span style={{ fontSize: 14 }}>→</span>
      </button>
    </div>
  );
}

/* ── App Switcher ── */
function ModuleIcon({ letter, color, size }) {
  var s = size || 24;
  return (
    <div style={{
      width: s, height: s, borderRadius: Math.round(s * 0.25),
      background: color || "var(--brand)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: Math.round(s * 0.5), fontWeight: 800,
      fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
      lineHeight: 1, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

function AppSwitcher({ activeModule, setActiveModule, unlockedModules, collapsed, lang, setTab }) {
  var [open, setOpen] = useState(false);
  var lk = lang === "en" ? "en" : "fr";
  var current = APP_MODULES[activeModule] || APP_MODULES.core;
  var ref = useRef(null);

  useEffect(function () {
    if (!open) return;
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return function () { document.removeEventListener("mousedown", onClick); };
  }, [open]);

  function switchTo(modId) {
    setActiveModule(modId);
    var mod = APP_MODULES[modId];
    if (mod && mod.sections && mod.sections.length > 0) {
      var firstTab = mod.sections[0].type === "item" ? mod.sections[0].id : (mod.sections[0].items ? mod.sections[0].items[0] : null);
      if (firstTab) setTab(firstTab);
    }
    setOpen(false);
  }

  if (collapsed) return null;

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 12 }}>
      <button
        type="button"
        onClick={function () { setOpen(function (v) { return !v; }); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", height: 44, padding: "0 10px",
          border: "1px solid var(--border-light)", borderRadius: 10,
          background: open ? "var(--bg-hover)" : "transparent",
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        <ModuleIcon letter={current.letter} color={current.color} size={28} />
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.label[lk]}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.2 }}>
            {current.desc[lk]}
          </div>
        </div>
        <CaretDown size={12} color="var(--text-faint)" style={{ flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>

      {open ? (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 100,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          padding: 4,
          animation: "tooltipIn 0.1s ease",
        }}>
          {MODULE_KEYS.map(function (modId) {
            var mod = APP_MODULES[modId];
            var isActive = activeModule === modId;
            var isLocked = modId !== "core" && !(unlockedModules && unlockedModules[modId]);
            return (
              <button
                key={modId}
                type="button"
                onClick={function () { if (!isLocked) switchTo(modId); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "8px 10px",
                  border: "none", borderRadius: 8,
                  background: isActive ? "var(--brand-bg)" : "transparent",
                  cursor: isLocked ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: isLocked ? 0.45 : 1,
                  transition: "background 0.1s",
                }}
                onMouseEnter={function (e) { if (!isActive && !isLocked) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={function (e) { if (!isActive) e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
              >
                <ModuleIcon letter={mod.letter} color={mod.color} size={24} />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--brand)" : "var(--text-primary)" }}>
                    {mod.label[lk]}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{mod.desc[lk]}</div>
                </div>
                {isLocked ? (
                  <Lock size={12} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                ) : isActive ? (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ── Module Switcher Bar (sidebar footer, above profile) ── */
function ModuleSwitcherBar({ activeModule, setActiveModule, unlockedModules, lang, setTab }) {
  var lk = lang === "en" ? "en" : "fr";
  var available = MODULE_KEYS.filter(function (k) { return k === "core" || (unlockedModules && unlockedModules[k]); });
  var currentIdx = available.indexOf(activeModule || "core");
  if (currentIdx === -1) currentIdx = 0;

  function switchTo(idx) {
    var modId = available[idx];
    if (!modId) return;
    setActiveModule(modId);
    var mod = APP_MODULES[modId];
    if (mod && mod.sections && mod.sections.length > 0) {
      var firstTab = mod.sections[0].type === "item" ? mod.sections[0].id : (mod.sections[0].items ? mod.sections[0].items[0] : null);
      if (firstTab) setTab(firstTab);
    }
  }

  function goPrev() { switchTo((currentIdx - 1 + available.length) % available.length); }
  function goNext() { switchTo((currentIdx + 1) % available.length); }

  var current = APP_MODULES[available[currentIdx]] || APP_MODULES.core;

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "8px 8px", flexShrink: 0,
      userSelect: "none",
    }}>
      <button type="button" onClick={goPrev} style={{
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 6, background: "transparent",
        cursor: "pointer", color: "var(--text-faint)",
        transition: "background 0.1s",
      }}
        onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
      >
        <CaretLeft size={14} weight="bold" />
      </button>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        userSelect: "none",
      }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: "var(--r-full)",
          background: "var(--brand-bg)",
          color: "var(--brand)",
          fontSize: 11, fontWeight: 600,
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}>
          {current.label[lk]}
        </span>
      </div>
      <button type="button" onClick={goNext} style={{
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 6, background: "transparent",
        cursor: "pointer", color: "var(--text-faint)",
        transition: "background 0.1s",
      }}
        onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
      >
        <CaretRight size={14} weight="bold" />
      </button>
    </div>
  );
}

function CollapsedLogo({ onExpand }) {
  var [hov, setHov] = useState(false);
  return (
    <div style={{ marginBottom: 8, padding: "4px 4px 0" }}>
      <button
        type="button"
        onClick={onExpand}
        onMouseEnter={function () { setHov(true); }}
        onMouseLeave={function () { setHov(false); }}
        title="Expand sidebar"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", height: 44,
          border: "none", borderRadius: 8,
          background: hov ? "var(--bg-hover)" : "transparent",
          cursor: "pointer", transition: "background 0.15s",
          padding: 0,
        }}
      >
        <div style={{ opacity: hov ? 0 : 1, transition: "opacity 0.15s ease" }}>
          <ForecrestIcon size={28} />
        </div>
        <div style={{
          position: "absolute",
          opacity: hov ? 1 : 0,
          transform: hov ? "scale(1)" : "scale(0.85)",
          transition: "opacity 0.15s ease, transform 0.15s ease",
          display: "flex", alignItems: "center",
        }}>
          <CaretRight size={18} color="var(--text-primary)" weight="bold" />
        </div>
      </button>
    </div>
  );
}

function GlossaryNavItem({ onOpen, collapsed }) {
  var { open } = useGlossary();
  var t = useT().glossary || {};
  var [hov, setHov] = useState(false);
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ height: 1, background: "var(--border-light)", margin: "2px 4px 6px" }} />
      <button
        type="button"
        onClick={function () { open(null); if (onOpen) onOpen(); }}
        onMouseEnter={function () { setHov(true); }}
        onMouseLeave={function () { setHov(false); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", height: 36, padding: collapsed ? "0" : "0 12px",
          border: "none", borderRadius: 8,
          background: hov ? "var(--bg-hover)" : "transparent",
          cursor: "pointer", fontFamily: "inherit",
          justifyContent: collapsed ? "center" : "flex-start",
          transition: "background 0.1s",
        }}
      >
        <BookOpen size={18} weight="duotone" color="var(--text-muted)" style={{ flexShrink: 0 }} />
        {!collapsed ? <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>{t.page_title || "Glossaire"}</span> : null}
      </button>
    </div>
  );
}

export default function Sidebar({ tab, setTab, onOpenExport, onOpenSearch, onOpenShare, onOpenViewerShare, collapsed, setCollapsed, cfg, totalRevenue, monthlyCosts, devBannerVisible, activeModule, setActiveModule, paidModules, unlockedModules, isViewer }) {
  var { dark, toggle } = useTheme();
  var { lang, toggleLang } = useLang();
  var t = useT();
  var { hasDot, clearDot } = useNotifications();
  var bp = useBreakpoint();
  var isMobile = bp.isMobile;
  var isTablet = bp.isTablet;
  var [mobileOpen, setMobileOpen] = useState(false);

  useEffect(function () {
    if (isMobile || isTablet) setCollapsed(true);
  }, [isMobile, isTablet]);
  useEffect(function () {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  /* Lock body scroll when mobile sidebar is open (iOS-safe) */
  var scrollYRef = useRef(0);
  useEffect(function () {
    if (!isMobile) return;
    if (mobileOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = "-" + scrollYRef.current + "px";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollYRef.current);
    }
    return function () {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [mobileOpen, isMobile]);

  var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  var modKey = isMac ? "\u2318" : "Ctrl";

  var [scrolled, setScrolled] = useState(false);
  var [hasOverflowBelow, setHasOverflowBelow] = useState(false);
  var scrollRef = useRef(null);
  var [designSystemSelection, setDesignSystemSelection] = useState(getDesignSystemSelectionFromHash);
  useEffect(function () {
    var el = scrollRef.current;
    if (el) setHasOverflowBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  });
  var [recentOpen, setRecentOpen] = useState(false);
  var recentPages = useRecentPages(tab);

  useEffect(function () {
    if (tab !== "design-system") return;
    function syncSelection(e) {
      var nextId = e && e.detail ? e.detail : getDesignSystemSelectionFromHash();
      setDesignSystemSelection(getDesignSystemItem(nextId) ? nextId : getDefaultDesignSystemItemId());
    }
    syncSelection();
    window.addEventListener("hashchange", syncSelection);
    window.addEventListener("fc-design-system-select", syncSelection);
    return function () {
      window.removeEventListener("hashchange", syncSelection);
      window.removeEventListener("fc-design-system-select", syncSelection);
    };
  }, [tab]);

  function renderContent(forceExpanded) {
    var isCollapsed = forceExpanded ? false : collapsed;
    var isDesignSystem = tab === "design-system";
    var designSystemLabels = {
      tabs: DESIGN_SYSTEM_SECTIONS.reduce(function (acc, section) {
        section.items.forEach(function (item) { acc[item.id] = item.name; });
        return acc;
      }, {}),
      nav: DESIGN_SYSTEM_SECTIONS.reduce(function (acc, section) {
        acc[section.id] = section.label[lang === "en" ? "en" : "fr"];
        return acc;
      }, {}),
    };
    var designSystemSections = DESIGN_SYSTEM_SECTIONS.map(function (section) {
      return { id: section.id, type: "group", items: section.items.map(function (item) { return item.id; }) };
    });
    function handleDesignSystemSelect(id) {
      setDesignSystemSelection(id);
      window.history.replaceState(null, "", window.location.pathname + "#ds/" + id);
      window.dispatchEvent(new CustomEvent("fc-design-system-select", { detail: id }));
      if (mobileOpen) setMobileOpen(false);
    }
    return (
      <>
        {/* ── Sticky header: logo + search ── */}
        <div style={{ flexShrink: 0, position: "relative", zIndex: 2 }}>
          {/* Logo + collapse button — hidden on mobile (already in fixed header) */}
          {isMobile ? null : isCollapsed ? (
            <CollapsedLogo onExpand={function () { setCollapsed(false); }} />
          ) : (
            <div style={{
              display: "flex", alignItems: "center",
              padding: "4px 8px",
              marginBottom: 16, justifyContent: "space-between",
            }}>
              <div
                onClick={function () {
                  if (isDesignSystem) {
                    handleDesignSystemSelect(getDefaultDesignSystemItemId());
                    return;
                  }
                  var mod = APP_MODULES[activeModule || "core"] || APP_MODULES.core;
                  var firstTab = mod.sections[0].type === "item" ? mod.sections[0].id : (mod.sections[0].items ? mod.sections[0].items[0] : "overview");
                  setTab(firstTab);
                }}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}
              >
                {(function () {
                  if (isDesignSystem) {
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 6,
                          background: "var(--color-dev)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Package size={15} weight="fill" color="#fff" />
                        </div>
                        <span style={{
                          fontSize: 18, fontWeight: 800, color: "var(--text-primary)",
                          fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
                          letterSpacing: "-0.02em", lineHeight: 1,
                        }}>{t.tabs["design-system"] || "Design System"}</span>
                      </div>
                    );
                  }
                  var mod = APP_MODULES[activeModule || "core"] || APP_MODULES.core;
                  if (activeModule === "core" || !activeModule) {
                    return <ForecrestLockup height={26} />;
                  }
                  var ModIcon = mod.icon;
                  return (
                    <div key={activeModule} style={{ display: "flex", alignItems: "center", gap: 8, animation: "fc-mod-switch 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: "var(--brand)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ModIcon size={15} weight="fill" color="#fff" />
                      </div>
                      <span style={{
                        fontSize: 18, fontWeight: 800, color: "var(--text-primary)",
                        fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
                        letterSpacing: "-0.02em", lineHeight: 1,
                      }}>{mod.label[lang === "en" ? "en" : "fr"]}</span>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={function () { setCollapsed(true); }}
                title="Collapse sidebar"
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  padding: 4, display: "flex", alignItems: "center",
                  color: "var(--text-faint)", borderRadius: 6,
                }}
              >
                <CaretLeft size={16} />
              </button>
            </div>
          )}

          {/* Search */}
          {!isCollapsed ? (
            <button
              onClick={function () { if (onOpenSearch) onOpenSearch(); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", height: BTN_H, padding: "0 12px", marginBottom: 12,
                border: "1px solid var(--border)", borderRadius: 8,
                background: "var(--bg-page)", cursor: "pointer",
                fontSize: 14, color: "var(--text-faint)",
                userSelect: "none",
              }}
            >
              <MagnifyingGlass size={16} color="var(--text-ghost)" />
              <span style={{ flex: 1, textAlign: "left" }}>{t.sidebar_search || "Rechercher"}</span>
              <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[modKey, "K"].map(function (k) {
                  return (
                    <kbd key={k} style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: 20, height: 20, padding: "0 5px",
                      fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
                      color: "var(--text-secondary)", background: "var(--bg-page)",
                      border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
                      boxShadow: "0 1px 0 var(--border-strong)",
                      lineHeight: 1, whiteSpace: "nowrap",
                    }}>
                      {k}
                    </kbd>
                  );
                })}
              </span>
            </button>
          ) : null}
          {scrolled ? <div style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 6, background: "linear-gradient(to bottom, rgba(0,0,0,0.05), transparent)", pointerEvents: "none" }} /> : null}
        </div>

        {/* ── Scrollable area: nav + cards ── */}
        <div
          ref={scrollRef}
          onScroll={function (e) { var el = e.target; setScrolled(el.scrollTop > 0); setHasOverflowBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 1); }}
          className="sidebar-scroll"
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", minHeight: 0, scrollbarWidth: "none", padding: "0 4px" }}
        >
          {/* Recent pages — collapsible */}
          {!isCollapsed && recentPages.length > 1 ? (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={function () { setRecentOpen(function (v) { return !v; }); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  width: "100%", border: "none", background: "none", cursor: "pointer",
                  padding: "var(--sp-1) var(--sp-2)", marginBottom: 2,
                  userSelect: "none",
                }}
              >
                <SquaresFour size={12} color="var(--text-ghost)" weight={recentOpen ? "fill" : "regular"} />
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: 1.2, color: "var(--text-ghost)", flex: 1, textAlign: "left",
                }}>
                  {lang === "fr" ? "Récents" : "Recent"}
                </span>
                <CaretDown size={10} color="var(--text-ghost)" style={{ transition: "transform 0.15s", transform: recentOpen ? "rotate(0)" : "rotate(-90deg)" }} />
              </button>
              {recentOpen ? recentPages.slice(1, 4).map(function (entry) {
                var Icon = NAV_ICON_MAP[entry.id];
                var active = tab === entry.id;
                var ago = "";
                var diff = Date.now() - entry.ts;
                if (diff < 60000) ago = lang === "fr" ? "à l'instant" : "just now";
                else if (diff < 3600000) ago = Math.floor(diff / 60000) + (lang === "fr" ? " min" : "m ago");
                else if (diff < 86400000) ago = Math.floor(diff / 3600000) + "h";

                return (
                  <button
                    key={entry.id}
                    onClick={function () { setTab(entry.id); if (mobileOpen) setMobileOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", height: 34, padding: "0 10px",
                      border: "none", borderRadius: 6,
                      background: active ? "var(--brand-bg)" : "transparent",
                      cursor: "pointer", transition: "background 0.1s",
                      marginBottom: 1, userSelect: "none",
                    }}
                  >
                    {Icon ? <Icon size={13} weight={active ? "fill" : "regular"} color={active ? "var(--brand)" : "var(--text-ghost)"} style={{ flexShrink: 0 }} /> : null}
                    <span style={{
                      fontSize: 12, fontWeight: active ? 500 : 400,
                      color: active ? "var(--brand)" : "var(--text-faint)",
                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      textAlign: "left",
                    }}>
                      {t.tabs[entry.id] || entry.id}
                    </span>
                    {ago ? <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{ago}</span> : null}
                  </button>
                );
              }) : null}
              <div style={{ height: 1, background: "var(--border-light)", margin: "6px 4px" }} />
            </div>
          ) : null}

          {/* Navigation */}
          <nav key={activeModule || "core"} className="fc-nav-animate" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {isDesignSystem ? designSystemSections.map(function (section, si) {
              var delay = si * 60;
              return (
                <div key={section.id} style={{ animation: "fc-nav-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: delay + "ms" }}>
                  <NavGroup
                    section={section}
                    tab={designSystemSelection}
                    setTab={handleDesignSystemSelect}
                    collapsed={isCollapsed}
                    t={designSystemLabels}
                    hasDotFn={function () { return false; }}
                    onClearDot={function () {}}
                  />
                </div>
              );
            }) : (function () {
              var mod = APP_MODULES[activeModule || "core"] || APP_MODULES.core;
              return mod.sections.map(function (section, si) {
                var delay = si * 60;
                var wrap = function (child) {
                  return <div key={section.id} style={{ animation: "fc-nav-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: delay + "ms" }}>{child}</div>;
                };
                if (section.type === "item") {
                  return wrap(<NavItem id={section.id} tab={tab} setTab={function (id) { setTab(id); if (mobileOpen) setMobileOpen(false); }} collapsed={isCollapsed} t={t} showDot={hasDot(section.id)} onClearDot={clearDot} showRedesign={NEEDS_REDESIGN[section.id]} />);
                }
                return wrap(<NavGroup section={section} tab={tab} setTab={function (id) { setTab(id); if (mobileOpen) setMobileOpen(false); }} collapsed={isCollapsed} t={t} hasDotFn={hasDot} onClearDot={clearDot} />);
              });
            })()}
          </nav>

          {/* Glossary button (mobile only) */}
          {isMobile ? (
            <GlossaryNavItem onOpen={function () { setMobileOpen(false); }} collapsed={false} />
          ) : null}

          {/* Insight cards — ProfileCompletion hidden pending UX redesign (see roadmap) */}
        </div>

        {/* Bottom section: profile */}
        <div data-viewer-hide={isViewer ? "true" : undefined} style={{ flexShrink: 0, position: "relative", borderTop: "1px solid var(--border-light)" }}>
          {hasOverflowBelow ? <div style={{ position: "absolute", top: -6, left: 0, right: 0, height: 6, background: "linear-gradient(to top, rgba(0,0,0,0.05), transparent)", pointerEvents: "none", zIndex: 1 }} /> : null}
          <ProfileFooter
            cfg={cfg} collapsed={isCollapsed}
            dark={dark} toggle={toggle}
            lang={lang} toggleLang={toggleLang}
            onOpenExport={onOpenExport}
            setTab={function (id) { setTab(id); if (mobileOpen) setMobileOpen(false); }}
            t={t}
          />
        </div>
      </>
    );
  }

  /* Mobile */
  if (isMobile) {
    var lk = lang === "en" ? "en" : "fr";
    var HEADER_H = 56;

    function switchModule(modId) {
      setActiveModule(modId);
      var mod = APP_MODULES[modId];
      if (mod && mod.sections && mod.sections.length > 0) {
        var firstSection = mod.sections[0];
        var firstTab = firstSection.type === "item" ? firstSection.id : (firstSection.items ? firstSection.items[0] : null);
        if (firstTab) setTab(firstTab);
      }
      setMobileOpen(false);
    }

    return (
      <>
        {/* ── Fixed top header (safe-area aware) ── */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
          zIndex: 50,
        }}>
          {/* Row 1: hamburger + logo + share */}
          <div style={{
            height: HEADER_H,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={function () { setMobileOpen(!mobileOpen); }}
                style={{
                  width: 36, height: 36, border: "none", background: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8,
                }}
              >
                {mobileOpen ? <X size={22} color="var(--text-primary)" /> : <List size={22} color="var(--text-primary)" />}
              </button>
              <div style={{ cursor: "pointer" }} onClick={function () { setTab("overview"); setMobileOpen(false); }}>
                <ForecrestLockup height={22} />
              </div>
            </div>
            <button data-viewer-hide={isViewer ? "true" : undefined} onClick={onOpenShare} style={{
              width: 36, height: 36, border: "none", borderRadius: 8,
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShareNetwork size={18} color="var(--text-muted)" />
            </button>
          </div>

          {/* Row 2: module switcher tabs */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "0 12px 8px",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {MODULE_KEYS.map(function (modId) {
              var mod = APP_MODULES[modId];
              var isActive = (activeModule || "core") === modId;
              var isLocked = modId !== "core" && !(unlockedModules && unlockedModules[modId]);
              return (
                <button
                  key={modId}
                  onClick={function () { if (!isLocked) switchModule(modId); }}
                  style={{
                    flexShrink: 0,
                    height: 30, padding: "0 12px",
                    border: isActive ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                    borderRadius: 99,
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : isLocked ? "var(--text-faint)" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    fontFamily: "inherit", cursor: isLocked ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.12s",
                    opacity: isLocked ? 0.5 : 1,
                  }}
                >
                  {isLocked ? <Lock size={11} weight="bold" /> : null}
                  {mod.label[lk]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Overlay ── */}
        {mobileOpen ? createPortal(
          <div
            onClick={function (e) { if (e.target === e.currentTarget) setMobileOpen(false); }}
            style={{
              position: "fixed", inset: 0,
              top: "calc(" + HEADER_H + "px + 38px + env(safe-area-inset-top, 0px))",
              zIndex: 45,
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <div style={{
              width: "min(300px, 85vw)",
              height: "100%",
              background: "var(--bg-card)", borderRight: "1px solid var(--border)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              padding: "12px 12px",
            }}>
              {renderContent(true)}
            </div>
          </div>,
          document.body
        ) : null}
      </>
    );
  }

  /* Desktop */
  var W = collapsed ? 72 : isTablet ? 248 : bp.downXl ? 264 : 272;

  useEffect(function () {
    document.documentElement.style.setProperty("--fc-sidebar-w", W + "px");
  }, [W]);

  return (
    <aside style={{
      width: W,
      background: "var(--bg-card)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: collapsed ? "16px 8px" : "16px 16px",
      transition: "width 0.2s ease, padding 0.2s ease, height 0.3s ease",
      flexShrink: 0,
      position: "sticky",
      top: devBannerVisible ? 32 : 0,
      height: devBannerVisible ? "calc(100vh - 32px)" : "100vh",
      overflowX: "clip",
      zIndex: 40,
    }}>
      {renderContent(false)}
    </aside>
  );
}
