import { Warning, ArrowRight, XCircle } from "@phosphor-icons/react";
import { useT } from "../../context";

function ForecrestLogo({ light }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="26" height="26" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="6" fill={light ? "rgba(255,255,255,0.2)" : "var(--brand)"} />
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize="20" fontWeight="800"
          fontFamily="'Bricolage Grotesque',sans-serif">F</text>
      </svg>
      <span style={{
        fontSize: 17, fontWeight: 800, color: light ? "#fff" : "var(--text-primary)",
        fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
        letterSpacing: "-0.02em",
      }}>Forecrest</span>
    </div>
  );
}

export default function ViewerErrorPage({ code, onDismiss }) {
  var t = useT();
  var vt = (t && t.viewer) || {};

  var titleKey, descKey;
  if (code === "EXPIRED") { titleKey = "error_expired_title"; descKey = "error_expired_desc"; }
  else if (code === "VERSION_AHEAD") { titleKey = "error_version_ahead_title"; descKey = "error_version_ahead_desc"; }
  else if (code === "TOO_LARGE") { titleKey = "error_too_large_title"; descKey = "error_too_large_desc"; }
  else { titleKey = "error_corrupt_title"; descKey = "error_corrupt_desc"; }

  var title = vt[titleKey] || "Invalid link";
  var desc = vt[descKey] || "This viewer link cannot be opened.";
  var dismiss = vt.error_dismiss || "Back to Forecrest";

  return (
    <div style={{
      fontFamily: "'DM Sans',Inter,system-ui,sans-serif",
      background: "var(--bg-page)", minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      color: "var(--text-primary)", padding: "var(--sp-4)",
    }}>
      <div style={{
        width: 460, maxWidth: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        <div style={{
          background: "var(--color-error)",
          padding: "20px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <ForecrestLogo light />
          <span style={{
            fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)",
            background: "rgba(255,255,255,0.15)",
            padding: "4px 12px", borderRadius: "var(--r-xl)",
          }}>
            {title}
          </span>
        </div>

        <div style={{ padding: "28px", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto var(--sp-4)",
            background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {code === "EXPIRED" ? (
              <Warning size={32} weight="duotone" color="var(--color-error)" />
            ) : (
              <XCircle size={32} weight="duotone" color="var(--color-error)" />
            )}
          </div>

          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 var(--sp-2)",
            fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
          }}>
            {title}
          </h2>

          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 var(--sp-6)", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
            {desc}
          </p>

          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: "10px 32px", fontSize: 14, fontWeight: 600,
              color: "var(--color-on-brand)", background: "var(--brand)",
              border: "none", borderRadius: "var(--r-md)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
            }}
          >
            {dismiss} <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      <div style={{ marginTop: "var(--sp-4)", fontSize: 11, color: "var(--text-faint)" }}>
        Forecrest
      </div>
    </div>
  );
}
