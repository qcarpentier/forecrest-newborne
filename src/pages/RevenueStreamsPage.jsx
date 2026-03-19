import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash, ArrowLeft, Star,
  ShoppingCart, Users, Briefcase, Clock, Sparkle,
  ArrowsClockwise, Percent,
} from "@phosphor-icons/react";
import { Card, PageLayout, ExplainerBox, Badge } from "../components";
import CurrencyInput from "../components/CurrencyInput";
import { eur } from "../utils";
import { calcStreamMonthly, calcStreamAnnual, getDriverLabel, getPriceLabel, REVENUE_BEHAVIORS } from "../utils/revenueCalc";
import { useT, useLang } from "../context";
import { REVENUE_DEF } from "../constants/defaults";

function makeId() {
  return "r" + Math.random().toString(36).slice(2, 8);
}

var BEHAVIOR_META = {
  recurring: {
    icon: ArrowsClockwise, badge: "brand",
    label: { fr: "Récurrent", en: "Recurring" },
    desc: { fr: "Revenu mensuel fixe par client — abonnement, licence, retainer, maintenance.", en: "Fixed monthly revenue per client — subscription, license, retainer, maintenance." },
    example: { fr: "49 €/mois × 100 clients = 4 900 €/mois", en: "€49/mo × 100 clients = €4,900/mo" },
  },
  per_transaction: {
    icon: ShoppingCart, badge: "success",
    label: { fr: "Par transaction", en: "Per transaction" },
    desc: { fr: "Montant gagné à chaque vente ou commande réalisée.", en: "Amount earned per sale or order completed." },
    example: { fr: "35 € × 200 commandes/mois = 7 000 €/mois", en: "€35 × 200 orders/mo = €7,000/mo" },
  },
  per_user: {
    icon: Users, badge: "info",
    label: { fr: "Par utilisateur", en: "Per user" },
    desc: { fr: "Tarif par utilisateur actif, siège ou compte.", en: "Price per active user, seat or account." },
    example: { fr: "9 €/user × 500 users = 4 500 €/mois", en: "€9/user × 500 users = €4,500/mo" },
  },
  project: {
    icon: Briefcase, badge: "warning",
    label: { fr: "Par projet", en: "Per project" },
    desc: { fr: "Montant par mission, contrat ou projet réalisé sur l'année.", en: "Amount per mission, contract or project delivered annually." },
    example: { fr: "5 000 € × 12 projets/an = 60 000 €/an", en: "€5,000 × 12 projects/yr = €60,000/yr" },
  },
  daily_rate: {
    icon: Clock, badge: "warning",
    label: { fr: "Taux journalier", en: "Daily rate" },
    desc: { fr: "Tarif par jour de travail facturé sur l'année.", en: "Rate per billable day over the year." },
    example: { fr: "500 €/jour × 180 jours = 90 000 €/an", en: "€500/day × 180 days = €90,000/yr" },
  },
  one_time: {
    icon: Sparkle, badge: "gray",
    label: { fr: "Ponctuel", en: "One-time" },
    desc: { fr: "Montant unique — frais de setup, subside, vente exceptionnelle.", en: "One-off amount — setup fee, grant, exceptional sale." },
    example: { fr: "500 € × 10 = 5 000 € (total)", en: "€500 × 10 = €5,000 (total)" },
  },
};

var PRIMARY_BEHAVIOR = {
  saas: "recurring", ecommerce: "per_transaction", retail: "per_transaction",
  services: "project", freelancer: "daily_rate", other: "recurring",
};

var BEHAVIORS = Object.keys(BEHAVIOR_META);

/* ── Badge ── */
function BehaviorBadge({ behavior, lang }) {
  var m = BEHAVIOR_META[behavior] || BEHAVIOR_META.recurring;
  return <Badge color={m.badge} size="sm" dot>{m.label[lang === "en" ? "en" : "fr"]}</Badge>;
}

