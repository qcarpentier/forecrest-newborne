import { useState, useMemo } from "react";
import { Plus, Trash, Calculator, Table, Info, CaretDown, CaretRight } from "@phosphor-icons/react";
import { useT } from "../context";
import { PageLayout, Card, Row, NumberField } from "../components";
import { InfoTip } from "../components/Tooltip";
import { eur } from "../utils";

/* ── Belgian legal depreciation durations (AR/CB 2019) ── */
var LEGAL_DURATIONS = [
  { pcmn: "2010", cat: "frais_establishment", years: 5, method: "linear" },
  { pcmn: "2100", cat: "concessions", years: 5, method: "linear" },
  { pcmn: "2110", cat: "patents_brands", years: 5, method: "linear" },
  { pcmn: "2120", cat: "goodwill", years: 5, method: "linear" },
  { pcmn: "2200", cat: "land", years: 0, method: "none" },
  { pcmn: "2210", cat: "buildings", years: 33, method: "linear" },
  { pcmn: "2300", cat: "plant_machinery", years: 10, method: "linear" },
  { pcmn: "2400", cat: "furniture_vehicles", years: 5, method: "linear" },
  { pcmn: "2410", cat: "it_equipment", years: 3, method: "linear" },
  { pcmn: "2500", cat: "leasing", years: 0, method: "contract" },
  { pcmn: "2700", cat: "other_tangible", years: 5, method: "linear" },
];

var EMPTY_ASSET = {
  id: 0,
  label: "",
  pcmn: "2410",
  amount: 0,
  years: 3,
  method: "linear",
  startDate: new Date().toISOString().slice(0, 10),
  residual: 0,
};

function getLegalYears(pcmn) {
  var found = LEGAL_DURATIONS.find(function (d) { return d.pcmn === pcmn; });
  return found ? found.years : 5;
}

/* ── Compute depreciation schedule for an asset ── */
function computeSchedule(asset) {
  var rows = [];
  if (!asset.amount || asset.amount <= 0 || !asset.years || asset.years <= 0) return rows;
  var depreciable = asset.amount - (asset.residual || 0);
  if (depreciable <= 0) return rows;

  if (asset.method === "declining") {
    var rate = Math.min(2 / asset.years, 0.40);
    var book = asset.amount;
    var linearAnnual = depreciable / asset.years;
    for (var y = 1; y <= asset.years; y++) {
      var decl = book * rate;
      var annual = Math.max(decl, linearAnnual);
      if (annual > book - (asset.residual || 0)) annual = book - (asset.residual || 0);
      if (annual < 0) annual = 0;
      var endBook = book - annual;
      rows.push({ year: y, start: book, depreciation: annual, end: endBook, cumulative: asset.amount - endBook });
      book = endBook;
      if (book <= (asset.residual || 0)) break;
    }
  } else {
    var annualDep = depreciable / asset.years;
    var bookVal = asset.amount;
    for (var yr = 1; yr <= asset.years; yr++) {
      var dep = Math.min(annualDep, bookVal - (asset.residual || 0));
      if (dep < 0) dep = 0;
      var endVal = bookVal - dep;
      rows.push({ year: yr, start: bookVal, depreciation: dep, end: endVal, cumulative: asset.amount - endVal });
      bookVal = endVal;
      if (bookVal <= (asset.residual || 0)) break;
    }
  }
  return rows;
}

/* ── PCMN options for asset selection ── */
var PCMN_ASSET_OPTS = [
  { value: "2010", label: "2010 - Frais d'\u00e9tablissement" },
  { value: "2100", label: "2100 - Concessions, brevets, licences" },
  { value: "2110", label: "2110 - Brevets et marques" },
  { value: "2120", label: "2120 - Goodwill / Fonds de commerce" },
  { value: "2210", label: "2210 - Constructions" },
  { value: "2300", label: "2300 - Installations et machines" },
  { value: "2400", label: "2400 - Mobilier et v\u00e9hicules" },
  { value: "2410", label: "2410 - Mat\u00e9riel informatique" },
  { value: "2700", label: "2700 - Autres immobilisations" },
];

/* ── Section header ── */
function SectionTitle({ icon, title, sub }) {
  var Icon = icon;
  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: sub ? "var(--sp-1)" : 0 }}>
        <Icon size={18} weight="duotone" color="var(--brand)" />
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{title}</h3>
      </div>
      {sub ? <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0, paddingLeft: 26 }}>{sub}</p> : null}
    </div>
  );
}

