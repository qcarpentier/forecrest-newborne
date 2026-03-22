import { useMemo, useState } from "react";
import {
  Plus, Trash, Shuffle, Eraser, ArrowRight,
  Buildings, Receipt, Desktop, Scales,
  Megaphone, ShieldCheck, Wrench, Briefcase, Car,
  PencilSimple, Copy, ShoppingCart, Bank,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, SearchInput, FilterDropdown, SelectDropdown, ActionBtn, FinanceLink, PaletteToggle, ChartLegend } from "../components";
import Modal, { ModalFooter } from "../components/Modal";
import CurrencyInput from "../components/CurrencyInput";
import { eur, eurShort, makeId } from "../utils";
import { useT, useLang, useDevMode, useTheme } from "../context";
import { PCMN_OPTS, COST_FREQUENCIES } from "../constants/defaults";


/* ── Simple cost categories (user-facing) with auto PCMN mapping ── */
var COST_CATEGORY_META = {
  premises: {
    icon: Buildings, badge: "warning",
    label: { fr: "Locaux", en: "Premises" },
    desc: { fr: "Loyer, coworking, charges locatives et entretien des espaces de travail.", en: "Rent, coworking, facility charges and workspace maintenance." },
    pcmn: "6100", type: "exploitation", defaultFreq: "monthly", tvaRate: 0,
    suggestions: [
      { l: "Loyer", a: 800 },
      { l: "Coworking", a: 250 },
      { l: "Domiciliation", a: 50 },
      { l: "Charges locatives", a: 150 },
      { l: "Entretien", a: 100 },
      { l: "Électricité", a: 80, tva: 0.21 },
    ],
  },
  software: {
    icon: Desktop, badge: "info",
    label: { fr: "Logiciels & outils", en: "Software & tools" },
    desc: { fr: "Abonnements SaaS, outils de productivité et infrastructure digitale.", en: "SaaS subscriptions, productivity tools and digital infrastructure." },
    pcmn: "6125", type: "exploitation", defaultFreq: "monthly", perUserDefault: true, tvaRate: 0.21,
    suggestions: [
      { l: "Design", a: 12 },
      { l: "Gestion de projet", a: 8 },
      { l: "Outils IA", a: 20 },
      { l: "CRM", a: 30 },
      { l: "Hébergement cloud", a: 25, pcmn: "6120" },
      { l: "Suite bureautique", a: 10 },
      { l: "Communication", a: 5 },
      { l: "Monitoring", a: 15, pcmn: "6120" },
    ],
  },
  marketing: {
    icon: Megaphone, badge: "brand",
    label: { fr: "Marketing", en: "Marketing" },
    desc: { fr: "Acquisition, visibilité et communication pour développer votre activité.", en: "Acquisition, visibility and communication to grow your business." },
    pcmn: "6140", type: "exploitation", defaultFreq: "monthly", tvaRate: 0.21,
    suggestions: [
      { l: "Publicité en ligne", a: 300 },
      { l: "SEO & contenu", a: 200 },
      { l: "Événements", a: 500, freq: "quarterly" },
      { l: "Branding", a: 150 },
      { l: "Réseaux sociaux", a: 100 },
      { l: "Relations presse", a: 200 },
    ],
  },
  professional: {
    icon: Scales, badge: "gray",
    label: { fr: "Légaux & comptabilité", en: "Legal & accounting" },
    desc: { fr: "Services professionnels externes pour la gestion administrative et juridique.", en: "External professional services for administrative and legal management." },
    pcmn: "6130", type: "exploitation", defaultFreq: "monthly", tvaRate: 0.21,
    suggestions: [
      { l: "Comptable", a: 250, pcmn: "6131" },
      { l: "Avocat", a: 150, pcmn: "6132" },
      { l: "Consultant externe", a: 500 },
      { l: "Audit annuel", a: 2000, freq: "annual" },
      { l: "Secrétariat social", a: 80 },
    ],
  },
  insurance: {
    icon: ShieldCheck, badge: "warning",
    label: { fr: "Assurances", en: "Insurance" },
    desc: { fr: "Protection de l'activité, des personnes et des biens professionnels.", en: "Protection for your business, people and professional assets." },
    pcmn: "6141", type: "exploitation", defaultFreq: "monthly", tvaRate: 0,
    suggestions: [
      { l: "RC professionnelle", a: 80 },
      { l: "Assurance incendie", a: 50 },
      { l: "Assurance véhicule", a: 120 },
      { l: "Protection juridique", a: 40 },
      { l: "Accidents du travail", a: 60 },
    ],
  },
  travel: {
    icon: Car, badge: "gray",
    label: { fr: "Transport", en: "Travel" },
    desc: { fr: "Déplacements professionnels et mobilité au quotidien.", en: "Business travel and daily mobility." },
    pcmn: "6150", type: "exploitation", defaultFreq: "monthly", tvaRate: 0.21,
    suggestions: [
      { l: "Carburant", a: 150 },
      { l: "Transports en commun", a: 60 },
      { l: "Parking", a: 80 },
      { l: "Leasing véhicule", a: 400 },
      { l: "Indemnités kilométriques", a: 100 },
    ],
  },
  equipment: {
    icon: Briefcase, badge: "info",
    label: { fr: "Équipement", en: "Equipment" },
    desc: { fr: "Investissements matériels et immatériels, souvent ponctuels ou amortis.", en: "Tangible and intangible investments, often one-off or depreciated." },
    pcmn: "2400", type: "non_recurring", defaultFreq: "once", tvaRate: 0.21,
    suggestions: [
      { l: "Ordinateur portable", a: 1200, pcmn: "2410" },
      { l: "Écran", a: 400, pcmn: "2410" },
      { l: "Mobilier de bureau", a: 800 },
      { l: "Dépôt de marque", a: 300, pcmn: "2110" },
      { l: "Téléphone professionnel", a: 600, pcmn: "2410" },
    ],
  },
  other: {
    icon: Wrench, badge: "gray",
    label: { fr: "Autre", en: "Other" },
    desc: { fr: "Dépenses diverses non classées dans les autres catégories.", en: "Miscellaneous expenses not classified in other categories." },
    pcmn: "6160", type: "exploitation", defaultFreq: "monthly", tvaRate: 0.21,
    suggestions: [
      { l: "Fournitures de bureau", a: 30 },
      { l: "Abonnement téléphone", a: 25 },
      { l: "Repas d'affaires", a: 50 },
      { l: "Formation", a: 100 },
    ],
  },
  non_recurring: {
    icon: Wrench, badge: "warning",
    label: { fr: "Non récurrent", en: "Non-recurring" },
    desc: { fr: "Charges ponctuelles : frais de constitution, pénalités, pertes sur créances.", en: "One-off charges: incorporation costs, penalties, bad debts." },
    pcmn: "6600", type: "non_recurring", defaultFreq: "once", tvaRate: 0.21,
    suggestions: [
      { l: "Frais de constitution", a: 1500, tva: 0.21 },
      { l: "Publication Moniteur belge", a: 200, tva: 0 },
      { l: "Inscription BCE", a: 90, tva: 0 },
      { l: "Pénalité / amende", a: 0, tva: 0 },
    ],
  },
  purchases: {
    icon: ShoppingCart, badge: "brand",
    label: { fr: "Achats & marchandises", en: "Purchases & goods" },
    desc: { fr: "Achats de matières premières, marchandises et fournitures pour la production ou la revente.", en: "Raw materials, merchandise and supplies for production or resale." },
    pcmn: "6000", type: "exploitation", defaultFreq: "monthly", tvaRate: 0.21,
    suggestions: [
      { l: "Matières premières", a: 500, pcmn: "6000" },
      { l: "Marchandises", a: 800, pcmn: "6040" },
      { l: "Emballages", a: 100, pcmn: "6010" },
      { l: "Fournitures de production", a: 200, pcmn: "6020" },
    ],
  },
  taxes: {
    icon: Bank, badge: "gray",
    label: { fr: "Taxes & cotisations", en: "Taxes & fees" },
    desc: { fr: "Taxes communales, provinciales, cotisations professionnelles et contributions obligatoires.", en: "Municipal taxes, professional contributions and mandatory fees." },
    pcmn: "6400", type: "exploitation", defaultFreq: "annual", tvaRate: 0,
    suggestions: [
      { l: "Taxe communale", a: 300, freq: "annual" },
      { l: "Cotisation CCI", a: 200, freq: "annual" },
      { l: "Droit d'inscription BCE", a: 90, freq: "once" },
      { l: "Taxe bureaux", a: 150, freq: "annual" },
    ],
  },
  depreciation: {
    icon: Briefcase, badge: "info",
    label: { fr: "Amortissements", en: "Depreciation" },
    desc: { fr: "Dotations aux amortissements des immobilisations.", en: "Depreciation charges on fixed assets." },
    pcmn: "6302", type: "exploitation", defaultFreq: "monthly", tvaRate: null,
    suggestions: [],
  },
  financial_auto: {
    icon: Receipt, badge: "warning",
    label: { fr: "Charges financières", en: "Financial costs" },
    desc: { fr: "Intérêts sur emprunts et frais bancaires.", en: "Loan interest and banking fees." },
    pcmn: "6500", type: "financial", defaultFreq: "monthly", tvaRate: null,
    suggestions: [],
  },
};

