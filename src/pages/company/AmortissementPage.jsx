import { useState, useMemo, useEffect } from "react";
import {
  Plus, Trash, ArrowRight, CaretDown, GearSix,
  Desktop, Car, Buildings, ShieldCheck, Wrench, Briefcase,
  PencilSimple, Copy, HourglassSimple,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, SearchInput, FilterDropdown, SelectDropdown, ActionBtn, FinanceLink, PaletteToggle, ExportButtons, DevOptionsButton, DonutChart, ModalSideNav, Modal, ModalFooter, CurrencyInput } from "../../components";
import { eur, eurShort, makeId } from "../../utils";
import { useT, useLang, useDevMode, useTheme } from "../../context";

/* ── Asset categories (user-facing) ── */
var ASSET_CATEGORY_META = {
  it: {
    icon: Desktop, badge: "info",
    label: { fr: "Matériel informatique", en: "IT equipment" },
    desc: { fr: "Ordinateurs, écrans, serveurs, périphériques.", en: "Computers, monitors, servers, peripherals." },
    pcmn: "2410", years: 3,
    suggestions: [
      { l: "Ordinateur portable", amount: 1200 },
      { l: "Écran", amount: 400 },
      { l: "Serveur", amount: 2500 },
      { l: "Imprimante", amount: 300 },
      { l: "Téléphone professionnel", amount: 600 },
    ],
  },
  furniture: {
    icon: Briefcase, badge: "warning",
    label: { fr: "Mobilier", en: "Furniture" },
    desc: { fr: "Bureau, chaise, rangement, équipement de salle.", en: "Desk, chair, storage, meeting room equipment." },
    pcmn: "2400", years: 5,
    suggestions: [
      { l: "Bureau", amount: 500 },
      { l: "Chaise ergonomique", amount: 400 },
      { l: "Rangement", amount: 300 },
      { l: "Table de réunion", amount: 800 },
    ],
  },
  vehicle: {
    icon: Car, badge: "gray",
    label: { fr: "Véhicule", en: "Vehicle" },
    desc: { fr: "Voiture, utilitaire, vélo cargo, scooter.", en: "Car, van, cargo bike, scooter." },
    pcmn: "2400", years: 5,
    suggestions: [
      { l: "Voiture", amount: 25000 },
      { l: "Utilitaire", amount: 20000 },
      { l: "Vélo cargo", amount: 3000 },
      { l: "Scooter électrique", amount: 4000 },
    ],
  },
  building: {
    icon: Buildings, badge: "brand",
    label: { fr: "Aménagements", en: "Fit-out" },
    desc: { fr: "Travaux d'aménagement, rénovation, installations.", en: "Fit-out works, renovation, installations." },
    pcmn: "2210", years: 33,
    suggestions: [
      { l: "Aménagement bureau", amount: 10000 },
      { l: "Rénovation locale", amount: 15000 },
      { l: "Installation électrique", amount: 5000 },
    ],
  },
  ip: {
    icon: ShieldCheck, badge: "info",
    label: { fr: "Brevets & marques", en: "Patents & trademarks" },
    desc: { fr: "Dépôt de marque, brevet, licence, goodwill.", en: "Trademark filing, patent, licence, goodwill." },
    pcmn: "2110", years: 5,
    suggestions: [
      { l: "Dépôt de marque", amount: 300 },
      { l: "Brevet", amount: 5000 },
      { l: "Licence logicielle", amount: 2000 },
      { l: "Fonds de commerce", amount: 10000, pcmn: "2120" },
    ],
  },
  other: {
    icon: Wrench, badge: "gray",
    label: { fr: "Autre", en: "Other" },
    desc: { fr: "Outillage, machines, autres immobilisations.", en: "Tools, machinery, other fixed assets." },
    pcmn: "2700", years: 5,
    suggestions: [
      { l: "Outillage", amount: 1000 },
      { l: "Machine", amount: 5000 },
      { l: "Frais d'établissement", amount: 2000, pcmn: "2010" },
    ],
  },
};

var ASSET_CATEGORIES = Object.keys(ASSET_CATEGORY_META);


