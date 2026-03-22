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
      { id: "subsidies_db", label: { fr: "Base de données aides & subsides", en: "Subsidies & grants database" }, desc: { fr: "Catalogue complet des aides belges filtrées par profil (région, secteur, stade, forme juridique). Starteo, Coup de Pouce, Win-Win, PME Portefeuille, chèques-entreprises, aides FEDER. Éligibilité auto selon les données saisies. Documentation intégrée par aide (conditions, montants, démarches). Smart suggest : proposer les aides pertinentes quand le profil correspond.", en: "Complete Belgian grants catalog filtered by profile (region, sector, stage, legal form). Auto-eligibility based on entered data. Integrated docs per grant. Smart suggest when profile matches." }, status: "todo", priority: "high" },
      { id: "support_structures_map", label: { fr: "Carte des structures d'accompagnement", en: "Support structures map" }, desc: { fr: "Carte outline de la Belgique avec pins des structures par région : incubateurs (Co.Station, Start it @KBC, The Birdhouse), accélérateurs, guichets d'entreprise, CCI, UCM/SNI, maisons de l'emploi, Sowalfin/SRIW (Wallonie), finance.brussels, PMV (Flandre). Filtres par type, région, secteur. Fiche détaillée par structure (contact, services, coût).", en: "Belgium outline map with pins per region: incubators, accelerators, enterprise counters, CCI. Filters by type, region, sector. Detail card per structure." }, status: "todo", priority: "medium" },
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
      { id: "sidebar_restructure", label: { fr: "Restructuration sidebar", en: "Sidebar restructure" }, desc: { fr: "Groupes simples : Mon activité, Mon argent, Mes documents, Mon analyse, Ma société. Termes accessibles.", en: "Simple groups: My business, My money, My documents, My analysis, My company." }, status: "done", priority: "high" },
      { id: "wizard_component", label: { fr: "Composant Wizard réutilisable", en: "Reusable Wizard component" }, desc: { fr: "Composant multi-étapes générique avec progress bar, keyboard nav, skip, canAdvance. Utilisé dans Crowdfunding, prêt pour toutes les pages.", en: "Generic multi-step component with progress bar, keyboard nav, skip, canAdvance. Used in Crowdfunding, ready for all pages." }, status: "done", priority: "high" },
      { id: "onboarding_wizard_v2", label: { fr: "Onboarding 2.0 - Wizard global", en: "Onboarding 2.0 - Global wizard" }, desc: { fr: "Parcours guidé complet au premier lancement. Étapes : type d'activité → forme juridique → revenus → charges → équipe → financement. Smart choices selon le businessType. Chaque step pré-remplit la page associée via le Wizard component. L'utilisateur construit son plan financier step by step sans voir les DataTable vides.", en: "Complete guided journey at first launch. Steps: business type → legal form → revenue → costs → team → financing. Smart choices based on businessType. Each step pre-fills the associated page." }, status: "todo", priority: "high" },
      { id: "page_first_visit_wizard", label: { fr: "Wizard premier ajout par page", en: "First-add wizard per page" }, desc: { fr: "Quand une page est vide (0 items), afficher un Wizard d'introduction + premier ajout au lieu du DataTable vide. Déjà fait pour Crowdfunding. À étendre à : Revenus, Charges, Équipe, Équipements, Stocks, Financement, Actionnaires.", en: "When a page is empty (0 items), show an intro Wizard + first add instead of empty DataTable. Already done for Crowdfunding. Extend to all data pages." }, status: "todo", priority: "high" },
      { id: "user_state_persistence", label: { fr: "État utilisateur persisté", en: "User state persistence" }, desc: { fr: "Stocker sur le compte : onboarding complété, wizards vus par page, préférences d'affichage, suggestions dismissées. Permet de ne plus réafficher les wizards après le premier usage.", en: "Store on account: onboarding completed, wizards seen per page, display preferences, dismissed suggestions. Prevents re-showing wizards after first use." }, status: "todo", priority: "high" },
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
  {
    phase: "9",
    title: { fr: "Documents juridiques", en: "Legal documents" },
    desc: { fr: "Génération de documents selon la forme juridique de l'entreprise", en: "Document generation based on company legal form" },
    items: [
      { id: "ag_docs", label: { fr: "Assemblée Générale (AG)", en: "General Assembly (GA)" }, desc: { fr: "Convocations, PV d'AG ordinaire et extraordinaire, résolutions. Adaptés selon SRL/SA/SC. Intégration des données financières (approbation comptes, affectation résultat).", en: "Notices, minutes for ordinary/extraordinary GA, resolutions. Adapted per SRL/SA/SC. Financial data integration (account approval, profit allocation)." }, status: "todo", priority: "high" },
      { id: "ca_docs", label: { fr: "Conseil d'Administration", en: "Board of Directors" }, desc: { fr: "PV de réunion CA, rapports de gestion, décisions collégiales. Obligatoire pour SA. Optionnel mais recommandé pour SRL avec organe d'administration.", en: "Board meeting minutes, management reports, collegial decisions. Mandatory for SA. Optional but recommended for SRL." }, status: "todo", priority: "high" },
      { id: "annual_report", label: { fr: "Rapport de gestion annuel", en: "Annual management report" }, desc: { fr: "Rapport annuel obligatoire avec commentaires sur l'évolution de l'activité, risques, perspectives. Données pré-remplies depuis le P&L et bilan.", en: "Mandatory annual report with business evolution, risks, outlook. Pre-filled from P&L and balance sheet." }, status: "todo", priority: "high" },
      { id: "incorporation_docs", label: { fr: "Documents de constitution", en: "Incorporation documents" }, desc: { fr: "Plan financier obligatoire (CSA Art. 5:4), statuts types, apports en nature/numéraire. Templates selon SRL/SA/SC.", en: "Mandatory financial plan (CSA Art. 5:4), standard bylaws, contributions. Templates per SRL/SA/SC." }, status: "todo", priority: "medium" },
      { id: "shareholder_agreement", label: { fr: "Convention d'actionnaires", en: "Shareholder agreement" }, desc: { fr: "Template de pacte lié à la page Pacte : clauses de sortie, drag-along, tag-along, non-concurrence. Pré-rempli depuis la cap table.", en: "Agreement template linked to Pact page: exit clauses, drag/tag-along, non-compete. Pre-filled from cap table." }, status: "todo", priority: "medium" },
      { id: "legal_form_advisor", label: { fr: "Conseiller forme juridique", en: "Legal form advisor" }, desc: { fr: "Wizard interactif : nombre d'associés, capital, activité → recommandation SRL/SA/SC/SNC avec comparaison des obligations légales.", en: "Interactive wizard: number of partners, capital, activity → SRL/SA/SC/SNC recommendation with legal obligations comparison." }, status: "todo", priority: "low" },
    ],
  },
  {
    phase: "10",
    title: { fr: "Automatisations cross-pages", en: "Cross-page automations" },
    desc: { fr: "Flux automatiques entre les pages pour réduire la saisie manuelle et éviter les incohérences", en: "Automatic data flows between pages to reduce manual input and prevent inconsistencies" },
    items: [
      { id: "auto_stocks_purchases", label: { fr: "Stocks → Charges (achats)", en: "Stocks → Costs (purchases)" }, desc: { fr: "Coût d'achat mensuel des stocks auto-généré en charge exploitation PCMN 6000. Fait.", en: "Monthly stock purchase cost auto-generated as exploitation cost PCMN 6000. Done." }, status: "done", priority: "high" },
      { id: "auto_salary_charges", label: { fr: "Équipe → Charges (avantages)", en: "Team → Costs (benefits)" }, desc: { fr: "Avantages en nature (voiture, laptop, etc.) auto-générés en charges. Fait.", en: "Benefits in kind (car, laptop, etc.) auto-generated as costs. Done." }, status: "done", priority: "high" },
      { id: "auto_equipment_depreciation", label: { fr: "Équipements → Charges (amortissements)", en: "Equipment → Costs (depreciation)" }, desc: { fr: "Dotations aux amortissements auto-générées depuis les actifs. Fait.", en: "Depreciation charges auto-generated from assets. Done." }, status: "done", priority: "high" },
      { id: "auto_debt_interest", label: { fr: "Financement → Charges (intérêts)", en: "Financing → Costs (interest)" }, desc: { fr: "Intérêts annuels auto-générés depuis les emprunts. Fait.", en: "Annual interest auto-generated from loans. Done." }, status: "done", priority: "high" },
      { id: "auto_subsidy_revenue", label: { fr: "Financement → Revenus (subsides)", en: "Financing → Revenue (subsidies)" }, desc: { fr: "Subsides auto-générés en revenu PCMN 7300. Fait.", en: "Subsidies auto-generated as revenue PCMN 7300. Done." }, status: "done", priority: "high" },
      { id: "auto_crowd_costs", label: { fr: "Crowdfunding → Charges (contreparties)", en: "Crowdfunding → Costs (rewards)" }, desc: { fr: "Coûts des contreparties auto-générés en charges non récurrentes. Fait.", en: "Reward costs auto-generated as non-recurring costs. Done." }, status: "done", priority: "high" },
      { id: "auto_salary_captable", label: { fr: "Équipe → Actionnaires (associés)", en: "Team → Shareholders (partners)" }, desc: { fr: "Membres d'équipe marqués actionnaires synchronisés vers la cap table. Fait.", en: "Team members marked as shareholders synced to cap table. Done." }, status: "done", priority: "high" },
      { id: "auto_tva_balance", label: { fr: "TVA collectée/déductible → Bilan", en: "VAT collected/deductible → Balance sheet" }, desc: { fr: "Solde TVA automatique au bilan (créance ou dette CT). À implémenter.", en: "Automatic VAT balance in balance sheet (receivable or ST debt). To implement." }, status: "todo", priority: "high" },
      { id: "auto_debt_repayment_cashflow", label: { fr: "Emprunts → Trésorerie (remboursements)", en: "Loans → Cash flow (repayments)" }, desc: { fr: "Échéancier de remboursement (capital + intérêts) injecté dans le flux de trésorerie mensuel.", en: "Repayment schedule (principal + interest) injected into monthly cash flow." }, status: "todo", priority: "high" },
      { id: "auto_onss_charges", label: { fr: "Équipe → Charges (ONSS patronal)", en: "Team → Costs (employer ONSS)" }, desc: { fr: "Cotisations patronales ONSS auto-calculées et injectées en charges PCMN 6210.", en: "Employer ONSS contributions auto-calculated and injected as costs PCMN 6210." }, status: "todo", priority: "high" },
      { id: "auto_isoc_provision", label: { fr: "Résultat → Bilan (provision ISOC)", en: "Income → Balance sheet (ISOC provision)" }, desc: { fr: "Provision d'impôt auto-calculée depuis le résultat et inscrite au passif du bilan.", en: "Tax provision auto-calculated from income and recorded in balance sheet liabilities." }, status: "todo", priority: "medium" },
      { id: "auto_receivables", label: { fr: "Revenus → Bilan (créances clients)", en: "Revenue → Balance sheet (trade receivables)" }, desc: { fr: "Créances clients projetées selon les délais de paiement configurés (DSO).", en: "Projected trade receivables based on configured payment terms (DSO)." }, status: "todo", priority: "medium" },
      { id: "auto_payables", label: { fr: "Charges → Bilan (dettes fournisseurs)", en: "Costs → Balance sheet (trade payables)" }, desc: { fr: "Dettes fournisseurs projetées selon les délais de paiement fournisseurs (DPO).", en: "Projected trade payables based on supplier payment terms (DPO)." }, status: "todo", priority: "medium" },
    ],
  },
  {
    phase: "11",
    title: { fr: "Modules premium", en: "Premium modules" },
    desc: { fr: "Modules à débloquer à l'unité - documentation intégrée + contenu activable synchronisé avec le plan financier", en: "Individually unlockable modules - integrated documentation + activatable content synced with financial plan" },
    items: [
      { id: "mod_marketing", label: { fr: "Marketing & Acquisition", en: "Marketing & Acquisition" }, desc: { fr: "Budget marketing détaillé : CPC/CPM/CPA par canal (Meta, Google, LinkedIn, TikTok). Programme d'affiliation. Calculs ROAS, CAC, LTV. Synchronisation auto avec charges PCMN 6130. Documentation intégrée : Meta Business Suite, Google Analytics 4, SEO/SEA, publicité programmatique.", en: "Detailed marketing budget: CPC/CPM/CPA per channel (Meta, Google, LinkedIn, TikTok). Affiliate program. ROAS, CAC, LTV calculations. Auto-sync with costs PCMN 6130. Integrated docs: Meta Business Suite, GA4, SEO/SEA." }, status: "todo", priority: "high" },
      { id: "mod_cloud_infra", label: { fr: "Infrastructure cloud", en: "Cloud infrastructure" }, desc: { fr: "Calculateur détaillé par provider : Cloudflare (requests, Workers, R2, CDN), AWS (EC2, S3, Lambda, RDS), Vercel, Netlify. Coûts par pallier, bande passante, requêtes. Auto-sync charges PCMN 6120.", en: "Detailed calculator per provider: Cloudflare (requests, Workers, R2, CDN), AWS (EC2, S3, Lambda, RDS), Vercel, Netlify. Tier pricing, bandwidth, requests. Auto-sync costs PCMN 6120." }, status: "todo", priority: "high" },
      { id: "mod_ecommerce", label: { fr: "E-commerce avancé", en: "Advanced e-commerce" }, desc: { fr: "Forecast e-commerce : taux de conversion par canal, panier moyen, saisonnalité, coûts logistiques (picking, shipping, retours). Intégration Shopify/WooCommerce. Marge par produit, point mort par SKU.", en: "E-commerce forecast: conversion rates per channel, average basket, seasonality, logistics costs. Shopify/WooCommerce integration. Margin per product, break-even per SKU." }, status: "todo", priority: "high" },
      { id: "mod_saas_metrics", label: { fr: "SaaS Metrics", en: "SaaS Metrics" }, desc: { fr: "Métriques SaaS avancées : MRR/ARR breakdown, churn analysis (logo + revenue), expansion revenue, NDR, cohort retention, magic number. Forecast par cohorte.", en: "Advanced SaaS metrics: MRR/ARR breakdown, churn analysis, expansion revenue, NDR, cohort retention, magic number. Cohort-based forecast." }, status: "todo", priority: "high" },
      { id: "mod_hr_advanced", label: { fr: "RH avancé", en: "Advanced HR" }, desc: { fr: "Plan de recrutement timeline, coûts d'onboarding, turnover modeling, budget formation, plan de rémunération variable (commissions, bonus). Calculs détaillés précompte professionnel belge.", en: "Recruitment timeline, onboarding costs, turnover modeling, training budget, variable compensation plan. Belgian withholding tax calculations." }, status: "todo", priority: "medium" },
      { id: "mod_fundraising", label: { fr: "Levée de fonds", en: "Fundraising" }, desc: { fr: "Modélisation avancée de levée : term sheet builder, waterfall analysis, liquidation preferences, anti-dilution, convertible notes (SAFE/ASA). Due diligence checklist auto-générée.", en: "Advanced fundraising modeling: term sheet builder, waterfall analysis, liquidation preferences, convertible notes (SAFE/ASA). Auto-generated DD checklist." }, status: "todo", priority: "medium" },
      { id: "mod_marketplace", label: { fr: "Marketplace & Plateforme", en: "Marketplace & Platform" }, desc: { fr: "Modèle biface : take rate, GMV, economics vendeur/acheteur, coûts de modération, trust & safety. Effets de réseau et seuil de liquidité.", en: "Two-sided model: take rate, GMV, seller/buyer economics, moderation costs. Network effects and liquidity threshold." }, status: "todo", priority: "medium" },
      { id: "mod_restaurant_horeca", label: { fr: "Restaurant & Horeca", en: "Restaurant & Hospitality" }, desc: { fr: "Food cost ratio, coûts par couvert, yield management, gestion staff shifts, inventaire temps réel, calcul waste. Spécifique horeca belge (TVA 12%/21%).", en: "Food cost ratio, cost per cover, yield management, staff shifts, real-time inventory, waste calc. Belgian hospitality specifics." }, status: "todo", priority: "medium" },
      { id: "mod_freelance", label: { fr: "Freelance & Indépendant", en: "Freelance & Solo" }, desc: { fr: "TJM optimizer, calcul net/brut inversé, cotisations sociales INASTI trimestrielles, frais forfaitaires vs réels, optimisation véhicule (ATN/DNA). Spécifique Belgique.", en: "Daily rate optimizer, net/gross calculator, quarterly INASTI contributions, flat vs actual expenses, vehicle optimization. Belgium specific." }, status: "todo", priority: "medium" },
      { id: "mod_real_estate", label: { fr: "Immobilier & Locatif", en: "Real estate & Rental" }, desc: { fr: "Rendement locatif, cash-on-cash, simulation emprunt hypothécaire, fiscalité revenus immobiliers belge (précompte immobilier, revenu cadastral), SCI/SA immobilière.", en: "Rental yield, cash-on-cash, mortgage simulation, Belgian real estate tax, property company structures." }, status: "todo", priority: "low" },
      { id: "mod_import_export", label: { fr: "Import/Export & Douane", en: "Import/Export & Customs" }, desc: { fr: "Calcul droits de douane, incoterms, coûts de fret (maritime, aérien, routier), taux de change, TVA intracommunautaire, certificats d'origine.", en: "Customs duty calculation, incoterms, freight costs, exchange rates, intra-EU VAT, certificates of origin." }, status: "todo", priority: "low" },
    ],
  },
  {
    phase: "12",
    title: { fr: "Suggestions intelligentes", en: "Smart suggestions" },
    desc: { fr: "Système de recommandations cross-pages basé sur le type d'activité et les données saisies", en: "Cross-page recommendation system based on business type and entered data" },
    items: [
      { id: "suggestion_engine", label: { fr: "Moteur de suggestions", en: "Suggestion engine" }, desc: { fr: "Système rule-based (pas d'IA) : mapping prédéfini entre revenus, charges, équipements et type d'activité. Ex. : ajouter 'Commission marketplace' en revenu → suggérer 'Frais Shopify' en charges. Données pré-remplies (montants moyens, fréquences types). Chaque suggestion = { trigger, targetPage, items[], priority, businessTypes[] }.", en: "Rule-based system: predefined mapping between revenue, costs, equipment and business type. Each suggestion = { trigger, targetPage, items[], priority, businessTypes[] }." }, status: "todo", priority: "high" },
      { id: "suggestion_dot_sidebar", label: { fr: "Dot notification sidebar", en: "Sidebar dot notification" }, desc: { fr: "Point de notification sur les onglets sidebar quand des suggestions sont disponibles. Ex. : dot sur 'Charges' quand un revenu marketplace est ajouté. Le dot disparaît quand la suggestion est vue/dismissée/acceptée.", en: "Notification dot on sidebar tabs when suggestions are available. Dot disappears when suggestion is seen/dismissed/accepted." }, status: "todo", priority: "high" },
      { id: "suggestion_banner", label: { fr: "Bannière de suggestion en page", en: "In-page suggestion banner" }, desc: { fr: "Bannière discrète en haut de DataTable avec les suggestions. Actions : 'Ajouter' (pré-remplit la modale), 'Ignorer', 'Ne plus suggérer'. Groupées par source (ex. 'Basé sur vos revenus marketplace').", en: "Discrete banner above DataTable with suggestions. Actions: Add (pre-fills modal), Dismiss, Don't suggest again. Grouped by source." }, status: "todo", priority: "high" },
      { id: "suggestion_rules_revenue", label: { fr: "Règles revenus → charges", en: "Revenue → costs rules" }, desc: { fr: "Mappings prédéfinis : commission marketplace → frais plateforme (Shopify/Etsy/Amazon), SaaS recurring → hébergement cloud + support, daily_rate → déplacements + repas affaires, e-commerce → logistique + emballages + retours.", en: "Predefined mappings: marketplace commission → platform fees, SaaS → cloud hosting, daily rate → travel, e-commerce → logistics." }, status: "todo", priority: "high" },
      { id: "suggestion_rules_business_type", label: { fr: "Règles par type d'activité", en: "Business type rules" }, desc: { fr: "Templates par cfg.businessType : SaaS (hébergement, support, churn), E-commerce (logistique, retours, photos produit), Freelance (comptable, assurance RC, INASTI), Horeca (matières premières, hygiène, caisse), Marketplace (modération, trust & safety).", en: "Templates per businessType: SaaS, E-commerce, Freelance, Horeca, Marketplace — each with specific cost/revenue suggestions." }, status: "todo", priority: "high" },
      { id: "suggestion_rules_equipment", label: { fr: "Règles équipe → charges/équipements", en: "Team → costs/equipment rules" }, desc: { fr: "Embauche → poste de travail (laptop, écran, bureau), logiciels (licences), mutuelle, formation. Seuils : >3 employés → assurance groupe, >10 → secrétariat social avancé.", en: "Hire → workstation, software licenses, health insurance, training. Thresholds: >3 employees → group insurance, >10 → advanced social secretariat." }, status: "todo", priority: "medium" },
      { id: "suggestion_rules_legal", label: { fr: "Règles forme juridique → charges", en: "Legal form → costs rules" }, desc: { fr: "SRL → frais de constitution (notaire ~750€), publication Moniteur (~200€), comptable. SA → réviseur d'entreprise (si critères), frais CA. Toute forme → assurance RC pro, secrétariat social.", en: "SRL → incorporation fees, Moniteur publication, accountant. SA → auditor, board costs. All forms → professional liability insurance." }, status: "todo", priority: "medium" },
      { id: "suggestion_dismissed_state", label: { fr: "État des suggestions persisté", en: "Dismissed suggestions state" }, desc: { fr: "Stocker les suggestions acceptées, ignorées ou masquées définitivement. Sync avec user_state_persistence (Phase 5). Ne jamais re-proposer une suggestion masquée.", en: "Store accepted, dismissed or permanently hidden suggestions. Sync with user_state_persistence. Never re-suggest hidden items." }, status: "todo", priority: "medium" },
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

      {/* PCMN class progress */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-lg)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-3)" }}>
          {lk === "fr" ? "Progression PCMN par classe" : "PCMN class progress"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "var(--sp-3)" }}>
          {[
            { cl: "1", pct: 85, label: { fr: "Capitaux", en: "Capital" }, detail: { fr: "CapTable refacto, dettes au bilan", en: "CapTable refactored, debts in balance" } },
            { cl: "2", pct: 95, label: { fr: "Immobilisations", en: "Fixed assets" }, detail: { fr: "Équipements + amortissements", en: "Equipment + depreciation" } },
            { cl: "3", pct: 85, label: { fr: "Stocks", en: "Inventory" }, detail: { fr: "Page + bilan, variation auto P&L", en: "Page + balance, auto P&L variation" } },
            { cl: "4", pct: 60, label: { fr: "Créances/Dettes", en: "Receivables/Payables" }, detail: { fr: "CT au bilan, DSO/DPO à faire", en: "ST in balance, DSO/DPO todo" } },
            { cl: "5", pct: 80, label: { fr: "Trésorerie", en: "Cash" }, detail: { fr: "Projeté au bilan, flux mensuel à faire", en: "Projected in balance, monthly flow todo" } },
            { cl: "6", pct: 100, label: { fr: "Charges", en: "Expenses" }, detail: { fr: "Toutes catégories couvertes", en: "All categories covered" } },
            { cl: "7", pct: 100, label: { fr: "Produits", en: "Revenue" }, detail: { fr: "Tous comportements couverts", en: "All behaviors covered" } },
          ].map(function (c) {
            var barColor = c.pct === 100 ? "var(--color-success)" : c.pct >= 80 ? "var(--brand)" : c.pct >= 50 ? "var(--color-warning)" : "var(--color-error)";
            return (
              <div key={c.cl} title={c.detail[lk]} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: barColor, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 2 }}>{c.pct}%</div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", borderRadius: 3, background: barColor, width: c.pct + "%", transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{lk === "fr" ? "Cl." : "Cl."} {c.cl}</div>
                <div style={{ fontSize: 9, color: "var(--text-faint)", lineHeight: 1.3, marginTop: 1 }}>{c.label[lk]}</div>
              </div>
            );
          })}
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
