import { Article, Code, Timer } from "@phosphor-icons/react";
import { DEFAULT_CONFIG } from "../constants/config";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF } from "../constants/defaults";
import { Card, NumberField, Badge, PageLayout } from "../components";
import Select from "../components/Select";
import { InfoTip } from "../components/Tooltip";
import { save } from "../utils/storage";
import { STORAGE_KEY } from "../constants/config";
import { useT, useLang, useDevMode } from "../context";

export default function SettingsPage({
  cfg, setCfg, setCosts, setSals,
  setGrants, setPoolSize,
  setShareholders, setRoundSim,
  setStreams, setEsopEnabled,
}) {
  var tAll = useT();
  var t = tAll.settings;
  var td = tAll.dev || {};
  var { lang } = useLang();
  var { devMode, toggle: toggleDevMode } = useDevMode();

  function lbl(text, tip, width) {
    return (
      <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
        {text}<InfoTip tip={tip} width={width || 210} />
      </span>
    );
  }

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)" }}>{t.fiscal_title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-5)" }}>{t.fiscal_sub}</p>
          {[
            ["vat", t.fiscal_vat, 0.01, 0.30, t.tip_vat, true],
            ["capitalSocial", t.fiscal_capital, 1000, 500000, t.tip_capital],
            ["stripeThresh", t.fiscal_stripe_thresh, 10000, 1000000, t.tip_stripe],
          ].map(function (f, i) { return (
            <div key={f[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
              {lbl(f[1], f[4])}
              <NumberField value={cfg[f[0]]} onChange={function (v) { setCfg({ ...cfg, [f[0]]: v }); }} min={0} max={f[3]} step={f[2]} width="100px" pct={f[5]} />
            </div>
          ); })}
          <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginBottom: "var(--sp-3)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {t.fiscal_isoc_note}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{t.fiscal_sal_title}</div>
            {[
              ["onss", t.fiscal_onss, 0.001, t.tip_onss],
              ["prec", t.fiscal_prec, 0.001, t.tip_prec],
              ["patr", t.fiscal_patr, 0.001, t.tip_patr],
            ].map(function (f, i, a) { return (
              <div key={f[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < a.length - 1 ? "var(--sp-2)" : 0 }}>
                {lbl(f[1], f[3], 240)}
                <NumberField value={cfg[f[0]]} onChange={function (v) { setCfg({ ...cfg, [f[0]]: v }); }} min={0} max={1} step={f[2]} width="80px" pct />
              </div>
            ); })}
          </div>
        </Card>

        {/* Tiers de qualification retiré (GlowUp legacy) */}

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)" }}>{t.saas_title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-5)" }}>{t.saas_sub}</p>
          {[
            ["churnMonthly", t.saas_churn, 0.001, 0.50, t.tip_churn, true],
            ["cacTarget", t.saas_cac, 100, 20000, t.tip_cac],
          ].map(function (f, i, a) { return (
            <div key={f[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < a.length - 1 ? "var(--sp-3)" : 0 }}>
              {lbl(f[1], f[4])}
              <NumberField value={cfg[f[0]]} onChange={function (v) { setCfg({ ...cfg, [f[0]]: v }); }} min={0} max={f[3]} step={f[2]} width="100px" pct={f[5]} />
            </div>
          ); })}
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)" }}>{t.currency_title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-5)" }}>{t.currency_sub}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
            {lbl(t.currency_display, t.tip_currency)}
            <Select
              value={cfg.currency || "EUR"}
              onChange={function (v) { setCfg({ ...cfg, currency: v || "EUR" }); }}
              options={[
                { value: "EUR", label: "EUR (€)" },
                { value: "USD", label: "USD ($)" },
                { value: "CHF", label: "CHF (Fr.)" },
              ]}
              width={130}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
            {lbl(t.kpi_format_title, t.tip_kpi_format)}
            <Select
              value={cfg.kpiShort !== false ? "short" : "long"}
              onChange={function (v) { setCfg({ ...cfg, kpiShort: v === "short" }); }}
              options={[
                { value: "short", label: t.kpi_format_short },
                { value: "long", label: t.kpi_format_long },
              ]}
              width={160}
            />
          </div>
          {(cfg.currency || "EUR") !== "EUR" ? null : (
            <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>{t.currency_base_note}</div>
          )}
          {(cfg.currency || "EUR") !== "EUR" ? (
            <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-3)" }}>{t.currency_rates_title}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: "var(--sp-3)", lineHeight: 1.5 }}>{t.currency_rates_note}</div>
              {["USD", "CHF"].map(function (c) {
                return (
                  <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-2)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>1 EUR = ? {c}</span>
                    <NumberField
                      value={(cfg.exchangeRates || {})[c] || 1}
                      onChange={function (v) { setCfg({ ...cfg, exchangeRates: { ...cfg.exchangeRates, [c]: v } }); }}
                      min={0.01} max={10} step={0.01} width="90px"
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)" }}>{t.targets_title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-5)" }}>{t.targets_sub}</p>
          {[
            ["arr", t.targets_arr, 10000, 10000000, t.tip_target_arr],
            ["mrr", t.targets_mrr, 1000, 1000000, t.tip_target_mrr],
            ["clients", t.targets_clients, 1, 10000, t.tip_target_clients],
            ["runway", t.targets_runway, 1, 60, t.tip_target_runway],
            ["ebitdaMargin", t.targets_ebitda, 0.01, 1, t.tip_target_ebitda, true],
          ].map(function (f, i, a) {
            var tg = cfg.targets || {};
            return (
              <div key={f[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < a.length - 1 ? "var(--sp-3)" : 0 }}>
                {lbl(f[1], f[4])}
                <NumberField value={tg[f[0]] || 0} onChange={function (v) { setCfg({ ...cfg, targets: { ...tg, [f[0]]: v } }); }} min={0} max={f[3]} step={f[2]} width="110px" pct={f[5]} />
              </div>
            );
          })}
        </Card>

        {/* Commissions card retiré (GlowUp legacy) */}

        {/* Developer Mode */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
              <Code size={20} weight="duotone" color="var(--color-dev)" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{td.settings_title || "Developer Mode"}</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{td.settings_desc || "Show formulas with real values on hover"}</div>
              </div>
            </div>
            <button
              onClick={toggleDevMode}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: devMode ? "var(--color-dev)" : "var(--border-strong)",
                position: "relative", transition: "background 150ms", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
                background: "var(--bg-card)",
                left: devMode ? 22 : 2,
                transition: "left 150ms",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        </Card>

        {devMode ? (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <Timer size={20} weight="duotone" color="var(--color-dev)" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{td.timing_title || "DevBar Timings"}</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{td.timing_sub || "Animation phase durations (ms)"}</div>
              </div>
            </div>
            {[
              ["enterMs", td.timing_enter || "Enter", 50, 2000, td.tip_timing_enter],
              ["initMs", td.timing_init || "Init", 0, 10000, td.tip_timing_init],
              ["deinitMs", td.timing_deinit || "Deinit", 0, 10000, td.tip_timing_deinit],
              ["exitMs", td.timing_exit || "Exit", 50, 2000, td.tip_timing_exit],
            ].map(function (f, i, a) {
              var dt = cfg.devTiming || {};
              return (
                <div key={f[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < a.length - 1 ? "var(--sp-3)" : 0 }}>
                  {lbl(f[1], f[4])}
                  <NumberField
                    value={dt[f[0]] != null ? dt[f[0]] : DEFAULT_CONFIG.devTiming[f[0]]}
                    onChange={function (v) { setCfg({ ...cfg, devTiming: { ...dt, [f[0]]: v } }); }}
                    min={f[2]} max={f[3]} step={50} width="90px"
                    suf={td.timing_unit || "ms"}
                  />
                </div>
              );
            })}
          </Card>
        ) : null}

        {/* Accessibility — Font scale */}
        <Card sx={{ gridColumn: "span 2" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
            {lang === "fr" ? "Accessibilité" : "Accessibility"}
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-4)" }}>
            {lang === "fr" ? "Ajustez la taille de la police pour améliorer la lisibilité." : "Adjust font size to improve readability."}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 20, textAlign: "center" }}>A</span>
            <input
              type="range"
              min="0.85" max="1.30" step="0.05"
              value={cfg.fontScale || 1}
              onChange={function (e) {
                var v = parseFloat(e.target.value);
                setCfg({ ...cfg, fontScale: v });
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
        </Card>

        <div style={{ gridColumn: "span 2", display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
          <button
            onClick={function () {
              setCfg({ ...DEFAULT_CONFIG });
              setCosts(JSON.parse(JSON.stringify(COST_DEF)));
              setSals(JSON.parse(JSON.stringify(SAL_DEF)));
              setGrants(JSON.parse(JSON.stringify(GRANT_DEF)));
              setPoolSize(POOL_SIZE_DEF);
              setShareholders(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
              setRoundSim({ ...ROUND_SIM_DEF });
              setStreams(JSON.parse(JSON.stringify(STREAMS_DEF)));
              setEsopEnabled(false);
              save(STORAGE_KEY, null);
            }}
            style={{ padding: "0 var(--sp-4)", height: 36, border: "1px solid var(--color-error-border)", borderRadius: "var(--r-md)", background: "var(--color-error-bg)", fontSize: 13, fontWeight: 500, color: "var(--color-error)", cursor: "pointer" }}
          >
            {t.reset_all}
          </button>
        </div>
      </div>

    </PageLayout>
  );
}