/* ── Collapsible schedule table ── */
function ScheduleTable({ asset, t }) {
  var [open, setOpen] = useState(false);
  var schedule = useMemo(function () { return computeSchedule(asset); }, [asset.amount, asset.years, asset.method, asset.residual]);
  if (!schedule.length) return null;

  return (
    <div style={{ marginTop: "var(--sp-2)" }}>
      <button
        onClick={function () { setOpen(function (v) { return !v; }); }}
        style={{
          display: "flex", alignItems: "center", gap: "var(--sp-1)",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, color: "var(--brand)", fontWeight: 500, padding: 0,
        }}
      >
        {open ? <CaretDown size={12} /> : <CaretRight size={12} />}
        {t.view_schedule || "Voir le tableau"}
      </button>
      {open ? (
        <div style={{ marginTop: "var(--sp-2)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "var(--sp-1) var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_year || "Ann\u00e9e"}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-1) var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_start || "VNC d\u00e9but"}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-1) var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_depreciation || "Dotation"}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-1) var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_end || "VNC fin"}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-1) var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_cumulative || "Cumul\u00e9"}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(function (row) {
                return (
                  <tr key={row.year} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "var(--sp-1) var(--sp-2)", color: "var(--text-secondary)" }}>{row.year}</td>
                    <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(row.start)}</td>
                    <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontWeight: 600, color: "var(--brand)", fontVariantNumeric: "tabular-nums" }}>{eur(row.depreciation)}</td>
                    <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(row.end)}</td>
                    <td style={{ padding: "var(--sp-1) var(--sp-2)", textAlign: "right", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{eur(row.cumulative)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function AmortissementPage({ costs, setCosts, cfg }) {
  var tAll = useT();
  var t = tAll.amortissement || {};
  var lang = tAll.tabs ? "ok" : "fr";

  var [assets, setAssets] = useState([]);

  /* ── Pull assets from operating costs (Immobilisations category with amortYears) ── */
  var linkedAssets = useMemo(function () {
    var result = [];
    if (!costs) return result;
    costs.forEach(function (cat) {
      cat.items.forEach(function (item) {
        if (item.amortYears && item.amortYears > 0 && item.a > 0) {
          result.push({
            id: "cost-" + item.l,
            label: item.l,
            pcmn: item.pcmn || "2400",
            amount: item.a * 12,
            years: item.amortYears,
            method: "linear",
            residual: 0,
            fromCosts: true,
          });
        }
      });
    });
    return result;
  }, [costs]);

  var allAssets = linkedAssets.concat(assets);

  /* ── Summary calculations ── */
  var summary = useMemo(function () {
    var totalAcquisition = 0;
    var annualDepreciation = 0;
    var monthlyDepreciation = 0;
    var totalNBV = 0;

    allAssets.forEach(function (a) {
      if (!a.amount || a.amount <= 0 || !a.years || a.years <= 0) return;
      totalAcquisition += a.amount;
      var depreciable = a.amount - (a.residual || 0);
      var annual = depreciable / a.years;
      annualDepreciation += annual;
      monthlyDepreciation += annual / 12;
      totalNBV += a.amount - annual;
    });

    return { totalAcquisition: totalAcquisition, annualDepreciation: annualDepreciation, monthlyDepreciation: monthlyDepreciation, totalNBV: totalNBV };
  }, [allAssets]);

  function addAsset() {
    setAssets(function (prev) {
      return prev.concat([Object.assign({}, EMPTY_ASSET, { id: Date.now() })]);
    });
  }

  function updateAsset(id, key, val) {
    setAssets(function (prev) {
      return prev.map(function (a) {
        if (a.id !== id) return a;
        var updated = Object.assign({}, a);
        updated[key] = val;
        if (key === "pcmn") {
          updated.years = getLegalYears(val);
        }
        return updated;
      });
    });
  }

  function removeAsset(id) {
    setAssets(function (prev) { return prev.filter(function (a) { return a.id !== id; }); });
  }

  return (
    <PageLayout
      title={t.page_title || "Amortissements"}
      subtitle={t.page_sub || "Tableaux d'amortissement lin\u00e9aire et d\u00e9gressif (compte 63 - PCMN)."}
    >
      {/* ── Summary KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { label: t.kpi_acquisition || "Valeur d'acquisition", value: eur(summary.totalAcquisition) },
          { label: t.kpi_annual || "Dotation annuelle", value: eur(summary.annualDepreciation) },
          { label: t.kpi_monthly || "Dotation mensuelle", value: eur(summary.monthlyDepreciation) },
          { label: t.kpi_nbv || "VNC totale", value: eur(summary.totalNBV) },
        ].map(function (kpi) {
          return (
            <Card key={kpi.label} sx={{ padding: "var(--sp-4)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif" }}>{kpi.value}</div>
            </Card>
          );
        })}
      </div>

      {/* ── Legal durations reference ── */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <SectionTitle icon={Info} title={t.legal_title || "Dur\u00e9es l\u00e9gales belges"} sub={t.legal_sub || "Dur\u00e9es minimales d'amortissement selon la l\u00e9gislation comptable belge (AR/CB)."} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_pcmn || "PCMN"}</th>
                <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_category || "Cat\u00e9gorie"}</th>
                <th style={{ textAlign: "right", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_duration || "Dur\u00e9e (ans)"}</th>
                <th style={{ textAlign: "left", padding: "var(--sp-2)", color: "var(--text-muted)", fontWeight: 600 }}>{t.col_method || "M\u00e9thode"}</th>
              </tr>
            </thead>
            <tbody>
              {LEGAL_DURATIONS.map(function (d) {
                return (
                  <tr key={d.pcmn} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "var(--sp-2)" }}>
                      <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", background: "var(--bg-accordion)", padding: "2px 6px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>{d.pcmn}</span>
                    </td>
                    <td style={{ padding: "var(--sp-2)", color: "var(--text-secondary)" }}>{t["cat_" + d.cat] || d.cat}</td>
                    <td style={{ padding: "var(--sp-2)", textAlign: "right", fontWeight: 600 }}>{d.years === 0 ? "-" : d.years}</td>
                    <td style={{ padding: "var(--sp-2)", color: "var(--text-muted)" }}>{t["method_" + d.method] || d.method}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Linked assets from operating costs ── */}
      {linkedAssets.length > 0 ? (
        <Card sx={{ marginBottom: "var(--gap-lg)" }}>
          <SectionTitle icon={Table} title={t.linked_title || "Immobilisations li\u00e9es aux charges"} sub={t.linked_sub || "Actifs d\u00e9tect\u00e9s dans vos charges d'exploitation avec dur\u00e9e d'amortissement."} />
          {linkedAssets.map(function (asset) {
            var annualDep = (asset.amount - (asset.residual || 0)) / asset.years;
            return (
              <div key={asset.id} style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", marginBottom: "var(--sp-2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", background: "var(--bg-page)", padding: "2px 6px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>{asset.pcmn}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{asset.label}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: "var(--r-xl)", background: "var(--brand-bg)", color: "var(--brand)", fontWeight: 600, border: "1px solid var(--brand)" }}>{t.linked_badge || "Charges"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{eur(asset.amount)} / {asset.years} {t.years || "ans"}</span>
                    <span style={{ fontWeight: 700, color: "var(--brand)" }}>{eur(annualDep)}/{t.year_short || "an"}</span>
                  </div>
                </div>
                <ScheduleTable asset={asset} t={t} />
              </div>
            );
          })}
        </Card>
      ) : null}

      {/* ── Manual assets ── */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <SectionTitle icon={Calculator} title={t.manual_title || "Immobilisations manuelles"} sub={t.manual_sub || "Ajoutez vos actifs pour g\u00e9n\u00e9rer automatiquement les tableaux d'amortissement."} />

        {assets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--sp-6) var(--sp-4)" }}>
            <Calculator size={40} weight="duotone" style={{ color: "var(--text-faint)", marginBottom: "var(--sp-3)" }} />
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)" }}>
              {t.empty_state || "Aucune immobilisation manuelle. Ajoutez un actif pour g\u00e9n\u00e9rer son plan d'amortissement."}
            </div>
            <button
              onClick={addAsset}
              style={{
                height: 36, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)",
                background: "var(--brand)", color: "var(--color-on-brand)", fontSize: 13,
                fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
              }}
            >
              <Plus size={14} /> {t.add_asset || "Ajouter un actif"}
            </button>
          </div>
        ) : (
          <>
            {assets.map(function (asset) {
              var annualDep = asset.amount > 0 && asset.years > 0 ? (asset.amount - (asset.residual || 0)) / asset.years : 0;
              return (
                <div key={asset.id} style={{ padding: "var(--sp-4)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", marginBottom: "var(--sp-3)", background: "var(--bg-card)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                    <input
                      value={asset.label}
                      onChange={function (e) { updateAsset(asset.id, "label", e.target.value); }}
                      placeholder={t.asset_name_placeholder || "Nom de l'actif"}
                      style={{ flex: 1, fontSize: 14, fontWeight: 600, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)" }}
                    />
                    <button onClick={function () { removeAsset(asset.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                      <Trash size={14} color="var(--color-error)" />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.field_pcmn || "Compte PCMN"}</label>
                      <select
                        value={asset.pcmn}
                        onChange={function (e) { updateAsset(asset.id, "pcmn", e.target.value); }}
                        style={{ width: "100%", height: 34, fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", background: "var(--input-bg)", color: "var(--text-primary)", padding: "0 var(--sp-2)", cursor: "pointer" }}
                      >
                        {PCMN_ASSET_OPTS.map(function (o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.field_amount || "Montant (EUR)"}</label>
                      <NumberField value={asset.amount} onChange={function (v) { updateAsset(asset.id, "amount", v); }} min={0} max={1000000} step={100} width="100%" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.field_years || "Dur\u00e9e (ans)"}</label>
                      <NumberField value={asset.years} onChange={function (v) { updateAsset(asset.id, "years", v); }} min={1} max={50} step={1} width="100%" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.field_method || "M\u00e9thode"}</label>
                      <select
                        value={asset.method}
                        onChange={function (e) { updateAsset(asset.id, "method", e.target.value); }}
                        style={{ width: "100%", height: 34, fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", background: "var(--input-bg)", color: "var(--text-primary)", padding: "0 var(--sp-2)", cursor: "pointer" }}
                      >
                        <option value="linear">{t.method_linear || "Lin\u00e9aire"}</option>
                        <option value="declining">{t.method_declining || "D\u00e9gressif"}</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.field_residual || "Valeur r\u00e9siduelle"}</label>
                      <NumberField value={asset.residual || 0} onChange={function (v) { updateAsset(asset.id, "residual", v); }} min={0} max={asset.amount} step={100} width="100%" />
                    </div>
                  </div>

                  {asset.amount > 0 && asset.years > 0 ? (
                    <div style={{ display: "flex", gap: "var(--sp-4)", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-sm)", fontSize: 12, marginBottom: "var(--sp-2)" }}>
                      <span style={{ color: "var(--text-muted)" }}>{t.annual_dep || "Dotation annuelle"} : <strong style={{ color: "var(--brand)" }}>{eur(annualDep)}</strong></span>
                      <span style={{ color: "var(--text-muted)" }}>{t.monthly_dep || "Dotation mensuelle"} : <strong>{eur(annualDep / 12)}</strong></span>
                      <span style={{ color: "var(--text-muted)" }}>{t.rate_label || "Taux"} : <strong>{asset.years > 0 ? (100 / asset.years).toFixed(1) + "%" : "-"}</strong></span>
                    </div>
                  ) : null}

                  <ScheduleTable asset={asset} t={t} />
                </div>
              );
            })}

            <button
              onClick={addAsset}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                border: "1px dashed var(--border)", borderRadius: "var(--r-md)",
                background: "none", color: "var(--brand)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", padding: "var(--sp-2) var(--sp-4)",
              }}
            >
              <Plus size={14} /> {t.add_asset || "Ajouter un actif"}
            </button>
          </>
        )}
      </Card>

      {/* ── Accounting note ── */}
      <div style={{
        padding: "var(--sp-3) var(--sp-4)",
        background: "var(--bg-accordion)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5,
      }}>
        {t.accounting_note || "Les dotations aux amortissements (compte 6302 PCMN) sont des charges non-cash qui r\u00e9duisent le r\u00e9sultat imposable sans affecter la tr\u00e9sorerie. Les dur\u00e9es l\u00e9gales belges sont des minimums - l'entreprise peut choisir des dur\u00e9es plus longues si justifi\u00e9."}
      </div>
    </PageLayout>
  );
}
