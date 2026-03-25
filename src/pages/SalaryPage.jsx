import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash, Users, UsersThree, UserCircle,
  PencilSimple, Copy, Briefcase, Student, GraduationCap,
  Crown, User, UserSwitch, ArrowRight,
  Car, DeviceMobile, Laptop, WifiHigh, ForkKnife, X,
  ChartPie,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, SearchInput, FilterDropdown, SelectDropdown, ActionBtn, FinanceLink, PaletteToggle, ExportButtons, DevOptionsButton } from "../components";
import Modal, { ModalFooter } from "../components/Modal";
import CurrencyInput from "../components/CurrencyInput";
import { eur, eurShort, pct, makeId, salCalc, indepCalc } from "../utils";
import { ROLE_PRESETS } from "../constants/defaults";
import { useT, useLang, useDevMode, useNotifications } from "../context";

/* ── Employee type metadata ── */
var SAL_TYPE_META = {
  employee: {
    icon: User, badge: "gray",
    label: { fr: "Salarié(e)", en: "Employee" },
    desc: { fr: "Contrat de travail (CDI ou CDD). L'entreprise paie les cotisations ONSS patronales et le précompte.", en: "Employment contract (permanent or fixed-term). Company pays employer ONSS and withholding tax." },
    placeholder: { fr: "ex. Développeur Senior", en: "e.g. Senior Developer" },
    canBeShareholder: true, canBeEsop: true, showDuration: true,
  },
  director: {
    icon: Crown, badge: "brand",
    label: { fr: "Administrateur", en: "Director" },
    desc: { fr: "Dirigeant d'entreprise. Rémunéré via un mandat social. La rémunération doit atteindre 45.000 € pour le taux réduit d'impôt.", en: "Company director. Remunerated via social mandate. Remuneration must reach 45,000 for the reduced tax rate." },
    placeholder: { fr: "ex. Directeur général (CEO)", en: "e.g. Chief Executive Officer (CEO)" },
    canBeShareholder: true, canBeEsop: false, showDuration: false,
  },
  independant: {
    icon: Briefcase, badge: "info",
    label: { fr: "Indépendant", en: "Freelancer" },
    desc: { fr: "Facture à l'entreprise. Pas de charges patronales mais paie ses propres cotisations sociales et IPP.", en: "Invoices the company. No employer charges but pays own social contributions and income tax." },
    placeholder: { fr: "ex. Consultant UX", en: "e.g. UX Consultant" },
    canBeShareholder: false, canBeEsop: false, showDuration: false,
  },
  interim: {
    icon: UserSwitch, badge: "gray",
    label: { fr: "Intérimaire", en: "Temp worker" },
    desc: { fr: "Via agence intérim. Le coût facturé inclut un coefficient agence (~1,8 à 2,2x le brut).", en: "Via temp agency. The invoiced cost includes an agency coefficient (~1.8 to 2.2x gross)." },
    placeholder: { fr: "ex. Assistant administratif", en: "e.g. Administrative assistant" },
    canBeShareholder: false, canBeEsop: false, showDuration: false,
  },
  student: {
    icon: Student, badge: "warning",
    label: { fr: "Étudiant(e)", en: "Student" },
    desc: { fr: "Contrat étudiant. ONSS réduit à 2,71%. Maximum 600h/an.", en: "Student contract. ONSS reduced to 2.71%. Maximum 600h/year." },
    placeholder: { fr: "ex. Étudiant développement web", en: "e.g. Web development student" },
    canBeShareholder: false, canBeEsop: false, showDuration: false,
  },
  intern: {
    icon: GraduationCap, badge: "gray",
    label: { fr: "Stagiaire", en: "Intern" },
    desc: { fr: "Convention de stage. Indemnité non soumise à cotisations sociales (selon convention).", en: "Internship agreement. Compensation exempt from social contributions (depending on agreement)." },
    placeholder: { fr: "ex. Stagiaire marketing digital", en: "e.g. Digital marketing intern" },
    canBeShareholder: false, canBeEsop: false, showDuration: false,
  },
};

var SAL_TYPES = Object.keys(SAL_TYPE_META);
var SAL_TYPES_MODAL = SAL_TYPES;

/* ── Benefits / ATN metadata ── */
/* mode: "charge" = recurring cost only (class 6)
 *       "purchase" = one-time asset (class 2 → equipment page) + recurring charge
 * canPurchase: if true, user can toggle between leasing/subscription vs purchase
 * assetCategory: which equipment category to auto-create when purchased
 * assetPcmn: class 2 PCMN for the asset
 * defaultAssetAmount: default purchase price for asset creation
 */
