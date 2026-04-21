import { createPortal } from "react-dom";
import { Eye, X } from "@phosphor-icons/react";
import { useT, useLang } from "../context";

export default function ViewerBanner({ meta, onExit }) {
  var t = useT();
  var { lang } = useLang();
  var vt = (t && t.viewer) || {};
  var companyName = (meta && meta.companyName) || "";
  var createdLabel = "";
  if (meta && meta.createdAt) {
    try {
      var d = new Date(meta.createdAt);
      createdLabel = d.toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch (e) { createdLabel = ""; }
  }

  return createPortal(
    <div
      role="status"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9500,
        height: 36, background: "var(--brand)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "var(--sp-3)",
        fontSize: 12, fontWeight: 600,
        padding: "0 var(--sp-4)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <Eye size={14} weight="fill" />
      <span style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {vt.banner_label || "Read-only mode"}
        {companyName ? (<> — <strong>{companyName}</strong></>) : null}
        {createdLabel ? (<span style={{ opacity: 0.8, marginLeft: 6 }}>· {createdLabel}</span>) : null}
      </span>
      {onExit ? (
        <button
          type="button"
          onClick={onExit}
          aria-label={vt.banner_exit || "Exit"}
          style={{
            marginLeft: "var(--sp-2)",
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.18)", border: "none",
            color: "#fff", padding: "4px 10px",
            borderRadius: "var(--r-md)",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          <X size={12} weight="bold" />
          {vt.banner_exit || "Exit"}
        </button>
      ) : null}
    </div>,
    document.body
  );
}
