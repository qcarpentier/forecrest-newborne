import { useMemo, useState, useRef } from "react";
import { Plus, Trash, DotsSixVertical, PencilSimple } from "@phosphor-icons/react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, PageLayout } from "../components";
import CurrencyInput from "../components/CurrencyInput";
import { eur } from "../utils";
import { useT } from "../context";
import { STREAM_TYPES } from "../constants/defaults";

function makeId() {
  return "s" + Math.random().toString(36).slice(2, 8);
}

function SortableStreamRow({ stream, total, onUpdate, onRemove }) {
  var [editing, setEditing] = useState(false);
  var [hov, setHov] = useState(false);
  var nameRef = useRef(null);

  var { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stream.id });

  var style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function startEdit() {
    setEditing(true);
    setTimeout(function () { if (nameRef.current) nameRef.current.focus(); }, 50);
  }

  function finishEdit() {
    setEditing(false);
  }

  function handleNameKey(e) {
    if (e.key === "Enter") finishEdit();
  }

  var pctY1 = total > 0 ? ((stream.y1 || 0) / total * 100).toFixed(1) : "0.0";
  var st = STREAM_TYPES.find(function (s) { return s.value === stream.type; }) || STREAM_TYPES[0];

  return (
    <div
      ref={setNodeRef}
      style={Object.assign({}, style, {
        display: "grid",
        gridTemplateColumns: "24px 1fr 90px 110px 110px 110px 50px 32px",
        gap: "var(--sp-2)",
        alignItems: "center",
        padding: "var(--sp-2) var(--sp-3)",
        borderBottom: "1px solid var(--border-light)",
        background: hov ? "var(--bg-hover)" : "transparent",
        transition: "background 0.1s",
      })}
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} style={{ cursor: "grab", display: "flex", alignItems: "center" }}>
        <DotsSixVertical size={14} color="var(--text-ghost)" />
      </div>

      {/* Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", minWidth: 0 }}>
        {editing ? (
          <input
            ref={nameRef}
            value={stream.name}
            onChange={function (e) { onUpdate("name", e.target.value); }}
            onBlur={finishEdit}
            onKeyDown={handleNameKey}
            style={{
              flex: 1, border: "1px solid var(--brand)", borderRadius: "var(--r-sm)",
              padding: "2px 8px", fontSize: 13, fontWeight: 500,
              background: "var(--input-bg)", color: "var(--text-primary)",
              outline: "none", fontFamily: "inherit",
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            style={{
              fontSize: 13, fontWeight: 500, color: "var(--text-primary)",
              cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {stream.name || "Sans nom"}
          </span>
        )}
        {!editing ? (
          <button onClick={startEdit} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, opacity: hov ? 0.6 : 0, transition: "opacity 0.15s" }}>
            <PencilSimple size={12} color="var(--text-faint)" />
          </button>
        ) : null}
      </div>

      {/* Type badge as select */}
      <select
        value={stream.type}
        onChange={function (e) { onUpdate("type", e.target.value); }}
        style={{
          fontSize: 10, fontWeight: 600, padding: "3px 8px",
          borderRadius: "var(--r-full)", border: "none", cursor: "pointer",
          background: st.color, color: "var(--color-on-brand)",
          fontFamily: "inherit", height: 22,
        }}
      >
        {STREAM_TYPES.map(function (s) {
          return <option key={s.value} value={s.value}>{s.value === "recurring" ? "Récurrent" : s.value === "one_time" ? "Ponctuel" : "Usage"}</option>;
        })}
      </select>

      {/* Y1 */}
      <CurrencyInput value={stream.y1 || 0} onChange={function (v) { onUpdate("y1", v); }} suffix="€" width="100px" />

      {/* Y2 */}
      <CurrencyInput value={stream.y2 || 0} onChange={function (v) { onUpdate("y2", v); }} suffix="€" width="100px" />

      {/* Y3 */}
      <CurrencyInput value={stream.y3 || 0} onChange={function (v) { onUpdate("y3", v); }} suffix="€" width="100px" />

      {/* % */}
      <span style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "right" }}>{pctY1}%</span>

      {/* Delete */}
      <button
        onClick={onRemove}
        style={{
          border: "none", background: "none", cursor: "pointer", padding: 2,
          opacity: hov ? 1 : 0, transition: "opacity 0.15s",
        }}
      >
        <Trash size={14} color="var(--color-error)" />
      </button>
    </div>
  );
}

