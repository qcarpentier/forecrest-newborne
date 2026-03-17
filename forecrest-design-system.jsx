import { useState, useEffect } from "react";

/* ═══════════════════════════════════════
   FORECREST — Design System v1.0
   Financial simulation dashboard for startups
   ═══════════════════════════════════════ */

const colors = {
  core: [
    { name: "Black", var: "--black", hex: "#0E0E0D", text: "#F7F4EE", role: "Texte principal, fonds dark" },
    { name: "Background", var: "--bg", hex: "#EDE8DF", text: "#0E0E0D", role: "Fond de page principal" },
    { name: "Surface", var: "--surface", hex: "#F7F4EE", text: "#0E0E0D", role: "Cards, modals, inputs" },
    { name: "Coral", var: "--coral", hex: "#E8431A", text: "#FFFFFF", role: "Accent primaire, CTA, liens" },
    { name: "Coral Light", var: "--coral2", hex: "#FF6B42", text: "#FFFFFF", role: "Hover states, accents secondaires" },
  ],
  neutral: [
    { name: "Border", var: "--border", hex: "#D8D2C6", text: "#0E0E0D", role: "Séparateurs, contours" },
    { name: "Grey", var: "--grey", hex: "#6B6B65", text: "#F7F4EE", role: "Texte secondaire, labels" },
    { name: "Grey Light", var: "--greyL", hex: "#C4BFB3", text: "#0E0E0D", role: "Placeholder, texte tertiaire" },
  ],
  semantic: [
    { name: "Success", var: "--success", hex: "#2D7A4F", text: "#FFFFFF", role: "Positif, revenu, croissance" },
    { name: "Success Light", var: "--success-bg", hex: "#E8F5EE", text: "#2D7A4F", role: "Badge success, bg léger" },
    { name: "Warning", var: "--warning", hex: "#B8860B", text: "#FFFFFF", role: "Alerte, attention requise" },
    { name: "Warning Light", var: "--warning-bg", hex: "#FDF5E6", text: "#B8860B", role: "Badge warning, bg léger" },
    { name: "Error", var: "--error", hex: "#C0392B", text: "#FFFFFF", role: "Erreur, dépense, perte" },
    { name: "Error Light", var: "--error-bg", hex: "#FDEDEB", text: "#C0392B", role: "Badge error, bg léger" },
  ],
  chart: [
    { name: "Chart 1", hex: "#E8431A", role: "Série principale" },
    { name: "Chart 2", hex: "#0E0E0D", role: "Série secondaire" },
    { name: "Chart 3", hex: "#6B6B65", role: "Série tertiaire" },
    { name: "Chart 4", hex: "#C4BFB3", role: "Série quaternaire" },
    { name: "Chart 5", hex: "#D8D2C6", role: "Fond de graphe, grille" },
  ],
};

const typographyScale = [
  { label: "Display", family: "Bricolage Grotesque", weight: 800, size: "48px", tracking: "-2px", leading: "1.0", sample: "€1.2M runway" },
  { label: "H1", family: "Bricolage Grotesque", weight: 800, size: "36px", tracking: "-1.5px", leading: "1.05", sample: "Vue d'ensemble" },
  { label: "H2", family: "Bricolage Grotesque", weight: 800, size: "24px", tracking: "-0.8px", leading: "1.1", sample: "Simulations actives" },
  { label: "H3", family: "Bricolage Grotesque", weight: 700, size: "18px", tracking: "-0.5px", leading: "1.2", sample: "Répartition des coûts" },
  { label: "H4", family: "Bricolage Grotesque", weight: 700, size: "15px", tracking: "-0.3px", leading: "1.25", sample: "Détail par catégorie" },
  { label: "KPI", family: "Bricolage Grotesque", weight: 800, size: "40px", tracking: "-2px", leading: "1", sample: "€248K" },
  { label: "Body", family: "DM Sans", weight: 400, size: "15px", tracking: "0", leading: "1.6", sample: "Projection basée sur le burn rate actuel et les revenus récurrents estimés." },
  { label: "Body Small", family: "DM Sans", weight: 400, size: "13.5px", tracking: "0", leading: "1.55", sample: "Dernière mise à jour il y a 3 heures · Source: Stripe + Bancontact" },
  { label: "Caption", family: "DM Sans", weight: 500, size: "12px", tracking: "0.2px", leading: "1.4", sample: "Mise à jour · 17 mars 2026" },
  { label: "Overline", family: "DM Sans", weight: 700, size: "11px", tracking: "1.4px", leading: "1", sample: "BURN RATE MENSUEL", uppercase: true },
  { label: "Mono / Data", family: "monospace", weight: 500, size: "14px", tracking: "0", leading: "1.4", sample: "€12,482.00   +3.2%   MRR" },
];