/* Categories available in the modal (exclude auto-generated + equipment moves to Immobilisations) */
var COST_CATEGORIES_MODAL = ["premises", "software", "marketing", "professional", "insurance", "travel", "purchases", "taxes", "non_recurring", "other"];
/* All categories including auto-generated (for display/filter) */
var COST_CATEGORIES = Object.keys(COST_CATEGORY_META);

/* ── SVG Donut ── */
function CostDonut({ data, palette }) {
  var total = 0;
  var entries = [];
  Object.keys(data).forEach(function (k) { total += data[k]; entries.push({ key: k, value: data[k] }); });
  var size = 80, r = 30, cx = 40, cy = 40, sw = 10;
  var circ = 2 * Math.PI * r;
  if (total <= 0) {
    return <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }} role="img" aria-hidden="true"><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={sw} opacity={0.6} /></svg>;
  }
  var segs = entries.reduce(function (acc, e) {
    var prev = acc.length > 0 ? acc[acc.length - 1].end : 0;
    var pct = e.value / total;
    acc.push({ key: e.key, pct: pct, start: prev, end: prev + pct });
    return acc;
  }, []);
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }} role="img" aria-hidden="true">
      {segs.map(function (s) {
        return <circle key={s.key} cx={cx} cy={cy} r={r} fill="none" stroke={(palette || [])[segs.indexOf(s) % (palette || []).length] || "#9CA3AF"} strokeWidth={sw} strokeDasharray={(s.pct * circ) + " " + (circ - s.pct * circ)} strokeDashoffset={-s.start * circ} transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray 0.3s" }} />;
      })}
    </svg>
  );
}


var FREQ_LABELS = {
  monthly: { fr: "€/mois", en: "€/mo" },
  quarterly: { fr: "€/trimestre", en: "€/quarter" },
  annual: { fr: "€/an", en: "€/year" },
  once: { fr: "€ (unique)", en: "€ (one-off)" },
};

var FREQ_KEYS = ["monthly", "quarterly", "annual", "once"];

