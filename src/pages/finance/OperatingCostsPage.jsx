import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash, ArrowRight,
  Buildings, Receipt, Desktop, Scales,
  Megaphone, ShieldCheck, Wrench, Briefcase, Car,
  PencilSimple, Copy, ShoppingCart, Bank, DotsThreeCircle,
  Percent, Stack, Cpu,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, SearchInput, FilterDropdown, SelectDropdown, ActionBtn, FinanceLink, PaletteToggle, ChartLegend, ExportButtons, DevOptionsButton, DonutChart, ModalSideNav, Modal, ModalFooter, CurrencyInput, NumberField, LockIndicator } from "../../components";
import { eur, eurShort, makeId, pct, resolveTier } from "../../utils";
import { useT, useLang, useDevMode, useTheme } from "../../context";
import { useLock } from "../../context/LockContext";
import useEditLock from "../../hooks/useEditLock";
import useBreakpoint from "../../hooks/useBreakpoint";
import { PCMN_OPTS, COST_FREQUENCIES } from "../../constants/defaults";


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
    icon: DotsThreeCircle, badge: "gray",
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
  variable_revenue: {
    icon: Percent, badge: "info",
    label: { fr: "Variable (% CA)", en: "Variable (% revenue)" },
    desc: { fr: "Frais proportionnels au chiffre d'affaires ou au nombre de transactions (ex : frais Stripe 1,4% + 0,25€).", en: "Costs proportional to revenue or number of transactions (e.g. Stripe fees 1.4% + 0.25€)." },
    pcmn: "6130", type: "exploitation", defaultFreq: "monthly", tvaRate: 0,
    suggestions: [],
    isVariableRevenue: true,
  },
  tiered_clients: {
    icon: Stack, badge: "info",
    label: { fr: "Paliers (nb clients)", en: "Tiered (clients)" },
    desc: { fr: "Coût annuel par paliers selon le nombre de clients actifs (infrastructure cloud, SaaS avec seuils).", en: "Annual cost by tiers based on active client count (cloud infra, tiered SaaS)." },
    pcmn: "6125", type: "exploitation", defaultFreq: "annual", tvaRate: 0.21,
    suggestions: [],
    isTiered: true,
  },
  hardware_per_clients: {
    icon: Cpu, badge: "info",
    label: { fr: "Hardware (ratio clients)", en: "Hardware (clients ratio)" },
    desc: { fr: "Équipement physique amorti, déployé au prorata des clients (ex : 1 module pour 3 users, amorti sur 2 ans).", en: "Physical equipment deployed proportionally to clients (e.g. 1 module per 3 users, amortised over 2 years)." },
    pcmn: "6302", type: "exploitation", defaultFreq: "monthly", tvaRate: 0.21,
    suggestions: [],
    isHardwarePerClients: true,
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
var COST_CATEGORIES_MODAL = ["premises", "software", "marketing", "professional", "insurance", "travel", "taxes", "variable_revenue", "tiered_clients", "hardware_per_clients", "non_recurring", "other"];
/* All categories including auto-generated (for display/filter) */
var COST_CATEGORIES = Object.keys(COST_CATEGORY_META);


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

function costMonthly(item, ctx) {
  ctx = ctx || {};
  if (item && item.kind === "variable_revenue") {
    var basis = item.basis || "revenue";
    var annualBase = basis === "gmv" ? (ctx.monthlyGMV || 0) * 12 : (ctx.totalRevenue || 0);
    var monthlyTx = ctx.monthlyTransactions || 0;
    return (annualBase / 12) * (item.pctOfRevenue || 0) + monthlyTx * (item.perTransaction || 0);
  }
  if (item && item.kind === "tiered_clients") {
    return resolveTier(item.tiers || [], ctx.avgActiveClients || 0) / 12;
  }
  if (item && item.kind === "hardware_per_clients") {
    var clients = ctx.avgActiveClients || 0;
    var perUnit = Math.max(1, item.clientsPerUnit || 1);
    var years = Math.max(1, item.amortYears || 1);
    return ((clients / perUnit) * (item.unitCost || 0)) / years / 12;
  }
  var a = item.a || 0;
  var total = item.pu ? a * (item.u || 1) : a;
  var freq = COST_FREQUENCIES[item.freq] || COST_FREQUENCIES.monthly;
  if (item.freq === "once") return 0;
  return total * freq.multiplier / 12;
}

function costAnnual(item, ctx) {
  ctx = ctx || {};
  if (item && item.kind === "variable_revenue") {
    return costMonthly(item, ctx) * 12;
  }
  if (item && item.kind === "tiered_clients") {
    return resolveTier(item.tiers || [], ctx.avgActiveClients || 0);
  }
  if (item && item.kind === "hardware_per_clients") {
    return costMonthly(item, ctx) * 12;
  }
  var a = item.a || 0;
  var total = item.pu ? a * (item.u || 1) : a;
  var freq = COST_FREQUENCIES[item.freq] || COST_FREQUENCIES.monthly;
  return total * freq.multiplier;
}

/* ── Cost Modal — split panel like revenue StreamModal ── */
function CostModal({ onAdd, onSave, onClose, lang, initialData, showPcmn, defaultCategory, initialLabel, cfg, streams, costCtx }) {
  var t = useT().opex || {};
  var { dark: isDark } = useTheme();
  var bp = useBreakpoint();
  var isMobile = bp.isMobile;
  var isEdit = !!initialData;

  /* Resolve initial category from pcmn / kind */
  function resolveCategory(item) {
    if (!item) return "other";
    if (item.kind === "variable_revenue") return "variable_revenue";
    if (item.kind === "tiered_clients") return "tiered_clients";
    if (item.kind === "hardware_per_clients") return "hardware_per_clients";
    var found = "other";
    COST_CATEGORIES.forEach(function (catKey) {
      var meta = COST_CATEGORY_META[catKey];
      if (meta.isVariableRevenue || meta.isTiered || meta.isHardwarePerClients) return;
      if (meta.pcmn === item.pcmn) found = catKey;
      meta.suggestions.forEach(function (s) { if (s.pcmn === item.pcmn) found = catKey; });
    });
    return found;
  }

  var [selected, setSelected] = useState(isEdit ? resolveCategory(initialData) : (defaultCategory || "premises"));
  var [label, setLabel] = useState(isEdit ? initialData.l : (initialLabel || ""));
  var [amount, setAmount] = useState(isEdit ? (initialData.a || 0) : 0);
  var [freq, setFreq] = useState(isEdit ? (initialData.freq || "monthly") : COST_CATEGORY_META[selected || "other"].defaultFreq || "monthly");
  var [perUser, setPerUser] = useState(isEdit ? !!initialData.pu : false);
  var [units, setUnits] = useState(isEdit ? (initialData.u || 1) : 1);
  var [pcmn, setPcmn] = useState(isEdit ? (initialData.pcmn || "6160") : COST_CATEGORY_META.premises.pcmn);
  var [tva, setTva] = useState(isEdit && initialData.tva !== undefined ? initialData.tva : null);
  var [growthRate, setGrowthRate] = useState(isEdit ? (initialData.growthRate != null ? initialData.growthRate : 0) : ((cfg && cfg.costEscalation) || 0.02));
  var [linkedStream, setLinkedStream] = useState(isEdit ? (initialData.linkedStream || "") : "");
  /* variable_revenue fields */
  var [pctOfRevenue, setPctOfRevenue] = useState(isEdit && initialData.pctOfRevenue != null ? initialData.pctOfRevenue : 0);
  var [perTransaction, setPerTransaction] = useState(isEdit && initialData.perTransaction != null ? initialData.perTransaction : 0);
  var [variableBasis, setVariableBasis] = useState(isEdit && initialData.basis ? initialData.basis : "revenue");
  /* tiered_clients fields */
  var [tiers, setTiers] = useState(isEdit && initialData.tiers ? JSON.parse(JSON.stringify(initialData.tiers)) : [
    { upTo: 100, annualCost: 0 },
    { upTo: null, annualCost: 0 },
  ]);
  /* hardware_per_clients fields */
  var [unitCost, setUnitCost] = useState(isEdit && initialData.unitCost != null ? initialData.unitCost : 0);
  var [clientsPerUnit, setClientsPerUnit] = useState(isEdit && initialData.clientsPerUnit != null ? initialData.clientsPerUnit : 3);
  var [amortYears, setAmortYears] = useState(isEdit && initialData.amortYears != null ? initialData.amortYears : 2);

  var lk = lang === "en" ? "en" : "fr";
  var meta = COST_CATEGORY_META[selected] || COST_CATEGORY_META.other;
  var Icon = meta.icon;

  /* Resolve linked stream's growth rate */
  var linkedStreamRate = null;
  if (linkedStream) {
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (s) {
        if (s.id === linkedStream) linkedStreamRate = s.growthRate != null ? s.growthRate : ((cfg && cfg.revenueGrowthRate) || 0.10);
      });
    });
  }

  /* Build stream options for linkedStream dropdown */
  var streamOptions = [{ value: "", label: lk === "fr" ? "Aucun" : "None" }];
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (s) {
      if (s.l) streamOptions.push({ value: s.id, label: s.l });
    });
  });

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
    var data;
    if (meta.isVariableRevenue) {
      data = {
        id: isEdit ? initialData.id : makeId(),
        l: label || meta.label[lk],
        kind: "variable_revenue",
        pctOfRevenue: pctOfRevenue || 0,
        perTransaction: perTransaction || 0,
        basis: variableBasis,
        a: 0, freq: "monthly", pu: false, u: 1,
        pcmn: pcmn, sub: "", type: meta.type || "exploitation",
        tva: tva, growthRate: 0,
      };
    } else if (meta.isTiered) {
      data = {
        id: isEdit ? initialData.id : makeId(),
        l: label || meta.label[lk],
        kind: "tiered_clients",
        tiers: (tiers || []).map(function (ti) {
          return { upTo: ti.upTo == null || ti.upTo === "" ? null : Number(ti.upTo), annualCost: Number(ti.annualCost) || 0 };
        }),
        a: 0, freq: "annual", pu: false, u: 1,
        pcmn: pcmn, sub: "", type: meta.type || "exploitation",
        tva: tva, growthRate: 0,
      };
    } else if (meta.isHardwarePerClients) {
      data = {
        id: isEdit ? initialData.id : makeId(),
        l: label || meta.label[lk],
        kind: "hardware_per_clients",
        unitCost: Number(unitCost) || 0,
        clientsPerUnit: Math.max(1, Number(clientsPerUnit) || 1),
        amortYears: Math.max(1, Number(amortYears) || 1),
        a: 0, freq: "monthly", pu: false, u: 1,
        pcmn: pcmn, sub: "", type: meta.type || "exploitation",
        tva: tva, growthRate: 0,
      };
    } else {
      data = {
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
        growthRate: linkedStream ? (linkedStreamRate != null ? linkedStreamRate : growthRate) : growthRate,
        linkedStream: linkedStream || undefined,
      };
    }
    PCMN_OPTS.forEach(function (o) { if (o.c === pcmn) data.sub = o.l; });
    if (isEdit && onSave) { onSave(data); } else if (onAdd) { onAdd(data); }
    onClose();
  }

  var canSubmit = label.trim().length > 0 || meta.isVariableRevenue || meta.isTiered || meta.isHardwarePerClients;
  var previewItem;
  if (meta.isVariableRevenue) {
    previewItem = { kind: "variable_revenue", pctOfRevenue: pctOfRevenue, perTransaction: perTransaction, basis: variableBasis };
  } else if (meta.isTiered) {
    previewItem = { kind: "tiered_clients", tiers: tiers };
  } else if (meta.isHardwarePerClients) {
    previewItem = { kind: "hardware_per_clients", unitCost: unitCost, clientsPerUnit: clientsPerUnit, amortYears: amortYears };
  } else {
    previewItem = { a: amount, freq: freq, pu: perUser, u: units };
  }
  var monthly = costMonthly(previewItem, costCtx);
  var annual = costAnnual(previewItem, costCtx);

  return (
    <Modal open onClose={onClose} size="lg" height={540} hideClose mobileMode="dialog">
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT — Category list */}
        <ModalSideNav
          title={t.modal_category || "Category"}
          items={COST_CATEGORIES_MODAL.map(function (catKey) {
            var m = COST_CATEGORY_META[catKey];
            return { key: catKey, icon: m.icon, label: m.label[lk] };
          })}
          selected={selected}
          onSelect={handleSelect}
          mobileLayout="top"
          width={220}
        />

        {/* RIGHT — Config panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{ padding: isMobile ? "var(--sp-4)" : "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
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
          <div className="custom-scroll" style={{ flex: 1, padding: isMobile ? "var(--sp-4)" : 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
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

            {/* Variable revenue fields */}
            {meta.isVariableRevenue ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-3)" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                      {t.field_pct_of_revenue || (lk === "fr" ? "% du revenu" : "% of revenue")}
                    </label>
                    <NumberField value={pctOfRevenue} onChange={setPctOfRevenue} min={0} max={1} step={0.001} width="100%" pct />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                      {t.field_per_transaction || (lk === "fr" ? "€ par transaction" : "€ per transaction")}
                    </label>
                    <CurrencyInput value={perTransaction} onChange={setPerTransaction} suffix={lk === "fr" ? "€/tx" : "€/tx"} width="100%" />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                    {t.field_variable_basis || (lk === "fr" ? "Base de calcul" : "Calculation base")}
                  </label>
                  <SelectDropdown
                    value={variableBasis}
                    onChange={setVariableBasis}
                    options={[
                      { value: "revenue", label: lk === "fr" ? "Revenu total HT" : "Total net revenue" },
                      { value: "gmv", label: lk === "fr" ? "GMV (volume de transactions TTC)" : "GMV (gross transaction value)" },
                    ]}
                  />
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-1)", lineHeight: 1.3 }}>
                    {variableBasis === "gmv"
                      ? (lk === "fr" ? "Appliqué au GMV (flux commission en mode GMV)." : "Applied to GMV (commission streams in GMV mode).")
                      : (lk === "fr" ? "Appliqué au revenu total annuel." : "Applied to total annual revenue.")}
                  </div>
                </div>
              </>
            ) : null}

            {/* Tiered clients fields */}
            {meta.isTiered ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_tiers || (lk === "fr" ? "Paliers par nombre de clients actifs" : "Tiers by active client count")}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {tiers.map(function (tier, i) {
                    var isLast = i === tiers.length - 1;
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "var(--sp-2)", alignItems: "center" }}>
                        <NumberField
                          value={isLast ? null : (tier.upTo || 0)}
                          onChange={function (v) {
                            setTiers(function (prev) {
                              var copy = prev.slice();
                              copy[i] = Object.assign({}, copy[i], { upTo: v });
                              return copy;
                            });
                          }}
                          min={0} step={10} width="100%"
                          disabled={isLast}
                          placeholder={isLast ? (lk === "fr" ? "∞" : "∞") : (lk === "fr" ? "Jusqu'à X clients" : "Up to X clients")}
                        />
                        <CurrencyInput
                          value={tier.annualCost || 0}
                          onChange={function (v) {
                            setTiers(function (prev) {
                              var copy = prev.slice();
                              copy[i] = Object.assign({}, copy[i], { annualCost: v });
                              return copy;
                            });
                          }}
                          suffix={lk === "fr" ? "€/an" : "€/yr"}
                          width="100%"
                        />
                        <ActionBtn
                          icon={<Trash size={14} />}
                          title={t.remove_tier || (lk === "fr" ? "Retirer" : "Remove")}
                          variant="danger"
                          disabled={tiers.length <= 1}
                          onClick={function () {
                            setTiers(function (prev) {
                              if (prev.length <= 1) return prev;
                              return prev.filter(function (_, idx) { return idx !== i; });
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                  <Button color="tertiary" size="sm" iconLeading={<Plus size={12} weight="bold" />} onClick={function () {
                    setTiers(function (prev) {
                      var copy = prev.slice();
                      var lastIdx = copy.length - 1;
                      var prevUpTo = lastIdx >= 1 ? (copy[lastIdx - 1].upTo || 0) : 0;
                      copy.splice(lastIdx, 0, { upTo: Math.max(prevUpTo + 100, 1), annualCost: 0 });
                      return copy;
                    });
                  }}>
                    {t.add_tier || (lk === "fr" ? "Ajouter un palier" : "Add a tier")}
                  </Button>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-2)", lineHeight: 1.3 }}>
                  {lk === "fr"
                    ? "Le dernier palier (∞) s'applique au-delà de la dernière borne. Clients actifs moyens : " + Math.round((costCtx && costCtx.avgActiveClients) || 0) + "."
                    : "The last tier (∞) applies beyond the previous bound. Current avg active clients: " + Math.round((costCtx && costCtx.avgActiveClients) || 0) + "."}
                </div>
              </div>
            ) : null}

            {/* Hardware per clients fields */}
            {meta.isHardwarePerClients ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "var(--sp-3)" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                      {t.field_unit_cost || (lk === "fr" ? "Coût unitaire" : "Unit cost")}
                    </label>
                    <CurrencyInput value={unitCost} onChange={setUnitCost} suffix={lk === "fr" ? "€/module" : "€/unit"} width="100%" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                      {t.field_clients_per_unit || (lk === "fr" ? "Clients par module" : "Clients per unit")}
                    </label>
                    <NumberField value={clientsPerUnit} onChange={setClientsPerUnit} min={1} step={1} width="100%" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                      {t.field_amort_years || (lk === "fr" ? "Amort. (années)" : "Amort. (years)")}
                    </label>
                    <NumberField value={amortYears} onChange={setAmortYears} min={1} step={1} width="100%" />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-1)", lineHeight: 1.3 }}>
                  {lk === "fr"
                    ? "Clients actifs moyens : " + Math.round((costCtx && costCtx.avgActiveClients) || 0) + " → " + Math.ceil(((costCtx && costCtx.avgActiveClients) || 0) / Math.max(1, clientsPerUnit)) + " module(s) déployé(s)."
                    : "Avg active clients: " + Math.round((costCtx && costCtx.avgActiveClients) || 0) + " → " + Math.ceil(((costCtx && costCtx.avgActiveClients) || 0) / Math.max(1, clientsPerUnit)) + " unit(s) deployed."}
                </div>
              </>
            ) : null}

            {/* Amount + Frequency (legacy kinds) */}
            {!meta.isVariableRevenue && !meta.isTiered && !meta.isHardwarePerClients ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-3)" }}>
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
            ) : null}

            {/* Per-user multiplier */}
            {!meta.isVariableRevenue && !meta.isTiered && !meta.isHardwarePerClients ? (
            <div>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "var(--sp-3)" }}>
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
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, paddingLeft: isMobile ? 0 : 2 }}>
                  {(t.modal_per_user_hint || "Amount will be multiplied by") + " " + (units || 1) + " " + ((units || 1) > 1 ? (t.users_label || "users") : (t.user_label || "user"))}
                </div>
              ) : null}
            </div>
            ) : null}

            {/* TVA rate — visible only in accounting mode */}
            {meta.tvaRate !== null && showPcmn ? (
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

            {/* Growth rate */}
            {freq !== "once" && !meta.isVariableRevenue && !meta.isTiered && !meta.isHardwarePerClients ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {lk === "fr" ? "Croissance annuelle" : "Annual growth"}
                </label>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "var(--sp-3)" }}>
                  <NumberField value={linkedStream ? (linkedStreamRate != null ? linkedStreamRate : 0) : growthRate} onChange={setGrowthRate} min={-0.50} max={2} step={0.05} width={isMobile ? "100%" : "80px"} pct disabled={!!linkedStream} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-1)", lineHeight: 1.3 }}>
                  {linkedStream
                    ? (lk === "fr" ? "Taux hérité du flux de revenus lié." : "Rate inherited from the linked revenue stream.")
                    : (lk === "fr" ? "Taux d'évolution annuel de cette charge. Par défaut, reprend l'inflation globale." : "Annual change rate for this cost. Defaults to global inflation.")}
                </div>
              </div>
            ) : null}

            {/* Linked stream */}
            {freq !== "once" && streamOptions.length > 1 && !meta.isVariableRevenue && !meta.isTiered && !meta.isHardwarePerClients ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {lk === "fr" ? "Lié au flux" : "Linked to stream"}
                </label>
                <SelectDropdown
                  value={linkedStream}
                  onChange={function (v) { setLinkedStream(v || ""); }}
                  options={streamOptions}
                />
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-1)", lineHeight: 1.3 }}>
                  {lk === "fr" ? "Si lié, cette charge évolue au même rythme que le flux de revenus sélectionné." : "If linked, this cost evolves at the same rate as the selected revenue stream."}
                </div>
              </div>
            ) : null}

            {/* Estimation */}
            {(amount > 0 || meta.isVariableRevenue || meta.isTiered || meta.isHardwarePerClients) ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "baseline", gap: isMobile ? "var(--sp-2)" : "var(--sp-3)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.modal_estimate || "Estimate"}</span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: isMobile ? "var(--sp-2)" : 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(monthly)}{t.per_month_suffix || "/m"}</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: isMobile ? 0 : "var(--sp-2)" }}>{eur(annual)}{t.per_year_suffix || "/an"}</span>
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
export default function OperatingCostsPage({ costs, setCosts, cfg, totalRevenue, costCtx, debts, assets, sals, crowdfunding, stocks, streams, setTab, onNavigate, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate }) {
  var { lang } = useLang();
  var t = useT().opex || {};
  var [showCreate, setShowCreate] = useState(null); /* null = closed, string = default category key */
  var [pendingLabel, setPendingLabel] = useState("");

  useEffect(function () {
    if (pendingAdd && pendingAdd.label) {
      setPendingLabel(pendingAdd.label);
      setShowCreate("other");
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAdd]);

  useEffect(function () {
    if (!pendingEdit) return;
    var found = false;
    for (var ci = 0; ci < (costs || []).length && !found; ci++) {
      for (var ii = 0; ii < (costs[ci].items || []).length && !found; ii++) {
        if (String(costs[ci].items[ii].id) === String(pendingEdit.itemId)) {
          setEditingCost({ ci: ci, ii: ii, item: costs[ci].items[ii] });
          if (onClearPendingEdit) onClearPendingEdit();
          found = true;
        }
      }
    }
  }, [pendingEdit]);

  useEffect(function () {
    if (!pendingDuplicate) return;
    var found = false;
    for (var ci = 0; ci < (costs || []).length && !found; ci++) {
      for (var ii = 0; ii < (costs[ci].items || []).length && !found; ii++) {
        if (String(costs[ci].items[ii].id) === String(pendingDuplicate.itemId)) {
          var srcCi = ci;
          var srcIi = ii;
          var clone = Object.assign({}, costs[ci].items[ii], { id: makeId(), l: costs[ci].items[ii].l + (t.copy_suffix || " (copy)") });
          setCosts(function (prev) {
            var nc = JSON.parse(JSON.stringify(prev));
            nc[srcCi].items.splice(srcIi + 1, 0, clone);
            return nc;
          });
          setEditingCost({ ci: srcCi, ii: srcIi + 1, item: clone });
          if (onClearPendingDuplicate) onClearPendingDuplicate();
          found = true;
        }
      }
    }
  }, [pendingDuplicate]);

  var lockCtx = useLock();
  var costLock = useEditLock(lockCtx, "cost");
  var [editingCost, setEditingCost] = useState(null);
  var [filter, setFilter] = useState("all");
  var [search, setSearch] = useState("");
  var [activeTab, setActiveTab] = useState("all");
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var { devMode } = useDevMode();
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
        _readOnly: true, _linkedPage: "debt",
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
          _cat: t.salaries_cat_label || "Équipe",
        });
      });
    });
    return items;
  }, [sals, t]);

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
        _cat: t.crowdfunding_cat_label || "Crowdfunding",
      });
    });
    return items;
  }, [crowdfunding]);

  /* synthetic read-only items from stocks (purchases 6000) */
  var stockPurchaseItems = useMemo(function () {
    if (!stocks || !stocks.length) return [];
    var STOCK_LABELS = { merchandise: t.stock_merchandise || "Marchandises", raw: t.stock_raw || "Matières premières", supplies: t.stock_supplies || "Fournitures", finished: t.stock_finished || "Produits finis", wip: t.stock_wip || "En-cours" };
    var STOCK_PCMN = { merchandise: "6040", raw: "6000", supplies: "6010", finished: "6000", wip: "6000" };
    return stocks.filter(function (s) {
      return (s.unitCost || 0) > 0 && (s.monthlySales || 0) > 0;
    }).map(function (s, i) {
      var monthlyCost = (s.unitCost || 0) * (s.monthlySales || 0);
      var cat = s.category || "merchandise";
      return {
        id: "_stock_" + i,
        l: (STOCK_LABELS[cat] || STOCK_LABELS.merchandise) + " — " + (s.name || ""),
        a: Math.round(monthlyCost * 100) / 100,
        freq: "monthly",
        pu: false, u: 1,
        pcmn: STOCK_PCMN[cat] || "6000",
        type: "exploitation",
        _readOnly: true,
        _linkedPage: "stocks",
        _ci: -1, _ii: -1,
        _cat: t.purchases_cat_label || "Achats",
      };
    });
  }, [stocks, t]);

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
      items = depreciationItems.concat(benefitItems).concat(stockPurchaseItems).concat(items);
    }
    if (activeTab === "non_recurring" || activeTab === "all") {
      items = crowdfundingItems.concat(items);
    }
    return items;
  }, [flatItems, activeTab, debtInterestItems, depreciationItems, benefitItems, stockPurchaseItems, crowdfundingItems]);

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
      monthly += costMonthly(item, costCtx);
      annual += costAnnual(item, costCtx);
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
    filteredItems.forEach(function (item) { annual += costAnnual(item, costCtx); });
    return { annual: annual };
  }, [filteredItems]);

  /* tab counts */
  var tabCounts = useMemo(function () {
    var counts = { all: flatItems.length + debtInterestItems.length + depreciationItems.length + benefitItems.length + crowdfundingItems.length + stockPurchaseItems.length, exploitation: depreciationItems.length + benefitItems.length + stockPurchaseItems.length, non_recurring: crowdfundingItems.length, financial: debtInterestItems.length };
    flatItems.forEach(function (item) { counts[item.type || "exploitation"]++; });
    return counts;
  }, [flatItems, debtInterestItems.length, depreciationItems.length]);

  /* category distribution for donut (includes auto items) */
  var categoryDistribution = useMemo(function () {
    var dist = {};
    flatItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) {
        var catKey = "other";
        if (item.kind === "variable_revenue") catKey = "variable_revenue";
        else if (item.kind === "tiered_clients") catKey = "tiered_clients";
        else if (item.kind === "hardware_per_clients") catKey = "hardware_per_clients";
        else {
          COST_CATEGORIES.forEach(function (ck) {
            var m = COST_CATEGORY_META[ck];
            if (m.isVariableRevenue || m.isTiered || m.isHardwarePerClients) return;
            if (m.pcmn === item.pcmn) catKey = ck;
            m.suggestions.forEach(function (s) { if (s.pcmn === item.pcmn) catKey = ck; });
          });
        }
        dist[catKey] = (dist[catKey] || 0) + ann;
      }
    });
    depreciationItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) dist["depreciation"] = (dist["depreciation"] || 0) + ann;
    });
    debtInterestItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) dist["financial_auto"] = (dist["financial_auto"] || 0) + ann;
    });
    benefitItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
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
      var ann = costAnnual(item, costCtx);
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
      var ann = costAnnual(item, costCtx);
      if (ann <= 0) return;
      if (item.freq === "once") { variable += ann; } else { fixed += ann; }
    });
    depreciationItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) fixed += ann;
    });
    debtInterestItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) fixed += ann;
    });
    benefitItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) fixed += ann;
    });
    crowdfundingItems.forEach(function (item) {
      var ann = costAnnual(item, costCtx);
      if (ann > 0) variable += ann;
    });
    return { fixed: fixed, variable: variable, total: fixed + variable };
  }, [flatItems, depreciationItems, debtInterestItems, benefitItems, crowdfundingItems]);

  function addCost(newItem) {
    setCosts(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      if (nc.length === 0) nc.push({ cat: t.cat_costs || "Charges", items: [] });
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

  function bulkDeleteItems(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setCosts(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc.forEach(function (cat) {
        cat.items = cat.items.filter(function (item) { return !idSet[item.id]; });
      });
      return nc.filter(function (cat) { return cat.items.length > 0; });
    });
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
      if (meta.isVariableRevenue || meta.isTiered || meta.isHardwarePerClients) return;
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
    setCosts([{ cat: t.cat_costs || "Charges", items: items }]);
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
          var row = info.row.original;
          var found = null;
          if (row.kind === "variable_revenue") found = COST_CATEGORY_META.variable_revenue;
          else if (row.kind === "tiered_clients") found = COST_CATEGORY_META.tiered_clients;
          else if (row.kind === "hardware_per_clients") found = COST_CATEGORY_META.hardware_per_clients;
          else {
            var pcmnVal = row.pcmn;
            COST_CATEGORIES.forEach(function (catKey) {
              var m = COST_CATEGORY_META[catKey];
              if (m.isVariableRevenue || m.isTiered || m.isHardwarePerClients) return;
              if (m.pcmn === pcmnVal) found = m;
              m.suggestions.forEach(function (s) { if (s.pcmn === pcmnVal) found = m; });
            });
          }
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
          if (row.kind === "variable_revenue") {
            var parts = [];
            if (row.pctOfRevenue) parts.push((row.pctOfRevenue * 100).toFixed(2).replace(".", ",") + "%");
            if (row.perTransaction) parts.push(row.perTransaction.toFixed(2).replace(".", ",") + "€/tx");
            return parts.length ? parts.join(" + ") : "—";
          }
          if (row.kind === "tiered_clients") {
            var tcount = (row.tiers || []).length;
            var n = (costCtx && costCtx.avgActiveClients) || 0;
            var activeIdx = 0;
            for (var i = 0; i < (row.tiers || []).length; i++) {
              var up = row.tiers[i].upTo;
              if (up == null || n <= up) { activeIdx = i; break; }
              activeIdx = i;
            }
            return (lk === "fr" ? "Palier " : "Tier ") + (activeIdx + 1) + "/" + tcount;
          }
          if (row.kind === "hardware_per_clients") {
            var uc = row.unitCost || 0;
            var cpu = row.clientsPerUnit || 1;
            return uc.toFixed(0) + "€ / " + cpu + " " + (lk === "fr" ? "clients" : "clients");
          }
          var v = row.a || 0;
          var suffix = FREQ_LABELS[row.freq] ? FREQ_LABELS[row.freq][lk] : FREQ_LABELS.monthly[lk];
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
        accessorFn: function (row) { return costAnnual(row, costCtx);},
        header: t.col_annual || "Annual",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{eur(tabTotals.annual)}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{t.per_year_suffix || "/an"}</span>
            </>
          );
        },
      },
      {
        id: "growthRate",
        accessorFn: function (row) { return row.growthRate || 0; },
        header: lk === "fr" ? "Croissance" : "Growth",
        enableSorting: true,
        meta: { align: "right", minWidth: 90 },
        cell: function (info) {
          var row = info.row.original;
          if (row.freq === "once" || row._readOnly || row.kind === "variable_revenue" || row.kind === "tiered_clients" || row.kind === "hardware_per_clients") return <span style={{ color: "var(--text-faint)" }}>—</span>;
          var val = info.getValue();
          var label = pct(val);
          if (row.linkedStream) {
            label = label + " *";
          }
          return label;
        },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          if (row._readOnly) {
            var linkedPage = row._linkedPage || (row.pcmn === "6500" ? "debt" : "equipment");
            var LINKED_LABELS = { debt: t.financing_btn || "Financement", salaries: t.salaries_btn || "Équipe", crowdfunding: t.crowdfunding_btn || "Crowdfunding", equipment: t.equipment_btn || "Équipements", stocks: t.stocks_btn || "Stocks" };
            var linkedLabel = LINKED_LABELS[linkedPage] || LINKED_LABELS.equipment;
            return (
              <button
                type="button"
                onClick={function () { if (onNavigate) onNavigate(linkedPage); else setTab(linkedPage); }}
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
          var rowLocked = costLock.check(row.id);
          if (rowLocked) return <LockIndicator name={rowLocked.displayName} />;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Edit"} onClick={function () {
                var res = costLock.open(row.id, function () { setEditingCost({ ci: row._ci, ii: row._ii, item: row }); });
              }} />
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
          <DevOptionsButton onRandomize={randomizeCosts} onClear={function () { setCosts([]); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredItems} columns={columns} filename="charges" title={t.page_title || (lang === "fr" ? "Charges d'exploitation" : "Operating Costs")} subtitle={t.page_subtitle || (lang === "fr" ? "Gérez les dépenses de votre activité." : "Manage your business expenses.")} getPcmn={function (row) { return row.pcmn || "6160"; }} />
        {activeTab === "financial" ? (
          <Button color="secondary" size="lg" onClick={function () { if (onNavigate) onNavigate("debt"); else setTab("debt"); }} iconLeading={<ArrowRight size={14} weight="bold" />}>
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
        <ExportButtons cfg={cfg} data={filteredItems} columns={columns} filename="charges" title={t.page_title || (lang === "fr" ? "Charges d'exploitation" : "Operating Costs")} subtitle={t.page_subtitle || (lang === "fr" ? "Gérez les dépenses de votre activité." : "Manage your business expenses.")} getPcmn={function (row) { return row.pcmn || "6160"; }} />
      <Button color="primary" size="md" onClick={function () { setShowCreate(activeTab === "non_recurring" ? "equipment" : activeTab === "financial" ? "other" : "premises"); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {t.add_source || "Add a cost"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.page_title || "Costs"}
      subtitle={t.page_subtitle || "Manage your business expenses."}
      icon={Receipt} iconColor="#EF4444"
    >
      {showCreate ? <CostModal onAdd={addCost} onClose={function () { setShowCreate(null); setPendingLabel(""); }} lang={lang} showPcmn={cfg && cfg.showPcmn} defaultCategory={typeof showCreate === "string" ? showCreate : undefined} initialLabel={pendingLabel} cfg={cfg} streams={streams} costCtx={costCtx} /> : null}

      {editingCost ? <CostModal
        initialData={editingCost.item}
        onSave={function (data) { saveItem(editingCost.ci, editingCost.ii, data); }}
        showPcmn={cfg && cfg.showPcmn}
        onClose={function () { costLock.close(function () { setEditingCost(null); }); }}
        lang={lang}
        cfg={cfg}
        streams={streams}
        costCtx={costCtx}
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
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_monthly_costs || "Monthly costs"} value={eurShort(totals.monthly)} fullValue={eur(totals.monthly)} glossaryKey="total_costs" />
        <KpiCard label={t.kpi_annual_costs || "Annual costs"} value={eurShort(totals.annual)} fullValue={eur(totals.annual)} glossaryKey="total_costs" />
        <KpiCard label={t.kpi_active_items || "Active items"} value={String(totals.count)} />
        <KpiCard
          label={t.kpi_cost_ratio || "Cost/revenue ratio"} glossaryKey="cost_coverage"
          value={costRatio !== null ? costRatio + " %" : "—"}
        />
      </div>

      {/* ── Insights ── */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Donut: répartition par catégorie */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Distribution by category"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ChartLegend palette={chartPalette} distribution={categoryDistribution} meta={COST_CATEGORY_META} total={totals.annual} lk={lk}>
            <DonutChart data={categoryDistribution} palette={chartPalette} />
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
                  {eur(topCost.annual)}{t.per_year_suffix || "/an"} <span style={{ margin: "0 6px", color: "var(--text-muted)" }} aria-hidden="true">•</span> <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{topCost.pct}%</span> {t.of_total_prefix || "des "}<FinanceLink term="total_costs" label={t.finance_link_total_costs || "charges totales"} desc={t.glossary_total_costs} />
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
        dimRow={function (row) { return !row.a && !row.kind; }}
        getRowId={function (row) { return row.id || (row._ci + "-" + row._ii); }}
        selectable
        onDeleteSelected={bulkDeleteItems}
        isRowSelectable={function (row) { return !row._readOnly; }}

      />
    </PageLayout>
  );
}
