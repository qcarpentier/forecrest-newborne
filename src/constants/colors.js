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

// Asset category chart colors (hex for SVG compatibility)
export const ASSET_CHART_COLORS = {
  it: "#3B82F6", furniture: "#F59E0B", vehicle: "#6B7280",
  building: "#E8431A", ip: "#60A5FA", other: "#D1D5DB",
};

/**
 * Unified chart palette system.
 * Two modes:
 * - "brand": monochrome gradient generated from active accent color
 * - "multi": distinct WCAG AA colors for maximum readability
 *
 * Brand palette is generated dynamically so it adapts when the user
 * changes accent color in Settings > Appearance.
 */

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(function (c) { var h = clamp(c).toString(16); return h.length < 2 ? "0" + h : h; }).join("");
}

/**
 * Mix a color with white (t>0) or black (t<0).
 * t = 0 → original, t = 1 → white, t = -1 → black
 */
function shade(rgb, t) {
  var target = t > 0 ? [255, 255, 255] : [0, 0, 0];
  var f = Math.abs(t);
  return [
    clamp(rgb[0] + (target[0] - rgb[0]) * f),
    clamp(rgb[1] + (target[1] - rgb[1]) * f),
    clamp(rgb[2] + (target[2] - rgb[2]) * f),
  ];
}

/**
 * Generate an 8-step brand palette from an RGB base color.
 * Steps go from very light → brand → very dark.
 */
export function generateBrandPalette(rgb) {
  if (!rgb || rgb.length < 3) rgb = [232, 67, 26]; // fallback coral
  return [
    rgbToHex.apply(null, shade(rgb, 0.80)),  // 0 — very light
    rgbToHex.apply(null, shade(rgb, 0.55)),  // 1
    rgbToHex.apply(null, shade(rgb, 0.30)),  // 2
    rgbToHex.apply(null, shade(rgb, 0)),     // 3 — brand (anchor)
    rgbToHex.apply(null, shade(rgb, -0.18)), // 4
    rgbToHex.apply(null, shade(rgb, -0.38)), // 5
    rgbToHex.apply(null, shade(rgb, -0.56)), // 6
    rgbToHex.apply(null, shade(rgb, -0.72)), // 7 — very dark
  ];
}

export var CHART_MULTI = [
  "#E8431A", // 0 — Coral (brand slot, replaced at runtime)
  "#2563EB", // 1 — Blue
  "#0D9488", // 2 — Teal
  "#D97706", // 3 — Amber
  "#7C3AED", // 4 — Purple
  "#DB2777", // 5 — Pink
  "#059669", // 6 — Emerald
  "#4B5563", // 7 — Gray
];

/**
 * Get the full chart palette array for the current settings.
 * @param {string} mode      — "brand" | "multi"
 * @param {Array}  accentRgb — [r, g, b] from active accent color
 * @param {string} accentHex — hex from active accent (for multi slot 0)
 * @returns {string[]} array of hex colors
 */
export function getChartPalette(mode, accentRgb, accentHex) {
  if (mode === "multi") {
    var m = CHART_MULTI.slice();
    if (accentHex) m[0] = accentHex;
    return m;
  }
  return generateBrandPalette(accentRgb);
}

/**
 * Get chart color by index from the active palette.
 * @param {string[]} palette — result of getChartPalette()
 * @param {number}   index   — slot index (wraps around)
 * @returns {string} hex color
 */
export function chartColor(palette, index) {
  return palette[index % palette.length];
}

/* Page header icon tint colors — grouped by concept */
export const PAGE_ICON_COLORS = {
  // Mon activité
  streams: "#22C55E",       // green — revenue
  opex: "#EF4444",          // red — costs
  salaries: "#8B5CF6",      // violet — team
  equipment: "#F59E0B",     // amber — assets
  stocks: "#F59E0B",        // amber — assets
  // Mon argent
  cashflow: "#3B82F6",      // blue — treasury
  debt: "#3B82F6",          // blue — financing
  crowdfunding: "#3B82F6",  // blue — financing
  // Mes documents
  income_statement: "#6B7280", // gray — documents
  balance_sheet: "#6B7280",    // gray — documents
  accounting: "#6B7280",       // gray — documents
  // Mon analyse
  ratios: "#06B6D4",        // cyan — analysis
  sensitivity: "#06B6D4",   // cyan — analysis
  // Ma société
  equity: "#E8431A",        // brand — company
  captable: "#E8431A",      // brand — company
  pact: "#E8431A",          // brand — company
};

export const BADGE_COLORS = {
  gray:    { bg: "var(--bg-accordion)", text: "var(--text-tertiary)", border: "var(--border-strong)" },
  brand:   { bg: "var(--brand-bg)",     text: "var(--brand)",         border: "var(--brand-border)" },
  error:   { bg: "var(--color-error-bg)",   text: "var(--color-error)",   border: "var(--color-error-border)" },
  warning: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--color-warning-border)" },
  success: { bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
  info:    { bg: "var(--color-info-bg)",    text: "var(--color-info)",    border: "var(--color-info-border)" },
};
