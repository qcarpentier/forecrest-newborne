import { useState } from "react";
import { Plus, Trash, Users, DotsSixVertical, Shuffle } from "@phosphor-icons/react";
import { PCMN_OPTS, SUB_OPTS, COST_DEF } from "../constants/defaults";
import { ButtonUtility } from "../components";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

/* ── Realistic cost ranges per item for randomization (maps to COST_DEF structure) ── */
var COST_RANGES = [
  // Infrastructure
  [[0, 25], [0, 30], [5, 25]],
  // Software
  [[0, 15, true], [0, 10, true], [20, 60, true], [0, 100], [0, 99]],
  // Marketing
  [[50, 1500], [50, 500]],
  // Legal/Comptabilite
  [[100, 500], [0, 150], [50, 200]],
  // Frais generaux
  [[50, 200], [20, 100]],
  // Immobilisations
  [[15, 25], [0, 100], [0, 50]],
];

function randomizeCosts() {
  var costs = JSON.parse(JSON.stringify(COST_DEF));
  costs.forEach(function (cat, ci) {
    var ranges = COST_RANGES[ci];
    if (!ranges) return;
    cat.items.forEach(function (item, ii) {
      var r = ranges[ii];
      if (!r) return;
      var lo = r[0], hi = r[1];
      // Round to nearest 5
      var val = lo + Math.random() * (hi - lo);
      item.a = Math.round(val / 5) * 5;
    });
  });
  return costs;
}
import { Card, NumberField, Row, Accordion, PageLayout, Select } from "../components";
import { eur, pct, salCalc } from "../utils";
import { useT } from "../context";


var PCMN_SUB_MAP = {
  "6100": "Loyers", "6120": "Cloud", "6125": "Software",
  "6130": "Commissions", "6131": "Legal", "6132": "Legal",
  "6135": "Commissions", "6140": "Marketing", "6141": "Assurances",
  "6150": "Divers", "6160": "Divers",
  "2110": "Brevets", "2400": "Materiel", "2410": "Materiel",
  "6200": "Remunerations", "6210": "Remunerations",
  "6302": "Amortissement", "6500": "Divers", "6700": "Divers",
};

var COST_TEMPLATES = [
  { l: "Comptable", a: 200, pcmn: "6131", sub: "Legal" },
  { l: "Assurances", a: 60, pcmn: "6141", sub: "Assurances" },
  { l: "Licence SaaS", a: 15, pcmn: "6125", sub: "Software" },
  { l: "Matériel informatique", a: 0, pcmn: "2410", sub: "Materiel" },
  { l: "Publicité", a: 100, pcmn: "6140", sub: "Marketing" },
  { l: "Loyer / domiciliation", a: 50, pcmn: "6100", sub: "Loyers" },
  { l: "Frais de déplacement", a: 30, pcmn: "6150", sub: "Divers" },
  { l: "Dotation aux amortissements", a: 0, pcmn: "6302", sub: "Amortissement" },
  { l: "Honoraires", a: 100, pcmn: "6130", sub: "Legal" },
  { l: "Ligne vide", a: 0, pcmn: "", sub: "" },
];

var BTN = {
  primary: { height: 36, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)", background: "var(--brand)", color: "var(--color-on-brand)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" },
  secondary: { height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--brand)", borderRadius: "var(--r-md)", background: "var(--brand-bg)", color: "var(--brand)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" },
  neutral: { height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" },
  ghost: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "var(--sp-1)", padding: "var(--sp-1) var(--sp-2)", borderRadius: "var(--r-sm)" },
  danger: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--color-error)", display: "inline-flex", alignItems: "center", gap: "var(--sp-1)", padding: "var(--sp-1) var(--sp-2)", borderRadius: "var(--r-sm)" },
};