var BENEFIT_META = {
  car: {
    icon: Car,
    label: { fr: "Voiture de société", en: "Company car" },
    chargeLabel: { fr: "Leasing + carburant + assurance", en: "Leasing + fuel + insurance" },
    purchaseChargeLabel: { fr: "Carburant + assurance + entretien", en: "Fuel + insurance + maintenance" },
    purchaseLabel: { fr: "Achat véhicule", en: "Vehicle purchase" },
    defaultAmount: 500, purchaseChargeAmount: 200, pcmn: "6150", tvaRate: 0.21,
    canPurchase: true, assetCategory: "vehicle", assetPcmn: "2400", defaultAssetAmount: 25000,
  },
  phone: {
    icon: DeviceMobile,
    label: { fr: "GSM / Téléphone", en: "Phone / Mobile" },
    chargeLabel: { fr: "Abonnement téléphonique", en: "Phone subscription" },
    purchaseChargeLabel: { fr: "Abonnement téléphonique", en: "Phone subscription" },
    purchaseLabel: { fr: "Achat téléphone", en: "Phone purchase" },
    defaultAmount: 50, purchaseChargeAmount: 30, pcmn: "6131", tvaRate: 0.21,
    canPurchase: true, assetCategory: "it", assetPcmn: "2410", defaultAssetAmount: 600,
  },
  laptop: {
    icon: Laptop,
    label: { fr: "Ordinateur", en: "Laptop" },
    chargeLabel: { fr: "Abonnement logiciels + maintenance", en: "Software subscriptions + maintenance" },
    purchaseChargeLabel: { fr: "Logiciels + maintenance", en: "Software + maintenance" },
    purchaseLabel: { fr: "Achat ordinateur", en: "Laptop purchase" },
    defaultAmount: 40, purchaseChargeAmount: 20, pcmn: "6131", tvaRate: 0.21,
    canPurchase: true, assetCategory: "it", assetPcmn: "2410", defaultAssetAmount: 1200,
  },
  wifi: {
    icon: WifiHigh,
    label: { fr: "Internet domicile", en: "Home internet" },
    chargeLabel: { fr: "Remboursement forfaitaire", en: "Flat-rate reimbursement" },
    defaultAmount: 20, pcmn: "6131", tvaRate: 0.21,
    canPurchase: false,
  },
  meal: {
    icon: ForkKnife,
    label: { fr: "Titres-repas", en: "Meal vouchers" },
    chargeLabel: { fr: "Part employeur (~6,91 € × 20 jours)", en: "Employer share (~6.91 × 20 days)" },
    defaultAmount: 138, pcmn: "6120", tvaRate: null,
    canPurchase: false,
  },
};
var BENEFIT_KEYS = Object.keys(BENEFIT_META);

/* ── Role suggestion categories ── */
var ROLE_CATS = ["founders", "tech", "business", "ops", "marketing"];
var ROLE_CAT_LABELS = {
  founders: { fr: "Fondateurs", en: "Founders" },
  tech: { fr: "Tech", en: "Tech" },
  business: { fr: "Business", en: "Business" },
  ops: { fr: "Opérations", en: "Operations" },
  marketing: { fr: "Marketing", en: "Marketing" },
};

/* ── Tab types ── */
var SAL_TAB_TYPES = ["all", "employees", "direction", "external"];

/* ── Contract duration options ── */
var DURATION_OPTIONS = [
  { value: "cdi", label: { fr: "CDI", en: "Permanent" } },
  { value: "cdd", label: { fr: "CDD", en: "Fixed-term" } },
  { value: "part_time", label: { fr: "Temps partiel", en: "Part-time" } },
];

