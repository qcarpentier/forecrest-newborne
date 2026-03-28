import { MagnifyingGlass } from "@phosphor-icons/react";

export default function SearchInput({ value, onChange, placeholder, width, height }) {
  var w = width || 200;
  var h = height || 40;
  var hasValue = value.length > 0;

  return (
    <div style={{ position: "relative", display: w === "100%" ? "flex" : "inline-flex", alignItems: "center", width: w === "100%" ? "100%" : undefined }}>
      <MagnifyingGlass size={16} weight="bold" style={{
        position: "absolute", left: 12, pointerEvents: "none",
        color: "var(--text-muted)",
      }} />
      <input
        type="text"
        value={value}
        onChange={function (e) { onChange(e.target.value); }}
        placeholder={placeholder || ""}
        style={{
          height: h, width: w,
          paddingLeft: 34, paddingRight: hasValue ? 32 : "var(--sp-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          fontSize: 13, fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.12s",
        }}
        onFocus={function (e) { e.currentTarget.style.borderColor = "var(--brand)"; }}
        onBlur={function (e) { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={function () { onChange(""); }}
          aria-label="Clear"
          style={{
            position: "absolute", right: 8,
            width: 20, height: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", borderRadius: "var(--r-full)",
            background: "var(--bg-hover)",
            color: "var(--text-muted)",
            cursor: "pointer", padding: 0,
            fontSize: 12, lineHeight: 1,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