function SectionLabel({ title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", margin: "var(--sp-6) 0 var(--sp-3)" }}>
      <div style={{ width: 3, height: 13, background: "var(--brand)", borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{title}</span>
      {sub ? <span style={{ fontSize: 11, color: "var(--text-faint)" }}>· {sub}</span> : null}
    </div>
  );
}


export default function OperatingCostsPage({
  costs, setCosts, sals, cfg,
  monthlyCosts, salCosts, opCosts,
  resLeg, isoc, setTab,
}) {
  var t = useT().opex;
  var [confirmDel, setConfirmDel] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [skipNextChecked, setSkipNextChecked] = useState(false);
  var [pcmnChange, setPcmnChange] = useState(null);
  var [forceOpen, setForceOpen] = useState({ state: false, rev: 0 });
  var [dragIdx, setDragIdx] = useState(null);
  var [dragOverIdx, setDragOverIdx] = useState(null);

  function toggleAll() {
    setForceOpen(function (fo) { return { state: !fo.state, rev: fo.rev + 1 }; });
  }

  function requestDeleteCat(ci) {
    if (skipDeleteConfirm) {
      var nc = JSON.parse(JSON.stringify(costs));
      nc.splice(ci, 1);
      setCosts(nc);
    } else {
      setSkipNextChecked(false);
      setConfirmDel({ ci });
    }
  }

  function confirmDeleteCat() {
    if (skipNextChecked) setSkipDeleteConfirm(true);
    var nc = JSON.parse(JSON.stringify(costs));
    nc.splice(confirmDel.ci, 1);
    setCosts(nc);
    setConfirmDel(null);
  }

  function handleDragStart(e, ci) {
    setDragIdx(ci);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, ci) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (ci !== dragIdx) setDragOverIdx(ci);
  }

  function handleDrop(e, ci) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === ci) { setDragIdx(null); setDragOverIdx(null); return; }
    var nc = JSON.parse(JSON.stringify(costs));
    var [moved] = nc.splice(dragIdx, 1);
    var target = ci > dragIdx ? ci - 1 : ci;
    nc.splice(target, 0, moved);
    setCosts(nc);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle(eur(monthlyCosts), eur(monthlyCosts * 12))}
      actions={
        <>
          <button onClick={toggleAll} style={BTN.neutral}>
            {forceOpen.state ? t.collapse_all : t.expand_all}
          </button>
          <button onClick={function () { setCosts(randomizeCosts()); }} style={BTN.neutral}>
            <Shuffle size={14} />{t.randomize}
          </button>
          <button onClick={function () { setCosts(JSON.parse(JSON.stringify(COST_DEF))); }} style={BTN.neutral}>
            {t.reset}
          </button>
        </>
      }
    >
      {confirmDel ? (
        <ConfirmDeleteModal
          onConfirm={confirmDeleteCat}
          onCancel={function () { setConfirmDel(null); }}
          skipNext={skipNextChecked}
          setSkipNext={setSkipNextChecked}
          t={t}
        />
      ) : null}

      {pcmnChange ? (
        <ConfirmDeleteModal
          onConfirm={function () {
            var nc = JSON.parse(JSON.stringify(costs));
            nc[pcmnChange.ci].items[pcmnChange.ii].pcmn = pcmnChange.pcmn;
            nc[pcmnChange.ci].items[pcmnChange.ii].sub = pcmnChange.newSub;
            setCosts(nc);
            setPcmnChange(null);
          }}
          onCancel={function () {
            var nc = JSON.parse(JSON.stringify(costs));
            nc[pcmnChange.ci].items[pcmnChange.ii].pcmn = pcmnChange.pcmn;
            setCosts(nc);
            setPcmnChange(null);
          }}
          skipNext={false}
          setSkipNext={function () {}}
          t={{
            confirm_delete_title: t.pcmn_change_title || "Changer la sous-catégorie ?",
            confirm_delete_msg: (t.pcmn_change_msg || "Le code PCMN sélectionné correspond à la sous-catégorie \"{sub}\". Mettre à jour ?").replace("{sub}", pcmnChange.newSub),
            confirm_delete_yes: t.pcmn_change_yes || "Oui, mettre à jour",
            confirm_delete_no: t.pcmn_change_no || "Non, garder l'actuelle",
          }}
        />
      ) : null}

      {/* ── SECTION: CHARGES D'EXPLOITATION ─────────────────── */}
      <SectionLabel title={t.title} sub={eur(opCosts) + t.per_month} />

      {costs.map(function (cat, ci) {
        var ct = 0;
        cat.items.forEach(function (i) { ct += i.pu ? i.a * (i.u || 1) : i.a; });
        var isDragging = dragIdx === ci;
        var isDropTarget = dragOverIdx === ci && dragIdx !== null && dragIdx !== ci;

        return (
          <div
            key={ci}
            draggable={true}
            onDragStart={function (e) { handleDragStart(e, ci); }}
            onDragOver={function (e) { handleDragOver(e, ci); }}
            onDrop={function (e) { handleDrop(e, ci); }}
            onDragEnd={handleDragEnd}
            style={{ position: "relative" }}
          >
            {/* Drop placeholder line above */}
            {isDropTarget ? (
              <div style={{ height: 3, background: "var(--brand)", borderRadius: 2, marginBottom: "var(--sp-1)", opacity: 0.8 }} />
            ) : null}

            <div style={{ display: "flex", alignItems: "stretch", gap: "var(--sp-1)", opacity: isDragging ? 0.4 : 1, transition: "opacity 0.15s" }}>
              {/* Drag handle */}
              <div
                title={t.drag_handle}
                style={{ display: "flex", alignItems: "center", paddingTop: 14, paddingBottom: 4, paddingLeft: 2, paddingRight: 0, cursor: "grab", color: "var(--text-ghost)", flexShrink: 0, alignSelf: "flex-start" }}
              >
                <DotsSixVertical size={16} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Accordion title={String(cat.cat)} sub={eur(ct) + t.per_month} forceOpen={forceOpen}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{t.category_label}</span>
                    <input
                      value={cat.cat}
                      onChange={function (e) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].cat = e.target.value; setCosts(nc); }}
                      style={{ fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "var(--sp-1) var(--sp-2)", flex: 1, background: "var(--input-bg)", color: "var(--text-primary)", outline: "none" }}
                    />
                  </div>

                  {cat.items.map(function (it, ii) {
                    var lt = it.pu ? it.a * (it.u || 1) : it.a;
                    return (
                      <div key={ii} style={{ padding: "var(--sp-2) 0", borderBottom: ii < cat.items.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                          <span style={{ fontSize: 10, color: "var(--text-faint)", background: "var(--bg-accordion)", padding: "2px 5px", borderRadius: "var(--r-sm)", fontFamily: "ui-monospace,monospace", flexShrink: 0, border: "1px solid var(--border)" }}>{String(it.pcmn || "----")}</span>
                          <input
                            value={it.l}
                            onChange={function (e) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].l = e.target.value; setCosts(nc); }}
                            style={{ flex: 1, fontSize: 13, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)" }}
                          />
                          <ButtonUtility
                            variant={it.pu ? "brand" : "default"}
                            icon={<Users size={14} />}
                            onClick={function () { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].pu = !nc[ci].items[ii].pu; if (!nc[ci].items[ii].u) nc[ci].items[ii].u = 2; setCosts(nc); }}
                            title={it.pu ? t.per_user : t.fixed_cost}
                          />
                          {it.pu ? (
                            <NumberField value={it.u || 1} onChange={function (v) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].u = v; setCosts(nc); }} min={1} max={50} step={1} width="52px" suf={t.users} />
                          ) : null}
                          <NumberField value={it.a} onChange={function (v) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].a = v; setCosts(nc); }} min={0} max={50000} step={10} width="88px" suf={t.eur_month} />
                          {it.pu ? <span style={{ fontSize: 11, color: "var(--text-faint)", minWidth: 60, textAlign: "right" }}>{"= " + eur(lt)}</span> : null}
                          <ButtonUtility
                            variant="danger"
                            icon={<Trash size={16} />}
                            onClick={function () { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items.splice(ii, 1); setCosts(nc); }}
                            title={t.delete}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", marginLeft: 42 }}>
                          <Select
                            value={it.sub || ""}
                            onChange={function (v) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].sub = v; setCosts(nc); }}
                            options={SUB_OPTS.map(function (s) { return { value: s, label: s }; })}
                            placeholder={t.subcategory}
                            width="130px"
                          />
                          <Select
                            value={it.pcmn || ""}
                            onChange={function (v) {
                              var mapped = PCMN_SUB_MAP[v];
                              var currentSub = it.sub || "";
                              if (mapped && currentSub && currentSub !== mapped) {
                                setPcmnChange({ ci: ci, ii: ii, pcmn: v, newSub: mapped, oldSub: currentSub });
                              } else {
                                var nc = JSON.parse(JSON.stringify(costs));
                                nc[ci].items[ii].pcmn = v;
                                if (mapped) nc[ci].items[ii].sub = mapped;
                                setCosts(nc);
                              }
                            }}
                            options={PCMN_OPTS.map(function (p) { return { value: p.c, label: p.c + " · " + p.l }; })}
                            placeholder={t.pcmn_code}
                            width="210px"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-3)", alignItems: "center" }}>
                    <Select
                      value=""
                      onChange={function (v) {
                        if (!v) return;
                        var tmpl = COST_TEMPLATES[parseInt(v)];
                        var nc = JSON.parse(JSON.stringify(costs));
                        nc[ci].items.push({ l: tmpl.l, a: tmpl.a, pu: false, u: 1, pcmn: tmpl.pcmn, sub: tmpl.sub });
                        setCosts(nc);
                      }}
                      options={COST_TEMPLATES.map(function (tmpl, i) { return { value: String(i), label: tmpl.l }; })}
                      placeholder={t.add_line}
                      width="220px"
                    />
                    <div style={{ flex: 1 }} />
                    <ButtonUtility
                      variant="danger"
                      icon={<Trash size={16} />}
                      onClick={function () { requestDeleteCat(ci); }}
                      title={t.delete_category}
                    />
                  </div>
                </Accordion>
              </div>
            </div>
          </div>
        );
      })}

      <button
        onClick={function () { setCosts(costs.concat([{ cat: t.new_category, items: [] }])); }}
        style={{ ...BTN.neutral, marginBottom: "var(--gap-sm)", marginLeft: 20 }}
      >
        <Plus size={14} />{t.add_category}
      </button>

      {/* ── SECTION: RÉMUNÉRATIONS (summary — detail in SalaryPage) ── */}
      {salCosts > 0 ? (
        <>
          <SectionLabel title={t.sal_title} sub={eur(salCosts) + t.per_month} />
          <Accordion
            title={t.sal_title}
            sub={eur(salCosts) + t.per_month + " · " + eur(salCosts * 12) + t.per_year}
            forceOpen={forceOpen}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)", fontSize: 12, color: "var(--text-muted)" }}>
              <Users size={14} weight="bold" style={{ color: "var(--brand)" }} />
              {t.sal_hint}
            </div>
            {sals.map(function (s, si) {
              var effOnss = s.type === "student" ? 0.0271 : cfg.onss;
              var effPatr = s.type === "student" ? 0 : cfg.patr;
              var c = salCalc(s.net, effOnss, cfg.prec, effPatr);
              return (
                <Row key={si} label={s.role} value={eur(c.total)} last={si === sals.length - 1} />
              );
            })}
          </Accordion>
        </>
      ) : null}

    </PageLayout>
  );
}
