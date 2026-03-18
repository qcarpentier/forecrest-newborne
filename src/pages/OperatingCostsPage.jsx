import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash, Users, DotsSixVertical, Shuffle } from "@phosphor-icons/react";
import { brand } from "../constants/colors";
import { PCMN_OPTS, SUB_OPTS, COST_DEF } from "../constants/defaults";

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
import { CloudArrowUp, Megaphone } from "@phosphor-icons/react";

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
  iconOnly: { background: "none", border: "none", cursor: "pointer", padding: "var(--sp-1)", display: "inline-flex", alignItems: "center", borderRadius: "var(--r-sm)" },
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


function ConfirmModal({ onConfirm, onCancel, skipNext, setSkipNext, t }) {
  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "var(--sp-6)", width: 360, boxShadow: "var(--shadow-modal)" }}
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-lg)", background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash size={18} color="var(--color-error)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{t.confirm_title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.confirm_body}</div>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-5)", cursor: "pointer" }}>
          <input type="checkbox" checked={skipNext} onChange={function (e) { setSkipNext(e.target.checked); }} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--brand)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.confirm_skip}</span>
        </label>
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <button onClick={onCancel} style={{ ...BTN.neutral, flex: 1, justifyContent: "center" }}>{t.cancel}</button>
          <button onClick={onConfirm} style={{ ...BTN.primary, flex: 1, justifyContent: "center", background: "var(--color-error)" }}>{t.delete}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function OperatingCostsPage({
  costs, setCosts, sals, cfg,
  monthlyCosts, salCosts, opCosts,
  arrV, resLeg, isoc, setTab, infraData, marketingData,
}) {
  var t = useT().opex;
  var [confirmDel, setConfirmDel] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [skipNextChecked, setSkipNextChecked] = useState(false);
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
        <ConfirmModal
          onConfirm={confirmDeleteCat}
          onCancel={function () { setConfirmDel(null); }}
          skipNext={skipNextChecked}
          setSkipNext={setSkipNextChecked}
          t={t}
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
                          <button
                            onClick={function () { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].pu = !nc[ci].items[ii].pu; if (!nc[ci].items[ii].u) nc[ci].items[ii].u = 2; setCosts(nc); }}
                            style={{ fontSize: 12, padding: "0 var(--sp-3)", height: 36, borderRadius: "var(--r-md)", border: it.pu ? "1px solid var(--brand)" : "1px solid var(--border-strong)", background: it.pu ? "var(--brand-bg)" : "var(--input-bg)", color: it.pu ? "var(--brand)" : "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <Users size={11} color={it.pu ? "var(--brand)" : "var(--text-faint)"} />
                            {it.pu ? t.per_user : t.fixed_cost}
                          </button>
                          {it.pu ? (
                            <NumberField value={it.u || 1} onChange={function (v) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].u = v; setCosts(nc); }} min={1} max={50} step={1} width="52px" suf={t.users} />
                          ) : null}
                          <NumberField value={it.a} onChange={function (v) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].a = v; setCosts(nc); }} min={0} max={50000} step={10} width="88px" suf={t.eur_month} />
                          {it.pu ? <span style={{ fontSize: 11, color: "var(--text-faint)", minWidth: 60, textAlign: "right" }}>{"= " + eur(lt)}</span> : null}
                          <button onClick={function () { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items.splice(ii, 1); setCosts(nc); }} style={BTN.iconOnly}>
                            <Trash size={14} color="var(--text-faint)" />
                          </button>
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
                            onChange={function (v) { var nc = JSON.parse(JSON.stringify(costs)); nc[ci].items[ii].pcmn = v; setCosts(nc); }}
                            options={PCMN_OPTS.map(function (p) { return { value: p.c, label: p.c + " · " + p.l }; })}
                            placeholder={t.pcmn_code}
                            width="210px"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-3)", alignItems: "center" }}>
                    <select
                      onChange={function (e) {
                        if (!e.target.value) return;
                        var tmpl = COST_TEMPLATES[parseInt(e.target.value)];
                        var nc = JSON.parse(JSON.stringify(costs));
                        nc[ci].items.push({ l: tmpl.l, a: tmpl.a, pu: false, u: 1, pcmn: tmpl.pcmn, sub: tmpl.sub });
                        setCosts(nc);
                        e.target.value = "";
                      }}
                      style={{ fontSize: 13, border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", height: 36, color: "var(--brand)", cursor: "pointer", background: "var(--brand-bg)" }}
                    >
                      <option value="">{t.add_line}</option>
                      {COST_TEMPLATES.map(function (tmpl, i) { return <option key={i} value={String(i)}>{tmpl.l}</option>; })}
                    </select>
                    <div style={{ flex: 1 }} />
                    <button onClick={function () { requestDeleteCat(ci); }} style={BTN.danger}>
                      <Trash size={13} color="var(--color-error)" />{t.delete_category}
                    </button>
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

      {/* ── SECTION: INFRASTRUCTURE CLOUD ─────────────────────── */}
      {infraData && infraData.monthly > 0 ? (
        <>
          <SectionLabel title={t.infra_title || "Infrastructure Cloud"} sub={eur(infraData.monthly) + t.per_month} />
          <Accordion
            title={t.infra_title || "Infrastructure Cloud"}
            sub={eur(infraData.monthly) + t.per_month + " · " + eur(infraData.monthly * 12) + t.per_year}
            forceOpen={forceOpen}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)", fontSize: 12, color: "var(--text-muted)" }}>
              <CloudArrowUp size={14} weight="bold" style={{ color: "var(--brand)" }} />
              {t.infra_note || "Coûts estimés Cloudflare (Workers, D1, KV, R2, Queues). Configurez dans l'onglet Infrastructure."}
            </div>
            <Row label={t.infra_plan_base || "Coût fixe du plan"} value={eur(infraData.planBaseCost)} />
            {infraData.workersCost > 0 ? <Row label="Workers" value={eur(infraData.workersCost)} /> : null}
            {infraData.d1Cost > 0 ? <Row label="D1 (SQL)" value={eur(infraData.d1Cost)} /> : null}
            {infraData.kvCost > 0 ? <Row label="KV" value={eur(infraData.kvCost)} /> : null}
            {infraData.r2Cost > 0 ? <Row label="R2 (CDN + Storage)" value={eur(infraData.r2Cost)} /> : null}
            {infraData.queuesCost > 0 ? <Row label="Queues" value={eur(infraData.queuesCost)} /> : null}
            {infraData.logsCost > 0 ? <Row label="Logs" value={eur(infraData.logsCost)} /> : null}
            {infraData.doCost > 0 ? <Row label="Durable Objects" value={eur(infraData.doCost)} /> : null}
            {infraData.imagesCost > 0 ? <Row label="Cloudflare Images" value={eur(infraData.imagesCost)} /> : null}
            {infraData.authCost > 0 ? <Row label="Auth" value={eur(infraData.authCost)} /> : null}
            <Row label={t.infra_total || "Total infrastructure"} value={eur(infraData.monthly)} last />
          </Accordion>
        </>
      ) : null}

      {/* ── SECTION: MARKETING DIGITAL ─────────────────────────── */}
      {marketingData && marketingData.monthly > 0 ? (
        <>
          <SectionLabel title={t.marketing_title || "Marketing Digital"} sub={eur(marketingData.monthly) + t.per_month} />
          <Accordion
            title={t.marketing_title || "Marketing Digital"}
            sub={eur(marketingData.monthly) + t.per_month + " · " + eur(marketingData.annual) + t.per_year}
            forceOpen={forceOpen}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)", fontSize: 12, color: "var(--text-muted)" }}>
              <Megaphone size={14} weight="bold" style={{ color: "var(--brand)" }} />
              {t.marketing_note || "Coûts d'acquisition estimés (Meta, Google, Influenceurs, SEO, Email). Configurez dans l'onglet Marketing."}
            </div>
            {marketingData.channels.meta.budget > 0 ? <Row label="Meta Ads" value={eur(marketingData.channels.meta.budget)} /> : null}
            {marketingData.channels.google.budget > 0 ? <Row label="Google Ads" value={eur(marketingData.channels.google.budget)} /> : null}
            {marketingData.channels.influencers.budget > 0 ? <Row label="Influenceurs" value={eur(marketingData.channels.influencers.budget)} /> : null}
            {marketingData.channels.seo.budget > 0 ? <Row label="SEO / Content" value={eur(marketingData.channels.seo.budget)} /> : null}
            {marketingData.channels.email.budget > 0 ? <Row label="Email / CRM" value={eur(marketingData.channels.email.budget)} /> : null}
            <Row label={t.marketing_total || "Total marketing"} value={eur(marketingData.monthly)} last />
          </Accordion>
        </>
      ) : null}

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
