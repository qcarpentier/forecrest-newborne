import { useState, useMemo } from "react";
import { Card, PageLayout, KpiCard, Wizard, NumberField, CurrencyInput, SelectDropdown, Button, Checkbox } from "../../components";
import {
  ShieldCheck, UsersThree, ArrowRight, Lock, Clock, UserMinus,
  Prohibit, HandPalm, FileText, Scales, Calculator, CaretDown,
  Printer, Sparkle, Gear,
} from "@phosphor-icons/react";
import { useT, useLang } from "../../context";

/* ── Clause section definitions ─────────────────────────────────── */

var CLAUSE_SECTIONS = [
  {
    id: "transfer",
    label: { fr: "Vente et cession de parts", en: "Selling and transferring shares" },
    clauses: [
      {
        id: "preemption",
        label: { fr: "Droit de préemption", en: "Pre-emption right" },
        simpleLabel: { fr: "Priorité d'achat entre associés", en: "Purchase priority between partners" },
        desc: { fr: "Si un associé veut vendre ses parts, les autres peuvent les acheter en premier.", en: "If a partner wants to sell their shares, the others can buy them first." },
        why: { fr: "Empêche un inconnu d'entrer au capital sans l'accord des autres.", en: "Prevents a stranger from entering the capital without others' agreement." },
        protects: "minority",
        icon: ShieldCheck,
        configFields: [
          { key: "delayDays", label: { fr: "Délai d'exercice (jours)", en: "Exercise period (days)" }, type: "number", default: 30, min: 1, max: 365 },
          { key: "proRata", label: { fr: "Au prorata des parts", en: "Pro-rata to shareholding" }, type: "checkbox", default: true },
        ],
      },
      {
        id: "tag_along",
        label: { fr: "Sortie conjointe (tag-along)", en: "Tag-along" },
        simpleLabel: { fr: "Les petits actionnaires peuvent vendre aussi", en: "Small shareholders can sell too" },
        desc: { fr: "Si un gros actionnaire vend, les minoritaires peuvent vendre aux mêmes conditions.", en: "If a major shareholder sells, minorities can sell on the same terms." },
        why: { fr: "Protège les petits actionnaires contre l'abandon par les majoritaires.", en: "Protects small shareholders from being left behind by majority holders." },
        protects: "minority",
        icon: UsersThree,
        configFields: [
          { key: "threshold", label: { fr: "Seuil de déclenchement (%)", en: "Trigger threshold (%)" }, type: "number", default: 50, min: 1, max: 100, pct: true },
        ],
      },
      {
        id: "drag_along",
        label: { fr: "Clause d'entraînement (drag-along)", en: "Drag-along" },
        simpleLabel: { fr: "Forcer une vente totale si la majorité est d'accord", en: "Force a full sale if majority agrees" },
        desc: { fr: "Si une offre de rachat total arrive et que la majorité accepte, les minoritaires doivent suivre.", en: "If a full buyout offer comes and the majority accepts, minorities must follow." },
        why: { fr: "Permet de conclure une vente sans qu'un petit actionnaire bloque tout.", en: "Allows closing a sale without a small shareholder blocking everything." },
        protects: "majority",
        icon: ArrowRight,
        configFields: [
          { key: "threshold", label: { fr: "Seuil requis (%)", en: "Required threshold (%)" }, type: "number", default: 75, min: 50, max: 100, pct: true },
          { key: "minPrice", label: { fr: "Prix minimum par action", en: "Minimum price per share" }, type: "currency", default: 0 },
        ],
      },
      {
        id: "lock_up",
        label: { fr: "Clause de blocage (lock-up)", en: "Lock-up clause" },
        simpleLabel: { fr: "Interdiction de vendre pendant X mois", en: "No selling for X months" },
        desc: { fr: "Après avoir rejoint l'entreprise, impossible de revendre ses parts pendant une période définie.", en: "After joining the company, shares cannot be resold for a defined period." },
        why: { fr: "Garantit l'engagement des associés sur le long terme.", en: "Ensures long-term commitment from partners." },
        protects: "all",
        icon: Lock,
        configFields: [
          { key: "months", label: { fr: "Durée de blocage (mois)", en: "Lock-up period (months)" }, type: "number", default: 24, min: 1, max: 120 },
        ],
      },
    ],
  },
  {
    id: "founders",
    label: { fr: "Engagement des fondateurs", en: "Founder commitment" },
    clauses: [
      {
        id: "vesting",
        label: { fr: "Vesting des fondateurs", en: "Founder vesting" },
        simpleLabel: { fr: "Les parts se débloquent progressivement", en: "Shares unlock gradually" },
        desc: { fr: "Les fondateurs ne possèdent pas toutes leurs parts immédiatement. Elles se débloquent mois après mois.", en: "Founders don't own all their shares immediately. They unlock month by month." },
        why: { fr: "Si un fondateur part tôt, il ne repart pas avec toutes ses parts.", en: "If a founder leaves early, they don't walk away with all their shares." },
        protects: "all",
        icon: Clock,
        configFields: [
          { key: "months", label: { fr: "Durée totale (mois)", en: "Total duration (months)" }, type: "number", default: 48, min: 1, max: 120 },
          { key: "cliffMonths", label: { fr: "Période d'attente (mois)", en: "Cliff period (months)" }, type: "number", default: 12, min: 0, max: 48 },
        ],
      },
      {
        id: "good_bad_leaver",
        label: { fr: "Good / Bad leaver", en: "Good / Bad leaver" },
        simpleLabel: { fr: "Conditions de rachat au départ", en: "Buyback conditions on departure" },
        desc: { fr: "Définit combien un associé récupère s'il part volontairement (good) ou s'il est exclu pour faute (bad).", en: "Defines how much a partner gets back if they leave voluntarily (good) or are dismissed for cause (bad)." },
        why: { fr: "Protège l'entreprise contre un départ en mauvais termes.", en: "Protects the company against a bad-faith departure." },
        protects: "all",
        icon: UserMinus,
        configFields: [
          { key: "goodLeaverPct", label: { fr: "Prix good leaver (% de la valeur)", en: "Good leaver price (% of value)" }, type: "number", default: 100, min: 0, max: 100, pct: true },
          { key: "badLeaverPct", label: { fr: "Prix bad leaver (% de la valeur)", en: "Bad leaver price (% of value)" }, type: "number", default: 50, min: 0, max: 100, pct: true },
        ],
      },
      {
        id: "non_compete",
        label: { fr: "Non-concurrence", en: "Non-compete" },
        simpleLabel: { fr: "Pas le droit de créer un concurrent", en: "Cannot create a competitor" },
        desc: { fr: "Pendant et après sa participation, un associé ne peut pas lancer ou rejoindre une entreprise concurrente.", en: "During and after their participation, a partner cannot start or join a competing business." },
        why: { fr: "Empêche un ex-associé d'utiliser vos clients et votre savoir-faire contre vous.", en: "Prevents a former partner from using your clients and know-how against you." },
        protects: "all",
        icon: Prohibit,
        configFields: [
          { key: "months", label: { fr: "Durée après départ (mois)", en: "Duration after departure (months)" }, type: "number", default: 12, min: 1, max: 60 },
          { key: "scope", label: { fr: "Périmètre géographique", en: "Geographic scope" }, type: "text", default: "Belgique" },
        ],
      },
    ],
  },
  {
    id: "governance",
    label: { fr: "Prise de décision", en: "Decision making" },
    clauses: [
      {
        id: "veto",
        label: { fr: "Droit de veto", en: "Veto right" },
        simpleLabel: { fr: "Certaines décisions nécessitent l'accord de tous", en: "Some decisions require everyone's agreement" },
        desc: { fr: "Les décisions majeures (lever des fonds, vendre l'entreprise, changer d'activité) ne passent pas sans accord unanime.", en: "Major decisions (raising funds, selling the company, changing activity) don't pass without unanimous agreement." },
        why: { fr: "Empêche un associé majoritaire de prendre des décisions seul.", en: "Prevents a majority shareholder from making decisions alone." },
        protects: "minority",
        icon: HandPalm,
        configFields: [
          { key: "decisions", label: { fr: "Décisions soumises au veto", en: "Decisions subject to veto" }, type: "text", default: "" },
        ],
      },
      {
        id: "reporting",
        label: { fr: "Reporting & transparence", en: "Reporting & transparency" },
        simpleLabel: { fr: "Rapports financiers réguliers pour tous", en: "Regular financial reports for everyone" },
        desc: { fr: "Tous les actionnaires reçoivent des rapports financiers à intervalles réguliers, même les minoritaires.", en: "All shareholders receive financial reports at regular intervals, even minorities." },
        why: { fr: "Assure la transparence et la confiance entre associés.", en: "Ensures transparency and trust between partners." },
        protects: "minority",
        icon: FileText,
        configFields: [
          {
            key: "frequency", label: { fr: "Fréquence", en: "Frequency" }, type: "select", default: "quarterly",
            options: [
              { value: "monthly", label: { fr: "Mensuel", en: "Monthly" } },
              { value: "quarterly", label: { fr: "Trimestriel", en: "Quarterly" } },
              { value: "annual", label: { fr: "Annuel", en: "Annual" } },
            ],
          },
        ],
      },
      {
        id: "deadlock",
        label: { fr: "Résolution de blocage", en: "Deadlock resolution" },
        simpleLabel: { fr: "Comment débloquer un désaccord", en: "How to resolve a disagreement" },
        desc: { fr: "Si les associés ne s'accordent pas sur une décision importante, un mécanisme de résolution est prévu.", en: "If partners disagree on an important decision, a resolution mechanism is in place." },
        why: { fr: "Évite que l'entreprise soit paralysée par un conflit.", en: "Prevents the company from being paralyzed by a conflict." },
        protects: "all",
        icon: Scales,
        configFields: [
          {
            key: "method", label: { fr: "Méthode", en: "Method" }, type: "select", default: "mediation",
            options: [
              { value: "mediation", label: { fr: "Médiation", en: "Mediation" } },
              { value: "arbitration", label: { fr: "Arbitrage", en: "Arbitration" } },
              { value: "russian_roulette", label: { fr: "Clause de roulette russe", en: "Russian roulette clause" } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "exit",
    label: { fr: "Départ et valorisation", en: "Departure and valuation" },
    clauses: [
      {
        id: "valuation_method",
        label: { fr: "Méthode de valorisation", en: "Valuation method" },
        simpleLabel: { fr: "Comment calculer la valeur des parts", en: "How to calculate share value" },
        desc: { fr: "Quand quelqu'un vend ou quitte, la valeur de ses parts est calculée selon une méthode définie à l'avance.", en: "When someone sells or leaves, their share value is calculated using a pre-defined method." },
        why: { fr: "Évite les disputes sur le prix lors d'une vente ou d'un départ.", en: "Prevents price disputes during a sale or departure." },
        protects: "all",
        icon: Calculator,
        configFields: [
          {
            key: "method", label: { fr: "Méthode", en: "Method" }, type: "select", default: "multiple",
            options: [
              { value: "dcf", label: { fr: "DCF (flux actualisés)", en: "DCF (discounted cash flows)" } },
              { value: "multiple", label: { fr: "Multiple d'EBITDA", en: "EBITDA multiple" } },
              { value: "book_value", label: { fr: "Valeur comptable", en: "Book value" } },
              { value: "expert", label: { fr: "Expert indépendant", en: "Independent expert" } },
            ],
          },
          { key: "multipleValue", label: { fr: "Multiple appliqué", en: "Applied multiple" }, type: "number", default: 5, min: 1, max: 50 },
        ],
      },
      {
        id: "anti_dilution",
        label: { fr: "Anti-dilution", en: "Anti-dilution" },
        simpleLabel: { fr: "Protection contre la perte de valeur", en: "Protection against value loss" },
        desc: { fr: "Si l'entreprise lève des fonds à une valorisation plus basse, les investisseurs existants sont compensés.", en: "If the company raises funds at a lower valuation, existing investors are compensated." },
        why: { fr: "Protège les premiers investisseurs contre une dévaluation de leurs parts.", en: "Protects early investors against devaluation of their shares." },
        protects: "minority",
        icon: ShieldCheck,
        configFields: [
          {
            key: "type", label: { fr: "Type", en: "Type" }, type: "select", default: "weighted_avg",
            options: [
              { value: "full_ratchet", label: { fr: "Full ratchet", en: "Full ratchet" } },
              { value: "weighted_avg", label: { fr: "Moyenne pondérée", en: "Weighted average" } },
            ],
          },
        ],
      },
    ],
  },
];

/* ── Flatten all clauses ────────────────────────────────────────── */

var ALL_CLAUSES = [];
CLAUSE_SECTIONS.forEach(function (s) {
  s.clauses.forEach(function (c) { ALL_CLAUSES.push(c); });
});

/* ── Badge colors by protects value ─────────────────────────────── */

var PROTECTS_STYLE = {
  minority: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
  majority: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  all: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info-border)" },
};

var PROTECTS_LABEL = {
  minority: { fr: "Minoritaires", en: "Minorities" },
  majority: { fr: "Majoritaires", en: "Majority" },
  all: { fr: "Tous", en: "All" },
};

/* ── Default config builder ─────────────────────────────────────── */

function buildDefaultConfig(clause) {
  var config = {};
  (clause.configFields || []).forEach(function (f) {
    config[f.key] = f.default;
  });
  return config;
}

function buildDefaultPact(recommended) {
  var pact = { _configured: true };
  ALL_CLAUSES.forEach(function (c) {
    var isOn = recommended ? recommended.indexOf(c.id) !== -1 : false;
    pact[c.id] = { enabled: isOn };
    var config = buildDefaultConfig(c);
    Object.keys(config).forEach(function (k) {
      pact[c.id][k] = config[k];
    });
  });
  return pact;
}

/* ── Recommended clauses for quick setup ────────────────────────── */

var RECOMMENDED_IDS = ["preemption", "tag_along", "lock_up", "vesting", "good_bad_leaver", "non_compete", "reporting", "valuation_method"];

/* ── Component ──────────────────────────────────────────────────── */

export default function PactPage({ cfg, setCfg }) {
  var t = useT().pact;
  var { lang } = useLang();
  var lk = lang;

  var pact = (cfg && cfg.pact) || {};
  var isConfigured = pact._configured;

  /* Expand/collapse state for clause config panels */
  var [expandedClause, setExpandedClause] = useState(null);

  /* Wizard state */
  var [wizardRecommended, setWizardRecommended] = useState(
    RECOMMENDED_IDS.reduce(function (acc, id) { acc[id] = true; return acc; }, {})
  );

  /* ── Helpers ── */

  function setPact(next) {
    setCfg(function (prev) { return Object.assign({}, prev, { pact: next }); });
  }

  function toggleClause(clauseId) {
    var current = pact[clauseId] || {};
    var clause = null;
    ALL_CLAUSES.forEach(function (c) { if (c.id === clauseId) clause = c; });
    var defaults = clause ? buildDefaultConfig(clause) : {};
    var next = Object.assign({}, pact);
    next[clauseId] = Object.assign({}, defaults, current, { enabled: !current.enabled });
    setPact(next);
  }

  function setClauseField(clauseId, key, value) {
    var next = Object.assign({}, pact);
    next[clauseId] = Object.assign({}, next[clauseId] || {}, { [key]: value });
    setPact(next);
  }

  function toggleExpand(clauseId) {
    setExpandedClause(function (prev) { return prev === clauseId ? null : clauseId; });
  }

  /* ── Computed metrics ── */

  var metrics = useMemo(function () {
    var enabled = 0;
    var total = ALL_CLAUSES.length;
    var minProt = 0;
    var majProt = 0;
    var allProt = 0;
    ALL_CLAUSES.forEach(function (c) {
      var cd = pact[c.id];
      if (cd && cd.enabled) {
        enabled += 1;
        if (c.protects === "minority") minProt += 1;
        else if (c.protects === "majority") majProt += 1;
        else { minProt += 1; majProt += 1; allProt += 1; }
      }
    });
    var ratio = total > 0 ? enabled / total : 0;
    var levelKey = ratio < 0.3 ? "low" : (ratio <= 0.6 ? "medium" : "high");
    return { enabled: enabled, total: total, ratio: ratio, levelKey: levelKey, minProt: minProt, majProt: majProt, allProt: allProt };
  }, [pact]);

  var levelLabel = {
    low: { fr: "Faible", en: "Low" },
    medium: { fr: "Moyen", en: "Medium" },
    high: { fr: "Élevé", en: "High" },
  };
  var levelColor = {
    low: "var(--color-error)",
    medium: "var(--color-warning)",
    high: "var(--color-success)",
  };

  /* ── Wizard ── */

  if (!isConfigured) {
    function wizardToggle(id) {
      setWizardRecommended(function (prev) {
        var next = Object.assign({}, prev);
        next[id] = !next[id];
        return next;
      });
    }

    function wizardFinish() {
      var selected = Object.keys(wizardRecommended).filter(function (id) { return wizardRecommended[id]; });
      var newPact = buildDefaultPact(selected);
      setPact(newPact);
    }

    var wizardSteps = [
      {
        key: "intro",
        content: (
          <div style={{ textAlign: "center" }}>
            <ShieldCheck size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
              {t.wizard_intro_title}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-5)", textAlign: "left" }}>
              {t.wizard_intro_desc}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", textAlign: "left" }}>
              {[
                { icon: ShieldCheck, title: t.wizard_card1_title, desc: t.wizard_card1_desc },
                { icon: UsersThree, title: t.wizard_card2_title, desc: t.wizard_card2_desc },
                { icon: Scales, title: t.wizard_card3_title, desc: t.wizard_card3_desc },
              ].map(function (card, ci) {
                var CIcon = card.icon;
                return (
                  <div key={ci} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", padding: "var(--sp-3)", background: "var(--bg-accordion)" }}>
                    <CIcon size={20} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-2)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{card.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        key: "quick_setup",
        content: (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
              {t.wizard_quick_title}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {t.wizard_quick_desc}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {ALL_CLAUSES.map(function (clause) {
                var isOn = !!wizardRecommended[clause.id];
                var isRecommended = RECOMMENDED_IDS.indexOf(clause.id) !== -1;
                var CIcon = clause.icon;
                return (
                  <button key={clause.id} type="button" onClick={function () { wizardToggle(clause.id); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--sp-3)",
                      padding: "var(--sp-3) var(--sp-4)",
                      border: "2px solid " + (isOn ? "var(--brand)" : "var(--border-light)"),
                      borderRadius: "var(--r-lg)", background: isOn ? "var(--brand-bg)" : "var(--bg-accordion)",
                      cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s, background 0.15s",
                      textAlign: "left",
                    }}
                  >
                    <CIcon size={18} weight={isOn ? "fill" : "regular"} color={isOn ? "var(--brand)" : "var(--text-muted)"} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isOn ? "var(--brand)" : "var(--text-primary)" }}>
                        {lk === "fr" ? clause.simpleLabel.fr : clause.simpleLabel.en}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {lk === "fr" ? clause.label.fr : clause.label.en}
                      </div>
                      {isOn && clause.why ? (
                        <div style={{ fontSize: 11, color: "var(--color-success)", marginTop: 2, lineHeight: 1.4 }}>
                          {lk === "fr" ? clause.why.fr : clause.why.en}
                        </div>
                      ) : null}
                    </div>
                    {isRecommended ? (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                        background: "var(--brand-bg)", color: "var(--brand)", border: "1px solid var(--brand-border)",
                      }}>
                        {t.wizard_recommended}
                      </span>
                    ) : null}
                    {/* Toggle indicator */}
                    <div style={{
                      width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                      background: isOn ? "var(--color-success)" : "var(--border-strong)",
                      position: "relative", transition: "background 0.2s",
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%", background: "white",
                        position: "absolute", top: 3,
                        left: isOn ? 19 : 3,
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        key: "confirm",
        content: (
          <div style={{ textAlign: "center" }}>
            <Sparkle size={48} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
              {t.wizard_confirm_title}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)" }}>
              {t.wizard_confirm_desc}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
              padding: "var(--sp-3) var(--sp-5)", borderRadius: "var(--r-lg)",
              background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
            }}>
              <ShieldCheck size={20} weight="fill" color="var(--color-success)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-success)" }}>
                {Object.keys(wizardRecommended).filter(function (id) { return wizardRecommended[id]; }).length} / {ALL_CLAUSES.length} {t.wizard_clauses_selected}
              </span>
            </div>
          </div>
        ),
      },
    ];

    return (
      <PageLayout title={t.title} subtitle={t.subtitle} icon={ShieldCheck} iconColor="#E8431A">
        <Wizard
          steps={wizardSteps}
          onFinish={wizardFinish}
          finishLabel={t.wizard_finish}
          finishIcon={<ShieldCheck size={14} weight="bold" />}
          maxWidth={640}
        />
      </PageLayout>
    );
  }

  /* ── Protection balance bar ── */

  var totalProtectClauses = ALL_CLAUSES.length;
  var minTotal = 0;
  var majTotal = 0;
  ALL_CLAUSES.forEach(function (c) {
    var cd = pact[c.id];
    if (cd && cd.enabled) {
      if (c.protects === "minority") minTotal += 1;
      else if (c.protects === "majority") majTotal += 1;
      else { minTotal += 1; majTotal += 1; }
    }
  });
  var maxProt = Math.max(minTotal + majTotal, 1);
  var minPct = Math.round((minTotal / maxProt) * 100);
  var majPct = 100 - minPct;

  /* ── Export summary ── */

  function exportSummary() {
    var lines = [];
    lines.push(lk === "fr" ? "PACTE D'ASSOCIÉS — RÉSUMÉ DES CLAUSES" : "SHAREHOLDERS' AGREEMENT — CLAUSE SUMMARY");
    lines.push("=".repeat(50));
    lines.push("");
    lines.push((lk === "fr" ? "Clauses actives : " : "Active clauses: ") + metrics.enabled + "/" + metrics.total);
    lines.push((lk === "fr" ? "Niveau de protection : " : "Protection level: ") + (lk === "fr" ? levelLabel[metrics.levelKey].fr : levelLabel[metrics.levelKey].en));
    lines.push("");

    CLAUSE_SECTIONS.forEach(function (section) {
      lines.push("─".repeat(40));
      lines.push((lk === "fr" ? section.label.fr : section.label.en).toUpperCase());
      lines.push("─".repeat(40));
      section.clauses.forEach(function (clause) {
        var cd = pact[clause.id] || {};
        var status = cd.enabled ? (lk === "fr" ? "[ON]" : "[ON]") : (lk === "fr" ? "[--]" : "[--]");
        lines.push(status + " " + (lk === "fr" ? clause.simpleLabel.fr : clause.simpleLabel.en) + " (" + (lk === "fr" ? clause.label.fr : clause.label.en) + ")");
        if (cd.enabled) {
          (clause.configFields || []).forEach(function (f) {
            var val = cd[f.key] != null ? cd[f.key] : f.default;
            if (f.type === "checkbox") val = val ? (lk === "fr" ? "Oui" : "Yes") : (lk === "fr" ? "Non" : "No");
            if (f.type === "select" && f.options) {
              f.options.forEach(function (opt) {
                if (opt.value === val) val = lk === "fr" ? opt.label.fr : opt.label.en;
              });
            }
            if (f.pct && typeof val === "number") val = val + "%";
            lines.push("    " + (lk === "fr" ? f.label.fr : f.label.en) + " : " + val);
          });
        }
      });
      lines.push("");
    });

    var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (lk === "fr" ? "pacte-associes-resume" : "shareholders-agreement-summary") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Render config field ── */

  function renderField(clause, field) {
    var cd = pact[clause.id] || {};
    var val = cd[field.key] != null ? cd[field.key] : field.default;

    if (field.type === "number") {
      return (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {lk === "fr" ? field.label.fr : field.label.en}
          </label>
          <NumberField
            value={field.pct ? val / 100 : val}
            onChange={function (v) { setClauseField(clause.id, field.key, field.pct ? Math.round(v * 100) : v); }}
            min={field.min != null ? (field.pct ? field.min / 100 : field.min) : undefined}
            max={field.max != null ? (field.pct ? field.max / 100 : field.max) : undefined}
            pct={field.pct}
            width="120px"
          />
        </div>
      );
    }

    if (field.type === "currency") {
      return (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {lk === "fr" ? field.label.fr : field.label.en}
          </label>
          <CurrencyInput
            value={val}
            onChange={function (v) { setClauseField(clause.id, field.key, v); }}
            suffix="€"
            width="140px"
          />
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div key={field.key}>
          <Checkbox
            checked={!!val}
            onChange={function (v) { setClauseField(clause.id, field.key, v); }}
            label={lk === "fr" ? field.label.fr : field.label.en}
          />
        </div>
      );
    }

    if (field.type === "text") {
      return (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {lk === "fr" ? field.label.fr : field.label.en}
          </label>
          <input
            type="text"
            value={val || ""}
            onChange={function (e) { setClauseField(clause.id, field.key, e.target.value); }}
            placeholder={lk === "fr" ? field.label.fr : field.label.en}
            style={{
              height: 40, padding: "0 var(--sp-3)",
              border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              background: "var(--input-bg)", color: "var(--text-primary)",
              fontSize: 13, fontFamily: "inherit", outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              width: "100%", maxWidth: 300,
            }}
            onFocus={function (e) { e.target.style.borderColor = "var(--brand)"; e.target.style.boxShadow = "var(--focus-ring)"; }}
            onBlur={function (e) { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
      );
    }

    if (field.type === "select" && field.options) {
      var opts = field.options.map(function (opt) {
        return { value: opt.value, label: lk === "fr" ? opt.label.fr : opt.label.en };
      });
      return (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {lk === "fr" ? field.label.fr : field.label.en}
          </label>
          <SelectDropdown
            value={val}
            onChange={function (v) { setClauseField(clause.id, field.key, v); }}
            options={opts}
            width="260px"
          />
        </div>
      );
    }

    return null;
  }

  /* ── Main page ── */

  return (
    <PageLayout title={t.title} subtitle={t.subtitle} icon={ShieldCheck} iconColor="#E8431A">

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard
          label={t.kpi_active}
          value={metrics.enabled + "/" + metrics.total}
          sub={t.kpi_active_sub}
          icon={<ShieldCheck size={14} weight="bold" />}
          color={metrics.ratio >= 0.6 ? "var(--color-success)" : metrics.ratio >= 0.3 ? "var(--color-warning)" : "var(--text-muted)"}
          target={metrics.total}
          current={metrics.enabled}
        />
        <KpiCard
          label={t.kpi_level}
          value={lk === "fr" ? levelLabel[metrics.levelKey].fr : levelLabel[metrics.levelKey].en}
          sub={t.kpi_level_sub}
          icon={<Sparkle size={14} weight="bold" />}
          color={levelColor[metrics.levelKey]}
        />
        <KpiCard
          label={t.kpi_balance}
          value={metrics.minProt + " / " + metrics.majProt}
          sub={t.kpi_balance_sub}
          icon={<Scales size={14} weight="bold" />}
        />
      </div>

      {/* Protection balance bar */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-3)" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{t.balance_title}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {t.balance_sub}
          </span>
        </div>
        <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", background: "var(--border)" }}>
          {minTotal > 0 ? (
            <div style={{
              width: minPct + "%", height: "100%",
              background: "var(--color-success)", transition: "width 0.4s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} />
          ) : null}
          {majTotal > 0 ? (
            <div style={{
              width: majPct + "%", height: "100%",
              background: "var(--color-warning)", transition: "width 0.4s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} />
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--color-success)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.protects_minority} ({minTotal})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--color-warning)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.protects_majority} ({majTotal})</span>
          </div>
        </div>
      </Card>

      {/* Clause sections */}
      {CLAUSE_SECTIONS.map(function (section) {
        var sectionEnabled = 0;
        section.clauses.forEach(function (c) {
          var cd = pact[c.id];
          if (cd && cd.enabled) sectionEnabled += 1;
        });

        return (
          <section key={section.id} style={{ marginBottom: "var(--sp-8)" }}>
            {/* Section header */}
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--brand)",
                }}>
                  {lk === "fr" ? section.label.fr : section.label.en}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                  background: sectionEnabled === section.clauses.length ? "var(--color-success-bg)" : "var(--bg-accordion)",
                  color: sectionEnabled === section.clauses.length ? "var(--color-success)" : "var(--text-faint)",
                  border: "1px solid " + (sectionEnabled === section.clauses.length ? "var(--color-success-border)" : "var(--border-light)"),
                }}>
                  {sectionEnabled}/{section.clauses.length}
                </span>
              </div>
            </div>

            {/* Clause cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
              {section.clauses.map(function (clause) {
                var cd = pact[clause.id] || {};
                var isEnabled = !!cd.enabled;
                var isExpanded = expandedClause === clause.id;
                var CIcon = clause.icon;
                var ps = PROTECTS_STYLE[clause.protects] || PROTECTS_STYLE.all;

                return (
                  <Card key={clause.id} sx={{
                    borderLeft: isEnabled ? "3px solid var(--color-success)" : "3px solid var(--border)",
                    transition: "border-color 0.2s",
                    overflow: "visible",
                  }}>
                    {/* Main clause row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
                      {/* Toggle switch */}
                      <div
                        role="switch"
                        aria-checked={isEnabled}
                        tabIndex={0}
                        onClick={function () { toggleClause(clause.id); }}
                        onKeyDown={function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleClause(clause.id); } }}
                        style={{
                          flexShrink: 0, width: 44, height: 24, borderRadius: 12, marginTop: 2,
                          background: isEnabled ? "var(--color-success)" : "var(--border-strong)",
                          position: "relative", transition: "background 0.2s", cursor: "pointer",
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%", background: "white",
                          position: "absolute", top: 3,
                          left: isEnabled ? 23 : 3,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }} />
                      </div>

                      {/* Icon + text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)", flexWrap: "wrap" }}>
                          <CIcon size={16} weight={isEnabled ? "fill" : "regular"} color={isEnabled ? "var(--text-primary)" : "var(--text-muted)"} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                            {lk === "fr" ? clause.simpleLabel.fr : clause.simpleLabel.en}
                          </span>
                          {/* Technical term badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                            background: "var(--bg-accordion)", color: "var(--text-muted)", border: "1px solid var(--border-light)",
                          }}>
                            {lk === "fr" ? clause.label.fr : clause.label.en}
                          </span>
                          {/* Protects badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                            background: ps.bg, color: ps.text, border: "1px solid " + ps.border,
                          }}>
                            {lk === "fr" ? PROTECTS_LABEL[clause.protects].fr : PROTECTS_LABEL[clause.protects].en}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                          {lk === "fr" ? clause.desc.fr : clause.desc.en}
                        </p>
                        {isEnabled && clause.why ? (
                          <p style={{ fontSize: 12, color: "var(--color-success)", margin: 0, marginTop: "var(--sp-1)", lineHeight: 1.5, fontWeight: 500 }}>
                            {lk === "fr" ? clause.why.fr : clause.why.en}
                          </p>
                        ) : null}
                      </div>

                      {/* Configure button */}
                      {isEnabled && clause.configFields && clause.configFields.length > 0 ? (
                        <button
                          type="button"
                          onClick={function () { toggleExpand(clause.id); }}
                          style={{
                            flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--sp-2)",
                            padding: "var(--sp-2) var(--sp-3)",
                            border: "1px solid " + (isExpanded ? "var(--brand)" : "var(--border)"),
                            borderRadius: "var(--r-md)",
                            background: isExpanded ? "var(--brand-bg)" : "transparent",
                            color: isExpanded ? "var(--brand)" : "var(--text-secondary)",
                            fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          <Gear size={12} weight="bold" />
                          {t.btn_configure}
                          <CaretDown size={10} weight="bold" style={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                            transition: "transform 0.15s",
                          }} />
                        </button>
                      ) : null}
                    </div>

                    {/* Inline config panel (expanded) */}
                    {isEnabled && isExpanded && clause.configFields && clause.configFields.length > 0 ? (
                      <div style={{
                        marginTop: "var(--sp-4)", paddingTop: "var(--sp-4)",
                        borderTop: "1px solid var(--border-light)",
                        display: "flex", flexWrap: "wrap", gap: "var(--sp-4)",
                      }}>
                        {clause.configFields.map(function (field) {
                          return renderField(clause, field);
                        })}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Export section */}
      <Card sx={{ marginTop: "var(--sp-4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-1)" }}>
              {t.export_title}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {t.export_desc}
            </div>
          </div>
          <Button color="primary" size="lg" onClick={exportSummary} iconLeading={<Printer size={14} weight="bold" />}>
            {t.export_btn}
          </Button>
        </div>
      </Card>
    </PageLayout>
  );
}
