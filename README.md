# Forecrest

**Forecrest** (Forecast + Crest) is a financial planning tool for startups, built for the Belgian fiscal framework. It helps founders structure their business plan step by step — from revenue projections to ISOC tax calculations, cap table management, and multi-year cash flow forecasting.

Designed for entrepreneurs with no financial expertise: every concept comes with plain-language explanations and a built-in glossary. Accountants validate, Forecrest structures.

---

## Features

### Dashboard & Overview

- **Greeting with time-of-day** (Bonjour / Bon après-midi / Bonsoir)
- **4 key KPIs** with sparklines: Revenue, MRR, Costs, Treasury
- **Health score donut** (profitability, liquidity, solvency)
- **Break-even chart** (Recharts area chart, revenue vs costs over 12 months)
- **P&L summary** with ISOC tax detail (20%/25% Belgian brackets)
- **BFR simulator** with adjustable client/supplier payment delays
- **Revenue stream breakdown** by source
- **Quick navigation** cards to key pages

### Revenue Streams

- **10 revenue behaviors** (recurring, per transaction, per user, project, daily rate, hourly, commission, royalty, one-time — subsidy auto-generated from Financing)
- **Per-line TVA rate** (0%, 6%, 12%, 21%) with category defaults
- **PCMN Class 7** accounting codes in accounting mode
- **Chart palette** toggle (brand gradient / multi WCAG colors)
- **ChartLegend** with blur + expand for long lists
- **Auto-generated subsidies** from Financing page (read-only, linked)

### Cash Flow & Projections

- **Multi-year projections** (1, 2, 3, or 5 years) with configurable growth rates
- **Revenue growth** and **cost escalation** compound monthly
- **SVG projection chart** with 3 curves (revenue, costs, cumulative cash)
- **Year summary cards** with EBITDA margin badges
- **Break-even month** and **cash-zero month** detection

### Sensitivity Analysis

- **Tornado chart** showing EBITDA impact of each variable at +/-10/20/30/50%
- **Business-type adaptive** variables (SaaS: churn, growth, CAC; E-commerce: orders, returns)
- **Sorted by impact** — largest sensitivity first

### Operating Costs

- **10 categories** with PCMN codes: Premises, Software, Marketing, Professional, Insurance, Travel, Taxes, Non-recurring, Other
- **Auto-generated costs** from: Equipment (depreciation 6302), Team (benefits 6130), Financing (interest 6500), Crowdfunding (rewards 6160), Stocks (purchases 6000)
- **Per-unit pricing** toggle, cost presets (Bootstrap / Standard / Scale-up)
- **Linked items** with navigation back to source page

### Salary & Team

- **Employee types**: Employee, Student, Intern, Director, Independent/Freelancer
- **Net-to-gross** Belgian calculation (ONSS 13.07%, Précompte 17.23%, Patronal 25.07%)
- **Independent calculator**: social contributions (~20.5%), progressive IPP brackets
- **Shareholder sync** — toggle team members as shareholders, auto-synced to cap table
- **DRI rule** — 45,000 EUR director remuneration threshold check

### Stocks & Inventory

- **5 categories** (PCMN Class 3): Merchandise, Raw materials, Supplies, Work in progress, Finished goods
- **Split-panel modal** with category selection + form
- **KPIs**: Stock value, COGS/month, Rotation (days), Coverage (months)
- **Auto-sync** with Charges page (monthly purchase costs PCMN 6000)

### Financial Statements

- **Income Statement** (Compte de résultat): PCMN P&L projected 1-5 years with cost escalation
- **Balance Sheet** (Bilan): Actif/Passif projected 1-3 years, cash derived from balance equation
- **Accounting page**: Full PCMN chart, VAT reconciliation, ISOC calendar

### Cap Table & Shareholders

- **DataTable** with sort, search, filter by share class
- **Split-panel modal** with 3 classes: Ordinaires, Préférentielles, Parts réservées à l'équipe
- **Capital distribution donut** with PaletteToggle
- **Round simulator** as dedicated tab (pre-money, raise, dilution, post-money ownership)
- **Team-linked shareholders**: edit shares/price, navigate to Team page
- **ESOP summary** bar with vested shares, strike value, fully diluted %

### Crowdfunding

- **Wizard setup flow** (reusable component) — platform selection, dates, goal, commission preview
- **Per-tier backer tracking** with actual vs planned
- **Status lifecycle**: planning → active → ended (config locked, countdown, bilan banner)
- **URL validation** with platform domain check

### Debt & Financing

- **Loan simulator** with amortization schedules
- **Multiple types**: bank, innovation, subsidy (auto-synced to Revenue as PCMN 7300)
- **DSCR** calculation, debt ratio monitoring

### Financial Ratios

- **Solvency**: equity ratio, financial autonomy, leverage
- **Liquidity**: current ratio, acid test, DSCR
- **Profitability**: net margin, EBITDA margin, ROE, ROA
- **Business**: revenue per employee, salary ratio, cost ratio
- **Cash**: cash position, burn rate, runway

### Shareholders' Agreement

- **Configurable clauses**: pre-emption, tag-along, drag-along, lock-up, vesting
- **Governance rules**: board composition, voting thresholds, reserved matters
- **Belgian CSA references** with article citations

