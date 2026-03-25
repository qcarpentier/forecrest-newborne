import { PageLayout } from "../components";
import { useT, useLang } from "../context";
import { VERSION, RELEASE_DATE } from "../constants/config";

/**
 * Sitemap & Documentation — Dev-only page.
 * Lists all pages, components, utils, and data flows.
 * Update this page with each version bump.
 */

var PAGES = [
  { group: { fr: "Principal", en: "Main" }, items: [
    { tab: "overview", label: "Vue d'ensemble", file: "OverviewPage.jsx", desc: { fr: "Synthèse financière avec onglets Simple/Avancé. KPIs dynamiques par type d'activité.", en: "Financial summary with Simple/Advanced tabs. Dynamic KPIs by business type." }, props: "cfg, streams, costs, sals, debts, assets, grants, crowdfunding, totalRevenue, monthlyCosts, ebitda, netP, isoc, annVatC/D, vatBalance" },
  ]},
  { group: { fr: "Prévisionnel", en: "Forecast" }, items: [
    { tab: "streams", label: "Revenus", file: "RevenueStreamsPage.jsx", desc: { fr: "Sources de revenus avec 9 comportements (recurring, project, hourly...). DataTable + modal split-panel. Donut par catégorie.", en: "Revenue sources with 9 behaviors. DataTable + split-panel modal. Category donut." }, props: "streams, setStreams, annC, businessType, chartPalette" },
    { tab: "opex", label: "Charges", file: "OperatingCostsPage.jsx", desc: { fr: "Charges d'exploitation avec 10 catégories PCMN. Auto-items (amortissements, intérêts, avantages, crowdfunding). TVA par ligne.", en: "Operating costs with 10 PCMN categories. Auto-items. Per-line VAT." }, props: "costs, setCosts, cfg, totalRevenue, debts, assets, sals, crowdfunding, chartPalette" },
    { tab: "salaries", label: "Rémunérations", file: "SalaryPage.jsx", desc: { fr: "6 types de contrat (employé, administrateur, indépendant, intérimaire, étudiant, stagiaire). ATN avec leasing/achat. Auto-création dans équipements.", en: "6 contract types. Benefits with lease/purchase. Auto-creation in equipment." }, props: "sals, setSals, cfg, salCosts, arrV, assets, setAssets, chartPalette" },
    { tab: "equipment", label: "Équipements", file: "AmortissementPage.jsx", desc: { fr: "Immobilisations (classes 2x PCMN) avec amortissement linéaire/dégressif. Tableau d'amortissement. Liens salaires.", en: "Fixed assets (PCMN class 2x) with linear/declining depreciation. Schedule. Salary links." }, props: "assets, setAssets, cfg, chartPalette" },
  ]},
  { group: { fr: "Financement", en: "Financing" }, items: [
    { tab: "cashflow", label: "Trésorerie", file: "CashFlowPage.jsx", desc: { fr: "Projection de trésorerie multi-années. Insight cards (cash, runway, croissance). Chart Recharts.", en: "Multi-year cash projection. Insight cards (cash, runway, growth). Recharts chart." }, props: "totalRevenue, monthlyCosts, annC, ebitda, cfg, setCfg" },
    { tab: "debt", label: "Financement", file: "DebtPage.jsx", desc: { fr: "7 types de dette (banque, crédit, leasing, prêt, subside, avance, convertible). Échéancier. Ratio d'endettement.", en: "7 debt types. Repayment schedule. Debt ratio." }, props: "debts, setDebts, ebitda, capitalSocial, crowdfunding, chartPalette" },
    { tab: "crowdfunding", label: "Crowdfunding", file: "CrowdfundingPage.jsx", desc: { fr: "Wizard d'activation (4 étapes). 6 plateformes. Gestion des paliers avec prix/coût. Résultats avec backers par palier. Lifecycle (planning/active/ended).", en: "Activation wizard (4 steps). 6 platforms. Tier management with price/cost. Per-tier backers results. Lifecycle." }, props: "crowdfunding, setCrowdfunding, chartPalette" },
  ]},
  { group: { fr: "Comptabilité", en: "Accounting" }, items: [
    { tab: "accounting", label: "Comptabilité", file: "AccountingPage.jsx", desc: { fr: "Comptabilité complète : KPIs avec glossaire, mini P&L/bilan, plan comptable PCMN pliable par classe, export CSV/belge, navigation vers pages source.", en: "Full accounting: KPIs with glossary, mini P&L/balance, PCMN chart of accounts collapsible by class, CSV/Belgian export, navigation to source pages." }, props: "costs, sals, cfg, debts, streams, stocks, totalRevenue, monthlyCosts, opCosts, salCosts, ebitda, isoc, netP, resLeg, annVatC/D, vatBalance, esopMonthly/Enabled, setCosts, onNavigate" },
    { tab: "ratios", label: "Ratios", file: "RatiosPage.jsx", desc: { fr: "Page minimale — sera refactorisée avec BFR (phase 2 roadmap).", en: "Minimal page — will be refactored with working capital (roadmap phase 2)." }, props: "cfg" },
    { tab: "sensitivity", label: "Sensibilité", file: "SensitivityPage.jsx", desc: { fr: "Tornado chart : impact de chaque paramètre sur l'EBITDA. Analyse what-if.", en: "Tornado chart: impact of each parameter on EBITDA. What-if analysis." }, props: "totalRevenue, monthlyCosts, salCosts, ebitda, cfg" },
  ]},
  { group: { fr: "Gouvernance", en: "Governance" }, items: [
    { tab: "equity", label: "Intéressement (ESOP)", file: "EquityPage.jsx", desc: { fr: "Refonte complète : wizard d'activation, DataTable avec bons de souscription et options sur actions, liaison employés, auto-sync ESOP vers cap table, terminologie simplifiée.", en: "Complete redesign: activation wizard, DataTable with subscription warrants and stock options, employee linking, auto-sync ESOP to cap table, simplified terminology." }, props: "grants, setGrants, poolSize, setPoolSize, esopEnabled, setEsopEnabled, sals, shareholders, setShareholders" },
    { tab: "captable", label: "Cap Table", file: "CapTablePage.jsx", desc: { fr: "Table de capitalisation avec DataTable, modale split-panel par classe d'actions, donut de répartition, simulateur de levée. Recherche, filtrage, tri.", en: "Cap table with DataTable, split-panel modal per share class, distribution donut, round simulator. Search, filter, sort." }, props: "shareholders, setShareholders, roundSim, setRoundSim, grants, sals, cfg, setCfg, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb" },
    { tab: "pact", label: "Pacte", file: "PactPage.jsx", desc: { fr: "Clauses du pacte d'actionnaires configurables.", en: "Configurable shareholder agreement clauses." }, props: "cfg, setCfg" },
  ]},
  { group: { fr: "Boîte à outils", en: "Toolkit" }, items: [
    { tab: "tool_qr", label: "QR Code", file: "ToolsPage.jsx", desc: { fr: "Générateur de QR code : 9 types (URL, texte, email, téléphone, WiFi, vCard, SMS, localisation, événement). Thèmes de couleurs, logo au centre, copie presse-papier, historique persisté.", en: "QR code generator: 9 types (URL, text, email, phone, WiFi, vCard, SMS, location, event). Color themes, center logo, clipboard copy, persisted history." }, props: "activeTab" },
    { tab: "tool_domain", label: "Domaines", file: "ToolsPage.jsx (DomainChecker)", desc: { fr: "Vérificateur de nom de domaine : 15 TLDs, score de qualité, suggestions de noms, watchlist avec export CSV, comparateur de registrars (OVH, Gandi, Namecheap, Infomaniak), historique des recherches.", en: "Domain name checker: 15 TLDs, quality score, name suggestions, watchlist with CSV export, registrar comparison (OVH, Gandi, Namecheap, Infomaniak), search history." }, props: "activeTab" },
  ]},
  { group: { fr: "Système", en: "System" }, items: [
    { tab: "profile", label: "Profil", file: "ProfilePage.jsx", desc: { fr: "Informations entreprise, responsable légal, couleur d'accent.", en: "Company info, legal representative, accent color." }, props: "cfg, setCfg" },
    { tab: "set", label: "Paramètres", file: "SettingsPage.jsx", desc: { fr: "Fiscalité, comptabilité, apparence, alertes, raccourcis.", en: "Fiscal, accounting, appearance, alerts, shortcuts." }, props: "cfg, setCfg" },
    { tab: "changelog", label: "Notes de version", file: "ChangelogPage.jsx", desc: { fr: "Changelog auto-généré depuis changelog.js + i18n.", en: "Auto-generated changelog from changelog.js + i18n." }, props: "" },
    { tab: "credits", label: "Crédits", file: "CreditsPage.jsx", desc: { fr: "Licences open-source de toutes les dépendances.", en: "Open-source licenses of all dependencies." }, props: "" },
  ]},
  { group: { fr: "Dev uniquement", en: "Dev only" }, items: [
    { tab: "dev-roadmap", label: "Roadmap", file: "RoadmapPage.jsx", desc: { fr: "Fonctionnalités planifiées par phase. Progression globale.", en: "Planned features by phase. Overall progress." }, props: "" },
    { tab: "dev-sitemap", label: "Sitemap", file: "SitemapPage.jsx", desc: { fr: "Cette page. Architecture des pages, composants et flux de données.", en: "This page. Page architecture, components and data flows." }, props: "" },
    { tab: "dev-calc", label: "Debug Calculs", file: "DebugCalculationsPage.jsx", desc: { fr: "Toutes les formules financières avec inputs, étapes et résultats.", en: "All financial formulas with inputs, steps and results." }, props: "cfg, totalRevenue, monthlyCosts, ebitda, netP, ..." },
    { tab: "dev-tokens", label: "Design Tokens", file: "DesignTokensPage.jsx", desc: { fr: "Variables CSS, couleurs, espacements, rayons.", en: "CSS variables, colors, spacing, radii." }, props: "" },
    { tab: "dev-tooltips", label: "Tooltip Registry", file: "TooltipRegistryPage.jsx", desc: { fr: "Tous les InfoTip de l'application.", en: "All InfoTip tooltips in the application." }, props: "" },
  ]},
];

