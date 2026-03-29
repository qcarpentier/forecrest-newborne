import { hashColor } from "../context/PresenceContext";

function getInitials(name) {
  if (!name) return "?";
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

export default function Avatar({ name, size, color, online, showStatus, userId, active, sx }) {
  var s = size || 32;
  var bg = color || (userId ? hashColor(userId) : "var(--brand)");
  var initials = getInitials(name);
  var dotSize = Math.max(8, Math.round(s * 0.3));

  return (
    <div style={Object.assign({
      position: "relative",
      width: s,
      height: s,
      flexShrink: 0,
    }, sx || {})}>
      {/* Circle with initials */}
      <div style={{
        width: s,
        height: s,
        borderRadius: "var(--r-full)",
        background: bg,
        boxShadow: active ? "0 0 0 2px var(--bg-card), 0 0 0 4px var(--brand)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(s * 0.38),
        fontWeight: 700,
        color: "var(--text-on-brand, #fff)",
        fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
        lineHeight: 1,
        letterSpacing: "-0.01em",
        userSelect: "none",
      }}>
        {initials}
      </div>

      {/* Online dot */}
      {showStatus !== false && typeof online === "boolean" ? (
        <div style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: online ? "var(--color-success)" : "var(--text-ghost)",
          border: "2px solid var(--bg-card)",
          boxSizing: "border-box",
        }} />
      ) : null}
    </div>
  );
}
