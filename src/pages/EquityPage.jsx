import { useMemo, useState } from "react";
import { Plus, Trash, Info, CaretDown, CaretUp, ArrowRight, ChartPie } from "@phosphor-icons/react";
import { Card, NumberField, PageLayout, Select, Button, KpiCard } from "../components";
import { eur, pct, grantCalc } from "../utils";
import { useT } from "../context";

var TYPE_OPTS = ["warrants", "bspce", "options"];

var STATUS_COLORS = {
  cliff: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  vesting: { bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info-border)" },
  complete: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
};

function StatusBadge({ status, label, vestedPct }) {
  var c = STATUS_COLORS[status] || STATUS_COLORS.cliff;
  var suffix = status === "vesting" && vestedPct > 0 ? " (" + Math.round(vestedPct * 100) + "%)" : "";
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: "var(--r-xl)", background: c.bg, color: c.text, border: "1px solid " + c.border, whiteSpace: "nowrap" }}>
      {label}{suffix}
    </span>
  );
}

function VestingPrimer({ t }) {
  var [open, setOpen] = useState(false);
  var steps = [
    { color: "var(--brand)", bg: "var(--bg-accordion)", title: t.primer_step1_title, body: t.primer_step1_body },
    { color: "var(--color-warning)", bg: "var(--color-warning-bg)", title: t.primer_step2_title, body: t.primer_step2_body },
    { color: "var(--color-info)", bg: "var(--color-info-bg)", title: t.primer_step3_title, body: t.primer_step3_body },
    { color: "var(--color-success)", bg: "var(--color-success-bg)", title: t.primer_step4_title, body: t.primer_step4_body },
  ];
  return (
    <Card sx={{ marginBottom: "var(--gap-lg)" }}>
      <button
        onClick={function () { setOpen(function (v) { return !v; }); }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <Info size={14} color="var(--brand)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t.primer_title}</span>
        </div>
        {open ? <CaretUp size={13} color="var(--text-muted)" /> : <CaretDown size={13} color="var(--text-muted)" />}
      </button>

      {open ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "stretch", marginBottom: 12 }}>
            {steps.map(function (s, i) {
              return [
                <div key={"c" + i} style={{ flex: 1, padding: "14px 14px 16px", borderRadius: "var(--r-md)", background: s.bg, border: "1px solid var(--border-light)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.color, color: "var(--color-on-brand)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>{i + 1}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 5 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.65 }}>{s.body}</div>
                </div>,
                i < 3 ? (
                  <div key={"a" + i} style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0 }}>
                    <ArrowRight size={14} color="var(--text-faint)" weight="bold" />
                  </div>
                ) : null,
              ];
            })}
          </div>
          <div style={{ padding: "8px 12px", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Info size={13} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.65 }}>{t.primer_eg}</div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

var EXPLAIN_ITEMS_FR = ["warrants", "bspce", "options", "vesting", "cliff", "ifrs2"];

