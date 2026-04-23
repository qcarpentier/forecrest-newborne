import { Card, Row } from "../../components";
import { DevVal } from "../../components";
import { InfoTip } from "../../components/Tooltip";
import Sparkline from "../../components/Sparkline";
import BreakEvenChart from "../../components/BreakEvenChart";
import { eur, eurShort, pct } from "../../utils";
import { calcStreamMonthly } from "../../utils/revenueCalc";
import { ok, err, brand } from "../../constants/colors";
import { Accordion } from "../../components";
import { Warning, TrendUp, ChartBar, Receipt, CurrencyCircleDollar, ChartLine, Users, Bank } from "@phosphor-icons/react";
import { SectionHeader } from "./helpers";

export default function OverviewSummary({
  t, lang,
  totalRevenue, arrV, extraStreamsMRR, streams,
  monthlyCosts, annC, ebit, annualInterest,
  isocR, isocS, isoc, isocEff, netP,
  resLeg, resTarget, dirRem, dirOk,
  totalMRR, monthlyRevenue,
  totalDebt, debts,
  sparkData, tresoNette,
  setTab, onNavigate,
  cfg,
}) {
  /* ─── revenue streams list ─── */
  var streamsList = [];
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      streamsList.push({ label: item.l || item.name, mrr: calcStreamMonthly(item), color: "var(--brand)", on: true });
    });
  });

  return (
    <>
      {/* ── Break-Even Chart ── */}
      {(totalRevenue > 0 || monthlyCosts > 0) ? (
        <section style={{ marginBottom: "var(--sp-8)" }}>
          <SectionHeader icon={<ChartLine size={18} weight="bold" />} title={t.breakeven_title || "Seuil de rentabilité"} sub={t.breakeven_sub || "Projection mensuelle revenus vs charges"} />
          <Card>
            <BreakEvenChart monthlyRevenue={monthlyRevenue} monthlyCosts={monthlyCosts} growthRate={(cfg && cfg.revenueGrowthRate) || 0.10} t={t} />
          </Card>
        </section>
      ) : null}

      {/* ── 1. REVENUS & RÉSULTAT ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<CurrencyCircleDollar size={18} weight="bold" />} title={t.section_revenue} sub={t.section_revenue_sub} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* P&L */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.pnl_title}</h3>
            {extraStreamsMRR > 0 ? (
              <>
                <Row label={t.pnl_revenue_platform} value={<DevVal v={eur(arrV)} f={"sum(signed × netHT × medY) = " + eur(arrV)} />} />
                <Row label={t.pnl_revenue_streams} value={<DevVal v={eur(extraStreamsMRR * 12)} f={eur(extraStreamsMRR) + "/mois × 12 = " + eur(extraStreamsMRR * 12)} />} />
                <Row label={t.pnl_revenue} value={<DevVal v={eur(totalRevenue)} f={eur(arrV) + " + " + eur(extraStreamsMRR * 12) + " = " + eur(totalRevenue)} />} bold tip={t.tip_revenue} />
              </>
            ) : (
              <Row label={t.pnl_revenue} value={<DevVal v={eur(totalRevenue)} f={"sum(streams Y1) = " + eur(totalRevenue)} />} bold tip={t.tip_revenue} />
            )}
            <Row label={t.pnl_opex} value={<DevVal v={"- " + eur(annC)} f={eur(monthlyCosts) + "/mois × 12 = " + eur(annC)} />} tip={t.tip_opex} />
            <Row label={t.pnl_ebitda || "EBITDA"} value={<DevVal v={eur(ebit)} f={eur(totalRevenue) + " - " + eur(annC) + " = " + eur(ebit)} />} bold color={ebit >= 0 ? ok : err} last={annualInterest <= 0} tip={t.tip_ebitda} />
            {annualInterest > 0 ? <Row label={t.pnl_interest} value={"- " + eur(annualInterest)} tip={t.tip_interest} /> : null}
            {annualInterest > 0 ? <Row label={t.pnl_ebt} value={<DevVal v={eur(ebit - annualInterest)} f={eur(ebit) + " - " + eur(annualInterest) + " = " + eur(ebit - annualInterest)} />} bold color={ebit - annualInterest >= 0 ? ok : err} last /> : null}

            <div style={{ marginTop: "var(--sp-4)" }}>
              <Accordion title={t.pnl_tax_detail} sub={t.pnl_tax_detail_sub}>
                <Row label={t.pnl_isoc20} value={<DevVal v={isocR > 0 ? "- " + eur(isocR) : "0 EUR"} f={"min(EBT, 100k) × 20% = " + eur(isocR)} />} tip={t.tip_isoc_pme} />
                <Row label={t.pnl_isoc25} value={<DevVal v={isocS > 0 ? "- " + eur(isocS) : "0 EUR"} f={"max(EBT - 100k, 0) × 25% = " + eur(isocS)} />} tip={t.tip_isoc_std} />
                <Row label={t.pnl_isoc_total(pct(isocEff))} value={<DevVal v={isoc > 0 ? "- " + eur(isoc) : "0 EUR"} f={eur(isocR) + " + " + eur(isocS) + " = " + eur(isoc)} />} bold />
                <Row label={t.pnl_net} value={<DevVal v={eur(netP)} f={eur(ebit - annualInterest) + " - " + eur(isoc) + " = " + eur(netP)} />} bold color={netP >= 0 ? ok : err} />
                <Row label={t.pnl_reserve} value={eur(resLeg)} last tip={t.tip_reserve} />
                <div style={{ fontSize: 11, color: "var(--text-faint)", paddingTop: "var(--sp-1)" }}>
                  {resTarget > 0
                    ? (resLeg >= resTarget ? t.pnl_reserve_done(eur(resTarget)) : t.pnl_reserve_todo(eur(resTarget), eur(resTarget - resLeg)))
                    : (lang === "fr" ? "Pas de réserve légale obligatoire détectée pour cette forme juridique." : "No mandatory legal reserve detected for this legal form.")}
                </div>
              </Accordion>
            </div>

            {!dirOk && ebit > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-warning-border)", fontSize: 12, color: "var(--color-warning)", display: "flex", gap: "var(--sp-2)", alignItems: "flex-start" }}>
                <Warning size={14} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                {t.pnl_director_warning(eur(dirRem))}
              </div>
            ) : null}

            {totalDebt > 0 ? (
              <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-2)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <Bank size={14} weight="bold" color="var(--text-muted)" />
                    {t.simple_financing_title || "Financement"}
                  </span>
                  <button onClick={function () { if (onNavigate) onNavigate("debt"); else setTab("debt"); }} style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{t.simple_financing_detail || "Détail"}</button>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-4)" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.simple_financing_total || "Emprunts"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{eur(totalDebt)}</div>
                  </div>
                  {annualInterest > 0 ? (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.simple_financing_interest || "Intérêts"}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: err }}>{eur(annualInterest)}{t.simple_financing_per_year || "/an"}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>

          {/* Revenue streams */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.streams_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.streams_sub}</p>
            {streamsList.map(function (s, i) {
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: i < streamsList.length - 1 ? "1px solid var(--border-light)" : "none", opacity: s.on ? 1 : 0.4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.on ? s.color : "var(--border-strong)", display: "inline-block", marginRight: "var(--sp-2)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.mrr > 0 ? "var(--text-primary)" : "var(--text-faint)" }}><DevVal v={eur(s.mrr)} f={s.label + " = " + eur(s.mrr) + "/mois"} /></span>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--sp-3)", marginTop: "var(--sp-2)", borderTop: "2px solid var(--border)" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.streams_total_mrr}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)" }}><DevVal v={eur(totalMRR)} f={eur(arrV / 12) + " + " + eur(extraStreamsMRR) + " = " + eur(totalMRR)} /></span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Quick navigation ── */}
      {(function () {
        var hidden = (cfg && cfg.hiddenTabs) || [];
        var hiddenSet = {};
        hidden.forEach(function (h) { hiddenSet[h] = true; });
        var navItems = [
          { label: t.simple_nav_revenue, tab: "streams", icon: <TrendUp size={16} weight="bold" /> },
          { label: t.simple_nav_costs, tab: "opex", icon: <Receipt size={16} weight="bold" /> },
          { label: t.simple_nav_salaries, tab: "salaries", icon: <Users size={16} weight="bold" /> },
          { label: t.simple_nav_cashflow, tab: "cashflow", icon: <CurrencyCircleDollar size={16} weight="bold" /> },
        ].filter(function (n) { return !hiddenSet[n.tab]; });
        if (!navItems.length) return null;
        var cols = Math.min(navItems.length, 4);
        return (
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(" + cols + ", 1fr)", gap: "var(--gap-md)" }}>
        {navItems.map(function (nav) {
          return (
            <button key={nav.tab} onClick={function () { if (onNavigate) onNavigate(nav.tab); else setTab(nav.tab); }} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-2)",
              padding: "var(--sp-3) var(--sp-4)", borderRadius: "var(--r-md)", border: "1px solid var(--border)",
              background: "var(--bg-card)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
            }}>
              <span style={{ color: "var(--text-muted)", display: "flex" }}>{nav.icon}</span>
              {nav.label}
            </button>
          );
        })}
      </div>
        );
      })()}
    </>
  );
}
