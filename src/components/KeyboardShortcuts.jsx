import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlass, X,
  ChartBar, CurrencyCircleDollar, Article, Wallet, Bank, Receipt,
  Users, ChartPie, UsersThree, ShieldCheck, Scales, BookOpen,
  HourglassSimple, Sliders,
  ArrowCounterClockwise, ArrowClockwise, UploadSimple, MonitorPlay, Keyboard,
  Code, ClockCounterClockwise,
} from "@phosphor-icons/react";
import { useT, useLang, useDevMode } from "../context";
import { RELEASE_DATE } from "../constants/config";

var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
var MOD = isMac ? "⌘" : "Ctrl";

function Kbd({ children }) {
  return (
    <kbd style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 20, height: 20, padding: "0 5px",
      fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
      color: "var(--text-secondary)", background: "var(--bg-page)",
      border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
      boxShadow: "0 1px 0 var(--border-strong)",
      lineHeight: 1, whiteSpace: "nowrap",
    }}>
      {children}
    </kbd>
  );
}

function KbdCombo({ keys }) {
  if (!keys || keys.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
      {keys.map(function (k, i) { return <Kbd key={i}>{k}</Kbd>; })}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: "6px 10px 4px",
      fontSize: 11, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: 0.6, color: "var(--text-faint)",
    }}>
      {children}
    </div>
  );
}

function GroupLabel({ children, first }) {
  return (
    <div style={{
      padding: "3px 10px 2px",
      fontSize: 10, fontWeight: 500,
      letterSpacing: 0.3, color: "var(--text-faint)",
      marginTop: first ? 0 : 6,
    }}>
      {children}
    </div>
  );
}

function CommandItem({ icon: Icon, label, keys, active, onMouseDown, onMouseEnter, idx, dot }) {
  return (
    <button
      data-cmd-idx={idx}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "7px 10px",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", textAlign: "left", color: "var(--text-primary)",
        transition: "background 0.08s",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
        <Icon size={15} color={active ? "var(--brand)" : "var(--text-muted)"} />
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "var(--text-primary)" : "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
        {label}
        {dot ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)", flexShrink: 0 }} /> : null}
      </span>
      <KbdCombo keys={keys} />
    </button>
  );
}

