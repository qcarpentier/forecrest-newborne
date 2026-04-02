export var DESIGN_SYSTEM_SECTIONS = [
  {
    id: "actions",
    label: { fr: "Actions", en: "Actions" },
    icon: "cursor",
    description: {
      fr: "Boutons, groupes d'actions et commandes rapides.",
      en: "Buttons, grouped actions, and quick commands.",
    },
    items: [
      {
        id: "button",
        name: "Button",
        file: "components/Button.jsx",
        summary: {
          fr: "Action principale avec hiérarchie visuelle, tailles et états de chargement.",
          en: "Primary action component with visual hierarchy, sizes, and loading states.",
        },
        variants: ["color: primary -> link-gray", "size: sm / md / lg / xl", "states: loading / disabled", "enhancers: leading / trailing icon, href"],
        guidelines: [
          "Use `primary` for the dominant action in a view.",
          "Prefer `secondary` and `tertiary` to reduce visual competition.",
          "Use link variants inside dense layouts and text actions.",
        ],
      },
      {
        id: "button-group",
        name: "ButtonGroup",
        file: "components/ButtonGroup.jsx",
        summary: {
          fr: "Segments connectés pour choix exclusifs, multi-sélection et actions groupées.",
          en: "Connected segments for exclusive choice, multi-select, and grouped actions.",
        },
        variants: ["mode: default / radio / checkbox", "size: sm / md / lg", "shape: default / pill", "layout: auto / stretch", "states: disabled, item disabled"],
        guidelines: [
          "Use `radio` when one option must stay selected.",
          "Use `checkbox` for filter sets and optional toggles.",
          "Reserve `stretch` for full-width controls inside cards and toolbars.",
        ],
      },
      {
        id: "action-btn",
        name: "ActionBtn",
        file: "components/ActionBtn.jsx",
        summary: {
          fr: "Bouton d'action compact pour lignes de tableau et menus contextuels.",
          en: "Compact action button for table rows and contextual commands.",
        },
        variants: ["variant: default / danger", "size: 32px fixed", "content: icon only"],
        guidelines: [
          "Use in dense row actions where full buttons would add noise.",
          "Keep the `title` explicit because the icon is the whole affordance.",
        ],
      },
      {
        id: "button-utility",
        name: "ButtonUtility",
        file: "components/ButtonUtility.jsx",
        summary: {
          fr: "Bouton utilitaire icon-only pour headers, toolbars et contrôles secondaires.",
          en: "Icon-only utility button for headers, toolbars, and secondary controls.",
        },
        variants: ["variant: default / danger / brand", "size: sm / md / header", "states: disabled"],
        guidelines: [
          "Use `header` size when space is tight around titles.",
          "Use `brand` for view-level utility actions, not destructive actions.",
        ],
      },
    ],
  },
  {
    id: "inputs",
    label: { fr: "Saisie", en: "Inputs" },
    icon: "textbox",
    description: {
      fr: "Champs de recherche, sélecteurs, nombres et filtres.",
      en: "Search fields, selectors, numbers, and filters.",
    },
    items: [
      {
        id: "search-input",
        name: "SearchInput",
        file: "components/SearchField.jsx",
        summary: {
          fr: "Champ de recherche avec icône inline et action d'effacement.",
          en: "Search field with inline icon and clear action.",
        },
        variants: ["width: fixed / 100%", "state: empty / filled", "height: custom"],
        guidelines: [
          "Use as the primary filter entry point inside list or registry views.",
          "Prefer short placeholders describing the searchable entity.",
        ],
      },
      {
        id: "select-dropdown",
        name: "SelectDropdown",
        file: "components/SelectDropdown.jsx",
        summary: {
          fr: "Sélecteur custom avec menu portal, placeholder et effacement optionnel.",
          en: "Custom select with portal menu, placeholder, and optional clear action.",
        },
        variants: ["state: placeholder / selected", "behavior: clearable", "size: height custom"],
        guidelines: [
          "Use for short curated lists where the active selection must stay visible.",
          "Enable `clearable` only when an empty state is meaningful.",
        ],
      },
      {
        id: "number-field",
        name: "NumberField",
        file: "components/NumberField.jsx",
        summary: {
          fr: "Champ numérique avec suffixes, pourcentage, stepper et validation visuelle.",
          en: "Numeric field with suffixes, percentages, steppers, and visual validation.",
        },
        variants: ["format: raw / pct / suffix", "controls: stepper", "wrapper: label / hint", "state: invalid / disabled"],
        guidelines: [
          "Use `pct` when the stored value is decimal but the user edits percentages.",
          "Keep hints short and task-oriented, especially for invalid states.",
        ],
      },
      {
        id: "currency-input",
        name: "CurrencyInput",
        file: "components/CurrencyInput.jsx",
        summary: {
          fr: "Champ monétaire formaté avec séparateurs belges et bornes min/max.",
          en: "Formatted currency field with Belgian separators and min/max guards.",
        },
        variants: ["format: prefix / suffix", "precision: decimals", "constraints: min / max", "size: width / height custom"],
        guidelines: [
          "Use for money amounts that benefit from formatting while typing.",
          "Prefer explicit currency context around the field when no prefix is shown.",
        ],
      },
      {
        id: "date-picker",
        name: "DatePicker",
        file: "components/DatePicker.jsx",
        summary: {
          fr: "Calendrier portal multilingue avec navigation mensuelle et bornes.",
          en: "Portal calendar with multilingual labels, monthly navigation, and bounds.",
        },
        variants: ["state: empty / selected", "constraints: minDate / maxDate", "actions: today / clear"],
        guidelines: [
          "Use when date readability matters more than native-browser fidelity.",
          "Keep date range constraints visible elsewhere when they drive user decisions.",
        ],
      },
      {
        id: "filter-dropdown",
        name: "FilterDropdown",
        file: "components/FilterDropdown.jsx",
        summary: {
          fr: "Filtre compact pour tables, avec état actif mis en évidence.",
          en: "Compact filter control for tables with an emphasized active state.",
        },
        variants: ["state: all / filtered", "content: label list", "menu: inline dropdown"],
        guidelines: [
          "Use for single-dimension filtering with a small option set.",
          "Avoid stacking too many instances without a clear toolbar structure.",
        ],
      },
    ],
  },
  {
    id: "display",
    label: { fr: "Affichage", en: "Display" },
    icon: "stack",
    description: {
      fr: "Badges, surfaces, avatars et cartes de métriques.",
      en: "Badges, surfaces, avatars, and metric cards.",
    },
    items: [
      {
        id: "badge",
        name: "Badge",
        file: "components/Badge.jsx",
        summary: {
          fr: "Badge sémantique ou tier, avec tailles, dot et fermeture optionnelle.",
          en: "Semantic or tier badge with sizes, dots, and optional close affordance.",
        },
        variants: ["color: gray / brand / success / warning / error / info", "tier: S / A / B / C / D", "size: sm / md / lg", "shape: pill / badge / modern", "extras: dot / icon / close"],
        guidelines: [
          "Use semantic colors to communicate state, not decoration.",
          "Reserve tier badges for grading systems and scorecards.",
        ],
      },
      {
        id: "card",
        name: "Card",
        file: "components/Card.jsx",
        summary: {
          fr: "Surface de base pour regrouper des informations avec padding et ombre légère.",
          en: "Base surface for grouping information with padding and a light shadow.",
        },
        variants: ["surface: default", "behavior: static / clickable", "layout: sx overrides"],
        guidelines: [
          "Use cards to group related content, not as a wrapper for every small row.",
          "Rely on spacing hierarchy before adding nested borders inside the card.",
        ],
      },
      {
        id: "avatar",
        name: "Avatar",
        file: "components/Avatar.jsx",
        summary: {
          fr: "Avatar initiales avec point de présence et anneau d'activité.",
          en: "Initials-based avatar with presence dot and active ring.",
        },
        variants: ["size: custom", "state: online / offline", "emphasis: active", "source: hash color / custom color"],
        guidelines: [
          "Use the status dot only when presence is meaningful in the workflow.",
          "Prefer initials over placeholder illustrations for lightweight team contexts.",
        ],
      },
      {
        id: "kpi-card",
        name: "KpiCard",
        file: "components/KpiCard.jsx",
        summary: {
          fr: "Carte KPI avec progression, valeur détaillée et entrée glossaire.",
          en: "KPI card with progress, full value tooltip, and glossary entry point.",
        },
        variants: ["content: label / value / sub", "metric detail: fullValue tooltip", "progress: target + current", "extras: icon / spark / tip / glossaryKey"],
        guidelines: [
          "Use for decision metrics that need one dominant number and one supporting sentence.",
          "Add progress only when a concrete target exists and is understood by the user.",
        ],
      },
    ],
  },
  {
    id: "structure",
    label: { fr: "Structure", en: "Structure" },
    icon: "layout",
    description: {
      fr: "Composants de disclosure, overlays et organisation de page.",
      en: "Disclosure, overlay, and page-structure components.",
    },
    items: [
      {
        id: "accordion",
        name: "Accordion",
        file: "components/Accordion.jsx",
        summary: {
          fr: "Bloc repliable pour contenus secondaires ou sections détaillées.",
          en: "Collapsible block for secondary content and detailed sections.",
        },
        variants: ["state: open / closed", "content: title / subtitle / body", "control: forceOpen revision"],
        guidelines: [
          "Use for secondary detail that should not dominate the page by default.",
          "Keep titles scannable and the body focused on one topic per accordion.",
        ],
      },
      {
        id: "modal",
        name: "Modal",
        file: "components/Modal.jsx",
        summary: {
          fr: "Overlay portal avec focus trap, tailles standard et sous-composants d'anatomie.",
          en: "Portal overlay with focus trap, standard sizes, and anatomy subcomponents.",
        },
        variants: ["size: sm / md / lg", "header: title / subtitle / icon", "layout: body / footer / divider / checkbox", "state: close hidden / visible"],
        guidelines: [
          "Use for focused tasks with a clear completion or dismissal path.",
          "Avoid overloading one modal with unrelated sections and nested workflows.",
        ],
      },
      {
        id: "color-tokens",
        name: "Color Tokens",
        file: "styles + theme variables",
        summary: {
          fr: "Fondations de couleur Forecrest et valeurs résolues utilisées par l'interface.",
          en: "Forecrest color foundations and resolved values used across the interface.",
        },
        variants: ["groups: brand / surfaces / text / semantic", "modes: light / dark"],
        guidelines: [
          "Prefer semantic aliases before reaching for raw design tokens.",
          "Keep brand accents intentional and sparse so data remains readable.",
        ],
      },
      {
        id: "semantic-mapping",
        name: "Semantic Mapping",
        file: "styles + token aliases",
        summary: {
          fr: "Pont entre tokens Forecrest et sémantique Untitled UI pour homogénéiser les composants.",
          en: "Bridge between Forecrest tokens and Untitled UI semantics for component consistency.",
        },
        variants: ["aliases: background / text / border / ring", "bridge: Forecrest -> Untitled"],
        guidelines: [
          "Map new component work to semantic tokens first.",
          "Only fall back to raw art-direction tokens for deliberate exceptions.",
        ],
      },
    ],
  },
];

export function flattenDesignSystemItems() {
  return DESIGN_SYSTEM_SECTIONS.reduce(function (acc, section) {
    return acc.concat(section.items.map(function (item) {
      return Object.assign({ sectionId: section.id, sectionLabel: section.label }, item);
    }));
  }, []);
}

export function getDesignSystemItem(itemId) {
  var items = flattenDesignSystemItems();
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === itemId) return items[i];
  }
  return null;
}

export function getDefaultDesignSystemItemId() {
  return DESIGN_SYSTEM_SECTIONS[0].items[0].id;
}

