import { useState, useEffect, useRef } from "react";
import { Wrench, Shuffle, Eraser, CaretDown } from "@phosphor-icons/react";
import Button from "./Button";
import { useLang } from "../context";

/**
 * DevOptionsButton — Single dropdown button with DEV badge
 * containing Randomiser + Vider actions.
 *
 * Props:
 * - onRandomize: function — called when "Randomiser" is clicked
 * - onClear: function — called when "Vider" is clicked
 * - extraActions: array — optional additional { label, icon, onClick } items
 */
export default function DevOptionsButton({ onRandomize, onClear, extraActions }) {
  var { lang } = useLang();
  var isFr = lang !== "en";
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function () {
    if (!open) return;
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return function () {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  var devBadgeStyle = {
    display: "inline-block",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.05em",
    padding: "1px 5px",
    borderRadius: 4,
    marginLeft: 6,
    background: "var(--color-dev-banner-dark, rgba(0,0,0,0.15))",
    color: "var(--color-dev-banner-light, #fff)",
    verticalAlign: "middle",
    lineHeight: "14px",
  };

  var itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px var(--sp-3)",
    border: "none",
    borderRadius: "var(--r-sm)",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    fontFamily: "inherit",
    transition: "background 0.1s",
  };

  var dangerItemStyle = Object.assign({}, itemStyle, {
    color: "var(--color-error)",
  });

  function handleRandomize() {
    if (onRandomize) onRandomize();
    setOpen(false);
  }

  function handleClear() {
    if (onClear) onClear();
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        color="tertiary"
        size="lg"
        onClick={function () { setOpen(function (v) { return !v; }); }}
        iconLeading={<Wrench size={14} weight="bold" />}
        iconTrailing={<CaretDown size={10} weight="bold" style={{ opacity: 0.5 }} />}
      >
        Options
        <span style={devBadgeStyle}>DEV</span>
      </Button>
      {open ? (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          zIndex: 51,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
          padding: "var(--sp-1)",
          minWidth: 180,
          animation: "tooltipIn 0.1s ease",
        }}>
          {onRandomize ? (
            <button
              type="button"
              onClick={handleRandomize}
              style={itemStyle}
              onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
            >
              <Shuffle size={14} weight="bold" />
              {isFr ? "Randomiser" : "Randomize"}
            </button>
          ) : null}
          {extraActions ? extraActions.map(function (action, i) {
            return (
              <button
                key={i}
                type="button"
                onClick={function () { action.onClick(); setOpen(false); }}
                style={itemStyle}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
              >
                {action.icon || null}
                {action.label}
              </button>
            );
          }) : null}
          {onClear ? (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <button
                type="button"
                onClick={handleClear}
                style={dangerItemStyle}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
              >
                <Eraser size={14} weight="bold" />
                {isFr ? "Vider" : "Clear"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
