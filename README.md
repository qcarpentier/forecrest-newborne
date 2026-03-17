# Milo Finance+

Financial planning and simulation tool for **Milo** — a SaaS B2B booking platform for beauty & wellness businesses (hair salons, spas, barbershops, yoga studios, nail bars, etc.).

Model revenues, operating costs, Belgian tax obligations (ISOC, VAT, CP200), equity, and profitability across a multi-client portfolio.

---

## Features

### Pages

| Tab | Description |
|---|---|
| **Overview** | Annual KPIs, P&L summary, Stripe threshold tracking, tax optimization (dividends, VVPRbis, legal reserve) |
| **Pricing** | Per-booking transaction breakdown — gross fee, Stripe cost, VAT, net margin by payment type (TPE / online) |
| **Qualify** | Prospect qualification: basket size, volume, tier scoring (S / A / B / C / D), Connect fees |
| **Pipeline** | Client pipeline with 12 business templates, real-time ARR and EBITDA projection |
| **Revenue Streams** | Multi-stream MRR modeling: app downloads, Shine upsell, sponsored listings, pro subscription, marketplace, brand data, ads, enterprise |
| **Cash Flow** | 24-month rolling cash flow with configurable initial cash, runway and break-even |
| **Operating Costs** | OPEX by PCMN category + CP200 salary calculator (employee / student / director) |
| **Equity** | ESOP stock option grant management with vesting schedules and IFRS 2 monthly expense |
| **Cap Table** | Shareholder registry, ownership breakdown, funding round dilution simulator |
| **Shareholders' Agreement** | Configurable clauses: pre-emption, tag-along, drag-along, vesting, governance, deadlock resolution |
| **Financing** | Loan simulator with amortization schedules, debt ratios and repayment tracking |
| **Settings** | Tax rates, fee configuration, data export / import, investor report print, full state reset |

### Application features

- **Guided onboarding wizard** — 4-step setup (team, costs, pipeline) with live cost summary and keyboard navigation
- **Scenarios** — create, duplicate and compare best/worst case financial scenarios
- **Dark mode** — system-aware toggle persisted across sessions
- **Bilingual** — French / English with live toggle (no page reload)
- **SEO meta tags** — dynamic `<title>` and `<meta description>` per page, language-aware
- **Investor report** — one-page printable PDF with ARR, EBITDA, LTV/CAC and valuation
- **Export / Import** — full state as JSON download or shareable URL hash
- **Presentation mode** — full-screen view for pitch meetings
- **Persistent state** — auto-saved to `localStorage`, restored on reload
- **Undo / Redo** — history snapshots with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- **GSAP animations** — curtain wipe on onboarding completion, staggered card reveals on tab change

---

## Tax context (Belgium)

| Rule | Value |
|---|---|
| ISOC — reduced rate | 20% on first €100K profit |
| ISOC — standard rate | 25% above €100K |
| Director salary threshold | €45,000 gross/year to access reduced ISOC rate |
| VAT | 21% |
| Employee ONSS | 13.07% |
| Professional withholding tax | 17.23% |
| Employer ONSS | 25.07% |
| Legal reserve | 5% of net profit until 10% of share capital |
| VVPRbis | 15% withholding tax on dividends (after 3 years) |

---

## Tech stack

| Layer | Choice |
|---|---|
| UI framework | React 18 (functional components, hooks) |
| Build tool | Vite 6 |
| Icons | Phosphor Icons (`@phosphor-icons/react`) |
| Animations | GSAP 3 |
| Styling | Inline styles + CSS custom properties (no external stylesheet) |
| State | `useState` / `useMemo` / `useRef` / `useEffect` |
| Persistence | `localStorage` via async `load()` / `save()` helpers |
| i18n | Context-based FR / EN dictionaries (`useT()` hook) |
| Theme | Context-based dark mode with ripple transition (`useTheme()` hook) |

---

## Project structure

