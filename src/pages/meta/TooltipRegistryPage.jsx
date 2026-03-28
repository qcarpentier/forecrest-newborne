import { useMemo } from "react";
import { Card, PageLayout } from "../../components";
import { useT, useLang } from "../../context";

// Static registry of all InfoTip usages in the app.
// Maintained manually — update when adding/removing tooltips.
var TOOLTIP_REGISTRY = [
  // OverviewPage
  { page: "overview", container: "P&L", key: "tip_revenue" },
  { page: "overview", container: "P&L", key: "tip_opex" },
  { page: "overview", container: "P&L", key: "tip_ebitda" },
  { page: "overview", container: "P&L", key: "tip_interest" },
  { page: "overview", container: "ISOC", key: "tip_isoc_pme" },
  { page: "overview", container: "ISOC", key: "tip_isoc_std" },
  { page: "overview", container: "ISOC", key: "tip_reserve" },
  { page: "overview", container: "Health", key: "tip_ebitda_margin" },
  { page: "overview", container: "Health", key: "tip_net_margin" },
  { page: "overview", container: "Health", key: "tip_burn" },
  { page: "overview", container: "Health", key: "tip_coverage" },
  { page: "overview", container: "FR/BFR", key: "tip_fr" },
  { page: "overview", container: "FR/BFR", key: "tip_bfr" },
  { page: "overview", container: "FR/BFR", key: "tip_tn" },
  { page: "overview", container: "VAT", key: "tip_vat_c" },
  { page: "overview", container: "VAT", key: "tip_vat_d" },
  { page: "overview", container: "Dividends", key: "tip_div_capacity" },
  { page: "overview", container: "Dividends", key: "tip_vvpr" },
  { page: "overview", container: "SaaS", key: "tip_arpu" },
  { page: "overview", container: "SaaS", key: "tip_ltv" },
  { page: "overview", container: "SaaS", key: "tip_ltvCac" },
  { page: "overview", container: "SaaS", key: "tip_payback" },

  // SettingsPage
  { page: "settings", container: "Fiscal", key: "tip_vat", section: "settings" },
  { page: "settings", container: "Fiscal", key: "tip_capital", section: "settings" },
  { page: "settings", container: "Fiscal", key: "tip_onss", section: "settings" },
  { page: "settings", container: "Fiscal", key: "tip_prec", section: "settings" },
  { page: "settings", container: "Fiscal", key: "tip_patr", section: "settings" },
  { page: "settings", container: "Metrics", key: "tip_churn", section: "settings" },
  { page: "settings", container: "Metrics", key: "tip_cac", section: "settings" },
  { page: "settings", container: "Targets", key: "tip_target_arr", section: "settings" },
  { page: "settings", container: "Targets", key: "tip_target_mrr", section: "settings" },
  { page: "settings", container: "Targets", key: "tip_target_runway", section: "settings" },
  { page: "settings", container: "Targets", key: "tip_target_ebitda", section: "settings" },
  { page: "settings", container: "Currency", key: "tip_currency", section: "settings" },
  { page: "settings", container: "Display", key: "tip_kpi_format", section: "settings" },

  // RatiosPage
  { page: "ratios", container: "Profitability", key: "ebitda_margin_tip", section: "ratios" },
  { page: "ratios", container: "Profitability", key: "net_margin_tip", section: "ratios" },
  { page: "ratios", container: "Profitability", key: "burn_rate_tip", section: "ratios" },
  { page: "ratios", container: "Profitability", key: "break_even_tip", section: "ratios" },
  { page: "ratios", container: "Liquidity", key: "current_ratio_tip", section: "ratios" },
  { page: "ratios", container: "Liquidity", key: "quick_ratio_tip", section: "ratios" },
  { page: "ratios", container: "Debt", key: "debt_to_equity_tip", section: "ratios" },
  { page: "ratios", container: "Debt", key: "dscr_tip", section: "ratios" },
  { page: "ratios", container: "Debt", key: "interest_coverage_tip", section: "ratios" },
  { page: "ratios", container: "ROI", key: "roa_tip", section: "ratios" },
  { page: "ratios", container: "ROI", key: "roe_tip", section: "ratios" },
  { page: "ratios", container: "Runway", key: "runway_tip", section: "ratios" },
  { page: "ratios", container: "Runway", key: "cash_tip", section: "ratios" },
  { page: "ratios", container: "Business", key: "rev_per_employee_tip", section: "ratios" },
  { page: "ratios", container: "Business", key: "salary_ratio_tip", section: "ratios" },
  { page: "ratios", container: "Business", key: "cost_ratio_tip", section: "ratios" },

  // DebtPage
  { page: "debt", container: "KPI", key: "tip_dscr", section: "debt" },
  { page: "debt", container: "Ratios", key: "tip_debt_ratio", section: "debt" },

  // AccountingPage
  { page: "accounting", container: "Dividends", key: "tip_vvpr", section: "accounting" },

  // PactPage — dynamic keys
  { page: "pact", container: "Clauses", key: "clause_preemption_tip", section: "pact" },
  { page: "pact", container: "Clauses", key: "clause_tag_along_tip", section: "pact" },
  { page: "pact", container: "Clauses", key: "clause_drag_along_tip", section: "pact" },
  { page: "pact", container: "Clauses", key: "clause_liquidation_pref_tip", section: "pact" },
  { page: "pact", container: "Clauses", key: "clause_vesting_tip", section: "pact" },
  { page: "pact", container: "Clauses", key: "clause_antidilution_tip", section: "pact" },
];

