import { InfoTip } from "./Tooltip";

export default function Row({ label, value, last, bold, color, tip }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--sp-2) 0",
        borderBottom: last ? "none" : "1px solid var(--border-light)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: bold ? 600 : 400, display: "flex", alignItems: "center" }}>
        {label}{tip ? <InfoTip tip={tip} /> : null}
      </span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