const shadowScale = [
  { name: "xs", value: "0 1px 2px rgba(0,0,0,.04)", use: "Inputs, petits éléments" },
  { name: "sm", value: "0 2px 8px rgba(0,0,0,.06)", use: "Cards au repos" },
  { name: "md", value: "0 6px 20px rgba(0,0,0,.08)", use: "Cards hover, dropdowns" },
  { name: "lg", value: "0 16px 40px rgba(0,0,0,.10)", use: "Modals, popovers" },
  { name: "xl", value: "0 24px 56px rgba(0,0,0,.12)", use: "Overlays, dialogs" },
];

const tabs = ["Couleurs", "Typographie", "Composants", "Data Viz", "Fondations"];

function CopyBadge({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <span
      onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      style={{ cursor: "pointer", fontSize: 10.5, fontFamily: "monospace", color: copied ? "#E8431A" : "#6B6B65", background: "#F7F4EE", padding: "2px 7px", borderRadius: 4, transition: "color .2s", whiteSpace: "nowrap" }}
    >
      {copied ? "✓" : text}
    </span>
  );
}

function SectionTag({ children }) {
  return (
    <div style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "#E8431A", marginBottom: 20, display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: 18, height: 2, background: "#E8431A", borderRadius: 1, display: "inline-block" }} />
      {children}
    </div>
  );
}

function ColorSwatch({ color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 130px", minWidth: 115, maxWidth: 180 }}>
      <div style={{
        background: color.hex, borderRadius: 12, height: 72, display: "flex", alignItems: "flex-end", padding: 12,
        border: ["#F7F4EE", "#EDE8DF", "#E8F5EE", "#FDF5E6", "#FDEDEB"].includes(color.hex) ? "1.5px solid #D8D2C6" : "none",
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      }}>
        <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 12, color: color.text, letterSpacing: "-.3px" }}>Aa</span>
      </div>
      <div>
        <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 12.5, color: "#0E0E0D", letterSpacing: "-.3px" }}>{color.name}</div>
        {color.role && <div style={{ fontFamily: "'DM Sans'", fontSize: 10.5, color: "#C4BFB3", marginTop: 1, lineHeight: 1.35 }}>{color.role}</div>}
        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
          <CopyBadge text={color.hex} />
          {color.var && <CopyBadge text={`var(${color.var})`} />}
        </div>
      </div>
    </div>
  );
}

/* ═══ COULEURS ═══ */
function ColorsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
      {[
        { title: "Couleurs principales", items: colors.core },
        { title: "Neutres", items: colors.neutral },
        { title: "Sémantiques", items: colors.semantic },
      ].map((group) => (
        <div key={group.title}>
          <SectionTag>{group.title}</SectionTag>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {group.items.map((c) => <ColorSwatch key={c.hex + c.name} color={c} />)}
          </div>
        </div>
      ))}
      <div>
        <SectionTag>Palette Data Viz</SectionTag>
        <div style={{ display: "flex", gap: 3, borderRadius: 12, overflow: "hidden", height: 48 }}>
          {colors.chart.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c.hex, display: "flex", alignItems: "flex-end", padding: "6px 8px" }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: i < 2 ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.35)" }}>{c.hex}</span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#6B6B65", marginTop: 10, lineHeight: 1.5 }}>
          Séquence monochrome du coral au gris, optimisée pour les graphes financiers. Distinguable en niveaux de gris et accessible WCAG AA.
        </div>
      </div>
    </div>
  );
}

