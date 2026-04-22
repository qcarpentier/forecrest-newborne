import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash, Star,
  ShoppingCart, Users, Briefcase, Clock, Sparkle,
  ArrowsClockwise, TrendUp,
  PencilSimple, Copy, Timer, Percent, CurrencyCircleDollar, ArrowRight,
  HandCoins,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, FinanceLink, SearchInput, FilterDropdown, SelectDropdown, ActionBtn, PaletteToggle, ChartLegend, ExportButtons, DevOptionsButton, DonutChart, ModalSideNav, Modal, ModalFooter, CurrencyInput, NumberField, LockIndicator } from "../../components";
import { eur, eurShort, pct, makeId, projectMarketplace, projectHardwareSales } from "../../utils";
import { calcStreamMonthly, calcStreamAnnual, calcTotalMonthlyBreakdown, getDriverLabel, getPriceLabel, REVENUE_BEHAVIORS, calcAffiliationProgramMonthly } from "../../utils/revenueCalc";
import { useT, useLang, useDevMode } from "../../context";
import { useLock } from "../../context/LockContext";
import useEditLock from "../../hooks/useEditLock";
import useBreakpoint from "../../hooks/useBreakpoint";
import { REVENUE_BEHAVIOR_TEMPLATES, SEASONALITY_PROFILES, SEASONALITY_DEFAULT } from "../../constants/defaults";

/* Badge colors follow revenue nature:
 * brand (coral) = recurring/predictable
 * info (blue)   = volume/usage-based
 * warning (amber) = time-based
 * success (green) = passive
 * gray = one-off
 */
var BEHAVIOR_META = {
  recurring: {
    icon: ArrowsClockwise, badge: "brand",
    label: { fr: "Récurrent", en: "Recurring" },
    desc: { fr: "Revenu mensuel prévisible : abonnement, retainer, maintenance.", en: "Predictable monthly revenue: subscription, retainer, maintenance." },
    tvaRate: 0.21,
  },
  per_transaction: {
    icon: ShoppingCart, badge: "info",
    label: { fr: "Par transaction", en: "Per transaction" },
    desc: { fr: "Montant gagné à chaque vente ou commande.", en: "Amount earned per sale or order." },
    tvaRate: 0.21,
  },
  per_user: {
    icon: Users, badge: "info",
    label: { fr: "Par utilisateur", en: "Per user" },
    desc: { fr: "Tarif par siège, compte ou utilisateur actif.", en: "Price per seat, account or active user." },
    tvaRate: 0.21,
  },
  project: {
    icon: Briefcase, badge: "warning",
    label: { fr: "Par projet", en: "Per project" },
    desc: { fr: "Facturation au forfait par mission ou contrat.", en: "Fixed-price billing per mission or contract." },
    tvaRate: 0.21,
  },
  daily_rate: {
    icon: Clock, badge: "warning",
    label: { fr: "Taux journalier", en: "Daily rate" },
    desc: { fr: "Facturation à la journée de travail.", en: "Billing per working day." },
    tvaRate: 0.21,
  },
  hourly: {
    icon: Timer, badge: "warning",
    label: { fr: "Par heure", en: "Hourly" },
    desc: { fr: "Facturation au temps passé.", en: "Billing based on time spent." },
    tvaRate: 0.21,
  },
  commission: {
    icon: Percent, badge: "info",
    label: { fr: "Commission", en: "Commission" },
    desc: { fr: "Courtage, apport d'affaires ou frais de marketplace.", en: "Brokerage, referral or marketplace fee." },
    tvaRate: 0.21,
  },
  royalty: {
    icon: CurrencyCircleDollar, badge: "success",
    label: { fr: "Redevance", en: "Royalty" },
    desc: { fr: "Revenu passif par utilisation d'un actif : brevet, contenu, template.", en: "Passive income from asset usage: patent, content, template." },
    tvaRate: 0.21,
  },
  one_time: {
    icon: Sparkle, badge: "gray",
    label: { fr: "Ponctuel", en: "One-time" },
    desc: { fr: "Montant unique : frais d'installation, vente exceptionnelle.", en: "One-off amount: setup fee, exceptional sale." },
    tvaRate: 0.21,
  },
  subsidy: {
    icon: HandCoins, badge: "success",
    label: { fr: "Subside", en: "Subsidy" },
    desc: { fr: "Aide publique, subvention d'exploitation, prime à l'emploi.", en: "Public aid, operating grant, employment premium." },
    tvaRate: 0,
    pcmn: "7300",
  },
};

var PRIMARY_BEHAVIOR = {
  saas: "recurring", ecommerce: "per_transaction", retail: "per_transaction",
  services: "project", freelancer: "daily_rate", other: "recurring",
};

var BEHAVIORS = Object.keys(BEHAVIOR_META).filter(function (k) { return k !== "subsidy"; });

var SEASON_KEYS = Object.keys(SEASONALITY_PROFILES);

/* Revenue nature classification for tabs */
var REVENUE_NATURE = {
  recurring: "recurring", per_user: "recurring", royalty: "recurring",
  per_transaction: "variable", commission: "variable", project: "variable",
  daily_rate: "variable", hourly: "variable",
  one_time: "one_time",
};
var REVENUE_TABS = ["all", "recurring", "variable", "one_time"];

function getRevenueNature(behavior) {
  return REVENUE_NATURE[behavior] || "variable";
}

var EMPTY_HINTS = {
  saas: { fr: "Commencez par un abonnement mensuel ou une licence pour modéliser votre revenu récurrent.", en: "Start with a monthly subscription or license to model your recurring revenue." },
  ecommerce: { fr: "Ajoutez vos ventes de produits et commissions pour estimer votre panier moyen.", en: "Add your product sales and commissions to estimate your average order." },
  retail: { fr: "Définissez vos ventes en magasin et en ligne pour projeter votre chiffre d'affaires.", en: "Define your in-store and online sales to project your revenue." },
  services: { fr: "Ajoutez vos missions consulting et retainers pour estimer votre pipe annuel.", en: "Add your consulting missions and retainers to estimate your annual pipeline." },
  freelancer: { fr: "Définissez votre taux journalier et vos projets au forfait pour estimer vos revenus.", en: "Set your daily rate and fixed-price projects to estimate your income." },
  other: { fr: "Ajoutez votre première source de revenu pour alimenter vos projections financières.", en: "Add your first revenue source to feed your financial projections." },
};

