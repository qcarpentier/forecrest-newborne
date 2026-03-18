import { Warning, CheckCircle, ArrowRight, XCircle } from "@phosphor-icons/react";
import { useT } from "../context";

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

export default function SharedLinkPage({ sharedLink, onAccept, onDismiss }) {
  var t = useT().shared;
  var isValid = sharedLink && sharedLink.status === "valid";

  return (
    <div style={{
      fontFamily: "'DM Sans',Inter,system-ui,sans-serif",
      background: "var(--bg-page)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-primary)",
      padding: "var(--sp-4)",
    }}>
      <div style={{
        width: 460,
        maxWidth: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: isValid ? "var(--brand)" : "var(--color-error)",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <ForecrestLogo light />
          <span style={{
            fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)",
            background: "rgba(255,255,255,0.15)",
            padding: "4px 12px", borderRadius: "var(--r-xl)",
          }}>
            {isValid ? t.valid_title : t.error_title}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "28px" }}>
          {isValid ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-3)", marginBottom: "var(--sp-5)" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--r-lg)", flexShrink: 0,
                  background: "var(--brand-bg)", border: "1px solid var(--brand)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CheckCircle size={20} weight="duotone" color="var(--brand)" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif" }}>
                    {t.valid_title}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    {t.valid_desc}
                  </p>
                </div>
              </div>

              <div style={{
                padding: "var(--sp-3) var(--sp-4)",
                background: "var(--color-warning-bg)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--color-warning-border)",
                fontSize: 12,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                marginBottom: "var(--sp-5)",
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--sp-2)",
              }}>
                <Warning size={16} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{t.valid_warning}</span>
              </div>

              <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                <button
                  onClick={onAccept}
                  style={{
                    flex: 1, padding: "10px 16px", fontSize: 14, fontWeight: 600,
                    color: "var(--color-on-brand)", background: "var(--brand)",
                    border: "none", borderRadius: "var(--r-md)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--sp-2)",
                  }}
                >
                  {t.valid_accept} <ArrowRight size={14} weight="bold" />
                </button>
                <button
                  onClick={onDismiss}
                  style={{
                    flex: 1, padding: "10px 16px", fontSize: 14, fontWeight: 600,
                    color: "var(--text-secondary)", background: "transparent",
                    border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                    cursor: "pointer",
                  }}
                >
                  {t.valid_decline}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", padding: "var(--sp-4) 0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", margin: "0 auto var(--sp-4)",
                  background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <XCircle size={32} weight="duotone" color="var(--color-error)" />
                </div>

                <h2 style={{
                  fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 var(--sp-2)",
                  fontFamily: "'Bricolage Grotesque','DM Sans',sans-serif",
                }}>
                  {t.error_title}
                </h2>

                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 var(--sp-6)", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                  {t.error_desc}
                </p>

                <button
                  onClick={onDismiss}
                  style={{
                    padding: "10px 32px", fontSize: 14, fontWeight: 600,
                    color: "var(--color-on-brand)", background: "var(--brand)",
                    border: "none", borderRadius: "var(--r-md)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
                  }}
                >
                  {t.error_continue} <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer branding */}
      <div style={{ marginTop: "var(--sp-4)", fontSize: 11, color: "var(--text-faint)" }}>
        Forecrest
      </div>
    </div>
  );
}
