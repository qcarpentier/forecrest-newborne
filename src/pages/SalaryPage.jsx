import { useMemo } from "react";
import { Card, NumberField, Accordion, PageLayout, Row } from "../components";
import Select from "../components/Select";
import CurrencyInput from "../components/CurrencyInput";
import { useT } from "../context";
import { eur, pct, salCalc, indepCalc } from "../utils";
import { SAL_DEF } from "../constants/defaults";
import {
  Users, Plus, Trash, Info, CurrencyCircleDollar,
  UserCircle, ChartPie,
} from "@phosphor-icons/react";

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <Card sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        {icon ? <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span> : null}
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text-primary)", lineHeight: 1.15, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{sub}</div> : null}
    </Card>
  );
}

var BTN = {
  ghost: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "var(--sp-1)", padding: "var(--sp-1) var(--sp-2)", borderRadius: "var(--r-sm)" },
  iconOnly: { background: "none", border: "none", cursor: "pointer", padding: "var(--sp-1)", display: "inline-flex", alignItems: "center", borderRadius: "var(--r-sm)" },
};

function IndepBreakdown({ netAnnual }) {
  var calc = indepCalc(netAnnual * 12);
  if (netAnnual <= 0) return null;

  var items = [
    { label: "Revenu net annuel", value: eur(calc.netAnnual), color: "var(--text-primary)", bold: true },
    { label: "Cotisations sociales (~20,5%)", value: "- " + eur(calc.socialContrib), color: "var(--color-warning)" },
    { label: "Impôt estimé (IPP progressif)", value: "- " + eur(calc.taxEstimate), color: "var(--color-error)" },
    { label: "Net après impôt", value: eur(calc.netAfterTax), color: "var(--color-success)", bold: true },
    { label: "Net mensuel estimé", value: eur(calc.netMonthly) + " /mois", color: "var(--color-success)" },
  ];

  return (
    <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
      {items.map(function (it, i) {
        return (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "var(--sp-1) 0",
            borderBottom: i < items.length - 1 ? "1px solid var(--border-light)" : "none",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{it.label}</span>
            <span style={{ fontSize: 12, fontWeight: it.bold ? 700 : 500, color: it.color, fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SalaryPage({ sals, setSals, cfg, salCosts, arrV, setTab }) {
  var tAll = useT();
  var t = tAll.salaries;

  var breakdown = useMemo(function () {
    var rows = [];
    var totals = { net: 0, brutO: 0, onssV: 0, precV: 0, patrV: 0, total: 0 };
    sals.forEach(function (s) {
      if (s.type === "independant") {
        var ic = indepCalc(s.net * 12);
        rows.push({ role: s.role, type: s.type, vari: s.vari, net: s.net, brutO: s.net, onssV: ic.socialContrib / 12, precV: ic.taxEstimate / 12, patrV: 0, total: s.net });
        totals.net += s.net;
        totals.brutO += s.net;
        totals.onssV += ic.socialContrib / 12;
        totals.precV += ic.taxEstimate / 12;
        totals.total += s.net;
      } else {
        var effOnss = s.type === "student" ? 0.0271 : cfg.onss;
        var effPatr = s.type === "student" ? 0.0 : cfg.patr;
        var c = salCalc(s.net, effOnss, cfg.prec, effPatr);
        rows.push({ role: s.role, type: s.type, vari: s.vari, net: s.net, brutO: c.brutO, onssV: c.onssV, precV: c.precV, patrV: c.patrV, total: c.total });
        totals.net += s.net;
        totals.brutO += c.brutO;
        totals.onssV += c.onssV;
        totals.precV += c.precV;
        totals.patrV += c.patrV;
        totals.total += c.total;
      }
    });
    return { rows: rows, totals: totals };
  }, [sals, cfg]);

  var headcount = sals.filter(function (s) { return s.net > 0; }).length;
  var avgCost = headcount > 0 ? breakdown.totals.total / headcount : 0;
  var massPct = arrV > 0 ? (salCosts * 12) / arrV : 0;

  var dirRem = 0;
  sals.forEach(function (s) {
    if (s.type === "independant") return;
    var eO = s.type === "student" ? 0.0271 : cfg.onss;
    var eP = s.type === "student" ? 0 : cfg.patr;
    dirRem += salCalc(s.net, eO, cfg.prec, eP).brutO;
  });
  var dirOk = dirRem >= 45000;

  if (!t) return null;

  if (!sals || sals.length === 0) {
    return (
      <PageLayout title={t.page_title} subtitle={t.page_sub}>
        <Card>
          <div style={{ textAlign: "center", padding: "var(--sp-6) var(--sp-4)" }}>
            <Users size={48} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-3)" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>{t.page_title}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", maxWidth: 480, margin: "0 auto var(--sp-4)" }}>{t.page_sub}</div>
            <button
              onClick={function () { setSals(JSON.parse(JSON.stringify(SAL_DEF))); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
                height: 40, padding: "0 var(--sp-5)",
                border: "none", borderRadius: "var(--r-md)",
                background: "var(--brand)", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Users size={16} />
              {t.enable}
            </button>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t.page_title}
      subtitle={eur(salCosts) + t.per_month}
      actions={
        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{t.disable}</span>
          <button
            onClick={function () { setSals([]); }}
            style={{
              width: 34, height: 18, borderRadius: 9,
              background: "var(--brand)",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 150ms", flexShrink: 0, padding: 0,
            }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: "50%",
              background: "var(--color-on-brand)", position: "absolute", top: 2,
              left: 18, transition: "left 150ms",
            }} />
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-lg)" }}>

      {/* Explainer */}
      <div style={{
        padding: "var(--sp-4)",
        background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
        borderRadius: "var(--r-lg)", borderLeft: "3px solid var(--color-warning)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-warning)", marginBottom: "var(--sp-2)" }}>
          Employé vs Indépendant : quelle différence ?
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Un <strong style={{ color: "var(--text-primary)" }}>employé</strong> coûte à l'entreprise son salaire net + les cotisations sociales patronales (~25%) + l'ONSS employé (~13%).
          Un <strong style={{ color: "var(--text-primary)" }}>indépendant</strong> facture directement : pas de charges patronales, mais il paie lui-même ses cotisations sociales (~20,5%) et son impôt (IPP progressif).
          La <strong style={{ color: "var(--text-primary)" }}>règle des 45.000 €</strong> : pour bénéficier du taux réduit d'ISOC (20% au lieu de 25%), au moins un dirigeant doit percevoir une rémunération brute ≥ 45.000 €/an.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--sp-3)" }}>
        <KpiCard label={t.kpi_total_cost} value={eur(salCosts)} sub={eur(salCosts * 12) + t.per_year} icon={<CurrencyCircleDollar size={16} />} />
        <KpiCard label={t.kpi_headcount} value={String(headcount)} icon={<Users size={16} />} />
        <KpiCard label={t.kpi_avg_cost} value={headcount > 0 ? eur(avgCost) : "—"} sub={t.per_month} icon={<UserCircle size={16} />} />
        <KpiCard label={t.kpi_mass_pct} value={arrV > 0 ? pct(massPct) : "—"} color={massPct > 0.5 ? "var(--color-warning)" : "var(--text-primary)"} icon={<ChartPie size={16} />} />
      </div>

      {/* TEAM */}
      <Accordion title={t.sec_team} sub={t.sec_team_sub} forceOpen>
        {sals.map(function (s, si) {
          var isIndep = s.type === "independant";
          var effOnss = s.type === "student" ? 0.0271 : cfg.onss;
          var effPatr = s.type === "student" ? 0.0 : cfg.patr;
          var c = isIndep ? null : salCalc(s.net, effOnss, cfg.prec, effPatr);
          return (
            <div key={si} style={{ padding: "var(--sp-3) 0", borderBottom: si < sals.length - 1 ? "1px solid var(--border-light)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                <input
                  value={s.role}
                  onChange={function (e) { var ns = JSON.parse(JSON.stringify(sals)); ns[si].role = e.target.value; setSals(ns); }}
                  style={{ flex: 1, minWidth: 120, fontSize: 13, fontWeight: 600, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
                <Select
                  value={s.type || "employee"}
                  onChange={function (v) { var ns = JSON.parse(JSON.stringify(sals)); ns[si].type = v; setSals(ns); }}
                  options={[
                    { value: "employee", label: t.type_employee },
                    { value: "student", label: t.type_student },
                    { value: "intern", label: t.type_intern },
                    { value: "director", label: t.type_director },
                    { value: "independant", label: "Indépendant" },
                  ]}
                  height={36}
                />
                {!isIndep ? (
                  <button
                    onClick={function () { var ns = JSON.parse(JSON.stringify(sals)); ns[si].vari = !ns[si].vari; setSals(ns); }}
                    style={{ fontSize: 12, padding: "0 var(--sp-3)", height: 36, borderRadius: "var(--r-md)", border: s.vari ? "1px solid var(--color-info)" : "1px solid var(--border-strong)", background: s.vari ? "var(--color-info-bg)" : "var(--input-bg)", color: s.vari ? "var(--color-info)" : "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}
                  >
                    {s.vari ? t.compensation_variable : t.compensation_fixed}
                  </button>
                ) : null}
                <NumberField value={s.net} onChange={function (v) { var ns = JSON.parse(JSON.stringify(sals)); ns[si].net = v; setSals(ns); }} min={0} max={20000} step={50} width="88px" suf={isIndep ? "€ net" : t.eur_net} />
                {!isIndep && c && c.brutO > 0 ? (
                  <div style={{ display: "flex", gap: "var(--sp-2)", fontSize: 12, color: "var(--text-muted)" }}>
                    <span>{eur(c.brutO) + " " + t.brut}</span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{eur(c.brutE) + " " + t.employer}</span>
                  </div>
                ) : null}
                <button onClick={function () { setSals(sals.filter(function (_, j) { return j !== si; })); }} style={BTN.iconOnly}>
                  <Trash size={14} color="var(--text-faint)" />
                </button>
              </div>

              {/* Employee detail line */}
              {!isIndep && c && c.total > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap", marginTop: "var(--sp-2)", marginLeft: 2 }}>
                  <Info size={11} color="var(--text-faint)" />
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.onss_detail(pct(effOnss), eur(c.onssV))}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.prec_detail(pct(cfg.prec), eur(c.precV))}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.patr_detail(pct(effPatr), eur(c.patrV))}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>{t.total_month(eur(c.total))}</span>
                  {s.type === "student" ? (
                    <span style={{ fontSize: 10, padding: "2px var(--sp-2)", borderRadius: "var(--r-xl)", background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid var(--color-warning-border)" }}>{t.onss_reduced}</span>
                  ) : null}
                </div>
              ) : null}

              {/* Independant breakdown */}
              {isIndep ? <IndepBreakdown netAnnual={s.net} /> : null}

              {s.vari && !isIndep ? (
                <div style={{ marginTop: "var(--sp-2)", marginLeft: 2, padding: "var(--sp-2) var(--sp-3)", background: "var(--color-info-bg)", borderRadius: "var(--r-sm)", border: "1px solid var(--color-info-border)", fontSize: 11, color: "var(--color-info)" }}>
                  {t.commission_note}
                </div>
              ) : null}
            </div>
          );
        })}
        <button
          onClick={function () { setSals(sals.concat([{ id: Date.now(), role: t.new_role, net: 0, vari: false, type: "employee" }])); }}
          style={{ ...BTN.ghost, color: "var(--brand)", marginTop: "var(--sp-2)" }}
        >
          <Plus size={14} color="var(--brand)" />{t.add_role}
        </button>
      </Accordion>

      {/* BREAKDOWN TABLE */}
      <Accordion title={t.sec_breakdown} sub={t.sec_breakdown_sub}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_role}</th>
                <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>Type</th>
                <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_net}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>Cotisations</th>
                <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>Impôt / Préc.</th>
                <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_patr}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_total}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.rows.map(function (r, i) {
                var isIndep = r.type === "independant";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "var(--sp-2)", fontWeight: 500 }}>{r.role}</td>
                    <td style={{ padding: "var(--sp-2)" }}>
                      <span style={{
                        fontSize: 10, padding: "2px 6px", borderRadius: "var(--r-full)", fontWeight: 600,
                        background: isIndep ? "var(--color-info-bg)" : r.type === "student" ? "var(--color-warning-bg)" : "var(--bg-accordion)",
                        color: isIndep ? "var(--color-info)" : r.type === "student" ? "var(--color-warning)" : "var(--text-muted)",
                        border: "1px solid " + (isIndep ? "var(--color-info-border)" : r.type === "student" ? "var(--color-warning-border)" : "var(--border)"),
                      }}>
                        {isIndep ? "Indep." : r.type === "student" ? t.type_student : r.type === "director" ? t.type_director : t.type_employee}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", padding: "var(--sp-2)", fontVariantNumeric: "tabular-nums" }}>{eur(r.net)}</td>
                    <td style={{ textAlign: "right", padding: "var(--sp-2)", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(r.onssV)}</td>
                    <td style={{ textAlign: "right", padding: "var(--sp-2)", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(r.precV)}</td>
                    <td style={{ textAlign: "right", padding: "var(--sp-2)", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{isIndep ? "—" : eur(r.patrV)}</td>
                    <td style={{ textAlign: "right", padding: "var(--sp-2)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(r.total)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: "var(--sp-2)", fontWeight: 700 }}>{t.row_total}</td>
                <td />
                <td style={{ textAlign: "right", padding: "var(--sp-2)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(breakdown.totals.net)}</td>
                <td style={{ textAlign: "right", padding: "var(--sp-2)", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(breakdown.totals.onssV)}</td>
                <td style={{ textAlign: "right", padding: "var(--sp-2)", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(breakdown.totals.precV)}</td>
                <td style={{ textAlign: "right", padding: "var(--sp-2)", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(breakdown.totals.patrV)}</td>
                <td style={{ textAlign: "right", padding: "var(--sp-2)", fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--brand)" }}>{eur(breakdown.totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Accordion>

      {/* BELGIAN CONTEXT */}
      <Accordion title={t.sec_context} sub={t.sec_context_sub}>
        <Row label={t.context_onss} value={t.context_onss_val} />
        <Row label={t.context_patr} value={t.context_patr_val(pct(cfg.patr))} />
        <Row label={t.context_prec} value={t.context_prec_val(pct(cfg.prec))} />
        <Row label={t.context_cp200} value={t.context_cp200_val} />
        <Row label={t.context_dri} value={t.context_dri_val(dirOk)} last color={dirOk ? "var(--color-success)" : "var(--color-warning)"} />

        {/* Independant specific info */}
        <div style={{
          marginTop: "var(--sp-3)", padding: "var(--sp-3)",
          background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
          borderRadius: "var(--r-md)", borderLeft: "3px solid var(--color-info)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-info)", marginBottom: "var(--sp-1)" }}>Indépendant complémentaire ou principal</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Les <strong>cotisations sociales</strong> d'un indépendant en Belgique sont calculées sur le revenu professionnel net (~20,5%).
            L'<strong>impôt des personnes physiques</strong> (IPP) suit des tranches progressives : 25%, 40%, 45%, 50%.
            Un indépendant paie des <strong>versements anticipés trimestriels</strong> pour éviter une majoration d'impôt.
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-2)" }}>
          {t.context_settings_hint}
        </div>
      </Accordion>

      {/* BENEFITS */}
      <Accordion title={t.sec_benefits} sub={t.sec_benefits_sub}>
        <Row label={t.benefits_meal} value={t.benefits_meal_val} />
        <Row label={t.benefits_atn} value={t.benefits_atn_val} last />
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-2)" }}>
          {t.benefits_footer}
        </div>
      </Accordion>

      </div>
    </PageLayout>
  );
}
