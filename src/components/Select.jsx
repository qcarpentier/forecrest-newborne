import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CaretDown } from "@phosphor-icons/react";

var SIZE_MAP = {
  sm: { height: 30, fontSize: 12 },
  md: { height: 36, fontSize: 12 },
};

export default function Select({ value, onChange, options, placeholder, height, width, size, isDisabled, icon }) {
  var [open, setOpen] = useState(false);
  var [panelStyle, setPanelStyle] = useState({});
  var [highlightIdx, setHighlightIdx] = useState(-1);
  var wrapRef = useRef(null);
  var panelRef = useRef(null);
  var itemRefs = useRef([]);
  var sz = SIZE_MAP[size] || SIZE_MAP.md;
  var h = height || sz.height;
  var selected = options.find(function (o) { return o.value === value; });

  var allItems = placeholder ? [{ value: "", label: placeholder, isPlaceholder: true }].concat(options) : options;

  function handleToggle() {
    if (isDisabled) return;
    if (!open && wrapRef.current) {
      var rect = wrapRef.current.getBoundingClientRect();
      var pw = Math.max(rect.width, 180);
      var spaceBelow = window.innerHeight - rect.bottom - 8;
      var spaceAbove = rect.top - 8;
      if (spaceBelow >= 220 || spaceBelow >= spaceAbove) {
        setPanelStyle({ top: rect.bottom + 4, bottom: "auto", left: rect.left, width: pw, maxH: Math.min(spaceBelow, 220) });
      } else {
        setPanelStyle({ top: "auto", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: pw, maxH: Math.min(spaceAbove, 220) });
      }
    }
    setOpen(function (v) { return !v; });
    setHighlightIdx(-1);
  }

  var selectItem = useCallback(function (val) {
    onChange(val);
    setOpen(false);
    setHighlightIdx(-1);
  }, [onChange]);

  useEffect(function () {
    if (!open) return;
    function onOutside(e) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) { setOpen(false); setHighlightIdx(-1); }
    }
    function onScroll(e) {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
      setHighlightIdx(-1);
    }
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("scroll", onScroll, true);
    return function () {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(function (i) {
        var next = i < allItems.length - 1 ? i + 1 : 0;
        if (itemRefs.current[next]) itemRefs.current[next].scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(function (i) {
        var prev = i > 0 ? i - 1 : allItems.length - 1;
        if (itemRefs.current[prev]) itemRefs.current[prev].scrollIntoView({ block: "nearest" });
        return prev;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < allItems.length) {
        selectItem(allItems[highlightIdx].value);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      setHighlightIdx(-1);
    }
  }

  itemRefs.current = [];

  var panel = open ? (
    <div
      ref={panelRef}
      className="custom-scroll"
      style={{
        position: "fixed",
        top: panelStyle.top,
        bottom: panelStyle.bottom,
        left: panelStyle.left,
        width: panelStyle.width,
        maxHeight: panelStyle.maxH || 220,
        overflowY: "auto",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-dropdown)",
        padding: "var(--sp-1)",
        zIndex: 9999,
      }}
    >
      {allItems.map(function (opt, idx) {
        var active = value === opt.value;
        var highlighted = idx === highlightIdx;
        var bg = active ? "var(--brand-bg)" : (highlighted ? "var(--bg-hover)" : "transparent");
        return (
          <div
            key={opt.value + "-" + idx}
            ref={function (el) { itemRefs.current[idx] = el; }}
            role="option"
            aria-selected={active}
            onClick={function () { selectItem(opt.value); }}
            style={{
              padding: "var(--sp-2) var(--sp-3)",
              fontSize: sz.fontSize,
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              background: bg,
              color: opt.isPlaceholder ? "var(--text-faint)" : (active ? "var(--brand)" : "var(--text-primary)"),
              fontWeight: active ? 600 : 400,
              transition: "background 0.1s",
            }}
            onMouseEnter={function () { setHighlightIdx(idx); }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={wrapRef}
        style={{ position: "relative", display: "inline-flex", alignItems: "center", width: width || "auto" }}
      >
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: h,
            padding: "0 26px 0 " + (icon ? "var(--sp-2)" : "var(--sp-3)"),
            fontSize: sz.fontSize,
            border: open ? "1px solid var(--brand)" : "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--input-bg)",
            color: (selected && selected.value !== "") ? "var(--text-primary)" : "var(--text-faint)",
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.5 : 1,
            whiteSpace: "nowrap",
            textAlign: "left",
            boxShadow: open ? "var(--focus-ring)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            fontFamily: "inherit",
          }}
        >
          {icon ? <span style={{ display: "inline-flex", marginRight: "var(--sp-2)", flexShrink: 0, color: "var(--text-muted)" }}>{icon}</span> : null}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {selected ? selected.label : (placeholder || "")}
          </span>
        </button>
        <CaretDown
          size={11}
          weight="bold"
          color="var(--text-faint)"
          style={{
            position: "absolute",
            right: 8,
            pointerEvents: "none",
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      {createPortal(panel, document.body)}
    </>
  );
}