/* ── Coverage gauge (semi-circle) ── */
function CoverageGauge({ pct, months, t }) {
  var clamped = Math.min(Math.max(pct, 0), 200);
  var ratio = Math.min(clamped / 100, 1); /* 0-1 for the arc (100% = full) */
  var color = clamped >= 100 ? "var(--color-success)" : clamped >= 80 ? "var(--color-warning)" : "var(--color-error)";

  /* SVG semi-circle arc */
  var w = 120, h = 68;
  var cx = 60, cy = 60, r = 50;
  var sw = 10;
  /* arc from left to right (180 degrees) */
  var circumference = Math.PI * r; /* half circle */
  var dashLen = ratio * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-1)" }}>
      <div style={{ position: "relative", width: w, height: h }}>
        <svg width={w} height={h} viewBox={"0 0 " + w + " " + h} role="img" aria-hidden="true">
          {/* Background arc */}
          <path
            d={"M " + (cx - r) + " " + cy + " A " + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy}
            fill="none" stroke="var(--bg-hover)" strokeWidth={sw} strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={"M " + (cx - r) + " " + cy + " A " + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy}
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={dashLen + " " + circumference}
            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s" }}
          />
        </svg>
        {/* Centered percentage */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          textAlign: "center",
        }}>
          <span style={{
            fontSize: 22, fontWeight: 700, color: color,
            fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1,
          }}>
            {clamped}%
          </span>
        </div>
      </div>
      {/* Sub-text */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        {clamped >= 100
          ? (t.coverage_ok || "Your revenue covers all your costs.")
          : (t.coverage_low || "Your revenue doesn't cover all your costs yet.")}
      </div>
      {months !== null ? (
        <div style={{ fontSize: 10, color: "var(--text-faint)", textAlign: "center" }}>
          {t.coverage_months_text ? t.coverage_months_text(months) : (t.coverage_months || "i.e.") + " " + months + " " + (t.unit_months || "months")}
        </div>
      ) : null}
    </div>
  );
}

var COST_TAB_TYPES = ["all", "exploitation", "non_recurring", "financial"];

function costMonthly(item) {
  var a = item.a || 0;
  var total = item.pu ? a * (item.u || 1) : a;
  var freq = COST_FREQUENCIES[item.freq] || COST_FREQUENCIES.monthly;
  if (item.freq === "once") return 0;
  return total * freq.multiplier / 12;
}

function costAnnual(item) {
  var a = item.a || 0;
  var total = item.pu ? a * (item.u || 1) : a;
  var freq = COST_FREQUENCIES[item.freq] || COST_FREQUENCIES.monthly;
  return total * freq.multiplier;
}

