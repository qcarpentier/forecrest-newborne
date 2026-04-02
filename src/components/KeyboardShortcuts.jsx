import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import {
  MagnifyingGlass, X, Plus,
  ChartBar, CurrencyCircleDollar, Wallet, Bank, Receipt,
  Users, ChartPie, UsersThree, ShieldCheck, Scales, BookOpen,
  HourglassSimple, Package, TreeStructure, TrendUp, ChartLine,
  ArrowCounterClockwise, ArrowClockwise, UploadSimple, ShareNetwork, MonitorPlay, Keyboard,
  Code, ClockCounterClockwise, Tag,
  PencilSimple, CopySimple, Compass, GearSix,
} from "@phosphor-icons/react";
import { useT, useLang, useDevMode } from "../context";
import { RELEASE_DATE } from "../constants/config";

var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
var MOD = isMac ? "\u2318" : "Ctrl";

/* ── Shared sub-components ── */

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

function KbdCombo({ keys, lang }) {
  if (!keys || keys.length === 0) return null;
  var thenLabel = lang === "fr" ? "puis" : "then";
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
      {keys.map(function (k, i) {
        if (k === "then") return <span key={i} style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400, margin: "0 1px" }}>{thenLabel}</span>;
        return <Kbd key={i}>{k}</Kbd>;
      })}
    </div>
  );
}

function LeftColumnItem({ icon: Icon, label, desc, active, onClick }) {
  var [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={function (e) { e.preventDefault(); onClick(); }}
      onMouseEnter={function () { setHovered(true); }}
      onMouseLeave={function () { setHovered(false); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 8,
        width: "100%", padding: "7px 10px",
        border: "none", borderRadius: "var(--r-sm)",
        background: active ? "var(--brand-bg)" : hovered ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", textAlign: "left",
        fontFamily: "inherit",
        transition: "background 0.08s",
      }}
    >
      <Icon size={14} weight="bold" color={active ? "var(--brand)" : hovered ? "var(--brand)" : "var(--text-faint)"} style={{ flexShrink: 0, marginTop: 2, transition: "color 0.08s" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 12, fontWeight: active ? 600 : 500,
          color: active ? "var(--brand)" : hovered ? "var(--text-primary)" : "var(--text-secondary)",
          transition: "color 0.08s", whiteSpace: "nowrap",
        }}>{label}</span>
        {desc ? (
          <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-faint)", lineHeight: 1.2 }}>{desc}</span>
        ) : null}
      </div>
    </button>
  );
}

/* ── Item list row for modify/duplicate modes ── */
function ItemRow({ label, pageLabel, icon: Icon, active, onClick, onHover }) {
  return (
    <button
      type="button"
      onMouseDown={function (e) { e.preventDefault(); onClick(); }}
      onMouseEnter={onHover}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "7px 10px",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", textAlign: "left",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        transition: "background 0.08s",
        fontFamily: "inherit", fontSize: 13,
      }}
    >
      {Icon ? (
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
          <Icon size={15} color={active ? "var(--brand)" : "var(--text-muted)"} />
        </span>
      ) : null}
      <span style={{ flex: 1, fontWeight: active ? 500 : 400 }}>{label}</span>
      {pageLabel ? (
        <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400, flexShrink: 0 }}>{pageLabel}</span>
      ) : null}
    </button>
  );
}

/* ── Add-mode destination targets ── */

var ADD_TARGETS = [
  { id: "opex",      icon: Receipt,             defaultPcmn: "6160" },
  { id: "streams",   icon: CurrencyCircleDollar, defaultPcmn: "7020" },
  { id: "salaries",  icon: Users,               defaultPcmn: "6200" },
  { id: "equipment", icon: HourglassSimple,     defaultPcmn: "2400" },
  { id: "stocks",    icon: Package,             defaultPcmn: "3400" },
  { id: "debt",      icon: Bank,                defaultPcmn: "1700" },
];

/* ── Page icon map ── */
var PAGE_ICONS = {
  opex: Receipt, streams: CurrencyCircleDollar, salaries: Users,
  equipment: HourglassSimple, stocks: Package, debt: Bank,
};

/* ── cmdk styles injected once ── */
var CMDK_STYLE_ID = "fc-cmdk-style";

