import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDevMode, useT, useTheme } from "../context";
import { Code, CircleNotch, Browsers } from "@phosphor-icons/react";
import { VERSION } from "../constants/config";

var stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  var s = document.createElement("style");
  s.textContent = [
    "@keyframes devDotPulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.6)}70%{box-shadow:0 0 0 6px rgba(99,102,241,0)}}",
    "@keyframes devSlideIn{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}",
    "@keyframes devSlideOut{from{transform:translateY(0);opacity:1}to{transform:translateY(-100%);opacity:0}}",
    "@keyframes devSpin{to{transform:rotate(360deg)}}",
    "@keyframes devDots{0%{content:'.'}33%{content:'..'}66%{content:'...'}100%{content:'.'}}",
  ].join("");
  document.head.appendChild(s);
}

var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

function DevTip({ label, tip, children, dimFg }) {
  var [tipState, setTipState] = useState(null);
  var ref = useRef(null);

  var onEnter = useCallback(function () {
    if (!ref.current) return;
    var rect = ref.current.getBoundingClientRect();
    var tipLeft = rect.left + rect.width / 2 - 100;
    if (tipLeft < 8) tipLeft = 8;
    if (tipLeft + 200 > window.innerWidth - 8) tipLeft = window.innerWidth - 208;
    setTipState({ top: rect.bottom + 6, left: tipLeft });
  }, []);

  var bubble = tipState ? createPortal(
    <span style={{
      position: "fixed", top: tipState.top, left: tipState.left,
      background: "var(--tooltip-bg)", color: "var(--tooltip-text)",
      fontSize: 11, fontWeight: 400, lineHeight: 1.5,
      padding: "6px 10px", borderRadius: "var(--r-md)",
      width: 200, maxWidth: "90vw", zIndex: 10001,
      pointerEvents: "none", boxShadow: "var(--shadow-dropdown)",
      whiteSpace: "normal",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {tip}
    </span>,
    document.body
  ) : null;

  return (
    <span
      ref={ref}
      aria-label={label}
      style={{ ...dimFg, cursor: "help", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={onEnter}
      onMouseLeave={function () { setTipState(null); }}
    >
      {children}
      {bubble}
    </span>
  );
}

/* Animated dots component: "..." cycles */
function AnimDots() {
  var [dots, setDots] = useState("");
  useEffect(function () {
    var i = 0;
    var seq = [".", "..", "..."];
    var id = setInterval(function () {
      i = (i + 1) % seq.length;
      setDots(seq[i]);
    }, 400);
    return function () { clearInterval(id); };
  }, []);
  return <span style={{ display: "inline-block", width: 18, textAlign: "left" }}>{dots}</span>;
}

export default function DevBanner({ cfg, scenarios, activeScenario, onScenarioSwitch, onScenarioSave, onScenarioDelete }) {
  var ctx = useDevMode();
  var { dark } = useTheme();
  var tAll = useT();
  var t = tAll.dev;

  var dt = (cfg && cfg.devTiming) || {};
  var enterMs = dt.enterMs != null ? dt.enterMs : 300;
  var initMs = dt.initMs != null ? dt.initMs : 2500;
  var deinitMs = dt.deinitMs != null ? dt.deinitMs : 1800;
  var exitMs = dt.exitMs != null ? dt.exitMs : 300;

  // phase: null | "entering" | "init" | "ready" | "deinit" | "exiting"
  var [phase, setPhase] = useState(function () {
    return ctx && ctx.devMode ? "ready" : null;
  });
  var prevDevMode = useRef(ctx && ctx.devMode);

  useEffect(function () {
    var now = ctx && ctx.devMode;
    var prev = prevDevMode.current;
    prevDevMode.current = now;

    if (now && !prev) {
      // Activating
      setPhase("entering");
      var t1 = setTimeout(function () { setPhase("init"); }, enterMs);
      var t2 = setTimeout(function () { setPhase("ready"); }, enterMs + initMs);
      return function () { clearTimeout(t1); clearTimeout(t2); };
    }
    if (!now && prev) {
      // Deactivating — show "deactivating..." then slide out
      setPhase("deinit");
      var t3 = setTimeout(function () { setPhase("exiting"); }, deinitMs);
      var t4 = setTimeout(function () { setPhase(null); }, deinitMs + exitMs);
      return function () { clearTimeout(t3); clearTimeout(t4); };
    }
  }, [ctx ? ctx.devMode : false]);

  if (!phase) return null;
  injectStyles();

  var bg = dark ? "var(--color-dev-banner-light)" : "var(--color-dev-banner-dark)";
  var fg = dark ? "var(--color-dev-banner-dark)" : "var(--color-dev-banner-light)";
  var dimFg = { color: fg, opacity: 0.7 };
  var sepStyle = { width: 1, height: 12, background: fg, opacity: 0.2, flexShrink: 0 };

  var reactVersion = typeof React !== "undefined" ? React.version : "18";
  var nodeCount = document.querySelectorAll("*").length;

  var tipVersion = t ? (t.tip_version || "Version actuelle de l'application") : "Current application version";
  var tipReact = t ? (t.tip_react || "Version de React utilisée pour le rendu") : "React version used for rendering";
  var tipDom = t ? (t.tip_dom || "Nombre d'éléments HTML dans le DOM. Un nombre élevé (>1500) peut impacter les performances.") : "Number of HTML elements in the DOM. High count (>1500) may impact performance.";
  var tipTheme = t ? (t.tip_theme || "Thème actif de l'interface") : "Active UI theme";

  var isLoading = phase === "entering" || phase === "init" || phase === "deinit";
  var animName = phase === "entering" || phase === "init" ? "devSlideIn" : phase === "exiting" ? "devSlideOut" : "none";
  var animDuration = phase === "entering" ? (enterMs / 1000) + "s" : phase === "exiting" ? (exitMs / 1000) + "s" : "0s";

  var initLabel = t ? (t.initializing || "Initialisation du mode développeur") : "Initializing developer mode";
  var deinitLabel = t ? (t.deactivating || "Désactivation du mode développeur") : "Deactivating developer mode";
  var loadingLabel = phase === "deinit" ? deinitLabel : initLabel;

  return createPortal(
    <div
      role="status"
      aria-label={t ? t.banner : "Developer Mode"}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: 32, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, background: bg, color: fg,
        fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
        borderBottom: "1px solid var(--color-dev-border)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        animation: animName + " " + animDuration + " ease forwards",
      }}
    >
      {isLoading ? (
        <>
          <CircleNotch size={14} weight="bold" style={{ animation: "devSpin 1s linear infinite" }} />
          <span style={{ fontSize: 12 }}>{loadingLabel}<AnimDots /></span>
        </>
      ) : (
        <>
          {/* Pulse dot */}
          <span
            aria-hidden="true"
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--color-dev)",
              animation: "devDotPulse 2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />

          <Code size={14} weight="bold" aria-hidden="true" />
          <span style={{ fontSize: 12 }}>{t ? t.banner : "Developer Mode"}</span>

          <div style={sepStyle} aria-hidden="true" />
          <DevTip label={"Version " + VERSION} tip={tipVersion} dimFg={dimFg}>v{VERSION}</DevTip>

          <div style={sepStyle} aria-hidden="true" />
          <DevTip label={"React " + reactVersion} tip={tipReact} dimFg={dimFg}>React {reactVersion}</DevTip>

          <div style={sepStyle} aria-hidden="true" />
          <DevTip label={nodeCount + " DOM nodes"} tip={tipDom} dimFg={dimFg}>{nodeCount} DOM</DevTip>

          <div style={sepStyle} aria-hidden="true" />
          <DevTip label={dark ? "Dark theme" : "Light theme"} tip={tipTheme} dimFg={dimFg}>{dark ? "Dark" : "Light"}</DevTip>

          {/* Scenario selector */}
          {scenarios && scenarios.length > 0 ? (
            <>
              <div style={sepStyle} aria-hidden="true" />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Browsers size={12} style={dimFg} />
                {scenarios.map(function (sc) {
                  var isActive = sc.id === activeScenario;
                  return (
                    <button
                      key={sc.id}
                      onClick={function () { if (!isActive && onScenarioSwitch) onScenarioSwitch(sc.id); }}
                      title={(tAll.scenarios ? (tAll.scenarios[sc.name] || sc.name) : sc.name)}
                      style={{
                        width: 8, height: 8, borderRadius: "50%", border: "none",
                        background: sc.color || "var(--text-muted)",
                        cursor: isActive ? "default" : "pointer",
                        outline: isActive ? "2px solid " + fg : "none",
                        outlineOffset: 1, padding: 0, flexShrink: 0,
                        opacity: isActive ? 1 : 0.5,
                        transition: "opacity 0.15s, outline 0.15s",
                      }}
                    />
                  );
                })}
                {onScenarioSave ? (
                  <button
                    onClick={onScenarioSave}
                    title="New scenario"
                    style={{
                      border: "none", background: "none", cursor: "pointer",
                      padding: 0, fontSize: 11, color: fg, opacity: 0.5,
                      lineHeight: 1, display: "flex", alignItems: "center",
                    }}
                  >+</button>
                ) : null}
              </div>
            </>
          ) : null}

          <div style={sepStyle} aria-hidden="true" />
          <kbd style={{
            fontSize: 10, opacity: 0.8, fontWeight: 400,
            fontFamily: "inherit", background: "none", border: "none",
            color: "inherit", padding: 0,
          }}>
            {isMac ? "⌘⇧D" : "Ctrl+Shift+D"}
          </kbd>
        </>
      )}
    </div>,
    document.body
  );
}
