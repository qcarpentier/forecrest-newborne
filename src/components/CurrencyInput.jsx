import { NumericFormat } from "react-number-format";

export default function CurrencyInput({ value, onChange, suffix, prefix, min, max, width, height, placeholder, decimals }) {
  var dec = decimals != null ? decimals : 2;

  var safeMax = max != null ? max : 1000000000;

  function handleChange(values) {
    var v = values.floatValue != null ? values.floatValue : 0;
    if (min != null && v < min) v = min;
    if (v > safeMax) v = safeMax;
    if (onChange) onChange(v);
  }

  return (
    <NumericFormat
      value={value}
      onValueChange={handleChange}
      isAllowed={function (values) { return !values.floatValue || values.floatValue <= safeMax; }}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={dec}
      allowNegative={false}
      suffix={suffix ? " " + suffix : ""}
      prefix={prefix || ""}
      placeholder={placeholder || "0"}
      style={{
        width: width || "100px",
        height: height || 40,
        padding: "0 var(--sp-3)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--input-bg)",
        color: "var(--text-primary)",
        fontSize: 14,
        fontFamily: "inherit",
        textAlign: "right",
        outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={function (e) { e.target.style.borderColor = "var(--brand)"; e.target.style.boxShadow = "var(--focus-ring)"; }}
      onBlur={function (e) { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
    />
  );
}
