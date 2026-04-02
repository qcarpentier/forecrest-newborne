import { useState } from "react";
import { SearchLg, XClose } from "@untitledui/icons";

export default function SearchField({ value, onChange, placeholder, width, height }) {
  var [focused, setFocused] = useState(false);
  var w = width || 220;
  var h = height || 40;
  var currentValue = value || "";
  var hasValue = currentValue.length > 0;
  var fullWidth = w === "100%";

  return (
    <div style={{ position: "relative", display: fullWidth ? "flex" : "inline-flex", alignItems: "center", width: fullWidth ? "100%" : undefined }}>
      <SearchLg style={{
        position: "absolute", left: 14, pointerEvents: "none",
        width: 16, height: 16, color: focused ? "var(--brand)" : "var(--text-muted)",
      }} />
      <input
        type="text"
        value={currentValue}
        onChange={function (e) { onChange(e.target.value); }}
        placeholder={placeholder || ""}
        style={{
          height: h, width: fullWidth ? "100%" : w,
          paddingLeft: 40, paddingRight: hasValue ? 36 : "var(--sp-4)",
          border: "1px solid " + (focused ? "var(--input-border-focus)" : "var(--input-border)"),
          borderRadius: "var(--r-md)",
          background: "var(--input-bg)",
          color: "var(--text-primary)",
          fontSize: 13, fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.12s, box-shadow 0.12s, background 0.12s",
          boxShadow: focused ? "var(--focus-ring)" : "none",
        }}
        onFocus={function () { setFocused(true); }}
        onBlur={function () { setFocused(false); }}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={function () { onChange(""); }}
          aria-label="Clear"
          style={{
            position: "absolute", right: 8,
            width: 22, height: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", borderRadius: "var(--r-full)",
            background: "var(--bg-accordion)",
            color: "var(--text-muted)",
            cursor: "pointer", padding: 0,
            lineHeight: 1,
          }}
        >
          <XClose style={{ width: 14, height: 14 }} />
        </button>
      ) : null}
    </div>
  );
}
