import { useState, useEffect } from "react";
import { Card, PageLayout } from "../components";

var COLOR_GROUPS = [
  {
    label: "Brand",
    tokens: ["--brand", "--brand-bg", "--brand-border", "--brand-hover", "--brand-gradient-end", "--color-on-brand"],
  },
  {
    label: "Backgrounds",
    tokens: ["--bg-page", "--bg-card", "--bg-hover", "--bg-accordion"],
  },
  {
    label: "Borders",
    tokens: ["--border-light", "--border", "--border-strong"],
  },
  {
    label: "Text",
    tokens: ["--text-primary", "--text-secondary", "--text-tertiary", "--text-muted", "--text-faint", "--text-ghost"],
  },
  {
    label: "Semantic — Success",
    tokens: ["--color-success", "--color-success-bg", "--color-success-border"],
  },
  {
    label: "Semantic — Warning",
    tokens: ["--color-warning", "--color-warning-bg", "--color-warning-border"],
  },
  {
    label: "Semantic — Error",
    tokens: ["--color-error", "--color-error-bg", "--color-error-border"],
  },
  {
    label: "Semantic — Info",
    tokens: ["--color-info", "--color-info-bg", "--color-info-border"],
  },
  {
    label: "Inputs & Misc",
    tokens: ["--shadow", "--input-bg", "--focus-ring", "--tooltip-bg", "--tooltip-text", "--color-sun"],
  },
  {
    label: "Overlays & Shadows",
    tokens: ["--overlay-bg", "--shadow-dropdown", "--shadow-modal", "--overlay-glass", "--overlay-glass-subtle"],
  },
  {
    label: "Developer",
    tokens: ["--color-dev", "--color-dev-bg", "--color-dev-border", "--color-dev-banner-dark", "--color-dev-banner-light"],
  },
  {
    label: "Spacing",
    tokens: ["--sp-1", "--sp-2", "--sp-3", "--sp-4", "--sp-5", "--sp-6", "--sp-8"],
  },
  {
    label: "Gap",
    tokens: ["--gap-sm", "--gap-md", "--gap-lg", "--gap-xl"],
  },
  {
    label: "Radius",
    tokens: ["--r-sm", "--r-md", "--r-lg", "--r-xl", "--r-full"],
  },
  {
    label: "Layout",
    tokens: ["--page-max", "--page-px", "--page-py", "--header-py", "--card-px", "--card-py", "--font-scale"],
  },
];

function resolveVar(token) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  } catch (e) {
    return "";
  }
}

function isColor(val) {
  return val && (val.startsWith("#") || val.startsWith("rgb") || val.startsWith("hsl") || val.startsWith("var("));
}

function ColorSwatch({ value }) {
  if (!isColor(value)) return null;
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: value,
      border: "1px solid var(--border)",
      flexShrink: 0,
    }} />
  );
}

function TokenRow({ token, value }) {
  var [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText("var(" + token + ")");
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 1200);
  }

  return (
    <div
      onClick={handleCopy}
      style={{
        display: "grid", gridTemplateColumns: "32px 200px 1fr 80px",
        gap: "var(--sp-2)", alignItems: "center",
        padding: "var(--sp-2) var(--sp-3)",
        borderBottom: "1px solid var(--border-light)",
        cursor: "pointer", transition: "background 0.1s",
      }}
      onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
    >
      <ColorSwatch value={value} />
      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
        {token}
      </span>
      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, color: "var(--text-faint)" }}>
        {value || "—"}
      </span>
      <span style={{ fontSize: 10, color: copied ? "var(--brand)" : "var(--text-ghost)", textAlign: "right" }}>
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </div>
  );
}

export default function DesignTokensPage() {
  var [resolved, setResolved] = useState({});
  var [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "light");

  useEffect(function () {
    var map = {};
    COLOR_GROUPS.forEach(function (group) {
      group.tokens.forEach(function (token) {
        map[token] = resolveVar(token);
      });
    });
    setResolved(map);
  }, [theme]);

  // Listen for theme changes
  useEffect(function () {
    var observer = new MutationObserver(function () {
      setTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return function () { observer.disconnect(); };
  }, []);

  var totalTokens = 0;
  COLOR_GROUPS.forEach(function (g) { totalTokens += g.tokens.length; });

  return (
    <PageLayout
      title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}>Design Tokens <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dev)", background: "var(--color-dev-bg)", border: "1px solid var(--color-dev-border)", padding: "2px 8px", borderRadius: "var(--r-full)", letterSpacing: "0.06em", textTransform: "uppercase" }}>DEV</span></span>}
      subtitle={totalTokens + " CSS custom properties (" + theme + " theme)"}
    >
      {/* Theme indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--sp-3)",
        padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--gap-lg)",
        background: "var(--bg-accordion)", borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: theme === "dark" ? "#F7F4EE" : "#0E0E0D",
          border: "2px solid var(--border)",
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {theme === "dark" ? "Dark" : "Light"} theme active
        </span>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
          Toggle theme to see dark mode values
        </span>
      </div>

      {/* Token groups */}
      {COLOR_GROUPS.map(function (group) {
        return (
          <div key={group.label} style={{ marginBottom: "var(--gap-lg)" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1.2, color: "var(--text-ghost)",
              marginBottom: "var(--sp-2)",
            }}>
              {group.label}
            </div>
            <Card sx={{ padding: 0, overflow: "hidden" }}>
              {group.tokens.map(function (token) {
                return <TokenRow key={token} token={token} value={resolved[token]} />;
              })}
            </Card>
          </div>
        );
      })}
    </PageLayout>
  );
}
