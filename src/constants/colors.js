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

// Accent color palette — used by ProfilePage color picker
// Each entry defines CSS var overrides for both light and dark themes
export const ACCENT_PALETTE = [
  { id: "coral",   label: "Coral",   hex: "#E8431A", rgb: [232,67,26],   hover: "#D03A14", hoverDark: "#FF6B42", gradient: "#9B2D18" },
  { id: "rose",    label: "Rose",    hex: "#E11D48", rgb: [225,29,72],   hover: "#BE123C", hoverDark: "#FB7185", gradient: "#9F1239" },
  { id: "violet",  label: "Violet",  hex: "#7C3AED", rgb: [124,58,237],  hover: "#6D28D9", hoverDark: "#A78BFA", gradient: "#4C1D95" },
  { id: "blue",    label: "Blue",    hex: "#2563EB", rgb: [37,99,235],   hover: "#1D4ED8", hoverDark: "#60A5FA", gradient: "#1E3A8A" },
  { id: "teal",    label: "Teal",    hex: "#0D9488", rgb: [13,148,136],  hover: "#0F766E", hoverDark: "#2DD4BF", gradient: "#134E4A" },
  { id: "green",   label: "Green",   hex: "#16A34A", rgb: [22,163,74],   hover: "#15803D", hoverDark: "#4ADE80", gradient: "#14532D" },
  { id: "amber",   label: "Amber",   hex: "#D97706", rgb: [217,119,6],   hover: "#B45309", hoverDark: "#FBBF24", gradient: "#78350F" },
  { id: "slate",   label: "Slate",   hex: "#475569", rgb: [71,85,105],   hover: "#334155", hoverDark: "#94A3B8", gradient: "#1E293B" },
];

export const BADGE_COLORS = {
  gray:    { bg: "var(--bg-accordion)", text: "var(--text-tertiary)", border: "var(--border-strong)" },
  brand:   { bg: "var(--brand-bg)",     text: "var(--brand)",         border: "var(--brand-border)" },
  error:   { bg: "var(--color-error-bg)",   text: "var(--color-error)",   border: "var(--color-error-border)" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
  info:    { bg: "var(--color-info-bg)",    text: "var(--color-info)",    border: "var(--color-info-border)" },
};
