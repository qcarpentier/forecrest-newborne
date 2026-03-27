import { useState, useMemo } from "react";
import { Card, PageLayout, KpiCard, Wizard, NumberField, CurrencyInput, SelectDropdown, Button, Checkbox, Tooltip, Badge, DonutChart, ChartLegend, PaletteToggle, ConditionalWall } from "../../components";
import {
  ShieldCheck, UsersThree, ArrowRight, Lock, Clock, UserMinus,
  Prohibit, HandPalm, FileText, Scales, Calculator, CaretDown,
  Printer, Gear, DownloadSimple, Lightbulb, CircleNotch, CheckCircle,
} from "@phosphor-icons/react";
import { useT, useLang, useDevMode } from "../../context";

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
        example: { fr: "Standard startup : délai de 30 jours, au prorata des parts détenues.", en: "Standard startup: 30-day period, pro-rata to shareholding." },
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
        example: { fr: "Pratique courante : seuil de 50%. Si un actionnaire vend plus de 50% de ses parts, les autres peuvent suivre.", en: "Common practice: 50% threshold. If a shareholder sells more than 50%, others can follow." },
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
        example: { fr: "Standard : majorité de 75% requise. Protège les majoritaires tout en fixant un plancher pour les minoritaires.", en: "Standard: 75% majority required. Protects majority while setting a floor for minorities." },
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
        example: { fr: "Standard startup : 24 mois de blocage pour les fondateurs, 12 mois pour les investisseurs.", en: "Standard startup: 24-month lock-up for founders, 12 months for investors." },
        configFields: [
          { key: "months", label: { fr: "Durée de blocage (mois)", en: "Lock-up period (months)" }, type: "number", default: 24, min: 1, max: 120 },
        ],
      },
      {
        id: "piggyback",
        label: { fr: "Droit de suite (piggyback)", en: "Piggyback right" },
        simpleLabel: { fr: "Droit de vendre lors d'une introduction en bourse", en: "Right to sell during an IPO" },
        desc: { fr: "Si l'entreprise entre en bourse ou réalise une vente majeure, tous les actionnaires peuvent participer.", en: "If the company goes public or makes a major sale, all shareholders can participate." },
        why: { fr: "Garantit que personne n'est exclu d'une opportunité de liquidité.", en: "Ensures no one is excluded from a liquidity opportunity." },
        protects: "all",
        icon: ArrowRight,
        example: { fr: "Pratique courante : tous les actionnaires peuvent vendre au prorata lors d'une IPO ou d'une vente > 50% du capital.", en: "Common practice: all shareholders can sell pro-rata during an IPO or sale of > 50% of the capital." },
        configFields: [],
      },
      {
        id: "exclusion",
        label: { fr: "Clause d'exclusion", en: "Exclusion clause" },
        simpleLabel: { fr: "Possibilité d'exclure un associé", en: "Ability to exclude a partner" },
        desc: { fr: "En cas de faute grave ou de manquement répété, les autres associés peuvent forcer le rachat des parts de l'associé fautif.", en: "In case of serious misconduct or repeated breach, other partners can force the buyback of the offending partner's shares." },
        why: { fr: "Permet de se séparer d'un associé nuisible sans bloquer l'entreprise.", en: "Allows removing a harmful partner without blocking the company." },
        protects: "majority",
        icon: UserMinus,
        example: { fr: "Standard : majorité de 75% requise. Motifs typiques : faute grave, condamnation pénale, violation du pacte.", en: "Standard: 75% majority required. Typical grounds: serious misconduct, criminal conviction, pact violation." },
        configFields: [
          { key: "majorityRequired", label: { fr: "Majorité requise (%)", en: "Required majority (%)" }, type: "number", default: 75, min: 50, max: 100, pct: true },
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
        example: { fr: "Standard startup : 4 ans de vesting, 1 an de cliff. Si un fondateur part avant 1 an, il ne garde rien.", en: "Standard startup: 4-year vesting, 1-year cliff. If a founder leaves before 1 year, they keep nothing." },
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
        example: { fr: "Pratique courante : good leaver = 100% de la valeur acquise, bad leaver = 50% ou valeur nominale.", en: "Common practice: good leaver = 100% of vested value, bad leaver = 50% or nominal value." },
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
        example: { fr: "Belgique : maximum 12 mois après départ, limité géographiquement (Belgique ou Benelux).", en: "Belgium: maximum 12 months after departure, geographically limited (Belgium or Benelux)." },
        configFields: [
          { key: "months", label: { fr: "Durée après départ (mois)", en: "Duration after departure (months)" }, type: "number", default: 12, min: 1, max: 60 },
          { key: "scope", label: { fr: "Périmètre géographique", en: "Geographic scope" }, type: "text", default: "Belgique" },
        ],
      },
      {
        id: "non_solicitation",
        label: { fr: "Non-sollicitation", en: "Non-solicitation" },
        simpleLabel: { fr: "Pas le droit de débaucher les employés", en: "Cannot poach employees" },
        desc: { fr: "Après son départ, un ancien associé ne peut pas recruter les employés de l'entreprise.", en: "After leaving, a former partner cannot recruit the company's employees." },
        why: { fr: "Protège l'équipe et le savoir-faire de l'entreprise.", en: "Protects the team and the company's know-how." },
        protects: "all",
        icon: Prohibit,
        example: { fr: "Standard : 12 mois après le départ. Inclut les employés, freelances et consultants réguliers.", en: "Standard: 12 months after departure. Includes employees, freelancers and regular consultants." },
        configFields: [
          { key: "months", label: { fr: "Durée après départ (mois)", en: "Duration after departure (months)" }, type: "number", default: 12, min: 1, max: 60 },
        ],
      },
      {
        id: "confidentiality",
        label: { fr: "Confidentialité", en: "Confidentiality" },
        simpleLabel: { fr: "Obligation de garder les secrets de l'entreprise", en: "Obligation to keep company secrets" },
        desc: { fr: "Tous les associés s'engagent à ne pas divulguer les informations stratégiques, financières ou commerciales de l'entreprise.", en: "All partners commit not to disclose the company's strategic, financial or commercial information." },
        why: { fr: "Empêche un associé de partager vos données avec un concurrent.", en: "Prevents a partner from sharing your data with a competitor." },
        protects: "all",
        icon: Lock,
        example: { fr: "Pratique courante : 5 ans après le départ. Couvre les données clients, la stratégie, les finances et la propriété intellectuelle.", en: "Common practice: 5 years after departure. Covers client data, strategy, finances and intellectual property." },
        configFields: [
          { key: "durationYears", label: { fr: "Durée de l'obligation (années)", en: "Obligation duration (years)" }, type: "number", default: 5, min: 1, max: 20 },
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
        example: { fr: "Décisions typiques soumises au veto : lever des fonds, vendre l'entreprise, recruter un directeur, contracter une dette > 50K \u20ac.", en: "Typical veto decisions: raise funds, sell the company, hire a director, take on debt > \u20ac50K." },
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
        example: { fr: "Standard : reporting trimestriel (bilan, P&L, trésorerie). Les investisseurs demandent souvent un reporting mensuel.", en: "Standard: quarterly reporting (balance sheet, P&L, cash flow). Investors often request monthly reporting." },
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
        example: { fr: "Médiation d'abord (30 jours), puis arbitrage si échec. L'offre croisée (russian roulette) est réservée aux 50/50.", en: "Mediation first (30 days), then arbitration if it fails. Cross offer (Russian roulette) is reserved for 50/50 splits." },
        configFields: [
          {
            key: "method", label: { fr: "Méthode", en: "Method" }, type: "select", default: "mediation",
            options: [
              { value: "mediation", label: { fr: "Médiation", en: "Mediation" } },
              { value: "arbitration", label: { fr: "Arbitrage", en: "Arbitration" } },
              { value: "russian_roulette", label: { fr: "Offre croisée (chacun propose un prix)", en: "Cross offer (each proposes a price)" } },
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
        example: { fr: "SaaS : multiple d'ARR (5-10\u00d7). Services : multiple d'EBITDA (3-7\u00d7). Commerce : valeur comptable + goodwill.", en: "SaaS: ARR multiple (5-10\u00d7). Services: EBITDA multiple (3-7\u00d7). Retail: book value + goodwill." },
        configFields: [
          {
            key: "method", label: { fr: "Méthode", en: "Method" }, type: "select", default: "multiple",
            options: [
              { value: "dcf", label: { fr: "Projection des revenus futurs", en: "Future revenue projection" } },
              { value: "multiple", label: { fr: "Multiple du résultat annuel", en: "Annual result multiple" } },
              { value: "book_value", label: { fr: "Valeur comptable (actifs - dettes)", en: "Book value (assets - debts)" } },
              { value: "expert", label: { fr: "Évaluation par un expert indépendant", en: "Independent expert valuation" } },
            ],
          },
          { key: "multipleValue", label: { fr: "Coefficient multiplicateur", en: "Multiplier coefficient" }, type: "number", default: 5, min: 1, max: 50 },
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
        example: { fr: "Standard investisseur : compensation proportionnelle (weighted average). Le full ratchet est rare et très protecteur pour l'investisseur.", en: "Investor standard: proportional compensation (weighted average). Full ratchet is rare and very protective for the investor." },
        configFields: [
          {
            key: "type", label: { fr: "Type", en: "Type" }, type: "select", default: "weighted_avg",
            options: [
              { value: "full_ratchet", label: { fr: "Compensation totale (prix ajusté au plus bas)", en: "Full compensation (price adjusted to lowest)" } },
              { value: "weighted_avg", label: { fr: "Compensation proportionnelle (ajustement moyen)", en: "Proportional compensation (average adjustment)" } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "protection",
    label: { fr: "Protection et assurance", en: "Protection and insurance" },
    clauses: [
      {
        id: "liquidation_preference",
        label: { fr: "Préférence de liquidation", en: "Liquidation preference" },
        simpleLabel: { fr: "Les investisseurs récupèrent leur mise en premier", en: "Investors get their money back first" },
        desc: { fr: "Lors d'une vente ou d'une liquidation, les investisseurs récupèrent au minimum leur investissement initial avant que les fondateurs ne touchent quoi que ce soit.", en: "During a sale or liquidation, investors recover at least their initial investment before founders receive anything." },
        why: { fr: "Rassure les investisseurs et facilite les levées de fonds.", en: "Reassures investors and facilitates fundraising." },
        protects: "minority",
        icon: ShieldCheck,
        example: { fr: "Standard : 1\u00d7 non-participatif. L'investisseur récupère sa mise, puis les fondateurs partagent le reste.", en: "Standard: 1\u00d7 non-participating. Investor gets their money back, then founders share the rest." },
        configFields: [
          { key: "multiple", label: { fr: "Multiplicateur (1\u00d7 = récupérer la mise)", en: "Multiplier (1\u00d7 = get investment back)" }, type: "number", default: 1, min: 1, max: 3 },
          { key: "participating", label: { fr: "Participatif (partage le surplus avec les fondateurs)", en: "Participating (shares surplus with founders)" }, type: "checkbox", default: false },
        ],
      },
      {
        id: "key_man_insurance",
        label: { fr: "Assurance homme-clé", en: "Key man insurance" },
        simpleLabel: { fr: "Assurance sur les fondateurs", en: "Insurance on founders" },
        desc: { fr: "L'entreprise souscrit une assurance qui couvre les conséquences financières du décès ou de l'incapacité d'un fondateur.", en: "The company takes out insurance covering the financial consequences of a founder's death or disability." },
        why: { fr: "Protège l'entreprise si un fondateur ne peut plus travailler.", en: "Protects the company if a founder can no longer work." },
        protects: "all",
        icon: ShieldCheck,
        example: { fr: "Couverture typique : 100K-500K \u20ac par fondateur. Prime annuelle : 500-2000 \u20ac selon l'âge et le montant.", en: "Typical coverage: \u20ac100K-500K per founder. Annual premium: \u20ac500-2000 depending on age and amount." },
        configFields: [
          { key: "coverageAmount", label: { fr: "Montant de couverture (\u20ac)", en: "Coverage amount (\u20ac)" }, type: "currency", default: 100000 },
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

var RECOMMENDED_IDS = ["preemption", "tag_along", "lock_up", "vesting", "good_bad_leaver", "non_compete", "confidentiality", "non_solicitation", "reporting", "valuation_method"];

/* ── Legal context per clause (Belgian law references) ─────────── */

var LEGAL_CONTEXT = {
  preemption: "Conformément aux articles 5:63 et suivants du Code des sociétés et des associations (CSA), les actionnaires bénéficient d'un droit de préférence lors de toute cession de parts sociales. Ce droit s'exerce proportionnellement à la participation de chaque actionnaire dans le capital social.",
  tag_along: "En application du principe de protection des minoritaires (art. 5:140 CSA), tout actionnaire minoritaire dispose du droit de se joindre à une cession initiée par un actionnaire majoritaire, aux mêmes conditions et au même prix par part sociale.",
  drag_along: "Dans le respect des conditions prévues à l'article 5:141 CSA, l'actionnaire ou le groupe d'actionnaires détenant la majorité requise peut contraindre les actionnaires minoritaires à céder leurs parts dans le cadre d'une offre de rachat global, sous réserve du respect du prix minimum convenu.",
  lock_up: "Les parties conviennent d'une période d'incessibilité au sens de l'article 5:62 CSA, durant laquelle aucun actionnaire ne pourra céder, nantir ou transférer ses parts sociales, sauf accord unanime des autres actionnaires.",
  vesting: "Les parts soumises à acquisition progressive sont régies par un calendrier de déblocage (vesting schedule), incluant une période d'attente initiale (cliff). Les parts non acquises en cas de départ anticipé seront rachetées par la Société ou les actionnaires restants selon les modalités prévues ci-après.",
  good_bad_leaver: "En cas de départ d'un actionnaire, les conditions de rachat suivantes s'appliquent, conformément aux principes de bonne foi et d'équité contractuelle. La qualification de « good leaver » ou « bad leaver » sera déterminée par le conseil d'administration à la majorité qualifiée.",
  non_compete: "Conformément à l'article 5:164 CSA et aux principes de droit commun en matière de non-concurrence, chaque actionnaire s'engage, pendant la durée de sa participation et durant la période post-contractuelle définie, à ne pas exercer d'activité concurrente directe ou indirecte.",
  veto: "Les décisions suivantes requièrent l'unanimité des actionnaires conformément à l'article 5:100 CSA et ne peuvent être adoptées sans le consentement exprès de chaque actionnaire, quelle que soit sa participation au capital.",
  reporting: "La Société s'engage à fournir aux Actionnaires les informations financières suivantes, conformément aux obligations de transparence prévues par le CSA et les statuts de la Société. Le non-respect de cette obligation constitue un manquement contractuel ouvrant droit à réparation.",
  deadlock: "En cas de blocage décisionnel (deadlock), les parties conviennent du mécanisme suivant, conçu pour préserver la continuité de l'entreprise et éviter toute paralysie opérationnelle. À défaut de résolution amiable dans un délai raisonnable, la procédure ci-dessous sera mise en œuvre.",
  valuation_method: "La valorisation des parts sociales sera déterminée selon la méthode suivante, appliquée de manière cohérente lors de toute cession, rachat ou événement de liquidité. En cas de désaccord sur la valorisation, un expert indépendant sera désigné conformément à l'article 5:70 CSA.",
  anti_dilution: "En cas d'émission de nouvelles parts à un prix inférieur (down-round), les actionnaires existants bénéficieront d'un mécanisme d'ajustement de leur participation, destiné à compenser la dilution subie. Ce mécanisme s'applique conformément aux conditions convenues entre les parties.",
  piggyback: "Le droit de suite permet à tous les actionnaires de participer à une opération de liquidité, conformément au principe d'égalité entre actionnaires (art. 5:139 CSA).",
  exclusion: "L'exclusion d'un actionnaire peut être prononcée conformément aux articles 2:63 et 2:64 du CSA en cas de juste motif.",
  non_solicitation: "L'obligation de non-sollicitation s'applique pendant et après la participation de l'actionnaire, dans le respect des principes de droit commun relatifs à la concurrence loyale.",
  confidentiality: "L'obligation de confidentialité s'impose aux actionnaires en vertu du devoir de loyauté et de bonne foi (art. 1134 du Code civil belge).",
  liquidation_preference: "En cas de liquidation ou de cession totale de l'entreprise, les actionnaires bénéficiant d'une préférence de liquidation récupèrent en priorité leur investissement initial.",
  key_man_insurance: "La société s'engage à souscrire et maintenir une police d'assurance homme-clé couvrant les fondateurs désignés.",
};

var LEGAL_CONTEXT_EN = {
  preemption: "In accordance with articles 5:63 et seq. of the Belgian Code of Companies and Associations (CCA), shareholders benefit from a preferential right upon any transfer of shares. This right is exercised proportionally to each shareholder's participation in the share capital.",
  tag_along: "In application of the minority protection principle (art. 5:140 CCA), any minority shareholder has the right to join a transfer initiated by a majority shareholder, under the same conditions and at the same price per share.",
  drag_along: "In compliance with the conditions set out in article 5:141 CCA, the shareholder or group of shareholders holding the required majority may compel minority shareholders to transfer their shares as part of an overall buyout offer, subject to the agreed minimum price.",
  lock_up: "The parties agree on a lock-up period within the meaning of article 5:62 CCA, during which no shareholder may transfer, pledge or assign their shares, except by unanimous agreement of the other shareholders.",
  vesting: "Shares subject to progressive acquisition are governed by a vesting schedule, including an initial cliff period. Unvested shares in the event of early departure shall be repurchased by the Company or remaining shareholders under the terms set forth herein.",
  good_bad_leaver: "In the event of a shareholder's departure, the following buyback conditions shall apply, in accordance with the principles of good faith and contractual fairness. The qualification as 'good leaver' or 'bad leaver' shall be determined by the board of directors by qualified majority.",
  non_compete: "In accordance with article 5:164 CCA and the general principles of non-competition law, each shareholder undertakes, during the period of their participation and for the post-contractual period defined, not to engage in any direct or indirect competing activity.",
  veto: "The following decisions require unanimity of shareholders pursuant to article 5:100 CCA and cannot be adopted without the express consent of each shareholder, regardless of their participation in the share capital.",
  reporting: "The Company undertakes to provide Shareholders with the following financial information, in accordance with the transparency obligations set out in the CCA and the Company's articles of association. Failure to comply constitutes a contractual breach entitling the aggrieved party to compensation.",
  deadlock: "In the event of a decisional deadlock, the parties agree on the following mechanism, designed to preserve business continuity and avoid any operational paralysis. Failing amicable resolution within a reasonable timeframe, the procedure below shall be implemented.",
  valuation_method: "The valuation of shares shall be determined according to the following method, applied consistently upon any transfer, buyback or liquidity event. In case of valuation disagreement, an independent expert shall be appointed pursuant to article 5:70 CCA.",
  anti_dilution: "In the event of issuance of new shares at a lower price (down-round), existing shareholders shall benefit from an adjustment mechanism for their participation, intended to compensate for the dilution suffered. This mechanism applies in accordance with the conditions agreed between the parties.",
  piggyback: "The piggyback right allows all shareholders to participate in a liquidity event, in accordance with the principle of equality between shareholders (art. 5:139 CCA).",
  exclusion: "The exclusion of a shareholder may be pronounced in accordance with articles 2:63 and 2:64 of the CCA in case of just cause.",
  non_solicitation: "The non-solicitation obligation applies during and after the shareholder's participation, in compliance with the general principles of fair competition law.",
  confidentiality: "The confidentiality obligation applies to shareholders by virtue of the duty of loyalty and good faith (art. 1134 of the Belgian Civil Code).",
  liquidation_preference: "In the event of liquidation or total sale of the company, shareholders benefiting from a liquidation preference shall recover their initial investment as a priority.",
  key_man_insurance: "The company undertakes to take out and maintain a key man insurance policy covering the designated founders.",
};

/* ── PDF CSS for legal document ────────────────────────────────── */

var LEGAL_PDF_CSS = [
  '*{margin:0;padding:0;box-sizing:border-box}',
  'body{font-family:Georgia,"Times New Roman",Times,serif;color:#1a1a1a;padding:40px 48px;font-size:12pt;line-height:1.6;text-align:justify}',
  '@page{size:A4 portrait;margin:20mm 22mm}',
  '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}',
  '.doc-header{border-bottom:3px solid #E25536;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end}',
  '.logo{display:flex;align-items:center;gap:10px}',
  '.logo-icon{width:28px;height:28px;border-radius:6px;background:#E25536;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;font-family:system-ui,sans-serif}',
  '.logo-text{font-size:16px;font-weight:800;letter-spacing:-0.03em;color:#1a1a1a;font-family:system-ui,sans-serif}',
  '.doc-meta{text-align:right;font-size:10pt;color:#555;line-height:1.5}',
  '.doc-meta strong{color:#1a1a1a}',
  '.doc-title{text-align:center;margin:32px 0 8px;font-size:18pt;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase}',
  '.doc-disclaimer{text-align:center;font-size:9pt;color:#888;font-style:italic;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #ddd}',
  '.preamble{margin-bottom:28px;font-size:11pt;line-height:1.8}',
  '.preamble strong{font-weight:bold}',
  '.preamble .conclusion{text-align:center;font-weight:bold;font-variant:small-caps;font-size:12pt;margin-top:20px;letter-spacing:0.08em}',
  '.article{margin-bottom:24px;page-break-inside:avoid}',
  '.article-header{font-size:13pt;font-weight:bold;margin-bottom:10px;color:#1a1a1a;border-bottom:1px solid #e0e0e0;padding-bottom:6px}',
  '.article-paragraph{margin-bottom:8px;font-size:11pt;text-indent:2em}',
  '.article-paragraph.no-indent{text-indent:0}',
  '.article-params{margin:10px 0 10px 2em;font-size:10.5pt}',
  '.article-params li{margin-bottom:4px;list-style:disc}',
  '.article-params li strong{font-weight:600}',
  '.legal-context{font-size:10.5pt;color:#333;font-style:italic;margin-top:8px;text-indent:2em}',
  '.signature-block{margin-top:48px;page-break-inside:avoid}',
  '.signature-block .place-date{font-size:11pt;margin-bottom:32px}',
  '.signature-block .copies{font-size:10pt;color:#555;margin-bottom:28px}',
  '.sig-grid{display:flex;justify-content:space-between;gap:40px}',
  '.sig-box{flex:1;font-size:10.5pt}',
  '.sig-box .sig-title{font-weight:bold;margin-bottom:16px;font-size:11pt}',
  '.sig-box .sig-line{border-bottom:1px solid #999;height:48px;margin-bottom:8px}',
  '.sig-box .sig-label{color:#555;font-size:9.5pt}',
  '.doc-footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;text-align:center;font-size:9pt;color:#999;line-height:1.6}',
  '.doc-footer a{color:#E25536;text-decoration:none}',
].join('');

/* ── Export legal PDF function ─────────────────────────────────── */

function exportLegalPdf(cfg, pact, lang) {
  var isFr = lang !== "en";
  var now = new Date();
  var dateStr = now.toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

  var companyName = (cfg && cfg.companyName) || "____________";
  var legalForm = (cfg && cfg.legalForm) || "____________";
  var tvaNumber = (cfg && cfg.tvaNumber) || "____________";
  var address = (cfg && cfg.address) || "____________";

  function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  var html = '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="UTF-8"><title>' +
    (isFr ? "Convention d'actionnaires" : "Shareholders' Agreement") +
    '</title><style>' + LEGAL_PDF_CSS + '</style></head><body>';

  /* ── Header ── */
  html += '<div class="doc-header"><div class="logo"><div class="logo-icon">F</div><div class="logo-text">Forecrest</div></div>';
  html += '<div class="doc-meta">' + dateStr + '<br/>';
  if (cfg && cfg.companyName) html += '<strong>' + esc(cfg.companyName) + '</strong>';
  if (cfg && cfg.legalForm) html += ' · ' + esc(cfg.legalForm);
  if (cfg && cfg.tvaNumber) html += '<br/>TVA ' + esc(cfg.tvaNumber);
  html += '</div></div>';

  /* ── Title ── */
  html += '<div class="doc-title">' + (isFr ? "CONVENTION D'ACTIONNAIRES" : "SHAREHOLDERS' AGREEMENT") + '</div>';
  html += '<div class="doc-disclaimer">' + (isFr
    ? "Document préparatoire — à valider par un conseil juridique"
    : "Preparatory document — to be validated by legal counsel") + '</div>';

  /* ── Preamble ── */
  html += '<div class="preamble">';
  if (isFr) {
    html += '<p>Entre les soussignés :</p>';
    html += '<p><strong>' + esc(companyName) + '</strong>, ' + esc(legalForm) +
      ', dont le siège social est établi à ' + esc(address) +
      ', inscrite à la BCE sous le numéro ' + esc(tvaNumber) + ',</p>';
    html += '<p>ci-après dénommée « la Société »,</p>';
    html += '<p>Et ses actionnaires tels que repris dans le registre des actionnaires,</p>';
    html += '<p>ci-après dénommés individuellement « l\'Actionnaire » et collectivement « les Actionnaires »,</p>';
    html += '<p class="conclusion">IL A ÉTÉ CONVENU CE QUI SUIT :</p>';
  } else {
    html += '<p>Between the undersigned:</p>';
    html += '<p><strong>' + esc(companyName) + '</strong>, ' + esc(legalForm) +
      ', with registered office at ' + esc(address) +
      ', registered with the CBE under number ' + esc(tvaNumber) + ',</p>';
    html += '<p>hereinafter referred to as "the Company",</p>';
    html += '<p>And its shareholders as listed in the register of shareholders,</p>';
    html += '<p>hereinafter referred to individually as "the Shareholder" and collectively as "the Shareholders",</p>';
    html += '<p class="conclusion">THE FOLLOWING HAS BEEN AGREED:</p>';
  }
  html += '</div>';

  /* ── Articles — enabled clauses only ── */
  var articleNum = 0;
  CLAUSE_SECTIONS.forEach(function (section) {
    section.clauses.forEach(function (clause) {
      var cd = pact[clause.id];
      if (!cd || !cd.enabled) return;
      articleNum += 1;

      var simpleLabel = isFr ? clause.simpleLabel.fr : clause.simpleLabel.en;
      var techLabel = isFr ? clause.label.fr : clause.label.en;
      var desc = isFr ? clause.desc.fr : clause.desc.en;
      var legalCtx = isFr ? LEGAL_CONTEXT[clause.id] : LEGAL_CONTEXT_EN[clause.id];

      html += '<div class="article">';
      html += '<div class="article-header">Article ' + articleNum + ' — ' + esc(simpleLabel) + ' (' + esc(techLabel) + ')</div>';

      /* N.1 — Description in legal style */
      html += '<p class="article-paragraph">' + articleNum + '.1. ' + esc(desc) + '</p>';

      /* N.2 — Parameters */
      var fields = clause.configFields || [];
      if (fields.length > 0) {
        html += '<p class="article-paragraph">' + articleNum + '.2. ' + (isFr
          ? 'Les paramètres suivants sont convenus entre les parties :'
          : 'The following parameters have been agreed between the parties:') + '</p>';
        html += '<ul class="article-params">';
        fields.forEach(function (f) {
          var val = cd[f.key] != null ? cd[f.key] : f.default;
          if (f.type === "checkbox") val = val ? (isFr ? "Oui" : "Yes") : (isFr ? "Non" : "No");
          if (f.type === "select" && f.options) {
            f.options.forEach(function (opt) {
              if (opt.value === val) val = isFr ? opt.label.fr : opt.label.en;
            });
          }
          if (f.pct && typeof val === "number") val = val + " %";
          if (f.type === "currency" && typeof val === "number") val = val.toLocaleString(isFr ? "fr-BE" : "en-GB") + " €";
          var fieldLabel = isFr ? f.label.fr : f.label.en;
          html += '<li><strong>' + esc(fieldLabel) + '</strong> : ' + esc(String(val)) + '</li>';
        });
        html += '</ul>';
      }

      /* N.3 — Legal context */
      if (legalCtx) {
        var nextNum = fields.length > 0 ? 3 : 2;
        html += '<p class="legal-context">' + articleNum + '.' + nextNum + '. ' + esc(legalCtx) + '</p>';
      }

      html += '</div>';
    });
  });

  /* ── Signature block ── */
  html += '<div class="signature-block">';
  html += '<p class="place-date">' + (isFr
    ? 'Fait à _____________, le ' + dateStr
    : 'Done at _____________, on ' + dateStr) + '</p>';
  html += '<p class="copies">' + (isFr
    ? 'En autant d\'exemplaires que de parties.'
    : 'In as many copies as there are parties.') + '</p>';
  html += '<div class="sig-grid">';
  html += '<div class="sig-box"><div class="sig-title">' + (isFr ? 'Pour la Société :' : 'For the Company:') + '</div>';
  html += '<div class="sig-line"></div>';
  html += '<div class="sig-label">' + (isFr ? 'Nom :' : 'Name:') + '</div>';
  html += '<div class="sig-label">' + (isFr ? 'Qualité :' : 'Title:') + '</div></div>';
  html += '<div class="sig-box"><div class="sig-title">' + (isFr ? 'L\'Actionnaire :' : 'The Shareholder:') + '</div>';
  html += '<div class="sig-line"></div>';
  html += '<div class="sig-label">' + (isFr ? 'Nom :' : 'Name:') + '</div>';
  html += '<div class="sig-label">' + (isFr ? 'Qualité :' : 'Title:') + '</div></div>';
  html += '</div></div>';

  /* ── Footer ── */
  html += '<div class="doc-footer">';
  html += (isFr
    ? 'Document généré par <a href="https://forecrest.app">Forecrest</a> — forecrest.app<br/><br/><strong>CLAUSE DE NON-RESPONSABILITÉ</strong><br/>Ce document est un support de travail généré automatiquement. Il ne constitue en aucun cas un avis juridique, fiscal ou financier. Forecrest, ses dirigeants, employés et affiliés déclinent toute responsabilité quant à l\'exactitude, l\'exhaustivité ou l\'adéquation de ce document à votre situation particulière. L\'utilisation de ce document se fait à vos propres risques. Vous êtes tenu(e) de consulter un avocat, notaire ou conseiller juridique qualifié avant toute signature ou prise de décision basée sur ce document. Forecrest ne pourra être tenu responsable de tout dommage direct ou indirect résultant de l\'utilisation de ce document.'
    : 'Document generated by <a href="https://forecrest.app">Forecrest</a> — forecrest.app<br/><br/><strong>DISCLAIMER</strong><br/>This document is an automatically generated working draft. It does not constitute legal, tax or financial advice under any circumstances. Forecrest, its directors, employees and affiliates disclaim all liability for the accuracy, completeness or suitability of this document to your particular situation. Use of this document is at your own risk. You are required to consult a qualified lawyer, notary or legal advisor before signing or making any decision based on this document. Forecrest shall not be held liable for any direct or indirect damages resulting from the use of this document.');
  html += '</div>';

  html += '</body></html>';

  return html;
}

function printPactHtml(html) {
  var w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function () { w.print(); }, 400);
}

function downloadPactPdf(html, lang, onStart, onEnd) {
  if (onStart) onStart();
  // Use iframe to print as PDF without moving the page
  var iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:none;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(function () {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(function () {
      document.body.removeChild(iframe);
      if (onEnd) onEnd();
    }, 1000);
  }, 500);
}

/* ── Fake preview for prerequisite wall ── */
function PactFakePreview({ lk }) {
  return (
    <div style={{ padding: "var(--sp-4)" }}>
      {/* Fake KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[0, 1, 2].map(function (i) {
          return (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ height: 10, width: 90, borderRadius: 4, background: "var(--bg-hover)", marginBottom: 8 }} />
              <div style={{ height: 24, width: 50, borderRadius: 4, background: "var(--bg-hover)" }} />
            </div>
          );
        })}
      </div>
      {/* Fake protection bar */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ height: 10, width: 140, borderRadius: 4, background: "var(--bg-hover)", marginBottom: 12 }} />
        <div style={{ height: 12, borderRadius: 6, background: "var(--bg-hover)" }} />
      </div>
      {/* Fake clause cards */}
      {[0, 1, 2, 3].map(function (i) {
        return (
          <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--sp-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: "var(--bg-hover)" }} />
              <div style={{ height: 14, width: 200, borderRadius: 4, background: "var(--bg-hover)" }} />
              <div style={{ flex: 1 }} />
              <div style={{ height: 28, width: 90, borderRadius: "var(--r-md)", background: "var(--bg-hover)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────── */

export default function PactPage({ cfg, setCfg, shareholders, setTab, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var t = useT().pact;
  var { lang } = useLang();
  var lk = lang;
  var { devMode } = useDevMode();

  /* ── Prerequisite wall: need at least 1 shareholder ── */
  if (!devMode && (shareholders || []).length === 0) {
    return (
      <PageLayout title={t.title} subtitle={t.subtitle} icon={ShieldCheck} iconColor="var(--brand)">
        <ConditionalWall
          preview={<PactFakePreview lk={lk} />}
          icon={UsersThree}
          title={lk === "fr" ? "Ajoutez d'abord vos actionnaires" : "Add your shareholders first"}
          subtitle={lk === "fr" ? "Le pacte d'associés définit les règles entre les actionnaires. Ajoutez au moins un actionnaire dans la table de capitalisation." : "The shareholders' agreement defines the rules between shareholders. Add at least one shareholder in the cap table."}
          hints={[
            lk === "fr" ? "Allez dans la page Actionnaires" : "Go to the Cap Table page",
            lk === "fr" ? "Ajoutez les fondateurs et/ou investisseurs" : "Add the founders and/or investors",
            lk === "fr" ? "Revenez ici pour configurer le pacte" : "Come back here to configure the agreement",
          ]}
          ctaLabel={lk === "fr" ? "Aller aux actionnaires" : "Go to cap table"}
          onAction={function () { setTab("captable"); }}
        />
      </PageLayout>
    );
  }

  var pact = (cfg && cfg.pact) || {};
  var isConfigured = pact._configured;

  /* Expand/collapse state for clause config panels */
  var [expandedClause, setExpandedClause] = useState(null);
  var [exporting, setExporting] = useState(false);
  var [collapsedSections, setCollapsedSections] = useState({});

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
    ];

    return (
      <PageLayout title={t.title} subtitle={t.subtitle} icon={ShieldCheck} iconColor="var(--brand)">
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
    <PageLayout title={t.title} subtitle={t.subtitle} icon={ShieldCheck} iconColor="var(--brand)" actions={
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        <Button color="tertiary" size="lg" onClick={function () { var h = exportLegalPdf(cfg, pact, lk); printPactHtml(h); }} iconLeading={<Printer size={14} weight="bold" />} sx={{ width: 40, minWidth: 40, padding: 0, justifyContent: "center" }} />
        <Button color="primary" size="lg" isDisabled={exporting} onClick={function () {
          var h = exportLegalPdf(cfg, pact, lk);
          downloadPactPdf(h, lk,
            function () { setExporting(true); },
            function () {
              setTimeout(function () { setExporting(false); }, 800);
            }
          );
        }} iconLeading={exporting
          ? <CircleNotch size={14} weight="bold" style={{ animation: "spin 1s linear infinite" }} />
          : <DownloadSimple size={14} weight="bold" />
        }>
          {exporting ? t.export_generating : t.export_btn}
        </Button>
      </div>
    }>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard
          label={t.kpi_active}
          value={metrics.enabled + "/" + metrics.total}
          sub={t.kpi_active_sub}
          tip={Math.round(metrics.ratio * 100) + "%"}
          glossaryKey="pact_active_clauses"
        />
        <KpiCard
          label={t.kpi_level}
          value={lk === "fr" ? levelLabel[metrics.levelKey].fr : levelLabel[metrics.levelKey].en}
          sub={t.kpi_level_sub}
          color={levelColor[metrics.levelKey]}
          glossaryKey="pact_protection_level"
        />
        <KpiCard
          label={t.kpi_balance}
          value={metrics.minProt + " / " + metrics.majProt}
          sub={t.kpi_balance_sub}
          glossaryKey="pact_balance"
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

      {/* Minority vs Majority explanation */}
      <Card sx={{ marginBottom: "var(--gap-lg)", background: "var(--bg-accordion)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <Badge color="success" size="sm">{t.protects_minority}</Badge>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t.minority_explain}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <Badge color="warning" size="sm">{t.protects_majority}</Badge>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t.majority_explain}
            </div>
          </div>
        </div>
      </Card>

      {/* Shareholder charts — always visible, skeleton when empty */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)", alignItems: "stretch" }}>
          {/* Donut 1: Share class distribution */}
          {(function () {
            var CLASS_META = {
              common: { label: { fr: "Ordinaires", en: "Common" }, badge: "brand" },
              preferred: { label: { fr: "Préférentielles", en: "Preferred" }, badge: "info" },
              esop: { label: { fr: "Réservées équipe", en: "Team reserved" }, badge: "warning" },
            };
            var classDist = {};
            (shareholders || []).forEach(function (sh) {
              var cl = sh.cl || "common";
              classDist[cl] = (classDist[cl] || 0) + (sh.shares || 0);
            });
            var totalShares = 0;
            Object.keys(classDist).forEach(function (k) { totalShares += classDist[k]; });
            return (
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {t.chart_class_dist}
                  </div>
                  <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <ChartLegend palette={chartPalette} distribution={classDist} meta={CLASS_META} total={totalShares} lk={lk}>
                    <DonutChart data={classDist} palette={chartPalette} size={100} />
                  </ChartLegend>
                </div>
              </div>
            );
          })()}

          {/* Donut 2: Shareholder ownership */}
          {(function () {
            var ownerDist = {};
            var ownerMeta = {};
            (shareholders || []).forEach(function (sh) {
              var name = sh.name || "?";
              ownerDist[name] = (ownerDist[name] || 0) + (sh.shares || 0);
              ownerMeta[name] = { label: { fr: name, en: name }, badge: "gray" };
            });
            var totalShares = 0;
            Object.keys(ownerDist).forEach(function (k) { totalShares += ownerDist[k]; });
            return (
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {t.chart_owner_dist}
                  </div>
                  <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <ChartLegend palette={chartPalette} distribution={ownerDist} meta={ownerMeta} total={totalShares} lk={lk}>
                    <DonutChart data={ownerDist} palette={chartPalette} size={100} />
                  </ChartLegend>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Clause sections */}
      {CLAUSE_SECTIONS.map(function (section) {
        var sectionEnabled = 0;
        section.clauses.forEach(function (c) {
          var cd = pact[c.id];
          if (cd && cd.enabled) sectionEnabled += 1;
        });

        var isSectionCollapsed = !!collapsedSections[section.id];

        return (
          <section key={section.id} style={{ marginBottom: "var(--sp-6)" }}>
            {/* Section header — clickable to collapse */}
            <div
              style={{ marginBottom: isSectionCollapsed ? 0 : "var(--sp-4)", cursor: "pointer" }}
              onClick={function () { setCollapsedSections(function (prev) { var n = Object.assign({}, prev); n[section.id] = !n[section.id]; return n; }); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                <CaretDown size={12} weight="bold" color="var(--text-muted)" style={{ transform: isSectionCollapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 0.15s" }} />
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
            {isSectionCollapsed ? null : <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
              {section.clauses.map(function (clause) {
                var cd = pact[clause.id] || {};
                var isEnabled = !!cd.enabled;
                var isExpanded = expandedClause === clause.id;
                var CIcon = clause.icon;
                var ps = PROTECTS_STYLE[clause.protects] || PROTECTS_STYLE.all;

                return (
                  <Card key={clause.id} sx={{
                    opacity: isEnabled ? 1 : 0.7,
                    transition: "opacity 0.2s",
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
                          {/* Protects badge with tooltip */}
                          <Tooltip tip={clause.protects === "minority" ? t.minority_explain : clause.protects === "majority" ? t.majority_explain : t.all_explain} width={240}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                              background: ps.bg, color: ps.text, border: "1px solid " + ps.border,
                              cursor: "help",
                            }}>
                              {lk === "fr" ? PROTECTS_LABEL[clause.protects].fr : PROTECTS_LABEL[clause.protects].en}
                            </span>
                          </Tooltip>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                          {lk === "fr" ? clause.desc.fr : clause.desc.en}
                        </p>
                        {isEnabled && clause.why ? (
                          <p style={{ fontSize: 12, color: "var(--color-success)", margin: 0, marginTop: "var(--sp-1)", lineHeight: 1.5, fontWeight: 500 }}>
                            {lk === "fr" ? clause.why.fr : clause.why.en}
                          </p>
                        ) : null}
                        {clause.example ? (
                          <div style={{ marginTop: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-hover)", borderRadius: "var(--r-sm)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "var(--sp-2)" }}>
                            <Lightbulb size={13} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>{clause.example[lk]}</span>
                          </div>
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
            </div>}
          </section>
        );
      })}

    </PageLayout>
  );
}