/* ── SVG Donut ── */
function TypeDonut({ data, palette }) {
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
    var pctV = e.value / total;
    acc.push({ key: e.key, pct: pctV, start: prev, end: prev + pctV });
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

/* ── Compute employer cost for a salary ── */
function benefitsTotal(s) {
  var t = 0;
  if (s.benefits) s.benefits.forEach(function (b) { t += b.amount || 0; });
  return t;
}
function employerCost(s, cfg) {
  var base = 0;
  if (s.type === "independant" || s.type === "interim") { base = s.net; }
  else {
    var effOnss = s.type === "student" ? 0.0271 : cfg.onss;
    var effPatr = s.type === "student" ? 0 : cfg.patr;
    base = salCalc(s.net, effOnss, cfg.prec, effPatr).total;
  }
  return base + benefitsTotal(s);
}

/* ── Salary Modal ── */
function SalaryModal({ onAdd, onSave, onClose, lang, initialData, cfg, setAssets, initialLabel, esopEnabled }) {
  var t = useT().salaries || {};
  var { notify } = useNotifications();
  var isEdit = !!initialData;

  var [selected, setSelected] = useState(isEdit ? (initialData.type || "employee") : "employee");
  var [role, setRole] = useState(isEdit ? (initialData.role || "") : (initialLabel || ""));
  var [net, setNet] = useState(isEdit ? (initialData.net || 0) : 0);
  var [vari, setVari] = useState(isEdit ? !!initialData.vari : false);
  var [shareholder, setShareholder] = useState(isEdit ? !!initialData.shareholder : false);
  var [esop, setEsop] = useState(isEdit ? !!initialData.esop : false);
  var [duration, setDuration] = useState(isEdit ? (initialData.duration || "cdi") : "cdi");
  var [interimCoeff, setInterimCoeff] = useState(isEdit ? (initialData.interimCoeff || 2.0) : 2.0);
  var [benefits, setBenefits] = useState(isEdit && initialData.benefits ? initialData.benefits.slice() : []);

  var lk = lang === "en" ? "en" : "fr";
  var meta = SAL_TYPE_META[selected] || SAL_TYPE_META.employee;
  var Icon = meta.icon;

  function handleSelect(typeKey) {
    setSelected(typeKey);
    if (!isEdit) {
      setRole("");
      setNet(0);
      setVari(false);
      var m = SAL_TYPE_META[typeKey] || SAL_TYPE_META.employee;
      setShareholder(m.canBeShareholder && typeKey === "director");
      setDuration("cdi");
    }
  }

  function handleSuggestion(preset) {
    setRole(preset.role);
    if (preset.founder) {
      setSelected("director");
      setShareholder(true);
    }
  }

  function handleSubmit() {
    var data = {
      id: isEdit ? initialData.id : Date.now(),
      role: role || meta.label[lk],
      net: net,
      type: selected,
      vari: vari,
      shareholder: meta.canBeShareholder ? shareholder : false,
      esop: meta.canBeEsop ? esop : false,
      duration: meta.showDuration ? duration : undefined,
      interimCoeff: selected === "interim" ? interimCoeff : undefined,
      benefits: benefits.length > 0 ? benefits.map(function (b) {
        var bm = BENEFIT_META[b.id];
        return Object.assign({}, b, {
          label: bm ? bm.label[lk] : b.id,
          pcmn: bm ? bm.pcmn : "6130",
        });
      }) : undefined,
    };
    /* Auto-create assets for purchase-mode benefits */
    if (setAssets && benefits.length > 0) {
      benefits.forEach(function (b) {
        if (b.mode === "purchase" && b.assetAmount > 0) {
          var bm = BENEFIT_META[b.id];
          if (!bm || !bm.canPurchase) return;
          setAssets(function (prev) {
            /* Check if asset already exists for this person + benefit */
            var tag = "_sal_" + data.id + "_" + b.id;
            var exists = (prev || []).some(function (a) { return a.id === tag; });
            if (exists) {
              return (prev || []).map(function (a) {
                if (a.id === tag) return Object.assign({}, a, { amount: b.assetAmount, label: (data.role || "") + " — " + bm.label[lk] });
                return a;
              });
            }
            return (prev || []).concat([{
              id: tag,
              label: (data.role || "") + " — " + bm.label[lk],
              category: bm.assetCategory,
              pcmn: bm.assetPcmn,
              amount: b.assetAmount,
              years: bm.assetCategory === "vehicle" ? 5 : 3,
              method: "linear",
              residual: 0,
              elapsedYears: 0,
              startDate: new Date().toISOString().slice(0, 10),
            }]);
          });
        }
      });
    }
    if (isEdit && onSave) { onSave(data); } else if (onAdd) { onAdd(data); }
    /* Notify linked pages when cross-page data is created */
    if (data.esop) notify("equity", [String(data.id)]);
    if (data.shareholder) notify("captable", [String(data.id)]);
    onClose();
  }

  var canSubmit = role.trim().length > 0;
  var isIndep = selected === "independant" || selected === "interim";
  var effOnss = selected === "student" ? 0.0271 : (cfg.onss || 0.1307);
  var effPatr = selected === "student" ? 0 : (cfg.patr || 0.2507);
  var calc = !isIndep && net > 0 ? salCalc(net, effOnss, cfg.prec || 0.1723, effPatr) : null;
  var indepC = selected === "independant" && net > 0 ? indepCalc(net * 12) : null;

  /* Role suggestions for selected type */
  var suggestions = ROLE_PRESETS.filter(function (p) {
    return p.types && p.types.indexOf(selected) !== -1;
  });

  return (
    <Modal open onClose={onClose} size="lg" height={540} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* LEFT — Type list */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {t.modal_type || "Type de contrat"}
            </div>
          </div>
          <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            {SAL_TYPES_MODAL.map(function (typeKey) {
              var m = SAL_TYPE_META[typeKey];
              var TIcon = m.icon;
              var isActive = selected === typeKey;
              return (
                <button key={typeKey} onClick={function () { handleSelect(typeKey); }}
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
                  <TIcon size={16} weight={isActive ? "fill" : "regular"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
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
              <label htmlFor="sal-role" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {t.field_role_name || "Nom du rôle"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input id="sal-role" value={role} onChange={function (e) { setRole(e.target.value); }}
                autoFocus placeholder={meta.placeholder[lk]}
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            {suggestions.length > 0 ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.modal_suggestions || "Suggestions"}
                </label>
                <SelectDropdown
                  value={role}
                  onChange={function (v) {
                    if (!v) { setRole(""); return; }
                    var found = null;
                    suggestions.forEach(function (s) { if (s.role === v) found = s; });
                    if (found) handleSuggestion(found);
                    else setRole(v);
                  }}
                  options={suggestions.map(function (s) { return { value: s.role, label: s.role }; })}
                  placeholder={t.modal_suggestions || "Suggestions..."}
                  clearable
                />
              </div>
            ) : null}

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {isIndep ? (t.field_invoice || "Montant facturé mensuel") : (t.col_net || "Salaire net mensuel")} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <CurrencyInput value={net} onChange={function (v) { setNet(v); }} suffix="€" width="100%" />
            </div>

            {meta.showDuration ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                  {t.field_duration || "Durée du contrat"}
                </label>
                <SelectDropdown
                  value={duration}
                  onChange={setDuration}
                  options={DURATION_OPTIONS.map(function (d) { return { value: d.value, label: d.label[lk] }; })}
                />
              </div>
            ) : null}

            {meta.canBeShareholder ? (
              <div>
                <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={shareholder} onChange={function () { setShareholder(function (v) { return !v; }); }}
                      style={{ accentColor: "var(--brand)" }} />
                    <UsersThree size={14} weight={shareholder ? "fill" : "regular"} color={shareholder ? "var(--brand)" : "var(--text-muted)"} />
                    {t.shareholder_label || "Actionnaire (dividendes)"}
                  </label>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, marginLeft: 22 }}>
                  {t.shareholder_hint || "Synchronise vers la table de capitalisation. Distinct du mandat d'administrateur (tantièmes)."}
                </div>
              </div>
            ) : null}

            {meta.canBeEsop && esopEnabled ? (
              <div>
                <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={esop} onChange={function () { setEsop(function (v) { return !v; }); }}
                      style={{ accentColor: "var(--brand)" }} />
                    <ChartPie size={14} weight={esop ? "fill" : "regular"} color={esop ? "var(--brand)" : "var(--text-muted)"} />
                    {t.esop_label || (lang === "fr" ? "Plan d'intéressement (stock options)" : "Incentive plan (stock options)")}
                  </label>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, marginLeft: 22 }}>
                  {t.esop_hint || (lang === "fr" ? "Inclut cet employé dans le plan d'options. Synchronisé vers la page Intéressement." : "Includes this employee in the options plan. Synced to the Incentive page.")}
                </div>
              </div>
            ) : null}

            {/* Benefits / ATN (employee, director, intern — not independant/interim/student) */}
            {selected !== "independant" && selected !== "interim" && selected !== "student" ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>
                  {t.benefits_title || "Avantages en nature"}
                </label>
                {/* Active benefits as chips */}
                {benefits.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--sp-2)" }}>
                    {benefits.map(function (b, bi) {
                      var bm = BENEFIT_META[b.id];
                      if (!bm) return null;
                      var BIcon = bm.icon;
                      var isPurchase = b.mode === "purchase";
                      function updateBenefit(patch) {
                        setBenefits(function (prev) {
                          var nc = prev.slice();
                          nc[bi] = Object.assign({}, nc[bi], patch);
                          return nc;
                        });
                      }
                      return (
                        <div key={b.id} style={{
                          borderRadius: "var(--r-md)",
                          border: "1px solid var(--border)", background: "var(--bg-accordion)",
                          overflow: "hidden",
                        }}>
                          {/* Header row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "6px var(--sp-3)" }}>
                            <BIcon size={14} weight="duotone" color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{bm.label[lk]}</span>
                            <button type="button" onClick={function () {
                              setBenefits(function (prev) { return prev.filter(function (_, j) { return j !== bi; }); });
                            }} style={{ border: "none", background: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                              <X size={12} color="var(--text-faint)" />
                            </button>
                          </div>
                          {/* Mode toggle for purchasable benefits */}
                          {bm.canPurchase ? (
                            <div style={{ display: "flex", gap: 0, padding: "0 var(--sp-3)", marginBottom: 6 }}>
                              {[{ k: "lease", l: t.mode_lease || "Location / Abonnement" }, { k: "purchase", l: t.mode_purchase || "Achat" }].map(function (m) {
                                var active = (b.mode || "lease") === m.k;
                                return (
                                  <button key={m.k} type="button" onClick={function () {
                                    var patch = { mode: m.k };
                                    if (m.k === "purchase") {
                                      patch.assetAmount = b.assetAmount || bm.defaultAssetAmount;
                                      patch.amount = bm.purchaseChargeAmount || bm.defaultAmount;
                                    } else {
                                      patch.assetAmount = undefined;
                                      patch.amount = bm.defaultAmount;
                                    }
                                    updateBenefit(patch);
                                  }}
                                    style={{
                                      flex: 1, height: 36, padding: "0 8px", fontSize: 12, fontWeight: active ? 600 : 400,
                                      border: "1px solid " + (active ? "var(--brand-border)" : "var(--border)"),
                                      background: active ? "var(--brand-bg)" : "transparent",
                                      color: active ? "var(--brand)" : "var(--text-muted)",
                                      cursor: "pointer", fontFamily: "inherit",
                                      borderRadius: m.k === "lease" ? "var(--r-sm) 0 0 var(--r-sm)" : "0 var(--r-sm) var(--r-sm) 0",
                                      marginLeft: m.k === "purchase" ? -1 : 0,
                                    }}
                                  >{m.l}</button>
                                );
                              })}
                            </div>
                          ) : null}
                          {/* Charge row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "0 var(--sp-3) 6px" }}>
                            <span style={{ fontSize: 11, color: "var(--text-faint)", flex: 1 }}>{isPurchase && bm.purchaseChargeLabel ? bm.purchaseChargeLabel[lk] : (bm.chargeLabel ? bm.chargeLabel[lk] : "")}</span>
                            <CurrencyInput value={b.amount} onChange={function (v) { updateBenefit({ amount: v }); }} suffix="€" width="90px" height={28} />
                            <span style={{ fontSize: 10, color: "var(--text-faint)", flexShrink: 0 }}>/mois</span>
                          </div>
                          {/* Purchase row (asset amount) */}
                          {isPurchase ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "0 var(--sp-3) 6px", borderTop: "1px solid var(--border-light)", paddingTop: 6 }}>
                              <span style={{ fontSize: 11, color: "var(--text-faint)", flex: 1 }}>{bm.purchaseLabel ? bm.purchaseLabel[lk] : ""}</span>
                              <CurrencyInput value={b.assetAmount || bm.defaultAssetAmount} onChange={function (v) { updateBenefit({ assetAmount: v }); }} suffix="€" width="90px" height={28} />
                              <span style={{ fontSize: 10, color: "var(--color-info)", flexShrink: 0 }}>{t.benefit_asset_hint || "→ Équipements"}</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {/* Add benefit dropdown */}
                {(function () {
                  var activeIds = {};
                  benefits.forEach(function (b) { activeIds[b.id] = true; });
                  var available = BENEFIT_KEYS.filter(function (k) { return !activeIds[k]; });
                  if (available.length === 0) return null;
                  return (
                    <SelectDropdown
                      value=""
                      onChange={function (v) {
                        if (!v) return;
                        var bm = BENEFIT_META[v];
                        if (bm) {
                          var defAmt = bm.defaultAmount;
                          if (v === "meal") defAmt = Math.round((cfg.mealVoucherEmployer || 6.91) * 20 * 100) / 100;
                          setBenefits(function (prev) { return prev.concat([{ id: v, amount: defAmt, mode: "lease" }]); });
                        }
                      }}
                      options={available.map(function (k) {
                        var bm = BENEFIT_META[k];
                        return { value: k, label: bm.label[lk] + " (~" + eur(bm.defaultAmount) + "/mois)" };
                      })}
                      placeholder={t.benefit_add || "Ajouter un avantage..."}
                      clearable
                    />
                  );
                })()}
              </div>
            ) : null}

            {/* Live breakdown */}
            {calc && net > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.brut || "Brut"}</span>
                  <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{eur(calc.brutO)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}><FinanceLink term="onss">ONSS</FinanceLink> ({pct(effOnss)})</span>
                  <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(calc.onssV)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}><FinanceLink term="onss">{t.col_patr || "Patronal"}</FinanceLink> ({pct(effPatr)})</span>
                  <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(calc.patrV)}</span>
                </div>
                {benefits.length > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{t.benefit_total_label || "Avantages"} ({benefits.length})</span>
                    <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(benefitsTotal({ benefits: benefits }))}</span>
                  </div>
                ) : null}
                <div style={{ height: 1, background: "var(--border-light)", margin: "2px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.col_total || "Total employeur"}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(calc.total + benefitsTotal({ benefits: benefits }))}/mois</span>
                </div>
              </div>
            ) : null}

            {indepC && net > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.indep_social || "Cotisations sociales (~20,5%)"}</span>
                  <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(indepC.socialContrib / 12)}/mois</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}><FinanceLink term="ipp">{t.indep_tax || "Impôt estimé (IPP)"}</FinanceLink></span>
                  <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(indepC.taxEstimate / 12)}/mois</span>
                </div>
                <div style={{ height: 1, background: "var(--border-light)", margin: "2px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.indep_net_after || "Net après impôt"}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(indepC.netMonthly)}/mois</span>
                </div>
              </div>
            ) : null}

            {/* Interim coefficient */}
            {selected === "interim" ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                    {t.interim_coeff || "Coefficient agence"} <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>×{interimCoeff.toFixed(1)}</span>
                  </label>
                  <input type="range" min={1.5} max={2.5} step={0.1} value={interimCoeff}
                    onChange={function (e) { setInterimCoeff(parseFloat(e.target.value)); }}
                    style={{ width: "100%", accentColor: "var(--brand)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)" }}>
                    <span>×1.5</span><span>×2.5</span>
                  </div>
                </div>
                {net > 0 ? (
                  <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-muted)" }}>{t.interim_invoice || "Montant facturé (votre coût)"}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(net)}/mois</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-muted)" }}>{t.interim_gross_est || "Brut estimé intérimaire"}</span>
                      <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>~{eur(net / interimCoeff)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-muted)" }}>{t.interim_agency || "Marge agence"}</span>
                      <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>~{eur(net - net / interimCoeff)}</span>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>{t.modal_close || "Fermer"}</Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (t.modal_save || "Enregistrer") : (t.modal_add || "Ajouter")}
            </Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Page ── */
