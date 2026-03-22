import { useState } from "react";
import { CheckCircle, Circle, ArrowRight, Warning } from "@phosphor-icons/react";
import { PageLayout, Badge } from "../components";
import { useT, useLang } from "../context";

var ROADMAP = [
  {
    phase: "1",
    title: { fr: "États financiers", en: "Financial statements" },
    desc: { fr: "Documents obligatoires pour le plan financier belge (CSA Art. 5:4)", en: "Mandatory documents for Belgian financial plan (CSA Art. 5:4)" },
    items: [
      { id: "income_statement", label: { fr: "Compte de résultat prévisionnel", en: "Projected income statement" }, desc: { fr: "P&L normalisé PCMN (classes 6-7) sur 12, 24 et 36 mois. Toutes les données existent dans App.jsx.", en: "PCMN-normalized P&L (classes 6-7) for 12, 24, 36 months. All data exists in App.jsx." }, status: "done", priority: "high" },
      { id: "balance_sheet", label: { fr: "Bilan prévisionnel", en: "Projected balance sheet" }, desc: { fr: "Bilan d'ouverture + à 12 et 24 mois (micro-schéma CSA Art. 3:3). Actif/Passif depuis équipements, dettes, config.", en: "Opening + 12/24 months balance sheet. Assets/Liabilities from equipment, debts, config." }, status: "done", priority: "high" },
      { id: "financing_plan", label: { fr: "Plan de financement", en: "Financing plan" }, desc: { fr: "Sources vs Emplois consolidé. Capital, emprunts, crowdfunding, subventions vs investissements, BFR, remboursements.", en: "Sources vs Uses consolidated. Capital, loans, crowdfunding vs investments, WC, repayments." }, status: "todo", priority: "high" },
      { id: "cashflow_statement", label: { fr: "Tableau de flux mensuel", en: "Monthly cash flow statement" }, desc: { fr: "12 colonnes mois par mois — format bancaire belge. Encaissements, décaissements, solde cumulé.", en: "12-column month-by-month — Belgian bank format. Receipts, disbursements, cumulative balance." }, status: "todo", priority: "high" },
    ],
  },
  {
    phase: "2",
    title: { fr: "Analyse & Ratios", en: "Analysis & Ratios" },
    desc: { fr: "Outils d'analyse pour valider la viabilité du projet", en: "Analysis tools to validate project viability" },
    items: [
      { id: "bfr_ratios", label: { fr: "BFR & Ratios financiers", en: "Working capital & Ratios" }, desc: { fr: "BFR (délais clients DSO, fournisseurs DPO, stocks DIO), cycle de conversion cash, ratios de liquidité/solvabilité.", en: "WC (DSO, DPO, DIO), cash conversion cycle, liquidity/solvency ratios." }, status: "todo", priority: "high" },
      { id: "budget_vs_actual", label: { fr: "Budget vs Réel", en: "Budget vs Actual" }, desc: { fr: "Saisie des montants réels mois par mois. Analyse des écarts par poste avec alertes sur variances significatives.", en: "Monthly actuals input. Variance analysis per line item with alerts on material deviations." }, status: "todo", priority: "high" },
      { id: "scenario_comparison", label: { fr: "Comparaison de scénarios", en: "Scenario comparison" }, desc: { fr: "Vue côte à côte de 3 scénarios (optimiste, réaliste, pessimiste). Delta entre scénarios.", en: "Side-by-side view of 3 scenarios (optimistic, realistic, pessimistic). Delta display." }, status: "todo", priority: "medium" },
      { id: "kpi_dashboard", label: { fr: "Tableau de bord KPI", en: "KPI Dashboard" }, desc: { fr: "Page dédiée aux indicateurs business-type. Unit economics, cohort analysis, LTV/CAC trends.", en: "Dedicated business-type KPI page. Unit economics, cohort analysis, LTV/CAC trends." }, status: "todo", priority: "medium" },
    ],
  },
  {
    phase: "3",
    title: { fr: "Conformité belge", en: "Belgian compliance" },
    desc: { fr: "Spécificités fiscales et réglementaires belges", en: "Belgian fiscal and regulatory specifics" },
    items: [
      { id: "tva_declaration", label: { fr: "Calendrier TVA", en: "VAT calendar" }, desc: { fr: "Timeline des déclarations TVA (mensuel/trimestriel) avec montants dus et impact cash par période.", en: "VAT declaration timeline (monthly/quarterly) with amounts due and cash impact." }, status: "todo", priority: "high" },
      { id: "isoc_prepayments", label: { fr: "Versements anticipés ISOC", en: "ISOC prepayments" }, desc: { fr: "Échéancier Q1-Q4 des versements anticipés. Calcul de la majoration évitée. Impact trésorerie.", en: "Q1-Q4 prepayment schedule. Penalty avoidance calculation. Treasury impact." }, status: "todo", priority: "high" },
      { id: "onss_calendar", label: { fr: "Calendrier ONSS", en: "ONSS calendar" }, desc: { fr: "Échéances trimestrielles ONSS employeur/employé avec deadlines et montants.", en: "Quarterly ONSS employer/employee deadlines and amounts." }, status: "todo", priority: "medium" },
      { id: "subsidies_db", label: { fr: "Base de données aides", en: "Subsidies database" }, desc: { fr: "Starteo, Coup de Pouce (Wallonie), Win-Win, PME Portefeuille. Éligibilité et simulation.", en: "Starteo, Coup de Pouce, Win-Win, SME Portfolio. Eligibility and simulation." }, status: "todo", priority: "medium" },
      { id: "einvoicing", label: { fr: "e-Facturation Peppol", en: "Peppol e-Invoicing" }, desc: { fr: "Obligatoire B2B dès janvier 2026 en Belgique. Modélisation des coûts d'implémentation UBL/Peppol.", en: "Mandatory B2B from Jan 2026 in Belgium. UBL/Peppol implementation cost modeling." }, status: "todo", priority: "low" },
    ],
  },
  {
    phase: "4",
    title: { fr: "Intégrations paiement", en: "Payment integrations" },
    desc: { fr: "Calcul automatique des frais de transaction par plateforme", en: "Automatic transaction fee calculation per platform" },
    items: [
      { id: "stripe_integration", label: { fr: "Stripe", en: "Stripe" }, desc: { fr: "Grille complète : Standard (1.5%+0.25€), Connect (0.25%), Billing, Terminal. Auto-import dans charges.", en: "Full schedule: Standard, Connect, Billing, Terminal. Auto-import into costs." }, status: "todo", priority: "high" },
      { id: "mollie_integration", label: { fr: "Mollie", en: "Mollie" }, desc: { fr: "Bancontact (0.39€), iDEAL (0.29€), cartes (1.8%+0.25€). Populaire en BE/NL.", en: "Bancontact, iDEAL, cards. Popular in BE/NL." }, status: "todo", priority: "high" },
      { id: "shopify_integration", label: { fr: "Shopify", en: "Shopify" }, desc: { fr: "Abonnement (Basic/Shopify/Advanced) + Shopify Payments (1.5-2%) + apps. Charges récurrentes + variables.", en: "Subscription plans + Shopify Payments fees + apps. Recurring + variable costs." }, status: "todo", priority: "medium" },
      { id: "payconiq_integration", label: { fr: "Payconiq / Bancontact", en: "Payconiq / Bancontact" }, desc: { fr: "Paiements mobiles et terminaux belges. Frais fixes par transaction.", en: "Belgian mobile and terminal payments. Fixed per-transaction fees." }, status: "todo", priority: "medium" },
      { id: "sumup_integration", label: { fr: "SumUp / Square", en: "SumUp / Square" }, desc: { fr: "Terminaux physiques — frais fixes (1.69%). Pour retail et horeca.", en: "Physical terminals — fixed fees (1.69%). For retail and hospitality." }, status: "todo", priority: "low" },
    ],
  },
  {
    phase: "5",
    title: { fr: "UX & Navigation", en: "UX & Navigation" },
    desc: { fr: "Termes simples, navigation intuitive pour non-financiers", en: "Simple terms, intuitive navigation for non-financial users" },
    items: [
      { id: "sidebar_restructure", label: { fr: "Restructuration sidebar", en: "Sidebar restructure" }, desc: { fr: "Groupes simples : Mon activité, Mon argent, Mes documents, Mon analyse, Ma société. Termes accessibles.", en: "Simple groups: My business, My money, My documents, My analysis, My company." }, status: "todo", priority: "high" },
      { id: "onboarding_wizard", label: { fr: "Wizard d'onboarding", en: "Onboarding wizard" }, desc: { fr: "Guide interactif au premier lancement : type d'activité, forme juridique, objectifs. Pré-remplit les pages.", en: "Interactive first-launch guide: business type, legal form, goals. Pre-fills pages." }, status: "todo", priority: "high" },
      { id: "contextual_help", label: { fr: "Aide contextuelle", en: "Contextual help" }, desc: { fr: "Hints inline, tooltips enrichis, vidéos courtes par section. Glossaire intégré aux champs.", en: "Inline hints, rich tooltips, short videos per section. Field-integrated glossary." }, status: "todo", priority: "medium" },
      { id: "mobile_responsive", label: { fr: "Responsive mobile", en: "Mobile responsive" }, desc: { fr: "Consultation mobile du plan financier. Édition desktop, lecture mobile.", en: "Mobile financial plan viewing. Desktop editing, mobile reading." }, status: "todo", priority: "low" },
    ],
  },
  {
    phase: "6",
    title: { fr: "Multi-accès & Rôles", en: "Multi-access & Roles" },
    desc: { fr: "Porteur de projet, comptable et accompagnateur sur le même plan", en: "Founder, accountant and advisor on the same plan" },
    items: [
      { id: "role_system", label: { fr: "Système de rôles", en: "Role system" }, desc: { fr: "Porteur (édition complète), Comptable (PCMN, validation, export journal), Accompagnateur (lecture, commentaires).", en: "Founder (full edit), Accountant (PCMN, validation, journal export), Advisor (read, comments)." }, status: "todo", priority: "high" },
      { id: "accountant_mode", label: { fr: "Mode comptable", en: "Accountant mode" }, desc: { fr: "Vue dédiée : PCMN partout, validation par écriture, alertes fiscales, export BOB50/Winbooks/Exact.", en: "Dedicated view: PCMN everywhere, entry validation, fiscal alerts, BOB50/Winbooks export." }, status: "todo", priority: "high" },
      { id: "sharing_links", label: { fr: "Liens de partage", en: "Sharing links" }, desc: { fr: "Partage par lien avec permissions (lecture, commentaires, édition). Expiration configurable.", en: "Link sharing with permissions (read, comment, edit). Configurable expiration." }, status: "todo", priority: "medium" },
      { id: "comment_system", label: { fr: "Commentaires", en: "Comments" }, desc: { fr: "Annotations par champ/section. Thread de discussion porteur-comptable. Résolution de commentaires.", en: "Per-field/section annotations. Founder-accountant discussion threads. Comment resolution." }, status: "todo", priority: "medium" },
      { id: "audit_trail", label: { fr: "Historique des modifications", en: "Audit trail" }, desc: { fr: "Qui a modifié quoi et quand. Obligatoire pour la validation comptable.", en: "Who changed what and when. Required for accounting validation." }, status: "todo", priority: "medium" },
    ],
  },
  {
    phase: "7",
    title: { fr: "Export & Rapports", en: "Export & Reports" },
    desc: { fr: "Documents prêts pour banques, investisseurs et notaire", en: "Documents ready for banks, investors and notary" },
    items: [
      { id: "pdf_business_plan", label: { fr: "Business plan PDF", en: "Business plan PDF" }, desc: { fr: "Document complet pour le notaire/banque : executive summary, P&L, bilan, financement, KPIs. Conforme CSA.", en: "Complete document for notary/bank: exec summary, P&L, balance sheet, financing, KPIs." }, status: "todo", priority: "high" },
      { id: "excel_export", label: { fr: "Export Excel comptable", en: "Accounting Excel export" }, desc: { fr: "Workbook formaté : journal, grand livre, balance, P&L, bilan. Import possible dans BOB50/Winbooks.", en: "Formatted workbook: journal, ledger, trial balance, P&L, balance sheet." }, status: "todo", priority: "high" },
      { id: "investor_deck", label: { fr: "Deck investisseur", en: "Investor deck" }, desc: { fr: "Slides financières auto-générées : trajectoire CA, unit economics, cap table waterfall, use of funds.", en: "Auto-generated financial slides: revenue trajectory, unit economics, cap table, use of funds." }, status: "todo", priority: "medium" },
      { id: "board_report", label: { fr: "Rapport board", en: "Board report" }, desc: { fr: "Template mensuel/trimestriel : KPIs vs targets, position cash, burn trend, risques clés.", en: "Monthly/quarterly template: KPIs vs targets, cash position, burn trend, key risks." }, status: "todo", priority: "low" },
    ],
  },
  {
    phase: "8",
    title: { fr: "Intelligence & Benchmarks", en: "Intelligence & Benchmarks" },
    desc: { fr: "Suggestions intelligentes et comparaison sectorielle", en: "Smart suggestions and industry comparison" },
    items: [
      { id: "industry_benchmarks", label: { fr: "Benchmarks sectoriels", en: "Industry benchmarks" }, desc: { fr: "Comparer ses métriques aux médianes du secteur par type d'activité et stade. 'Votre burn rate est 20% au-dessus de la médiane seed SaaS.'", en: "Compare metrics to industry medians by type and stage." }, status: "todo", priority: "medium" },
      { id: "anomaly_detection", label: { fr: "Détection d'anomalies", en: "Anomaly detection" }, desc: { fr: "Alertes quand les inputs sont irréalistes : croissance >50%/mois, salaires >80% CA, runway <3 mois.", en: "Alerts when inputs are unrealistic: growth >50%/month, payroll >80% revenue." }, status: "todo", priority: "medium" },
      { id: "smart_suggestions", label: { fr: "Suggestions intelligentes", en: "Smart suggestions" }, desc: { fr: "Basé sur le type d'activité, suggérer des taux réalistes, ratios cibles, postes de coûts courants.", en: "Based on business type, suggest realistic rates, target ratios, common cost items." }, status: "todo", priority: "low" },
      { id: "milestone_tracking", label: { fr: "Suivi des jalons", en: "Milestone tracking" }, desc: { fr: "Définir des objectifs financiers (break-even, ARR cible, embauches) et suivre la progression.", en: "Set financial goals (break-even, target ARR, hires) and track progress." }, status: "todo", priority: "low" },
    ],
  },
];