---

## Navigation

Sidebar with beginner-friendly labels:

```
Vue d'ensemble
─ Mon activité      (Revenus, Charges, Équipe, Équipements, Stocks)
─ Mon argent        (Trésorerie, Financement, Crowdfunding)
─ Mes documents     (Résultat, Bilan, Comptabilité)
─ Mon analyse       (Ratios, Sensibilité)
─ Ma société        (Intéressement, Actionnaires, Pacte)
```

---

## Cross-page Automations

| Source | Target | PCMN | Status |
|--------|--------|------|--------|
| Stocks | Charges (purchases) | 6000/6010/6040 | ✅ |
| Team | Charges (benefits) | 6130 | ✅ |
| Equipment | Charges (depreciation) | 6302 | ✅ |
| Financing | Charges (interest) | 6500 | ✅ |
| Financing | Revenue (subsidies) | 7300 | ✅ |
| Crowdfunding | Charges (rewards) | 6160 | ✅ |
| Team | Shareholders (partners) | 1000 | ✅ |

---

## Business Types

| Type | Specific KPIs |
|------|--------------|
| **SaaS** | MRR, ARR, NRR, Quick Ratio, Rule of 40, LTV, CAC, Churn |
| **E-commerce** | GMV, AOV, Conversion Rate, Return Rate, CLV |
| **Retail** | Revenue/m², Sales/Employee, Avg Transaction |
| **Services** | Billable Utilization, Revenue/Consultant, Project Margin |
| **Freelancer** | Daily Rate, Days Billed, Social Contributions, IPP Tax |

---

## Belgian Fiscal Framework

- **ISOC** (corporate tax): 20% PME rate on first 100K, 25% standard rate
- **TVA** (VAT): per-line rates (0%, 6%, 12%, 21%), visible in accounting mode only
- **ONSS**: employee (13.07%), employer contributions (25.07%)
- **Précompte professionnel**: withholding tax (17.23%)
- **IPP**: progressive personal income tax for independents (25/40/45/50%)
- **PCMN**: Belgian chart of accounts (Classes 1-7)
- **CSA 2019**: company code references throughout

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
| Tables | @tanstack/react-table |
| Shortcuts | react-hotkeys-hook |
| Testing | Vitest 4 (205 tests) |
| i18n | Custom (FR primary, EN secondary) |

---

## Design System

- **Typography**: Bricolage Grotesque (headings/KPIs), DM Sans (body/UI)
- **Color palette**: Warm parchment (#EDE8DF bg, #F7F4EE cards, #E8431A coral accent)
- **Dark mode**: Full dark theme with circle-clip animation toggle
- **Accessibility**: WCAG AA contrast, 44px minimum touch targets
- **Accent colors**: Configurable brand color (coral, blue, green, purple, orange)
- **Chart palette**: Brand gradient (dynamic from accent) or Multi (8 distinct WCAG colors)

---

## Quick Start

```bash
npm install
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build (dist/)
npm run preview      # Preview production build
npm test             # Run all 205 tests
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Ctrl+S` | Export / Import |
| `Ctrl+P` | Presentation mode |
| `Ctrl+Shift+D` | Toggle developer mode |
| `Ctrl+Shift+E` | Toggle accounting mode |
| `←` / `→` / `Enter` | Wizard navigation |

---

## Developer Mode

Toggle with `Ctrl+Shift+D`. When active:

- **DevVal tooltips**: hover any financial value to see its formula
- **DevBanner**: technical info bar at the top
- **Dev tools** in DataTable toolbar (Randomize, Clear — preserves linked items)
- **Dev pages**: Roadmap (12 phases, 70+ items, PCMN progress), Sitemap, Tooltip Registry, Debug Calculations, Design Tokens

---

## Roadmap

12 phases planned — see dev-only Roadmap page (`Ctrl+Shift+D`):

1. Financial Statements (income statement ✅, balance sheet ✅, financing plan, cash flow)
2. Analysis & Ratios (BFR, budget vs actual, scenarios, KPI dashboard)
3. Belgian Compliance (TVA calendar, ISOC prepayments, subsidies database, support structures map)
4. Payment Integrations (Stripe, Mollie, Shopify, Payconiq, SumUp)
5. UX & Navigation (sidebar ✅, wizard component ✅, onboarding 2.0, first-visit wizards)
6. Multi-access & Roles (founder/accountant/advisor, sharing, comments, audit trail)
7. Export & Reports (PDF business plan, Excel, investor deck, board report)
8. Intelligence & Benchmarks (industry benchmarks, anomaly detection, milestones)
9. Legal Documents (AG, CA, annual report, incorporation, shareholder agreement)
10. Cross-page Automations (7 done ✅, 6 remaining: TVA→bilan, ONSS, ISOC provision, DSO/DPO)
11. Premium Modules (Marketing, Cloud infra, E-commerce, SaaS Metrics, HR, Fundraising, Marketplace, Horeca, Freelance, Real estate, Import/Export)
12. Smart Suggestions (rule-based engine, sidebar dot notifications, in-page suggestion banners)

---

## Credits

Made with love by **[Glow Up](https://glow-up.app)**

Created by Thomas Voituron with Claude Code (Anthropic)

---

## License

Private project. All rights reserved.
