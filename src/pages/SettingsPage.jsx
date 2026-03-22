import { useState, useEffect, useRef } from "react";
import { ArrowCounterClockwise, Sun, Moon, Desktop, Receipt, Gauge, PaintBrush, Code, Trash, Briefcase, Bell, Calculator, ChartLine, Keyboard, Scales } from "@phosphor-icons/react";
import { DEFAULT_CONFIG } from "../constants/config";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF } from "../constants/defaults";
import { PageLayout, NumberField, Card } from "../components";
import Select from "../components/Select";
import { save } from "../utils/storage";
import { STORAGE_KEY } from "../constants/config";
import { useT, useLang, useDevMode, useTheme } from "../context";

/* ── Sub-sidebar nav item ── */
function NavItem({ icon, label, active, onClick, color }) {
  var Icon = icon;
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "var(--sp-2)",
      width: "100%", padding: "8px 12px", height: 36,
      border: "none", borderRadius: "var(--r-md)",
      background: active ? "var(--brand-bg)" : "transparent",
      cursor: "pointer", textAlign: "left", transition: "background 0.1s",
    }}>
      <Icon size={15} weight={active ? "fill" : "regular"} color={active ? (color || "var(--brand)") : "var(--text-muted)"} />
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? (color || "var(--brand)") : "var(--text-secondary)" }}>{label}</span>
    </button>
  );
}

function NavGroupLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-ghost)", padding: "var(--sp-3) 12px var(--sp-1)" }}>
      {children}
    </div>
  );
}