/* ═══ TYPOGRAPHIE ═══ */
function TypographyTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 36, flexWrap: "wrap" }}>
        {[{ name: "Bricolage Grotesque", role: "Display · Titres · KPIs", weights: "700 — 800", sample: "€1.2M" }, { name: "DM Sans", role: "Body · UI · Labels · Meta", weights: "300 — 500", sample: "Runway" }].map((f) => (
          <div key={f.name} style={{ flex: "1 1 260px", background: "#F7F4EE", borderRadius: 14, padding: "24px 22px", border: "1px solid #D8D2C6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontFamily: `'${f.name}'`, fontWeight: 800, fontSize: 32, color: "#0E0E0D", letterSpacing: "-1.5px", lineHeight: 1 }}>{f.sample}</div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#C4BFB3" }}>{f.weights}</div>
            </div>
            <div style={{ fontFamily: `'${f.name}'`, fontWeight: 700, fontSize: 14, color: "#0E0E0D", marginTop: 12, letterSpacing: "-.3px" }}>{f.name}</div>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 11.5, color: "#6B6B65", marginTop: 2 }}>{f.role}</div>
          </div>
        ))}
      </div>
      {typographyScale.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 20, padding: "20px 0", borderBottom: "1px solid #D8D2C6", flexWrap: "wrap" }}>
          <div style={{ minWidth: 120, flexShrink: 0 }}>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#0E0E0D" }}>{t.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 9.5, color: "#C4BFB3", marginTop: 3, lineHeight: 1.4 }}>
              {t.family === "monospace" ? "system mono" : t.family}<br/>{t.size} · {t.weight} · {t.tracking}
            </div>
          </div>
          <div style={{
            fontFamily: t.family === "monospace" ? "ui-monospace, 'SF Mono', monospace" : `'${t.family}'`,
            fontWeight: t.weight, fontSize: Math.min(parseInt(t.size), 44),
            letterSpacing: t.tracking, lineHeight: t.leading, color: "#0E0E0D", flex: 1,
            fontStyle: t.italic ? "italic" : "normal", textTransform: t.uppercase ? "uppercase" : "none",
          }}>
            {t.sample}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ COMPOSANTS ═══ */
