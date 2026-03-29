import { LockSimple } from "@phosphor-icons/react";
import { Tooltip } from "../components";

/**
 * Small lock icon with tooltip showing who's editing.
 * Usage: <LockIndicator name="Thomas" />
 */
export default function LockIndicator({ name }) {
  if (!name) return null;

  return (
    <Tooltip tip={name} placement="top" width={180}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: "var(--r-sm)",
        background: "var(--color-warning-bg, rgba(202,138,4,0.08))",
        border: "1px solid var(--color-warning-border, rgba(202,138,4,0.2))",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--color-warning)",
        whiteSpace: "nowrap",
        cursor: "default",
      }}>
        <LockSimple size={11} weight="fill" />
        {name}
      </div>
    </Tooltip>
  );
}
