# CLAUDE.md — Forecrest (Financial Simulation Dashboard)

## Project Overview

Financial simulation dashboard for startups. Single-page React app
built with Vite. No router — tab-based navigation managed in `App.jsx`.

**Stack:** React 18, Vite 6, GSAP, Phosphor Icons, Recharts 3, Vitest 4
**Language:** JavaScript (no TypeScript)
**Target:** Startup financial modeling (ARR, runway, cap table, burn rate)

---

## Coding Conventions (STRICT)

### Functions & Variables
- **Always use `function` declarations** — never arrow functions (`=>`)
- **Always use `var`** — never `let` or `const` (except top-level module `export const`)
- Top-level exports (`export const`, `export function`) are the only exception

```js
// CORRECT
var [count, setCount] = useState(0);
var data = useMemo(function () { return compute(); }, [dep]);
profs.forEach(function (p) { /* ... */ });

// WRONG — do NOT use
const [count, setCount] = useState(0);
const data = useMemo(() => compute(), [dep]);
profs.forEach((p) => { /* ... */ });
```

### Component Style
- Functional components with `export default function ComponentName()`
- Inline styles using `style={{}}` — no CSS modules, no styled-components
- Use CSS custom properties (design tokens) in all styles — never hardcoded colors

### Reusable UI Components
- **`ButtonUtility`** — Standard icon-only button with hover states. Use for all icon
  buttons (delete, collapse, settings, etc.). Variants: `default`, `danger`, `brand`.
  Sizes: `sm` (40px), `md` (40px), `header` (32px — only for page header actions).
  **Minimum touch target: 40px** except `header` size.
- **`ConfirmDeleteModal`** — Shared confirmation modal for destructive actions.
  Props: `{ onConfirm, onCancel, skipNext, setSkipNext, t }`. Uses portal.
- Import both from `"../components"` barrel.

### Portals for Overlays (MANDATORY)
- **All `position: fixed` overlays** (modals, fullscreen menus, presentation mode) **must** use
  `createPortal(jsx, document.body)` from `react-dom`
- Reason: GSAP `PageTransition` applies `transform` on page containers, which creates a new
  containing block and breaks `position: fixed` positioning
- Import: `import { createPortal } from "react-dom";`

### Error Boundaries
- `ErrorBoundary` wraps `<App />` in `main.jsx` — catches unhandled render errors
- Add additional boundaries around isolated page sections if needed

---

## i18n — Translations (MANDATORY)

Every user-facing string **must** use the `t` object from `useT()`.

- Translation files: `src/i18n/fr.js` (primary) and `src/i18n/en.js`
- **Always add keys to BOTH files** when creating new strings
- Access via `var t = useT();` then `{t.my_key}`
- Key naming: `section_description` (e.g., `fiscal_dri_title`, `sensitivity_basket`)
- Tooltips: prefix with `tip_` (e.g., `tip_isoc_pme`)
- Field labels: prefix with `field_` (e.g., `field_var_fee`)

```js
// In component
var t = useT();
return <h3>{t.overview_title}</h3>;

// In fr.js
overview_title: "Vue d'ensemble",

// In en.js
overview_title: "Overview",
```

---

## Design Tokens (CSS Variables)

Use `var(--token)` everywhere. Never hardcode colors, spacing, or radii.

