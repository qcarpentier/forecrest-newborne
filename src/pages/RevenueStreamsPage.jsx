import { useMemo, useState } from "react";
import { Plus, Trash, DotsSixVertical, Users, Shuffle } from "@phosphor-icons/react";
import { Card, PageLayout, Accordion, Select, ButtonUtility, ExplainerBox, NumberField } from "../components";
import CurrencyInput from "../components/CurrencyInput";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { eur } from "../utils";
import { useT } from "../context";
import { REVENUE_DEF, REVENUE_PCMN_OPTS, REVENUE_SUB_OPTS, REVENUE_TEMPLATES } from "../constants/defaults";

var PCMN_SUB_MAP = {
  "7000": "E-commerce", "7010": "E-commerce", "7020": "Services",
  "7030": "Commissions", "7400": "Subsides", "7410": "Subsides",
  "7500": "Divers", "7510": "Divers", "7600": "Divers",
};

function makeId() {
  return "r" + Math.random().toString(36).slice(2, 8);
}

var REVENUE_RANGES = [
  // Recurring revenue
  [[1000, 50000], [500, 20000], [0, 10000]],
  // One-time revenue
  [[0, 30000], [0, 15000]],
  // Grants
  [[0, 25000]],
];

function randomizeStreams() {
  var s = JSON.parse(JSON.stringify(REVENUE_DEF));
  s.forEach(function (cat, ci) {
    var ranges = REVENUE_RANGES[ci];
    if (!ranges) return;
    cat.items.forEach(function (item, ii) {
      var r = ranges[ii];
      if (!r) return;
      var lo = r[0], hi = r[1];
      item.y1 = Math.round((lo + Math.random() * (hi - lo)) / 100) * 100;
    });
  });
  return s;
}