function ComponentsTab() {
  const [inputVal, setInputVal] = useState("");
  const [toggled, setToggled] = useState(true);
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Buttons */}
      <div>
        <SectionTag>Boutons</SectionTag>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 600, color: "#fff", background: "#E8431A", border: "none", padding: "11px 22px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
            Lancer la simulation →
          </button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 500, color: "#0E0E0D", background: "none", border: "1.5px solid #D8D2C6", padding: "10px 22px", borderRadius: 10, cursor: "pointer" }}>
            Secondaire
          </button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 500, color: "#6B6B65", background: "none", border: "none", padding: "9px 14px", borderRadius: 8, cursor: "pointer" }}>
            Ghost
          </button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, color: "#E8431A", background: "rgba(232,67,26,.08)", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer" }}>
            Tertiaire
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#fff", background: "#E8431A", border: "none", padding: "7px 14px", borderRadius: 7, cursor: "pointer" }}>
            Small
          </button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: "#0E0E0D", background: "none", border: "1.5px solid #D8D2C6", padding: "6px 14px", borderRadius: 7, cursor: "pointer" }}>
            Small outline
          </button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 600, color: "#C4BFB3", background: "#EDE8DF", border: "none", padding: "11px 22px", borderRadius: 10, cursor: "not-allowed", opacity: .6 }}>
            Disabled
          </button>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, color: "#E8431A", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
            Lien action →
          </span>
        </div>
        {/* Dark variant */}
        <div style={{ background: "#0E0E0D", borderRadius: 14, padding: "24px 22px", marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 600, color: "#fff", background: "#E8431A", border: "none", padding: "11px 22px", borderRadius: 10, cursor: "pointer" }}>Primaire dark</button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 500, color: "rgba(247,244,238,.72)", background: "none", border: "1.5px solid rgba(247,244,238,.16)", padding: "10px 22px", borderRadius: 10, cursor: "pointer" }}>Outline dark</button>
          <button style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 500, color: "rgba(247,244,238,.5)", background: "none", border: "none", padding: "9px 14px", borderRadius: 8, cursor: "pointer" }}>Ghost dark</button>
        </div>
      </div>

      {/* Inputs & Forms */}
      <div>
        <SectionTag>Inputs & Formulaires</SectionTag>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div>
            <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#0E0E0D", display: "block", marginBottom: 6 }}>Montant mensuel</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'Bricolage Grotesque'", fontSize: 14, fontWeight: 700, color: "#C4BFB3" }}>€</span>
              <input
                type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder="12 500"
                style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "#0E0E0D", background: "#F7F4EE", border: "1.5px solid #D8D2C6", borderRadius: 10, padding: "11px 14px 11px 30px", width: "100%", boxSizing: "border-box", outline: "none" }}
                onFocus={(e) => e.target.style.borderColor = "#E8431A"}
                onBlur={(e) => e.target.style.borderColor = "#D8D2C6"}
              />
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#C4BFB3", marginTop: 4, display: "block" }}>Estimation du burn rate</span>
          </div>
          <div>
            <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#0E0E0D", display: "block", marginBottom: 6 }}>Catégorie</label>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "#0E0E0D", background: "#F7F4EE", border: "1.5px solid #D8D2C6", borderRadius: 10, padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span>SaaS & Outils</span>
              <span style={{ fontSize: 10, color: "#C4BFB3" }}>▼</span>
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#C0392B", display: "block", marginBottom: 6 }}>Champ en erreur</label>
            <input
              type="text" defaultValue="abc" readOnly
              style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "#0E0E0D", background: "#FDEDEB", border: "1.5px solid #C0392B", borderRadius: 10, padding: "11px 14px", width: "100%", boxSizing: "border-box", outline: "none" }}
            />
            <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#C0392B", marginTop: 4, display: "block" }}>Ce champ doit être un montant valide</span>
          </div>
        </div>
        {/* Toggle & Checkbox */}
        <div style={{ display: "flex", gap: 32, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setToggled(!toggled)} style={{ width: 40, height: 22, borderRadius: 11, background: toggled ? "#E8431A" : "#D8D2C6", padding: 2, cursor: "pointer", transition: "background .2s", display: "flex", alignItems: "center" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", transform: toggled ? "translateX(18px)" : "translateX(0)", transition: "transform .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#0E0E0D" }}>TVA incluse</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setCheckA(!checkA)}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: checkA ? "none" : "1.5px solid #D8D2C6", background: checkA ? "#E8431A" : "#F7F4EE", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
              {checkA && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#0E0E0D" }}>Inclure les charges sociales</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setCheckB(!checkB)}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: checkB ? "none" : "1.5px solid #D8D2C6", background: checkB ? "#E8431A" : "#F7F4EE", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
              {checkB && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#0E0E0D" }}>Mode pessimiste</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <SectionTag>KPI Cards</SectionTag>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            { label: "Runway", value: "14.2", unit: "mois", change: "+2.1", up: true },
            { label: "Burn rate", value: "€18.4K", unit: "/mois", change: "-8.3%", up: true },
            { label: "MRR", value: "€6.2K", unit: "", change: "+12.4%", up: true },
            { label: "Dépenses Q1", value: "€52K", unit: "", change: "+3.1%", up: false },
          ].map((k, i) => (
            <div key={i} style={{ background: "#F7F4EE", borderRadius: 14, padding: "22px 20px", border: "1px solid #D8D2C6" }}>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#6B6B65", marginBottom: 12 }}>{k.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 32, fontWeight: 800, color: "#0E0E0D", letterSpacing: "-1.5px", lineHeight: 1 }}>{k.value}</span>
                {k.unit && <span style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#C4BFB3" }}>{k.unit}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                <span style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: k.up ? "#2D7A4F" : "#C0392B", background: k.up ? "#E8F5EE" : "#FDEDEB", padding: "2px 7px", borderRadius: 5 }}>
                  {k.change}
                </span>
                <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#C4BFB3" }}>vs mois dernier</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts / Toasts */}
      <div>
        <SectionTag>Alertes & Feedback</SectionTag>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { type: "success", bg: "#E8F5EE", border: "#2D7A4F", color: "#2D7A4F", icon: "✓", text: "Simulation enregistrée avec succès." },
            { type: "warning", bg: "#FDF5E6", border: "#B8860B", color: "#B8860B", icon: "⚠", text: "Votre runway passe sous 6 mois avec ce scénario." },
            { type: "error", bg: "#FDEDEB", border: "#C0392B", color: "#C0392B", icon: "✕", text: "Impossible de synchroniser les données bancaires." },
            { type: "info", bg: "#F7F4EE", border: "#D8D2C6", color: "#6B6B65", icon: "i", text: "Les projections sont recalculées chaque nuit à 02h00 CET." },
          ].map((a) => (
            <div key={a.type} style={{ display: "flex", alignItems: "center", gap: 12, background: a.bg, border: `1.5px solid ${a.border}`, borderRadius: 10, padding: "12px 16px" }}>
              <span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 13, color: a.color, width: 22, height: 22, borderRadius: 6, background: a.border + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 13.5, color: a.color, fontWeight: 500 }}>{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div>
        <SectionTag>Table de données</SectionTag>
        <div style={{ background: "#F7F4EE", borderRadius: 14, border: "1px solid #D8D2C6", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans'" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #D8D2C6" }}>
                {["Poste de coût", "Mensuel", "Annuel", "% du total", "Trend"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "#6B6B65" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Salaires & freelances", m: "€8 200", a: "€98 400", pct: "44%", up: false },
                { name: "SaaS & outillage", m: "€1 850", a: "€22 200", pct: "12%", up: false },
                { name: "Marketing & ads", m: "€3 100", a: "€37 200", pct: "20%", up: true },
                { name: "Bureau & coworking", m: "€950", a: "€11 400", pct: "6%", up: false },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #EDE8DF" }}>
                  <td style={{ padding: "14px 16px", fontSize: 13.5, fontWeight: 500, color: "#0E0E0D" }}>{r.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13.5, color: "#0E0E0D", fontFamily: "ui-monospace, monospace", fontWeight: 500 }}>{r.m}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13.5, color: "#6B6B65", fontFamily: "ui-monospace, monospace" }}>{r.a}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 5, borderRadius: 3, background: "#EDE8DF", overflow: "hidden" }}>
                        <div style={{ width: r.pct, height: "100%", background: "#E8431A", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#6B6B65", fontFamily: "monospace" }}>{r.pct}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: r.up ? "#C0392B" : "#2D7A4F", background: r.up ? "#FDEDEB" : "#E8F5EE", padding: "2px 7px", borderRadius: 4 }}>
                      {r.up ? "↑" : "↓"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tags & Badges */}
      <div>
        <SectionTag>Tags, Badges & Chips</SectionTag>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 600, color: "#E8431A", background: "rgba(232,67,26,.08)", padding: "4px 10px", borderRadius: 6 }}>Simulation</span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 600, color: "#2D7A4F", background: "#E8F5EE", padding: "4px 10px", borderRadius: 6 }}>Actif</span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 600, color: "#B8860B", background: "#FDF5E6", padding: "4px 10px", borderRadius: 6 }}>En attente</span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 600, color: "#C0392B", background: "#FDEDEB", padding: "4px 10px", borderRadius: 6 }}>Archivé</span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 600, color: "#6B6B65", background: "#F7F4EE", border: "1px solid #D8D2C6", padding: "4px 10px", borderRadius: 6 }}>Draft</span>
          <span style={{ width: 1, height: 20, background: "#D8D2C6", margin: "0 6px" }} />
          <span style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: "#0E0E0D", background: "#F7F4EE", border: "1px solid #D8D2C6", padding: "5px 12px", borderRadius: 100, display: "flex", alignItems: "center", gap: 6 }}>
            SaaS <span style={{ fontSize: 9, cursor: "pointer", color: "#C4BFB3" }}>✕</span>
          </span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, color: "#0E0E0D", background: "#F7F4EE", border: "1px solid #D8D2C6", padding: "5px 12px", borderRadius: 100, display: "flex", alignItems: "center", gap: 6 }}>
            Q1 2026 <span style={{ fontSize: 9, cursor: "pointer", color: "#C4BFB3" }}>✕</span>
          </span>
        </div>
      </div>

      {/* Tooltip / Popover */}
      <div>
        <SectionTag>Tooltip</SectionTag>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ background: "#0E0E0D", color: "#F7F4EE", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,.15)", maxWidth: 220, lineHeight: 1.45 }}>
              Runway = trésorerie ÷ burn rate mensuel moyen
            </div>
            <div style={{ width: 8, height: 8, background: "#0E0E0D", transform: "rotate(45deg)", position: "absolute", bottom: -4, left: 24 }} />
          </div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ background: "#F7F4EE", color: "#0E0E0D", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 8, border: "1px solid #D8D2C6", boxShadow: "0 6px 20px rgba(0,0,0,.08)", maxWidth: 220, lineHeight: 1.45 }}>
              Basé sur les 3 derniers mois de transactions Stripe.
            </div>
            <div style={{ width: 8, height: 8, background: "#F7F4EE", border: "1px solid #D8D2C6", borderTop: "none", borderLeft: "none", transform: "rotate(45deg)", position: "absolute", bottom: -5, left: 24 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ DATA VIZ ═══ */
function DataVizTab() {
  const barData = [65, 48, 82, 70, 55, 90, 75, 60, 85, 72, 58, 95];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const maxBar = Math.max(...barData);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Bar Chart */}
      <div>
        <SectionTag>Bar Chart — Dépenses mensuelles</SectionTag>
        <div style={{ background: "#F7F4EE", borderRadius: 14, border: "1px solid #D8D2C6", padding: "24px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 22, fontWeight: 800, color: "#0E0E0D", letterSpacing: "-.8px" }}>€186.4K</div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#6B6B65", marginTop: 2 }}>Total dépenses 2026</div>
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#2D7A4F", background: "#E8F5EE", padding: "3px 8px", borderRadius: 5 }}>-4.2% vs 2025</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
            {barData.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", height: (v / maxBar) * 120, background: i === 11 ? "#E8431A" : "#0E0E0D", borderRadius: "4px 4px 0 0", transition: "height .3s", minHeight: 4, opacity: i === 11 ? 1 : 0.15 + (v / maxBar) * 0.85 }} />
                <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#C4BFB3" }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donut */}
      <div>
        <SectionTag>Donut Chart — Répartition</SectionTag>
        <div style={{ background: "#F7F4EE", borderRadius: 14, border: "1px solid #D8D2C6", padding: "24px 22px", display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#EDE8DF" strokeWidth="16" />
            <circle cx="70" cy="70" r="54" fill="none" stroke="#E8431A" strokeWidth="16" strokeDasharray="152 188" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 70 70)" />
            <circle cx="70" cy="70" r="54" fill="none" stroke="#0E0E0D" strokeWidth="16" strokeDasharray="75 265" strokeDashoffset="-152" strokeLinecap="round" transform="rotate(-90 70 70)" />
            <circle cx="70" cy="70" r="54" fill="none" stroke="#6B6B65" strokeWidth="16" strokeDasharray="45 295" strokeDashoffset="-227" strokeLinecap="round" transform="rotate(-90 70 70)" />
            <circle cx="70" cy="70" r="54" fill="none" stroke="#C4BFB3" strokeWidth="16" strokeDasharray="30 310" strokeDashoffset="-272" strokeLinecap="round" transform="rotate(-90 70 70)" />
            <text x="70" y="66" textAnchor="middle" style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 20, fontWeight: 800, fill: "#0E0E0D" }}>€18.4K</text>
            <text x="70" y="82" textAnchor="middle" style={{ fontFamily: "'DM Sans'", fontSize: 10, fill: "#6B6B65" }}>/ mois</text>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { color: "#E8431A", label: "Salaires", pct: "44%" },
              { color: "#0E0E0D", label: "Marketing", pct: "22%" },
              { color: "#6B6B65", label: "SaaS & outils", pct: "13%" },
              { color: "#C4BFB3", label: "Autres", pct: "21%" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#0E0E0D", fontWeight: 500, minWidth: 100 }}>{l.label}</span>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#6B6B65" }}>{l.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sparklines */}
      <div>
        <SectionTag>Sparklines — Mini indicateurs</SectionTag>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            { label: "MRR", value: "€6.2K", points: [20,25,22,30,28,35,32,40,38,45,42,52], color: "#2D7A4F" },
            { label: "Burn rate", value: "€18.4K", points: [50,48,52,45,47,42,44,40,38,35,37,33], color: "#E8431A" },
            { label: "Clients actifs", value: "148", points: [60,65,63,70,72,75,80,78,82,88,85,92], color: "#0E0E0D" },
          ].map((s) => {
            const max = Math.max(...s.points);
            const min = Math.min(...s.points);
            const range = max - min || 1;
            const w = 120, h = 36;
            const path = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (s.points.length - 1)) * w},${h - ((p - min) / range) * h}`).join(" ");
            return (
              <div key={s.label} style={{ background: "#F7F4EE", borderRadius: 12, border: "1px solid #D8D2C6", padding: "18px 18px" }}>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", color: "#6B6B65", marginBottom: 8 }}>{s.label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <span style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 24, fontWeight: 800, color: "#0E0E0D", letterSpacing: "-1px", lineHeight: 1 }}>{s.value}</span>
                  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart palette rules */}
      <div>
        <SectionTag>Règles Data Viz</SectionTag>
        <div style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "#0E0E0D", lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12 }}>La palette chart suit une progression monochrome : coral → noir → gris → gris clair → bordure. Cela garantit la lisibilité en impression N&B et pour les daltoniens.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 8 }}>
            {[
              { rule: "Maximum 5 séries", desc: "Au-delà, regrouper dans « Autres »" },
              { rule: "Toujours un axe Y lisible", desc: "€, K, M — pas de décimales inutiles" },
              { rule: "Highlight = coral uniquement", desc: "La série active ou sélectionnée utilise #E8431A" },
              { rule: "Grille à 10% d'opacité", desc: "Utiliser #D8D2C6 avec opacity .1 pour la grille" },
            ].map((r) => (
              <div key={r.rule} style={{ background: "#F7F4EE", borderRadius: 10, padding: "14px 16px", border: "1px solid #D8D2C6" }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 13.5, fontWeight: 700, color: "#0E0E0D", letterSpacing: "-.3px" }}>{r.rule}</div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#6B6B65", marginTop: 3 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ FONDATIONS ═══ */
function FondationsTab() {
  const spacings = [
    { px: 4, desc: "Micro — entre icône et texte inline" },
    { px: 8, desc: "Tight — gap entre tags, chips" },
    { px: 12, desc: "Compact — gap entre petits éléments" },
    { px: 16, desc: "Default — gap standard" },
    { px: 20, desc: "Card padding (compact)" },
    { px: 24, desc: "Card padding (standard)" },
    { px: 32, desc: "Card padding (large)" },
    { px: 48, desc: "Section gap horizontal" },
    { px: 64, desc: "Section padding vertical (small)" },
    { px: 100, desc: "Section padding vertical (large)" },
  ];
  const radii = [
    { val: "5-6px", use: "Tags, badges, petits éléments" },
    { val: "8px", use: "Inputs, small buttons" },
    { val: "10px", use: "Buttons, select, alerts" },
    { val: "12px", use: "Sparklines, mini cards" },
    { val: "14px", use: "Cards standard, panels" },
    { val: "20px", use: "Large cards, sections" },
    { val: "100px", use: "Pills, chips, toggles" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Spacing */}
      <div>
        <SectionTag>Échelle d'espacement</SectionTag>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {spacings.map((s) => (
            <div key={s.px} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6B6B65", width: 44, textAlign: "right", flexShrink: 0 }}>{s.px}px</span>
              <div style={{ width: s.px, height: 16, background: "#E8431A", borderRadius: 2, flexShrink: 0, opacity: 0.2 + (s.px / 120) }} />
              <span style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#C4BFB3" }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <SectionTag>Border Radius</SectionTag>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {radii.map((r) => (
            <div key={r.val} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 76 }}>
              <div style={{ width: 48, height: 48, background: "#F7F4EE", border: "1.5px solid #D8D2C6", borderRadius: r.val.includes("-") ? r.val.split("-")[0] : r.val }} />
              <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "#0E0E0D", fontWeight: 600 }}>{r.val}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#C4BFB3", textAlign: "center", lineHeight: 1.3 }}>{r.use}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shadows */}
      <div>
        <SectionTag>Ombres & Élévation</SectionTag>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {shadowScale.map((s) => (
            <div key={s.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 100 }}>
              <div style={{ width: 72, height: 72, background: "#F7F4EE", borderRadius: 12, boxShadow: s.value }} />
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "#0E0E0D" }}>{s.name}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#C4BFB3", textAlign: "center", lineHeight: 1.3 }}>{s.use}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div>
        <SectionTag>Container & Grille</SectionTag>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { label: "Max width", value: "1220px", desc: "Container principal" },
            { label: "Padding H (desktop)", value: "48px", desc: "Marge latérale" },
            { label: "Padding H (mobile)", value: "24px", desc: "< 768px" },
            { label: "Navbar height", value: "56px", desc: "Header fixe" },
            { label: "Sidebar width", value: "240px", desc: "Navigation latérale" },
            { label: "Grid gap", value: "14–18px", desc: "Entre cards" },
          ].map((g) => (
            <div key={g.label} style={{ background: "#F7F4EE", borderRadius: 10, padding: "14px 16px", border: "1px solid #D8D2C6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, color: "#0E0E0D" }}>{g.label}</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#E8431A" }}>{g.value}</span>
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#C4BFB3", marginTop: 3 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transitions */}
      <div>
        <SectionTag>Motion & Transitions</SectionTag>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {[
            { prop: "Hover (couleur, bg)", value: "150ms ease", css: "transition: all .15s ease" },
            { prop: "Hover (transform)", value: "200ms ease", css: "transition: transform .2s ease" },
            { prop: "Modal / Overlay", value: "200ms ease-out", css: "transition: opacity .2s ease-out" },
            { prop: "Page transitions", value: "300ms ease-in-out", css: "transition: all .3s ease-in-out" },
            { prop: "Skeleton loading", value: "1.5s ease-in-out infinite", css: "animation: pulse 1.5s ease-in-out infinite" },
            { prop: "Chart animations", value: "600ms ease-out", css: "transition: height .6s ease-out" },
          ].map((m) => (
            <div key={m.prop} style={{ background: "#F7F4EE", borderRadius: 10, padding: "14px 16px", border: "1px solid #D8D2C6" }}>
              <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 13, fontWeight: 700, color: "#0E0E0D", letterSpacing: "-.2px" }}>{m.prop}</div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#6B6B65", marginTop: 2 }}>{m.value}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "#C4BFB3", marginTop: 4, background: "#EDE8DF", padding: "3px 7px", borderRadius: 4, display: "inline-block" }}>{m.css}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakpoints */}
      <div>
        <SectionTag>Breakpoints</SectionTag>
        <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid #D8D2C6" }}>
          {[
            { name: "Mobile", range: "< 640px", cols: "1 col" },
            { name: "Tablet", range: "640–1024px", cols: "2 cols" },
            { name: "Desktop", range: "1024–1440px", cols: "3–4 cols" },
            { name: "Wide", range: "> 1440px", cols: "4+ cols" },
          ].map((b, i) => (
            <div key={b.name} style={{ flex: 1, padding: "16px 14px", background: "#F7F4EE", borderRight: i < 3 ? "1px solid #D8D2C6" : "none", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 13, fontWeight: 700, color: "#0E0E0D" }}>{b.name}</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#E8431A", marginTop: 4 }}>{b.range}</div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#C4BFB3", marginTop: 2 }}>{b.cols}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#EDE8DF", minHeight: "100vh", color: "#0E0E0D" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#0E0E0D", padding: "56px 48px 48px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#E8431A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 14L8 3h2l5 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 10h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Bricolage Grotesque'", fontSize: 17, fontWeight: 800, color: "#F7F4EE", letterSpacing: "-.5px" }}>Forecrest</div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 10.5, fontWeight: 500, letterSpacing: ".5px", color: "rgba(247,244,238,.35)", textTransform: "uppercase" }}>Design System</div>
            </div>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 500, color: "rgba(247,244,238,.25)", marginLeft: "auto" }}>v1.0 — Mars 2026</span>
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque'", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#F7F4EE", lineHeight: 1.05, letterSpacing: "-2px", margin: 0 }}>
            Fondations visuelles<span style={{ color: "#E8431A" }}>.</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 15, fontWeight: 300, fontStyle: "italic", color: "rgba(247,244,238,.4)", lineHeight: 1.6, marginTop: 12, maxWidth: 500, marginBottom: 0 }}>
            Couleurs, typographie, composants, data viz et règles de mise en page pour le dashboard de simulation financière.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #D8D2C6", background: "#F7F4EE", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 48px", display: "flex", gap: 0, overflowX: "auto" }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{
              fontFamily: "'DM Sans'", fontSize: 13.5, fontWeight: activeTab === i ? 600 : 400,
              color: activeTab === i ? "#E8431A" : "#6B6B65", background: "none", border: "none",
              padding: "14px 18px", cursor: "pointer", borderBottom: activeTab === i ? "2.5px solid #E8431A" : "2.5px solid transparent",
              transition: "all .15s", marginBottom: -1, whiteSpace: "nowrap",
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 48px 88px" }}>
        {activeTab === 0 && <ColorsTab />}
        {activeTab === 1 && <TypographyTab />}
        {activeTab === 2 && <ComponentsTab />}
        {activeTab === 3 && <DataVizTab />}
        {activeTab === 4 && <FondationsTab />}
      </div>
    </div>
  );
}