var COMPONENTS = [
  { name: "PageLayout", file: "PageLayout.jsx", desc: "Page wrapper with title, subtitle, actions, footer, shortcuts modal" },
  { name: "DataTable", file: "DataTable.jsx", desc: "TanStack React Table wrapper with sorting, footer, toolbar, empty state" },
  { name: "Modal", file: "Modal.jsx", desc: "Portal-based modal with sizes (sm/md/lg), ModalFooter, ModalBody" },
  { name: "KpiCard", file: "KpiCard.jsx", desc: "KPI card with value, fullValue tooltip, progress bar, glossaryKey" },
  { name: "Card", file: "Card.jsx", desc: "Base card with border, radius, padding, onClick" },
  { name: "Button", file: "Button.jsx", desc: "Button with 6 colors (primary/secondary/tertiary/brand/link), 3 sizes, iconLeading/Trailing" },
  { name: "ButtonUtility", file: "ButtonUtility.jsx", desc: "Icon-only button (default/danger/brand), 40px touch target" },
  { name: "SelectDropdown", file: "SelectDropdown.jsx", desc: "Custom select with portal dropdown, clearable" },
  { name: "DatePicker", file: "DatePicker.jsx", desc: "Custom calendar dropdown replacing native date input, i18n FR/EN" },
  { name: "PaletteToggle", file: "PaletteToggle.jsx", desc: "Chart palette switcher (brand gradient / multi colors)" },
  { name: "CurrencyInput", file: "CurrencyInput.jsx", desc: "Formatted currency input with react-number-format" },
  { name: "NumberField", file: "NumberField.jsx", desc: "Numeric input with min/max/step, optional pct/suffix" },
  { name: "Badge", file: "Badge.jsx", desc: "Status badge (gray/brand/error/warning/success/info), dot variant" },
  { name: "SearchInput", file: "SearchInput.jsx", desc: "Search field with magnifying glass icon" },
  { name: "FilterDropdown", file: "FilterDropdown.jsx", desc: "Category filter dropdown for DataTable" },
  { name: "ActionBtn", file: "ActionBtn.jsx", desc: "Compact action button for table rows (edit/clone/delete)" },
  { name: "ConfirmDeleteModal", file: "ConfirmDeleteModal.jsx", desc: "Shared delete confirmation with skip option" },
  { name: "Tooltip", file: "Tooltip.jsx", desc: "Portal tooltip with placement, arrow, delay" },
  { name: "FinanceLink", file: "FinanceLink.jsx", desc: "Inline glossary link with tooltip preview" },
  { name: "GlossaryDrawer", file: "GlossaryDrawer.jsx", desc: "Side drawer for glossary terms, GlossaryFab FAB button" },
  { name: "BreakEvenChart", file: "BreakEvenChart.jsx", desc: "Recharts area chart (revenue vs costs)" },
  { name: "DevVal", file: "DevVal.jsx", desc: "Dev mode formula tooltip on financial values" },
  { name: "ExportImportModal", file: "ExportImportModal.jsx", desc: "JSON export/import + shareable link" },
  { name: "ErrorBoundary", file: "ErrorBoundary.jsx", desc: "Class component catch for render errors" },
  { name: "ChartLegend", file: "ChartLegend.jsx", desc: "Legend with blur + expand for long lists (max 5 visible)" },
  { name: "Wizard", file: "Wizard.jsx", desc: "Reusable multi-step wizard with progress bar, keyboard nav, skip, canAdvance" },
  { name: "FloatingToolbar", file: "FloatingToolbar.jsx", desc: "Bottom-center dock with module capsule, quick nav, blur backdrop, auto-shrink" },
  { name: "NotificationContext", file: "context/NotificationContext.jsx", desc: "Notification dot provider with highlight animation, sidebar integration" },
  { name: "useNotifications", file: "context/useNotifications.js", desc: "Hook for notification dot state: add, dismiss, check per-tab dots" },
];

