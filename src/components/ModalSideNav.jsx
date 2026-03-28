/**
 * ModalSideNav — Reusable left-panel navigation for split-panel modals.
 *
 * Used in ShareholderModal (CapTable), SalaryModal, ProgramModal (Affiliation).
 *
 * Props:
 *   title    — Section header text
 *   items    — Array of { key, icon, label }
 *   selected — Currently selected key
 *   onSelect — function(key)
 *   width    — Optional panel width (default 200)
 */
export default function ModalSideNav({ title, items, selected, onSelect, width }) {
  var w = width || 200;

  return (
    <div style={{ width: w, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
          {title}
        </div>
      </div>
      <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
        {items.map(function (item) {
          var CIcon = item.icon;
          var isActive = selected === item.key;
          return (
            <button key={item.key} type="button" onClick={function () { onSelect(item.key); }}
              style={{
                display: "flex", alignItems: "center", gap: "var(--sp-2)",
                width: "100%", padding: "10px var(--sp-3)",
                border: "none", borderRadius: "var(--r-md)",
                background: isActive ? "var(--brand-bg)" : "transparent",
                cursor: "pointer", textAlign: "left", marginBottom: 2,
                transition: "background 0.1s", fontFamily: "inherit",
              }}
              onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
            >
              {CIcon ? <CIcon size={16} weight={isActive ? "fill" : "regular"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} /> : null}
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)", flex: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
