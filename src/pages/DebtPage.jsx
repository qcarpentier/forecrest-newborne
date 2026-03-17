import { useMemo } from "react";
import { Card, Row, PageLayout } from "../components";
import { InfoTip } from "../components/Tooltip";
import NumberField from "../components/NumberField";
import Select from "../components/Select";
import { Bank, Plus, Trash, CurrencyCircleDollar, CalendarBlank, Percent, ChartLineDown } from "@phosphor-icons/react";
import { eur, pct } from "../utils";
import { useT } from "../context";

var TYPES = ["bank", "credit", "leasing", "loan", "subsidy", "advance"];

function pmt(rate, nper, pv) {
  if (rate === 0) return pv / nper;
  var r = rate;
  return pv * r * Math.pow(1 + r, nper) / (Math.pow(1 + r, nper) - 1);
}

function remaining(amount, monthlyRate, duration, elapsed) {
  if (monthlyRate === 0) return Math.max(0, amount - (amount / duration) * elapsed);
  var r = monthlyRate;
  var n = duration;
  var p = elapsed;
  if (p >= n) return 0;
  return amount * (Math.pow(1 + r, n) - Math.pow(1 + r, p)) / (Math.pow(1 + r, n) - 1);
}

export default function DebtPage({ debts, setDebts, ebitda, capitalSocial }) {
  var t = useT().debt;

  function addDebt() {
    setDebts(function (prev) {
      return prev.concat({
        id: Date.now(),
        name: "",
        type: "bank",
        amount: 50000,
        rate: 0.035,
        duration: 60,
        elapsed: 0,
      });
    });
  }

  function update(id, key, value) {
    setDebts(function (prev) {
      return prev.map(function (d) {
        if (d.id !== id) return d;
        return Object.assign({}, d, { [key]: value });
      });
    });
  }

  function remove(id) {
    setDebts(function (prev) {
      return prev.filter(function (d) { return d.id !== id; });
    });
  }

  var computed = useMemo(function () {
    return debts.map(function (d) {
      var mr = d.rate / 12;
      var monthly = d.type === "subsidy" ? 0 : pmt(mr, d.duration, d.amount);
      var rem = d.type === "subsidy" ? 0 : remaining(d.amount, mr, d.duration, d.elapsed);
      var totalInterest = d.type === "subsidy" ? 0 : monthly * d.duration - d.amount;
      return Object.assign({}, d, { monthly: monthly, remaining: rem, totalInterest: totalInterest, monthlyRate: mr });
    });
  }, [debts]);

  var totalRemaining = 0;
  var totalMonthly = 0;
  var annualInterest = 0;
  computed.forEach(function (c) {
    totalRemaining += c.remaining;
    totalMonthly += c.monthly;
    if (c.type !== "subsidy" && c.duration > 0) {
      annualInterest += Math.max(0, c.monthly * 12 - c.amount / c.duration * 12);
    }
  });

  var annualDebtService = totalMonthly * 12;
  var dscr = annualDebtService > 0 && ebitda != null ? ebitda / annualDebtService : 0;
  var debtRatio = capitalSocial > 0 ? totalRemaining / capitalSocial : 0;

  // 12-month schedule
  var schedule = useMemo(function () {
    var months = [];
    for (var m = 0; m < 12; m++) {
      var principal = 0;
      var interest = 0;
      computed.forEach(function (c) {
        if (c.type === "subsidy" || c.duration === 0) return;
        var mElapsed = c.elapsed + m;
        if (mElapsed >= c.duration) return;
        var mr = c.monthlyRate;
        var rem = remaining(c.amount, mr, c.duration, mElapsed);
        var intPart = rem * mr;
        var prinPart = c.monthly - intPart;
        principal += prinPart;
        interest += intPart;
      });
      months.push({ principal: principal, interest: interest, total: principal + interest });
    }
    return months;
  }, [computed]);

  return (
    <PageLayout title={t.title} subtitle={t.subtitle}>

      {/* KPI cards */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-8)" }}>
        <Card sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <Bank size={16} weight="bold" color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{t.kpi_total}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: totalRemaining > 0 ? "var(--color-error)" : "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {eur(totalRemaining)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.kpi_total_sub}</div>
        </Card>

        <Card sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <CalendarBlank size={16} weight="bold" color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{t.kpi_monthly}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {eur(totalMonthly)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.kpi_monthly_sub}</div>
        </Card>

        <Card sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <Percent size={16} weight="bold" color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{t.kpi_cost}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: annualInterest > 0 ? "var(--color-warning)" : "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {eur(annualInterest)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.kpi_cost_sub}</div>
        </Card>

        <Card sx={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <ChartLineDown size={16} weight="bold" color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, flex: 1 }}>{t.kpi_dscr}</span>
            <InfoTip tip={t.tip_dscr} width={280} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: dscr >= 1.25 ? "var(--color-success)" : dscr >= 1 ? "var(--color-warning)" : debts.length > 0 ? "var(--color-error)" : "var(--text-faint)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {debts.length > 0 ? dscr.toFixed(2) + "x" : "–"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.kpi_dscr_sub}</div>
        </Card>
      </div>

      {/* Debt table */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t.title}</h3>
          <button
            onClick={addDebt}
            style={{
              display: "flex", alignItems: "center", gap: "var(--sp-1)",
              padding: "6px 14px", borderRadius: "var(--r-md)",
              border: "1px solid var(--brand)", background: "var(--brand-bg)",
              fontSize: 12, fontWeight: 600, color: "var(--brand)", cursor: "pointer",
            }}
          >
            <Plus size={13} weight="bold" /> {t.add}
          </button>
        </div>

        {debts.length === 0 ? (
          <div style={{ padding: "var(--sp-6) 0", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
            {t.empty}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  {[t.col_name, t.col_type, t.col_amount, t.col_rate, t.col_duration, t.col_start, t.col_monthly, t.col_remaining, t.col_actions].map(function (h, i) {
                    return (
                      <th key={i} style={{
                        padding: "var(--sp-2) var(--sp-2)",
                        textAlign: i >= 6 ? "right" : "left",
                        fontWeight: 600, color: "var(--text-muted)", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {computed.map(function (d, idx) {
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid var(--border-light)", background: idx % 2 === 0 ? "transparent" : "var(--bg-accordion)" }}>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <input
                          value={d.name}
                          onChange={function (e) { update(d.id, "name", e.target.value); }}
                          placeholder="..."
                          style={{
                            width: 130, padding: "4px 8px", border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)", background: "var(--input-bg)",
                            color: "var(--text-primary)", fontSize: 12, outline: "none",
                          }}
                        />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <Select
                          value={d.type}
                          onChange={function (v) { update(d.id, "type", v); }}
                          options={TYPES.map(function (k) { return { value: k, label: t["type_" + k] }; })}
                          width={140}
                        />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <NumberField value={d.amount} onChange={function (v) { update(d.id, "amount", v); }} min={0} max={10000000} step={1000} width="100px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <NumberField value={d.rate} onChange={function (v) { update(d.id, "rate", v); }} min={0} max={1} step={0.001} width="70px" pct />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <NumberField value={d.duration} onChange={function (v) { update(d.id, "duration", v); }} min={1} max={360} step={1} width="65px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <NumberField value={d.elapsed} onChange={function (v) { update(d.id, "elapsed", v); }} min={0} max={d.duration} step={1} width="55px" suf={"/" + d.duration} />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {eur(d.monthly)}
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", fontWeight: 600, color: d.remaining > 0 ? "var(--color-error)" : "var(--text-faint)", whiteSpace: "nowrap" }}>
                        {eur(d.remaining)}
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <button
                          onClick={function () { remove(d.id); }}
                          title={t.confirm_delete}
                          aria-label={t.confirm_delete}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, border: "none", borderRadius: "var(--r-sm)",
                            background: "transparent", cursor: "pointer", color: "var(--text-faint)",
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 12-month schedule + summary side by side */}
      {debts.length > 0 ? (
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* Schedule */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>{t.section_schedule}</h3>
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-4)" }}>{t.section_schedule_sub}</p>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: 11 }}>{t.month_label}</th>
                  <th style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 11 }}>{t.schedule_principal}</th>
                  <th style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 11 }}>{t.schedule_interest}</th>
                  <th style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 11 }}>{t.schedule_total}</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(function (row, i) {
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-light)", background: i % 2 === 0 ? "transparent" : "var(--bg-accordion)" }}>
                      <td style={{ padding: "var(--sp-1) var(--sp-2)", fontWeight: 600, color: "var(--brand)" }}>{t.month_label}{i + 1}</td>
                      <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", color: "var(--text-secondary)" }}>{eur(row.principal)}</td>
                      <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", color: "var(--color-warning)" }}>{eur(row.interest)}</td>
                      <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>{eur(row.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Summary */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.section_summary}</h3>
            <Row label={t.summary_total_borrowed} value={eur(computed.reduce(function (s, c) { return s + c.amount; }, 0))} />
            <Row label={t.summary_total_remaining} value={eur(totalRemaining)} color={totalRemaining > 0 ? "var(--color-error)" : "var(--text-faint)"} />
            <Row label={t.summary_total_interest} value={eur(computed.reduce(function (s, c) { return s + c.totalInterest; }, 0))} color="var(--color-warning)" />
            <Row label={t.summary_annual_cost} value={eur(annualInterest)} bold />
            <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)" }}>
              <Row
                label={t.summary_debt_ratio}
                value={capitalSocial > 0 ? debtRatio.toFixed(2) + "x" : "–"}
                bold
                color={debtRatio < 1 ? "var(--color-success)" : debtRatio < 2 ? "var(--color-warning)" : "var(--color-error)"}
                last
                tip={t.tip_debt_ratio}
              />
            </div>

            {/* Visual debt ratio bar */}
            {capitalSocial > 0 && totalRemaining > 0 ? (
              <div style={{ marginTop: "var(--sp-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.summary_debt_ratio}</span>
                  <span style={{ fontWeight: 700, color: debtRatio < 1 ? "var(--color-success)" : debtRatio < 2 ? "var(--color-warning)" : "var(--color-error)" }}>
                    {pct(Math.min(debtRatio / 3, 1))}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: Math.min(debtRatio / 3, 1) * 100 + "%",
                    background: debtRatio < 1 ? "var(--color-success)" : debtRatio < 2 ? "var(--color-warning)" : "var(--color-error)",
                    borderRadius: 8, transition: "width 0.4s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>
                  <span>0x</span>
                  <span>1x</span>
                  <span>2x</span>
                  <span>3x</span>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

    </PageLayout>
  );
}