```
src/
├── App.jsx                      # Root — global state, tab routing, GSAP curtain wipe
├── main.jsx                     # Entry point
│
├── constants/
│   ├── config.js                # Default fees, tax rates, thresholds, APP_NAME
│   ├── colors.js                # Design token palette
│   ├── defaults.js              # Reference data: PCMN categories, salary defaults, pipeline templates
│   └── index.js
│
├── context/
│   ├── LangContext.jsx          # i18n — FR/EN toggle, useT() / useLang() hooks
│   └── ThemeContext.jsx         # Dark mode — toggle with ripple, useTheme() hook
│
├── i18n/
│   ├── fr.js                    # French translations
│   └── en.js                    # English translations
│
├── hooks/
│   ├── useHistory.js            # Undo / redo state snapshots
│   └── useEasterEggs.js         # Keyboard shortcuts & easter eggs
│
├── utils/
│   ├── formatters.js            # eur(), pct(), nm()
│   ├── calculations.js          # bkg(), vol(), tier(), salCalc(), connectAnnual()
│   ├── storage.js               # load(), save() — localStorage with JSON
│   ├── printReport.js           # Investor report PDF generation
│   └── index.js
│
├── components/
│   ├── Header.jsx               # Navigation bar with tab switcher
│   ├── OnboardingWizard.jsx     # 4-step guided setup with keyboard shortcuts
│   ├── ExportImportModal.jsx    # JSON export / import + shareable URL hash
│   ├── PresentationMode.jsx     # Full-screen presentation view
│   ├── LangDropdown.jsx         # Language selector (FR / EN)
│   ├── PageTransition.jsx       # GSAP stagger animation on tab change
│   ├── PageLayout.jsx           # Consistent page wrapper with title
│   ├── Accordion.jsx            # Collapsible section
│   ├── Card.jsx                 # Card container
│   ├── Badge.jsx                # Tier badge (S / A / B / C / D)
│   ├── Row.jsx                  # Label-value row
│   ├── NumberField.jsx          # Numeric input with unit suffix
│   ├── Select.jsx               # Styled select
│   ├── SegmentedControl.jsx     # Option group selector
│   ├── Tooltip.jsx              # Hover tooltip
│   ├── Banner.jsx               # Info banner
│   └── index.js
│
└── pages/
    ├── OverviewPage.jsx         # KPIs, P&L, Stripe tracking, tax optimization
    ├── UnitEconomicsPage.jsx    # Per-booking economics
    ├── QualifyPage.jsx          # Prospect scoring and tier qualification
    ├── ForecastPage.jsx         # Pipeline, ARR forecast, EBITDA
    ├── RevenueStreamsPage.jsx   # Multi-stream MRR modeling
    ├── CashFlowPage.jsx         # 24-month cash flow projection + runway
    ├── OperatingCostsPage.jsx   # OPEX categories + CP200 salaries
    ├── EquityPage.jsx           # ESOP grant management + IFRS 2
    ├── CapTablePage.jsx         # Cap table + round dilution simulator
    ├── PactPage.jsx             # Shareholders' agreement clauses
    ├── DebtPage.jsx             # Loan simulator + amortization
    ├── SettingsPage.jsx         # Configuration and data management
    └── index.js
```

---

## Getting started

### Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

Static output in `dist/`.

### Docker

```bash
docker build -t milo-finance .
docker run -p 3000:80 milo-finance
```

App runs at `http://localhost:3000`.

---

## Keyboard shortcuts (onboarding)

| Key | Action |
|---|---|
| `Enter` | Primary action (Start / Next / Open Milo Finance+) |
| `Esc` | Secondary action (Skip / Back) |
| `1` / `2` / `3` | Select cost preset (Bootstrap / Standard / Scale-up) |
| `←` | Go back one step |

---

## Data persistence

All state is auto-saved to `localStorage` under the key `gu10` after every change. Data is restored on page load. The full state can be exported as a JSON file or encoded as a URL hash for sharing — the app decodes the hash on load and clears it from the URL.
