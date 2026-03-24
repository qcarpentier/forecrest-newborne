import { useState } from "react";

var idCounter = 0;

export default function NumberField({ value, onChange, min, max, step, width, suf, stepper, pct, label, hint, isInvalid, id }) {
  var [focused, setFocused] = useState(false);
  var [raw, setRaw] = useState(null);
  var [autoId] = useState(function () { return id || ("nf-" + (++idCounter)); });
  var mul = pct ? 100 : 1;
  var v = typeof value === "number" ? value : (Number(value) || 0);
  var dvNum = pct ? parseFloat((v * 100).toFixed(10)) : v;
  var dv = (dvNum !== 0 && Math.abs(dvNum) < 0.0001)
    ? dvNum.toFixed(14).replace(/0+$/, "").replace(/\.$/, "")
    : dvNum;
  var dMin = min != null ? parseFloat((min * mul).toFixed(10)) : undefined;
  var dMax = max != null ? parseFloat((max * mul).toFixed(10)) : undefined;
  var s = parseFloat(((step || 1) * mul).toFixed(10));
  var suffix = suf != null ? suf : (pct ? "%" : null);

  var borderColor = isInvalid
    ? "var(--color-error-border)"
    : (focused ? "var(--brand)" : "var(--border-strong)");
  var focusRing = isInvalid
    ? "0 0 0 3px var(--color-error-bg)"
    : "var(--focus-ring)";

  function clamp(v) {
    var n = Number(v);
    if (isNaN(n)) return dvNum;
    if (dMin != null && n < dMin) n = dMin;
    if (dMax != null && n > dMax) n = dMax;
    return n;
  }

  function commit(displayVal) {
    var clamped = clamp(displayVal);
    onChange(pct ? parseFloat((clamped / 100).toFixed(10)) : clamped);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowUp") { e.preventDefault(); commit(dvNum + s); }
    if (e.key === "ArrowDown") { e.preventDefault(); commit(dvNum - s); }
  }

  var inputStyle = {
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    height: 36,
    background: "transparent",
    color: "var(--text-primary)",
    MozAppearance: "textfield",
  };

  var stepBtnStyle = {
    height: 36,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 15,
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.12s",
    lineHeight: 1,
    padding: 0,
  };

  var hasWrapper = label || hint;

  var inputGroup = (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", width: width || "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid " + borderColor,
          borderRadius: "var(--r-md)",
          background: "var(--input-bg)",
          overflow: "hidden",
          flex: 1,
          minWidth: 0,
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: focused ? focusRing : "none",
        }}
      >
        {stepper ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={function () { commit(dvNum - s); }}
            style={{ ...stepBtnStyle, width: 28, borderRight: "1px solid var(--border)" }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
          >
            {"\u2212"}
          </button>
        ) : null}
        <input
          id={autoId}
          type="text"
          inputMode="decimal"
          aria-invalid={isInvalid || undefined}
          value={focused && raw !== null ? raw : dv}
          onChange={function (e) { setRaw(e.target.value); }}
          onFocus={function (e) { setFocused(true); setRaw(String(dv)); e.target.select(); }}
          onBlur={function () { setFocused(false); commit(raw !== null ? raw : dv); setRaw(null); }}
          onKeyDown={onKeyDown}
          style={{
            ...inputStyle,
            flex: 1,
            minWidth: 0,
            width: stepper ? undefined : (width ? "100%" : 72),
            padding: stepper ? "0 var(--sp-1)" : "0 var(--sp-3)",
            textAlign: stepper ? "center" : "right",
          }}
        />
        {stepper ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={function () { commit(dvNum + s); }}
            style={{ ...stepBtnStyle, width: 28, borderLeft: "1px solid var(--border)" }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
          >
            {"+"}
          </button>
        ) : null}
      </div>
      {suffix ? (
        <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>{String(suffix)}</span>
      ) : null}
    </div>
  );

  if (!hasWrapper) return inputGroup;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
      {label ? (
        <label
          htmlFor={autoId}
          style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      ) : null}
      {inputGroup}
      {hint ? (
        <span style={{ fontSize: 12, color: isInvalid ? "var(--color-error)" : "var(--text-faint)" }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