function ensureCmdkStyles() {
  if (document.getElementById(CMDK_STYLE_ID)) return;
  var el = document.createElement("style");
  el.id = CMDK_STYLE_ID;
  el.textContent = [
    "[cmdk-item]{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border:none;border-radius:var(--r-md);background:transparent;cursor:pointer;text-align:left;color:var(--text-secondary);transition:background 0.08s;font-size:13px;font-family:inherit;outline:none}",
    "[cmdk-item][data-selected=\"true\"]{background:var(--bg-hover);color:var(--text-primary)}",
    "[cmdk-item][data-selected=\"true\"] [data-cmd-icon]{color:var(--brand)}",
    "[cmdk-item][data-disabled=\"true\"]{opacity:0.4;pointer-events:none}",
    "[cmdk-group-heading]{padding:6px 10px 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-faint)}",
    "[cmdk-list]{overflow-y:auto;overscroll-behavior:contain;scroll-padding-block:8px}",
    "[cmdk-separator]{height:1px;background:var(--border);margin:4px 10px}",
    "[cmdk-input]{flex:1;border:none;background:transparent;font-size:14px;color:var(--text-primary);outline:none;font-family:inherit;min-width:0}",
  ].join("\n");
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════════
   CommandPalette \u2014 cmdk-powered with Discord-style structured commands
   ════════════════════════════════════════════════════════════════ */

export default function CommandPalette({ open, onClose, setTab, tab, currentTabItems, allTabItems, onUndo, onRedo, onExport, onShare, onPresentation, onToggleAccounting, accountingMode, onAdd, onEdit, onDuplicate }) {
  var t = useT();
  var { lang } = useLang();
  var devCtx = useDevMode();
  var s = t.shortcuts || {};
  var tb = t.tabs || {};
  var nav = t.nav || {};
  var lk = lang === "en" ? "en" : "fr";
  var changelogRecent = RELEASE_DATE && (Date.now() - new Date(RELEASE_DATE).getTime()) < 7 * 86400000;

  var ACTION_HINT_MAP = {
    add: { fr: "Créer un élément", en: "Create an item" },
    modify: { fr: "Modifier un élément", en: "Edit an item" },
    duplicate: { fr: "Dupliquer un élément", en: "Duplicate an item" },
    goto: { fr: "Aller à une section", en: "Go to a section" },
    exportimport: { fr: "Sauvegarder ou charger", en: "Save or load" },
    present: { fr: "Mode présentation", en: "Presentation mode" },
  };

  /* ── State ── */
  var [page, setPage] = useState(null);          // null | "add" | "modify" | "duplicate" | "goto"
  var [search, setSearch] = useState("");
  var [cmdkValue, setCmdkValue] = useState("");
  var [addLabel, setAddLabel] = useState("");
  var [addTarget, setAddTarget] = useState("opex");
  var [addCursor, setAddCursor] = useState(0);
  var [itemSearch, setItemSearch] = useState("");
  var [itemCursor, setItemCursor] = useState(0);
  var [itemPageTarget, setItemPageTarget] = useState(tab);
  var [gotoSearch, setGotoSearch] = useState("");
  var [gotoCursor, setGotoCursor] = useState(0);
  var addInputRef = useRef(null);
  var itemInputRef = useRef(null);
  var gotoInputRef = useRef(null);
  var cmdkInputRef = useRef(null);
  var cmdkValueRef = useRef(cmdkValue);
  useEffect(function () { cmdkValueRef.current = cmdkValue; }, [cmdkValue]);

  /* ── Inject cmdk styles ── */
  useEffect(function () { ensureCmdkStyles(); }, []);

  /* ── Reset on open ── */
  useEffect(function () {
    if (!open) return;
    setPage(null);
    setSearch("");
    setCmdkValue("");
    setAddLabel("");
    setAddTarget("opex");
    setAddCursor(0);
    setItemSearch("");
    setItemCursor(0);
    setItemPageTarget(tab);
    setGotoSearch("");
    setGotoCursor(0);
    setTimeout(function () {
      if (cmdkInputRef.current) cmdkInputRef.current.focus();
    }, 60);
    var prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    return function () { document.documentElement.style.overflowY = prev; };
  }, [open]);

  /* ── Keep addTarget in sync with addCursor ── */
  useEffect(function () {
    if (page === "add" && ADD_TARGETS[addCursor]) {
      setAddTarget(ADD_TARGETS[addCursor].id);
    }
  }, [addCursor, page]);

  /* ── Navigation data ── */
  var NAV_GROUPS = [
    {
      label: nav.activite || "Mon activit\u00e9",
      items: [
        { id: "overview",  icon: ChartBar,              label: tb.overview,  keys: ["G", "then", "O"] },
        { id: "streams",   icon: CurrencyCircleDollar,  label: tb.streams,   keys: ["G", "then", "R"] },
        { id: "opex",      icon: Receipt,               label: tb.opex,      keys: ["G", "then", "C"] },
        { id: "salaries",  icon: Users,                 label: tb.salaries,  keys: ["G", "then", "E"] },
        { id: "equipment", icon: HourglassSimple,       label: tb.equipment, keys: ["G", "then", "Q"] },
        { id: "stocks",    icon: Package,               label: tb.stocks,    keys: ["G", "then", "S"] },
      ],
    },
    {
      label: nav.argent || "Mon argent",
      items: [
        { id: "cashflow",     icon: Wallet,     label: tb.cashflow,     keys: ["G", "then", "T"] },
        { id: "debt",         icon: Bank,        label: tb.debt,         keys: ["G", "then", "F"] },
        { id: "crowdfunding", icon: UsersThree,  label: tb.crowdfunding, keys: [] },
      ],
    },
    {
      label: nav.documents || "Mes documents",
      items: [
        { id: "income_statement", icon: TreeStructure, label: tb.income_statement, keys: ["G", "then", "D"] },
        { id: "balance_sheet",    icon: Scales,        label: tb.balance_sheet,    keys: ["G", "then", "B"] },
        { id: "accounting",       icon: BookOpen,      label: tb.accounting,       keys: ["G", "then", "A"] },
      ],
    },
    {
      label: nav.analyse || "Mon analyse",
      items: [
        { id: "ratios",      icon: TrendUp,   label: tb.ratios,      keys: ["G", "then", "K"] },
        { id: "sensitivity", icon: ChartLine, label: tb.sensitivity, keys: ["G", "then", "N"] },
      ],
    },
    {
      label: nav.societe || "Ma soci\u00e9t\u00e9",
      items: [
        { id: "equity",   icon: ChartPie,   label: tb.equity,   keys: ["G", "then", "I"] },
        { id: "captable", icon: UsersThree,  label: tb.captable, keys: ["G", "then", "P"] },
        { id: "pact",     icon: ShieldCheck, label: tb.pact,     keys: [] },
      ],
    },
  ];

  /* Keyword maps for Tab-completable cmdk items */
  var ADD_KW = ["ajouter", "add", "cr\u00e9er", "create", "nouveau", "new", "co\u00fbt", "cost", "charge", "revenu", "revenue", "employ\u00e9", "employee", "\u00e9quipement", "equipment", "stock", "financement", "debt"];
  var MODIFY_KW = ["modifier", "modify", "edit", "\u00e9diter", "changer", "change", "mettre \u00e0 jour", "update"];
  var DUPLICATE_KW = ["dupliquer", "duplicate", "copier", "copy", "cloner", "clone"];
  var GOTO_KW = ["aller", "aller \u00e0", "aller a", "goto", "go to", "go", "naviguer", "navigate", "section", "param\u00e8tres", "parametres", "settings"];
  var EXPORT_KW = ["export", "import", "exporter", "importer", "sauvegarder", "save", "t\u00e9l\u00e9charger", "download"];
  var PRESENT_KW = ["pr\u00e9senter", "present", "pr\u00e9sentation", "presentation", "plein \u00e9cran", "fullscreen"];

  /* Action commands (shown as cmdk items in main list) */
  var ACTION_COMMANDS = [
    { id: "undo", icon: ArrowCounterClockwise, label: s.undo || "Undo", keys: [MOD, "Z"], kw: ["undo", "annuler", "d\u00e9faire"] },
    { id: "redo", icon: ArrowClockwise, label: s.redo || "Redo", keys: [MOD, "\u21e7", "Z"], kw: ["redo", "refaire", "r\u00e9tablir"] },
    { id: "shortcuts", icon: Keyboard, label: s.help || "Raccourcis", keys: ["?"], kw: ["raccourcis", "shortcuts", "aide", "help"] },
    { id: "changelog", icon: ClockCounterClockwise, label: tb.changelog || "Changelog", keys: [], kw: ["changelog", "nouveaut\u00e9s", "versions"], dot: changelogRecent, target: "changelog" },
    { id: "devmode", icon: Code, label: s.devmode || "Mode dev", keys: [MOD, "\u21e7", "D"], kw: ["dev", "debug", "developer", "d\u00e9veloppeur"], active: devCtx && devCtx.devMode },
    { id: "accounting", icon: Scales, label: s.accounting || "Mode comptable", keys: [MOD, "\u21e7", "E"], kw: ["comptable", "accounting", "pcmn"], active: accountingMode },
  ];

  /* Left column commands */
  var LEFT_COMMANDS = [
    { id: "add",       icon: Plus,         label: s.cmd_add || (lang === "fr" ? "Ajouter" : "Add"),              desc: lang === "fr" ? "Cr\u00e9er un \u00e9l\u00e9ment" : "Create an item",           mode: "add" },
    { id: "modify",    icon: PencilSimple, label: lang === "fr" ? "Modifier" : "Edit",                           desc: lang === "fr" ? "Rechercher et \u00e9diter" : "Search and edit",                mode: "modify" },
    { id: "duplicate", icon: CopySimple,   label: lang === "fr" ? "Dupliquer" : "Duplicate",                     desc: lang === "fr" ? "Copier un \u00e9l\u00e9ment" : "Copy an item",                 mode: "duplicate" },
    { id: "goto",      icon: Compass,      label: lang === "fr" ? "Aller \u00e0" : "Go to",                      desc: lang === "fr" ? "Section sp\u00e9cifique" : "Specific section",                 mode: "goto" },
    { id: "share",     icon: ShareNetwork,  label: lang === "fr" ? "Partager" : "Share",                             desc: lang === "fr" ? "Inviter et gérer l'équipe" : "Invite and manage team" },
    { id: "export",    icon: UploadSimple,  label: s.export || "Export / Import",                                 desc: lang === "fr" ? "Sauvegarder ou charger" : "Save or load" },
  ];

  /* Goto sections */
  var GOTO_ITEMS = useMemo(function () {
    return [
      { id: "set",            label: tb.settings || (lang === "fr" ? "Param\u00e8tres" : "Settings"),                                       icon: GearSix,              tab: "set" },
      { id: "set_modules",    label: (tb.settings || "Param\u00e8tres") + " \u203a " + (lang === "fr" ? "Modules" : "Modules"),            icon: ChartBar,             tab: "set", opts: { section: "modules" } },
      { id: "set_tva",        label: (tb.settings || "Param\u00e8tres") + " \u203a TVA",                                                    icon: Receipt,              tab: "set", opts: { section: "tva" } },
      { id: "set_fiscal",     label: (tb.settings || "Param\u00e8tres") + " \u203a " + (lang === "fr" ? "Fiscal" : "Tax"),                   icon: Scales,               tab: "set", opts: { section: "fiscal" } },
      { id: "set_accounting", label: (tb.settings || "Param\u00e8tres") + " \u203a " + (lang === "fr" ? "Comptabilit\u00e9" : "Accounting"), icon: BookOpen,             tab: "set", opts: { section: "accounting" } },
      { id: "profile",        label: tb.profile || (lang === "fr" ? "Profil entreprise" : "Company profile"),                                icon: Users,                tab: "profile" },
      { id: "changelog",      label: tb.changelog || "Changelog",                                                                            icon: ClockCounterClockwise, tab: "changelog" },
      { id: "credits",        label: tb.credits || (lang === "fr" ? "Cr\u00e9dits" : "Credits"),                                             icon: BookOpen,             tab: "credits" },
    ];
  }, [lang, tb]);

  /* Filtered items for modify/duplicate (scoped to itemPageTarget) */
  var filteredItems = useMemo(function () {
    var sourceItems = (allTabItems && allTabItems[itemPageTarget]) ? allTabItems[itemPageTarget]
      : (itemPageTarget === tab ? (currentTabItems || []) : []);
    if (sourceItems.length === 0) return [];
    var q = itemSearch.toLowerCase().trim();
    if (!q) return sourceItems;
    return sourceItems.filter(function (item) {
      return item.label && item.label.toLowerCase().indexOf(q) >= 0;
    });
  }, [allTabItems, itemPageTarget, currentTabItems, tab, itemSearch]);

  /* Filtered goto items */
  var filteredGoto = useMemo(function () {
    var q = gotoSearch.toLowerCase().trim();
    if (!q) return GOTO_ITEMS;
    return GOTO_ITEMS.filter(function (item) {
      return item.label.toLowerCase().indexOf(q) >= 0;
    });
  }, [GOTO_ITEMS, gotoSearch]);

  /* ── Mode helpers ── */

  var enterAddMode = useCallback(function (targetId) {
    var idx = ADD_TARGETS.findIndex(function (t) { return t.id === targetId; });
    setAddTarget(targetId || "opex");
    setAddLabel("");
    setAddCursor(idx >= 0 ? idx : 0);
    setPage("add");
    requestAnimationFrame(function () {
      if (addInputRef.current) addInputRef.current.focus();
    });
  }, []);

  var enterItemMode = useCallback(function (mode) {
    setItemSearch("");
    setItemCursor(0);
    setItemPageTarget(tab);
    setPage(mode);
    requestAnimationFrame(function () {
      if (itemInputRef.current) itemInputRef.current.focus();
    });
  }, [tab]);

  var enterGotoMode = useCallback(function () {
    setGotoSearch("");
    setGotoCursor(0);
    setPage("goto");
    requestAnimationFrame(function () {
      if (gotoInputRef.current) gotoInputRef.current.focus();
    });
  }, []);

  var exitMode = useCallback(function () {
    setPage(null);
    setSearch("");
    requestAnimationFrame(function () {
      if (cmdkInputRef.current) cmdkInputRef.current.focus();
    });
  }, []);

  /* ── Submit handlers ── */

  var submitAdd = useCallback(function () {
    if (!addLabel.trim()) return;
    if (onAdd) onAdd(addTarget, addLabel.trim());
    onClose();
  }, [addLabel, addTarget, onAdd, onClose]);

  var submitModify = useCallback(function () {
    var item = filteredItems[itemCursor];
    if (!item) return;
    if (onEdit) onEdit(itemPageTarget, item.id);
    onClose();
  }, [filteredItems, itemCursor, onEdit, itemPageTarget, onClose]);

  var submitDuplicate = useCallback(function () {
    var item = filteredItems[itemCursor];
    if (!item) return;
    if (onDuplicate) onDuplicate(itemPageTarget, item.id);
    onClose();
  }, [filteredItems, itemCursor, onDuplicate, itemPageTarget, onClose]);

  var submitGoto = useCallback(function () {
    var item = filteredGoto[gotoCursor];
    if (!item) return;
    setTab(item.tab, item.opts);
    onClose();
  }, [filteredGoto, gotoCursor, setTab, onClose]);

  /* ── Execute action command ── */
  function executeAction(cmd) {
    switch (cmd.id) {
      case "undo": if (onUndo) onUndo(); break;
      case "redo": if (onRedo) onRedo(); break;
      case "shortcuts": break;
      case "devmode": if (devCtx) devCtx.toggle(); break;
      case "accounting": if (onToggleAccounting) onToggleAccounting(); break;
      default:
        if (cmd.target) setTab(cmd.target);
        break;
    }
    onClose();
  }

  /* ── Execute left column command ── */
  function executeLeftCommand(cmd) {
    if (cmd.mode === "add") { enterAddMode("opex"); }
    else if (cmd.mode === "modify") { enterItemMode("modify"); }
    else if (cmd.mode === "duplicate") { enterItemMode("duplicate"); }
    else if (cmd.mode === "goto") { enterGotoMode(); }
    else if (cmd.id === "share") { if (onShare) onShare(); onClose(); }
    else if (cmd.id === "export") { if (onExport) onExport(); onClose(); }
  }

  /* ── Tab interception in root mode ── */
  function handleRootKeyDown(e) {
    if (e.key !== "Tab") return;
    if (page !== null) return;
    var v = cmdkValueRef.current;
    var q = search.toLowerCase().trim();
    function matchesAny(val, keywords) {
      if (v === val) return true;
      if (!q) return false;
      for (var i = 0; i < keywords.length; i++) { if (keywords[i].indexOf(q) === 0 || q.indexOf(keywords[i]) === 0) return true; }
      return false;
    }
    if (matchesAny("add", ADD_KW))              { e.preventDefault(); enterAddMode("opex"); }
    else if (matchesAny("modify", MODIFY_KW))   { e.preventDefault(); enterItemMode("modify"); }
    else if (matchesAny("duplicate", DUPLICATE_KW)) { e.preventDefault(); enterItemMode("duplicate"); }
    else if (matchesAny("goto", GOTO_KW))       { e.preventDefault(); enterGotoMode(); }
    else if (matchesAny("exportimport", EXPORT_KW)) { e.preventDefault(); if (onExport) onExport(); onClose(); }
    else if (matchesAny("present", PRESENT_KW)) { e.preventDefault(); if (onPresentation) onPresentation(); onClose(); }
  }

  /* ── Keyboard for add mode ── */
  function handleAddKeyDown(e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Backspace" && addLabel === "") { e.preventDefault(); exitMode(); return; }
    if (e.key === "Enter") { e.preventDefault(); submitAdd(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setAddCursor(function (c) { return Math.min(c + 1, ADD_TARGETS.length - 1); }); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setAddCursor(function (c) { return Math.max(c - 1, 0); }); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      setAddCursor(function (c) { var next = (c + 1) % ADD_TARGETS.length; setAddTarget(ADD_TARGETS[next].id); return next; });
    }
  }

  /* ── Keyboard for modify/duplicate mode ── */
  function handleItemKeyDown(e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Backspace" && itemSearch === "") { e.preventDefault(); exitMode(); return; }
    if (e.key === "Enter") { e.preventDefault(); if (page === "modify") submitModify(); else submitDuplicate(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setItemCursor(function (c) { return Math.min(c + 1, filteredItems.length - 1); }); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setItemCursor(function (c) { return Math.max(c - 1, 0); }); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      var pageIds = ADD_TARGETS.map(function (t) { return t.id; });
      var idx = pageIds.indexOf(itemPageTarget);
      var next = pageIds[(idx + 1) % pageIds.length];
      setItemPageTarget(next);
      setItemCursor(0);
      setItemSearch("");
      return;
    }
  }

  /* ── Keyboard for goto mode ── */
  function handleGotoKeyDown(e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Backspace" && gotoSearch === "") { e.preventDefault(); exitMode(); return; }
    if (e.key === "Enter") { e.preventDefault(); submitGoto(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setGotoCursor(function (c) { return Math.min(c + 1, filteredGoto.length - 1); }); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setGotoCursor(function (c) { return Math.max(c - 1, 0); }); return; }
  }

  /* ── Close on Escape in root ── */
  useEffect(function () {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape" && !page) { onClose(); }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [open, page, onClose]);

  if (!open) return null;

  var currentPageLabel = tb[tab] || tab;
  var isItemMode = page === "modify" || page === "duplicate";
  var itemModeLabel = page === "modify"
    ? (lang === "fr" ? "Modifier" : "Edit")
    : (lang === "fr" ? "Dupliquer" : "Duplicate");
  var ItemModeIcon = page === "modify" ? PencilSimple : CopySimple;

  /* ═══════════════ RENDER ═══════════════ */

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
      <div
        onKeyDownCapture={handleRootKeyDown}
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-modal)",
          width: 720, maxWidth: "92vw",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "72vh",
          animation: "tooltipIn 0.1s ease",
        }}>

        {page === "add" ? (
          /* ═══ ADD MODE ═══ */
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0, flexWrap: "wrap",
            }}>
              <button type="button" onMouseDown={function (e) { e.preventDefault(); exitMode(); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: "var(--r-full)",
                  background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
                  color: "var(--brand)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                }}
              >
                <Plus size={11} weight="bold" />
                {s.cmd_add || (lang === "fr" ? "Ajouter" : "Add")}
                <X size={9} weight="bold" style={{ opacity: 0.6 }} />
              </button>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: "var(--r-full)",
                background: "var(--bg-accordion)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, flexShrink: 0,
              }}>
                <Tag size={11} weight="bold" color="var(--text-faint)" />
                {s.cmd_in || (lang === "fr" ? "dans" : "in")}:&nbsp;
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{tb[addTarget] || addTarget}</span>
              </span>
              <input ref={addInputRef} value={addLabel}
                onChange={function (e) { setAddLabel(e.target.value); }}
                onKeyDown={handleAddKeyDown}
                placeholder={s.cmd_add_placeholder || (lang === "fr" ? "Nom de l'\u00e9l\u00e9ment..." : "Item name...")}
                style={{ flex: 1, minWidth: 120, border: "none", background: "transparent", fontSize: 14, color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
              {renderLeftColumn("add")}
              <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)" }} className="custom-scroll">
                <div style={{ padding: "6px 10px 4px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-faint)" }}>
                  {s.cmd_destination || "Destination"}
                </div>
                {ADD_TARGETS.map(function (target, i) {
                  var Icon = target.icon;
                  var active = addCursor === i;
                  return (
                    <button key={target.id} type="button"
                      onMouseDown={function (e) { e.preventDefault(); setAddCursor(i); setAddTarget(target.id); if (addInputRef.current) addInputRef.current.focus(); }}
                      onMouseEnter={function () { setAddCursor(i); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px",
                        border: "none", borderRadius: "var(--r-md)",
                        background: active ? "var(--bg-hover)" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        transition: "background 0.08s", fontFamily: "inherit", fontSize: 13,
                      }}
                    >
                      <span style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
                        <Icon size={15} color={active ? "var(--brand)" : "var(--text-muted)"} />
                      </span>
                      <span style={{ flex: 1, fontWeight: active ? 500 : 400 }}>{tb[target.id] || target.id}</span>
                      {target.id === "opex" ? <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400 }}>{s.cmd_default || (lang === "fr" ? "par d\u00e9faut" : "default")}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            {renderFooter([
              { kbd: "\u21b5", label: s.cmd_create || (lang === "fr" ? "cr\u00e9er" : "create") },
              { kbd: "\u232b", label: s.cmd_back || (lang === "fr" ? "retour" : "back") },
              { kbd: "\u2191\u2193", label: s.cmd_switch_dest || "destination", split: true },
              { kbd: "Tab", label: s.cmd_cycle || (lang === "fr" ? "suivant" : "next") },
            ])}
          </>

        ) : isItemMode ? (
          /* ═══ MODIFY / DUPLICATE MODE ═══ */
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0, flexWrap: "wrap",
            }}>
              <button type="button" onMouseDown={function (e) { e.preventDefault(); exitMode(); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: "var(--r-full)",
                  background: page === "modify" ? "var(--bg-accordion)" : "var(--color-info-bg, var(--bg-accordion))",
                  border: "1px solid " + (page === "modify" ? "var(--border)" : "var(--color-info-border, var(--border))"),
                  color: page === "modify" ? "var(--text-secondary)" : "var(--color-info, var(--text-secondary))",
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                }}
              >
                <ItemModeIcon size={11} weight="bold" />
                {itemModeLabel}
                <X size={9} weight="bold" style={{ opacity: 0.6 }} />
              </button>
              <button type="button" tabIndex={-1}
                onMouseDown={function (e) {
                  e.preventDefault();
                  var pageIds = ADD_TARGETS.map(function (t) { return t.id; });
                  var idx = pageIds.indexOf(itemPageTarget);
                  var next = pageIds[(idx + 1) % pageIds.length];
                  setItemPageTarget(next);
                  setItemCursor(0);
                  setItemSearch("");
                  if (itemInputRef.current) itemInputRef.current.focus();
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: "var(--r-full)",
                  background: "var(--bg-accordion)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, flexShrink: 0,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Tag size={11} weight="bold" color="var(--text-faint)" />
                {s.cmd_in || (lang === "fr" ? "dans" : "in")}:&nbsp;
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{tb[itemPageTarget] || itemPageTarget}</span>
              </button>
              <input ref={itemInputRef} value={itemSearch}
                onChange={function (e) { setItemSearch(e.target.value); setItemCursor(0); }}
                onKeyDown={handleItemKeyDown}
                placeholder={lang === "fr" ? "Rechercher un \u00e9l\u00e9ment..." : "Search an item..."}
                style={{ flex: 1, minWidth: 120, border: "none", background: "transparent", fontSize: 14, color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
              {renderLeftColumn(page)}
              <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)" }} className="custom-scroll">
                {filteredItems.length > 0 ? (
                  <>
                    <div style={{ padding: "6px 10px 4px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-faint)" }}>
                      {currentPageLabel} ({filteredItems.length})
                    </div>
                    {filteredItems.map(function (item, i) {
                      return (
                        <ItemRow key={item.id} label={item.label} icon={PAGE_ICONS[tab]} active={itemCursor === i}
                          onClick={function () { setItemCursor(i); if (page === "modify") submitModify(); else submitDuplicate(); }}
                          onHover={function () { setItemCursor(i); }}
                        />
                      );
                    })}
                  </>
                ) : (
                  <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
                    {(allTabItems ? (allTabItems[itemPageTarget] || []) : (currentTabItems || [])).length === 0
                      ? (lang === "fr" ? "Aucun \u00e9l\u00e9ment sur cette page" : "No items on this page")
                      : (s.no_results || "Aucun r\u00e9sultat")}
                  </div>
                )}
              </div>
            </div>
            {renderFooter([
              { kbd: "\u21b5", label: page === "modify" ? (lang === "fr" ? "ouvrir" : "open") : (lang === "fr" ? "dupliquer" : "duplicate") },
              { kbd: "\u232b", label: s.cmd_back || (lang === "fr" ? "retour" : "back") },
              { kbd: "\u2191\u2193", label: s.footer_navigate || "naviguer", split: true },
              { kbd: "Tab", label: lang === "fr" ? "changer page" : "switch page" },
            ])}
          </>

        ) : page === "goto" ? (
          /* ═══ GOTO MODE ═══ */
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0, flexWrap: "wrap",
            }}>
              <button type="button" onMouseDown={function (e) { e.preventDefault(); exitMode(); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: "var(--r-full)",
                  background: "var(--bg-accordion)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                }}
              >
                <Compass size={11} weight="bold" />
                {lang === "fr" ? "Aller \u00e0" : "Go to"}
                <X size={9} weight="bold" style={{ opacity: 0.6 }} />
              </button>
              <input ref={gotoInputRef} value={gotoSearch}
                onChange={function (e) { setGotoSearch(e.target.value); setGotoCursor(0); }}
                onKeyDown={handleGotoKeyDown}
                placeholder={lang === "fr" ? "Rechercher une section..." : "Search a section..."}
                style={{ flex: 1, minWidth: 120, border: "none", background: "transparent", fontSize: 14, color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
              {renderLeftColumn("goto")}
              <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)" }} className="custom-scroll">
                <div style={{ padding: "6px 10px 4px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-faint)" }}>
                  {s.goto_sections || "Sections"}
                </div>
                {filteredGoto.map(function (item, i) {
                  var Icon = item.icon;
                  return (
                    <ItemRow key={item.id} label={item.label} icon={Icon} active={gotoCursor === i}
                      onClick={function () { setGotoCursor(i); submitGoto(); }}
                      onHover={function () { setGotoCursor(i); }}
                    />
                  );
                })}
                {filteredGoto.length === 0 ? (
                  <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
                    {s.no_results || "Aucun r\u00e9sultat"}
                  </div>
                ) : null}
              </div>
            </div>
            {renderFooter([
              { kbd: "\u21b5", label: lang === "fr" ? "aller" : "go" },
              { kbd: "\u232b", label: s.cmd_back || (lang === "fr" ? "retour" : "back") },
              { kbd: "\u2191\u2193", label: s.footer_navigate || "naviguer", split: true },
            ])}
          </>

        ) : (
          /* ═══ ROOT MODE (cmdk) ═══ */
          <Command value={cmdkValue} onValueChange={setCmdkValue} label={s.title || "Palette de commandes"} loop>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <MagnifyingGlass size={16} color="var(--text-faint)" weight="bold" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", minWidth: 0 }}>
                <Command.Input ref={cmdkInputRef} value={search} onValueChange={setSearch}
                  placeholder={s.search_placeholder || "Rechercher une page ou une action..."}
                />
                {search && cmdkValue && ACTION_HINT_MAP[cmdkValue] ? (
                  <span style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    display: "flex", alignItems: "center",
                    pointerEvents: "none",
                    fontSize: 14, color: "var(--text-ghost)", fontFamily: "inherit",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    <span style={{ visibility: "hidden" }}>{search}</span>
                    <span style={{ marginLeft: 2 }}> — {ACTION_HINT_MAP[cmdkValue][lk]}</span>
                  </span>
                ) : null}
              </div>
              <button onMouseDown={onClose} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
                background: "transparent", cursor: "pointer", flexShrink: 0,
              }}>
                <X size={12} color="var(--text-faint)" weight="bold" />
              </button>
            </div>

            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
              {renderLeftColumn(null)}

              <Command.List style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", maxHeight: "calc(72vh - 120px)" }} className="custom-scroll">
                <Command.Empty>
                  <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
                    {s.no_results || "Aucun r\u00e9sultat"}
                  </div>
                </Command.Empty>

                {NAV_GROUPS.map(function (group) {
                  return (
                    <Command.Group key={group.label} heading={group.label}>
                      {group.items.map(function (item) {
                        var Icon = item.icon;
                        return (
                          <Command.Item key={item.id} value={item.id} keywords={[item.label || ""]}
                            onSelect={function () { setTab(item.id); onClose(); }}
                          >
                            <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
                              <Icon size={15} />
                            </span>
                            <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>{item.label}</span>
                            <KbdCombo keys={item.keys} lang={lang} />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}

                <Command.Separator />

                {/* Tab-completable structured commands */}
                <Command.Group heading={s.quick_add || (lang === "fr" ? "Cr\u00e9er & \u00c9diter" : "Create & Edit")}>
                  <Command.Item value="add" keywords={ADD_KW} onSelect={function () { enterAddMode("opex"); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><Plus size={15} /></span>
                    <span style={{ flex: 1 }}>{lang === "fr" ? "Ajouter un \u00e9l\u00e9ment..." : "Add an item..."}</span>
                    <Kbd>Tab</Kbd>
                  </Command.Item>
                  <Command.Item value="modify" keywords={MODIFY_KW} onSelect={function () { enterItemMode("modify"); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><PencilSimple size={15} /></span>
                    <span style={{ flex: 1 }}>{lang === "fr" ? "Modifier un \u00e9l\u00e9ment..." : "Edit an item..."}</span>
                    <Kbd>Tab</Kbd>
                  </Command.Item>
                  <Command.Item value="duplicate" keywords={DUPLICATE_KW} onSelect={function () { enterItemMode("duplicate"); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><CopySimple size={15} /></span>
                    <span style={{ flex: 1 }}>{lang === "fr" ? "Dupliquer un \u00e9l\u00e9ment..." : "Duplicate an item..."}</span>
                    <Kbd>Tab</Kbd>
                  </Command.Item>
                  <Command.Item value="goto" keywords={GOTO_KW} onSelect={function () { enterGotoMode(); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><Compass size={15} /></span>
                    <span style={{ flex: 1 }}>{lang === "fr" ? "Aller \u00e0 une section..." : "Go to a section..."}</span>
                    <Kbd>Tab</Kbd>
                  </Command.Item>
                  <Command.Item value="share partager inviter team" keywords={["share", "partager", "inviter", "équipe", "team", "invite"]} onSelect={function () { if (onShare) onShare(); onClose(); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><ShareNetwork size={15} /></span>
                    <span style={{ flex: 1 }}>{lang === "fr" ? "Partager" : "Share"}</span>
                    <Kbd>Ctrl+S</Kbd>
                  </Command.Item>
                  <Command.Item value="exportimport" keywords={EXPORT_KW} onSelect={function () { if (onExport) onExport(); onClose(); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><UploadSimple size={15} /></span>
                    <span style={{ flex: 1 }}>Export / Import</span>
                  </Command.Item>
                  <Command.Item value="present" keywords={PRESENT_KW} onSelect={function () { if (onPresentation) onPresentation(); onClose(); }}>
                    <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}><MonitorPlay size={15} /></span>
                    <span style={{ flex: 1 }}>{s.presentation || "Pr\u00e9sentation"}</span>
                    <Kbd>Tab</Kbd>
                  </Command.Item>
                </Command.Group>

                <Command.Separator />

                <Command.Group heading={s.commands || "Commandes"}>
                  {ACTION_COMMANDS.map(function (cmd) {
                    var Icon = cmd.icon;
                    return (
                      <Command.Item key={cmd.id} value={cmd.id} keywords={cmd.kw} onSelect={function () { executeAction(cmd); }}>
                        <span data-cmd-icon style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 20, justifyContent: "center" }}>
                          <Icon size={15} />
                        </span>
                        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                          {cmd.label}
                          {cmd.active ? <span style={{ fontSize: 10, color: "var(--color-success)" }}>{"\u2713"}</span> : null}
                          {cmd.dot ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)", flexShrink: 0 }} /> : null}
                        </span>
                        <KbdCombo keys={cmd.keys} lang={lang} />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>
            </div>

            {renderFooter([
              { kbd: "\u2191\u2193", label: s.footer_navigate || "naviguer", split: true },
              { kbd: "\u21b5", label: s.footer_select || "s\u00e9lectionner" },
              { kbd: "esc", label: s.footer_close || "fermer" },
              { kbd: MOD + " K", label: null, right: true },
            ])}
          </Command>
        )}
      </div>
    </div>,
    document.body
  );

  /* ── Shared footer renderer ── */
  function renderFooter(items) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 14px",
        borderTop: "1px solid var(--border)",
        fontSize: 11, color: "var(--text-faint)",
        flexShrink: 0,
      }}>
        {items.map(function (item, i) {
          if (item.right) {
            return (
              <span key={i} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
                {item.kbd.split(" ").map(function (k, j) { return <Kbd key={j}>{k}</Kbd>; })}
              </span>
            );
          }
          return (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {item.split
                ? item.kbd.split("").map(function (k, j) { return <Kbd key={j}>{k}</Kbd>; })
                : <Kbd>{item.kbd}</Kbd>
              }
              {item.label ? <span style={{ marginLeft: 2 }}>{item.label}</span> : null}
            </span>
          );
        })}
      </div>
    );
  }

  /* ── Left column renderer ── */
  function renderLeftColumn(activeMode) {
    return (
      <div style={{
        width: 200, flexShrink: 0,
        padding: "var(--sp-2)",
        borderRight: "1px solid var(--border-light)",
        display: "flex", flexDirection: "column", gap: 1,
      }}>
        <div style={{
          padding: "4px 10px 6px",
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: 0.6, color: "var(--text-faint)",
        }}>
          {s.actions || "Actions"}
        </div>
        {LEFT_COMMANDS.map(function (cmd) {
          return (
            <LeftColumnItem
              key={cmd.id}
              icon={cmd.icon}
              label={cmd.label}
              desc={cmd.desc}
              active={cmd.mode === activeMode}
              onClick={function () { executeLeftCommand(cmd); }}
            />
          );
        })}
      </div>
    );
  }
}
