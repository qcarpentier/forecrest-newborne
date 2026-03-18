import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "@phosphor-icons/react";

var ARROW_SIZE = 6;

function renderTip(tip) {
  if (typeof tip !== "string") return tip;
  var parts = tip.split("`");
  var out = [];
  parts.forEach(function (p, i) {
    if (i % 2 === 1) {
      out.push(
        <code
          key={i}
          style={{
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            fontSize: 11,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 4,
            padding: "1px 5px",
            display: "block",
            marginTop: 4,
            lineHeight: 1.6,
            letterSpacing: 0,
          }}
        >
          {p}
        </code>
      );
    } else {
      p.split("\n").forEach(function (line, j) {
        if (j > 0) out.push(<br key={i + "-" + j} />);
        if (line) out.push(line);
      });
    }
  });
  return out;
}

function computePosition(rect, placement, w, tipH) {
  var pos = { top: 0, left: 0, actualPlacement: placement };
  var mid = rect.left + rect.width / 2;
  var vmid = rect.top + rect.height / 2;
  var gap = 7;

  if (placement === "top" || placement === "bottom") {
    pos.left = mid - w / 2;
    if (pos.left < 8) pos.left = 8;
    if (pos.left + w > window.innerWidth - 8) pos.left = window.innerWidth - w - 8;
  }

  if (placement === "top") {
    pos.top = rect.top - gap;
    pos.anchor = "bottom";
    if (pos.top < tipH + 8) {
      pos.top = rect.bottom + gap;
      pos.anchor = "top";
      pos.actualPlacement = "bottom";
    }
  } else if (placement === "bottom") {
    pos.top = rect.bottom + gap;
    pos.anchor = "top";
    if (pos.top + tipH > window.innerHeight - 8) {
      pos.top = rect.top - gap;
      pos.anchor = "bottom";
      pos.actualPlacement = "top";
    }
  } else if (placement === "left") {
    pos.left = rect.left - w - gap;
    pos.top = vmid;
    pos.anchor = "right";
    pos.verticalCenter = true;
    if (pos.left < 8) {
      pos.left = rect.right + gap;
      pos.anchor = "left";
      pos.actualPlacement = "right";
    }
  } else if (placement === "right") {
    pos.left = rect.right + gap;
    pos.top = vmid;
    pos.anchor = "left";
    pos.verticalCenter = true;
    if (pos.left + w > window.innerWidth - 8) {
      pos.left = rect.left - w - gap;
      pos.anchor = "right";
      pos.actualPlacement = "left";
    }
  }

  return pos;
}

var ANIM_MAP = {
  top: "tooltipIn",
  bottom: "tooltipInBottom",
  left: "tooltipInLeft",
  right: "tooltipInRight",
};

function arrowStyle(actualPlacement, rect, bubbleLeft, w) {
  var s = {
    position: "absolute",
    width: 0, height: 0,
    border: ARROW_SIZE + "px solid transparent",
  };
  if (actualPlacement === "top") {
    s.bottom = -ARROW_SIZE * 2;
    s.borderTopColor = "var(--tooltip-bg)";
    s.left = Math.max(8, Math.min(rect.left + rect.width / 2 - bubbleLeft - ARROW_SIZE, w - ARROW_SIZE * 2 - 8));
  } else if (actualPlacement === "bottom") {
    s.top = -ARROW_SIZE * 2;
    s.borderBottomColor = "var(--tooltip-bg)";
    s.left = Math.max(8, Math.min(rect.left + rect.width / 2 - bubbleLeft - ARROW_SIZE, w - ARROW_SIZE * 2 - 8));
  } else if (actualPlacement === "left") {
    s.right = -ARROW_SIZE * 2;
    s.borderLeftColor = "var(--tooltip-bg)";
    s.top = "50%";
    s.transform = "translateY(-50%)";
  } else if (actualPlacement === "right") {
    s.left = -ARROW_SIZE * 2;
    s.borderRightColor = "var(--tooltip-bg)";
    s.top = "50%";
    s.transform = "translateY(-50%)";
  }
  return s;
}

export default function Tooltip({ tip, children, width, placement, arrow, description, delay }) {
  var w = width || 280;
  var pl = placement || "top";
  var dl = delay || 0;
  var [show, setShow] = useState(false);
  var [pos, setPos] = useState({ top: 0, left: 0, anchor: "bottom", actualPlacement: "top" });
  var ref = useRef(null);
  var timerRef = useRef(null);
  var rectRef = useRef(null);

  var onEnter = useCallback(function () {
    if (!ref.current) return;
    rectRef.current = ref.current.getBoundingClientRect();
    var rect = rectRef.current;

    function doShow() {
      var computed = computePosition(rect, pl, w, 60);
      setPos(computed);
      setShow(true);
    }

    if (dl > 0) {
      timerRef.current = setTimeout(doShow, dl);
    } else {
      doShow();
    }
  }, [w, pl, dl]);

  var onLeave = useCallback(function () {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
  }, []);

  var anim = ANIM_MAP[pos.actualPlacement] || "tooltipIn";

  var bubbleStyle = {
    position: "fixed",
    left: pos.left,
    background: "var(--tooltip-bg)",
    color: "var(--tooltip-text)",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.55,
    padding: "8px 12px",
    borderRadius: "var(--r-md)",
    width: w,
    maxWidth: "90vw",
    zIndex: 10000,
    pointerEvents: "none",
    boxShadow: "var(--shadow-dropdown)",
    whiteSpace: "normal",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    animation: anim + " 0.14s ease",
  };

  if (pos.anchor === "bottom") {
    bubbleStyle.bottom = window.innerHeight - pos.top;
  } else if (pos.anchor === "top") {
    bubbleStyle.top = pos.top;
  } else if (pos.verticalCenter) {
    bubbleStyle.top = pos.top;
    bubbleStyle.transform = "translateY(-50%)";
  } else {
    bubbleStyle.top = pos.top;
  }

  var bubble = show ? createPortal(
    <span style={bubbleStyle}>
      {renderTip(tip)}
      {description ? (
        <div style={{ fontSize: 11, color: "var(--tooltip-text)", opacity: 0.7, marginTop: 4, lineHeight: 1.45 }}>
          {description}
        </div>
      ) : null}
      {arrow && rectRef.current ? (
        <span style={arrowStyle(pos.actualPlacement, rectRef.current, pos.left, w)} />
      ) : null}
    </span>,
    document.body
  ) : null;

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
      {bubble}
    </span>
  );
}

export function InfoTip({ tip, width, placement, description }) {
  return (
    <Tooltip tip={tip} width={width} placement={placement} description={description}>
      <Info
        size={12}
        color="var(--text-faint)"
        style={{ cursor: "help", marginLeft: 4, flexShrink: 0 }}
      />
    </Tooltip>
  );
}