/* ── Section header + card pattern ── */
function SectionBlock({ title, sub, children }) {
  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <div style={{ marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
        {sub ? <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div> : null}
      </div>
      <Card sx={{ padding: "var(--sp-1) var(--sp-4)" }}>
        {children}
      </Card>
    </div>
  );
}

/* ── Setting row ── */
function SettingRow({ label, desc, children, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--border-light)",
      gap: "var(--sp-4)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {desc ? <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{desc}</div> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ── Page title ── */
function PageTitle({ title }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px", margin: "0 0 var(--sp-6)" }}>
      {title}
    </h2>
  );
}

/* ── Toggle ── */
function Toggle({ on, onChange, color }) {
  return (
    <button role="switch" aria-checked={on} onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: on ? (color || "var(--brand)") : "var(--border-strong)",
      position: "relative", transition: "background 150ms", flexShrink: 0, padding: 0,
    }}>
      <span style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "var(--bg-card)", left: on ? 22 : 2, transition: "left 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

/* ── Theme picker ── */
function ThemePicker({ value, onChange, lang }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[{ id: "light", icon: Sun, l: lang === "fr" ? "Clair" : "Light" }, { id: "dark", icon: Moon, l: lang === "fr" ? "Sombre" : "Dark" }, { id: "auto", icon: Desktop, l: lang === "fr" ? "Système" : "System" }].map(function (o) {
        var active = value === o.id; var Icon = o.icon;
        return (<button key={o.id} onClick={function () { onChange(o.id); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: "var(--r-md)", border: active ? "1px solid var(--brand)" : "1px solid var(--border)", background: active ? "var(--brand-bg)" : "transparent", color: active ? "var(--brand)" : "var(--text-secondary)", fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer" }}><Icon size={14} weight={active ? "fill" : "regular"} /> {o.l}</button>);
      })}
    </div>
  );
}

function cfgSet(setCfg, key, val) {
  setCfg(function (p) { var n = {}; Object.keys(p).forEach(function (k) { n[k] = p[k]; }); n[key] = val; return n; });
}

/* ══════════════════════════════════════════ */

export default function SettingsPage({
  cfg, setCfg, setCosts, setSals, setGrants, setPoolSize,
  setShareholders, setRoundSim, setStreams, setEsopEnabled,
  initialSection,
}) {
  var tAll = useT(); var t = tAll.settings; var td = tAll.dev || {};
  var { lang, toggleLang } = useLang();
  var { dark, toggle: toggleTheme } = useTheme();
  var { devMode, toggle: toggleDevMode } = useDevMode();
  var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  var [section, setSection] = useState(initialSection || "appearance");
  var contentRef = useRef(null);

  var [themeMode, setThemeModeState] = useState(function () {
    try { var pref = localStorage.getItem("themeMode"); if (pref === "dark" || pref === "light" || pref === "auto") return pref; } catch (e) {}
    return dark ? "dark" : "light";
  });
  function setThemeMode(mode) {
    setThemeModeState(mode);
    try { localStorage.setItem("themeMode", mode); } catch (e) {}
    if (mode === "auto") { var pd = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; if ((pd && !dark) || (!pd && dark)) toggleTheme(window.innerWidth / 2, window.innerHeight / 2); }
    else if (mode === "dark" && !dark) toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
    else if (mode === "light" && dark) toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
  }

  useEffect(function () {
    function onSection(e) { if (e.detail) setSection(e.detail); }
    window.addEventListener("settings-section", onSection);
    return function () { window.removeEventListener("settings-section", onSection); };
  }, []);
  useEffect(function () { if (contentRef.current) contentRef.current.scrollTop = 0; }, [section]);

  var BIZ = { saas: "SaaS", ecommerce: "E-commerce", retail: "Retail", services: "Services", freelancer: lang === "fr" ? "Indépendant" : "Freelancer", other: lang === "fr" ? "Général" : "General" };

  return (
    <PageLayout
      title={lang === "fr" ? "Paramètres" : "Settings"}
      subtitle={lang === "fr" ? "Apparence, fiscalité et préférences." : "Appearance, tax and preferences."}
    >
      <div style={{ display: "flex", gap: "var(--gap-lg)", alignItems: "flex-start", minHeight: "calc(100vh - 200px)" }}>

        {/* ── Sub-sidebar ── */}
        <div style={{ width: 190, flexShrink: 0, position: "sticky", top: "calc(var(--page-py) + 60px)" }}>
          <NavGroupLabel>{lang === "fr" ? "Général" : "General"}</NavGroupLabel>
          <NavItem icon={PaintBrush} label={lang === "fr" ? "Apparence" : "Appearance"} active={section === "appearance"} onClick={function () { setSection("appearance"); }} />
          <NavItem icon={Bell} label={lang === "fr" ? "Alertes" : "Alerts"} active={section === "alerts"} onClick={function () { setSection("alerts"); }} />
          <NavItem icon={Keyboard} label={lang === "fr" ? "Raccourcis" : "Shortcuts"} active={section === "shortcuts"} onClick={function () { setSection("shortcuts"); }} />

          <NavGroupLabel>{lang === "fr" ? "Financier" : "Financial"}</NavGroupLabel>
          <NavItem icon={Receipt} label={lang === "fr" ? "Fiscalité" : "Tax"} active={section === "fiscal"} onClick={function () { setSection("fiscal"); }} />
          <NavItem icon={Briefcase} label={BIZ[cfg.businessType] || "Metrics"} active={section === "business"} onClick={function () { setSection("business"); }} />
          <NavItem icon={Gauge} label={lang === "fr" ? "Objectifs" : "Targets"} active={section === "metrics"} onClick={function () { setSection("metrics"); }} />
          <NavItem icon={ChartLine} label="Projections" active={section === "projections"} onClick={function () { setSection("projections"); }} />
          <NavItem icon={Calculator} label={lang === "fr" ? "Comptabilité" : "Accounting"} active={section === "accounting"} onClick={function () { setSection("accounting"); }} />

          <NavGroupLabel>{lang === "fr" ? "Système" : "System"}</NavGroupLabel>
          <NavItem icon={Scales} label={lang === "fr" ? "Mode comptable" : "Accountant mode"} active={section === "accountant"} onClick={function () { setSection("accountant"); }} />
          <NavItem icon={Code} label="Developer" active={section === "developer"} onClick={function () { setSection("developer"); }} />
          <NavItem icon={Trash} label={lang === "fr" ? "Danger" : "Danger"} active={section === "danger"} onClick={function () { setSection("danger"); }} color="var(--color-error)" />
        </div>

        {/* ── Content ── */}
        <div ref={contentRef} style={{ flex: 1, minWidth: 0, maxWidth: 580 }}>

          {section === "appearance" ? (
            <>
              <PageTitle title={lang === "fr" ? "Apparence" : "Appearance"} />

              <SectionBlock title={lang === "fr" ? "Général" : "General"} sub={lang === "fr" ? "Langue, devise et format d'affichage." : "Language, currency and display format."}>
                <SettingRow label={lang === "fr" ? "Langue" : "Language"}><Select value={lang} onChange={function () { toggleLang(); }} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} width={130} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Devise" : "Currency"}><Select value={cfg.currency || "EUR"} onChange={function (v) { cfgSet(setCfg, "currency", v || "EUR"); }} options={[{ value: "EUR", label: "EUR (€)" }, { value: "USD", label: "USD ($)" }, { value: "CHF", label: "CHF" }]} width={120} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Format montants" : "Amount format"} last><Select value={cfg.kpiShort !== false ? "short" : "long"} onChange={function (v) { cfgSet(setCfg, "kpiShort", v === "short"); }} options={[{ value: "short", label: "12k" }, { value: "long", label: "12 000" }]} width={100} /></SettingRow>
              </SectionBlock>

              <SectionBlock title={lang === "fr" ? "Interface et thème" : "Interface and theme"} sub={lang === "fr" ? "Apparence visuelle de l'application." : "Visual appearance of the application."}>
                <SettingRow label={lang === "fr" ? "Thème" : "Theme"}><ThemePicker value={themeMode} onChange={setThemeMode} lang={lang} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Taille de police" : "Font size"} desc={lang === "fr" ? "Ajustez la lisibilité." : "Adjust readability."}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <span style={{ fontSize: 12 }}>A</span>
                    <input type="range" min="0.85" max="1.30" step="0.05" value={cfg.fontScale || 1} onChange={function (e) { var v = parseFloat(e.target.value); cfgSet(setCfg, "fontScale", v); document.documentElement.style.setProperty("--font-scale", String(v)); try { localStorage.setItem("fontScale", String(v)); } catch (err) {} }} style={{ width: 80, accentColor: "var(--brand)", cursor: "pointer" }} />
                    <span style={{ fontSize: 16 }}>A</span>
                    <span style={{ fontSize: 11, fontWeight: 600, background: "var(--bg-page)", padding: "2px 6px", borderRadius: 4 }}>{Math.round((cfg.fontScale || 1) * 100)}%</span>
                  </div>
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Animations" : "Animations"} desc={lang === "fr" ? "Désactiver réduit les mouvements." : "Disabling reduces motion."} last>
                  <Toggle on={cfg.animationsEnabled !== false} onChange={function () { cfgSet(setCfg, "animationsEnabled", cfg.animationsEnabled === false); }} />
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "alerts" ? (
            <>
              <PageTitle title={lang === "fr" ? "Alertes" : "Alerts"} />
              <SectionBlock title={lang === "fr" ? "Seuils d'alerte" : "Alert thresholds"} sub={lang === "fr" ? "Avertissements visuels sur le dashboard." : "Visual warnings on the dashboard."}>
                <SettingRow label={lang === "fr" ? "Runway minimum" : "Min runway"} desc={lang === "fr" ? "Alerte si trésorerie < X mois." : "Alert if cash < X months."}><NumberField value={cfg.alertRunwayMonths || 6} onChange={function (v) { cfgSet(setCfg, "alertRunwayMonths", v); }} min={1} max={36} step={1} width="60px" suf="mo" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Couverture minimum" : "Min coverage"} desc={lang === "fr" ? "Alerte si revenus < X% des charges." : "Alert if revenue < X% of costs."} last><NumberField value={cfg.alertMinCoverage || 0.80} onChange={function (v) { cfgSet(setCfg, "alertMinCoverage", v); }} min={0} max={2} step={0.05} width="70px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "shortcuts" ? (
            <>
              <PageTitle title={lang === "fr" ? "Raccourcis clavier" : "Keyboard shortcuts"} />
              <SectionBlock title={lang === "fr" ? "Navigation" : "Navigation"}>
                {[{ k: "1 — 9", l: lang === "fr" ? "Pages" : "Pages" }, { k: isMac ? "⌘ K" : "Ctrl K", l: lang === "fr" ? "Commandes" : "Commands" }].map(function (s, i, a) {
                  return (<div key={s.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.l}</span><div style={{ display: "flex", gap: 3 }}>{s.k.split(" ").map(function (k2, ki) { return <kbd key={ki} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 6px", fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,monospace", color: "var(--text-secondary)", background: "var(--bg-page)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)", boxShadow: "0 1px 0 var(--border-strong)" }}>{k2}</kbd>; })}</div></div>);
                })}
              </SectionBlock>
              <SectionBlock title="Actions">
                {[{ k: isMac ? "⌘ Z" : "Ctrl Z", l: lang === "fr" ? "Annuler" : "Undo" }, { k: isMac ? "⌘ S" : "Ctrl S", l: lang === "fr" ? "Exporter" : "Export" }, { k: isMac ? "⌘ ⇧ D" : "Ctrl ⇧ D", l: "Dev mode" }, { k: "?", l: lang === "fr" ? "Aide" : "Help" }].map(function (s, i, a) {
                  return (<div key={s.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.l}</span><div style={{ display: "flex", gap: 3 }}>{s.k.split(" ").map(function (k2, ki) { return <kbd key={ki} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 6px", fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,monospace", color: "var(--text-secondary)", background: "var(--bg-page)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)", boxShadow: "0 1px 0 var(--border-strong)" }}>{k2}</kbd>; })}</div></div>);
                })}
              </SectionBlock>
            </>
          ) : null}

          {section === "fiscal" ? (
            <>
              <PageTitle title={lang === "fr" ? "Fiscalité" : "Tax"} />
              <SectionBlock title="TVA" sub={lang === "fr" ? "Taxe sur la valeur ajoutée." : "Value-added tax."}>
                <SettingRow label={lang === "fr" ? "Taux" : "Rate"}><NumberField value={cfg.vat} onChange={function (v) { cfgSet(setCfg, "vat", v); }} min={0} max={0.30} step={0.01} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Régime" : "Regime"} last><Select value={cfg.tvaRegime || "quarterly"} onChange={function (v) { cfgSet(setCfg, "tvaRegime", v); }} options={[{ value: "monthly", label: lang === "fr" ? "Mensuel" : "Monthly" }, { value: "quarterly", label: lang === "fr" ? "Trimestriel" : "Quarterly" }, { value: "exempt", label: lang === "fr" ? "Exonéré" : "Exempt" }]} width={140} /></SettingRow>
              </SectionBlock>
              <SectionBlock title="ISOC" sub={lang === "fr" ? "Impôt des sociétés." : "Corporate tax."}>
                <SettingRow label={lang === "fr" ? "Capital social" : "Share capital"}><NumberField value={cfg.capitalSocial} onChange={function (v) { cfgSet(setCfg, "capitalSocial", v); }} min={0} max={500000} step={1000} width="100px" /></SettingRow>
                <SettingRow label="DRI" desc={lang === "fr" ? "Déduction pour revenus d'innovation." : "Innovation income deduction."} last><Toggle on={cfg.driEnabled} onChange={function () { cfgSet(setCfg, "driEnabled", !cfg.driEnabled); }} /></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Charges sociales" : "Social charges"} sub={lang === "fr" ? "ONSS, précompte et patronales." : "Social security contributions."}>
                <SettingRow label="ONSS"><NumberField value={cfg.onss} onChange={function (v) { cfgSet(setCfg, "onss", v); }} min={0} max={1} step={0.001} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Précompte" : "Withholding"}><NumberField value={cfg.prec} onChange={function (v) { cfgSet(setCfg, "prec", v); }} min={0} max={1} step={0.001} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Patronales" : "Employer"} last><NumberField value={cfg.patr} onChange={function (v) { cfgSet(setCfg, "patr", v); }} min={0} max={1} step={0.001} width="80px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "business" ? (
            <>
              <PageTitle title={(lang === "fr" ? "Métriques " : "Metrics ") + (BIZ[cfg.businessType] || "")} />
              <SectionBlock title={lang === "fr" ? "Type d'activité" : "Business type"}>
                <SettingRow label={BIZ[cfg.businessType]} last>
                  <button onClick={function () { window.dispatchEvent(new CustomEvent("nav-tab", { detail: "profile" })); }} style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}>{lang === "fr" ? "Modifier" : "Change"}</button>
                </SettingRow>
              </SectionBlock>
              {cfg.businessType === "saas" ? (
                <SectionBlock title="SaaS">
                  <SettingRow label={lang === "fr" ? "Churn mensuel" : "Monthly churn"}><NumberField value={cfg.churnMonthly} onChange={function (v) { cfgSet(setCfg, "churnMonthly", v); }} min={0} max={0.50} step={0.001} width="80px" pct /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Expansion MRR" : "MRR expansion"}><NumberField value={cfg.expansionRate} onChange={function (v) { cfgSet(setCfg, "expansionRate", v); }} min={0} max={0.20} step={0.005} width="80px" pct /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Croissance CA" : "Revenue growth"}><NumberField value={cfg.revenueGrowthRate} onChange={function (v) { cfgSet(setCfg, "revenueGrowthRate", v); }} min={0} max={3} step={0.05} width="80px" pct /></SettingRow>
                  <SettingRow label="CAC" last><NumberField value={cfg.cacTarget} onChange={function (v) { cfgSet(setCfg, "cacTarget", v); }} min={0} max={20000} step={100} width="90px" /></SettingRow>
                </SectionBlock>
              ) : null}
              {cfg.businessType === "ecommerce" ? (<SectionBlock title="E-commerce">
                <SettingRow label={lang === "fr" ? "Commandes / mois" : "Orders / mo"}><NumberField value={cfg.ordersPerMonth} onChange={function (v) { cfgSet(setCfg, "ordersPerMonth", v); }} min={0} max={100000} step={10} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Visiteurs / mois" : "Visitors / mo"}><NumberField value={cfg.monthlyVisitors} onChange={function (v) { cfgSet(setCfg, "monthlyVisitors", v); }} min={0} max={10000000} step={100} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Taux de retour" : "Return rate"} last><NumberField value={cfg.returnRate} onChange={function (v) { cfgSet(setCfg, "returnRate", v); }} min={0} max={0.50} step={0.01} width="80px" pct /></SettingRow>
              </SectionBlock>) : null}
              {cfg.businessType === "services" ? (<SectionBlock title="Services">
                <SettingRow label={lang === "fr" ? "Taux horaire" : "Hourly rate"}><NumberField value={cfg.avgHourlyRate} onChange={function (v) { cfgSet(setCfg, "avgHourlyRate", v); }} min={0} max={500} step={5} width="80px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Utilisation" : "Utilization"}><NumberField value={cfg.utilizationTarget} onChange={function (v) { cfgSet(setCfg, "utilizationTarget", v); }} min={0} max={1} step={0.05} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Marge projet" : "Project margin"} last><NumberField value={cfg.avgProjectMargin} onChange={function (v) { cfgSet(setCfg, "avgProjectMargin", v); }} min={0} max={1} step={0.05} width="80px" pct /></SettingRow>
              </SectionBlock>) : null}
              {cfg.businessType === "freelancer" ? (<SectionBlock title={lang === "fr" ? "Indépendant" : "Freelancer"}>
                <SettingRow label={lang === "fr" ? "Tarif journalier" : "Daily rate"}><NumberField value={cfg.dailyRate} onChange={function (v) { cfgSet(setCfg, "dailyRate", v); }} min={0} max={5000} step={50} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Jours ouvrés" : "Working days"}><NumberField value={cfg.workingDaysPerYear} onChange={function (v) { cfgSet(setCfg, "workingDaysPerYear", v); }} min={100} max={300} step={1} width="70px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Jours facturés" : "Days billed"} last><NumberField value={cfg.daysBilled} onChange={function (v) { cfgSet(setCfg, "daysBilled", v); }} min={0} max={300} step={1} width="70px" /></SettingRow>
              </SectionBlock>) : null}
              {cfg.businessType === "retail" ? (<SectionBlock title="Retail">
                <SettingRow label={lang === "fr" ? "Surface (m²)" : "Store (m²)"}><NumberField value={cfg.storeSize} onChange={function (v) { cfgSet(setCfg, "storeSize", v); }} min={0} max={10000} step={10} width="80px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Fréquentation" : "Footfall"}><NumberField value={cfg.monthlyFootfall} onChange={function (v) { cfgSet(setCfg, "monthlyFootfall", v); }} min={0} max={100000} step={100} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Démarque" : "Shrinkage"} last><NumberField value={cfg.shrinkageRate} onChange={function (v) { cfgSet(setCfg, "shrinkageRate", v); }} min={0} max={0.10} step={0.001} width="80px" pct /></SettingRow>
              </SectionBlock>) : null}
            </>
          ) : null}

          {section === "metrics" ? (
            <>
              <PageTitle title={lang === "fr" ? "Objectifs" : "Targets"} />
              <SectionBlock title={lang === "fr" ? "Objectifs financiers" : "Financial targets"} sub={lang === "fr" ? "Vos objectifs pour suivre la progression." : "Your goals to track progress."}>
                <SettingRow label={lang === "fr" ? "ARR cible" : "Target ARR"}><NumberField value={(cfg.targets || {}).arr || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { arr: v })); }} min={0} max={10000000} step={10000} width="110px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "MRR cible" : "Target MRR"}><NumberField value={(cfg.targets || {}).mrr || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { mrr: v })); }} min={0} max={1000000} step={1000} width="100px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Runway cible" : "Target runway"}><NumberField value={(cfg.targets || {}).runway || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { runway: v })); }} min={0} max={60} step={1} width="60px" suf="mo" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Marge EBITDA" : "EBITDA margin"} last><NumberField value={(cfg.targets || {}).ebitdaMargin || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { ebitdaMargin: v })); }} min={0} max={1} step={0.01} width="80px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "projections" ? (
            <>
              <PageTitle title="Projections" />
              <SectionBlock title={lang === "fr" ? "Paramètres de projection" : "Projection settings"} sub={lang === "fr" ? "Valeurs par défaut pour la trésorerie." : "Defaults for cash flow projections."}>
                <SettingRow label={lang === "fr" ? "Horizon" : "Horizon"}><NumberField value={cfg.projectionYears || 3} onChange={function (v) { cfgSet(setCfg, "projectionYears", v); }} min={1} max={10} step={1} width="60px" suf={lang === "fr" ? "ans" : "yrs"} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Croissance CA" : "Revenue growth"}><NumberField value={cfg.revenueGrowthRate || 0.10} onChange={function (v) { cfgSet(setCfg, "revenueGrowthRate", v); }} min={-0.50} max={5} step={0.05} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Inflation charges" : "Cost escalation"} last><NumberField value={cfg.costEscalation || 0.02} onChange={function (v) { cfgSet(setCfg, "costEscalation", v); }} min={0} max={0.50} step={0.01} width="80px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "accounting" ? (
            <>
              <PageTitle title={lang === "fr" ? "Comptabilité" : "Accounting"} />
              <SectionBlock title={lang === "fr" ? "Exercice fiscal" : "Fiscal year"}>
                <SettingRow label={lang === "fr" ? "Début" : "Start"} last><Select value={cfg.fiscalYearStart || "01-01"} onChange={function (v) { cfgSet(setCfg, "fiscalYearStart", v); }} options={[{ value: "01-01", label: lang === "fr" ? "Janvier" : "January" }, { value: "04-01", label: lang === "fr" ? "Avril" : "April" }, { value: "07-01", label: lang === "fr" ? "Juillet" : "July" }, { value: "10-01", label: lang === "fr" ? "Octobre" : "October" }]} width={130} /></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Amortissement" : "Depreciation"}>
                <SettingRow label={lang === "fr" ? "Méthode par défaut" : "Default method"} last><Select value={cfg.depreciationMethod || "linear"} onChange={function (v) { cfgSet(setCfg, "depreciationMethod", v); }} options={[{ value: "linear", label: lang === "fr" ? "Linéaire" : "Straight-line" }, { value: "declining", label: lang === "fr" ? "Dégressif" : "Declining" }]} width={130} /></SettingRow>
              </SectionBlock>
              {cfg.showPcmn ? (
                <SectionBlock title={lang === "fr" ? "Durées d'amortissement" : "Depreciation durations"} sub={lang === "fr" ? "Durées légales belges par catégorie d'actif. Modifiables si justifié." : "Belgian legal durations per asset category. Can be adjusted if justified."}>
                  <SettingRow label={lang === "fr" ? "Matériel informatique" : "IT equipment"} desc="PCMN 2410"><NumberField value={(cfg.depYears || {})["2410"] || 3} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2410"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Mobilier & véhicules" : "Furniture & vehicles"} desc="PCMN 2400"><NumberField value={(cfg.depYears || {})["2400"] || 5} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2400"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Brevets & marques" : "Patents & trademarks"} desc="PCMN 2110"><NumberField value={(cfg.depYears || {})["2110"] || 5} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2110"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Constructions" : "Buildings"} desc="PCMN 2210"><NumberField value={(cfg.depYears || {})["2210"] || 33} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2210"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Installations & machines" : "Plant & machinery"} desc="PCMN 2300"><NumberField value={(cfg.depYears || {})["2300"] || 10} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2300"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Frais d'établissement" : "Setup costs"} desc="PCMN 2010" last><NumberField value={(cfg.depYears || {})["2010"] || 5} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2010"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                </SectionBlock>
              ) : null}
              <SectionBlock title={lang === "fr" ? "Délais de paiement" : "Payment terms"} sub={lang === "fr" ? "Pour le calcul du BFR." : "For working capital calculation."}>
                <SettingRow label={lang === "fr" ? "Clients" : "Clients"}><NumberField value={cfg.paymentTermsClient || 30} onChange={function (v) { cfgSet(setCfg, "paymentTermsClient", v); }} min={0} max={120} step={5} width="60px" suf="j" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Fournisseurs" : "Suppliers"} last><NumberField value={cfg.paymentTermsSupplier || 30} onChange={function (v) { cfgSet(setCfg, "paymentTermsSupplier", v); }} min={0} max={120} step={5} width="60px" suf="j" /></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Titres-repas" : "Meal vouchers"} sub={lang === "fr" ? "Valeur faciale et répartition employeur / employé." : "Face value and employer / employee split."}>
                <SettingRow label={lang === "fr" ? "Valeur faciale" : "Face value"} desc={lang === "fr" ? "Maximum légal : 8,00 €" : "Legal max: €8.00"}><NumberField value={cfg.mealVoucherTotal || 8} onChange={function (v) { cfgSet(setCfg, "mealVoucherTotal", v); }} min={1} max={8} step={0.5} width="60px" suf="€" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Part employeur" : "Employer share"} desc={lang === "fr" ? "Maximum légal : 6,91 €" : "Legal max: €6.91"}><NumberField value={cfg.mealVoucherEmployer || 6.91} onChange={function (v) { cfgSet(setCfg, "mealVoucherEmployer", v); }} min={0} max={6.91} step={0.1} width="60px" suf="€" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Part employé" : "Employee share"} desc={lang === "fr" ? "Minimum légal : 1,09 €" : "Legal min: €1.09"} last><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{((cfg.mealVoucherTotal || 8) - (cfg.mealVoucherEmployer || 6.91)).toFixed(2)} €</span></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "accountant" ? (
            <>
              <PageTitle title={lang === "fr" ? "Mode comptable" : "Accounting mode"} />
              <SectionBlock title={lang === "fr" ? "Mode comptable" : "Accounting mode"} sub={lang === "fr" ? "Affiche les codes PCMN, les options comptables avancées et la barre comptable." : "Shows PCMN codes, advanced accounting options and the accounting bar."}>
                <SettingRow label={lang === "fr" ? "Activer" : "Enable"} desc={lang === "fr" ? "Ctrl+Shift+E pour basculer rapidement." : "Ctrl+Shift+E to toggle quickly."} last>
                  <Toggle on={cfg.showPcmn === true} onChange={function () { cfgSet(setCfg, "showPcmn", !cfg.showPcmn); }} />
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "developer" ? (
            <>
              <PageTitle title="Developer" />
              <SectionBlock title={lang === "fr" ? "Mode développeur" : "Developer mode"} sub={lang === "fr" ? "Outils de debug et formules." : "Debug tools and formulas."}>
                <SettingRow label={lang === "fr" ? "Activer" : "Enable"} desc={lang === "fr" ? "Affiche les formules au survol des valeurs." : "Shows formulas on hover."} last>
                  <Toggle on={devMode} onChange={toggleDevMode} color="var(--color-dev)" />
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "danger" ? (
            <>
              <PageTitle title={lang === "fr" ? "Zone de danger" : "Danger zone"} />
              <SectionBlock title={lang === "fr" ? "Réinitialisation" : "Reset"} sub={lang === "fr" ? "Action irréversible." : "Irreversible action."}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-error)" }}>{lang === "fr" ? "Supprimer toutes les données" : "Delete all data"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{lang === "fr" ? "Remet tout à zéro." : "Resets everything."}</div>
                  </div>
                  <button onClick={function () {
                    if (!window.confirm(lang === "fr" ? "Êtes-vous sûr ?" : "Are you sure?")) return;
                    setCfg(function () { return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); });
                    setCosts(JSON.parse(JSON.stringify(COST_DEF))); setSals(JSON.parse(JSON.stringify(SAL_DEF)));
                    setGrants(JSON.parse(JSON.stringify(GRANT_DEF))); setPoolSize(POOL_SIZE_DEF);
                    setShareholders(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
                    setRoundSim(function () { return JSON.parse(JSON.stringify(ROUND_SIM_DEF)); });
                    setStreams(JSON.parse(JSON.stringify(STREAMS_DEF))); setEsopEnabled(false);
                    save(STORAGE_KEY, null);
                  }} style={{
                    height: 36, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)",
                    background: "var(--color-error)", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)", flexShrink: 0,
                  }}>
                    <ArrowCounterClockwise size={14} /> Reset
                  </button>
                </div>
              </SectionBlock>
            </>
          ) : null}

        </div>
      </div>
    </PageLayout>
  );
}
