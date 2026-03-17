import { useT } from "../context";
import logoUrl from "../assets/forecrest-lockup-light.svg";

export default function SharedLinkPage({ sharedLink, onAccept, onDismiss }) {
  var t = useT().shared;
  var isValid = sharedLink && sharedLink.status === "valid";

  return (
    <div style={{
      fontFamily: "'DM Sans',system-ui,sans-serif",
      background: "var(--bg-page)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-primary)",
    }}>
      <div style={{
        width: 440,
        maxWidth: "92vw",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-modal)",
        overflow: "hidden",
      }}>
        {/* Header band */}
        <div style={{
          background: isValid ? "var(--brand)" : "var(--color-error)",
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <img src={logoUrl} alt="Logo" style={{ height: 28, filter: "brightness(10)" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-on-brand)" }}>
            {isValid ? t.valid_title : t.error_title}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {isValid ? (
            <>
              {/* Valid link content */}
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
                {t.valid_desc}
              </p>

              <div style={{
                padding: "12px 14px",
                background: "var(--color-warning-bg)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--color-warning)",
                fontSize: 12,
                color: "var(--color-warning)",
                lineHeight: 1.5,
                marginBottom: 24,
              }}>
                {t.valid_warning}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onAccept}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-on-brand)",
                    background: "var(--brand)",
                    border: "none",
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                  }}
                >
                  {t.valid_accept}
                </button>
                <button
                  onClick={onDismiss}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                  }}
                >
                  {t.valid_decline}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Error link content */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--color-error-bg)",
                margin: "0 auto 16px",
                fontSize: 28,
              }}>
                !
              </div>

              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 24px", textAlign: "center" }}>
                {t.error_desc}
              </p>

              <button
                onClick={onDismiss}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-on-brand)",
                  background: "var(--brand)",
                  border: "none",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                }}
              >
                {t.error_continue}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
