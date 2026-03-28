import { useState } from "react";

export default function ActionBtn({ icon, title, onClick, variant }) {
  var [hov, setHov] = useState(false);
  var isDanger = variant === "danger";
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick}
      onMouseEnter={function () { setHov(true); }} onMouseLeave={function () { setHov(false); }}
      style={{
        width: 32, height: 32,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: 0, border: "none", borderRadius: "var(--r-md)",
        background: hov ? (isDanger ? "var(--color-error-bg)" : "var(--bg-hover)") : "transparent",
        color: hov ? (isDanger ? "var(--color-error)" : "var(--text-primary)") : "var(--text-muted)",
        cursor: "pointer", transition: "background 0.12s, color 0.12s",
      }}>
      {icon}
    </button>
  );
}
