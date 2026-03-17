const TIER_VARS = {
  S: ["var(--tier-s-bg)", "var(--tier-s-text)", "var(--tier-s-border)"],
  A: ["var(--tier-a-bg)", "var(--tier-a-text)", "var(--tier-a-border)"],
  B: ["var(--tier-b-bg)", "var(--tier-b-text)", "var(--tier-b-border)"],
  C: ["var(--tier-c-bg)", "var(--tier-c-text)", "var(--tier-c-border)"],
  D: ["var(--bg-accordion)", "var(--text-tertiary)", "var(--border-strong)"],
};

export default function Badge({ t }) {
  var c = TIER_VARS[t] || TIER_VARS.D;
  return (
    <span
      style={{
        padding: "3px var(--sp-2)",
        borderRadius: "var(--r-xl)",
        fontSize: 12,
        fontWeight: 600,
        background: c[0],
        color: c[1],
        border: "1px solid " + c[2],
        whiteSpace: "nowrap",
      }}
    >
      {"Tier " + String(t)}
    </span>
  );
}
