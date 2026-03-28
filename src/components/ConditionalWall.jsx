import { ArrowRight, Info } from "@phosphor-icons/react";
import { Button } from "../components";
import { useLang } from "../context";

/**
 * ConditionalWall — shown when a page requires data from another page.
 * Same visual as ModulePaywall but without "premium" badge and with a navigation CTA.
 *
 * Props:
 * - preview: ReactNode — fake content shown behind the blur
 * - icon: Phosphor icon component
 * - title: string — main message
 * - subtitle: string — explanation
 * - hints: string[] — list of things the user needs to do
 * - ctaLabel: string — button text
 * - onAction: function — called when CTA is clicked (navigate to required page)
 * - secondaryLabel: string — optional secondary action label
 * - onSecondary: function — optional secondary action
 */
export default function ConditionalWall({ preview, icon, title, subtitle, hints, ctaLabel, onAction, secondaryLabel, onSecondary }) {
  var { lang } = useLang();
  var isFr = lang !== "en";
  var Icon = icon;

  return (
    <div style={{ position: "relative", minHeight: "60vh" }}>
      {/* Blurred fake preview behind */}
      {preview ? (
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden",
          pointerEvents: "none",
        }}>
          <div style={{ opacity: 0.12, filter: "saturate(0.2) blur(1px)" }}>
            {preview}
          </div>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, var(--bg-page) 0%, transparent 15%, transparent 35%, var(--bg-page) 70%)",
          }} />
        </div>
      ) : null}

      {/* Centered card */}
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
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: "var(--r-lg)",
              background: "var(--bg-accordion)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--sp-3)",
            }}>
              <Icon size={26} weight="duotone" color="var(--text-muted)" />
            </div>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: "var(--r-full)",
              background: "var(--color-info-bg)", border: "1px solid var(--color-info-border, var(--border-light))",
              fontSize: 10, fontWeight: 600, color: "var(--color-info)",
              textTransform: "uppercase", letterSpacing: "0.04em",
              marginBottom: "var(--sp-3)",
            }}>
              <Info size={9} weight="bold" />
              {isFr ? "Action requise" : "Action required"}
            </div>
            {/* Title */}
            <h2 style={{
              fontSize: 20, fontWeight: 800, margin: "0 0 var(--sp-2)",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
              color: "var(--text-primary)", letterSpacing: "-0.4px",
            }}>
              {title}
            </h2>
            {/* Subtitle */}
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              {subtitle}
            </p>
          </div>

          {/* Hints */}
          {hints && hints.length > 0 ? (
            <div style={{ padding: "0 var(--sp-5) var(--sp-4)" }}>
              <div style={{
                display: "flex", flexDirection: "column", gap: 6,
                padding: "var(--sp-3) var(--sp-4)",
                borderRadius: "var(--r-md)",
                background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
              }}>
                {hints.map(function (hint, i) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{hint}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* CTA */}
          <div style={{
            padding: "var(--sp-3) var(--sp-5) var(--sp-5)",
            display: "flex", flexDirection: "column", gap: "var(--sp-2)",
            alignItems: "center",
          }}>
            <Button
              color="primary"
              size="lg"
              onClick={onAction}
              iconTrailing={<ArrowRight size={14} weight="bold" />}
              sx={{ width: "100%", justifyContent: "center", height: 44 }}
            >
              {ctaLabel}
            </Button>
            {secondaryLabel && onSecondary ? (
              <button type="button" onClick={onSecondary} style={{
                border: "none", background: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: "var(--text-muted)",
                fontFamily: "inherit", padding: "var(--sp-1) 0",
              }}>
                {secondaryLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