export default function RevenueStreamsPage({ streams, setStreams, annC }) {
  var t = useT();
  var ts = t.streams || {};

  var sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  var totals = useMemo(function () {
    var y1 = 0, y2 = 0, y3 = 0;
    streams.forEach(function (s) {
      y1 += (s.y1 || 0);
      y2 += (s.y2 || 0);
      y3 += (s.y3 || 0);
    });
    return { y1: y1, y2: y2, y3: y3, mrr: y1 / 12 };
  }, [streams]);

  function addStream() {
    setStreams(function (prev) {
      return prev.concat({ id: makeId(), name: "Nouveau revenu", type: "recurring", y1: 0, y2: 0, y3: 0 });
    });
  }

  function removeStream(id) {
    setStreams(function (prev) {
      return prev.filter(function (s) { return s.id !== id; });
    });
  }

  function updateStream(id, field, value) {
    setStreams(function (prev) {
      return prev.map(function (s) {
        if (s.id !== id) return s;
        var next = { ...s };
        next[field] = value;
        return next;
      });
    });
  }

  function handleDragEnd(event) {
    var active = event.active;
    var over = event.over;
    if (!over || active.id === over.id) return;
    setStreams(function (prev) {
      var oldIndex = prev.findIndex(function (s) { return s.id === active.id; });
      var newIndex = prev.findIndex(function (s) { return s.id === over.id; });
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  var breakEvenStatus = annC > 0 && totals.y1 > 0
    ? (totals.y1 >= annC ? "positive" : "negative")
    : "neutral";

  var streamIds = streams.map(function (s) { return s.id; });

  return (
    <PageLayout
      title={ts.title || "Revenus"}
      subtitle={ts.subtitle || "Vos sources de revenus prévisionnels sur 3 ans."}
    >

      {/* Explainer */}
      <div style={{
        padding: "var(--sp-4)", marginBottom: "var(--gap-lg)",
        background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
        borderRadius: "var(--r-lg)", borderLeft: "3px solid var(--color-success)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-success)", marginBottom: "var(--sp-2)" }}>
          {ts.explainer_title || "Le chiffre d'affaires, c'est quoi ?"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {ts.explainer_body || "C'est l'ensemble de l'argent que votre entreprise gagne en vendant ses produits ou services. Ajoutez vos différentes sources de revenus ci-dessous et estimez leur évolution sur 3 ans. Le total alimente automatiquement votre compte de résultat et votre trésorerie."}
        </div>
      </div>

      {/* KPI cards */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {[
          { label: ts.kpi_mrr || "MRR estimé", value: eur(totals.mrr), color: "var(--brand)" },
          { label: ts.kpi_y1 || "Année 1", value: eur(totals.y1) },
          { label: ts.kpi_y2 || "Année 2", value: eur(totals.y2) },
          { label: ts.kpi_y3 || "Année 3", value: eur(totals.y3) },
        ].map(function (k) {
          return (
            <Card key={k.label}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color || "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{k.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Stream list */}
      <Card>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr 90px 110px 110px 110px 50px 32px",
          gap: "var(--sp-2)",
          padding: "var(--sp-2) var(--sp-3)",
          borderBottom: "2px solid var(--border)",
          fontSize: 11, fontWeight: 600, color: "var(--text-faint)",
          textTransform: "uppercase", letterSpacing: 0.3,
        }}>
          <span />
          <span>{ts.col_name || "Source"}</span>
          <span>{ts.col_type || "Type"}</span>
          <span style={{ textAlign: "right" }}>{ts.col_y1 || "An 1"}</span>
          <span style={{ textAlign: "right" }}>{ts.col_y2 || "An 2"}</span>
          <span style={{ textAlign: "right" }}>{ts.col_y3 || "An 3"}</span>
          <span style={{ textAlign: "right" }}>%</span>
          <span />
        </div>

        {/* Sortable stream rows */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={streamIds} strategy={verticalListSortingStrategy}>
            {streams.map(function (s) {
              return (
                <SortableStreamRow
                  key={s.id}
                  stream={s}
                  total={totals.y1}
                  onUpdate={function (field, val) { updateStream(s.id, field, val); }}
                  onRemove={function () { removeStream(s.id); }}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {/* Total row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr 90px 110px 110px 110px 50px 32px",
          gap: "var(--sp-2)",
          padding: "var(--sp-3)",
          borderTop: "2px solid var(--border)",
          fontSize: 13, fontWeight: 700,
        }}>
          <span />
          <span style={{ color: "var(--text-primary)" }}>{ts.total_label || "Total"}</span>
          <span />
          <span style={{ textAlign: "right", color: "var(--brand)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{eur(totals.y1)}</span>
          <span style={{ textAlign: "right", color: "var(--brand)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{eur(totals.y2)}</span>
          <span style={{ textAlign: "right", color: "var(--brand)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{eur(totals.y3)}</span>
          <span style={{ textAlign: "right" }}>100%</span>
          <span />
        </div>

        {/* Add button */}
        <div style={{ padding: "var(--sp-3)", borderTop: "1px solid var(--border-light)" }}>
          <button
            onClick={addStream}
            style={{
              display: "flex", alignItems: "center", gap: "var(--sp-2)",
              border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)",
              background: "transparent", padding: "var(--sp-2) var(--sp-4)",
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              color: "var(--brand)", width: "100%", justifyContent: "center",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; e.currentTarget.style.borderColor = "var(--brand)"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          >
            <Plus size={14} weight="bold" />
            {ts.add_stream || "Ajouter une source de revenu"}
          </button>
        </div>
      </Card>

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
                  ? (ts.be_positive || "Revenus supérieurs aux charges")
                  : (ts.be_negative || "Revenus inférieurs aux charges")}
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