var STATUS_STYLE = {
  done: { color: "var(--color-success)", icon: CheckCircle, badge: "success", label: { fr: "Fait", en: "Done" } },
  wip: { color: "var(--color-warning)", icon: Warning, badge: "warning", label: { fr: "En cours", en: "In progress" } },
  todo: { color: "var(--text-faint)", icon: Circle, badge: "gray", label: { fr: "À faire", en: "To do" } },
};

var PRIORITY_BADGE = {
  high: { color: "error", label: { fr: "Haute", en: "High" } },
  medium: { color: "warning", label: { fr: "Moyenne", en: "Medium" } },
  low: { color: "gray", label: { fr: "Basse", en: "Low" } },
};

export default function RoadmapPage() {
  var t = useT();
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var [expandedPhase, setExpandedPhase] = useState("1");

  var totalItems = 0;
  var doneItems = 0;
  ROADMAP.forEach(function (phase) {
    phase.items.forEach(function (item) {
      totalItems++;
      if (item.status === "done") doneItems++;
    });
  });
  var progressPct = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;

  return (
    <PageLayout title="Roadmap" subtitle={lk === "fr" ? "Fonctionnalités planifiées et progression du développement." : "Planned features and development progress."}>

      {/* Global progress */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-2)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{lk === "fr" ? "Progression globale" : "Overall progress"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{doneItems}/{totalItems} ({progressPct}%)</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "var(--bg-hover)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "var(--brand)", width: progressPct + "%", transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Phases */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
        {ROADMAP.map(function (phase) {
          var isOpen = expandedPhase === phase.phase;
          var phaseDone = 0;
          phase.items.forEach(function (item) { if (item.status === "done") phaseDone++; });
          var phaseTotal = phase.items.length;

          return (
            <div key={phase.phase} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", overflow: "hidden" }}>
              {/* Phase header */}
              <button type="button" onClick={function () { setExpandedPhase(isOpen ? null : phase.phase); }}
                style={{
                  width: "100%", padding: "var(--sp-4)",
                  display: "flex", alignItems: "center", gap: "var(--sp-3)",
                  border: "none", background: "transparent",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "var(--brand-bg)", width: 28, height: 28, borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {phase.phase}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{phase.title[lk]}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{phase.desc[lk]}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-faint)", flexShrink: 0 }}>{phaseDone}/{phaseTotal}</span>
                <ArrowRight size={14} weight="bold" color="var(--text-faint)" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", flexShrink: 0 }} />
              </button>

              {/* Phase items */}
              {isOpen ? (
                <div style={{ padding: "0 var(--sp-4) var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                  {phase.items.map(function (item) {
                    var st = STATUS_STYLE[item.status] || STATUS_STYLE.todo;
                    var pr = PRIORITY_BADGE[item.priority] || PRIORITY_BADGE.medium;
                    var StIcon = st.icon;
                    return (
                      <div key={item.id} style={{
                        display: "flex", alignItems: "flex-start", gap: "var(--sp-3)",
                        padding: "var(--sp-3)", borderRadius: "var(--r-md)",
                        background: "var(--bg-page)", border: "1px solid var(--border-light)",
                      }}>
                        <StIcon size={18} weight={item.status === "done" ? "fill" : "regular"} color={st.color} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.label[lk]}</span>
                            <Badge color={pr.color} size="sm">{pr.label[lk]}</Badge>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{item.desc[lk]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