function SectionLabel({ title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", margin: "var(--sp-6) 0 var(--sp-3)" }}>
      <div style={{ width: 3, height: 13, background: "var(--brand)", borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{title}</span>
      {sub ? <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{"\u00B7 " + sub}</span> : null}
    </div>
  );
}

export default function RevenueStreamsPage({ streams, setStreams, annC }) {
  var t = useT().revenue || {};
  var [confirmDel, setConfirmDel] = useState(null);
  var [pcmnChange, setPcmnChange] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [skipNextChecked, setSkipNextChecked] = useState(false);
  var [forceOpen, setForceOpen] = useState({ state: false, rev: 0 });
  var [dragIdx, setDragIdx] = useState(null);
  var [dragOverIdx, setDragOverIdx] = useState(null);

  var totals = useMemo(function () {
    var y1 = 0;
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (it) {
        var mul = it.pu ? (it.u || 1) : 1;
        y1 += (it.y1 || 0) * mul;
      });
    });
    return { y1: y1, mrr: y1 / 12 };
  }, [streams]);

  function toggleAll() {
    setForceOpen(function (fo) { return { state: !fo.state, rev: fo.rev + 1 }; });
  }

  function requestDeleteCat(ci) {
    if (skipDeleteConfirm) {
      var nc = JSON.parse(JSON.stringify(streams));
      nc.splice(ci, 1);
      setStreams(nc);
    } else {
      setSkipNextChecked(false);
      setConfirmDel({ ci: ci });
    }
  }

  function confirmDeleteCat() {
    if (skipNextChecked) setSkipDeleteConfirm(true);
    var nc = JSON.parse(JSON.stringify(streams));
    nc.splice(confirmDel.ci, 1);
    setStreams(nc);
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
    var nc = JSON.parse(JSON.stringify(streams));
    var moved = nc.splice(dragIdx, 1)[0];
    var target = ci > dragIdx ? ci - 1 : ci;
    nc.splice(target, 0, moved);
    setStreams(nc);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  var breakEvenStatus = annC > 0 && totals.y1 > 0
    ? (totals.y1 >= annC ? "positive" : "negative")
    : "neutral";

  return (
    <PageLayout
      title={t.title || "Sources de revenus"}
      subtitle={t.subtitle || "Chiffre d'affaires prévisionnel sur 3 ans."}
      actions={
        <>
          <button onClick={toggleAll} style={{ height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" }}>
            {forceOpen.state ? (t.collapse_all || "Tout fermer") : (t.expand_all || "Tout ouvrir")}
          </button>
          <button onClick={function () { setStreams(JSON.parse(JSON.stringify(REVENUE_DEF))); }} style={{ height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" }}>
            {t.reset || "Réinitialiser"}
          </button>
          <button onClick={function () { setStreams(randomizeStreams()); }} style={{ height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <Shuffle size={16} />
            {t.randomize || "Randomiser"}
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
            var nc = JSON.parse(JSON.stringify(streams));
            nc[pcmnChange.ci].items[pcmnChange.ii].pcmn = pcmnChange.pcmn;
            nc[pcmnChange.ci].items[pcmnChange.ii].sub = pcmnChange.newSub;
            setStreams(nc);
            setPcmnChange(null);
          }}
          onCancel={function () {
            var nc = JSON.parse(JSON.stringify(streams));
            nc[pcmnChange.ci].items[pcmnChange.ii].pcmn = pcmnChange.pcmn;
            setStreams(nc);
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

      {/* Explainer */}
      <ExplainerBox variant="info" title={t.explainer_title || "Le chiffre d'affaires, c'est quoi ?"}>
        {t.explainer_body || "C'est l'ensemble de l'argent que votre entreprise gagne en vendant ses produits ou services. Organisez vos revenus par catégorie comptable (classe 7) pour une vision claire et conforme au plan comptable belge."}
      </ExplainerBox>

      {/* KPI cards */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { label: t.kpi_mrr || "MRR estimé", value: eur(totals.mrr), color: "var(--brand)" },
          { label: t.kpi_y1 || "CA annuel", value: eur(totals.y1) },
        ].map(function (k) {
          return (
            <Card key={k.label}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color || "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Categories */}
      <SectionLabel title={t.title || "Sources de revenus"} sub={eur(totals.y1) + (t.per_year || "/an")} />

      {(streams || []).map(function (cat, ci) {
        var catTotal = 0;
        cat.items.forEach(function (it) { catTotal += (it.y1 || 0) * (it.pu ? (it.u || 1) : 1); });
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
            {isDropTarget ? (
              <div style={{ height: 3, background: "var(--brand)", borderRadius: 2, marginBottom: "var(--sp-1)", opacity: 0.8 }} />
            ) : null}

            <div style={{ display: "flex", alignItems: "stretch", gap: "var(--sp-1)", opacity: isDragging ? 0.4 : 1, transition: "opacity 0.15s" }}>
              <div
                title={t.drag_handle || "Glisser pour réordonner"}
                style={{ display: "flex", alignItems: "center", paddingTop: 14, paddingBottom: 4, paddingLeft: 2, paddingRight: 0, cursor: "grab", color: "var(--text-ghost)", flexShrink: 0, alignSelf: "flex-start" }}
              >
                <DotsSixVertical size={16} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Accordion
                  title={String(cat.cat) + (cat.pcmn ? " (" + cat.pcmn + ")" : "")}
                  sub={eur(catTotal) + (t.per_year || "/an")}
                  forceOpen={forceOpen}
                >
                  {/* Category name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{t.category_label || "Catégorie"}</span>
                    <input
                      value={cat.cat}
                      onChange={function (e) { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].cat = e.target.value; setStreams(nc); }}
                      style={{ fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "var(--sp-1) var(--sp-2)", flex: 1, background: "var(--input-bg)", color: "var(--text-primary)", outline: "none" }}
                    />
                  </div>

                  {/* Items */}
                  {cat.items.map(function (it, ii) {
                    return (
                      <div key={it.id || ii} style={{ padding: "var(--sp-2) 0", borderBottom: ii < cat.items.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                        {/* Row 1: PCMN badge + name + per-user + amount + delete */}
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: "var(--text-faint)", background: "var(--bg-accordion)", padding: "2px 5px", borderRadius: "var(--r-sm)", fontFamily: "ui-monospace,monospace", flexShrink: 0, border: "1px solid var(--border)" }}>
                            {String(it.pcmn || "----")}
                          </span>
                          <input
                            value={it.l}
                            onChange={function (e) { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].items[ii].l = e.target.value; setStreams(nc); }}
                            style={{ flex: 1, minWidth: 100, fontSize: 13, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)" }}
                          />
                          <ButtonUtility
                            variant={it.pu ? "brand" : "default"}
                            icon={<Users size={14} />}
                            onClick={function () { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].items[ii].pu = !nc[ci].items[ii].pu; if (!nc[ci].items[ii].u) nc[ci].items[ii].u = 1; setStreams(nc); }}
                            title={it.pu ? (t.pu_on || "Par utilisateur") : (t.pu_off || "Montant fixe")}
                          />
                          {it.pu ? (
                            <NumberField value={it.u || 1} onChange={function (v) { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].items[ii].u = v; setStreams(nc); }} min={1} max={50} step={1} width="52px" suf={t.pu_count || "users"} />
                          ) : null}
                          <CurrencyInput value={it.y1 || 0} onChange={function (v) { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].items[ii].y1 = v; setStreams(nc); }} suffix="€" width="120px" />
                          <ButtonUtility
                            variant="danger"
                            icon={<Trash size={16} />}
                            onClick={function () { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].items.splice(ii, 1); setStreams(nc); }}
                            title={t.delete || "Supprimer"}
                          />
                        </div>
                        {/* Row 2: subcategory + PCMN selector */}
                        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-2)", marginLeft: 42 }}>
                          <Select
                            value={it.sub || ""}
                            onChange={function (v) { var nc = JSON.parse(JSON.stringify(streams)); nc[ci].items[ii].sub = v; setStreams(nc); }}
                            options={REVENUE_SUB_OPTS.map(function (s) { return { value: s, label: s }; })}
                            placeholder={t.subcategory || "Sous-catégorie"}
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
                                var nc = JSON.parse(JSON.stringify(streams));
                                nc[ci].items[ii].pcmn = v;
                                if (mapped) nc[ci].items[ii].sub = mapped;
                                setStreams(nc);
                              }
                            }}
                            options={REVENUE_PCMN_OPTS.map(function (p) { return { value: p.c, label: p.c + " \u00B7 " + p.l }; })}
                            placeholder={t.pcmn_code || "Code PCMN"}
                            width="210px"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Add line + delete category */}
                  <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-3)", alignItems: "center" }}>
                    <Select
                      value=""
                      onChange={function (v) {
                        if (!v) return;
                        var tmpl = REVENUE_TEMPLATES[parseInt(v)];
                        var nc = JSON.parse(JSON.stringify(streams));
                        nc[ci].items.push({ id: makeId(), l: tmpl.l, y1: 0, pcmn: tmpl.pcmn, sub: tmpl.sub });
                        setStreams(nc);
                      }}
                      options={REVENUE_TEMPLATES.map(function (tmpl, i) { return { value: String(i), label: tmpl.l }; })}
                      placeholder={t.add_line || "+ Ajouter une ligne..."}
                      width="220px"
                    />
                    <div style={{ flex: 1 }} />
                    <ButtonUtility
                      variant="danger"
                      icon={<Trash size={16} />}
                      onClick={function () { requestDeleteCat(ci); }}
                      title={t.delete_category || "Supprimer la catégorie"}
                    />
                  </div>
                </Accordion>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add category button */}
      <button
        onClick={function () {
          setStreams(streams.concat([{ cat: t.new_category || "Nouvelle catégorie", pcmn: "", items: [] }]));
        }}
        style={{ height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--gap-sm)", marginLeft: 20 }}
      >
        <Plus size={14} />{t.add_category || "Ajouter une catégorie"}
      </button>

      {/* Break-even indicator */}
      {annC > 0 ? (
        <Card sx={{ marginTop: "var(--gap-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: breakEvenStatus === "positive" ? "var(--color-success)" : breakEvenStatus === "negative" ? "var(--color-error)" : "var(--text-ghost)",
            }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {breakEvenStatus === "positive"
                  ? (t.be_positive || "Revenus supérieurs aux charges")
                  : (t.be_negative || "Revenus inférieurs aux charges")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {"CA An 1 : " + eur(totals.y1) + " vs Charges annuelles : " + eur(annC)}
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </PageLayout>
  );
}
