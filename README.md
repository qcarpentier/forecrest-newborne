# Forecrest

**Forecrest** (Forecast + Crest) is a financial simulation dashboard built for startups, freelancers, and small businesses. It provides a clear, simulated financial overview tailored to the Belgian fiscal framework — from ARR projections to ISOC tax calculations, cap table management, and multi-year cash flow forecasting.

Designed for entrepreneurs who are often intimidated by numbers: every financial concept comes with short, plain-language explanations. No accounting degree required.

---

## Features

### Dashboard & Overview

- **Greeting with time-of-day** (Bonjour / Bon apres-midi / Bonsoir)
- **4 key KPIs** with sparklines: Revenue, MRR, Costs, Treasury
- **Health score donut** (profitability, liquidity, solvency)
- **Break-even chart** (Recharts area chart, revenue vs costs over 12 months)
- **P&L summary** with ISOC tax detail (20%/25% Belgian brackets)
- **BFR simulator** with adjustable client/supplier payment delays
- **Revenue stream breakdown** by source
- **Quick navigation** cards to key pages

### Revenue Streams

- **User-configurable** revenue categories (PCMN Class 7)
- **Drag-and-drop** reordering via @dnd-kit (accessible, keyboard-navigable)
- **Per-line** PCMN accounting code, subcategory, per-user pricing toggle
- **Templates** for quick line addition (SaaS subscription, consulting, grants, etc.)
- **Break-even indicator** (revenue vs annual costs)
- **Formatted inputs** via react-number-format (thousands separators)

### Cash Flow & Projections

- **Multi-year projections** (1, 2, 3, or 5 years) with configurable growth rates
- **Revenue growth** and **cost escalation** compound monthly
- **SVG projection chart** with 3 curves (revenue, costs, cumulative cash)
- **Year summary cards** with EBITDA margin badges
- **Break-even month** and **cash-zero month** detection
- **Monthly detail table** with year-end separators

### Sensitivity Analysis

- **Tornado chart** showing EBITDA impact of each variable at +/-10/20/30/50%
- **Business-type adaptive** variables (SaaS: churn, growth, CAC; E-commerce: orders, returns; etc.)
- **Sorted by impact** — largest sensitivity first
- **Educational help** toggle explaining how to read the chart

### Operating Costs

- **6 categories** with PCMN accounting codes (Infrastructure, Software, Marketing, Legal, General, Fixed Assets)
- **Per-unit pricing** toggle (e.g., Figma at X EUR/user x N users)
- **Drag-and-drop** category reordering
- **Cost presets** (Bootstrap / Standard / Scale-up)

### Salary & Team

- **Employee types**: Employee, Student, Intern, Director, Independent/Freelancer
- **Net-to-gross** Belgian calculation (ONSS 13.07%, Precompte 17.23%, Patronal 25.07%)
- **Independent calculator**: social contributions (~20.5%), progressive IPP brackets, quarterly provisionals
- **Shareholder sync** — toggle employees as shareholders, auto-synced to cap table
- **Role presets** by category (Founders, Tech, Business, Ops, Marketing)
- **DRI rule** — 45,000 EUR director remuneration threshold check

### Financial Plan

- **8-section structured plan** (Summary, Problem, Solution, Market, Business Model, Financials, Team, Roadmap)
- **Markdown editor** (@uiw/react-md-editor) for each section
- **Live data cards** intercalated between sections (revenue, costs, EBITDA, headcount)
- **PDF export** with print-optimized layout
- **Expand/collapse all** toggle

### Accounting (PCMN)

- **Full Belgian chart of accounts** (Classes 1-7)
- **Income statement** auto-generated from costs, salaries, revenue streams, debt interest, ISOC
- **VAT reconciliation** (collected vs deductible, quarterly calendar)
- **ISOC tax calendar** with quarterly advance payments
- **Social charge calendar**
- **Print-ready** accounting report

### Financial Ratios

- **Solvency**: equity ratio, financial autonomy, leverage
- **Liquidity**: current ratio, acid test, DSCR
- **Profitability**: net margin, EBITDA margin, ROE, ROA
- **Business**: revenue per employee, salary ratio, cost ratio
- **Cash**: cash position, burn rate, runway
- **Benchmarks** per business type

### Equity & Cap Table

- **ESOP/stock option** grant management with vesting schedules (cliff + monthly)
- **IFRS 2** monthly expense calculation
- **Cap table** with shareholder registry, ownership breakdown
- **Funding round simulator** (pre-money, raise, dilution visualization)
- **Salary-to-shareholder sync**

### Shareholders' Agreement

- **Configurable clauses**: pre-emption, tag-along, drag-along, liquidation preference, vesting, anti-dilution
- **Governance rules**: board composition, voting thresholds, deadlock resolution
- **Tooltips** explaining each clause

### Debt & Financing

- **Loan simulator** with amortization schedules
- **DSCR** (Debt Service Coverage Ratio) calculation
- **Multiple loan types**: bank, innovation, subsidy
- **Debt ratio** monitoring

### Depreciation

- **Asset management** with linear and declining balance depreciation
- **Per-asset** useful life configuration
- **Annual depreciation** schedule

---

## Business Types

Forecrest adapts its KPIs, calculations, and settings based on your business type:

| Type | Specific KPIs |
|------|--------------|
| **SaaS** | MRR, ARR, NRR, Expansion/Contraction MRR, Quick Ratio, Rule of 40, LTV, CAC, LTV/CAC, Payback, Churn |
| **E-commerce** | GMV, AOV, Conversion Rate, Cart Abandonment, Repeat Purchase, Return Rate, Shipping Ratio, Contribution Margin, CLV |
| **Retail** | Revenue/m2, Sales/Employee, Footfall Conversion, Avg Transaction, Items/Transaction, Shrinkage |
| **Services** | Billable Utilization, Hourly Rate, Revenue/Consultant, Project Margin, Pipeline Coverage, Client Retention |
| **Freelancer** | Daily Rate, Days Billed, Utilization, Revenue/Day, Social Contributions, IPP Tax, Quarterly Payments |

---

## Belgian Fiscal Framework

- **ISOC** (corporate tax): 20% PME rate on first 100K, 25% standard rate
- **TVA** (VAT): configurable rate (default 21%), regime selection (monthly/quarterly/exempt)
- **ONSS**: employee social security (13.07%), employer contributions (25.07%)
- **Precompte professionnel**: withholding tax (17.23%)
- **IPP**: progressive personal income tax for independents (25/40/45/50% brackets)
- **DRI**: innovation income deduction (85% deductible for software/patents)
- **VVPRbis**: reduced dividend withholding (15% vs 30%)
- **Reserve legale**: legal reserve requirement (10% of capital)
- **PCMN**: Belgian chart of accounts (Plan Comptable Minimum Normalise)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 |
| Build | Vite 6 |
| Styling | Inline styles + CSS custom properties (design tokens) |
| Charts | Recharts 3 + custom SVG |
| Animations | GSAP 3 |
| Icons | Phosphor Icons |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Inputs | react-number-format |
| Markdown | @uiw/react-md-editor |
| Tables | @tanstack/react-table |
| Shortcuts | react-hotkeys-hook |
| Testing | Vitest 4 (240 tests) |
| i18n | Custom (FR primary, EN secondary) |

---

## Design System

- **Typography**: Bricolage Grotesque (headings/KPIs), DM Sans (body/UI)
- **Color palette**: Warm parchment (#EDE8DF bg, #F7F4EE cards, #E8431A coral accent)
- **Dark mode**: Full dark theme with circle-clip animation toggle
- **Accessibility**: WCAG AA contrast, 44px minimum touch targets, font scale slider (85%-130%)
- **Accent colors**: Configurable brand color (coral, blue, green, purple, orange)

---

## Quick Start

```bash
npm install
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build (dist/)
npm run preview      # Preview production build
npm test             # Run all 240 tests
```

## Docker

```bash
docker build -t forecrest .
docker run -p 3000:80 forecrest
```

---

## Project Structure

```
src/
├── App.jsx                 # Central state, routing, financial calculations
├── main.jsx                # Entry point (ErrorBoundary + providers)
├── components/             # 33 reusable UI components
│   ├── Sidebar.jsx         # Collapsible sidebar with profile footer
│   ├── SensitivityChart.jsx # Tornado chart (sensitivity analysis)
│   ├── BreakEvenChart.jsx  # Recharts area chart
│   ├── CurrencyInput.jsx   # Formatted numeric input (react-number-format)
│   ├── ExplainerBox.jsx    # Educational info/warning/tip boxes
│   ├── DevCommandPalette.jsx # Dev-only command palette (Ctrl+Shift+K)
│   └── ...
├── constants/
│   ├── config.js           # DEFAULT_CONFIG (70+ fields), VERSION
│   ├── defaults.js         # Cost/salary/revenue/equity defaults, PCMN codes
│   ├── colors.js           # Color tokens, accent palette
│   └── changelog.js        # Version history
├── context/                # Theme, Language, DevMode providers
├── hooks/
│   ├── useHistory.js       # Undo/redo (Ctrl+Z / Ctrl+Shift+Z)
│   └── useRecentPages.js   # Recent page tracking (Figma-style)
├── i18n/                   # FR (primary) + EN translations
├── pages/                  # 21 page components
│   ├── OverviewPage.jsx    # Dashboard with dynamic per-type KPIs
│   ├── CashFlowPage.jsx    # Multi-year projections with growth curves
│   ├── SensitivityPage.jsx # Tornado sensitivity analysis
│   ├── DebugCalculationsPage.jsx  # Dev-only calculation inspector
│   ├── TooltipRegistryPage.jsx    # Dev-only tooltip catalog
│   └── ...
└── utils/
    ├── calculations.js     # Core financial engine (ISOC, salary, projections)
    ├── kpis.js             # Business-type KPI calculator (SaaS/E-com/Retail/Services/Freelancer)
    ├── formatters.js       # EUR, PCT, number formatting
    ├── storage.js          # localStorage persistence
    └── printReport.js      # PDF/print report generation
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1`-`9` | Jump to page |
| `Ctrl+K` | Command palette |
| `Ctrl+Shift+K` | Dev command palette (dev mode only) |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Export / Import |
| `Ctrl+P` | Presentation mode |
| `Ctrl+Shift+D` | Toggle developer mode |
| `?` | Keyboard shortcuts |

---

## Developer Mode

Toggle with `Ctrl+Shift+D`. When active:

- **DevVal tooltips**: hover any financial value to see its formula
- **DevBanner**: technical info bar at the top
- **Dev Command Palette** (`Ctrl+Shift+K`): access hidden dev pages
  - **Tooltip Registry**: catalog of all 60+ InfoTip tooltips
  - **Debug Calculations**: full calculation breakdown with inputs, formulas, results

---

## Credits

Made with love by **[Glow Up](https://glow-up.app)**

Created by Thomas Voituron with Claude Code (Anthropic)

---

## License

Private project. All rights reserved.
