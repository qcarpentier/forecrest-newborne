export const brand = "var(--brand)";

export const gg = {
  900: "var(--text-primary)",
  700: "var(--text-secondary)",
  600: "var(--text-tertiary)",
  500: "var(--text-muted)",
  400: "var(--text-faint)",
  300: "var(--border-strong)",
  200: "var(--border)",
  100: "var(--border-light)",
  50:  "var(--bg-accordion)",
};

// Semantic status tokens
export const ok   = "var(--color-success)";
export const warn = "var(--color-warning)";
export const err  = "var(--color-error)";

// Shared variant maps (used by Badge, Banner, ExplainerBox, Button)
export const ALERT_VARIANTS = {
  info:    { bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    accent: "var(--color-info)" },
  success: { bg: "var(--color-success-bg)", border: "var(--color-success-border)", accent: "var(--color-success)" },
  warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", accent: "var(--color-warning)" },
  error:   { bg: "var(--color-error-bg)",   border: "var(--color-error-border)",   accent: "var(--color-error)" },
  brand:   { bg: "var(--brand-bg)",         border: "var(--brand-border)",         accent: "var(--brand)" },
};

export const BADGE_COLORS = {
  gray:    { bg: "var(--bg-accordion)", text: "var(--text-tertiary)", border: "var(--border-strong)" },
  brand:   { bg: "var(--brand-bg)",     text: "var(--brand)",         border: "var(--brand-border)" },
  error:   { bg: "var(--color-error-bg)",   text: "var(--color-error)",   border: "var(--color-error-border)" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
  info:    { bg: "var(--color-info-bg)",    text: "var(--color-info)",    border: "var(--color-info-border)" },
};