### Colors — Forecrest Palette
| Token | Usage |
|---|---|
| `var(--brand)` | Primary brand accent (Coral #E8431A) |
| `var(--text-primary)` | Main text (#0E0E0D light / #F7F4EE dark) |
| `var(--text-secondary)` | Secondary text |
| `var(--text-muted)` | Muted text (labels, hints) |
| `var(--text-faint)` | Disabled/ghost text |
| `var(--bg-page)` | Page background (#EDE8DF light / #0E0E0D dark) |
| `var(--bg-card)` | Card/surface background (#F7F4EE light / #1C1C19 dark) |
| `var(--border)` | Default borders (#D8D2C6 light / #302F2A dark) |
| `var(--bg-accordion)` | Alternate row background |
| `var(--color-success)` | Positive/green states |
| `var(--color-warning)` | Warning/amber states |
| `var(--color-error)` | Error/red states |
| `var(--color-info)` | Informational/blue states |

### Typography
- Headings/KPIs: **Bricolage Grotesque** (700–800)
- Body/UI: **DM Sans** (300–700)
- Fallback: Inter, system-ui

### Spacing & Radii
- Spacing: `var(--sp-1)` through `var(--sp-8)`
- Radii: `var(--r-sm)`, `var(--r-md)`, `var(--r-lg)`, `var(--r-xl)`

### JS Color Constants (src/constants/colors.js)
- `brand`, `gg` (gray scale), `ok`, `warn`, `err` — map to CSS vars
- Import from `"../constants"` via barrel
- **Recharts exception:** Recharts does not accept CSS custom properties — use hex
  constants from `colors.js` (e.g., `brand.primary`, `err.primary`) for chart fills/strokes

---

## Dark Mode

- Toggle via ThemeContext (`data-theme="light"` / `data-theme="dark"` on `<html>`)
- All CSS variables automatically switch between light and dark values
- Animated circle-clip transition on toggle
- Persist preference in `localStorage` key `"theme"`
- WCAG AA contrast ratios maintained in both modes

---

## Project Structure

```
src/
├── App.jsx              # Main app, state management, tab navigation
├── main.jsx             # Entry point (ErrorBoundary wraps App here)
├── components/          # Reusable UI components (Card, Row, Badge, etc.)
│   ├── ButtonUtility.jsx    # Icon-only button (default/danger/brand variants)
│   ├── ConfirmDeleteModal.jsx # Shared delete confirmation modal
│   ├── BreakEvenChart.jsx   # Recharts area chart (revenue vs costs)
│   ├── ErrorBoundary.jsx    # Class component — catches render errors
│   └── index.js         # Barrel exports
├── constants/           # Config, defaults, color tokens
│   ├── config.js        # DEFAULT_CONFIG, DEFAULT_SALES, VERSION
│   ├── defaults.js      # Profiles, presets, payment methods
│   ├── colors.js        # Color token exports
│   └── index.js         # Barrel exports
├── context/             # React contexts
│   ├── LangContext.jsx  # i18n provider, useT(), useLang()
│   └── ThemeContext.jsx # Dark/light theme
├── hooks/
│   └── useHistory.js    # Undo/redo history
├── i18n/                # Translation files
│   ├── fr.js            # French (primary)
│   └── en.js            # English
├── pages/               # Page components (one per tab)
│   └── index.js         # Barrel exports
└── utils/               # Pure functions
    ├── calculations.js  # Core financial calculations
    ├── formatters.js    # eur(), pct(), nm() formatting
    ├── storage.js       # localStorage load/save
    ├── printReport.js   # PDF/print report generation
    └── index.js         # Barrel exports
```

### Barrel Exports
All directories use `index.js` barrel files. Import from the directory, not individual files:
```js
// CORRECT
import { Card, Row, Badge } from "../components";
import { eur, pct } from "../utils";
import { DEFAULT_CONFIG } from "../constants";

// WRONG
import Card from "../components/Card";
```

Exception: components not in the barrel (e.g., `OnboardingWizard`, `ExportImportModal`) are
imported directly.

---

## Testing

- **Framework:** Vitest 4.0.18
- **Run:** `npm test` or `npx vitest run`
- **Test files:** co-located as `*.test.js` (e.g., `calculations.test.js`)
- **Rule:** Never reduce test count. Add tests for new calculation logic.

---

## Build & Dev

```bash
npm run dev        # Vite dev server
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build
npm test           # Run all tests
```

---

## Code Review Checklist

Before completing any change, verify:

1. **Translations** — All user-facing strings use `t.key`, added to both `fr.js` and `en.js`
2. **Design tokens** — No hardcoded colors/spacing; use CSS variables
3. **Coding style** — `function` + `var` only (no arrows, no let/const for locals)
4. **Tests pass** — `npm test` returns 0 failures
5. **Build succeeds** — `npm run build` completes without errors
6. **No dead code** — Remove unused imports, exports, components, **and i18n keys**
7. **Barrel exports** — New components/utils added to their `index.js`
8. **Accessibility** — Maintain WCAG AA compliance (aria labels, contrast, keyboard nav)
9. **Dark mode** — Changes must work in both light and dark themes
10. **No secrets** — Never commit API keys, tokens, or credentials
11. **Up-to-date docs** — Use Context7 MCP to verify library APIs are current before
    suggesting code; do not rely on training data for library-specific syntax
12. **Version bump** — Bump `VERSION`, `RELEASE_DATE` in config.js and `package.json` for
    every feature/fix (see Version Management)
13. **Changelog** — Add entry to `src/constants/changelog.js` and i18n keys in both
    `fr.js` and `en.js` for every version bump (see Changelog)
14. **Accounting mode** — Pages with financial data should support `cfg.showPcmn` (display
    PCMN codes, accountant badge on fields). Use conditional columns in DataTable.
15. **FinanceLinks** — Add glossary links on technical financial terms (ONSS, ISOC, IPP,
    etc.) in breakdowns and descriptions. **Never in KPI cards or card titles.**
16. **Auto-generated items** — When data flows between pages (salary→charges, assets→charges,
    salary→assets), auto-generated items must be `_readOnly: true` with `_linkedPage` for
    navigation back to source page.
17. **Beginner-friendly** — Avoid jargon. Prefer "Coût mensuel" over "Burn rate mensuel",
    "Part des salaires" over "Masse salariale / ARR". Add FinanceLinks for unavoidable
    technical terms.

---

## Version Management

- Version in `src/constants/config.js` (`VERSION` and `RELEASE_DATE`)
- Mirror in `package.json` `version` field
- **Format: `major.minor.feature.fix`**
  - `major` — Breaking change or complete redesign
  - `minor` — Sprint / milestone release (groups of features)
  - `feature` — Individual feature, new page, or significant enhancement
  - `fix` — Bug fix, typo, style tweak
- **MANDATORY:** Bump the version and update `RELEASE_DATE` with **every** feature addition,
  page creation, or significant change. Do not batch version bumps.
- Example progression: `1.0.0.0` → `1.0.1.0` (new page) → `1.0.1.1` (bug fix) → `1.0.2.0` (feature)

---

## Changelog

- Data file: `src/constants/changelog.js` — array of releases, newest first
- Each release: `{ version, date, entries: [{ type, key }] }`
- Types: `"feature"`, `"fix"`, `"improvement"`, `"breaking"`
- Entry `key` maps to i18n keys in `changelog` section of `fr.js` / `en.js`
- **MANDATORY:** Add a changelog entry for every version bump
- A green dot indicator appears in navigation when the latest release is < 7 days old

---

## Developer Mode (DevVal)

- Toggle via Settings, Ctrl+K palette, or `Ctrl+Shift+D` shortcut
- Context: `useDevMode()` from `src/context` — returns `{ devMode, toggle }`
- `<DevVal v={displayValue} f={formulaString} />` — shows formula tooltip on hover when devMode is active
- Wrap financial values in `DevVal` to expose calculation details:
  ```js
  <DevVal v={eur(ebitda)} f={eur(totalRevenue) + " - " + eur(annC) + " = " + eur(ebitda)} />
  ```
- DevBanner renders at top of page via portal (inverted theme, technical info)

---

## Icons

Use **Phosphor Icons** (`@phosphor-icons/react`). Do not use Lucide or other icon libraries.

```js
import { Info, CaretDown, Check } from "@phosphor-icons/react";
```

---

## State Management

- All state lives in `App.jsx` and is passed down as props
- `localStorage` persistence via `src/utils/storage.js` (`load`/`save`)
- Storage key: `STORAGE_KEY` from config (currently `"forecrest"`)
- Undo/redo via `useHistory` hook

---

## Sidebar Layout

The sidebar uses a 3-zone sticky layout:
```
Sidebar
├── Sticky header (logo + search)
├── Scrollable div (nav + insight cards) — scrollbarWidth: "none"
└── ProfileFooter (sticky bottom, OUTSIDE scroll container)
```

- Insight cards (e.g., `ProfileCompletion`) live inside the scrollable area
- `ProfileFooter` must remain outside the scroll container for sticky bottom behavior
- Scrollbar is always hidden (`scrollbarWidth: "none"`)

---

## Credits & Licences (MANDATORY)

- **Platform page:** `src/pages/CreditsPage.jsx` — lists all production and dev dependencies
  with licence type, author, and usage description
- **Keep up to date:** When adding or removing a dependency in `package.json`, update the
  credits page (`CreditsPage.jsx`) to reflect the change. Include: library name, version,
  author, licence type, and usage
