var SIZE_MAP = {
  sm: { height: "var(--control-height-sm)", padding: "0 12px", fontSize: 12, gap: 6 },
  md: { height: "var(--control-height-md)", padding: "0 14px", fontSize: 13, gap: 8 },
  lg: { height: "var(--control-height-lg)", padding: "0 16px", fontSize: 14, gap: 8 },
};

function isSelected(mode, value, itemId) {
  if (mode === "radio") return value === itemId;
  if (mode === "checkbox") return Array.isArray(value) && value.indexOf(itemId) >= 0;
  return false;
}

export default function ButtonGroup({
  items,
  mode,
  value,
  onChange,
  size,
  shape,
  stretch,
  disabled,
}) {
  var resolvedMode = mode || "default";
  var resolvedSize = SIZE_MAP[size] || SIZE_MAP.md;
  var radius = shape === "pill" ? "var(--r-full, 999px)" : "var(--r-md)";

  function handleSelect(item) {
    if (disabled || item.disabled) return;

    if (resolvedMode === "radio") {
      if (onChange) onChange(item.id);
      return;
    }

    if (resolvedMode === "checkbox") {
      var current = Array.isArray(value) ? value.slice() : [];
      var next = current.indexOf(item.id) >= 0
        ? current.filter(function (entry) { return entry !== item.id; })
        : current.concat(item.id);
      if (onChange) onChange(next);
      return;
    }

    if (onChange) onChange(item.id);
    if (item.onClick) item.onClick(item.id);
  }

  return (
    <div
      role={resolvedMode === "radio" ? "radiogroup" : undefined}
      style={{
        display: stretch ? "flex" : "inline-flex",
        width: stretch ? "100%" : "auto",
        alignItems: "stretch",
        gap: 4,
        padding: 4,
        borderRadius: radius,
        border: "1px solid var(--border-light)",
        background: "var(--bg-accordion)",
      }}
    >
      {items.map(function (item, index) {
        var selected = isSelected(resolvedMode, value, item.id);
        var itemDisabled = disabled || item.disabled;

        return (
          <button
            key={item.id}
            type="button"
            role={resolvedMode === "radio" ? "radio" : undefined}
            aria-checked={resolvedMode === "radio" ? selected : undefined}
            aria-pressed={resolvedMode === "checkbox" ? selected : undefined}
            disabled={itemDisabled}
            onClick={function () { handleSelect(item); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: resolvedSize.gap,
              flex: stretch ? 1 : "0 0 auto",
              height: resolvedSize.height,
              padding: resolvedSize.padding,
              border: "1px solid " + (selected ? "var(--brand-border)" : "transparent"),
              borderRadius: radius,
              background: selected ? "var(--bg-card)" : "transparent",
              color: selected ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: resolvedSize.fontSize,
              fontWeight: selected ? 600 : 500,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              cursor: itemDisabled ? "not-allowed" : "pointer",
              opacity: itemDisabled ? 0.45 : 1,
              transition: "background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s, box-shadow 0.15s",
              position: "relative",
              zIndex: selected ? 1 : 0,
              boxShadow: selected ? "var(--shadow-xs)" : "none",
            }}
          >
            {item.icon ? <span style={{ display: "inline-flex", flexShrink: 0 }}>{item.icon}</span> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