/* ── Mini sparkline for seasonality preview ── */
function SeasonSpark({ coefs, width, height, color }) {
  var w = width || 120;
  var h = height || 28;
  var max = Math.max.apply(null, coefs);
  var min = Math.min.apply(null, coefs);
  var range = max - min || 1;
  var pad = 2;
  var points = coefs.map(function (c, i) {
    var x = pad + (i / 11) * (w - pad * 2);
    var y = h - pad - ((c - min) / range) * (h - pad * 2);
    return x + "," + y;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }} role="img" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color || "var(--brand)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Required label helper ── */
function RequiredLabel({ text, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
      {text} <span style={{ color: "var(--color-error)" }}>*</span>
    </label>
  );
}

/* ── Split-panel Creation / Edit Modal ── */
function StreamModal({ onAdd, onSave, onClose, businessType, lang, initialData, defaultBehavior, showTva, initialLabel, cfg }) {
  var rt = useT().revenue || {};
  var bp = useBreakpoint();
  var isMobile = bp.isMobile;
  var lk = lang === "en" ? "en" : "fr";
  var isEdit = !!initialData;
  var primary = PRIMARY_BEHAVIOR[businessType] || "recurring";
  var [selected, setSelected] = useState(isEdit ? initialData.behavior : (defaultBehavior || primary));
  var [name, setName] = useState(isEdit ? initialData.l : (initialLabel || ""));
  var [price, setPrice] = useState(isEdit ? (initialData.price || 0) : 0);
  var [qty, setQty] = useState(isEdit ? (initialData.qty || 0) : 0);
  var defaultSeason = SEASONALITY_DEFAULT[businessType] || "flat";
  var [seasonProfile, setSeasonProfile] = useState(isEdit ? (initialData.seasonProfile || defaultSeason) : defaultSeason);
  var [tva, setTva] = useState(isEdit && initialData.tva !== undefined ? initialData.tva : null);
  var [growthRate, setGrowthRate] = useState(isEdit ? (initialData.growthRate || 0) : ((cfg && cfg.revenueGrowthRate) || 0.10));

  var suggestions = (REVENUE_BEHAVIOR_TEMPLATES[businessType] || REVENUE_BEHAVIOR_TEMPLATES.other || []).filter(function (tpl) {
    return tpl.behavior === selected;
  });

  function handleSelect(b) {
    setSelected(b);
    if (!isEdit) {
      setName("");
      setPrice(0);
      setQty(0);
      setSeasonProfile(defaultSeason);
    }
  }

  function handleSuggestion(tpl) {
    setName(tpl.l);
    setPrice(tpl.price);
  }

  function handleSubmit() {
    var data = {
      id: isEdit ? initialData.id : makeId("r"),
      l: name || BEHAVIOR_META[selected].label[lang === "en" ? "en" : "fr"],
      behavior: selected,
      price: price,
      qty: qty,
      seasonProfile: seasonProfile,
      growthRate: growthRate,
      tva: tva,
    };
    if (isEdit && onSave) {
      onSave(data);
    } else if (onAdd) {
      onAdd(data);
    }
    onClose();
  }

  var meta = BEHAVIOR_META[selected];
  var Icon = meta.icon;
  var monthly = calcStreamMonthly({ behavior: selected, price: price, qty: qty });
  var annual = calcStreamAnnual({ behavior: selected, price: price, qty: qty });
  var canSubmit = name.trim().length > 0 && price > 0 && qty > 0;

  return (
    <Modal open onClose={onClose} size="lg" height={540} hideClose mobileMode="dialog">
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT - Behavior list */}
        <ModalSideNav
          title={rt.modal_type_title || "Revenue type"}
          items={BEHAVIORS.map(function (b) {
            var m = BEHAVIOR_META[b];
            var isPrimary = b === primary;
            return {
              key: b,
              icon: m.icon,
              label: isPrimary ? (
                <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flex: 1 }}>
                  <span style={{ flex: 1 }}>{m.label[lang === "en" ? "en" : "fr"]}</span>
                  <Star size={11} weight="fill" color="var(--brand)" style={{ opacity: 0.5, flexShrink: 0 }} />
                </span>
              ) : m.label[lang === "en" ? "en" : "fr"],
            };
          })}
          selected={selected}
          onSelect={handleSelect}
          mobileLayout="top"
          width={220}
        />

        {/* RIGHT - Config panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{ padding: isMobile ? "var(--sp-4)" : "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                {meta.label[lang === "en" ? "en" : "fr"]}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>
                {meta.desc[lang === "en" ? "en" : "fr"]}
              </div>
            </div>
          </div>

          {/* Body — scrollable */}
          <div className="custom-scroll" style={{ flex: 1, padding: isMobile ? "var(--sp-4)" : 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            <div>
              <RequiredLabel text={rt.modal_source_name || "Source name"} htmlFor="stream-name" />
              <input id="stream-name" value={name} onChange={function (e) { setName(e.target.value); }}
                placeholder={meta.label[lang === "en" ? "en" : "fr"]}
                autoFocus
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            {suggestions.length > 0 ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {rt.modal_suggestions || "Suggestions"}
                </label>
                <SelectDropdown
                  value={name}
                  onChange={function (v) {
                    if (!v) { setName(""); setPrice(0); return; }
                    var found = null;
                    suggestions.forEach(function (s) { if (s.l === v) found = s; });
                    if (found) handleSuggestion(found);
                  }}
                  options={suggestions.map(function (tpl) {
                    return { value: tpl.l, label: tpl.l };
                  })}
                  placeholder={rt.modal_suggestions || "Suggestions..."}
                  clearable
                />
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <RequiredLabel text={rt.modal_unit_price || "Unit price"} htmlFor="stream-price" />
                <CurrencyInput value={price} onChange={function (v) { setPrice(v); }} suffix={getPriceLabel(selected, lang)} width="100%" />
              </div>
              <div>
                <RequiredLabel text={getDriverLabel(selected, lang)} htmlFor="stream-qty" />
                <input id="stream-qty" type="number" value={qty || ""} min={0}
                  onChange={function (e) { setQty(Number(e.target.value) || 0); }}
                  placeholder="0"
                  style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "right" }}
                />
              </div>
            </div>

            {/* Seasonality selector */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                {rt.season_label || "Seasonality"}
              </label>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "var(--sp-3)" }}>
                <div style={{ flex: 1 }}>
                  <SelectDropdown
                    value={seasonProfile}
                    onChange={setSeasonProfile}
                    options={SEASON_KEYS.map(function (key) { return { value: key, label: rt["season_" + key] || key }; })}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: isMobile ? "flex-start" : "center" }}>
                  <SeasonSpark coefs={SEASONALITY_PROFILES[seasonProfile].coefs} width={100} height={28} />
                </div>
              </div>
            </div>

            {/* Annual growth rate */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                {lk === "fr" ? "Croissance annuelle" : "Annual growth"}
              </label>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "var(--sp-3)" }}>
                <NumberField value={growthRate} onChange={setGrowthRate} min={-0.50} max={2} step={0.05} width={isMobile ? "100%" : "80px"} pct />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-1)", lineHeight: 1.3 }}>
                {lk === "fr" ? "Taux de croissance spécifique à ce flux. Par défaut, reprend le taux global." : "Growth rate specific to this stream. Defaults to the global rate."}
              </div>
            </div>

            {/* TVA rate — visible only in accounting mode */}
            {showTva ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                  {rt.field_tva || "Taux de TVA"}
                </label>
                <SelectDropdown
                  value={tva !== null ? String(tva) : String(meta.tvaRate)}
                  onChange={function (v) { setTva(parseFloat(v)); }}
                  options={[
                    { value: "0", label: "0% — " + (rt.tva_exempt || "Exempté") },
                    { value: "0.06", label: "6% — " + (rt.tva_reduced || "Réduit") },
                    { value: "0.12", label: "12% — " + (rt.tva_intermediate || "Intermédiaire") },
                    { value: "0.21", label: "21% — " + (rt.tva_standard || "Standard") },
                  ]}
                />
              </div>
            ) : null}

            {price > 0 && qty > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "baseline", gap: isMobile ? "var(--sp-2)" : "var(--sp-3)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{rt.modal_estimate || "Estimate"}</span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: isMobile ? "var(--sp-2)" : 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(monthly)}{rt.per_month || "/m"}</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: isMobile ? 0 : "var(--sp-2)" }}>{eur(annual)}{rt.per_year || "/an"}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>
              {rt.modal_close || "Close"}
            </Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (rt.modal_save || "Save") : (rt.modal_add || "Add")}
            </Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Monthly bar chart (12 bars) with tooltip ── */
