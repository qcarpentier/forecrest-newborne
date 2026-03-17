import { useMemo, useState, useEffect } from "react";
import { Plus, Trash, Info, CaretDown, CaretUp } from "@phosphor-icons/react";
import { Card, NumberField, PageLayout, Select } from "../components";
import { InfoTip } from "../components/Tooltip";
import { eur, grantCalc } from "../utils";
import { useT } from "../context";

var CLASS_OPTS = ["common", "preferred", "esop"];
var EXPLAIN_KEYS = ["capital", "classes", "dilution", "premoney", "preference", "fullydiluted"];

function nm(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(2) + "M";
  if (v >= 1000) return (v / 1000).toFixed(1) + "K";
  return v.toLocaleString();
}

export default function CapTablePage({ shareholders, setShareholders, roundSim, setRoundSim, grants, cfg, setCfg }) {
  var t = useT().captable;
  var [showRound, setShowRound] = useState(false);
  var [showExplain, setShowExplain] = useState(false);

  var esopData = useMemo(function () {
    if (!grants || !grants.length) return { vested: 0, granted: 0, strikeValue: 0 };
    var vested = 0, granted = 0, strikeValue = 0;
    grants.forEach(function (g) {
      var c = grantCalc(g);
      vested += c.vestedShares;
      granted += g.shares;
      strikeValue += c.vestedShares * g.strike;
    });
    return { vested: vested, granted: granted, strikeValue: strikeValue };
  }, [grants]);

  var esopVested = esopData.vested;
  var esopGranted = esopData.granted;

  var totalShares = shareholders.reduce(function (s, sh) { return s + sh.shares; }, 0);
  var fullyDiluted = totalShares + esopGranted;
  var totalCapital = shareholders.reduce(function (s, sh) { return s + sh.shares * sh.price; }, 0);
  var nominalPrice = totalShares > 0 ? totalCapital / totalShares : 0;
  var pricePerShare = roundSim.preMoney > 0 && totalShares > 0 ? roundSim.preMoney / totalShares : 0;

  // Sync capitalSocial in settings when shareholders change
  useEffect(function () {
    if (cfg && setCfg && totalCapital > 0 && Math.abs(totalCapital - cfg.capitalSocial) > 0.01) {
      setCfg(function (prev) { return Object.assign({}, prev, { capitalSocial: totalCapital }); });
    }
  }, [totalCapital]);

  // Round simulator
  var newShares = pricePerShare > 0 ? Math.round(roundSim.raise / pricePerShare) : 0;
  var postMoney = roundSim.preMoney + roundSim.raise;
  var investorPct = postMoney > 0 ? roundSim.raise / postMoney : 0;
  var postTotal = totalShares + newShares;

  var classOptions = CLASS_OPTS.map(function (v) { return { value: v, label: t["class_" + v] }; });

  function add() {
    var newId = shareholders.length ? Math.max.apply(null, shareholders.map(function (s) { return s.id; })) + 1 : 0;
    setShareholders(shareholders.concat([{ id: newId, name: t.new_name, cl: "common", shares: 1000, price: nominalPrice > 0 ? nominalPrice : 2, date: new Date().toISOString().slice(0, 10) }]));
  }

  function update(i, key, val) {
    var ns = JSON.parse(JSON.stringify(shareholders));
    ns[i][key] = val;
    setShareholders(ns);
  }

  function remove(i) {
    setShareholders(shareholders.filter(function (_, j) { return j !== i; }));
  }

  var TH = function (props) {
    return <th style={{ padding: "var(--sp-2)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textAlign: props.right ? "right" : "left", paddingBottom: "var(--sp-3)", whiteSpace: "nowrap" }}>{props.children}</th>;
  };

  var toggleBtnBase = { height: 32, padding: "0 var(--sp-4)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 500, cursor: "pointer" };

  // KPIs adapt to view
  var kpis = showRound
    ? [
        { label: t.total_shares, value: nm(totalShares), tip: t.tip_total_shares },
        { label: t.fully_diluted, value: nm(fullyDiluted), tip: t.tip_fully_diluted },
        { label: t.pre_money, value: eur(roundSim.preMoney), tip: t.tip_pre_money },
        { label: t.price_pre, value: pricePerShare >= 0.01 ? eur(pricePerShare) : "< 0,01 \u20ac", tip: t.tip_price_pre },
      ]
    : [
        { label: t.total_shares, value: nm(totalShares), tip: t.tip_total_shares },
        { label: t.fully_diluted, value: nm(fullyDiluted), tip: t.tip_fully_diluted },
        { label: t.capital_subscribed, value: eur(totalCapital), tip: t.tip_capital_subscribed },
        { label: t.price_nominal, value: nominalPrice >= 0.01 ? eur(nominalPrice) : "< 0,01 \u20ac", tip: t.tip_price_nominal },
      ];

  return (
    <PageLayout title={t.title} subtitle={t.subtitle}>

      {/* Summary KPIs */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {kpis.map(function (k) {
          return (
            <Card key={k.label}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)", display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                {k.label}
                {k.tip ? <InfoTip tip={k.tip} width={240} /> : null}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Explanations panel */}
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
            {EXPLAIN_KEYS.map(function (key) {
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

      {/* View toggle */}
      <div style={{ display: "flex", gap: "var(--sp-2)", marginBottom: "var(--gap-lg)" }}>
        <button
          onClick={function () { setShowRound(false); }}
          style={{ ...toggleBtnBase, background: !showRound ? "var(--brand)" : "var(--bg-card)", color: !showRound ? "var(--color-on-brand)" : "var(--text-secondary)", border: !showRound ? "1px solid var(--brand)" : "1px solid var(--border)" }}
        >
          {t.view_without_invest}
        </button>
        <button
          onClick={function () { setShowRound(true); }}
          style={{ ...toggleBtnBase, background: showRound ? "var(--brand)" : "var(--bg-card)", color: showRound ? "var(--color-on-brand)" : "var(--text-secondary)", border: showRound ? "1px solid var(--brand)" : "1px solid var(--border)" }}
        >
          {t.view_with_invest}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showRound ? "1fr 400px" : "1fr", gap: "var(--gap-lg)", alignItems: "start" }}>

        {/* Shareholders table */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t.col_name}s</h3>
            <button
              onClick={add}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)", height: 34, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)", background: "var(--brand)", color: "var(--color-on-brand)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              <Plus size={13} />{t.add_shareholder}
            </button>
          </div>

          {shareholders.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-faint)", textAlign: "center", padding: "var(--sp-4) 0" }}>{t.empty}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <TH>{t.col_name}</TH>
                  <TH>{t.col_class}</TH>
                  <TH right>{t.col_shares}</TH>
                  <TH right>{t.col_price}</TH>
                  <TH right>{t.col_pct}</TH>
                  <TH right>{t.col_value}</TH>
                  <TH right></TH>
                </tr>
              </thead>
              <tbody>
                {shareholders.map(function (sh, i) {
                  var pct = totalShares > 0 ? sh.shares / totalShares : 0;
                  var val = showRound ? pricePerShare * sh.shares : sh.shares * sh.price;
                  return (
                    <tr key={sh.id} style={{ borderBottom: i < shareholders.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <input
                          value={sh.name}
                          onChange={function (e) { update(i, "name", e.target.value); }}
                          style={{ fontSize: 12, fontWeight: 600, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)", width: 120 }}
                        />
                      </td>
                      <td style={{ padding: "var(--sp-2)" }}>
                        <Select value={sh.cl} onChange={function (v) { update(i, "cl", v); }} options={classOptions} height={28} width="110px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={sh.shares} onChange={function (v) { update(i, "shares", v); }} min={0} max={100000000} step={100} width="96px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <NumberField value={sh.price} onChange={function (v) { update(i, "price", v); }} min={0} max={100000} step={0.01} width="72px" />
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--brand)" }}>
                        {(pct * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right", color: "var(--text-secondary)" }}>
                        {eur(val)}
                      </td>
                      <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                        <button onClick={function () { remove(i); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "var(--sp-1)", display: "inline-flex", alignItems: "center", borderRadius: "var(--r-sm)" }}>
                          <Trash size={13} color="var(--text-faint)" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {esopGranted > 0 ? (
                  <tr style={{ borderTop: "1px solid var(--border)", background: "var(--bg-accordion)" }}>
                    <td style={{ padding: "var(--sp-2)", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{t.esop_pool_row}</td>
                    <td style={{ padding: "var(--sp-2)" }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: "var(--r-xl)", background: "var(--color-info-bg)", color: "var(--color-info)", border: "1px solid var(--color-info-border)" }}>{t.class_esop}</span>
                    </td>
                    <td style={{ padding: "var(--sp-2)", textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>{nm(esopGranted)}</td>
                    <td colSpan={2} style={{ padding: "var(--sp-2)", textAlign: "right", fontSize: 11, color: "var(--text-faint)" }}>
                      {t.esop_vested(nm(esopVested))}
                    </td>
                    <td style={{ padding: "var(--sp-2)", textAlign: "right" }}>
                      {esopData.strikeValue > 0 ? (
                        <div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{eur(esopData.strikeValue)}</div>
                          <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{t.esop_at_strike}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>-</span>
                      )}
                    </td>
                    <td />
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </Card>

        {/* Round simulator - only shown in "avec levée" view */}
        {showRound ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-1)" }}>{t.sim_title}</h3>
              <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 var(--sp-4)" }}>{t.sim_subtitle}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                {[
                  { label: t.sim_premoney, key: "preMoney", step: 50000, max: 100000000 },
                  { label: t.sim_raise, key: "raise", step: 50000, max: 100000000 },
                ].map(function (f) {
                  return (
                    <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{f.label}</span>
                      <NumberField
                        value={roundSim[f.key]}
                        onChange={function (v) { setRoundSim(Object.assign({}, roundSim, { [f.key]: v })); }}
                        min={0} max={f.max} step={f.step} width="120px"
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--sp-4)", paddingTop: "var(--sp-4)" }}>
                {[
                  { label: t.sim_postmoney, value: eur(postMoney), bold: false },
                  { label: t.sim_price, value: pricePerShare > 0 ? eur(pricePerShare) : "\u2014", bold: false },
                  { label: t.sim_new_shares, value: nm(newShares), bold: false },
                  { label: t.sim_investor_pct, value: (investorPct * 100).toFixed(1) + "%", bold: true },
                  { label: t.sim_dilution, value: (investorPct * 100).toFixed(1) + "%", bold: false },
                ].map(function (r, i, a) {
                  return (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500, color: r.bold ? "var(--brand)" : "var(--text-primary)" }}>{r.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Post-round ownership */}
            {newShares > 0 && shareholders.length > 0 ? (
              <Card>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 var(--sp-3)" }}>{t.post_label}</h3>
                {shareholders.map(function (sh) {
                  var postPct = postTotal > 0 ? sh.shares / postTotal : 0;
                  var prePct = totalShares > 0 ? sh.shares / totalShares : 0;
                  return (
                    <div key={sh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{sh.name}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {(prePct * 100).toFixed(1)}% &rarr; <strong style={{ color: "var(--text-primary)" }}>{(postPct * 100).toFixed(1)}%</strong>
                      </span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderTop: "1px solid var(--border)", marginTop: "var(--sp-1)" }}>
                  <span style={{ fontSize: 12, color: "var(--color-info)", fontWeight: 600 }}>{t.investors_label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-info)" }}>+{(investorPct * 100).toFixed(1)}%</span>
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
