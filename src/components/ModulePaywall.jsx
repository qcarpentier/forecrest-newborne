import { Lock, Check, ArrowRight } from "@phosphor-icons/react";
import { Button } from "../components";
import { useLang } from "../context";

export default function ModulePaywall({ preview, icon, title, subtitle, features, onUnlock, price, ctaLabel, ctaDisabled }) {
  var { lang } = useLang();
  var isFr = lang !== "en";
  var Icon = icon;

  return (
    <div style={{ position: "relative", minHeight: "60vh" }}>
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
        pointerEvents: "none",
      }}>
        <div style={{ opacity: 0.15, filter: "saturate(0.3)" }}>
          {preview}
        </div>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, var(--bg-page) 0%, transparent 20%, transparent 40%, var(--bg-page) 75%)",
        }} />
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", justifyContent: "center",
        paddingTop: "var(--sp-4)",
      }}>
        <div style={{
          width: 480, maxWidth: "100%",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          background: "var(--bg-card)",
          boxShadow: "0 16px 48px -12px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "var(--sp-6) var(--sp-6) var(--sp-4)", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "var(--r-lg)",
              background: "var(--brand-bg)",
              border: "1px solid var(--brand-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--sp-3)",
            }}>
              <Icon size={26} weight="duotone" color="var(--brand)" />
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: "var(--r-full)",
              background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
              fontSize: 10, fontWeight: 600, color: "var(--brand)",
              textTransform: "uppercase", letterSpacing: "0.04em",
              marginBottom: "var(--sp-3)",
            }}>
              <Lock size={9} weight="bold" />
              {isFr ? "Module premium" : "Premium module"}
            </div>
            <h2 style={{
              fontSize: 20, fontWeight: 800, margin: "0 0 var(--sp-2)",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
              color: "var(--text-primary)", letterSpacing: "-0.4px",
            }}>
              {title}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {subtitle}
            </p>
          </div>

          <div style={{ padding: "0 var(--sp-5) var(--sp-4)" }}>
            <div style={{
              display: "flex", flexDirection: "column", gap: 6,
              padding: "var(--sp-3) var(--sp-4)",
              borderRadius: "var(--r-md)",
              background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
            }}>
              {(features || []).map(function (feat, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Check size={13} weight="bold" color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{feat}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            padding: "var(--sp-3) var(--sp-5) var(--sp-5)",
            display: "flex", flexDirection: "column", gap: "var(--sp-2)",
            alignItems: "center",
          }}>
            <Button
              color="primary"
              size="lg"
              onClick={onUnlock}
              isDisabled={ctaDisabled}
              iconTrailing={ctaDisabled ? null : <ArrowRight size={14} weight="bold" />}
              sx={{ width: "100%", justifyContent: "center", height: 44 }}
            >
              {ctaLabel || (isFr ? "Debloquer le module" : "Unlock module")}
            </Button>
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {price || (isFr ? "Bientot disponible" : "Coming soon")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
