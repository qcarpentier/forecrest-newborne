import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlass, CaretDown, CaretUp, CaretLeft, CaretRight,
  ChartBar, CurrencyCircleDollar, Wallet, Bank, Receipt,
  Users, ChartPie, UsersThree, ShieldCheck, Scales, BookOpen,
  HourglassSimple, ClockCounterClockwise, Translate,
  GearSix, Sun, Moon, UploadSimple, List, X,
  CurrencyEur, TreeStructure, Gavel, Buildings, SquaresFour,
} from "@phosphor-icons/react";
import { useTheme } from "../context";
import { useT, useLang } from "../context";
import { APP_NAME } from "../constants/config";
import useRecentPages from "../hooks/useRecentPages";

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

var NAV_ICON_MAP = {
  overview: ChartBar,
  streams: CurrencyCircleDollar,
  opex: Receipt,
  salaries: Users,
  cashflow: Wallet,
  debt: Bank,
  equipment: HourglassSimple,
  accounting: BookOpen,
  ratios: Scales,
  sensitivity: ChartBar,
  equity: ChartPie,
  captable: UsersThree,
  pact: ShieldCheck,
};

var GROUP_ICON_MAP = {
  finances: CurrencyEur,
  tresorerie: Wallet,
  comptabilite: BookOpen,
  gouvernance: Gavel,
};

var NAV_SECTIONS = [
  { id: "overview", type: "item" },
  { id: "finances", type: "group", items: ["streams", "opex", "salaries", "equipment"] },
  { id: "tresorerie", type: "group", items: ["cashflow", "debt"] },
  { id: "comptabilite", type: "group", items: ["accounting", "ratios", "sensitivity"] },
  { id: "gouvernance", type: "group", items: ["equity", "captable", "pact"] },
];