/* ── Stream Row ── */
function StreamRow({ item, lang, onUpdate, onRemove }) {
  var [hov, setHov] = useState(false);
  var monthly = calcStreamMonthly(item);

  return (
    <div
      onMouseEnter={function () { setHov(true); }}
      onMouseLeave={function () { setHov(false); }}
      style={{
        display: "flex", alignItems: "center", gap: "var(--sp-2)",
        padding: "var(--sp-3)", borderBottom: "1px solid var(--border-light)",
        background: hov ? "var(--bg-hover)" : "transparent",
        transition: "background 0.1s", flexWrap: "wrap",
      }}
    >
      <input
        value={item.l} onChange={function (e) { onUpdate("l", e.target.value); }}
        placeholder={lang === "fr" ? "Nom du revenu" : "Revenue name"}
        style={{ flex: 1, minWidth: 140, fontSize: 13, fontWeight: 500, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)", fontFamily: "inherit" }}
      />
      <BehaviorBadge behavior={item.behavior} lang={lang} />
      <CurrencyInput value={item.price || 0} onChange={function (v) { onUpdate("price", v); }} suffix={getPriceLabel(item.behavior, lang)} width="120px" />
      <span style={{ fontSize: 12, color: "var(--text-ghost)", fontWeight: 600 }}>×</span>
      <input
        type="number" value={item.qty || ""} min={0}
        onChange={function (e) { onUpdate("qty", Number(e.target.value) || 0); }}
        placeholder="0"
        style={{ width: 56, height: 32, textAlign: "right", padding: "0 var(--sp-2)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
      />
      <span style={{ fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap", minWidth: 50 }}>{getDriverLabel(item.behavior, lang)}</span>
      <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>=</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: monthly > 0 ? "var(--brand)" : "var(--text-ghost)", minWidth: 80, textAlign: "right", fontVariantNumeric: "tabular-nums", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
        {eur(monthly)}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-faint)" }}>/m</span>
      </span>
      <button onClick={onRemove} style={{ border: "none", background: "none", cursor: "pointer", padding: 2, opacity: hov ? 1 : 0, transition: "opacity 0.15s", display: "flex" }}>
        <Trash size={14} color="var(--color-error)" />
      </button>
    </div>
  );
}

/* ── Split-panel Creation Modal ── */
function CreateStreamModal({ onAdd, onClose, businessType, lang }) {
  var primary = PRIMARY_BEHAVIOR[businessType] || "recurring";
  var [selected, setSelected] = useState(primary);
  var [name, setName] = useState("");
  var [price, setPrice] = useState(0);
  var [qty, setQty] = useState(0);

  function handleSelect(b) {
    setSelected(b);
    setName("");
    setPrice(0);
    setQty(0);
  }

  function handleAdd() {
    onAdd({
      id: makeId(),
      l: name || BEHAVIOR_META[selected].label[lang === "en" ? "en" : "fr"],
      behavior: selected,
      price: price,
      qty: qty,
      growthRate: 0,
    });
    onClose();
  }

  var meta = BEHAVIOR_META[selected];
  var Icon = meta.icon;
  var monthly = calcStreamMonthly({ behavior: selected, price: price, qty: qty });
  var annual = calcStreamAnnual({ behavior: selected, price: price, qty: qty });

  return createPortal(
    <div onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "var(--overlay-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-modal)",
        width: 640, maxWidth: "94vw", height: 460, maxHeight: "85vh",
        display: "flex", overflow: "hidden",
        animation: "tooltipIn 0.15s ease",
      }}>
        {/* LEFT — Behavior list */}
        <div style={{
          width: 220, flexShrink: 0, borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {lang === "fr" ? "Type de revenu" : "Revenue type"}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)" }}>
            {BEHAVIORS.map(function (b) {
              var m = BEHAVIOR_META[b];
              var BIcon = m.icon;
              var isActive = selected === b;
              var isPrimary = b === primary;
              return (
                <button key={b} onClick={function () { handleSelect(b); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    width: "100%", padding: "10px var(--sp-3)",
                    border: "none", borderRadius: "var(--r-md)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    cursor: "pointer", textAlign: "left", marginBottom: 2,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <BIcon size={16} weight={isActive ? "fill" : "regular"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)", flex: 1 }}>
                    {m.label[lang === "en" ? "en" : "fr"]}
                  </span>
                  {isPrimary ? <Star size={11} weight="fill" color="var(--brand)" style={{ opacity: 0.5, flexShrink: 0 }} /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Config panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                {meta.label[lang === "en" ? "en" : "fr"]}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>
                {meta.desc[lang === "en" ? "en" : "fr"]}
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, padding: "var(--sp-5)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            {/* Example */}
            <div style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", borderLeft: "2px solid var(--border-strong)" }}>
              {meta.example[lang === "en" ? "en" : "fr"]}
            </div>

            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                {lang === "fr" ? "Nom de la source" : "Source name"}
              </label>
              <input value={name} onChange={function (e) { setName(e.target.value); }}
                placeholder={meta.label[lang === "en" ? "en" : "fr"]}
                autoFocus
                style={{ width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            {/* Price + Qty */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                  {lang === "fr" ? "Prix unitaire" : "Unit price"}
                </label>
                <CurrencyInput value={price} onChange={function (v) { setPrice(v); }} suffix={getPriceLabel(selected, lang)} width="100%" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
                  {getDriverLabel(selected, lang)}
                </label>
                <input type="number" value={qty || ""} min={0}
                  onChange={function (e) { setQty(Number(e.target.value) || 0); }}
                  placeholder="0"
                  style={{ width: "100%", height: 32, padding: "0 var(--sp-3)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "right" }}
                />
              </div>
            </div>

            {/* Preview */}
            {price > 0 && qty > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lang === "fr" ? "Estimation" : "Estimate"}</span>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(monthly)}/m</span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "var(--sp-2)" }}>{eur(annual)}/an</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div style={{ padding: "var(--sp-3) var(--sp-5)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "var(--sp-2)" }}>
            <button onClick={onClose} style={{
              height: 40, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
              background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              {lang === "fr" ? "Fermer" : "Close"}
            </button>
            <button onClick={handleAdd} style={{
              height: 40, padding: "0 var(--sp-5)", border: "none", borderRadius: "var(--r-md)",
              background: "var(--brand)", color: "var(--color-on-brand)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
            }}>
              <Plus size={14} weight="bold" /> {lang === "fr" ? "Ajouter" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Main Page ── */
export default function RevenueStreamsPage({ streams, setStreams, annC, businessType }) {
  var { lang } = useLang();
  var t = useT().revenue || {};
  var [showCreate, setShowCreate] = useState(false);

  var totals = useMemo(function () {
    var mrr = 0, arr = 0, count = 0;
    (streams || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        mrr += calcStreamMonthly(item);
        arr += calcStreamAnnual(item);
        if ((item.price || 0) > 0 && (item.qty || 0) > 0) count++;
      });
    });
    return { mrr: mrr, arr: arr, count: count };
  }, [streams]);

  function addStream(newItem) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      if (nc.length === 0) nc.push({ cat: "Revenus", items: [] });
      nc[0].items.push(newItem);
      return nc;
    });
  }

  function updateItem(ci, ii, field, value) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items[ii][field] = value;
      return nc;
    });
  }

  function removeItem(ci, ii) {
    setStreams(function (prev) {
      var nc = JSON.parse(JSON.stringify(prev));
      nc[ci].items.splice(ii, 1);
      if (nc[ci].items.length === 0) nc.splice(ci, 1);
      return nc;
    });
  }

  var breakEvenStatus = annC > 0 && totals.arr > 0
    ? (totals.arr >= annC ? "positive" : "negative") : "neutral";

  return (
    <PageLayout
      title={t.title || (lang === "fr" ? "Sources de revenus" : "Revenue Sources")}
      subtitle={t.subtitle || (lang === "fr" ? "Définissez comment votre entreprise gagne de l'argent." : "Define how your business makes money.")}
      actions={
        <button onClick={function () { setShowCreate(true); }} style={{
          height: 40, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)",
          background: "var(--brand)", color: "var(--color-on-brand)",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
        }}>
          <Plus size={14} weight="bold" /> {lang === "fr" ? "Ajouter" : "Add"}
        </button>
      }
    >
      {showCreate ? <CreateStreamModal onAdd={addStream} onClose={function () { setShowCreate(false); }} businessType={businessType || "other"} lang={lang} /> : null}

      <ExplainerBox variant="info" title={t.explainer_title || (lang === "fr" ? "Comment ça marche ?" : "How does it work?")}>
        {t.explainer_body || (lang === "fr"
          ? "Ajoutez vos sources de revenus. Indiquez le prix et le nombre de clients, commandes ou projets. Le total alimente vos projections."
          : "Add your revenue sources. Enter the price and quantity. The total feeds your projections.")}
      </ExplainerBox>

      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <Card><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>MRR</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--brand)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{eur(totals.mrr)}</div></Card>
        <Card><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{lang === "fr" ? "CA annuel" : "Annual"}</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{eur(totals.arr)}</div></Card>
        <Card><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{lang === "fr" ? "Sources" : "Sources"}</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{totals.count}</div></Card>
      </div>

      <Card>
        {(streams || []).map(function (cat, ci) {
          return (cat.items || []).map(function (item, ii) {
            return <StreamRow key={item.id || (ci + "-" + ii)} item={item} lang={lang} onUpdate={function (f, v) { updateItem(ci, ii, f, v); }} onRemove={function () { removeItem(ci, ii); }} />;
          });
        })}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-3)", borderTop: "2px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-3)" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--brand)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(totals.mrr)}/m</span>
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{eur(totals.arr)}/an</span>
          </div>
        </div>
        <div style={{ padding: "var(--sp-3)", borderTop: "1px solid var(--border-light)" }}>
          <button onClick={function () { setShowCreate(true); }} style={{
            display: "flex", alignItems: "center", gap: "var(--sp-2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)",
            background: "transparent", padding: "var(--sp-2) var(--sp-4)", cursor: "pointer", fontSize: 13, fontWeight: 500,
            color: "var(--brand)", width: "100%", justifyContent: "center", height: 40, transition: "background 0.15s",
          }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={14} weight="bold" /> {lang === "fr" ? "Ajouter une source de revenu" : "Add a revenue source"}
          </button>
        </div>
      </Card>

      {annC > 0 ? (
        <Card sx={{ marginTop: "var(--gap-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: breakEvenStatus === "positive" ? "var(--color-success)" : breakEvenStatus === "negative" ? "var(--color-error)" : "var(--text-ghost)" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {breakEvenStatus === "positive" ? (lang === "fr" ? "Revenus > charges" : "Revenue > costs") : (lang === "fr" ? "Revenus < charges" : "Revenue < costs")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{eur(totals.arr) + " vs " + eur(annC)}</div>
            </div>
          </div>
        </Card>
      ) : null}
    </PageLayout>
  );
}
