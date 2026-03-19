import { useState } from "react";
import { Receipt, Gauge, PaintBrush, Code, Trash, ArrowCounterClockwise, Sun, Moon, Desktop, Briefcase } from "@phosphor-icons/react";
import { DEFAULT_CONFIG } from "../constants/config";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF } from "../constants/defaults";
import { Card, NumberField, PageLayout } from "../components";
import Select from "../components/Select";
import { InfoTip } from "../components/Tooltip";
import { save } from "../utils/storage";
import { STORAGE_KEY } from "../constants/config";
import { useT, useLang, useDevMode, useTheme } from "../context";

/* ── Sub-sidebar nav item ── */

function NavItem({ icon, label, active, onClick, color }) {
  var Icon = icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "var(--sp-2)",
        width: "100%", padding: "8px 12px",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--brand-bg)" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      <Icon size={16} weight={active ? "fill" : "regular"} color={active ? (color || "var(--brand)") : "var(--text-muted)"} />
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? (color || "var(--brand)") : "var(--text-secondary)" }}>{label}</span>
    </button>
  );
}

/* ── Toggle switch ── */

function Toggle({ on, onChange, color }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? (color || "var(--brand)") : "var(--border-strong)",
        position: "relative", transition: "background 150ms", flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
        background: "var(--bg-card)",
        left: on ? 22 : 2,
        transition: "left 150ms",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

/* ── Setting row ── */

function SettingRow({ label, tip, desc, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
          {label}{tip ? <InfoTip tip={tip} width={220} /> : null}
        </span>
        {desc ? <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

/* ── Section card ── */

function Section({ title, sub, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : "var(--sp-6)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 var(--sp-1)", color: "var(--text-primary)" }}>{title}</h3>
      {sub ? <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-4)" }}>{sub}</p> : null}
      {children}
    </div>
  );
}

/* ── Divider ── */

function Divider() {
  return <div style={{ height: 1, background: "var(--border-light)", margin: "var(--sp-5) 0" }} />;
}

/* ── Theme picker (3 radio buttons) ── */

function ThemePicker({ value, onChange, t }) {
  var options = [
    { id: "light", icon: Sun, label: t.theme_light },
    { id: "dark", icon: Moon, label: t.theme_dark },
    { id: "auto", icon: Desktop, label: t.theme_auto },
  ];
  return (
    <div style={{ display: "flex", gap: "var(--sp-2)" }}>
      {options.map(function (o) {
        var active = value === o.id;
        var Icon = o.icon;
        return (
          <button
            key={o.id}
            onClick={function () { onChange(o.id); }}
            style={{
              display: "flex", alignItems: "center", gap: "var(--sp-1)",
              padding: "6px 12px", borderRadius: "var(--r-md)",
              border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
              background: active ? "var(--brand-bg)" : "transparent",
              color: active ? "var(--brand)" : "var(--text-secondary)",
              fontSize: 12, fontWeight: active ? 600 : 400,
              cursor: "pointer", transition: "all 0.1s",
            }}
          >
            <Icon size={14} weight={active ? "fill" : "regular"} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Helper to update cfg ── */

function cfgSet(setCfg, key, val) {
  setCfg(function (p) {
    var n = {};
    Object.keys(p).forEach(function (k) { n[k] = p[k]; });
    n[key] = val;
    return n;
  });
}

function cfgSetNested(setCfg, parent, key, val) {
  setCfg(function (p) {
    var n = {};
    Object.keys(p).forEach(function (k) { n[k] = p[k]; });
    var nested = {};
    Object.keys(p[parent] || {}).forEach(function (k) { nested[k] = p[parent][k]; });
    nested[key] = val;
    n[parent] = nested;
    return n;
  });
}

/* ── Main component ── */

export default function SettingsPage({
  cfg, setCfg, setCosts, setSals,
  setGrants, setPoolSize,
  setShareholders, setRoundSim,
  setStreams, setEsopEnabled,
}) {
  var tAll = useT();
  var t = tAll.settings;
  var td = tAll.dev || {};
  var { lang, toggleLang } = useLang();
  var { dark, toggle: toggleTheme } = useTheme();
  var { devMode, toggle: toggleDevMode } = useDevMode();
  var [activeSection, setActiveSection] = useState("fiscal");

  /* Resolve theme mode: stored preference or "auto" */
  var [themeMode, setThemeModeState] = useState(function () {
    try {
      var pref = localStorage.getItem("themeMode");
      if (pref === "dark" || pref === "light" || pref === "auto") return pref;
    } catch (e) {}
    return dark ? "dark" : "light";
  });

  function setThemeMode(mode) {
    setThemeModeState(mode);
    try { localStorage.setItem("themeMode", mode); } catch (e) {}
    if (mode === "auto") {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if ((prefersDark && !dark) || (!prefersDark && dark)) {
        toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
      }
    } else if (mode === "dark" && !dark) {
      toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
    } else if (mode === "light" && dark) {
      toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  var BIZ_LABELS = {
    saas: "SaaS", ecommerce: "E-commerce", retail: "Retail",
    services: "Services", freelancer: lang === "fr" ? "Ind\u00e9pendant" : "Freelancer", other: lang === "fr" ? "G\u00e9n\u00e9ral" : "General",
  };
  var NAV = [
    { id: "fiscal", icon: Receipt, label: t.nav_fiscal || t.fiscal_title },
    { id: "business", icon: Briefcase, label: (lang === "fr" ? "M\u00e9triques " : "Metrics ") + (BIZ_LABELS[cfg.businessType] || "") },
    { id: "metrics", icon: Gauge, label: t.nav_metrics || (lang === "fr" ? "Objectifs" : "Targets") },
    { id: "appearance", icon: PaintBrush, label: t.nav_appearance || (lang === "fr" ? "Apparence" : "Appearance") },
    { id: "developer", icon: Code, label: td.settings_title || "Developer" },
    { id: "danger", icon: Trash, label: t.nav_danger || (lang === "fr" ? "Zone de danger" : "Danger zone"), color: "var(--color-error)" },
  ];

  return (
    <PageLayout
      title={t.title || "Param\u00e8tres"}
      subtitle={t.subtitle_new || (lang === "fr" ? "Configurez la fiscalit\u00e9, les m\u00e9triques, l'apparence et les pr\u00e9f\u00e9rences de votre espace de travail." : "Configure taxes, metrics, appearance and workspace preferences.")}
    >
      <div style={{ display: "flex", gap: "var(--gap-lg)", alignItems: "flex-start", minHeight: "calc(100vh - 240px)" }}>

        {/* Sub-sidebar */}
        <div style={{
          width: 210, flexShrink: 0,
          position: "sticky", top: "calc(var(--page-py) + 60px)",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {NAV.map(function (item) {
            return (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeSection === item.id}
                onClick={function () { setActiveSection(item.id); }}
                color={item.color}
              />
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── FISCAL & CAPITAL ── */}
          {activeSection === "fiscal" ? (
            <Card>
              <Section title={t.fiscal_title} sub={t.fiscal_sub}>
                {[
                  ["vat", t.fiscal_vat, 0.01, 0.30, t.tip_vat, true],
                  ["capitalSocial", t.fiscal_capital, 1000, 500000, t.tip_capital],
                ].map(function (f) {
                  return (
                    <SettingRow key={f[0]} label={f[1]} tip={f[4]}>
                      <NumberField value={cfg[f[0]]} onChange={function (v) { cfgSet(setCfg, f[0], v); }} min={0} max={f[3]} step={f[2]} width="100px" pct={f[5]} />
                    </SettingRow>
                  );
                })}

                <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginBottom: "var(--sp-4)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {t.fiscal_isoc_note}
                </div>
              </Section>

              <Divider />

              <Section title={t.fiscal_sal_title} last>
                {[
                  ["onss", t.fiscal_onss, 0.001, t.tip_onss],
                  ["prec", t.fiscal_prec, 0.001, t.tip_prec],
                  ["patr", t.fiscal_patr, 0.001, t.tip_patr],
                ].map(function (f) {
                  return (
                    <SettingRow key={f[0]} label={f[1]} tip={f[3]}>
                      <NumberField value={cfg[f[0]]} onChange={function (v) { cfgSet(setCfg, f[0], v); }} min={0} max={1} step={f[2]} width="80px" pct />
                    </SettingRow>
                  );
                })}
              </Section>
            </Card>
          ) : null}

          {/* ── BUSINESS METRICS (per-type) ── */}
          {activeSection === "business" ? (
            <Card>
              <Section title={(lang === "fr" ? "Métriques " : "Metrics ") + (BIZ_LABELS[cfg.businessType] || "")} sub={lang === "fr" ? "Paramètres spécifiques à votre type d'activité." : "Settings specific to your business type."}>
                <div style={{ padding: "var(--sp-3)", background: "var(--brand-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--brand-border)", marginBottom: "var(--sp-4)", fontSize: 12, color: "var(--brand)", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{lang === "fr" ? "Type d'activité : " : "Business type: "}<strong>{BIZ_LABELS[cfg.businessType]}</strong></span>
                  <button
                    onClick={function () { window.dispatchEvent(new CustomEvent("nav-tab", { detail: "profile" })); }}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "var(--brand)",
                      background: "var(--bg-card)", border: "1px solid var(--brand)",
                      borderRadius: "var(--r-md)", padding: "4px 12px",
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {lang === "fr" ? "Modifier" : "Change"}
                  </button>
                </div>
              </Section>

              {cfg.businessType === "saas" ? (
                <Section title="SaaS Metrics" last>
                  <SettingRow label={lang === "fr" ? "Taux de churn mensuel" : "Monthly churn rate"} tip={t.tip_churn}>
                    <NumberField value={cfg.churnMonthly} onChange={function (v) { cfgSet(setCfg, "churnMonthly", v); }} min={0} max={0.50} step={0.001} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux d'expansion MRR" : "MRR expansion rate"}>
                    <NumberField value={cfg.expansionRate} onChange={function (v) { cfgSet(setCfg, "expansionRate", v); }} min={0} max={0.20} step={0.005} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux de contraction MRR" : "MRR contraction rate"}>
                    <NumberField value={cfg.contractionRate} onChange={function (v) { cfgSet(setCfg, "contractionRate", v); }} min={0} max={0.20} step={0.005} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Croissance annuelle CA" : "Annual revenue growth"}>
                    <NumberField value={cfg.revenueGrowthRate} onChange={function (v) { cfgSet(setCfg, "revenueGrowthRate", v); }} min={0} max={3} step={0.05} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Conversion essai → payant" : "Trial to paid conversion"}>
                    <NumberField value={cfg.trialConversionRate} onChange={function (v) { cfgSet(setCfg, "trialConversionRate", v); }} min={0} max={1} step={0.01} width="90px" pct />
                  </SettingRow>
                  <SettingRow label="CAC cible" tip={t.tip_cac}>
                    <NumberField value={cfg.cacTarget} onChange={function (v) { cfgSet(setCfg, "cacTarget", v); }} min={0} max={20000} step={100} width="100px" />
                  </SettingRow>
                </Section>
              ) : null}

              {cfg.businessType === "ecommerce" ? (
                <Section title="E-commerce Metrics" last>
                  <SettingRow label={lang === "fr" ? "Commandes / mois" : "Orders / month"}>
                    <NumberField value={cfg.ordersPerMonth} onChange={function (v) { cfgSet(setCfg, "ordersPerMonth", v); }} min={0} max={100000} step={10} width="100px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Visiteurs / mois" : "Monthly visitors"}>
                    <NumberField value={cfg.monthlyVisitors} onChange={function (v) { cfgSet(setCfg, "monthlyVisitors", v); }} min={0} max={10000000} step={100} width="100px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Coût expédition moyen" : "Avg shipping cost"}>
                    <NumberField value={cfg.avgShippingCost} onChange={function (v) { cfgSet(setCfg, "avgShippingCost", v); }} min={0} max={100} step={0.5} width="90px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux de retour" : "Return rate"}>
                    <NumberField value={cfg.returnRate} onChange={function (v) { cfgSet(setCfg, "returnRate", v); }} min={0} max={0.50} step={0.01} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Coût fulfilment / commande" : "Fulfillment cost / order"}>
                    <NumberField value={cfg.fulfillmentCostPerOrder} onChange={function (v) { cfgSet(setCfg, "fulfillmentCostPerOrder", v); }} min={0} max={50} step={0.5} width="90px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux abandon panier" : "Cart abandonment rate"}>
                    <NumberField value={cfg.cartAbandonmentRate} onChange={function (v) { cfgSet(setCfg, "cartAbandonmentRate", v); }} min={0} max={1} step={0.05} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux de réachat" : "Repeat purchase rate"}>
                    <NumberField value={cfg.repeatPurchaseRate} onChange={function (v) { cfgSet(setCfg, "repeatPurchaseRate", v); }} min={0} max={1} step={0.05} width="90px" pct />
                  </SettingRow>
                </Section>
              ) : null}

              {cfg.businessType === "retail" ? (
                <Section title="Retail Metrics" last>
                  <SettingRow label={lang === "fr" ? "Surface du point de vente (m²)" : "Store size (m²)"}>
                    <NumberField value={cfg.storeSize} onChange={function (v) { cfgSet(setCfg, "storeSize", v); }} min={0} max={10000} step={10} width="100px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Fréquentation / mois" : "Monthly footfall"}>
                    <NumberField value={cfg.monthlyFootfall} onChange={function (v) { cfgSet(setCfg, "monthlyFootfall", v); }} min={0} max={100000} step={100} width="100px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Transactions / mois" : "Monthly transactions"}>
                    <NumberField value={cfg.monthlyTransactions} onChange={function (v) { cfgSet(setCfg, "monthlyTransactions", v); }} min={0} max={100000} step={10} width="100px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux de démarque" : "Shrinkage rate"}>
                    <NumberField value={cfg.shrinkageRate} onChange={function (v) { cfgSet(setCfg, "shrinkageRate", v); }} min={0} max={0.10} step={0.001} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Articles / transaction" : "Items / transaction"}>
                    <NumberField value={cfg.avgItemsPerTransaction} onChange={function (v) { cfgSet(setCfg, "avgItemsPerTransaction", v); }} min={1} max={50} step={0.5} width="90px" />
                  </SettingRow>
                </Section>
              ) : null}

              {cfg.businessType === "services" ? (
                <Section title={lang === "fr" ? "Métriques Services" : "Services Metrics"} last>
                  <SettingRow label={lang === "fr" ? "Taux horaire moyen" : "Average hourly rate"}>
                    <NumberField value={cfg.avgHourlyRate} onChange={function (v) { cfgSet(setCfg, "avgHourlyRate", v); }} min={0} max={500} step={5} width="90px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Nombre de consultants" : "Consultant count"}>
                    <NumberField value={cfg.consultantCount} onChange={function (v) { cfgSet(setCfg, "consultantCount", v); }} min={0} max={200} step={1} width="90px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Objectif utilisation" : "Utilization target"}>
                    <NumberField value={cfg.utilizationTarget} onChange={function (v) { cfgSet(setCfg, "utilizationTarget", v); }} min={0} max={1} step={0.05} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Marge projet moyenne" : "Avg project margin"}>
                    <NumberField value={cfg.avgProjectMargin} onChange={function (v) { cfgSet(setCfg, "avgProjectMargin", v); }} min={0} max={1} step={0.05} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Rétention clients" : "Client retention"}>
                    <NumberField value={cfg.clientRetentionRate} onChange={function (v) { cfgSet(setCfg, "clientRetentionRate", v); }} min={0} max={1} step={0.05} width="90px" pct />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Pipeline commercial" : "Pipeline value"}>
                    <NumberField value={cfg.pipelineValue} onChange={function (v) { cfgSet(setCfg, "pipelineValue", v); }} min={0} max={10000000} step={10000} width="110px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Durée projet moyenne (sem.)" : "Avg project duration (wks)"}>
                    <NumberField value={cfg.avgProjectDurationWeeks} onChange={function (v) { cfgSet(setCfg, "avgProjectDurationWeeks", v); }} min={1} max={52} step={1} width="80px" />
                  </SettingRow>
                </Section>
              ) : null}

              {cfg.businessType === "freelancer" ? (
                <Section title={lang === "fr" ? "Métriques Indépendant" : "Freelancer Metrics"} last>
                  <SettingRow label={lang === "fr" ? "Tarif journalier" : "Daily rate"}>
                    <NumberField value={cfg.dailyRate} onChange={function (v) { cfgSet(setCfg, "dailyRate", v); }} min={0} max={5000} step={50} width="100px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Jours ouvrés / an" : "Working days / year"}>
                    <NumberField value={cfg.workingDaysPerYear} onChange={function (v) { cfgSet(setCfg, "workingDaysPerYear", v); }} min={100} max={300} step={1} width="80px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Jours de congé" : "Vacation days"}>
                    <NumberField value={cfg.vacationDays} onChange={function (v) { cfgSet(setCfg, "vacationDays", v); }} min={0} max={60} step={1} width="80px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Jours facturés" : "Days billed"}>
                    <NumberField value={cfg.daysBilled} onChange={function (v) { cfgSet(setCfg, "daysBilled", v); }} min={0} max={300} step={1} width="80px" />
                  </SettingRow>
                  <SettingRow label={lang === "fr" ? "Taux cotisations sociales" : "Social contribution rate"}>
                    <NumberField value={cfg.socialContributionRate} onChange={function (v) { cfgSet(setCfg, "socialContributionRate", v); }} min={0} max={0.50} step={0.005} width="90px" pct />
                  </SettingRow>
                </Section>
              ) : null}

              {cfg.businessType === "other" ? (
                <Section title={lang === "fr" ? "Métriques Générales" : "General Metrics"} last>
                  <div style={{ padding: "var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {lang === "fr"
                      ? "Sélectionnez un type d'activité plus spécifique dans votre profil pour débloquer des métriques adaptées (SaaS, E-commerce, Retail, Services, Indépendant)."
                      : "Select a more specific business type in your profile to unlock tailored metrics (SaaS, E-commerce, Retail, Services, Freelancer)."}
                  </div>
                </Section>
              ) : null}

              <Divider />

              <Section title={lang === "fr" ? "Paramètres fiscaux avancés" : "Advanced fiscal settings"} last>
                <SettingRow label={lang === "fr" ? "Régime TVA" : "VAT regime"}>
                  <Select
                    value={cfg.tvaRegime || "quarterly"}
                    onChange={function (v) { cfgSet(setCfg, "tvaRegime", v); }}
                    options={[
                      { value: "monthly", label: lang === "fr" ? "Mensuel" : "Monthly" },
                      { value: "quarterly", label: lang === "fr" ? "Trimestriel" : "Quarterly" },
                      { value: "exempt", label: lang === "fr" ? "Exonéré (art. 44)" : "Exempt (art. 44)" },
                    ]}
                    width={160}
                  />
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Méthode d'amortissement" : "Depreciation method"}>
                  <Select
                    value={cfg.depreciationMethod || "linear"}
                    onChange={function (v) { cfgSet(setCfg, "depreciationMethod", v); }}
                    options={[
                      { value: "linear", label: lang === "fr" ? "Linéaire" : "Linear" },
                      { value: "declining", label: lang === "fr" ? "Dégressif" : "Declining balance" },
                    ]}
                    width={160}
                  />
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Délai encaissement clients (j)" : "Client payment terms (days)"}>
                  <NumberField value={cfg.paymentTermsClient} onChange={function (v) { cfgSet(setCfg, "paymentTermsClient", v); }} min={0} max={120} step={5} width="80px" />
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Délai paiement fournisseurs (j)" : "Supplier payment terms (days)"}>
                  <NumberField value={cfg.paymentTermsSupplier} onChange={function (v) { cfgSet(setCfg, "paymentTermsSupplier", v); }} min={0} max={120} step={5} width="80px" />
                </SettingRow>
                <SettingRow label={lang === "fr" ? "DRI (déduction innovation)" : "DRI (innovation deduction)"}>
                  <Toggle on={cfg.driEnabled} onChange={function () { cfgSet(setCfg, "driEnabled", !cfg.driEnabled); }} />
                </SettingRow>
              </Section>
            </Card>
          ) : null}

          {/* ── METRICS & TARGETS ── */}
          {activeSection === "metrics" ? (
            <Card>
              <Section title={t.saas_title} sub={t.saas_sub}>
                {[
                  ["churnMonthly", t.saas_churn, 0.001, 0.50, t.tip_churn, true],
                  ["cacTarget", t.saas_cac, 100, 20000, t.tip_cac],
                ].map(function (f) {
                  return (
                    <SettingRow key={f[0]} label={f[1]} tip={f[4]}>
                      <NumberField value={cfg[f[0]]} onChange={function (v) { cfgSet(setCfg, f[0], v); }} min={0} max={f[3]} step={f[2]} width="100px" pct={f[5]} />
                    </SettingRow>
                  );
                })}
              </Section>

              <Divider />

              <Section title={t.targets_title} sub={t.targets_sub} last>
                {[
                  ["arr", t.targets_arr, 10000, 10000000, t.tip_target_arr],
                  ["mrr", t.targets_mrr, 1000, 1000000, t.tip_target_mrr],
                  ["runway", t.targets_runway, 1, 60, t.tip_target_runway],
                  ["ebitdaMargin", t.targets_ebitda, 0.01, 1, t.tip_target_ebitda, true],
                ].map(function (f) {
                  var tg = cfg.targets || {};
                  return (
                    <SettingRow key={f[0]} label={f[1]} tip={f[4]}>
                      <NumberField value={tg[f[0]] || 0} onChange={function (v) { cfgSetNested(setCfg, "targets", f[0], v); }} min={0} max={f[3]} step={f[2]} width="110px" pct={f[5]} />
                    </SettingRow>
                  );
                })}
              </Section>
            </Card>
          ) : null}

          {/* ── APPEARANCE ── */}
          {activeSection === "appearance" ? (
            <Card>
              <Section title={t.appearance_theme_title || (lang === "fr" ? "Th\u00e8me" : "Theme")} sub={t.appearance_theme_sub || (lang === "fr" ? "Choisissez l'apparence de l'interface." : "Choose the interface appearance.")}>
                <ThemePicker
                  value={themeMode}
                  onChange={setThemeMode}
                  t={{
                    theme_light: t.theme_light || (lang === "fr" ? "Clair" : "Light"),
                    theme_dark: t.theme_dark || (lang === "fr" ? "Sombre" : "Dark"),
                    theme_auto: t.theme_auto || (lang === "fr" ? "Syst\u00e8me" : "System"),
                  }}
                />
              </Section>

              <Divider />

              <Section title={t.appearance_lang_title || (lang === "fr" ? "Langue" : "Language")} sub={t.appearance_lang_sub || (lang === "fr" ? "Langue d'affichage du dashboard." : "Dashboard display language.")}>
                <SettingRow label={t.appearance_lang_label || (lang === "fr" ? "Langue de l'interface" : "Interface language")}>
                  <Select
                    value={lang}
                    onChange={function () { toggleLang(); }}
                    options={[
                      { value: "fr", label: "Fran\u00e7ais" },
                      { value: "en", label: "English" },
                    ]}
                    width={140}
                  />
                </SettingRow>
              </Section>

              <Divider />

              <Section title={t.currency_title} sub={t.currency_sub}>
                <SettingRow label={t.currency_display} tip={t.tip_currency}>
                  <Select
                    value={cfg.currency || "EUR"}
                    onChange={function (v) { cfgSet(setCfg, "currency", v || "EUR"); }}
                    options={[
                      { value: "EUR", label: "EUR (\u20ac)" },
                      { value: "USD", label: "USD ($)" },
                      { value: "CHF", label: "CHF (Fr.)" },
                    ]}
                    width={130}
                  />
                </SettingRow>

                <SettingRow label={t.kpi_format_title} tip={t.tip_kpi_format}>
                  <Select
                    value={cfg.kpiShort !== false ? "short" : "long"}
                    onChange={function (v) { cfgSet(setCfg, "kpiShort", v === "short"); }}
                    options={[
                      { value: "short", label: t.kpi_format_short },
                      { value: "long", label: t.kpi_format_long },
                    ]}
                    width={160}
                  />
                </SettingRow>

                {(cfg.currency || "EUR") !== "EUR" ? (
                  <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginTop: "var(--sp-3)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-3)" }}>{t.currency_rates_title}</div>
                    {["USD", "CHF"].map(function (c) {
                      return (
                        <SettingRow key={c} label={"1 EUR = ? " + c}>
                          <NumberField
                            value={(cfg.exchangeRates || {})[c] || 1}
                            onChange={function (v) { cfgSetNested(setCfg, "exchangeRates", c, v); }}
                            min={0.01} max={10} step={0.01} width="90px"
                          />
                        </SettingRow>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>{t.currency_base_note}</div>
                )}
              </Section>

              <Divider />

              <Section title={t.appearance_access_title || (lang === "fr" ? "Accessibilit\u00e9" : "Accessibility")} sub={t.appearance_access_sub || (lang === "fr" ? "Ajustez l'interface pour am\u00e9liorer la lisibilit\u00e9." : "Adjust the interface to improve readability.")} last>
                <div style={{ marginBottom: "var(--sp-4)" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>
                    {t.appearance_font_size || (lang === "fr" ? "Taille de police" : "Font size")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 20, textAlign: "center" }}>A</span>
                    <input
                      type="range"
                      min="0.85" max="1.30" step="0.05"
                      value={cfg.fontScale || 1}
                      onChange={function (e) {
                        var v = parseFloat(e.target.value);
                        cfgSet(setCfg, "fontScale", v);
                        document.documentElement.style.setProperty("--font-scale", String(v));
                        try { localStorage.setItem("fontScale", String(v)); } catch (err) {}
                      }}
                      style={{ flex: 1, accentColor: "var(--brand)", cursor: "pointer", height: 6 }}
                    />
                    <span style={{ fontSize: 16, color: "var(--text-muted)", minWidth: 20, textAlign: "center" }}>A</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                      background: "var(--bg-accordion)", padding: "2px 8px", borderRadius: "var(--r-sm)",
                      minWidth: 44, textAlign: "center",
                    }}>
                      {Math.round((cfg.fontScale || 1) * 100)}%
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-2)", fontSize: 10, color: "var(--text-ghost)" }}>
                    <span>85%</span>
                    <span>100%</span>
                    <span>130%</span>
                  </div>
                </div>

                <SettingRow
                  label={t.appearance_animations || (lang === "fr" ? "Animations de transition" : "Transition animations")}
                  desc={t.appearance_animations_desc || (lang === "fr" ? "D\u00e9sactiver r\u00e9duit les mouvements pour les utilisateurs sensibles." : "Disabling reduces motion for sensitive users.")}
                >
                  <Toggle
                    on={cfg.animationsEnabled !== false}
                    onChange={function () { cfgSet(setCfg, "animationsEnabled", cfg.animationsEnabled === false); }}
                  />
                </SettingRow>
              </Section>
            </Card>
          ) : null}

          {/* ── DEVELOPER ── */}
          {activeSection === "developer" ? (
            <Card>
              <Section title={td.settings_title || "Developer Mode"} sub={td.settings_desc || "Show formulas with real values on hover"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{lang === "fr" ? "Activer le mode d\u00e9veloppeur" : "Enable developer mode"}</span>
                  <Toggle on={devMode} onChange={toggleDevMode} color="var(--color-dev)" />
                </div>
              </Section>

              {devMode ? (
                <>
                  <Divider />
                  <Section title={td.timing_title || "DevBar Timings"} sub={td.timing_sub || "Animation phase durations (ms)"} last>
                    {[
                      ["enterMs", td.timing_enter || "Enter", 50, 2000, td.tip_timing_enter],
                      ["initMs", td.timing_init || "Init", 0, 10000, td.tip_timing_init],
                      ["deinitMs", td.timing_deinit || "Deinit", 0, 10000, td.tip_timing_deinit],
                      ["exitMs", td.timing_exit || "Exit", 50, 2000, td.tip_timing_exit],
                    ].map(function (f) {
                      var dt = cfg.devTiming || {};
                      return (
                        <SettingRow key={f[0]} label={f[1]} tip={f[4]}>
                          <NumberField
                            value={dt[f[0]] != null ? dt[f[0]] : DEFAULT_CONFIG.devTiming[f[0]]}
                            onChange={function (v) { cfgSetNested(setCfg, "devTiming", f[0], v); }}
                            min={f[2]} max={f[3]} step={50} width="90px"
                            suf={td.timing_unit || "ms"}
                          />
                        </SettingRow>
                      );
                    })}
                  </Section>
                </>
              ) : null}
            </Card>
          ) : null}

          {/* ── DANGER ZONE ── */}
          {activeSection === "danger" ? (
            <Card>
              <Section title={t.nav_danger || (lang === "fr" ? "Zone de danger" : "Danger zone")} sub={lang === "fr" ? "Actions irr\u00e9versibles. Proc\u00e9dez avec prudence." : "Irreversible actions. Proceed with caution."} last>
                <div style={{
                  padding: "var(--sp-4)",
                  border: "1px solid var(--color-error-border)",
                  borderRadius: "var(--r-md)",
                  background: "var(--color-error-bg)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-error)", marginBottom: 2 }}>{t.reset_all}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "fr" ? "R\u00e9initialise toutes les donn\u00e9es et param\u00e8tres." : "Resets all data and settings."}</div>
                    </div>
                    <button
                      onClick={function () {
                        if (!window.confirm(lang === "fr" ? "\u00cates-vous s\u00fbr ? Toutes vos donn\u00e9es seront perdues." : "Are you sure? All data will be lost.")) return;
                        setCfg(function () { return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); });
                        setCosts(JSON.parse(JSON.stringify(COST_DEF)));
                        setSals(JSON.parse(JSON.stringify(SAL_DEF)));
                        setGrants(JSON.parse(JSON.stringify(GRANT_DEF)));
                        setPoolSize(POOL_SIZE_DEF);
                        setShareholders(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
                        setRoundSim(function () { return JSON.parse(JSON.stringify(ROUND_SIM_DEF)); });
                        setStreams(JSON.parse(JSON.stringify(STREAMS_DEF)));
                        setEsopEnabled(false);
                        save(STORAGE_KEY, null);
                      }}
                      style={{
                        padding: "0 var(--sp-4)", height: 36,
                        border: "1px solid var(--color-error)",
                        borderRadius: "var(--r-md)",
                        background: "var(--color-error)",
                        fontSize: 13, fontWeight: 600, color: "#fff",
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
                        flexShrink: 0,
                      }}
                    >
                      <ArrowCounterClockwise size={14} />
                      {t.reset_all}
                    </button>
                  </div>
                </div>
              </Section>
            </Card>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