function useIsMobile(bp) {
  var breakpoint = bp || 768;
  var [mobile, setMobile] = useState(typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(function () {
    function onResize() { setMobile(window.innerWidth < breakpoint); }
    window.addEventListener("resize", onResize);
    return function () { window.removeEventListener("resize", onResize); };
  }, [breakpoint]);
  return mobile;
}

function NavItem({ id, tab, setTab, collapsed, t, indent }) {
  var Icon = NAV_ICON_MAP[id];
  var active = tab === id;
  var [hov, setHov] = useState(false);
  return (
    <button
      onClick={function () { setTab(id); }}
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
      title={collapsed ? (t.tabs[id] || id) : undefined}
      style={{
        display: "flex", alignItems: "center",
        gap: 10, width: "100%",
        height: indent ? BTN_H - 4 : BTN_H,
        padding: collapsed ? "0" : (indent ? "0 12px 0 44px" : "0 12px"),
        justifyContent: collapsed ? "center" : "flex-start",
        border: "none", borderRadius: 8,
        background: active ? "var(--brand-bg)" : hov ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", transition: "background 0.1s",
        marginBottom: 2,
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
    </button>
  );
}

function NavGroup({ section, tab, setTab, collapsed, t }) {
  var hasActive = section.items.some(function (id) { return id === tab; });
  var [open, setOpen] = useState(hasActive);
  var GroupIcon = GROUP_ICON_MAP[section.id];

  useEffect(function () {
    if (hasActive && !open) setOpen(true);
  }, [hasActive]);

  if (collapsed) {
    return (
      <div style={{ marginBottom: 4 }}>
        <div style={{ height: 1, background: "var(--border-light)", margin: "6px 4px" }} />
        {section.items.map(function (id) {
          return <NavItem key={id} id={id} tab={tab} setTab={setTab} collapsed={true} t={t} />;
        })}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={function () { setOpen(!open); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", height: BTN_H, padding: "0 12px",
          border: "none", borderRadius: 8,
          background: hasActive && !open ? "var(--brand-bg)" : "transparent",
          cursor: "pointer",
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
        <CaretDown
          size={14}
          color={hasActive ? "var(--brand)" : "var(--text-ghost)"}
          style={{ transition: "transform 0.15s", transform: open ? "rotate(0)" : "rotate(-90deg)", flexShrink: 0 }}
        />
      </button>
      {open ? (
        <div style={{ paddingTop: 2 }}>
          {section.items.map(function (id) {
            return <NavItem key={id} id={id} tab={tab} setTab={setTab} collapsed={false} t={t} indent />;
          })}
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({ icon, label, onClick }) {
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
        color: "var(--text-secondary)", textAlign: "left",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileFooter({ cfg, collapsed, dark, toggle, lang, toggleLang, onOpenExport, setTab, t }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);
  var btnRef = useRef(null);
  var [menuPos, setMenuPos] = useState({ bottom: 0, left: 0, width: 240 });

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
  var userName = cfg.userName || "";
  var profileEmpty = !cfg.companyName && !cfg.userName;
  var initials = companyName.split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();

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
      <MenuRow icon={<UploadSimple size={18} color="var(--text-muted)" />} label="Export / Import" onClick={function () { onOpenExport(); close(); }} />

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
    </div>,
    document.body
  ) : null;

  return (
    <div style={{
      borderTop: "1px solid var(--border-light)",
      paddingTop: 12, marginTop: 8, position: "relative",
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
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-gradient-end) 100%)",
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

function UpgradeTeaser({ collapsed, lang }) {
  if (collapsed) return null;
  var [dismissed, setDismissed] = useState(function () {
    try { return localStorage.getItem("fc-upgrade-dismissed") === "1"; } catch (e) { return false; }
  });
  if (dismissed) return null;

  return (
    <div style={{
      width: "100%", padding: "var(--sp-3)", marginBottom: 8,
      background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
      borderRadius: 10, position: "relative",
    }}>
      <button
        onClick={function () {
          setDismissed(true);
          try { localStorage.setItem("fc-upgrade-dismissed", "1"); } catch (e) {}
        }}
        style={{
          position: "absolute", top: 6, right: 6, border: "none", background: "none",
          cursor: "pointer", padding: 2, display: "flex", color: "var(--text-faint)",
        }}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", marginBottom: 4 }}>
        {lang === "fr" ? "Modules avancés" : "Advanced modules"}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 8 }}>
        {lang === "fr"
          ? "Marketing, infrastructure cloud, commissions réseau — débloquez des outils de simulation puissants."
          : "Marketing, cloud infra, network commissions — unlock powerful simulation tools."}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, color: "var(--brand)",
      }}>
        {lang === "fr" ? "Bientôt disponible" : "Coming soon"}
        <span style={{ fontSize: 14 }}>→</span>
      </div>
    </div>
  );
}

export default function Sidebar({ tab, setTab, onOpenExport, onOpenSearch, collapsed, setCollapsed, cfg, totalRevenue, monthlyCosts, devBannerVisible }) {
  var { dark, toggle } = useTheme();
  var { lang, toggleLang } = useLang();
  var t = useT();
  var isMobile = useIsMobile(768);
  var [mobileOpen, setMobileOpen] = useState(false);

  useEffect(function () {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);
  useEffect(function () {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  var modKey = isMac ? "\u2318" : "Ctrl";

  var [scrolled, setScrolled] = useState(false);
  var [recentOpen, setRecentOpen] = useState(false);
  var recentPages = useRecentPages(tab);

  function renderContent(forceExpanded) {
    var isCollapsed = forceExpanded ? false : collapsed;
    return (
      <>
        {/* ── Sticky header: logo + search ── */}
        <div style={{ flexShrink: 0, position: "relative", zIndex: 2, boxShadow: scrolled ? "0 4px 12px -2px rgba(0,0,0,0.08)" : "none", transition: "box-shadow 0.2s" }}>
          {/* Logo + collapse button */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: isCollapsed ? "4px 0" : "4px 8px",
            marginBottom: 16, justifyContent: isCollapsed ? "center" : "space-between",
          }}>
            <div
              onClick={function () { setTab("overview"); if (mobileOpen) setMobileOpen(false); }}
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              {isCollapsed ? <ForecrestIcon size={28} /> : <ForecrestLockup height={26} />}
            </div>
            {!isMobile && !isCollapsed ? (
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
            ) : null}
            {!isMobile && isCollapsed ? (
              <button
                onClick={function () { setCollapsed(false); }}
                title="Expand sidebar"
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  padding: 4, display: "flex", alignItems: "center",
                  color: "var(--text-faint)", borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <CaretRight size={16} />
              </button>
            ) : null}
          </div>

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
        </div>

        {/* ── Scrollable area: nav + cards ── */}
        <div
          onScroll={function (e) { setScrolled(e.target.scrollTop > 0); }}
          className="sidebar-scroll"
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", minHeight: 0, scrollbarWidth: "none" }}
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
                      marginBottom: 1,
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
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_SECTIONS.map(function (section) {
              if (section.type === "item") {
                return <NavItem key={section.id} id={section.id} tab={tab} setTab={function (id) { setTab(id); if (mobileOpen) setMobileOpen(false); }} collapsed={isCollapsed} t={t} />;
              }
              return <NavGroup key={section.id} section={section} tab={tab} setTab={function (id) { setTab(id); if (mobileOpen) setMobileOpen(false); }} collapsed={isCollapsed} t={t} />;
            })}
          </nav>

          {/* Insight cards */}
          <div style={{ paddingTop: 8 }}>
            <ProfileCompletion
              cfg={cfg} collapsed={isCollapsed}
              onClick={function () { setTab("profile"); if (mobileOpen) setMobileOpen(false); }}
              lang={lang}
            />
          </div>
        </div>

        {/* Profile — sticky bottom */}
        <ProfileFooter
          cfg={cfg} collapsed={isCollapsed}
          dark={dark} toggle={toggle}
          lang={lang} toggleLang={toggleLang}
          onOpenExport={onOpenExport}
          setTab={function (id) { setTab(id); if (mobileOpen) setMobileOpen(false); }}
          t={t}
        />
      </>
    );
  }

  /* Mobile */
  if (isMobile) {
    return (
      <>
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 56,
          background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
          zIndex: 50,
        }}>
          <button
            onClick={function () { setMobileOpen(!mobileOpen); }}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex" }}
          >
            {mobileOpen ? <X size={22} color="var(--text-primary)" /> : <List size={22} color="var(--text-primary)" />}
          </button>
          <div style={{ cursor: "pointer" }} onClick={function () { setTab("overview"); }}>
            <ForecrestLockup height={22} />
          </div>
        </div>

        {mobileOpen ? createPortal(
          <div
            onClick={function (e) { if (e.target === e.currentTarget) setMobileOpen(false); }}
            style={{
              position: "fixed", inset: 0, top: 56, zIndex: 45,
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <div style={{
              width: 280, height: "calc(100vh - 56px)",
              background: "var(--bg-card)", borderRight: "1px solid var(--border)",
              display: "flex", flexDirection: "column",
              padding: "16px 12px", overflowY: "auto",
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
  var W = collapsed ? 68 : 272;

  return (
    <aside style={{
      width: W,
      minHeight: devBannerVisible ? "calc(100vh - 32px)" : "100vh",
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
      overflowX: "hidden",
      zIndex: 40,
    }}>
      {renderContent(false)}
    </aside>
  );
}
