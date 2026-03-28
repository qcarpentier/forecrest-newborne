import { useState, useMemo } from "react";
import { Card, NumberField } from "../components";
import { eur, nm } from "../utils";

var MONTHS = 12;

function interpolate(overrides) {
  var result = new Array(MONTHS).fill(null);
  var keys = [];
  for (var m = 0; m < MONTHS; m++) {
    if (overrides[m] != null) {
      result[m] = overrides[m];
      keys.push(m);
    }
  }
  if (keys.length === 0) return result;
  if (keys.length === 1) {
    for (var i = 0; i < MONTHS; i++) result[i] = overrides[keys[0]];
    return result;
  }
  // fill before first key
  for (var i = 0; i < keys[0]; i++) result[i] = result[keys[0]];
  // fill after last key
  for (var i = keys[keys.length - 1] + 1; i < MONTHS; i++) result[i] = result[keys[keys.length - 1]];
  // interpolate between keys
  for (var k = 0; k < keys.length - 1; k++) {
    var a = keys[k], b = keys[k + 1];
    for (var m = a + 1; m < b; m++) {
      var ratio = (m - a) / (b - a);
      result[m] = Math.round(result[a] + ratio * (result[b] - result[a]));
    }
  }
  return result;
}

export default function MonthlyTimeline({ arrV, monthlyCosts, avgNetYr, overrides, onChange, t }) {
  var [editingCell, setEditingCell] = useState(null);

  var ov = overrides || {};
  var clientCounts = useMemo(function () {
    if (Object.keys(ov).length === 0) return null;
    return interpolate(ov);
  }, [ov]);

  var months = [];
  for (var m = 0; m < MONTHS; m++) {
    var addedClients = clientCounts ? (clientCounts[m] || 0) : Math.round((m + 1) * 1);
    var projArr = arrV + addedClients * avgNetYr;
    months.push({
      m: m,
      clients: addedClients,
      arr: projArr,
      mrr: projArr / 12,
      costs: monthlyCosts,
      ebit: projArr / 12 - monthlyCosts,
      isOverride: ov[m] != null,
    });
  }

  function setOverride(m, val) {
    var next = { ...ov };
    if (val === null || val === undefined || val === "") {
      delete next[m];
    } else {
      next[m] = Number(val);
    }
    onChange(next);
  }

  var maxArr = 0;
  months.forEach(function (d) { if (d.arr > maxArr) maxArr = d.arr; });
  if (maxArr === 0) maxArr = 1;

  return (
    <Card sx={{ marginTop: "var(--gap-lg)", overflow: "auto" }}>
      <div style={{ marginBottom: "var(--sp-4)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>{t.timeline_title}</h3>
        <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0 }}>{t.timeline_sub}</p>
      </div>

      {/* Mini bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60, marginBottom: "var(--sp-4)" }}>
        {months.map(function (d) {
          var h = Math.max(2, (d.arr / maxArr) * 56);
          var color = d.ebit >= 0 ? "var(--brand)" : "var(--color-error)";
          return (
            <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", height: h, background: color, borderRadius: "2px 2px 0 0", opacity: d.isOverride ? 1 : 0.4 }} />
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-faint)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}></th>
              {months.map(function (d) {
                return (
                  <th key={d.m} style={{ textAlign: "center", padding: "6px 4px", fontSize: 11, color: "var(--text-faint)", fontWeight: 600, borderBottom: "1px solid var(--border)", minWidth: 52 }}>
                    M{d.m + 1}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Editable row: new clients */}
            <tr>
              <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border-light)" }}>{t.timeline_new_clients}</td>
              {months.map(function (d) {
                var isEditing = editingCell === d.m;
                return (
                  <td key={d.m} style={{ textAlign: "center", padding: "4px 2px", borderBottom: "1px solid var(--border-light)" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        autoFocus
                        defaultValue={ov[d.m] != null ? ov[d.m] : ""}
                        placeholder={String(d.clients)}
                        onBlur={function (e) {
                          var v = e.target.value;
                          setOverride(d.m, v === "" ? null : parseInt(v, 10));
                          setEditingCell(null);
                        }}
                        onKeyDown={function (e) {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") { setEditingCell(null); }
                        }}
                        style={{ width: 40, textAlign: "center", border: "1px solid var(--brand)", borderRadius: "var(--r-sm)", padding: "2px", fontSize: 12, background: "var(--input-bg)", color: "var(--text-primary)", outline: "none" }}
                      />
                    ) : (
                      <span
                        onClick={function () { setEditingCell(d.m); }}
                        style={{
                          cursor: "pointer",
                          padding: "2px 6px",
                          borderRadius: "var(--r-sm)",
                          fontWeight: d.isOverride ? 700 : 400,
                          color: d.isOverride ? "var(--brand)" : "var(--text-tertiary)",
                          background: d.isOverride ? "var(--brand-bg)" : "transparent",
                        }}
                      >
                        {d.clients}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
            {/* ARR row */}
            <tr>
              <td style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border-light)" }}>ARR</td>
              {months.map(function (d) {
                return <td key={d.m} style={{ textAlign: "center", padding: "4px 2px", fontSize: 11, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>{nm(Math.round(d.arr))}</td>;
              })}
            </tr>
            {/* MRR row */}
            <tr>
              <td style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border-light)" }}>MRR</td>
              {months.map(function (d) {
                return <td key={d.m} style={{ textAlign: "center", padding: "4px 2px", fontSize: 11, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>{nm(Math.round(d.mrr))}</td>;
              })}
            </tr>
            {/* EBITDA row */}
            <tr>
              <td style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-muted)", whiteSpace: "nowrap" }}>EBITDA</td>
              {months.map(function (d) {
                return <td key={d.m} style={{ textAlign: "center", padding: "4px 2px", fontSize: 11, color: d.ebit >= 0 ? "var(--color-success)" : "var(--color-error)", fontWeight: 600 }}>{nm(Math.round(d.ebit))}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reset button */}
      {Object.keys(ov).length > 0 ? (
        <div style={{ marginTop: "var(--sp-3)", textAlign: "right" }}>
          <button
            onClick={function () { onChange({}); }}
            style={{ padding: "0 var(--sp-3)", height: 28, borderRadius: "var(--r-sm)", border: "1px solid var(--border-strong)", background: "var(--bg-card)", fontSize: 11, cursor: "pointer", color: "var(--text-faint)" }}
          >
            {t.timeline_reset}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