/* ── Stacked depreciation bar with tooltip ── */
function DepreciationBar({ assets, totals, lk, t, palette }) {
  var [hov, setHov] = useState(null);
  var segments = assets.filter(function (a) { return a.amount > 0 && a.years > 0; }).map(function (a, ai) {
    var dep = computeAnnualDep(a);
    var pct = totals.annualDep > 0 ? dep / totals.annualDep * 100 : 0;
    var catKey = a.category || "other";
    var catMeta = ASSET_CATEGORY_META[catKey];
    var catIdx = ASSET_CATEGORIES.indexOf(catKey);
    return { id: a.id, label: a.label, dep: dep, pct: pct, catKey: catKey, catLabel: catMeta ? catMeta.label[lk] : catKey, color: (palette || [])[catIdx >= 0 ? catIdx % (palette || []).length : ai % (palette || []).length] || "var(--text-muted)" };
  });

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: "0 0 auto" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {t.timeline_title || "Répartition des amortissements"}
      </div>
      {segments.length > 0 ? (
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", height: 24, borderRadius: 6, overflow: "hidden" }}>
            {segments.map(function (seg) {
              var isHov = hov === seg.id;
              var roundPct = Math.round(seg.pct);
              return (
                <div key={seg.id}
                  onMouseEnter={function () { setHov(seg.id); }}
                  onMouseLeave={function () { setHov(null); }}
                  style={{
                    width: seg.pct + "%", height: "100%",
                    background: seg.color,
                    opacity: hov === null || isHov ? 1 : 0.4,
                    transition: "width 0.3s, opacity 0.15s",
                    minWidth: seg.pct > 0 ? 2 : 0,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {roundPct >= 10 ? (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--color-on-brand)", textShadow: "0 0 3px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{roundPct}%</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          {hov ? (function () {
            var seg = null;
            var leftPct = 0;
            for (var si = 0; si < segments.length; si++) {
              if (segments[si].id === hov) { seg = segments[si]; break; }
              leftPct += segments[si].pct;
            }
            if (!seg) return null;
            var centerPct = leftPct + seg.pct / 2;
            return (
              <div style={{
                position: "absolute", bottom: 32, left: centerPct + "%", transform: "translateX(-50%)",
                padding: "6px 12px", borderRadius: "var(--r-md)",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-dropdown)",
                fontSize: 12, whiteSpace: "nowrap", zIndex: 2,
                display: "flex", alignItems: "center", gap: 8,
                pointerEvents: "none",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{seg.label}</span>
                <span style={{ color: "var(--text-muted)" }}>{seg.catLabel}</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{Math.round(seg.pct)}%</span>
              </div>
            );
          })() : null}
        </div>
      ) : (
        <div style={{ height: 12, borderRadius: 6, background: "var(--bg-hover)" }} />
      )}
    </div>
  );
}

/* ── Compute full depreciation schedule ── */
var PREVIEW_ROWS = 3;

/* ── Schedule card with collapse/blur/expand ── */
function ScheduleCard({ asset, t, lk }) {
  var [expanded, setExpanded] = useState(false);
  var schedule = useMemo(function () { return computeSchedule(asset); }, [asset]);
  var catKey = asset.category || "other";
  var catMeta = ASSET_CATEGORY_META[catKey];
  if (schedule.length === 0) return null;

  var needsCollapse = schedule.length > PREVIEW_ROWS;
  var visibleRows = expanded || !needsCollapse ? schedule : schedule.slice(0, PREVIEW_ROWS);

  var thStyle = { textAlign: "right", padding: "var(--sp-1) var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 };
  var tdStyle = { padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{asset.label}</span>
        {catMeta ? <Badge color={catMeta.badge} size="sm" dot>{catMeta.label[lk]}</Badge> : null}
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {eur(asset.amount)} · {asset.years} {t.years_unit || "ans"} · {asset.method === "declining" ? (t.method_declining || "Dégressif") : (t.method_linear || "Linéaire")}
        </span>
      </div>

      <div style={{ position: "relative", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={Object.assign({}, thStyle, { textAlign: "left" })}>{t.sch_year || "Année"}</th>
              <th style={thStyle}>{t.sch_start || "Valeur début"}</th>
              <th style={thStyle}>{t.sch_dep || "Dotation"}</th>
              <th style={thStyle}>{t.sch_end || "Valeur fin"}</th>
              <th style={thStyle}>{t.sch_cumul || "Cumulé"}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(function (row, rowIdx) {
              var isLast = rowIdx === visibleRows.length - 1;
              return (
                <tr key={row.year} style={{ borderBottom: isLast ? "none" : "1px solid var(--border-light)" }}>
                  <td style={{ padding: "var(--sp-1) var(--sp-2)", color: "var(--text-secondary)" }}>{row.year}</td>
                  <td style={tdStyle}>{eur(row.start)}</td>
                  <td style={Object.assign({}, tdStyle, { fontWeight: 600, color: "var(--brand)" })}>{eur(row.dep)}</td>
                  <td style={tdStyle}>{eur(row.end)}</td>
                  <td style={Object.assign({}, tdStyle, { color: "var(--text-muted)" })}>{eur(row.cumul)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Blur overlay when collapsed */}
        {needsCollapse && !expanded ? (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
            background: "linear-gradient(transparent, var(--bg-card))",
            pointerEvents: "none",
          }} />
        ) : null}
      </div>

      {/* Expand/collapse button */}
      {needsCollapse ? (
        <div style={{ marginTop: "var(--sp-2)" }}>
          <Button color="tertiary" size="sm" onClick={function () { setExpanded(function (v) { return !v; }); }} sx={{ width: "100%" }}>
            {expanded
              ? (t.show_less || "Réduire")
              : (t.show_more || "Voir les " + schedule.length + " années")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ── Legal durations — collapsible with config button ── */
function LegalDurationsSection({ t, lk, setTab, cfg }) {
  var [open, setOpen] = useState(false);
  var { dark: isDark } = useTheme();
  var acctBadgeStyle = {
    display: "inline-flex", alignItems: "center",
    padding: "2px 6px", borderRadius: "var(--r-sm)",
    background: isDark ? "#fdf6e3" : "#2d2518",
    color: isDark ? "#2d2518" : "#f5d78e",
    fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
    lineHeight: 1, verticalAlign: "middle", marginLeft: 6,
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "var(--sp-3) var(--sp-4)" }}>
        <button type="button" onClick={function () { setOpen(function (v) { return !v; }); }}
          aria-expanded={open} aria-label={t.legal_title || "Legal durations"}
          style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flex: 1, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", padding: 0 }}>
          <CaretDown size={14} weight="bold" color="var(--text-muted)" style={{ transition: "transform 0.15s", transform: open ? "rotate(0)" : "rotate(-90deg)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {t.legal_title || "Durées légales belges"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
              {t.legal_sub || "Durées minimales d'amortissement (AR/CB)."}
            </div>
          </div>
        </button>
        {cfg.showPcmn ? (
          <Button color="tertiary" size="lg" onClick={function () { setTab("set", { section: "accounting" }); }} iconLeading={<GearSix size={14} weight="bold" />}>
            {t.legal_config || "Configurer"}
            <span style={acctBadgeStyle}>{t.acct_tag || "Comptable"}</span>
          </Button>
        ) : null}
      </div>

      {/* Collapsible table */}
      {open ? (
        <div style={{ padding: "0 var(--sp-4) var(--sp-4)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>PCMN</th>
                  <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>{t.col_category || "Catégorie"}</th>
                  <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>{t.col_duration || "Durée"}</th>
                  <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>{t.col_rate || "Taux"}</th>
                </tr>
              </thead>
              <tbody>
                {LEGAL_TABLE.map(function (row, rowIdx) {
                  var isLast = rowIdx === LEGAL_TABLE.length - 1;
                  return (
                    <tr key={row.pcmn} style={{ borderBottom: isLast ? "none" : "1px solid var(--border-light)" }}>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <span style={{ fontSize: 11, fontFamily: "ui-monospace,monospace", background: "var(--bg-accordion)", padding: "2px 6px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>{row.pcmn}</span>
                      </td>
                      <td style={{ padding: "var(--sp-2)", color: "var(--text-primary)" }}>{row.label[lk]}</td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", fontWeight: 600 }}>{row.years} {t.years_unit || "ans"}</td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", color: "var(--text-muted)" }}>{row.years > 0 ? (100 / row.years).toFixed(1) + "%" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Depreciation tab with sub-sidebar ── */
function DepreciationTab({ assets, t, lk, setTab, cfg }) {
  var [selectedAssetId, setSelectedAssetId] = useState(null);
  var validAssets = assets.filter(function (a) { return a.amount > 0 && a.years > 0; });

  function scrollTo(id) {
    setSelectedAssetId(id);
    setTimeout(function () {
      var el = document.getElementById(id);
      if (el) {
        var top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    }, 50);
  }

  return (
    <div style={{ display: "flex", gap: "var(--gap-md)", minHeight: 400 }}>
      {/* Sub-sidebar */}
      <div style={{
        width: 220, flexShrink: 0,
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
        background: "var(--bg-card)", padding: "var(--sp-3)",
        display: "flex", flexDirection: "column", gap: 2,
        alignSelf: "flex-start", position: "sticky", top: 48,
      }}>
        <SubNavItem label={t.nav_methods || "Méthodes"} active={selectedAssetId === "methods"} onClick={function () { scrollTo("section-methods"); setSelectedAssetId("methods"); }} />
        <SubNavItem label={t.nav_legal || "Durées légales"} active={selectedAssetId === "legal"} onClick={function () { scrollTo("section-legal"); setSelectedAssetId("legal"); }} />

        {validAssets.length > 0 ? (
          <>
            <div style={{ height: 1, background: "var(--border-light)", margin: "var(--sp-2) 0" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px var(--sp-2)" }}>
              {t.nav_assets || "Actifs"}
            </div>
            {validAssets.map(function (a) {
              return (
                <SubNavItem key={a.id} label={a.label} active={selectedAssetId === a.id} onClick={function () { scrollTo("schedule-" + a.id); setSelectedAssetId(a.id); }} small />
              );
            })}
          </>
        ) : null}
      </div>

      {/* Content — continuous scroll */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>
        {/* Methods */}
        <div id="section-methods" className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)" }}>
              {t.method_linear_title || "Méthode linéaire"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t.method_linear_desc || "Même montant chaque année."}{" "}
              <FinanceLink term="depreciation" />
            </div>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)" }}>
              {t.method_declining_title || "Méthode dégressive"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t.method_declining_desc || "Plus rapide au début, plus lent ensuite."}{" "}
              <FinanceLink term="depreciation" />
            </div>
          </div>
        </div>

        {/* Legal durations */}
        <div id="section-legal">
          <LegalDurationsSection t={t} lk={lk} setTab={setTab} cfg={cfg} />
        </div>

        {/* Per-asset schedules */}
        {validAssets.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {t.schedules_title || "Tableaux d'amortissement"}
            </div>
            {validAssets.map(function (a) {
              return <div key={a.id} id={"schedule-" + a.id}><ScheduleCard asset={a} t={t} lk={lk} /></div>;
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "var(--sp-8)", color: "var(--text-muted)" }}>
            <Desktop size={32} weight="duotone" style={{ marginBottom: "var(--sp-2)" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.no_schedules || "Aucun tableau"}</div>
            <div style={{ fontSize: 13, marginTop: "var(--sp-1)" }}>{t.no_schedules_hint || "Ajoutez des équipements."} <FinanceLink term="depreciation" /></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-sidebar nav item ── */
function SubNavItem({ label, active, onClick, small }) {
  var [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: small ? "5px var(--sp-2)" : "7px var(--sp-2)",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--brand-bg)" : hov ? "var(--bg-hover)" : "transparent",
        color: active ? "var(--brand)" : "var(--text-secondary)",
        fontSize: small ? 12 : 13, fontWeight: active ? 600 : 400,
        cursor: "pointer", fontFamily: "inherit",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        transition: "background 0.1s",
      }}
    >
      {label}
    </button>
  );
}

function computeSchedule(asset) {
  var rows = [];
  if (!asset.amount || asset.amount <= 0 || !asset.years || asset.years <= 0) return rows;
  var depreciable = asset.amount - (asset.residual || 0);
  if (depreciable <= 0) return rows;

  if (asset.method === "declining") {
    var rate = Math.min(2 / asset.years, 0.40);
    var book = asset.amount;
    var linearAnnual = depreciable / asset.years;
    for (var y = 1; y <= asset.years; y++) {
      var decl = book * rate;
      var annual = Math.max(decl, linearAnnual);
      if (annual > book - (asset.residual || 0)) annual = book - (asset.residual || 0);
      if (annual < 0) annual = 0;
      var endBook = book - annual;
      rows.push({ year: y, start: book, dep: annual, end: endBook, cumul: asset.amount - endBook });
      book = endBook;
      if (book <= (asset.residual || 0)) break;
    }
  } else {
    var annDep = depreciable / asset.years;
    var bookVal = asset.amount;
    for (var yr = 1; yr <= asset.years; yr++) {
      var d = Math.min(annDep, bookVal - (asset.residual || 0));
      if (d < 0) d = 0;
      var endVal = bookVal - d;
      rows.push({ year: yr, start: bookVal, dep: d, end: endVal, cumul: asset.amount - endVal });
      bookVal = endVal;
      if (bookVal <= (asset.residual || 0)) break;
    }
  }
  return rows;
}

/* ── Legal durations table data ── */
var LEGAL_TABLE = [
  { pcmn: "2010", label: { fr: "Frais d'établissement", en: "Setup costs" }, years: 5 },
  { pcmn: "2110", label: { fr: "Brevets et marques", en: "Patents & trademarks" }, years: 5 },
  { pcmn: "2120", label: { fr: "Fonds de commerce", en: "Goodwill" }, years: 5 },
  { pcmn: "2210", label: { fr: "Constructions", en: "Buildings" }, years: 33 },
  { pcmn: "2300", label: { fr: "Installations et machines", en: "Plant & machinery" }, years: 10 },
  { pcmn: "2400", label: { fr: "Mobilier et véhicules", en: "Furniture & vehicles" }, years: 5 },
  { pcmn: "2410", label: { fr: "Matériel informatique", en: "IT equipment" }, years: 3 },
  { pcmn: "2700", label: { fr: "Autres immobilisations", en: "Other tangible assets" }, years: 5 },
];

function computeAnnualDep(asset) {
  if (!asset.amount || asset.amount <= 0 || !asset.years || asset.years <= 0) return 0;
  var depreciable = asset.amount - (asset.residual || 0);
  if (depreciable <= 0) return 0;
  if (asset.method === "declining") {
    var rate = Math.min(2 / asset.years, 0.40);
    return asset.amount * rate;
  }
  return depreciable / asset.years;
}


/* ── Asset Modal ── */
function AssetModal({ onAdd, onSave, onClose, lang, initialData, cfg, defaultCategory, initialLabel }) {
  var t = useT().amortissement || {};
  var isEdit = !!initialData;

  function resolveCategory(item) {
    if (!item) return "it";
    if (item.category && ASSET_CATEGORY_META[item.category]) return item.category;
    return "other";
  }

  var [selected, setSelected] = useState(isEdit ? resolveCategory(initialData) : (defaultCategory || "it"));
  var [label, setLabel] = useState(isEdit ? (initialData.label || "") : (initialLabel || ""));
  var [amount, setAmount] = useState(isEdit ? (initialData.amount || 0) : 0);
  var [years, setYears] = useState(isEdit ? (initialData.years || 3) : ASSET_CATEGORY_META[selected || "it"].years);
  var [method, setMethod] = useState(isEdit ? (initialData.method || "linear") : (cfg && cfg.depreciationMethod) || "linear");
  var [residual, setResidual] = useState(isEdit ? (initialData.residual || 0) : 0);

  var lk = lang === "en" ? "en" : "fr";
  var meta = ASSET_CATEGORY_META[selected] || ASSET_CATEGORY_META.other;
  var Icon = meta.icon;

  function handleSelect(catKey) {
    setSelected(catKey);
    if (!isEdit) {
      var m = ASSET_CATEGORY_META[catKey];
      setLabel("");
      setAmount(0);
      setYears(m.years);
      setResidual(0);
    }
  }

  function handleSuggestion(sug) {
    setLabel(sug.l);
    if (sug.amount) setAmount(sug.amount);
  }

  function handleSubmit() {
    var data = {
      id: isEdit ? initialData.id : makeId("a"),
      label: label || meta.label[lk],
      category: selected,
      pcmn: meta.pcmn,
      amount: amount,
      years: years,
      method: method,
      residual: residual,
      elapsedYears: isEdit ? (initialData.elapsedYears || 0) : 0,
      startDate: isEdit ? initialData.startDate : new Date().toISOString().slice(0, 10),
    };
    if (isEdit && onSave) { onSave(data); } else if (onAdd) { onAdd(data); }
    onClose();
  }

  var canSubmit = label.trim().length > 0 && amount > 0;
  var annDep = computeAnnualDep({ amount: amount, years: years, method: method, residual: residual });

  return (
    <Modal open onClose={onClose} size="lg" height={540} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT — Category list */}
        <ModalSideNav
          title={t.modal_category || "Category"}
          items={ASSET_CATEGORIES.map(function (catKey) {
            var m = ASSET_CATEGORY_META[catKey];
            return { key: catKey, icon: m.icon, label: m.label[lk] };
          })}
          selected={selected}
          onSelect={handleSelect}
          width={220}
        />

        {/* RIGHT — Config panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{meta.label[lk]}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{meta.desc[lk]}</div>
            </div>
          </div>

          <div className="custom-scroll" style={{ flex: 1, paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            <div>
              <label htmlFor="asset-label" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {t.field_name || "Nom de l'actif"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input id="asset-label" value={label} onChange={function (e) { setLabel(e.target.value); }}
                autoFocus placeholder={meta.label[lk]}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            {meta.suggestions.length > 0 ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.modal_suggestions || "Suggestions"}
                </label>
                <SelectDropdown
                  value={label}
                  onChange={function (v) {
                    if (!v) { setLabel(""); setAmount(0); return; }
                    var found = null;
                    meta.suggestions.forEach(function (s) { if (s.l === v) found = s; });
                    if (found) handleSuggestion(found);
                  }}
                  options={meta.suggestions.map(function (s) { return { value: s.l, label: s.l }; })}
                  placeholder={t.modal_suggestions || "Suggestions..."}
                  clearable
                />
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_amount || "Valeur d'acquisition"} <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <CurrencyInput value={amount} onChange={function (v) { setAmount(v); }} suffix="€" width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_years || "Durée (années)"}
                </label>
                <input type="number" value={years} min={1} max={50}
                  onChange={function (e) { setYears(Math.max(1, Number(e.target.value) || 1)); }}
                  style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "right" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_method || "Méthode"}
                </label>
                <SelectDropdown
                  value={method}
                  onChange={setMethod}
                  options={[
                    { value: "linear", label: t.method_linear || "Linéaire" },
                    { value: "declining", label: t.method_declining || "Dégressif" },
                  ]}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_residual || "Valeur résiduelle"}
                </label>
                <CurrencyInput value={residual} onChange={function (v) { setResidual(v); }} suffix="€" width="100%" />
              </div>
            </div>

            {amount > 0 && years > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.annual_dep || "Dotation annuelle"}</span>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(annDep)}/an</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "var(--sp-2)" }}>{eur(annDep / 12)}/m</span>
                </div>
              </div>
            ) : null}
          </div>

          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>{t.modal_close || "Close"}</Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (t.modal_save || "Save") : (t.modal_add || "Add")}
            </Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Page ── */
export default function AmortissementPage({ assets, setAssets, cfg, setTab, onNavigate, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate }) {
  var { lang } = useLang();
  var t = useT().amortissement || {};
  var [activeTab, setActiveTab] = useState("assets");
  var [showCreate, setShowCreate] = useState(null);
  var [pendingLabel, setPendingLabel] = useState("");
  var [editingAsset, setEditingAsset] = useState(null);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var { devMode } = useDevMode();

  useEffect(function () {
    if (pendingAdd && pendingAdd.label) {
      setPendingLabel(pendingAdd.label);
      setShowCreate("it");
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAdd]);

  useEffect(function () {
    if (!pendingEdit) return;
    var idx = (assets || []).findIndex(function (a) { return String(a.id) === String(pendingEdit.itemId); });
    if (idx >= 0) {
      setEditingAsset({ idx: idx, item: assets[idx] });
      if (onClearPendingEdit) onClearPendingEdit();
    }
  }, [pendingEdit]);

  useEffect(function () {
    if (!pendingDuplicate) return;
    var idx = (assets || []).findIndex(function (a) { return String(a.id) === String(pendingDuplicate.itemId); });
    if (idx >= 0) {
      var clone = Object.assign({}, assets[idx], { id: makeId("a"), label: assets[idx].label + " (copie)" });
      setAssets(function (prev) { var nc = prev.slice(); nc.splice(idx + 1, 0, clone); return nc; });
      setEditingAsset({ idx: idx + 1, item: clone });
      if (onClearPendingDuplicate) onClearPendingDuplicate();
    }
  }, [pendingDuplicate]);

  var lk = lang === "en" ? "en" : "fr";

  /* totals */
  var totals = useMemo(function () {
    var acquisition = 0, annualDep = 0, count = 0;
    (assets || []).forEach(function (a) {
      if (a.amount > 0 && a.years > 0) {
        acquisition += a.amount;
        annualDep += computeAnnualDep(a);
        count++;
      }
    });
    return { acquisition: acquisition, annualDep: annualDep, monthlyDep: annualDep / 12, count: count };
  }, [assets]);

  /* category distribution for donut */
  var categoryDistribution = useMemo(function () {
    var dist = {};
    (assets || []).forEach(function (a) {
      if (a.amount > 0) {
        var catKey = a.category || "other";
        dist[catKey] = (dist[catKey] || 0) + a.amount;
      }
    });
    return dist;
  }, [assets]);

  /* top asset */
  var topAsset = useMemo(function () {
    var best = null;
    var bestVal = 0;
    (assets || []).forEach(function (a) {
      if (a.amount > bestVal) { best = a; bestVal = a.amount; }
    });
    if (!best || bestVal <= 0) return null;
    var annDep = computeAnnualDep(best);
    return { name: best.label, amount: best.amount, pct: totals.acquisition > 0 ? Math.round(bestVal / totals.acquisition * 100) : 0, annualDep: annDep, years: best.years };
  }, [assets, totals.acquisition]);

  /* filtered data */
  var filteredAssets = useMemo(function () {
    var items = assets || [];
    if (filter !== "all") {
      items = items.filter(function (a) { return (a.category || "other") === filter; });
    }
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      items = items.filter(function (a) { return (a.label || "").toLowerCase().indexOf(q) !== -1; });
    }
    return items;
  }, [assets, filter, search]);

  /* filter options */
  var filterOptions = useMemo(function () {
    var cats = {};
    (assets || []).forEach(function (a) {
      var ck = a.category || "other";
      if (ASSET_CATEGORY_META[ck]) cats[ck] = ASSET_CATEGORY_META[ck];
    });
    var opts = [{ value: "all", label: t.filter_all || "Toutes les catégories" }];
    Object.keys(cats).forEach(function (catKey) {
      opts.push({ value: catKey, label: cats[catKey].label[lk] });
    });
    return opts;
  }, [assets, lk, t]);

  function addAsset(data) { setAssets(function (prev) { return (prev || []).concat([data]); }); }
  function removeAsset(idx) { setAssets(function (prev) { var nc = prev.slice(); nc.splice(idx, 1); return nc; }); }
  function requestDelete(idx) { if (skipDeleteConfirm) { removeAsset(idx); } else { setPendingDelete(idx); } }
  function bulkDeleteAssets(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setAssets(function (prev) { return prev.filter(function (a) { return !idSet[String(a.id)]; }); });
  }
  function cloneAsset(idx) {
    setAssets(function (prev) {
      var nc = prev.slice();
      var clone = Object.assign({}, nc[idx], { id: makeId("a"), label: nc[idx].label + (t.copy_suffix || " (copy)") });
      nc.splice(idx + 1, 0, clone);
      return nc;
    });
  }
  function saveAsset(idx, data) {
    setAssets(function (prev) { var nc = prev.slice(); nc[idx] = Object.assign({}, nc[idx], data); return nc; });
  }

  function randomizeAssets() {
    var items = [];
    ASSET_CATEGORIES.forEach(function (catKey) {
      var m = ASSET_CATEGORY_META[catKey];
      var pick = m.suggestions[Math.floor(Math.random() * m.suggestions.length)];
      if (pick) {
        items.push({
          id: makeId("a"), label: pick.l, category: catKey, pcmn: pick.pcmn || m.pcmn,
          amount: Math.round(pick.amount * (0.5 + Math.random())),
          years: m.years, method: "linear", residual: 0, elapsedYears: 0,
          startDate: new Date().toISOString().slice(0, 10),
        });
      }
    });
    setAssets(items);
  }

  /* columns */
  var columns = useMemo(function () {
    return [
      {
        id: "label", accessorKey: "label",
        header: t.col_asset || "Actif",
        enableSorting: true,
        meta: { align: "left", minWidth: 200, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{(assets || []).length} {t.footer_items || "actifs"}</span>
            </>
          );
        },
      },
      {
        id: "category",
        header: t.col_category || "Catégorie",
        enableSorting: true,
        meta: { align: "left" },
        cell: function (info) {
          var catKey = info.row.original.category || "other";
          var found = ASSET_CATEGORY_META[catKey];
          if (!found) return catKey;
          return <Badge color={found.badge} size="sm" dot>{found.label[lk]}</Badge>;
        },
      },
      {
        id: "amount", accessorKey: "amount",
        header: t.col_value || "Valeur",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totals.acquisition)}</span>; },
      },
      {
        id: "years", accessorKey: "years",
        header: t.col_duration || "Durée",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return info.getValue() + " " + (t.years_unit || "ans"); },
      },
      {
        id: "annualDep",
        accessorFn: function (row) { return computeAnnualDep(row); },
        header: t.col_annual_dep || "Annuité",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totals.annualDep)}/an</span>; },
      },
      {
        id: "rate",
        accessorFn: function (row) { return row.years > 0 ? 100 / row.years : 0; },
        header: t.col_rate || "Taux",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return info.getValue() > 0 ? info.getValue().toFixed(1) + "%" : "—"; },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = info.row.index;
          var asset = (assets || [])[idx];
          var isSalaryLinked = asset && typeof asset.id === "string" && asset.id.indexOf("_sal_") === 0;
          if (isSalaryLinked) {
            return (
              <button type="button" onClick={function () { if (onNavigate) onNavigate("salaries"); else setTab("salaries"); }}
                title={t.linked_salary_tip || "Lié aux rémunérations. Modifiez depuis la page Rémunérations."}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--brand)", fontStyle: "italic", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                <ArrowRight size={12} weight="bold" /> {t.salaries_link || "Rémunérations"}
              </button>
            );
          }
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Edit"} onClick={function () { setEditingAsset({ idx: idx, item: (assets || [])[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Clone"} onClick={function () { cloneAsset(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Delete"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [lang, lk, assets, totals, t]);

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomizeAssets} onClear={function () { setAssets([]); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredAssets} columns={columns} filename="equipements" title={t.page_title || (lang === "fr" ? "Immobilisations" : "Assets")} subtitle={t.page_sub || (lang === "fr" ? "Gérez vos actifs et tableaux d'amortissement." : "Manage your assets and depreciation schedules.")} getPcmn={function (row) { return row.pcmn || "2400"; }} />
        <Button color="secondary" size="lg" onClick={function () { if (onNavigate) onNavigate("opex"); else setTab("opex"); }} iconLeading={<ArrowRight size={14} weight="bold" />}>
          {t.charges_btn || "Charges"}
        </Button>
        <Button color="primary" size="lg" onClick={function () { setShowCreate("it"); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add_label || "Ajouter"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Desktop size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.no_assets || "Aucune immobilisation"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {t.no_assets_hint || "Ajoutez vos actifs pour générer automatiquement les tableaux d'amortissement et les charges associées."}{" "}
        <FinanceLink term="fixed_assets" />
      </div>
      <Button color="primary" size="md" onClick={function () { setShowCreate("it"); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {t.add_source || "Ajouter un actif"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.page_title || "Immobilisations"}
      subtitle={t.page_sub || "Gérez vos actifs et tableaux d'amortissement."}
      icon={HourglassSimple} iconColor="#F59E0B"
    >
      {showCreate ? <AssetModal onAdd={addAsset} onClose={function () { setShowCreate(null); setPendingLabel(""); }} lang={lang} cfg={cfg} defaultCategory={typeof showCreate === "string" ? showCreate : undefined} initialLabel={pendingLabel} /> : null}

      {editingAsset ? <AssetModal
        initialData={editingAsset.item}
        onSave={function (data) { saveAsset(editingAsset.idx, data); }}
        onClose={function () { setEditingAsset(null); }}
        lang={lang} cfg={cfg}
      /> : null}

      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeAsset(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm}
        setSkipNext={setSkipDeleteConfirm}
        t={{
          confirm_title: t.confirm_delete_title || "Supprimer cet actif ?",
          confirm_body: t.confirm_delete_body || "Cet actif et son plan d'amortissement seront supprimés.",
          confirm_skip: t.confirm_delete_skip || "Ne plus demander",
          cancel: t.cancel || "Annuler",
          delete: t.delete || "Supprimer",
        }}
      /> : null}

      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_acquisition || "Valeur d'acquisition"} value={eurShort(totals.acquisition)} fullValue={eur(totals.acquisition)} glossaryKey="fixed_assets" />
        <KpiCard label={t.kpi_annual || "Dotation annuelle"} value={eurShort(totals.annualDep)} fullValue={eur(totals.annualDep)} glossaryKey="depreciation" />
        <KpiCard label={t.kpi_monthly || "Dotation mensuelle"} value={eurShort(totals.monthlyDep)} fullValue={eur(totals.monthlyDep)} glossaryKey="depreciation" />
        <KpiCard label={t.kpi_active || "En cours"} value={String(totals.count)} />
      </div>

      {/* ── Insights (always visible) ── */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Donut: répartition par catégorie */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Distribution by category"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <DonutChart data={categoryDistribution} palette={chartPalette} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.keys(categoryDistribution).length > 0 ? Object.keys(categoryDistribution).map(function (catKey, ci) {
                var m = ASSET_CATEGORY_META[catKey];
                if (!m) return null;
                var assetPct = totals.acquisition > 0 ? Math.round(categoryDistribution[catKey] / totals.acquisition * 100) : 0;
                return (
                  <div key={catKey} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: chartPalette[ci % chartPalette.length] || "var(--text-muted)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{m.label[lk]}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{assetPct}%</span>
                  </div>
                );
              }) : [0, 1, 2].map(function (i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-hover)", flexShrink: 0 }} />
                    <span style={{ height: 10, borderRadius: 4, background: "var(--bg-hover)", flex: 1 }} />
                    <span style={{ width: 24, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          {/* Top asset */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: "0 0 auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.top_asset || "Top asset"}
            </div>
            {topAsset ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {topAsset.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {eur(topAsset.amount)} <span style={{ margin: "0 6px", color: "var(--text-muted)" }} aria-hidden="true">•</span> <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{topAsset.pct}%</span> {t.of_total || "du total"}
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 120, height: 14, borderRadius: 4, background: "var(--bg-hover)" }} />
                <div style={{ width: 180, height: 10, borderRadius: 4, background: "var(--bg-hover)", marginTop: 8 }} />
              </>
            )}
          </div>

          {/* Stacked depreciation bar */}
          <DepreciationBar assets={assets || []} totals={totals} lk={lk} t={t} palette={chartPalette} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {["assets", "depreciation"].map(function (tabKey) {
          var isActive = activeTab === tabKey;
          var tabLabels = { assets: t.tab_assets || "Équipements", depreciation: t.tab_depreciation || "Amortissements" };
          return (
            <button key={tabKey} type="button" onClick={function () { setActiveTab(tabKey); }}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "var(--sp-2) var(--sp-4)",
                border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2,
                background: "transparent",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.12s, border-color 0.12s",
              }}>
              {tabLabels[tabKey]}
            </button>
          );
        })}
      </div>

      {activeTab === "assets" ? (
      <DataTable
        data={filteredAssets}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={200}
        pageSize={10}
        getRowId={function (row) { return row.id; }}
        selectable
        onDeleteSelected={bulkDeleteAssets}
        isRowSelectable={function (row) { return !row._readOnly; }}

      />
      ) : null}

      {activeTab === "depreciation" ? (
      <DepreciationTab assets={assets || []} t={t} lk={lk} setTab={setTab} cfg={cfg} />
      ) : null}

    </PageLayout>
  );
}
