import { useState, useRef, useEffect } from "react";
import { Translate } from "@phosphor-icons/react";

var LANG_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export default function LangDropdown({ lang, toggleLang }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function () {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return function () { document.removeEventListener("mousedown", handleClick); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={function () { setOpen(!open); }}
        title="Change language / Changer la langue"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 38, height: 38,
          border: "1px solid var(--border)", borderRadius: "var(--r-md)",
          background: open ? "var(--bg-hover)" : "transparent", cursor: "pointer",
        }}
      >
        <Translate size={17} color="var(--text-muted)" />
      </button>

      {open ? (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-dropdown)",
          padding: "var(--sp-2)", minWidth: 148, zIndex: 200,
        }}>
          {LANG_OPTIONS.map(function (opt) {
            var active = lang === opt.value;
            return (
              <label
                key={opt.value}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-3)",
                  padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  background: active ? "var(--brand-bg)" : "transparent",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "var(--brand)" : "var(--text-primary)",
                }}
              >
                <input
                  type="radio" name="lang" value={opt.value} checked={active}
                  onChange={function () { if (!active) { toggleLang(); } setOpen(false); }}
                  style={{ accentColor: "var(--brand)", width: 14, height: 14, cursor: "pointer" }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
