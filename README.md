# Forecrest

**Plan your finances. Launch your business.**

Forecrest is a financial planning tool for founders and startups. It turns your assumptions into a structured financial plan: revenue, costs, cash flow, taxes, cap table — everything is connected, everything updates in real time.

No finance degree required. Every concept comes with plain-language explanations, contextual tooltips, and a built-in glossary. You build, your accountant validates.

---

## Who is it for?

- **First-time founders** who have never written a financial plan
- **Belgian accountants** supporting startups (PCMN, ISOC, VAT, ONSS built in)
- **Incubators and advisors** who need a structured tool to coach entrepreneurs

---

## What you can do

### Model your revenue

Define your revenue sources with 10 different behaviors: recurring subscription, per transaction, per user, daily rate, hourly, commission, royalty, one-time project, and more. Each line has its own VAT rate, frequency, and volume. Subsidies from the Financing page appear automatically.

### Plan your costs

10 cost categories mapped to Belgian accounting codes (PCMN). Costs tied to salaries, equipment, inventory, financing, and crowdfunding are auto-generated from their respective pages — read-only, with a direct link back to the source.

Three presets to get started fast: Bootstrap (bare minimum), Standard (typical SME), Scale-up (high growth).

### Manage your team

Calculate the real cost of each team member: gross salary, employer ONSS (25%), withholding tax, benefits. Supports employees, students, interns, directors, and freelancers. Each profile has its own calculation logic (Belgian net-to-gross, social contributions, progressive IPP brackets).

Team members can be synced as shareholders in the cap table.

### Track equipment and depreciation

Record your fixed assets with Belgian legal durations (3 years for IT, 5 for furniture, 10 for vehicles...). Linear or declining depreciation. Annual charges are automatically pushed to the Costs page.

### Manage inventory

5 stock categories (PCMN Class 3): merchandise, raw materials, supplies, work in progress, finished goods. Automatic KPIs: stock value, COGS/month, rotation in days, coverage in months. Purchases sync to the Costs page.

### Project your cash flow

Multi-year projections (1 to 5 years) with revenue growth and cost escalation compounding monthly. SVG chart with 3 curves (revenue, costs, cumulative cash). Automatic detection of break-even month and cash-zero month.

### Finance your project

Loan simulator with amortization schedules. Three types: bank loan, innovation loan, subsidy (auto-synced to Revenue as PCMN 7300). DSCR calculation and debt ratio monitoring.

### Launch a crowdfunding campaign

Guided wizard: platform selection, goal, dates, commission preview. Per-tier backer tracking (actual vs planned). Full lifecycle: planning, active campaign, final report.

### Structure your cap table

Shareholder management with 3 share classes. Fundraising round simulator (pre-money, raise amount, dilution, post-money). ESOP plans with vesting and cliff. Interactive capital distribution chart.

### Draft your shareholders' agreement

Configurable clauses: pre-emption, tag-along, drag-along, lock-up, vesting. Governance rules with Belgian company code references (CSA 2019).

### Analyze financial ratios

5 ratio families: solvency, liquidity, profitability, activity, cash. Each ratio comes with interpretation thresholds and a glossary link.

### Understand your sensitivity

Tornado chart showing the impact of each variable on your EBITDA at +/-10/20/30/50%. Variables adapt to your business type.

---

## Business types

Forecrest adapts to your business model:

| Type | Specific KPIs |
|------|--------------|
| **SaaS** | MRR, ARR, NRR, Quick Ratio, Rule of 40, LTV, CAC, Churn |
| **E-commerce** | GMV, AOV, Conversion Rate, Return Rate, CLV |
| **Retail** | Revenue/sqm, Sales/Employee, Avg Transaction |
| **Services** | Billable Utilization, Revenue/Consultant, Project Margin |
| **Freelancer** | Daily Rate, Days Billed, Social Contributions, IPP Tax |

---

## Belgian tax framework

Forecrest embeds Belgian fiscal rules out of the box:

- **ISOC** (corporate tax): 20% SME rate on first 100K, 25% standard rate
- **VAT**: per-line rates (0%, 6%, 12%, 21%), quarterly or monthly regime
- **ONSS**: employee (13.07%) and employer (25.07%) contributions
- **Withholding tax**: 17.23% professional withholding
- **IPP**: progressive personal income tax for self-employed (25/40/45/50%)
- **PCMN**: Belgian chart of accounts (Classes 1-7)
- **VVPRbis**: reduced dividend tax rate (15% under conditions)

---

## Cross-page automations

Everything is connected. When you change a value, dependent pages update automatically:

| Source | Target | PCMN Code |
|--------|--------|-----------|
| Inventory | Costs (purchases) | 6000 / 6010 / 6040 |
| Team | Costs (benefits) | 6130 |
| Equipment | Costs (depreciation) | 6302 |
| Financing | Costs (interest) | 6500 |
| Financing | Revenue (subsidies) | 7300 |
| Crowdfunding | Costs (rewards) | 6160 |
| Team | Shareholders (partners) | 1000 |

Auto-generated items are read-only with a navigation link to the source page.

---

## Navigation

```
Overview

My Business
  Revenue, Costs, Team, Equipment, Inventory

My Finances
  Cash Flow, Financing, Crowdfunding

My Documents
  Income Statement, Balance Sheet, Accounting

My Analysis
  Ratios, Sensitivity

My Company
  ESOP, Shareholders, Pact
```

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Ctrl+S` | Export / Import |
| `Ctrl+P` | Presentation mode |
| `Ctrl+G` | Financial glossary |
| `Ctrl+Shift+D` | Developer mode |
| `Ctrl+Shift+E` | Accounting mode (PCMN codes) |

---

## Tech stack

| | |
|----------|-----------|
| Framework | React 18 |
| Build | Vite 6 |
| Styling | Inline styles + CSS custom properties |
| Charts | Recharts 3 + custom SVG |
| Animations | GSAP 3 |
| Icons | Phosphor Icons |
| Tables | @tanstack/react-table |
| Testing | Vitest 4 (205 tests) |
| i18n | FR (primary) / EN |

---

## Design

- **Typography**: Bricolage Grotesque (headings, KPIs) + DM Sans (body, UI)
- **Palette**: warm parchment tones (#EDE8DF background, #F7F4EE cards, #E8431A coral accent)
- **Dark mode**: full dark theme with circle-clip animation toggle
- **Accessibility**: WCAG AA contrast, 44px minimum touch targets
- **Accent color**: configurable (coral, blue, green, purple, orange)

---

## Getting started

```bash
npm install
npm run dev        # Dev server (http://localhost:5173)
npm run build      # Production build (dist/)
npm test           # 205 tests
```

---

## Developer mode

Toggle with `Ctrl+Shift+D`:

- **DevVal**: hover any financial value to see its formula
- **DevBanner**: technical info bar at the top of the page
- **Dev tools**: randomize and clear data in tables
- **Dev pages**: Roadmap (12 phases, 70+ items), Sitemap, Design Tokens, Debug Calculations

---

## Credits

Created by **Thomas Voituron** with [Claude Code](https://claude.ai/claude-code) (Anthropic)

---

## License

Private project. All rights reserved.