export default function SalaryPage({ sals, setSals, cfg, salCosts, arrV, assets, setAssets, setTab, onNavigate, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb, pendingAdd, onClearPendingAdd, pendingEdit, onClearPendingEdit, pendingDuplicate, onClearPendingDuplicate, esopEnabled }) {
  var { lang } = useLang();
  var t = useT().salaries || {};
  var [activeTab, setActiveTab] = useState("all");
  var [showCreate, setShowCreate] = useState(null);
  var [pendingLabel, setPendingLabel] = useState("");
  var [editingSal, setEditingSal] = useState(null);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var { devMode } = useDevMode();
  var lk = lang === "en" ? "en" : "fr";

  useEffect(function () {
    if (pendingAdd && pendingAdd.label) {
      setPendingLabel(pendingAdd.label);
      setShowCreate("employee");
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAdd]);

  useEffect(function () {
    if (!pendingEdit) return;
    var idx = (sals || []).findIndex(function (s) { return String(s.id) === String(pendingEdit.itemId); });
    if (idx >= 0) {
      setEditingSal({ idx: idx, item: sals[idx] });
      if (onClearPendingEdit) onClearPendingEdit();
    }
  }, [pendingEdit]);

  useEffect(function () {
    if (!pendingDuplicate) return;
    var idx = (sals || []).findIndex(function (s) { return String(s.id) === String(pendingDuplicate.itemId); });
    if (idx >= 0) {
      var clone = Object.assign({}, sals[idx], { id: Date.now(), role: sals[idx].role + " (copie)" });
      setSals(function (prev) { var nc = prev.slice(); nc.splice(idx + 1, 0, clone); return nc; });
      setEditingSal({ idx: idx + 1, item: clone });
      if (onClearPendingDuplicate) onClearPendingDuplicate();
    }
  }, [pendingDuplicate]);

  /* breakdown + totals */
  var breakdown = useMemo(function () {
    var monthly = 0, annual = 0, count = 0;
    (sals || []).forEach(function (s) {
      if (s.net > 0) {
        var cost = employerCost(s, cfg);
        monthly += cost;
        count++;
      }
    });
    annual = monthly * 12;
    return { monthly: monthly, annual: annual, count: count };
  }, [sals, cfg]);

  var avgCost = breakdown.count > 0 ? breakdown.monthly / breakdown.count : 0;
  var massPct = arrV > 0 ? (breakdown.annual) / arrV : 0;

  /* type distribution for donut */
  var typeDistribution = useMemo(function () {
    var dist = {};
    (sals || []).forEach(function (s) {
      if (s.net > 0) {
        var cost = employerCost(s, cfg);
        var tk = s.type || "employee";
        dist[tk] = (dist[tk] || 0) + cost;
      }
    });
    return dist;
  }, [sals, cfg]);

  /* internal vs external split */
  var internalExternal = useMemo(function () {
    var internal = 0, external = 0, internalCount = 0, externalCount = 0;
    (sals || []).forEach(function (s) {
      var cost = employerCost(s, cfg);
      if (s.type === "independant" || s.type === "interim" || s.type === "student" || s.type === "intern") {
        external += cost;
        if (s.net > 0) externalCount++;
      } else {
        internal += cost;
        if (s.net > 0) internalCount++;
      }
    });
    var total = internal + external;
    return {
      internal: internal, external: external, total: total,
      internalPct: total > 0 ? Math.round(internal / total * 100) : 0,
      externalPct: total > 0 ? Math.round(external / total * 100) : 0,
      internalCount: internalCount, externalCount: externalCount,
    };
  }, [sals, cfg]);

  /* tab filtering */
  function salTabType(s) {
    if (s.type === "director") return "direction";
    if (s.type === "independant" || s.type === "interim" || s.type === "student" || s.type === "intern") return "external";
    return "employees";
  }

  var tabItems = useMemo(function () {
    if (activeTab === "all") return sals || [];
    return (sals || []).filter(function (s) { return salTabType(s) === activeTab; });
  }, [sals, activeTab]);

  var tabCounts = useMemo(function () {
    var counts = { all: (sals || []).length, employees: 0, direction: 0, external: 0 };
    (sals || []).forEach(function (s) { counts[salTabType(s)]++; });
    return counts;
  }, [sals]);

  /* search + filter */
  var filteredItems = useMemo(function () {
    var items = tabItems;
    if (filter !== "all") {
      items = items.filter(function (s) { return (s.type || "employee") === filter; });
    }
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      items = items.filter(function (s) { return (s.role || "").toLowerCase().indexOf(q) !== -1; });
    }
    return items;
  }, [tabItems, filter, search]);

  /* filter options */
  var filterOptions = useMemo(function () {
    var types = {};
    (sals || []).forEach(function (s) {
      var tk = s.type || "employee";
      if (SAL_TYPE_META[tk]) types[tk] = SAL_TYPE_META[tk];
    });
    var opts = [{ value: "all", label: t.filter_all || "Toutes les catégories" }];
    Object.keys(types).forEach(function (tk) {
      opts.push({ value: tk, label: types[tk].label[lk] });
    });
    return opts;
  }, [sals, lk, t]);

  var TAB_LABELS = {
    all: t.tab_all || "Tous",
    employees: t.tab_employees || "Salariés",
    direction: t.tab_direction || "Direction",
    external: t.tab_external || "Externes",
  };

  function addSal(data) { setSals(function (prev) { return (prev || []).concat([data]); }); }
  function removeSal(idx) { setSals(function (prev) { var nc = prev.slice(); nc.splice(idx, 1); return nc; }); }
  function requestDelete(idx) { if (skipDeleteConfirm) { removeSal(idx); } else { setPendingDelete(idx); } }
  function bulkDeleteSals(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setSals(function (prev) { return prev.filter(function (s) { return !idSet[String(s.id)]; }); });
  }
  function cloneSal(idx) {
    setSals(function (prev) {
      var nc = prev.slice();
      var clone = Object.assign({}, nc[idx], { id: Date.now(), role: nc[idx].role + (t.copy_suffix || " (copie)") });
      nc.splice(idx + 1, 0, clone);
      return nc;
    });
  }
  function saveSal(idx, data) {
    setSals(function (prev) { var nc = prev.slice(); nc[idx] = Object.assign({}, nc[idx], data); return nc; });
  }

  function randomizeSals() {
    var items = [];
    /* Pick roles across all categories + include all contract types */
    var founders = ROLE_PRESETS.filter(function (p) { return p.founder; });
    var employees = ROLE_PRESETS.filter(function (p) { return !p.founder; });
    /* 1-2 directors */
    [0, 1].forEach(function (i) {
      if (i < founders.length) {
        items.push({
          id: Date.now() + Math.random(), role: founders[i].role,
          net: Math.round(3000 + Math.random() * 2000),
          type: "director", vari: false, shareholder: true, esop: false,
        });
      }
    });
    /* 2-3 employees from different categories */
    var empPicks = [];
    var cats = ["tech", "business", "marketing", "ops"];
    cats.forEach(function (cat) {
      var pool = employees.filter(function (p) { return p.cat === cat; });
      if (pool.length > 0) empPicks.push(pool[Math.floor(Math.random() * pool.length)]);
    });
    empPicks.slice(0, 3).forEach(function (p) {
      items.push({
        id: Date.now() + Math.random(), role: p.role,
        net: Math.round(1800 + Math.random() * 1500),
        type: "employee", vari: false, shareholder: false, esop: false,
      });
    });
    /* 1 freelancer */
    items.push({
      id: Date.now() + Math.random(), role: "Designer freelance",
      net: Math.round(2500 + Math.random() * 1500),
      type: "independant", vari: false, shareholder: false, esop: false,
    });
    /* 1 student */
    items.push({
      id: Date.now() + Math.random(), role: "Stagiaire marketing",
      net: Math.round(400 + Math.random() * 400),
      type: "student", vari: false, shareholder: false, esop: false,
    });
    setSals(items);
  }

  /* columns */
  var columns = useMemo(function () {
    return [
      {
        id: "role", accessorKey: "role",
        header: t.col_role || "Rôle",
        enableSorting: true,
        meta: { align: "left", minWidth: 200, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{(sals || []).length} {t.footer_members || "membres"}</span>
            </>
          );
        },
      },
      cfg.showPcmn ? {
        id: "pcmn",
        header: "PCMN",
        enableSorting: false,
        meta: { align: "left" },
        cell: function (info) {
          var tk = info.row.original.type || "employee";
          var code = tk === "independant" || tk === "interim" ? "6120" : "6200";
          return <span style={{ fontSize: 11, fontFamily: "ui-monospace,monospace", background: "var(--bg-accordion)", padding: "2px 6px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>{code}</span>;
        },
      } : null,
      {
        id: "type",
        header: "Type",
        enableSorting: true,
        meta: { align: "left" },
        cell: function (info) {
          var tk = info.row.original.type || "employee";
          var found = SAL_TYPE_META[tk];
          if (!found) return tk;
          return <Badge color={found.badge} size="sm" dot>{found.label[lk]}</Badge>;
        },
      },
      {
        id: "duration",
        header: t.col_duration || "Contrat",
        enableSorting: true,
        meta: { align: "left" },
        cell: function (info) {
          var s = info.row.original;
          var m = SAL_TYPE_META[s.type || "employee"];
          if (!m || !m.showDuration) return <span style={{ color: "var(--text-faint)" }}>—</span>;
          var dur = s.duration || "cdi";
          var found = null;
          DURATION_OPTIONS.forEach(function (d) { if (d.value === dur) found = d; });
          return found ? found.label[lk] : dur;
        },
      },
      {
        id: "net", accessorKey: "net",
        header: t.col_net || "Net mensuel",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () {
          var totalNet = 0;
          (sals || []).forEach(function (s) { totalNet += s.net || 0; });
          return <span style={{ fontWeight: 600 }}>{eur(totalNet)}</span>;
        },
      },
      {
        id: "cost",
        accessorFn: function (row) { return employerCost(row, cfg); },
        header: t.col_total || "Coût employeur",
        enableSorting: true,
        meta: { align: "right" },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(breakdown.monthly)}/mois</span>; },
      },
      {
        id: "benefits",
        header: t.col_benefits || "Avantages",
        enableSorting: false,
        meta: { align: "center" },
        cell: function (info) {
          var s = info.row.original;
          var hasBenefits = s.benefits && s.benefits.length > 0;
          var hasEsop = !!s.esop;
          if (!hasBenefits && !hasEsop) return <span style={{ color: "var(--text-faint)" }}>—</span>;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              {hasBenefits ? s.benefits.map(function (b) {
                var bm = BENEFIT_META[b.id];
                if (!bm) return null;
                var BIcon = bm.icon;
                return <BIcon key={b.id} size={14} weight="duotone" color="var(--text-muted)" title={bm.label[lk] + " — " + eur(b.amount) + "/mois"} />;
              }) : null}
              {hasEsop ? <ChartPie key="esop" size={14} weight="duotone" color="var(--brand)" title={lk === "fr" ? "Plan d'intéressement" : "Incentive plan"} /> : null}
            </div>
          );
        },
      },
      {
        id: "shareholder",
        header: t.col_shareholder || "Actionnaire",
        enableSorting: false,
        meta: { align: "center" },
        cell: function (info) {
          var s = info.row.original;
          if (s.type === "independant") return <span style={{ color: "var(--text-faint)" }}>—</span>;
          return s.shareholder
            ? <UsersThree size={14} weight="fill" color="var(--brand)" />
            : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = info.row.index;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { setEditingSal({ idx: idx, item: (sals || [])[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Dupliquer"} onClick={function () { cloneSal(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Supprimer"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ].filter(Boolean);
  }, [lang, lk, sals, breakdown, cfg, t]);

  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomizeSals} onClear={function () { setSals([]); }} />
        ) : null}
        <ExportButtons cfg={cfg} data={filteredItems} columns={columns} filename="equipe" title={t.page_title || (lang === "fr" ? "Rémunérations" : "Team")} subtitle={t.page_sub || (lang === "fr" ? "Simulez le coût réel de votre équipe." : "Simulate the real cost of your team.")} getPcmn={function (row) { return row.type === "independant" ? "6130" : row.type === "interim" ? "6131" : "6200"; }} />
        <Button color="secondary" size="lg" onClick={function () { if (onNavigate) onNavigate("opex"); else setTab("opex"); }} iconLeading={<ArrowRight size={14} weight="bold" />}>
          {t.charges_btn || "Charges"}
        </Button>
        <Button color="primary" size="lg" onClick={function () { setShowCreate("employee"); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add_role || "Ajouter"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.no_members || "Aucun membre"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, textAlign: "center" }}>
        {t.no_members_hint || "Ajoutez les membres de votre équipe pour simuler le coût réel de vos rémunérations."}
      </div>
      <Button color="primary" size="md" onClick={function () { setShowCreate("employee"); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {t.add_role || "Ajouter"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.page_title || "Rémunérations"}
      subtitle={t.page_sub || "Simulez le coût réel de votre équipe."}
      icon={Users} iconColor="#8B5CF6"
    >
      {showCreate ? <SalaryModal onAdd={addSal} onClose={function () { setShowCreate(null); setPendingLabel(""); }} lang={lang} cfg={cfg} setAssets={setAssets} initialLabel={pendingLabel} esopEnabled={esopEnabled} /> : null}

      {editingSal ? <SalaryModal
        initialData={editingSal.item}
        onSave={function (data) { saveSal(editingSal.idx, data); }}
        onClose={function () { setEditingSal(null); }}
        lang={lang} cfg={cfg} setAssets={setAssets} esopEnabled={esopEnabled}
      /> : null}

      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeSal(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm}
        setSkipNext={setSkipDeleteConfirm}
        t={{
          confirm_title: t.confirm_delete_title || "Supprimer ce membre ?",
          confirm_body: t.confirm_delete_body || "Ce membre sera retiré de l'équipe.",
          confirm_skip: t.confirm_delete_skip || "Ne plus demander",
          cancel: t.cancel || "Annuler",
          delete: t.delete || "Supprimer",
        }}
      /> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_total_cost || "Coût employeur total"} value={eurShort(breakdown.monthly)} fullValue={eur(breakdown.monthly) + "/mois"} glossaryKey="salary_cost" />
        <KpiCard label={t.kpi_headcount || "Effectif"} value={String(breakdown.count)} glossaryKey="headcount" />
        <KpiCard label={t.kpi_avg_cost || "Coût moyen / employé"} value={breakdown.count > 0 ? eurShort(avgCost) : "—"} fullValue={breakdown.count > 0 ? eur(avgCost) + "/mois" : undefined} glossaryKey="avg_salary_cost" />
        <KpiCard label={t.kpi_mass_pct || "Poids dans le CA"} value={arrV > 0 ? pct(massPct) : "—"} glossaryKey="payroll_ratio" />
      </div>

      {/* Payroll alert */}
      {massPct > 0.6 && arrV > 0 ? (
        <div style={{
          padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--gap-lg)",
          background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
          borderRadius: "var(--r-lg)", borderLeft: "3px solid var(--color-warning)",
          display: "flex", alignItems: "flex-start", gap: "var(--sp-3)",
        }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: "var(--color-warning)" }}>{t.alert_mass_title || "Masse salariale élevée"}</span>{" — "}
            {t.alert_mass_desc || "Vos rémunérations représentent"} <strong>{pct(massPct)}</strong> {t.alert_mass_desc2 || "de votre chiffre d'affaires. Au-delà de 60%, la rentabilité peut être compromise."}{" "}
            <FinanceLink term="salary_cost" />
          </div>
        </div>
      ) : null}

      {/* Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Donut: répartition par type */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.distribution_title || "Répartition par type"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <TypeDonut data={typeDistribution} palette={chartPalette} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.keys(typeDistribution).length > 0 ? Object.keys(typeDistribution).map(function (tk, ti) {
                var m = SAL_TYPE_META[tk];
                if (!m) return null;
                var typePct = breakdown.monthly > 0 ? Math.round(typeDistribution[tk] / breakdown.monthly * 100) : 0;
                return (
                  <div key={tk} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: chartPalette[ti % chartPalette.length] || "var(--text-muted)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{m.label[lk]}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{typePct}%</span>
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

        {/* Ratio salariés vs externes */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.ratio_title || "Salariés vs Externes"}
          </div>
          {internalExternal.total > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              {/* Stacked bar */}
              <div style={{ display: "flex", height: 24, borderRadius: 6, overflow: "hidden" }}>
                {internalExternal.internalPct > 0 ? (
                  <div style={{ width: internalExternal.internalPct + "%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: internalExternal.internalPct > 8 ? 0 : 2, transition: "width 0.3s" }}>
                    {internalExternal.internalPct >= 15 ? <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-on-brand)" }}>{internalExternal.internalPct}%</span> : null}
                  </div>
                ) : null}
                {internalExternal.externalPct > 0 ? (
                  <div style={{ width: internalExternal.externalPct + "%", background: "var(--text-muted)", opacity: 0.4, display: "flex", alignItems: "center", justifyContent: "center", minWidth: internalExternal.externalPct > 8 ? 0 : 2, transition: "width 0.3s" }}>
                    {internalExternal.externalPct >= 15 ? <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{internalExternal.externalPct}%</span> : null}
                  </div>
                ) : null}
              </div>
              {/* Legend */}
              <div style={{ display: "flex", gap: "var(--sp-4)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.ratio_internal || "Salariés"}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {eur(internalExternal.internal)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>/mois</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{internalExternal.internalCount} {t.ratio_persons || "personnes"}</div>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.ratio_external || "Externes"}</span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)", opacity: 0.4, flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {eur(internalExternal.external)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>/mois</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{internalExternal.externalCount} {t.ratio_persons || "personnes"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 24, borderRadius: 6, background: "var(--bg-hover)" }} />
              <div style={{ display: "flex", gap: "var(--sp-4)" }}>
                <div style={{ flex: 1 }}><div style={{ width: 80, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} /></div>
                <div style={{ flex: 1 }}><div style={{ width: 80, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} /></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--gap-md)" }}>
        {SAL_TAB_TYPES.map(function (tabKey) {
          var isActive = activeTab === tabKey;
          var label = TAB_LABELS[tabKey];
          var count = tabCounts[tabKey] || 0;
          return (
            <button key={tabKey} type="button" onClick={function () { setActiveTab(tabKey); setFilter("all"); }}
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

      {/* DataTable */}
      <DataTable
        data={filteredItems}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={200}
        pageSize={10}
        dimRow={function (row) { return !row.net; }}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={bulkDeleteSals}

      />
    </PageLayout>
  );
}