export default function TooltipRegistryPage() {
  var tAll = useT();
  var { lang } = useLang();

  var resolved = useMemo(function () {
    return TOOLTIP_REGISTRY.map(function (entry) {
      var section = entry.section || "overview";
      var translations = tAll[section] || tAll.overview || {};
      var value = translations[entry.key];
      if (!value && tAll.settings) value = tAll.settings[entry.key];
      if (!value && tAll.ratios) value = tAll.ratios[entry.key];
      if (!value && tAll.debt) value = tAll.debt[entry.key];
      if (!value && tAll.pact) value = tAll.pact[entry.key];
      if (!value && tAll.accounting) value = tAll.accounting[entry.key];
      return {
        page: entry.page,
        container: entry.container,
        key: entry.key,
        value: typeof value === "string" ? value : (typeof value === "function" ? "[function]" : "—"),
        missing: !value,
      };
    });
  }, [tAll, lang]);

  var totalCount = resolved.length;
  var missingCount = resolved.filter(function (r) { return r.missing; }).length;
  var pages = {};
  resolved.forEach(function (r) {
    if (!pages[r.page]) pages[r.page] = 0;
    pages[r.page]++;
  });

  return (
    <PageLayout
      title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}>Tooltip Registry <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dev)", background: "var(--color-dev-bg)", border: "1px solid var(--color-dev-border)", padding: "2px 8px", borderRadius: "var(--r-full)", letterSpacing: "0.06em", textTransform: "uppercase" }}>DEV</span></span>}
      subtitle={totalCount + " tooltips across " + Object.keys(pages).length + " pages" + (missingCount > 0 ? " (" + missingCount + " missing)" : "")}
    >
      {/* Stats */}
      <div style={{ display: "flex", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)", flexWrap: "wrap" }}>
        {Object.keys(pages).map(function (page) {
          return (
            <Card key={page} sx={{ minWidth: 100 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{page}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{pages[page]}</div>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "var(--sp-2) var(--sp-3)", color: "var(--text-muted)", fontWeight: 600, fontSize: 11 }}>Page</th>
                <th style={{ textAlign: "left", padding: "var(--sp-2) var(--sp-3)", color: "var(--text-muted)", fontWeight: 600, fontSize: 11 }}>Container</th>
                <th style={{ textAlign: "left", padding: "var(--sp-2) var(--sp-3)", color: "var(--text-muted)", fontWeight: 600, fontSize: 11 }}>i18n Key</th>
                <th style={{ textAlign: "left", padding: "var(--sp-2) var(--sp-3)", color: "var(--text-muted)", fontWeight: 600, fontSize: 11 }}>Content ({lang.toUpperCase()})</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map(function (r, i) {
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-light)", background: r.missing ? "var(--color-error-bg)" : "transparent" }}>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", fontWeight: 500 }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: "var(--r-full)", background: "var(--bg-accordion)", border: "1px solid var(--border)", fontFamily: "monospace" }}>{r.page}</span>
                    </td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", color: "var(--text-secondary)" }}>{r.container}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", fontFamily: "monospace", fontSize: 11, color: "var(--text-faint)" }}>{r.key}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-3)", color: r.missing ? "var(--color-error)" : "var(--text-primary)", maxWidth: 400, lineHeight: 1.4 }}>
                      {r.missing ? "MISSING" : r.value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  );
}