export default function EquityPage({ grants, setGrants, poolSize, setPoolSize, esopEnabled, setEsopEnabled, sals }) {
  var t = useT().equity;
  var [showExplain, setShowExplain] = useState(false);

  var calcs = useMemo(function () {
    return grants.map(grantCalc);
  }, [grants]);

  var totalGranted = grants.reduce(function (s, g) { return s + g.shares; }, 0);
  var totalVested = calcs.reduce(function (s, c) { return s + c.vestedShares; }, 0);
  var totalMonthly = calcs.reduce(function (s, c) { return s + c.monthlyExpense; }, 0);

  function addGrant() {
    var newId = grants.length > 0 ? Math.max.apply(null, grants.map(function (g) { return g.id; })) + 1 : 1;
    setGrants(grants.concat([{
      id: newId, name: "", type: "warrants", shares: 1000,
      strike: 1.00, fairValue: 3.00,
      grantDate: new Date().toISOString().slice(0, 10),
      vestingMonths: 48, cliffMonths: 12,
    }]));
  }

  function update(i, key, val) {
    var ng = JSON.parse(JSON.stringify(grants));
    ng[i][key] = val;
    setGrants(ng);
  }

  function remove(i) {
    setGrants(grants.filter(function (_, j) { return j !== i; }));
  }

  var typeOptions = TYPE_OPTS.map(function (v) { return { value: v, label: t["type_" + v] }; });
  var granteeOptions = (sals || []).map(function (s) { return { value: s.role, label: s.role }; });

  /* Module activation: disabled by default */
  if (!esopEnabled) {
    return (
      <PageLayout title={t.title} subtitle={t.subtitle}>
        <Card>
          <div style={{ textAlign: "center", padding: "var(--sp-8) var(--sp-4)" }}>
            <ChartPie size={48} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-3)" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>{t.module_title || t.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-5)", maxWidth: 520, margin: "0 auto var(--sp-5)" }}>{t.module_desc || t.subtitle}</div>
            <Button
              color="primary"
              size="lg"
              onClick={function () { setEsopEnabled(true); }}
              iconLeading={<ChartPie size={16} />}
            >
              {t.module_cta || "Activer le module"}
            </Button>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{t.disable || "Désactiver"}</span>
          <button
            onClick={function () { setEsopEnabled(false); }}
            style={{
              width: 34, height: 18, borderRadius: 9, background: "var(--brand)",
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

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_pool} value={(poolSize || 0).toLocaleString()} sub={t.kpi_unit} />
        <KpiCard label={t.kpi_granted} value={totalGranted.toLocaleString()} sub={t.kpi_unit} />
        <KpiCard label={t.kpi_vested} value={totalVested.toLocaleString()} sub={t.kpi_unit} />
        <KpiCard label={t.kpi_monthly} value={eur(totalMonthly)} />
      </div>

      {/* Vesting primer — always visible */}
      <VestingPrimer t={t} />

      {/* Technical explanations accordion */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <button
          onClick={function () { setShowExplain(function (v) { return !v; }); }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <Info size={14} color="var(--brand)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t.explain_toggle_show}</span>
          </div>
          {showExplain ? <CaretUp size={13} color="var(--text-muted)" /> : <CaretDown size={13} color="var(--text-muted)" />}
        </button>

        {showExplain ? (
          <div className="resp-grid" style={{ marginTop: "var(--sp-4)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--sp-4)" }}>
            {EXPLAIN_ITEMS_FR.map(function (key) {
              return (
                <div key={key} style={{ padding: "var(--sp-3)", borderRadius: "var(--r-md)", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", marginBottom: "var(--sp-2)" }}>{t["explain_" + key + "_title"]}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.65 }}>{t["explain_" + key + "_body"]}</div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>

      {/* Pool size config */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t.pool_label}</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{t.pool_hint}</div>
          </div>
          <NumberField value={poolSize} onChange={setPoolSize} min={0} max={10000000} step={1000} width="130px" suf={t.kpi_unit} />
        </div>
        {totalGranted > 0 && poolSize > 0 ? (
          <div style={{ marginTop: "var(--sp-3)", fontSize: 12, color: "var(--text-muted)" }}>
            {t.granted_of(totalGranted.toLocaleString(), poolSize.toLocaleString())}
            {" - "}
            <span style={{ color: totalGranted > poolSize ? "var(--color-error)" : "var(--color-success)" }}>
              {pct(poolSize > 0 ? totalGranted / poolSize : 0)} {t.esop_used}
            </span>
          </div>
        ) : null}
      </Card>

      {/* Grants table */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t.grants_title}</h3>
          <button
            onClick={addGrant}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)", height: 34, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)", background: "var(--brand)", color: "var(--color-on-brand)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            <Plus size={13} />{t.add_grant}
          </button>
        </div>

        {grants.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-faint)", padding: "var(--sp-4) 0", textAlign: "center" }}>{t.empty}</div>
        ) : (
          <div>
            <table style={{ width: "100%", maxWidth: "100%", tableLayout: "auto", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[t.col_grantee, t.col_type, t.col_shares, t.col_strike, t.col_fairvalue, t.col_grantdate, t.col_vesting, t.col_cliff, t.col_vested, t.col_monthly, t.col_status, ""].map(function (h, i) {
                    return <th key={i} style={{ padding: "var(--sp-2) var(--sp-2)", fontWeight: 600, color: "var(--text-muted)", textAlign: i >= 2 ? "right" : "left", whiteSpace: "nowrap", paddingBottom: "var(--sp-3)" }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {grants.map(function (g, i) {
                  var c = calcs[i];
                  return (
                    <tr key={g.id} style={{ borderBottom: i < grants.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <Select value={g.name} onChange={function (v) { update(i, "name", v); }} options={granteeOptions} placeholder={t.grantee_placeholder} height={28} width="120px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <Select value={g.type} onChange={function (v) { update(i, "type", v); }} options={typeOptions} height={28} width="100px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={g.shares} onChange={function (v) { update(i, "shares", v); }} min={0} max={1000000} step={100} width="80px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={g.strike} onChange={function (v) { update(i, "strike", v); }} min={0} max={10000} step={0.1} width="72px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={g.fairValue} onChange={function (v) { update(i, "fairValue", v); }} min={0} max={100000} step={0.1} width="72px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <input
                          type="date"
                          value={g.grantDate}
                          onChange={function (e) { update(i, "grantDate", e.target.value); }}
                          style={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "3px 6px", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={g.vestingMonths} onChange={function (v) { update(i, "vestingMonths", v); }} min={1} max={120} step={1} width="56px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={g.cliffMonths} onChange={function (v) { update(i, "cliffMonths", v); }} min={0} max={60} step={1} width="52px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{c.vestedShares.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{pct(c.vestedPct)}</div>
                        <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden", minWidth: 60 }}>
                          <div style={{ height: "100%", width: (c.vestedPct * 100).toFixed(1) + "%", background: c.status === "cliff" ? "var(--color-warning)" : c.status === "complete" ? "var(--color-success)" : "var(--color-info)", borderRadius: 2 }} />
                        </div>
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", fontWeight: 600, color: c.monthlyExpense > 0 ? "var(--color-warning)" : "var(--text-faint)" }}>
                        {c.monthlyExpense > 0 ? eur(c.monthlyExpense) : "-"}
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <StatusBadge status={c.status} label={t["status_" + c.status]} vestedPct={c.vestedPct} />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <button onClick={function () { remove(i); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "var(--sp-1)", display: "inline-flex", alignItems: "center", borderRadius: "var(--r-sm)" }}>
                          <Trash size={13} color="var(--text-faint)" />
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

      {/* Accounting note */}
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-3)" }}>
          <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>PCMN / IFRS 2</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{t.ifrs_note}</div>
            {totalMonthly > 0 ? (
              <div style={{ marginTop: "var(--sp-2)", fontSize: 13, fontWeight: 700, color: "var(--color-warning)" }}>
                {t.monthly_charge(eur(totalMonthly))}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

    </PageLayout>
  );
}
