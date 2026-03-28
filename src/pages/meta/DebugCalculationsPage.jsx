import { useMemo } from "react";
import { Card, PageLayout, Accordion } from "../../components";
import { eur, pct, salCalc, indepCalc } from "../../utils";
import { useT, useLang } from "../../context";

function CalcRow({ name, inputs, formula, result, color }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "180px 1fr 1fr 120px",
      gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)",
      borderBottom: "1px solid var(--border-light)", fontSize: 12,
      alignItems: "center",
    }}>
      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inputs}</span>
      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, color: "var(--text-muted)" }}>{formula}</span>
      <span style={{ fontWeight: 700, textAlign: "right", color: color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{result}</span>
    </div>
  );
}

function TableHeader() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "180px 1fr 1fr 120px",
      gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)",
      borderBottom: "2px solid var(--border)", fontSize: 10,
      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
      color: "var(--text-faint)",
    }}>
      <span>Name</span>
      <span>Inputs</span>
      <span>Formula</span>
      <span style={{ textAlign: "right" }}>Result</span>
    </div>
  );
}

export default function DebugCalculationsPage({
  cfg, totalRevenue, monthlyCosts, ebit, netP,
  costs, sals, streams, debts, grants,
  esopMonthly, esopEnabled, opCosts, salCosts,
  isoc, isocR, isocS, isocEff,
  annVatC, annVatD, vatBalance, resLeg,
  bizKpis,
}) {
  var { lang } = useLang();

  // Revenue breakdown
  var revenueItems = useMemo(function () {
    var items = [];
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        var y1 = (item.y1 || 0) * (item.pu ? (item.u || 1) : 1);
        if (y1 !== 0) {
          items.push({ name: item.l || cat.cat, pcmn: item.pcmn || "7020", y1: y1 });
        }
      });
    });
    return items;
  }, [streams]);

  // Salary breakdown
  var salaryRows = useMemo(function () {
    return (sals || []).map(function (s) {
      if (s.type === "independant") {
        var ic = indepCalc(s.net * 12);
        return { role: s.role, type: s.type, net: s.net, brutO: s.net, social: ic.socialContrib / 12, tax: ic.taxEstimate / 12, total: s.net };
      }
      var eO = s.type === "student" ? 0.0271 : cfg.onss;
      var eP = s.type === "student" ? 0 : cfg.patr;
      var c = salCalc(s.net, eO, cfg.prec, eP);
      return { role: s.role, type: s.type, net: s.net, brutO: c.brutO, social: c.onssV, tax: c.precV, patronal: c.patrV, total: c.total };
    });
  }, [sals, cfg]);

  // Debt interest
  var debtDetails = useMemo(function () {
    var items = [];
    (debts || []).forEach(function (d) {
      if (d.rate > 0 && d.amount > 0 && d.duration > d.elapsed) {
        var r = d.rate / 12;
        var pow = Math.pow(1 + r, d.duration);
        var powE = Math.pow(1 + r, d.elapsed);
        var bal = d.amount * (pow - powE) / (pow - 1);
        var annInt = bal * d.rate;
        items.push({ name: d.name || d.label || "Debt", amount: d.amount, rate: d.rate, balance: bal, annualInterest: annInt });
      }
    });
    return items;
  }, [debts]);

  var annualInterest = 0;
  debtDetails.forEach(function (d) { annualInterest += d.annualInterest; });

  var annC = monthlyCosts * 12;
  var ebt = ebit - annualInterest;
  var monthlyRevenue = totalRevenue / 12;
  var cash = cfg.initialCash || 0;
  var burn = monthlyCosts - monthlyRevenue;
  var runway = burn > 0 && cash > 0 ? cash / burn : (monthlyRevenue >= monthlyCosts ? Infinity : 0);
  var fr = cfg.capitalSocial + resLeg + netP;

  return (
    <PageLayout
      title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}>Calculations <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dev)", background: "var(--color-dev-bg)", border: "1px solid var(--color-dev-border)", padding: "2px 8px", borderRadius: "var(--r-full)", letterSpacing: "0.06em", textTransform: "uppercase" }}>DEV</span></span>}
      subtitle={"All financial calculations with inputs, formulas, and results. Business type: " + (cfg.businessType || "other")}
    >

      {/* 1. Revenue */}
      <Accordion title={"1. Revenue (" + eur(totalRevenue) + ")"} sub={revenueItems.length + " streams"} forceOpen>
        <Card>
          <TableHeader />
          {revenueItems.map(function (item, i) {
            return (
              <CalcRow key={i}
                name={item.name}
                inputs={"PCMN " + item.pcmn}
                formula={"y1 = " + item.y1.toLocaleString()}
                result={eur(item.y1)}
                color={item.y1 > 0 ? "var(--color-success)" : "var(--color-error)"}
              />
            );
          })}
          <CalcRow name="Total Revenue" inputs={"sum(" + revenueItems.length + " streams)"} formula="sum(y1)" result={eur(totalRevenue)} color="var(--brand)" />
          <CalcRow name="MRR" inputs={eur(totalRevenue)} formula="totalRevenue / 12" result={eur(totalRevenue / 12)} />
        </Card>
      </Accordion>

      {/* 2. Costs */}
      <Accordion title={"2. Costs (" + eur(monthlyCosts) + "/mo)"} sub={eur(annC) + "/an"}>
        <Card>
          <TableHeader />
          <CalcRow name="Operating Costs" inputs={(costs || []).length + " categories"} formula="sum(item.a * qty)" result={eur(opCosts) + "/mo"} />
          <CalcRow name="Salary Costs" inputs={salaryRows.length + " people"} formula="sum(salCalc.total)" result={eur(salCosts) + "/mo"} />
          {esopEnabled && esopMonthly > 0 ? (
            <CalcRow name="ESOP Monthly" inputs={(grants || []).length + " grants"} formula="sum(grantCalc.monthlyExpense)" result={eur(esopMonthly) + "/mo"} />
          ) : null}
          <CalcRow name="Total Monthly" inputs={eur(opCosts) + " + " + eur(salCosts) + (esopEnabled ? " + " + eur(esopMonthly) : "")} formula="opCosts + salCosts + esop" result={eur(monthlyCosts) + "/mo"} color="var(--color-error)" />
          <CalcRow name="Annual Costs" inputs={eur(monthlyCosts) + " × 12"} formula="monthlyCosts × 12" result={eur(annC)} />
        </Card>
      </Accordion>

      {/* 3. Salary Detail */}
      <Accordion title={"3. Salary Breakdown (" + salaryRows.length + " people)"} sub={eur(salCosts) + "/mo"}>
        <Card>
          <div style={{
            display: "grid", gridTemplateColumns: "140px 80px 80px 80px 80px 80px 90px",
            gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)",
            borderBottom: "2px solid var(--border)", fontSize: 10,
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            color: "var(--text-faint)",
          }}>
            <span>Role</span><span>Type</span><span style={{ textAlign: "right" }}>Net</span>
            <span style={{ textAlign: "right" }}>Gross</span><span style={{ textAlign: "right" }}>Social</span>
            <span style={{ textAlign: "right" }}>Tax/Prec</span><span style={{ textAlign: "right" }}>Total</span>
          </div>
          {salaryRows.map(function (r, i) {
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "140px 80px 80px 80px 80px 80px 90px",
                gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)",
                borderBottom: "1px solid var(--border-light)", fontSize: 12,
                alignItems: "center",
              }}>
                <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.role || "—"}</span>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{r.type}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(r.net)}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(r.brutO)}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(r.social)}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{eur(r.tax)}</span>
                <span style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(r.total)}</span>
              </div>
            );
          })}
        </Card>
      </Accordion>

      {/* 4. Tax */}
      <Accordion title={"4. Tax Calculations"} sub={"ISOC " + eur(isoc) + " · TVA " + eur(vatBalance)}>
        <Card>
          <TableHeader />
          <CalcRow name="EBT (Earnings Before Tax)" inputs={eur(ebit) + " - " + eur(annualInterest)} formula="EBITDA - interest" result={eur(ebt)} color={ebt >= 0 ? "var(--color-success)" : "var(--color-error)"} />
          <CalcRow name="ISOC PME (20%)" inputs={"min(EBT, 100k)"} formula={"min(" + eur(ebt) + ", 100k) × 0.20"} result={eur(isocR)} />
          <CalcRow name="ISOC Standard (25%)" inputs={"max(EBT - 100k, 0)"} formula={"max(" + eur(ebt) + " - 100k, 0) × 0.25"} result={eur(isocS)} />
          <CalcRow name="ISOC Total" inputs={eur(isocR) + " + " + eur(isocS)} formula="ISOC PME + ISOC Std" result={eur(isoc)} color="var(--color-error)" />
          <CalcRow name="Effective ISOC Rate" inputs={eur(isoc) + " / " + eur(ebt)} formula="ISOC / EBT" result={pct(isocEff)} />
          <CalcRow name="Net Profit" inputs={eur(ebt) + " - " + eur(isoc)} formula="EBT - ISOC" result={eur(netP)} color={netP >= 0 ? "var(--color-success)" : "var(--color-error)"} />
          <div style={{ height: 1, background: "var(--border)", margin: "var(--sp-2) 0" }} />
          <CalcRow name="TVA Collected" inputs={"CA × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2)} formula="totalRevenue × VAT / (1+VAT)" result={eur(annVatC)} />
          <CalcRow name="TVA Deductible" inputs={"Charges × " + pct(cfg.vat) + " / " + (1 + cfg.vat).toFixed(2)} formula="costs × VAT / (1+VAT)" result={"- " + eur(annVatD)} />
          <CalcRow name="TVA Balance" inputs={eur(annVatC) + " - " + eur(annVatD)} formula="collected - deductible" result={eur(vatBalance)} color={vatBalance >= 0 ? "var(--color-error)" : "var(--color-success)"} />
        </Card>
      </Accordion>

      {/* 5. Debt */}
      {debtDetails.length > 0 ? (
        <Accordion title={"5. Debt (" + debtDetails.length + " loans)"} sub={eur(annualInterest) + " interest/yr"}>
          <Card>
            <TableHeader />
            {debtDetails.map(function (d, i) {
              return (
                <CalcRow key={i}
                  name={d.name}
                  inputs={eur(d.amount) + " @ " + pct(d.rate)}
                  formula={"balance=" + eur(d.balance) + " × rate"}
                  result={eur(d.annualInterest) + "/yr"}
                />
              );
            })}
            <CalcRow name="Total Interest" inputs={debtDetails.length + " loans"} formula="sum(annualInterest)" result={eur(annualInterest)} color="var(--color-error)" />
          </Card>
        </Accordion>
      ) : null}

      {/* 6. Treasury */}
      <Accordion title={"6. Treasury & Runway"} sub={runway === Infinity ? "Profitable" : runway > 0 ? runway.toFixed(1) + " months" : "No runway"}>
        <Card>
          <TableHeader />
          <CalcRow name="Initial Cash" inputs="cfg.initialCash" formula="—" result={eur(cash)} />
          <CalcRow name="Monthly Revenue" inputs={eur(totalRevenue) + " / 12"} formula="totalRevenue / 12" result={eur(monthlyRevenue)} />
          <CalcRow name="Monthly Costs" inputs="opCosts + salCosts + esop" formula="—" result={eur(monthlyCosts)} />
          <CalcRow name="Net Burn" inputs={eur(monthlyCosts) + " - " + eur(monthlyRevenue)} formula="costs - revenue" result={burn > 0 ? eur(burn) + "/mo" : "Profitable"} color={burn > 0 ? "var(--color-error)" : "var(--color-success)"} />
          <CalcRow name="Runway" inputs={eur(cash) + " / " + eur(burn > 0 ? burn : 0)} formula="cash / burn" result={runway === Infinity ? "∞" : runway > 0 ? runway.toFixed(1) + " mo" : "—"} color={runway >= 12 ? "var(--color-success)" : runway >= 6 ? "var(--color-warning)" : "var(--color-error)"} />
          <div style={{ height: 1, background: "var(--border)", margin: "var(--sp-2) 0" }} />
          <CalcRow name="Fonds de Roulement (FR)" inputs={eur(cfg.capitalSocial) + " + " + eur(resLeg) + " + " + eur(netP)} formula="capital + reserve + netP" result={eur(fr)} color={fr >= 0 ? "var(--color-success)" : "var(--color-error)"} />
          <CalcRow name="Reserve Legale" inputs={"capitalSocial × 10% (max)"} formula={eur(cfg.capitalSocial) + " × 0.10"} result={eur(resLeg)} />
        </Card>
      </Accordion>

      {/* 7. Business KPIs */}
      {bizKpis && bizKpis.kpis ? (
        <Accordion title={"7. Business KPIs — " + (bizKpis.type || "other")} sub={bizKpis.kpis.length + " metrics"}>
          <Card>
            <TableHeader />
            {bizKpis.kpis.map(function (kpi) {
              var displayValue = "–";
              if (kpi.value != null && !isNaN(kpi.value)) {
                if (kpi.format === "eur") displayValue = eur(kpi.value);
                else if (kpi.format === "pct") displayValue = pct(kpi.value);
                else if (kpi.format === "ratio") displayValue = kpi.value.toFixed(2) + "x";
                else if (kpi.format === "months") displayValue = kpi.value.toFixed(1) + " mo";
                else displayValue = typeof kpi.value === "number" ? kpi.value.toLocaleString() : String(kpi.value);
              }
              return (
                <CalcRow key={kpi.id}
                  name={kpi.id.replace(/_/g, " ")}
                  inputs={kpi.format}
                  formula={"—"}
                  result={displayValue}
                />
              );
            })}
            {bizKpis.debug ? (
              <>
                <div style={{ height: 1, background: "var(--border)", margin: "var(--sp-2) 0" }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dev)", padding: "var(--sp-2) var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Debug internals</div>
                {Object.keys(bizKpis.debug).map(function (key) {
                  var val = bizKpis.debug[key];
                  return (
                    <CalcRow key={key}
                      name={key}
                      inputs="debug"
                      formula="—"
                      result={typeof val === "number" ? (val < 1 && val > -1 ? pct(val) : val.toLocaleString()) : String(val)}
                      color="var(--color-dev)"
                    />
                  );
                })}
              </>
            ) : null}
          </Card>
        </Accordion>
      ) : null}

      {/* 8. Health Score */}
      <Accordion title="8. Health Score" sub="3 components">
        <Card>
          <TableHeader />
          <CalcRow name="EBITDA Margin" inputs={eur(ebit) + " / " + eur(totalRevenue)} formula="ebit / revenue" result={totalRevenue > 0 ? pct(ebit / totalRevenue) : "—"} />
          <CalcRow name="Burn Rate" inputs={eur(monthlyCosts) + " - " + eur(monthlyRevenue)} formula="costs - revenue" result={burn > 0 ? eur(burn) : "Profitable"} />
          <CalcRow name="Coverage" inputs={eur(totalRevenue) + " / " + eur(annC)} formula="revenue / annualCosts" result={annC > 0 ? pct(totalRevenue / annC) : "—"} />
        </Card>
      </Accordion>

    </PageLayout>
  );
}