export default function CommandPalette({ open, onClose, setTab, onUndo, onRedo, onExport, onPresentation }) {
  var [query, setQuery] = useState("");
  var [cursor, setCursor] = useState(0);
  var inputRef = useRef(null);
  var listRef = useRef(null);
  var allItemsRef = useRef([]);
  var t = useT();
  var { lang } = useLang();
  var devCtx = useDevMode();
  var s = t.shortcuts || {};
  var tb = t.tabs || {};
  var sg = s.groups || {};
  var changelogRecent = RELEASE_DATE && (Date.now() - new Date(RELEASE_DATE).getTime()) < 7 * 86400000;

  useEffect(function () {
    if (!open) return;
    setQuery("");
    setCursor(0);
    requestAnimationFrame(function () { if (inputRef.current) inputRef.current.focus(); });
    var prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    return function () { document.documentElement.style.overflowY = prev; };
  }, [open]);

  useEffect(function () { setCursor(0); }, [query]);

  // Scroll active item into view
  useEffect(function () {
    if (!open || !listRef.current) return;
    var el = listRef.current.querySelector("[data-cmd-idx=\"" + cursor + "\"]");
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  var NAV_GROUPS = [
    {
      label: sg.dashboard || "Dashboard",
      items: [
        { id: "overview",  icon: ChartBar,              label: s.nav_overview || tb.overview, keys: ["1"] },
        { id: "plan",      icon: Article,               label: tb.plan,                      keys: ["2"] },
        { id: "streams",   icon: CurrencyCircleDollar,  label: s.nav_streams  || tb.streams, keys: ["3"] },
      ],
    },
    {
      label: sg.finance || "Finance",
      items: [
        { id: "opex",          icon: Receipt,         label: s.nav_opex || tb.opex,         keys: ["4"] },
        { id: "salaries",      icon: Users,           label: tb.salaries,                   keys: ["5"] },
        { id: "cashflow",      icon: Wallet,          label: s.nav_cashflow || tb.cashflow, keys: ["6"] },
        { id: "debt",          icon: Bank,            label: s.nav_debt || tb.debt,         keys: ["7"] },
        { id: "accounting",    icon: BookOpen,        label: tb.accounting,                 keys: ["8"] },
        { id: "ratios",        icon: Scales,          label: tb.ratios,                     keys: ["9"] },
        { id: "amortissement", icon: HourglassSimple, label: tb.amortissement,              keys: [] },
        { id: "sensitivity",  icon: ChartBar,        label: tb.sensitivity,                keys: [] },
      ],
    },
    {
      label: sg.equity || "Equity",
      items: [
        { id: "equity",   icon: ChartPie,   label: s.nav_equity   || tb.equity,   keys: [] },
        { id: "captable", icon: UsersThree,  label: s.nav_captable || tb.captable, keys: [] },
        { id: "pact",     icon: ShieldCheck, label: tb.pact,                       keys: [] },
      ],
    },
  ];

  var ACTION_ITEMS = [
    { id: "undo",      icon: ArrowCounterClockwise,  label: s.undo         || "Undo",              keys: [MOD, "Z"],       action: onUndo },
    { id: "redo",      icon: ArrowClockwise,         label: s.redo         || "Redo",              keys: [MOD, "⇧", "Z"],  action: onRedo },
    { id: "export",    icon: UploadSimple,           label: s.export       || "Export / Import",   keys: [MOD, "S"],       action: onExport },
    { id: "pres",      icon: MonitorPlay,            label: s.presentation || "Presentation",      keys: [MOD, "P"],       action: onPresentation },
    { id: "shortcuts", icon: Keyboard,               label: s.help         || "Raccourcis clavier", keys: ["?"],           action: onClose },
    { id: "changelog", icon: ClockCounterClockwise,  label: tb.changelog,                            keys: [],              dot: changelogRecent },
    { id: "devmode",   icon: Code,                   label: (s.devmode || "Developer Mode") + (devCtx && devCtx.devMode ? " ✓" : ""), keys: [MOD, "⇧", "D"], action: function () { if (devCtx) devCtx.toggle(); } },
  ];

  var q = query.toLowerCase().trim();

  // Filter groups and flatten
  var visibleGroups = NAV_GROUPS.map(function (g) {
    return {
      label: g.label,
      items: q ? g.items.filter(function (i) { return i.label && i.label.toLowerCase().includes(q); }) : g.items,
    };
  }).filter(function (g) { return g.items.length > 0; });

  var flatNav = [];
  visibleGroups.forEach(function (g) {
    g.items.forEach(function (item) { flatNav.push(item); });
  });

  var visibleActions = q
    ? ACTION_ITEMS.filter(function (i) { return i.label && i.label.toLowerCase().includes(q); })
    : ACTION_ITEMS;

  var allItems = flatNav.map(function (i) { return { ...i, type: "nav" }; }).concat(
    visibleActions.map(function (i) { return { ...i, type: "action" }; })
  );
  allItemsRef.current = allItems;

  function execute(item) {
    if (item.type === "nav") { setTab(item.id); }
    else if (item.action) { item.action(); }
    onClose();
  }

  useEffect(function () {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor(function (c) { return Math.min(c + 1, allItemsRef.current.length - 1); });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor(function (c) { return Math.max(c - 1, 0); });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        var item = allItemsRef.current[cursor];
        if (item) execute(item);
      }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [open, cursor, onClose]);

  if (!open) return null;

  var noResults = allItems.length === 0;

  // Build index map for groups
  var navIdx = 0;

  return createPortal(
    <div
      onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "var(--overlay-bg)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-modal)",
        width: 540, maxWidth: "92vw",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        maxHeight: "72vh",
        animation: "tooltipIn 0.1s ease",
      }}>

        {/* Search header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <MagnifyingGlass size={16} color="var(--text-faint)" weight="bold" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            placeholder={s.search_placeholder || "Search pages and actions..."}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, color: "var(--text-primary)", outline: "none",
              fontFamily: "inherit", minWidth: 0,
            }}
          />
          <button
            onMouseDown={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24,
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer", flexShrink: 0,
            }}
          >
            <X size={12} color="var(--text-faint)" weight="bold" />
          </button>
        </div>

        {/* Results list */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1, padding: "var(--sp-2)" }} className="custom-scroll">
          {noResults ? (
            <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
              {s.no_results || "No results"}
            </div>
          ) : null}

          {visibleGroups.length > 0 ? (
            <div>
              {!q ? <SectionLabel>{s.nav || "Navigation"}</SectionLabel> : null}
              {visibleGroups.map(function (group, gi) {
                return (
                  <div key={group.label}>
                    {!q ? <GroupLabel first={gi === 0}>{group.label}</GroupLabel> : null}
                    {group.items.map(function (item) {
                      var idx = navIdx++;
                      return (
                        <CommandItem
                          key={item.id}
                          idx={idx}
                          icon={item.icon}
                          label={item.label}
                          keys={item.keys}
                          dot={item.dot}
                          active={cursor === idx}
                          onMouseDown={function () { execute({ ...item, type: "nav" }); }}
                          onMouseEnter={function () { setCursor(idx); }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}

          {visibleActions.length > 0 ? (
            <div style={{ marginTop: flatNav.length > 0 ? "var(--sp-2)" : 0 }}>
              <SectionLabel>{s.actions || "Actions"}</SectionLabel>
              {visibleActions.map(function (item, i) {
                var idx = flatNav.length + i;
                return (
                  <CommandItem
                    key={item.id}
                    idx={idx}
                    icon={item.icon}
                    label={item.label}
                    keys={item.keys}
                    active={cursor === idx}
                    onMouseDown={function () { execute({ ...item, type: "action" }); }}
                    onMouseEnter={function () { setCursor(idx); }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Footer hint */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 14px",
          borderTop: "1px solid var(--border)",
          fontSize: 11, color: "var(--text-faint)",
          flexShrink: 0,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Kbd>↑</Kbd><Kbd>↓</Kbd>
            <span style={{ marginLeft: 2 }}>{s.footer_navigate || "navigate"}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Kbd>↵</Kbd>
            <span style={{ marginLeft: 2 }}>{s.footer_select || "select"}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Kbd>esc</Kbd>
            <span style={{ marginLeft: 2 }}>{s.footer_close || "close"}</span>
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            <Kbd>{MOD}</Kbd><Kbd>K</Kbd>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
