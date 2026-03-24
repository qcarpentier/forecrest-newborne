import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Scales, CircleNotch } from "@phosphor-icons/react";
import { useTheme, useT } from "../context";

var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

var ENTER_MS = 300;
var INIT_MS = 1800;
var DEINIT_MS = 1200;
var EXIT_MS = 300;

var acctStylesInjected = false;
function injectAcctStyles() {
  if (acctStylesInjected) return;
  acctStylesInjected = true;
  var s = document.createElement("style");
  s.textContent = [
    "@keyframes acctDotPulse{0%,100%{box-shadow:0 0 0 0 rgba(180,130,40,.6)}70%{box-shadow:0 0 0 6px rgba(180,130,40,0)}}",
    "@keyframes acctSlideIn{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}",
    "@keyframes acctSlideOut{from{transform:translateY(0);opacity:1}to{transform:translateY(-100%);opacity:0}}",
    "@keyframes acctSpin{to{transform:rotate(360deg)}}",
  ].join("");
  document.head.appendChild(s);
}

/* Animated dots */
function AnimDots() {
  var [dots, setDots] = useState("");
  useEffect(function () {
    var i = 0;
    var seq = [".", "..", "..."];
    var id = setInterval(function () { i = (i + 1) % seq.length; setDots(seq[i]); }, 400);
    return function () { clearInterval(id); };
  }, []);
  return <span style={{ display: "inline-block", width: 18, textAlign: "left" }}>{dots}</span>;
}

export default function AccountantBar({ cfg, visible }) {
  var { dark } = useTheme();
  var t = useT();

  /* Phase system: null → entering → init → ready → deinit → exiting → null */
  var [phase, setPhase] = useState(function () { return visible ? "ready" : null; });
  var prevVisible = useRef(visible);

  useEffect(function () {
    var now = visible;
    var prev = prevVisible.current;
    prevVisible.current = now;

    if (now && !prev) {
      setPhase("entering");
      var t1 = setTimeout(function () { setPhase("init"); }, ENTER_MS);
      var t2 = setTimeout(function () { setPhase("ready"); }, ENTER_MS + INIT_MS);
      return function () { clearTimeout(t1); clearTimeout(t2); };
    }
    if (!now && prev) {
      setPhase("deinit");
      var t3 = setTimeout(function () { setPhase("exiting"); }, DEINIT_MS);
      var t4 = setTimeout(function () { setPhase(null); }, DEINIT_MS + EXIT_MS);
      return function () { clearTimeout(t3); clearTimeout(t4); };
    }
  }, [visible]);

  if (!phase) return null;
  injectAcctStyles();

  /* Accounting amber palette — inverted for visibility */
  var bg = dark ? "#fdf6e3" : "#2d2518";
  var fg = dark ? "#2d2518" : "#f5d78e";
  var dotColor = dark ? "#92600a" : "#f5d78e";
  var border = dark ? "#e8d5a0" : "#4a3a1a";

  var sepStyle = { width: 1, height: 12, background: fg, opacity: 0.25, flexShrink: 0 };
  var dimFg = { color: fg, opacity: 0.7 };

  var tvaLabel = cfg && cfg.vat > 0 ? (cfg.vat * 100) + "%" : (t.acctbar_exempt || "Exempté");
  var fiscalStart = (cfg && cfg.fiscalYearStart) || "01-01";

  var isLoading = phase === "entering" || phase === "init" || phase === "deinit";
  var animName = phase === "entering" || phase === "init" ? "acctSlideIn" : phase === "exiting" ? "acctSlideOut" : "none";
  var animDuration = phase === "entering" ? (ENTER_MS / 1000) + "s" : phase === "exiting" ? (EXIT_MS / 1000) + "s" : "0s";

  var loadingLabel = phase === "deinit" ? (t.acctbar_deinit || "Désactivation du mode comptable") : (t.acctbar_init || "Initialisation du mode comptable");

  return createPortal(
    <div
      role="status"
      aria-label={t.acctbar_mode || "Mode comptable"}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
        height: 32, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, background: bg, color: fg,
        fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
        borderBottom: "1px solid " + border,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        animation: animName + " " + animDuration + " ease forwards",
      }}
    >
      {isLoading ? (
        <>
          <CircleNotch size={14} weight="bold" style={{ animation: "acctSpin 1s linear infinite" }} />
          <span style={{ fontSize: 12 }}>{loadingLabel}<AnimDots /></span>
        </>
      ) : (
        <>
          {/* Pulse dot */}
          <span aria-hidden="true" style={{
            width: 8, height: 8, borderRadius: "50%",
            background: dotColor,
            animation: "acctDotPulse 2s ease-in-out infinite",
            flexShrink: 0,
          }} />

          <Scales size={14} weight="bold" aria-hidden="true" />
          <span style={{ fontSize: 12 }}>{t.acctbar_mode || "Mode comptable"}</span>

          <div style={sepStyle} aria-hidden="true" />
          <span style={dimFg}>TVA {tvaLabel}</span>

          <div style={sepStyle} aria-hidden="true" />
          <span style={dimFg}>ISOC 20/25%</span>

          <div style={sepStyle} aria-hidden="true" />
          <span style={dimFg}>{t.acctbar_fy || "Exercice"} {fiscalStart}</span>

          <div style={sepStyle} aria-hidden="true" />
          <kbd style={{
            fontSize: 10, opacity: 0.8, fontWeight: 400,
            fontFamily: "inherit", background: "none", border: "none",
            color: "inherit", padding: 0,
          }}>
            {isMac ? "⌘⇧E" : "Ctrl+Shift+E"}
          </kbd>
        </>
      )}
    </div>,
    document.body
  );
}