/* ── Cost Modal — split panel like revenue StreamModal ── */
function CostModal({ onAdd, onSave, onClose, lang, initialData, showPcmn, defaultCategory }) {
  var t = useT().opex || {};
  var { dark: isDark } = useTheme();
  var isEdit = !!initialData;

  /* Resolve initial category from pcmn */
  function resolveCategory(item) {
    if (!item) return "other";
    var found = "other";
    COST_CATEGORIES.forEach(function (catKey) {
      var meta = COST_CATEGORY_META[catKey];
      if (meta.pcmn === item.pcmn) found = catKey;
      meta.suggestions.forEach(function (s) { if (s.pcmn === item.pcmn) found = catKey; });
    });
    return found;
  }

  var [selected, setSelected] = useState(isEdit ? resolveCategory(initialData) : (defaultCategory || "premises"));
  var [label, setLabel] = useState(isEdit ? initialData.l : "");
  var [amount, setAmount] = useState(isEdit ? (initialData.a || 0) : 0);
  var [freq, setFreq] = useState(isEdit ? (initialData.freq || "monthly") : COST_CATEGORY_META[selected || "other"].defaultFreq || "monthly");
  var [perUser, setPerUser] = useState(isEdit ? !!initialData.pu : false);
  var [units, setUnits] = useState(isEdit ? (initialData.u || 1) : 1);
  var [pcmn, setPcmn] = useState(isEdit ? (initialData.pcmn || "6160") : COST_CATEGORY_META.premises.pcmn);
  var [tva, setTva] = useState(isEdit && initialData.tva !== undefined ? initialData.tva : null);

  var lk = lang === "en" ? "en" : "fr";
  var meta = COST_CATEGORY_META[selected] || COST_CATEGORY_META.other;
  var Icon = meta.icon;

  function handleSelect(catKey) {
    setSelected(catKey);
    if (!isEdit) {
      var m = COST_CATEGORY_META[catKey];
      setLabel("");
      setAmount(0);
      setFreq(m.defaultFreq || "monthly");
      setPerUser(!!m.perUserDefault);
      setUnits(1);
      setPcmn(m.pcmn);
    }
  }

  function handleSuggestion(sug) {
    setLabel(sug.l);
    if (sug.a) setAmount(sug.a);
    if (sug.pcmn) setPcmn(sug.pcmn);
    if (sug.freq) setFreq(sug.freq);
  }

  function handleSubmit() {
    var data = {
      id: isEdit ? initialData.id : makeId(),
      l: label || meta.label[lk],
      a: amount,
      freq: freq,
      pu: perUser,
      u: perUser ? units : 1,
      pcmn: pcmn,
      sub: "",
      type: meta.type || "exploitation",
      tva: tva,
    };
    PCMN_OPTS.forEach(function (o) { if (o.c === pcmn) data.sub = o.l; });
    if (isEdit && onSave) { onSave(data); } else if (onAdd) { onAdd(data); }
    onClose();
  }

  var canSubmit = label.trim().length > 0;
  var monthly = costMonthly({ a: amount, freq: freq, pu: perUser, u: units });
  var annual = costAnnual({ a: amount, freq: freq, pu: perUser, u: units });

  return (
    <Modal open onClose={onClose} size="lg" height={540} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT — Category list */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {t.modal_category || "Category"}
            </div>
          </div>
          <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            {COST_CATEGORIES_MODAL.map(function (catKey) {
              var m = COST_CATEGORY_META[catKey];
              var CIcon = m.icon;
              var isActive = selected === catKey;
              return (
                <button key={catKey} onClick={function () { handleSelect(catKey); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    width: "100%", padding: "10px var(--sp-3)",
                    border: "none", borderRadius: "var(--r-md)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    cursor: "pointer", textAlign: "left", marginBottom: 2,
                    transition: "background 0.1s", fontFamily: "inherit",
                  }}
                  onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                >
                  <CIcon size={16} weight={isActive ? "fill" : "regular"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)", flex: 1 }}>
                    {m.label[lk]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Config panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                {meta.label[lk]}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>
                {meta.desc[lk]}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="custom-scroll" style={{ flex: 1, paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            {/* Label */}
            <div>
              <label htmlFor="cost-label" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {t.modal_cost_name || "Cost name"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input id="cost-label" value={label} onChange={function (e) { setLabel(e.target.value); }}
                autoFocus placeholder={meta.label[lk]}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            {/* Suggestions */}
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
                  options={meta.suggestions.map(function (sug) {
                    return { value: sug.l, label: sug.l };
                  })}
                  placeholder={t.modal_suggestions || "Suggestions..."}
                  clearable
                />
              </div>
            ) : null}

            {/* Amount + Frequency */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.modal_amount || "Amount"} <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <CurrencyInput value={amount} onChange={function (v) { setAmount(v); }} suffix={FREQ_LABELS[freq] ? FREQ_LABELS[freq][lk] : "€"} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.modal_frequency || "Frequency"}
                </label>
                <SelectDropdown
                  value={freq}
                  onChange={setFreq}
                  options={FREQ_KEYS.map(function (k) {
                    var labels = { monthly: t.freq_monthly || "Monthly", quarterly: t.freq_quarterly || "Quarterly", annual: t.freq_annual || "Annual", once: t.freq_once || "One-off" };
                    return { value: k, label: labels[k] };
                  })}
                />
              </div>
            </div>

            {/* Per-user multiplier */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                <button type="button" onClick={function () { setPerUser(function (v) { return !v; }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    flex: 1, height: 40, padding: "0 16px",
                    border: "1px solid " + (perUser ? "var(--brand)" : "var(--border)"),
                    borderRadius: "var(--r-md)", background: perUser ? "var(--brand-bg)" : "transparent",
                    color: perUser ? "var(--brand)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: perUser ? "1.5px solid var(--brand)" : "1.5px solid var(--border-strong)",
                    background: perUser ? "var(--brand)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s", flexShrink: 0,
                  }}>
                    {perUser ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  {t.modal_per_user || "Multiply by number of users"}
                </button>
                {perUser ? (
                  <input type="number" value={units} min={1} onChange={function (e) { setUnits(Math.max(1, Number(e.target.value) || 1)); }}
                    style={{ width: 70, height: 40, padding: "0 var(--sp-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "center" }}
                  />
                ) : null}
              </div>
              {perUser ? (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, paddingLeft: 2 }}>
                  {(t.modal_per_user_hint || "Amount will be multiplied by") + " " + (units || 1) + " " + ((units || 1) > 1 ? (t.users_label || "users") : (t.user_label || "user"))}
                </div>
              ) : null}
            </div>

            {/* TVA rate — visible only in accounting mode */}
            {meta.tvaRate !== null && cfg.showPcmn ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_tva || "Taux de TVA"}
                </label>
                <SelectDropdown
                  value={tva !== null ? String(tva) : String(meta.tvaRate)}
                  onChange={function (v) { setTva(parseFloat(v)); }}
                  options={[
                    { value: "0", label: "0% — " + (t.tva_exempt || "Exempté") },
                    { value: "0.06", label: "6% — " + (t.tva_reduced || "Réduit") },
                    { value: "0.12", label: "12% — " + (t.tva_intermediate || "Intermédiaire") },
                    { value: "0.21", label: "21% — " + (t.tva_standard || "Standard") },
                  ]}
                />
              </div>
            ) : null}

            {/* PCMN (optional — only when showPcmn) */}
            {showPcmn ? (
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.modal_pcmn || "PCMN code"}
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "3px 6px", borderRadius: "var(--r-sm)",
                    background: isDark ? "#fdf6e3" : "#2d2518", color: isDark ? "#2d2518" : "#f5d78e",
                    fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                    lineHeight: 1, verticalAlign: "middle",
                  }}>{t.modal_pcmn_tag || "Accounting"}</span>
                </label>
                <SelectDropdown
                  value={pcmn}
                  onChange={setPcmn}
                  options={PCMN_OPTS.filter(function (o) { return o.c.charAt(0) === "6" || o.c.charAt(0) === "2"; }).map(function (o) {
                    return { value: o.c, label: o.c + " — " + o.l };
                  })}
                />
              </div>
            ) : null}

            {/* Estimation */}
            {amount > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.modal_estimate || "Estimate"}</span>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(monthly)}/m</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "var(--sp-2)" }}>{eur(annual)}/an</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>
              {t.modal_close || "Close"}
            </Button>
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
export default function OperatingCostsPage({ costs, setCosts, cfg, totalRevenue, debts, assets, sals, crowdfunding, setTab, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var { lang } = useLang();
  var t = useT().opex || {};
  var [showCreate, setShowCreate] = useState(null); /* null = closed, string = default category key */
  var [editingCost, setEditingCost] = useState(null);
  var [filter, setFilter] = useState("all");
  var [search, setSearch] = useState("");
  var [activeTab, setActiveTab] = useState("all");
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var { devMode } = useDevMode();
  var { dark } = useTheme();
  var devBadgeStyle = {
    marginLeft: 6, padding: "2px 6px", borderRadius: "var(--r-sm)",
    background: dark ? "var(--color-dev-banner-light)" : "var(--color-dev-banner-dark)",
    color: dark ? "var(--color-dev-banner-dark)" : "var(--color-dev-banner-light)",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
    lineHeight: "14px", verticalAlign: "middle",
  };
  var lk = lang === "en" ? "en" : "fr";

  /* flatten all costs */
  var flatItems = useMemo(function () {
    var items = [];
    (costs || []).forEach(function (cat, ci) {
      (cat.items || []).forEach(function (item, ii) {
        items.push(Object.assign({}, item, { _ci: ci, _ii: ii, _cat: cat.cat }));
      });
    });
    return items;
  }, [costs]);

  /* synthetic read-only items from debts (interest charges) */
  var debtInterestItems = useMemo(function () {
    if (!debts || !debts.length) return [];
    return debts.filter(function (d) {
      return d.rate > 0 && d.amount > 0 && d.duration > (d.elapsed || 0);
    }).map(function (d, i) {
      var r = d.rate / 12;
      var pow = Math.pow(1 + r, d.duration);
      var powE = Math.pow(1 + r, d.elapsed || 0);
      var bal = d.amount * (pow - powE) / (pow - 1);
      var yearlyInterest = bal * d.rate;
      return {
        id: "_debt_" + i,
        l: d.label || (t.debt_interest_label || "Loan interest"),
        a: Math.round(yearlyInterest / 12 * 100) / 100,
        freq: "monthly",
        pu: false, u: 1,
        pcmn: "6500",
        type: "financial",
        _readOnly: true,
        _ci: -1, _ii: -1,
        _cat: t.debt_cat_label || "Financing",
      };
    });
  }, [debts, t]);

  /* synthetic read-only items from assets (depreciation charges 6302) */
  var depreciationItems = useMemo(function () {
    if (!assets || !assets.length) return [];
    return assets.filter(function (a) {
      return a.amount > 0 && a.years > 0;
    }).map(function (a, i) {
      var depreciable = a.amount - (a.residual || 0);
      var annualDep = depreciable > 0 ? depreciable / a.years : 0;
      return {
        id: "_dep_" + i,
        l: (t.dep_prefix || "Dot. amort.") + " " + (a.label || ""),
        a: Math.round(annualDep * 100) / 100,
        freq: "annual",
        pu: false, u: 1,
        pcmn: "6302",
        type: "exploitation",
        _readOnly: true,
        _linkedPage: "equipment",
        _ci: -1, _ii: -1,
        _cat: t.dep_cat_label || "Depreciation",
      };
    });
  }, [assets, t]);

  /* synthetic read-only items from salary benefits (ATN charges) */
  var benefitItems = useMemo(function () {
    if (!sals || !sals.length) return [];
    var items = [];
    sals.forEach(function (s, si) {
      if (!s.benefits || !s.benefits.length) return;
      s.benefits.forEach(function (b) {
        if (!b.amount || b.amount <= 0) return;
        items.push({
          id: "_ben_" + si + "_" + b.id,
          l: (s.role || "—") + " — " + (b.label || b.id),
          a: b.amount,
          freq: "monthly",
          pu: false, u: 1,
          pcmn: b.pcmn || "6130",
          type: "exploitation",
          _readOnly: true,
          _linkedPage: "salaries",
          _ci: -1, _ii: -1,
        });
      });
    });
    return items;
  }, [sals]);

  /* synthetic read-only items from crowdfunding tiers */
  var crowdfundingItems = useMemo(function () {
    if (!crowdfunding || !crowdfunding.enabled || !crowdfunding.tiers || !crowdfunding.tiers.length) return [];
    var items = [];
    crowdfunding.tiers.forEach(function (ti, tiIdx) {
      var total = (ti.unitCost || 0) * (ti.quantity || 0);
      if (total <= 0) return;
      items.push({
        id: "_crowd_" + tiIdx,
        l: (crowdfunding.name || (t.crowdfunding_btn || "Crowdfunding")) + " — " + (ti.name || (t.tier_label || "Palier") + " " + (tiIdx + 1)),
        a: Math.round(total * 100) / 100,
        freq: "once",
        pu: false, u: 1,
        pcmn: "6160",
        type: "non_recurring",
        _readOnly: true,
        _linkedPage: "crowdfunding",
        _ci: -1, _ii: -1,
      });
    });
    return items;
  }, [crowdfunding]);

  /* items filtered by tab type */
  var tabItems = useMemo(function () {
    var items = activeTab === "all"
      ? flatItems
      : flatItems.filter(function (item) { return (item.type || "exploitation") === activeTab; });
    /* inject read-only items */
    if (activeTab === "financial" || activeTab === "all") {
      items = debtInterestItems.concat(items);
    }
    if (activeTab === "exploitation" || activeTab === "all") {
      items = depreciationItems.concat(benefitItems).concat(items);
    }
    if (activeTab === "non_recurring" || activeTab === "all") {
      items = crowdfundingItems.concat(items);
    }
    return items;
  }, [flatItems, activeTab, debtInterestItems, depreciationItems, benefitItems, crowdfundingItems]);

  /* further filtered by search + category */
  var filteredItems = useMemo(function () {
    var items = tabItems;
    if (filter !== "all") {
      items = items.filter(function (item) { return item.pcmn === filter; });
    }
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      items = items.filter(function (item) { return (item.l || "").toLowerCase().indexOf(q) !== -1; });
    }
    return items;
  }, [tabItems, filter, search]);

  /* totals (includes auto-generated depreciation + interest items) */
  var totals = useMemo(function () {
    var monthly = 0, annual = 0, count = 0;
    function addItem(item) {
      monthly += costMonthly(item);
      annual += costAnnual(item);
      if ((item.a || 0) > 0) count++;
    }
    flatItems.forEach(addItem);
    depreciationItems.forEach(addItem);
    debtInterestItems.forEach(addItem);
    benefitItems.forEach(addItem);
    crowdfundingItems.forEach(addItem);
    return { monthly: monthly, annual: annual, count: count };
  }, [flatItems, depreciationItems, debtInterestItems, benefitItems, crowdfundingItems]);

  /* tab totals */
  var tabTotals = useMemo(function () {
    var annual = 0;
    filteredItems.forEach(function (item) { annual += costAnnual(item); });
    return { annual: annual };
  }, [filteredItems]);

  /* tab counts */
  var tabCounts = useMemo(function () {
    var counts = { all: flatItems.length + debtInterestItems.length + depreciationItems.length + benefitItems.length + crowdfundingItems.length, exploitation: depreciationItems.length + benefitItems.length, non_recurring: crowdfundingItems.length, financial: debtInterestItems.length };
    flatItems.forEach(function (item) { counts[item.type || "exploitation"]++; });
    return counts;
  }, [flatItems, debtInterestItems.length, depreciationItems.length]);

  /* category distribution for donut (includes auto items) */
  var categoryDistribution = useMemo(function () {
    var dist = {};
    flatItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) {
        var catKey = "other";
        COST_CATEGORIES.forEach(function (ck) {
          var m = COST_CATEGORY_META[ck];
          if (m.pcmn === item.pcmn) catKey = ck;
          m.suggestions.forEach(function (s) { if (s.pcmn === item.pcmn) catKey = ck; });
        });
        dist[catKey] = (dist[catKey] || 0) + ann;
      }
    });
    depreciationItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) dist["depreciation"] = (dist["depreciation"] || 0) + ann;
    });
    debtInterestItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) dist["financial_auto"] = (dist["financial_auto"] || 0) + ann;
    });
    benefitItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) {
        var bCat = "other";
        COST_CATEGORIES.forEach(function (ck) {
          var m = COST_CATEGORY_META[ck];
          if (m.pcmn === item.pcmn) bCat = ck;
        });
        dist[bCat] = (dist[bCat] || 0) + ann;
      }
    });
    return dist;
  }, [flatItems, depreciationItems, debtInterestItems, benefitItems]);

  /* top cost (includes auto items) */
  var topCost = useMemo(function () {
    var best = null;
    var bestAnn = 0;
    function check(item) {
      var ann = costAnnual(item);
      if (ann > bestAnn) { best = item; bestAnn = ann; }
    }
    flatItems.forEach(check);
    depreciationItems.forEach(check);
    debtInterestItems.forEach(check);
    benefitItems.forEach(check);
    crowdfundingItems.forEach(check);
    if (!best || bestAnn <= 0) return null;
    return { name: best.l, annual: bestAnn, pct: totals.annual > 0 ? Math.round(bestAnn / totals.annual * 100) : 0, pcmn: best.pcmn };
  }, [flatItems, depreciationItems, debtInterestItems, benefitItems, crowdfundingItems, totals.annual]);

  /* fixed vs variable split (includes auto items as fixed) */
  var fixedVarSplit = useMemo(function () {
    var fixed = 0, variable = 0;
    flatItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann <= 0) return;
      if (item.freq === "once") { variable += ann; } else { fixed += ann; }
    });
    depreciationItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) fixed += ann;
    });
    debtInterestItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) fixed += ann;
    });
    benefitItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) fixed += ann;
    });
    crowdfundingItems.forEach(function (item) {
      var ann = costAnnual(item);
      if (ann > 0) variable += ann;
    });
    return { fixed: fixed, variable: variable, total: fixed + variable };
  }, [flatItems, depreciationItems, debtInterestItems, benefitItems, crowdfundingItems]);

  function addCost(newItem) {
    setCosts(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      if (nc.length === 0) nc.push({ cat: "Charges", items: [] });
      nc[0].items.push(newItem);
      return nc;
    });
  }

  function removeItem(ci, ii) {
    setCosts(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items.splice(ii, 1);
      if (nc[ci].items.length === 0) nc.splice(ci, 1);
      return nc;
    });
  }

  function requestDelete(ci, ii) {
    if (skipDeleteConfirm) { removeItem(ci, ii); } else { setPendingDelete({ ci: ci, ii: ii }); }
  }

  function cloneItem(ci, ii) {
    setCosts(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      var original = nc[ci].items[ii];
      var clone = Object.assign({}, original, { id: makeId(), l: original.l + (t.copy_suffix || " (copy)") });
      nc[ci].items.splice(ii + 1, 0, clone);
      return nc;
    });
  }

  function saveItem(ci, ii, data) {
    setCosts(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items[ii] = Object.assign({}, nc[ci].items[ii], data);
      return nc;
    });
  }

  function randomizeCosts() {
    var items = [];
    COST_CATEGORIES_MODAL.forEach(function (catKey) {
      var meta = COST_CATEGORY_META[catKey];
      var picks = meta.suggestions.slice(0, 2 + Math.floor(Math.random() * 2));
      picks.forEach(function (sug) {
        items.push({
          id: makeId(),
          l: sug.l,
          a: Math.round(10 + Math.random() * 500),
          freq: sug.freq || meta.defaultFreq || "monthly",
          pu: !!meta.perUserDefault,
          u: meta.perUserDefault ? 1 + Math.floor(Math.random() * 4) : 1,
          pcmn: sug.pcmn || meta.pcmn,
          sub: "",
          type: sug.type || meta.type || "exploitation",
        });
      });
    });
    setCosts([{ cat: "Charges", items: items }]);
  }

  /* columns */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "l",
        header: t.col_item || "Item",
        enableSorting: true,
        meta: { align: "left", minWidth: 200, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>
                {filteredItems.length} {filteredItems.length === 1 ? (t.footer_item || "item") : (t.footer_items || "items")}
              </span>
            </>
          );
        },
      },
      {
        id: "category", accessorKey: "_cat",
        header: t.col_category || "Category",
        enableSorting: true,
        meta: { align: "left" },
        cell: function (info) {
          var pcmnVal = info.row.original.pcmn;
          /* Find matching category from COST_CATEGORY_META */
          var found = null;
          COST_CATEGORIES.forEach(function (catKey) {
            var m = COST_CATEGORY_META[catKey];
            if (m.pcmn === pcmnVal) found = m;
            m.suggestions.forEach(function (s) { if (s.pcmn === pcmnVal) found = m; });
          });
          if (!found) return info.getValue() || "—";
          return <Badge color={found.badge} size="sm" dot>{found.label[lk]}</Badge>;
        },
      },
      {
        id: "amount", accessorKey: "a",
        header: t.col_unit_cost || "Unit cost",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) {
          var row = info.row.original;
          var v = row.a || 0;
          var suffix = FREQ_LABELS[row.freq] ? FREQ_LABELS[row.freq][lk] : "€/mois";
          var formatted = v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
          return formatted + " " + suffix;
        },
      },
      {
        id: "volume",
        accessorFn: function (row) { return row.pu ? (row.u || 1) : 0; },
        header: t.col_volume || "Volume",
        enableSorting: true,
        meta: { align: "right", minWidth: 100 },
        cell: function (info) {
          var row = info.row.original;
          if (!row.pu) return <span style={{ color: "var(--text-faint)" }}>—</span>;
          return (row.u || 1) + " " + (t.users_label || "users");
        },
      },
      {
        id: "annual",
        accessorFn: function (row) { return costAnnual(row); },
        header: t.col_annual || "Annual",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{eur(tabTotals.annual)}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>/an</span>
            </>
          );
        },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          if (row._readOnly) {
            var linkedPage = row._linkedPage || (row.pcmn === "6500" ? "debt" : "equipment");
            var LINKED_LABELS = { debt: t.financing_btn || "Financement", salaries: t.salaries_btn || "Rémunérations", crowdfunding: t.crowdfunding_btn || "Crowdfunding", equipment: t.equipment_btn || "Équipements" };
            var linkedLabel = LINKED_LABELS[linkedPage] || LINKED_LABELS.equipment;
            return (
              <button
                type="button"
                onClick={function () { setTab(linkedPage); }}
                title={t.auto_tooltip || "Géré automatiquement. Cliquez pour voir la source."}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "var(--brand)", fontStyle: "italic",
                  border: "none", background: "none", cursor: "pointer",
                  fontFamily: "inherit", padding: "2px 6px", borderRadius: "var(--r-sm)",
                  transition: "background 0.12s",
                }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "none"; }}
              >
                <ArrowRight size={10} weight="bold" />
                {linkedLabel}
              </button>
            );
          }
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Edit"} onClick={function () { setEditingCost({ ci: row._ci, ii: row._ii, item: row }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Clone"} onClick={function () { cloneItem(row._ci, row._ii); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Delete"} variant="danger" onClick={function () { requestDelete(row._ci, row._ii); }} />
            </div>
          );
        },
      },
    ];
  }, [lang, lk, tabTotals, filteredItems.length]);

  /* Tab labels */
  var TAB_LABELS = {
    all: t.tab_all || "All",
    exploitation: t.tab_exploitation || "Operating",
    non_recurring: t.tab_non_recurring || "Non-recurring",
    financial: t.tab_financial || "Financial",
  };

  /* coverage ratio */
  var rev = totalRevenue || 0;
  var costRatio = totals.annual > 0 && rev > 0 ? Math.round(totals.annual / rev * 100) : null;
  var coverageMonths = totals.monthly > 0 && rev > 0 ? Math.round(rev / 12 / totals.monthly * 10) / 10 : null;
  var coveragePct = rev > 0 && totals.annual > 0 ? Math.min(Math.round(rev / totals.annual * 100), 200) : null;

  /* filter options from tab items */
  var filterOptions = useMemo(function () {
    var pcmnCounts = {};
    tabItems.forEach(function (item) { pcmnCounts[item.pcmn] = (pcmnCounts[item.pcmn] || 0) + 1; });
    var opts = [{ value: "all", label: t.filter_all_categories || "All categories" }];
    Object.keys(pcmnCounts).forEach(function (code) {
      var found = null;
      COST_CATEGORIES.forEach(function (catKey) {
        var m = COST_CATEGORY_META[catKey];
        if (m.pcmn === code) found = m;
        m.suggestions.forEach(function (s) { if (s.pcmn === code) found = m; });
      });
      if (found) opts.push({ value: code, label: found.label[lk] });
    });
    return opts;
  }, [tabItems, lang, lk]);

  /* toolbar */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Search..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <>
            <Button color="tertiary" size="lg" onClick={function () { setCosts([]); }} iconLeading={<Eraser size={14} weight="bold" />}>
              {t.clear || "Clear"}
              <span style={devBadgeStyle}>DEV</span>
            </Button>
            <Button color="tertiary" size="lg" onClick={randomizeCosts} iconLeading={<Shuffle size={14} weight="bold" />}>
              {t.randomize || "Randomize"}
              <span style={devBadgeStyle}>DEV</span>
            </Button>
          </>
        ) : null}
        {activeTab === "financial" ? (
          <Button color="secondary" size="lg" onClick={function () { setTab("debt"); }} iconLeading={<ArrowRight size={14} weight="bold" />}>
            {t.financing_btn || "Financing"}
          </Button>
        ) : (
          <Button color="primary" size="lg" onClick={function () { setShowCreate(activeTab === "non_recurring" ? "equipment" : "premises"); }} iconLeading={<Plus size={14} weight="bold" />}>
            {t.add_label || "Add"}
          </Button>
        )}
      </div>
    </>
  );

  /* empty state */
  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Receipt size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
        {t.no_costs || "No costs"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {t.no_costs_hint || "Add your operating costs to complete your projections."}
      </div>
      <Button color="primary" size="md" onClick={function () { setShowCreate(activeTab === "non_recurring" ? "equipment" : activeTab === "financial" ? "other" : "premises"); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {t.add_source || "Add a cost"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.page_title || "Costs"}
      subtitle={t.page_subtitle || "Manage your business expenses."}
    >
      {showCreate ? <CostModal onAdd={addCost} onClose={function () { setShowCreate(null); }} lang={lang} showPcmn={cfg && cfg.showPcmn} defaultCategory={typeof showCreate === "string" ? showCreate : undefined} /> : null}

      {editingCost ? <CostModal
        initialData={editingCost.item}
        onSave={function (data) { saveItem(editingCost.ci, editingCost.ii, data); }}
        showPcmn={cfg && cfg.showPcmn}
        onClose={function () { setEditingCost(null); }}
        lang={lang}
      /> : null}

      {pendingDelete ? <ConfirmDeleteModal
        onConfirm={function () { removeItem(pendingDelete.ci, pendingDelete.ii); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm}
        setSkipNext={setSkipDeleteConfirm}
        t={{
          confirm_title: t.confirm_delete_title || "Delete this cost?",
          confirm_body: t.confirm_delete_body || "This cost will be permanently deleted.",
          confirm_skip: t.confirm_delete_skip || "Don't ask again",
          cancel: t.cancel || "Cancel",
          delete: t.delete || "Delete",
        }}
      /> : null}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_monthly_costs || "Monthly costs"} value={eurShort(totals.monthly)} fullValue={eur(totals.monthly)} glossaryKey="total_costs" />
        <KpiCard label={t.kpi_annual_costs || "Annual costs"} value={eurShort(totals.annual)} fullValue={eur(totals.annual)} glossaryKey="total_costs" />
        <KpiCard label={t.kpi_active_items || "Active items"} value={String(totals.count)} />
        <KpiCard
          label={t.kpi_cost_ratio || "Cost/revenue ratio"} glossaryKey="cost_coverage"
          value={costRatio !== null ? costRatio + " %" : "—"}
          color={costRatio !== null && costRatio > 100 ? "var(--color-error)" : costRatio !== null && costRatio > 80 ? "var(--color-warning)" : undefined}
        />
      </div>

      {/* ── Insights ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Donut: répartition par catégorie */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Distribution by category"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ChartLegend palette={chartPalette} distribution={categoryDistribution} meta={COST_CATEGORY_META} total={totals.annual} lk={lk}>
            <CostDonut data={categoryDistribution} palette={chartPalette} />
          </ChartLegend>

          {/* Fixed vs variable bar */}
          <div style={{ marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>{t.recurring_label || "Recurring"} {fixedVarSplit.total > 0 ? Math.round(fixedVarSplit.fixed / fixedVarSplit.total * 100) + "%" : "—"}</span>
              <span>{t.once_label || "One-off"} {fixedVarSplit.total > 0 ? Math.round(fixedVarSplit.variable / fixedVarSplit.total * 100) + "%" : "—"}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden", display: "flex" }}>
              {fixedVarSplit.total > 0 ? (
                <div style={{ width: (fixedVarSplit.fixed / fixedVarSplit.total * 100) + "%", background: "var(--color-error)", borderRadius: 3, transition: "width 0.3s", opacity: 0.7 }} />
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: top cost + projection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          {/* Top cost */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: "0 0 auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.top_cost || "Top cost"}
            </div>
            {topCost ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{topCost.name}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {eur(topCost.annual)}/an <span style={{ margin: "0 6px", color: "var(--text-muted)" }} aria-hidden="true">•</span> <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{topCost.pct}%</span> {t.of_total_prefix || "des "}<FinanceLink term="total_costs" label={t.finance_link_total_costs || "charges totales"} desc={t.glossary_total_costs} />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <span style={{ width: 120, height: 14, borderRadius: 4, background: "var(--bg-hover)" }} />
                </div>
                <div style={{ width: 180, height: 10, borderRadius: 4, background: "var(--bg-hover)", marginTop: 8 }} />
              </>
            )}
          </div>

          {/* Coverage indicator — gauge */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.coverage_title || "Revenue coverage"}
            </div>
            {coveragePct !== null ? (
              <CoverageGauge pct={coveragePct} months={coverageMonths} t={t} />
            ) : (
              /* skeleton gauge */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-2)" }}>
                <svg width={120} height={68} viewBox="0 0 120 68" role="img" aria-hidden="true">
                  <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="var(--bg-hover)" strokeWidth={10} strokeLinecap="round" />
                </svg>
                <span style={{ width: 80, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {COST_TAB_TYPES.map(function (tabType) {
          var isActive = activeTab === tabType;
          var label = TAB_LABELS[tabType];
          var count = tabCounts[tabType] || 0;
          return (
            <button key={tabType} type="button" onClick={function () { setActiveTab(tabType); setFilter("all"); }}
              style={{
                padding: "var(--sp-2) var(--sp-4)",
                border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2,
                background: "transparent",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.12s, border-color 0.12s",
              }}>
              {label}
              {count > 0 ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 18, height: 18, padding: "0 5px", marginLeft: 6,
                  borderRadius: "var(--r-full)",
                  background: isActive ? "var(--brand)" : "var(--bg-hover)",
                  color: isActive ? "white" : "var(--text-muted)",
                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === "non_recurring" ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-3)", lineHeight: 1.5 }}>
          {t.tab_non_recurring_desc || "One-time purchases, exceptional expenses and non-repeating costs."}
        </div>
      ) : null}

      {/* DataTable */}
      <DataTable
        data={filteredItems}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={200}
        pageSize={10}
        dimRow={function (row) { return !row.a; }}
        getRowId={function (row) { return row.id || (row._ci + "-" + row._ii); }}
      />
    </PageLayout>
  );
}