var UTILS = [
  { name: "calculations.js", desc: "salCalc, calcIsoc, indepCalc, grantCalc, projectFinancials, calcHealthScore" },
  { name: "revenueCalc.js", desc: "calcStreamMonthly/Annual, calcTotalRevenue/MRR, monthly breakdown, PCMN mapping" },
  { name: "tvaCalc.js", desc: "Per-line TVA engine with validation, guards, NaN safety. calcVatCollected/Deductible/Balance" },
  { name: "crowdfundingCalc.js", desc: "calcTiersCost, calcCommissionAmount, calcNetMargin, calcActualRaised, calcProgress" },
  { name: "kpis.js", desc: "calcBusinessKpis per business type (SaaS, e-commerce, retail, services, freelancer)" },
  { name: "formatters.js", desc: "eur, eurShort, pct, nm — currency and number formatting with i18n locale" },
  { name: "storage.js", desc: "localStorage load/save with JSON serialization" },
  { name: "printReport.js", desc: "PDF/print report generation for investor report" },
  { name: "stockCalc.js", desc: "calcStockValue, calcMonthlyCogs, calcStockRotation, calcStockVariation, calcStockCoverage" },
];

export default function SitemapPage() {
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";

  return (
    <PageLayout title="Sitemap" subtitle={"v" + VERSION + " (" + RELEASE_DATE + ") — " + (lk === "fr" ? "Architecture et documentation technique." : "Architecture and technical documentation.")}>

      {/* Pages */}
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-4)" }}>
          {lk === "fr" ? "Pages" : "Pages"} ({PAGES.reduce(function (n, g) { return n + g.items.length; }, 0)})
        </div>
        {PAGES.map(function (group) {
          return (
            <div key={group.group[lk]} style={{ marginBottom: "var(--sp-6)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>{group.group[lk]}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
                {group.items.map(function (page) {
                  return (
                    <div key={page.tab} style={{ display: "grid", gridTemplateColumns: "120px 180px 1fr", gap: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-sm)", background: "var(--bg-card)", border: "1px solid var(--border-light)", alignItems: "start" }}>
                      <div>
                        <code style={{ fontSize: 11, color: "var(--brand)", background: "var(--brand-bg)", padding: "1px 6px", borderRadius: 4 }}>{page.tab}</code>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{page.file}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{page.desc[lk]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Components */}
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-4)" }}>
          Components ({COMPONENTS.length})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
          {COMPONENTS.map(function (c) {
            return (
              <div key={c.name} style={{ padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-sm)", background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{c.name} <span style={{ fontWeight: 400, color: "var(--text-faint)" }}>— {c.file}</span></div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3, marginTop: 2 }}>{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Utils */}
      <div style={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-4)" }}>
          Utils ({UTILS.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
          {UTILS.map(function (u) {
            return (
              <div key={u.name} style={{ padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-sm)", background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3, marginTop: 2 }}>{u.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