function MonthlyBarChart({ data, lang }) {
  var [hovIdx, setHovIdx] = useState(null);
  var max = Math.max.apply(null, data);
  var isEmpty = max <= 0;
  var months = lang === "en"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

  /* skeleton heights for empty state */
  var skeletonH = [18, 24, 20, 30, 28, 36, 40, 34, 26, 22, 32, 38];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, width: "100%", height: 76, position: "relative" }}>
      {(isEmpty ? skeletonH : data).map(function (v, i) {
        var h = isEmpty ? v : Math.max(2, (v / max) * 52);
        var isHov = hovIdx === i && !isEmpty;
        return (
          <div key={i}
            onMouseEnter={isEmpty ? undefined : function () { setHovIdx(i); }}
            onMouseLeave={isEmpty ? undefined : function () { setHovIdx(null); }}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              cursor: isEmpty ? "default" : "pointer", position: "relative",
            }}
          >
            {isHov ? (
              <div style={{
                position: "absolute", bottom: h + 16,
                left: 0, right: 0,
                display: "flex", justifyContent: "center",
                pointerEvents: "none", zIndex: 2,
              }}>
                <span style={{
                  padding: "3px 8px", borderRadius: "var(--r-sm)",
                  background: "var(--text-primary)", color: "var(--bg-card)",
                  fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {eur(data[i])}
                </span>
              </div>
            ) : null}
            <div style={{
              width: "100%", height: h, borderRadius: "8px 8px 0 0",
              background: isEmpty ? "var(--bg-hover)" : "var(--brand)",
              opacity: isEmpty ? 0.6 : (hovIdx !== null ? (isHov ? 1 : 0.3) : 0.7 + (v / max) * 0.3),
              transition: "height 0.3s, opacity 0.15s",
            }} />
            <span style={{ fontSize: 9, color: isEmpty ? "var(--text-muted)" : "var(--text-secondary)", lineHeight: 1 }}>{months[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Marketplace 3-year projection table (acquisition ramp + churn) ── */
function MarketplaceProjectionTable({ cfg, lang }) {
  var lk = lang === "en" ? "en" : "fr";
  var plan = cfg.marketplaceAcquisitionPlan || [];
  var evPlan = cfg.evSalesPlan || [];
  if (!plan.length && !evPlan.length) return null;

  var result = plan.length ? projectMarketplace({
    acquisitionPlan: plan,
    churnMonthly: cfg.churnMonthly || 0.02,
    visitsPerMonth: cfg.marketplaceVisitsPerMonth || 5.72,
    priceTTC: cfg.marketplacePriceTTC || 5.41,
    commissionPct: cfg.marketplaceCommissionPct || 0.2034,
    vatRate: cfg.vat || 0.21,
    stripePct: cfg.marketplaceStripePct || 0.014,
    stripeFixed: cfg.marketplaceStripeFixed || 0.25,
    marketingMonthly: cfg.marketplaceMarketingMonthly || 667,
    infraTiers: cfg.marketplaceInfraTiers || [],
    hardwareUnitCost: cfg.marketplaceHardwareUnitCost || 60,
    hardwareClientsPerUnit: cfg.marketplaceHardwareClientsPerUnit || 3,
    amortAnnual: cfg.marketplaceAmortAnnual || 1400,
  }) : null;

  var evResult = evPlan.length ? projectHardwareSales({
    salesPlan: evPlan,
    pricePerUnit: cfg.evPricePerUnit || 0,
    priceGrowthRate: cfg.evPriceGrowthRate || 0,
    costPct: cfg.evCostPct || 0,
    costPerUnit: cfg.evCostPerUnit,
    installPct: cfg.evInstallPct || 0,
    installPerUnit: cfg.evInstallPerUnit,
    marketingMonthly: cfg.evMarketingMonthly || 0,
    commercialMonthly: cfg.evCommercialMonthly || 0,
  }) : null;

  var yearsCount = Math.max(result ? result.years.length : 0, evResult ? evResult.years.length : 0);
  var yearsRange = [];
  for (var yi = 0; yi < yearsCount; yi++) yearsRange.push(yi + 1);

  function fmt(v, f) {
    if (f === "int") return Math.round(v).toLocaleString(lk === "fr" ? "fr-BE" : "en-US");
    return eur(v);
  }

  var cellStyle = { padding: "10px 12px", fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" };
  var headStyle = { padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, textAlign: "right" };
  var sectionHeadStyle = { padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--bg-accordion)" };
  var combinedHeadStyle = Object.assign({}, sectionHeadStyle, { color: "var(--brand)", borderTop: "2px solid var(--brand)" });

  function renderRow(row, data, total) {
    var color = "var(--text-primary)";
    if (row.positive) color = "var(--color-success)";
    if (row.negative) color = "var(--color-error)";
    return (
      <tr key={row.key + "_" + (row.section || "")} style={{ borderBottom: "1px solid var(--border-light)" }}>
        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: row.bold ? 700 : 500, color: "var(--text-primary)" }}>{row.label[lk]}</td>
        {yearsRange.map(function (yNum) {
          var y = data[yNum - 1];
          var v = y ? (y[row.key] || 0) : 0;
          var cellColor = color;
          if (row.signed) cellColor = v >= 0 ? "var(--color-success)" : "var(--color-error)";
          return <td key={yNum} style={Object.assign({}, cellStyle, { color: cellColor, fontWeight: row.bold ? 700 : 400 })}>{fmt(v, row.format)}</td>;
        })}
        {(function () {
          if (row.noTotal) return <td style={Object.assign({}, cellStyle, { color: "var(--text-faint)" })}>—</td>;
          var tot = total ? (total[row.key] || 0) : 0;
          var cellColor = color;
          if (row.signed) cellColor = tot >= 0 ? "var(--color-success)" : "var(--color-error)";
          return <td style={Object.assign({}, cellStyle, { color: cellColor, fontWeight: 700 })}>{fmt(tot, row.format)}</td>;
        })()}
      </tr>
    );
  }

  var mpRows = [
    { label: { fr: "Clients actifs (fin)", en: "Active clients (end)" }, key: "activeClientsEnd", format: "int", bold: false, noTotal: true },
    { label: { fr: "Transactions", en: "Transactions" }, key: "transactions", format: "int", bold: false },
    { label: { fr: "GMV TTC", en: "GMV incl. VAT" }, key: "gmvTTC", format: "eur", positive: true },
    { label: { fr: "Commission HT (parking)", en: "Commission excl. VAT (parking)" }, key: "commissionHT", format: "eur", positive: true },
    { label: { fr: "Coûts parking", en: "Parking costs" }, key: "totalCosts", format: "eur", negative: true },
    { label: { fr: "EBITDA parking", en: "Parking EBITDA" }, key: "ebit", format: "eur", signed: true, bold: true },
  ];

  var evRows = [
    { label: { fr: "Bornes vendues", en: "Units sold" }, key: "units", format: "int", bold: false },
    { label: { fr: "CA HT bornes EV", en: "EV hardware revenue" }, key: "caHT", format: "eur", positive: true },
    { label: { fr: "Coût bornes (achat)", en: "Hardware cost" }, key: "unitCost", format: "eur", negative: true },
    { label: { fr: "Pose installateur", en: "Installation cost" }, key: "installCost", format: "eur", negative: true },
    { label: { fr: "Marketing EV", en: "EV marketing" }, key: "marketing", format: "eur", negative: true },
    { label: { fr: "Commercial EV", en: "EV sales team" }, key: "commercial", format: "eur", negative: true },
    { label: { fr: "EBITDA bornes EV", en: "EV EBITDA" }, key: "ebitda", format: "eur", signed: true, bold: true },
  ];

  // Combined rows (CA HT combined = mp.commissionHT + ev.caHT ; EBITDA combined = mp.ebit + ev.ebitda)
  var combinedYears = yearsRange.map(function (yNum) {
    var my = result ? result.years[yNum - 1] : null;
    var ey = evResult ? evResult.years[yNum - 1] : null;
    return {
      caHT: (my ? my.commissionHT : 0) + (ey ? ey.caHT : 0),
      ebitdaCombined: (my ? my.ebit : 0) + (ey ? ey.ebitda : 0),
    };
  });
  var combinedTotal = combinedYears.reduce(function (acc, y) {
    acc.caHT += y.caHT;
    acc.ebitdaCombined += y.ebitdaCombined;
    return acc;
  }, { caHT: 0, ebitdaCombined: 0 });

  var combinedRows = [
    { label: { fr: "CA HT combiné", en: "Combined revenue HT" }, key: "caHT", format: "eur", positive: true, bold: true },
    { label: { fr: "EBITDA combiné", en: "Combined EBITDA" }, key: "ebitdaCombined", format: "eur", signed: true, bold: true },
  ];

  var hasTwoPillars = !!(result && evResult);
  var title = hasTwoPillars
    ? (lk === "fr" ? "P&L annuel — vue combinée" : "Annual P&L — combined view")
    : (lk === "fr" ? "P&L annuel" : "Annual P&L");
  var subtitle = hasTwoPillars
    ? (lk === "fr" ? "Pilier 1 (parking Mons) + Pilier 2 (vente bornes EV) sur " + yearsCount + " ans" : "Pillar 1 (Mons parking) + Pillar 2 (EV hardware sales) over " + yearsCount + " years")
    : (lk === "fr" ? "Synthèse sur " + yearsCount + " ans — commission HT, coûts et EBITDA" : "Synthesis over " + yearsCount + " years — commission, costs and EBITDA");

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)", overflowX: "auto" }}>
      <div style={{ marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
            <th style={Object.assign({}, headStyle, { textAlign: "left" })}>{lk === "fr" ? "Indicateur" : "Indicator"}</th>
            {yearsRange.map(function (y) { return <th key={y} style={headStyle}>{(lk === "fr" ? "Année " : "Year ") + y}</th>; })}
            <th style={headStyle}>{lk === "fr" ? "Total " + yearsCount + " ans" : yearsCount + "-yr total"}</th>
          </tr>
        </thead>
        <tbody>
          {result ? (
            <>
              <tr><td colSpan={yearsCount + 2} style={sectionHeadStyle}>{lk === "fr" ? "Pilier 1 — Parking Mons" : "Pillar 1 — Parking Mons"}</td></tr>
              {mpRows.map(function (r) { return renderRow(Object.assign({ section: "mp" }, r), result.years, result.total); })}
            </>
          ) : null}
          {evResult ? (
            <>
              <tr><td colSpan={yearsCount + 2} style={sectionHeadStyle}>{lk === "fr" ? "Pilier 2 — Bornes EV" : "Pillar 2 — EV hardware"}</td></tr>
              {evRows.map(function (r) { return renderRow(Object.assign({ section: "ev" }, r), evResult.years, evResult.total); })}
            </>
          ) : null}
          {hasTwoPillars ? (
            <>
              <tr><td colSpan={yearsCount + 2} style={combinedHeadStyle}>{lk === "fr" ? "Total combiné" : "Combined total"}</td></tr>
              {combinedRows.map(function (r) { return renderRow(Object.assign({ section: "comb" }, r), combinedYears, combinedTotal); })}
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

/* ── Marketplace segments insight card ── */
function MarketplaceSegmentsCard({ cfg, lang }) {
  var lk = lang === "en" ? "en" : "fr";
  var segments = cfg.marketplaceSegments || [];
  var durationSegs = cfg.marketplaceDurationSegments || [];
  var marketSize = cfg.marketplaceMarketSize || 0;
  var penetration = cfg.marketplacePenetrationPct || 0;
  var activeClients = Math.round(marketSize * penetration);

  var totalShare = 0;
  var weightedVisits = 0;
  segments.forEach(function (s) {
    totalShare += (s.sharePct || 0);
    weightedVisits += (s.sharePct || 0) * (s.visitsPerMonth || 0);
  });
  var avgVisits = totalShare > 0 ? weightedVisits / totalShare : 0;

  var weightedPrice = 0;
  var totalDurShare = 0;
  durationSegs.forEach(function (d) {
    totalDurShare += (d.sharePct || 0);
    weightedPrice += (d.sharePct || 0) * (d.priceTTC || 0);
  });
  var avgPriceTTC = totalDurShare > 0 ? weightedPrice / totalDurShare : 0;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)", flexWrap: "wrap", gap: "var(--sp-2)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {lk === "fr" ? "Segments clients (marketplace)" : "Customer segments (marketplace)"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
          {lk === "fr" ? "Marché : " : "Market: "}{marketSize.toLocaleString("fr-BE")}{lk === "fr" ? " véhicules — pénétration " : " vehicles — penetration "}{(penetration * 100).toFixed(penetration < 0.1 ? 1 : 0)}{"% → "}{activeClients}{lk === "fr" ? " clients actifs" : " active clients"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
        {segments.map(function (s) {
          return (
            <div key={s.id} style={{ padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{lk === "fr" ? s.labelFr : s.labelEn}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{(s.sharePct * 100).toFixed(2).replace(".", ",")}%</div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{s.visitsPerMonth}{lk === "fr" ? " visites/mois" : " visits/mo"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", fontSize: 12, color: "var(--text-muted)", paddingTop: "var(--sp-2)", borderTop: "1px solid var(--border-light)" }}>
        <span>{lk === "fr" ? "Total pondéré : " : "Weighted total: "}<strong style={{ color: "var(--text-primary)" }}>{(totalShare * 100).toFixed(2).replace(".", ",")}%</strong></span>
        <span>{lk === "fr" ? "Fréquence moyenne : " : "Avg frequency: "}<strong style={{ color: "var(--text-primary)" }}>{avgVisits.toFixed(2).replace(".", ",")}</strong>{lk === "fr" ? " visites/mois/client" : " visits/mo/client"}</span>
        <span>{lk === "fr" ? "Prix moyen : " : "Avg price: "}<strong style={{ color: "var(--text-primary)" }}>{avgPriceTTC.toFixed(2).replace(".", ",")} € TTC</strong></span>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function RevenueStreamsPage({ cfg, streams, setStreams, annC, businessType, debts, affiliation, setTab, showPcmn, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate, effectiveTotalRevenue, effectiveViewYear, marketplaceProj }) {
  var { lang } = useLang();
  var t = useT().revenue || {};
  var lockCtx = useLock();
  var streamLock = useEditLock(lockCtx, "stream");
  var [showCreate, setShowCreate] = useState(null);
  var [pendingLabel, setPendingLabel] = useState("");
  var [editingStream, setEditingStream] = useState(null);
  var [lockError, setLockError] = useState(null);
  var [activeTab, setActiveTab] = useState("all");
  var [filter, setFilter] = useState("all");
  var [search, setSearch] = useState("");
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var { devMode } = useDevMode();

  useEffect(function () {
    if (pendingAdd && pendingAdd.label) {
      setPendingLabel(pendingAdd.label);
      setShowCreate(true);
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAdd]);

  useEffect(function () {
    if (!pendingEdit) return;
    var found = false;
    for (var ci = 0; ci < (streams || []).length && !found; ci++) {
      for (var ii = 0; ii < (streams[ci].items || []).length && !found; ii++) {
        if (String(streams[ci].items[ii].id) === String(pendingEdit.itemId)) {
          setEditingStream({ ci: ci, ii: ii, item: streams[ci].items[ii] });
          if (onClearPendingEdit) onClearPendingEdit();
          found = true;
        }
      }
    }
  }, [pendingEdit]);

  useEffect(function () {
    if (!pendingDuplicate) return;
    var found = false;
    for (var ci = 0; ci < (streams || []).length && !found; ci++) {
      for (var ii = 0; ii < (streams[ci].items || []).length && !found; ii++) {
        if (String(streams[ci].items[ii].id) === String(pendingDuplicate.itemId)) {
          var srcCi = ci;
          var srcIi = ii;
          var clone = Object.assign({}, streams[ci].items[ii], { id: makeId(), l: streams[ci].items[ii].l + " (copie)" });
          setStreams(function (prev) {
            var nc = JSON.parse(JSON.stringify(prev));
            nc[srcCi].items.splice(srcIi + 1, 0, clone);
            return nc;
          });
          setEditingStream({ ci: srcCi, ii: srcIi + 1, item: clone });
          if (onClearPendingDuplicate) onClearPendingDuplicate();
          found = true;
        }
      }
    }
  }, [pendingDuplicate]);

  /* Auto-generated subsidy items from DebtPage (class 73) */
  var subsidyItems = useMemo(function () {
    var items = [];
    (debts || []).forEach(function (d) {
      if (d.type === "subsidy" && d.amount > 0) {
        items.push({
          l: d.name || t.auto_subsidy || "Subside",
          behavior: "subsidy",
          price: d.amount,
          qty: 1,
          tva: 0,
          _readOnly: true,
          _linkedPage: "debt",
          _linkedLabel: t.auto_subsidy_link || "Financement",
        });
      }
    });
    return items;
  }, [debts, t]);

  /* Auto-generated affiliation revenue items (PCMN 7020) */
  var affiliationItems = useMemo(function () {
    if (!affiliation || !affiliation.enabled || !affiliation.programs) return [];
    return affiliation.programs.filter(function (p) {
      return (p.volume || 0) > 0;
    }).map(function (p) {
      var monthlyRevenue = calcAffiliationProgramMonthly(p);
      return {
        l: p.name || "Affiliation",
        behavior: "commission",
        price: p.volume > 0 ? Math.round((monthlyRevenue / p.volume) * 100) / 100 : 0,
        qty: p.volume || 0,
        tva: p.tva != null ? p.tva : null,
        _readOnly: true,
        _linkedPage: "affiliation",
        _linkedLabel: t.auto_affiliation_link || "Affiliation",
      };
    });
  }, [affiliation, t]);

  /* flatten streams for table */
  var flatItems = useMemo(function () {
    var items = [];
    (streams || []).forEach(function (cat, ci) {
      (cat.items || []).forEach(function (item, ii) {
        items.push(Object.assign({}, item, { _ci: ci, _ii: ii }));
      });
    });
    return subsidyItems.concat(affiliationItems).concat(items);
  }, [streams, subsidyItems, affiliationItems]);

  /* filtered items — by tab, then by type filter, then by search */
  var filteredItems = useMemo(function () {
    var items = flatItems;
    if (activeTab !== "all") {
      items = items.filter(function (item) { return getRevenueNature(item.behavior) === activeTab; });
    }
    if (filter !== "all") {
      items = items.filter(function (item) { return item.behavior === filter; });
    }
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      items = items.filter(function (item) { return (item.l || "").toLowerCase().indexOf(q) !== -1; });
    }
    return items;
  }, [flatItems, activeTab, filter, search]);

  /* tab counts */
  var tabCounts = useMemo(function () {
    var counts = { all: flatItems.length, recurring: 0, variable: 0, one_time: 0 };
    flatItems.forEach(function (item) {
      var nature = getRevenueNature(item.behavior);
      counts[nature] = (counts[nature] || 0) + 1;
    });
    return counts;
  }, [flatItems]);

  /* behavior counts for filter pills */
  var behaviorCounts = useMemo(function () {
    var counts = {};
    flatItems.forEach(function (item) {
      counts[item.behavior] = (counts[item.behavior] || 0) + 1;
    });
    return counts;
  }, [flatItems]);

  /* totals (streams steady-state — used when no projection override) */
  var totalsStandard = useMemo(function () {
    var mrr = 0, arr = 0, count = 0;
    flatItems.forEach(function (item) {
      mrr += calcStreamMonthly(item);
      arr += calcStreamAnnual(item);
      if ((item.price || 0) > 0 && (item.qty || 0) > 0) count++;
    });
    return { mrr: mrr, arr: arr, count: count };
  }, [flatItems]);

  /* totals (combined marketplace + EV when a year is selected) */
  var totals = useMemo(function () {
    var hasProjYear = typeof effectiveViewYear === "number" && effectiveTotalRevenue != null;
    if (!hasProjYear) return totalsStandard;
    // In projection mode the annual revenue is the combined CA of the selected year.
    var arr = effectiveTotalRevenue || 0;
    var mrr = arr / 12;
    // Active sources = parking stream (if has transactions) + EV stream (if has sales that year)
    var count = 0;
    if (cfg && cfg.marketplaceAcquisitionPlan && cfg.marketplaceAcquisitionPlan.length) count++;
    if (cfg && cfg.evSalesPlan && cfg.evSalesPlan[effectiveViewYear - 1] > 0) count++;
    return { mrr: mrr, arr: arr, count: count };
  }, [totalsStandard, effectiveTotalRevenue, effectiveViewYear, cfg]);

  /* filtered totals */
  var filteredTotals = useMemo(function () {
    var arr = 0;
    filteredItems.forEach(function (item) {
      arr += calcStreamAnnual(item);
    });
    return { arr: arr };
  }, [filteredItems]);

  /* type distribution for donut */
  var typeDistribution = useMemo(function () {
    var dist = {};
    flatItems.forEach(function (item) {
      var ann = calcStreamAnnual(item);
      if (ann > 0) {
        var b = item.behavior || "recurring";
        dist[b] = (dist[b] || 0) + ann;
      }
    });
    return dist;
  }, [flatItems]);

  /* recurring vs non-recurring split — based on REVENUE_BEHAVIORS frequency */
  var recurringSplit = useMemo(function () {
    var rec = 0, nonRec = 0;
    flatItems.forEach(function (item) {
      var ann = calcStreamAnnual(item);
      if (ann <= 0) return;
      var b = item.behavior || "recurring";
      var freq = (REVENUE_BEHAVIORS[b] || {}).frequency;
      if (freq === "monthly") {
        rec += ann;
      } else {
        nonRec += ann;
      }
    });
    return { recurring: rec, nonRecurring: nonRec, total: rec + nonRec };
  }, [flatItems]);

  /* top source */
  var topSource = useMemo(function () {
    var best = null;
    var bestAnn = 0;
    flatItems.forEach(function (item) {
      var ann = calcStreamAnnual(item);
      if (ann > bestAnn) { best = item; bestAnn = ann; }
    });
    if (!best || bestAnn <= 0) return null;
    return { name: best.l, annual: bestAnn, pct: totals.arr > 0 ? Math.round(bestAnn / totals.arr * 100) : 0, behavior: best.behavior };
  }, [flatItems, totals.arr]);

  /* monthly breakdown with seasonality */
  var monthlyBreakdown = useMemo(function () {
    return calcTotalMonthlyBreakdown([{ items: flatItems }], SEASONALITY_PROFILES);
  }, [flatItems]);

  function addStream(newItem) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      if (nc.length === 0) nc.push({ cat: t.cat_revenue || "Revenus", items: [] });
      nc[0].items.push(newItem);
      return nc;
    });
  }

  function removeItem(ci, ii) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items.splice(ii, 1);
      if (nc[ci].items.length === 0) nc.splice(ci, 1);
      return nc;
    });
  }

  function bulkDeleteItems(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc.forEach(function (cat) {
        cat.items = cat.items.filter(function (item) { return !idSet[item.id]; });
      });
      return nc.filter(function (cat) { return cat.items.length > 0; });
    });
  }

  function requestDelete(ci, ii) {
    if (skipDeleteConfirm) {
      removeItem(ci, ii);
    } else {
      setPendingDelete({ ci: ci, ii: ii });
    }
  }

  function cloneItem(ci, ii) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      var original = nc[ci].items[ii];
      var clone = Object.assign({}, original, { id: makeId(), l: original.l + (t.copy_suffix || " (copy)") });
      nc[ci].items.splice(ii + 1, 0, clone);
      return nc;
    });
  }

  function saveItem(ci, ii, data) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items[ii] = Object.assign({}, nc[ci].items[ii], data);
      return nc;
    });
  }

  function randomizeSources() {
    var tpls = REVENUE_BEHAVIOR_TEMPLATES[businessType] || REVENUE_BEHAVIOR_TEMPLATES.other || [];
    var defSeason = SEASONALITY_DEFAULT[businessType] || "flat";
    var sKeys = Object.keys(SEASONALITY_PROFILES);
    var items = [];
    /* pick up to 10 items, shuffle templates and give random realistic values */
    var shuffled = tpls.slice().sort(function () { return Math.random() - 0.5; });
    var count = Math.min(shuffled.length, 8 + Math.floor(Math.random() * 3));
    for (var i = 0; i < count; i++) {
      var tpl = shuffled[i];
      var basePrice = tpl.price || 50;
      var randPrice = Math.round(basePrice * (0.5 + Math.random() * 1.5));
      var randQty = Math.max(1, Math.round(Math.random() * 200));
      var randSeason = Math.random() > 0.5 ? defSeason : sKeys[Math.floor(Math.random() * sKeys.length)];
      items.push({
        id: makeId(),
        l: tpl.l,
        behavior: tpl.behavior,
        price: randPrice,
        qty: randQty,
        seasonProfile: randSeason,
        growthRate: 0,
      });
    }
    setStreams([{ cat: t.cat_revenue || "Revenus", items: items }]);
  }

  var lk = lang === "en" ? "en" : "fr";

  /* ── column definitions ── */
  var columns = useMemo(function () {
    return [
      {
        id: "name",
        accessorKey: "l",
        header: t.col_source || "Source",
        enableSorting: true,
        meta: { align: "left", minWidth: 200, grow: true },
        cell: function (info) {
          return info.getValue() || (
            <span style={{ color: "var(--text-ghost)" }}>{t.modal_unnamed || "Unnamed"}</span>
          );
        },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>
                {filter === "all" ? (t.footer_total || "Total") : (BEHAVIOR_META[filter] || {}).label ? BEHAVIOR_META[filter].label[lk] : filter}
              </span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>
                {filteredItems.length} {filteredItems.length === 1 ? (t.footer_source_singular || "source") : (t.footer_source_plural || "sources")}
              </span>
            </>
          );
        },
      },
      {
        id: "behavior",
        accessorKey: "behavior",
        header: t.col_type || "Type",
        enableSorting: true,
        meta: { align: "left" },
        cell: function (info) {
          var m = BEHAVIOR_META[info.getValue()] || BEHAVIOR_META.recurring;
          return <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge>;
        },
      },
      {
        id: "price",
        accessorKey: "price",
        header: t.col_unit_price || "Unit price",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) {
          var row = info.row.original;
          var v = row.price || 0;
          var formatted = v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
          return formatted + " " + getPriceLabel(row.behavior, lang);
        },
      },
      {
        id: "qty",
        accessorKey: "qty",
        header: t.col_volume || "Volume",
        enableSorting: true,
        meta: { align: "right", minWidth: 120 },
        cell: function (info) {
          var row = info.row.original;
          return (row.qty || 0) + " " + getDriverLabel(row.behavior, lang);
        },
      },
      {
        id: "seasonality",
        accessorFn: function (row) { return row.seasonProfile || "flat"; },
        header: t.col_seasonality || "Seasonality",
        enableSorting: true,
        meta: { align: "center", minWidth: 110 },
        cell: function (info) {
          var row = info.row.original;
          var profile = SEASONALITY_PROFILES[row.seasonProfile || "flat"] || SEASONALITY_PROFILES.flat;
          return <SeasonSpark coefs={profile.coefs} width={80} height={24} />;
        },
      },
      {
        id: "growthRate",
        accessorFn: function (row) { return row.growthRate || 0; },
        header: lk === "fr" ? "Croissance" : "Growth",
        enableSorting: true,
        meta: { align: "right", minWidth: 90 },
        cell: function (info) { return pct(info.getValue()); },
      },
      {
        id: "annual",
        accessorFn: function (row) { return calcStreamAnnual(row); },
        header: t.col_annual || "Annual",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{eur(filteredTotals.arr)}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{t.footer_per_year || "/an"}</span>
            </>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          if (row._readOnly) {
            var linkedPage = row._linkedPage || "debt";
            var linkedLabel = row._linkedLabel || linkedPage;
            return (
              <button type="button" onClick={function () { if (setTab) setTab(linkedPage); }}
                title={t.auto_tooltip || "Géré automatiquement."}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--brand)", fontStyle: "italic", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 6px", borderRadius: "var(--r-sm)", transition: "background 0.12s" }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "none"; }}
              >
                <ArrowRight size={10} weight="bold" />
                {linkedLabel}
              </button>
            );
          }
          var rowLocked = streamLock.check(row.id);
          if (rowLocked) {
            return <LockIndicator name={rowLocked.displayName} />;
          }
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn
                icon={<PencilSimple size={14} />}
                title={t.action_edit || "Edit"}
                onClick={function () {
                  var res = streamLock.open(row.id, function () {
                    setEditingStream({ ci: row._ci, ii: row._ii, item: row });
                  });
                  if (res && !res.success) {
                    setLockError(res.lockedBy);
                    setTimeout(function () { setLockError(null); }, 3000);
                  }
                }}
              />
              <ActionBtn
                icon={<Copy size={14} />}
                title={t.action_clone || "Clone"}
                onClick={function () { cloneItem(row._ci, row._ii); }}
              />
              <ActionBtn
                icon={<Trash size={14} />}
                title={t.action_delete || "Delete"}
                variant="danger"
                onClick={function () { requestDelete(row._ci, row._ii); }}
              />
            </div>
          );
        },
      },
    ];
  }, [lang, lk, filteredTotals, filteredItems.length, t]);

  /* ── dropdown options ── */
  var filterOptions = useMemo(function () {
    var opts = [{ value: "all", label: t.filter_all || "Toutes les catégories" }];
    BEHAVIORS.forEach(function (b) {
      if (behaviorCounts[b] > 0) {
        opts.push({ value: b, label: BEHAVIOR_META[b].label[lk] });
      }
    });
    return opts;
  }, [behaviorCounts, lang, lk]);

  /* ── toolbar ── */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.search_placeholder || "Search..."}
        />
        <FilterDropdown
          value={filter}
          onChange={setFilter}
          options={filterOptions}
        />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomizeSources} onClear={function () { setStreams([]); }} />
        ) : null}
        <ExportButtons data={filteredItems} columns={columns} filename="revenus" title={t.title || (lang === "fr" ? "Sources de revenus" : "Revenue Sources")} subtitle={t.subtitle || (lang === "fr" ? "Définissez comment votre entreprise gagne de l'argent." : "Define how your business makes money.")} getPcmn={function (row) { var m = BEHAVIOR_META[row.behavior]; return m && m.pcmn ? m.pcmn : "7000"; }} />
        <Button color="primary" size="lg" onClick={function () { var defBehavior = activeTab === "recurring" ? "recurring" : activeTab === "variable" ? "per_transaction" : activeTab === "one_time" ? "one_time" : null; setShowCreate(defBehavior || true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add_label || "Add"}
        </Button>
      </div>
    </>
  );

  /* ── empty state — contextualised per business type ── */
  var hint = EMPTY_HINTS[businessType] || EMPTY_HINTS.other;

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "var(--r-lg)",
        background: "var(--bg-accordion)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <TrendUp size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
        {t.no_sources || "No revenue sources"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {hint[lk]}
      </div>
      <Button color="primary" size="md" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>

        {t.add_source || "Add a source"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.title || (lang === "fr" ? "Sources de revenus" : "Revenue Sources")}
      subtitle={t.subtitle || (lang === "fr" ? "Définissez comment votre entreprise gagne de l'argent." : "Define how your business makes money.")}
      icon={CurrencyCircleDollar}
      iconColor="var(--color-success)"
    >
      {showCreate ? <StreamModal onAdd={addStream} onClose={function () { setShowCreate(null); setPendingLabel(""); }} businessType={businessType || "other"} lang={lang} defaultBehavior={typeof showCreate === "string" ? showCreate : undefined} showTva={showPcmn} initialLabel={pendingLabel} cfg={cfg} /> : null}

      {editingStream ? <StreamModal
        initialData={editingStream.item}
        onSave={function (data) { saveItem(editingStream.ci, editingStream.ii, data); }}
        onClose={function () { streamLock.close(function () { setEditingStream(null); }); }}
        businessType={businessType || "other"}
        lang={lang}
        showTva={showPcmn}
        cfg={cfg}
      /> : null}

      {pendingDelete ? <ConfirmDeleteModal
        onConfirm={function () { removeItem(pendingDelete.ci, pendingDelete.ii); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm}
        setSkipNext={setSkipDeleteConfirm}
        t={t}
      /> : null}

      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_monthly || "Monthly revenue"} value={eurShort(totals.mrr)} fullValue={eur(totals.mrr)} glossaryKey="monthly_revenue" />
        <KpiCard label={t.kpi_annual || "Annual revenue"} value={eurShort(totals.arr)} fullValue={eur(totals.arr)} glossaryKey="annual_revenue" />
        <KpiCard label={t.kpi_active || "Active sources"} value={String(totals.count)} glossaryKey="active_sources" />
        <KpiCard
          label={t.kpi_coverage || "Cost coverage"} glossaryKey="cost_coverage"
          value={annC > 0 ? Math.round(totals.arr / annC * 100) + " %" : "—"}
        />
      </div>

      {cfg && cfg.marketplaceSegments && cfg.marketplaceSegments.length ? (
        <MarketplaceSegmentsCard cfg={cfg} lang={lang} />
      ) : null}

      {cfg && cfg.marketplaceAcquisitionPlan && cfg.marketplaceAcquisitionPlan.length ? (
        <MarketplaceProjectionTable cfg={cfg} lang={lang} />
      ) : null}

      {/* ── Insights section — always visible, skeleton when empty ── */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>

        {/* Donut: répartition par type */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Distribution by type"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ChartLegend palette={chartPalette} distribution={typeDistribution} meta={BEHAVIOR_META} total={totals.arr} lk={lk}>
            <DonutChart data={typeDistribution} palette={chartPalette} />
          </ChartLegend>

          {/* Recurring vs non-recurring bar */}
          <div style={{ marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>{t.recurring_label || "Recurring"} {recurringSplit.total > 0 ? Math.round(recurringSplit.recurring / recurringSplit.total * 100) + "%" : "—"}</span>
              <span>{t.variable_label || "Variable"} {recurringSplit.total > 0 ? Math.round(recurringSplit.nonRecurring / recurringSplit.total * 100) + "%" : "—"}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden", display: "flex" }}>
              {recurringSplit.total > 0 ? (
                <div style={{ width: (recurringSplit.recurring / recurringSplit.total * 100) + "%", background: "var(--brand)", borderRadius: 3, transition: "width 0.3s" }} />
              ) : null}
            </div>
          </div>
        </div>

        {/* Right column: top source + sparkline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
          {/* Top source */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: "0 0 auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.top_source || "Top source"}
            </div>
            {topSource ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{topSource.name}</span>
                  <Badge color={(BEHAVIOR_META[topSource.behavior] || {}).badge || "gray"} size="sm" dot>{(BEHAVIOR_META[topSource.behavior] || {}).label[lk]}</Badge>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {eur(topSource.annual)}/an <span style={{ margin: "0 6px", color: "var(--text-muted)" }} aria-hidden="true">•</span> <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{topSource.pct}%</span> {t.of_total_prefix || "of "}<FinanceLink term="annual_revenue" label={t.finance_link_label || "total revenue"} desc={t.glossary_annual_revenue} />
                </div>
              </>
            ) : (
              /* skeleton */
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <span style={{ width: 120, height: 14, borderRadius: 4, background: "var(--bg-hover)" }} />
                  <span style={{ width: 60, height: 20, borderRadius: 10, background: "var(--bg-hover)" }} />
                </div>
                <div style={{ width: 180, height: 10, borderRadius: 4, background: "var(--bg-hover)", marginTop: 8 }} />
              </>
            )}
          </div>

          {/* Sparkline: monthly projection */}
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.projection_title || "Monthly projection"}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <MonthlyBarChart data={monthlyBreakdown} lang={lang} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {REVENUE_TABS.map(function (tabKey) {
          var isActive = activeTab === tabKey;
          var tabLabels = {
            all: t.tab_all || "All",
            recurring: t.tab_recurring || "Recurring",
            variable: t.tab_variable || "Variable",
            one_time: t.tab_one_time || "One-time",
          };
          var count = tabCounts[tabKey] || 0;
          return (
            <button key={tabKey} type="button" onClick={function () { setActiveTab(tabKey); setFilter("all"); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 0,
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

      <DataTable
        data={filteredItems}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={240}
        pageSize={10}
        dimRow={function (row) { return !row.price || !row.qty; }}
        getRowId={function (row) { return row.id || (row._ci + "-" + row._ii); }}
        selectable
        scrollable
        onDeleteSelected={bulkDeleteItems}

        isRowSelectable={function (row) { return !row._readOnly; }}
      />

    </PageLayout>
  );
}
