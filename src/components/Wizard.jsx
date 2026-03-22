import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../components";
import { useT } from "../context";

/**
 * Reusable Wizard component — multi-step setup flow.
 *
 * Props:
 * - steps: Array<{ key: string, content: ReactNode, canAdvance?: boolean, skippable?: boolean }>
 * - onFinish: function() — called when user confirms the last step
 * - finishLabel: string — label for the finish button (default "Confirmer")
 * - finishIcon: ReactNode — optional icon for the finish button
 * - finishDisabled: boolean — disable the finish button
 * - title: string — optional title above the wizard card
 * - subtitle: string — optional subtitle
 * - maxWidth: number — card max width (default 600)
 * - initialStep: number — starting step index (default 0)
 * - onStepChange: function(stepIndex) — callback on step change
 */
export default function Wizard({
  steps, onFinish, finishLabel, finishIcon, finishDisabled,
  title, subtitle, maxWidth, initialStep, onStepChange,
}) {
  var t = useT();
  var [step, setStep] = useState(initialStep || 0);
  var totalSteps = steps ? steps.length : 0;
  var current = steps && steps[step] ? steps[step] : null;
  var canAdvanceRef = useRef(true);
  var finishRef = useRef(null);

  // Update canAdvance ref
  useEffect(function () {
    if (!current) return;
    canAdvanceRef.current = current.canAdvance !== false;
  }, [step, current && current.canAdvance]);

  // Keep finishRef in sync
  finishRef.current = onFinish;

  // Notify parent of step change
  useEffect(function () {
    if (onStepChange) onStepChange(step);
  }, [step]);

  // Keyboard navigation
  var handleKey = useCallback(function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!canAdvanceRef.current) return;
      setStep(function (s) { return Math.min(s + 1, totalSteps - 1); });
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!canAdvanceRef.current) return;
      setStep(function (s) {
        if (s >= totalSteps - 1 && finishRef.current && !finishDisabled) { finishRef.current(); return s; }
        return Math.min(s + 1, totalSteps - 1);
      });
    }
    if (e.key === "ArrowLeft" || e.key === "Backspace") {
      e.preventDefault();
      setStep(function (s) { return Math.max(s - 1, 0); });
    }
  }, [totalSteps, finishDisabled]);

  useEffect(function () {
    window.addEventListener("keydown", handleKey);
    return function () { window.removeEventListener("keydown", handleKey); };
  }, [handleKey]);

  function goNext() { setStep(function (s) { return Math.min(s + 1, totalSteps - 1); }); }
  function goBack() { setStep(function (s) { return Math.max(s - 1, 0); }); }
  function goTo(i) { setStep(i); }

  if (!steps || !steps.length || !current) return null;

  var isFirst = step === 0;
  var isLast = step === totalSteps - 1;
  var canAdvance = current.canAdvance !== false;

  return (
    <div style={{ maxWidth: maxWidth || 600, margin: "0 auto", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-6)" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: "var(--sp-6)" }}>
        {steps.map(function (_, i) {
          return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "var(--brand)" : "var(--bg-hover)", transition: "background 0.2s" }} />;
        })}
      </div>

      {/* Step content */}
      {current.content}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-6)" }}>
        {!isFirst ? (
          <Button color="tertiary" size="lg" onClick={goBack}>
            {t.wizard_back || "Retour"}
          </Button>
        ) : <div />}
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          {current.skippable ? (
            <Button color="tertiary" size="lg" onClick={goNext}>
              {t.wizard_skip || "Passer"}
            </Button>
          ) : null}
          {!isLast ? (
            <Button color="primary" size="lg" isDisabled={!canAdvance} onClick={goNext}>
              {t.wizard_next || "Suivant"}
            </Button>
          ) : (
            <Button color="primary" size="lg" onClick={onFinish} isDisabled={finishDisabled || !canAdvance} iconLeading={finishIcon || null}>
              {finishLabel || t.wizard_launch || "Confirmer"}
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div style={{ display: "flex", justifyContent: "center", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
        {[
          { keys: ["←"], label: t.wizard_key_back || "Précédent" },
          { keys: ["→"], label: t.wizard_key_next || "Suivant" },
          { keys: ["Enter"], label: t.wizard_key_confirm || "Confirmer" },
        ].map(function (sh, si) {
          return (
            <div key={si} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {sh.keys.map(function (k) {
                return (
                  <kbd key={k} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 22, height: 20, padding: "0 5px",
                    fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
                    color: "var(--text-secondary)", background: "var(--bg-page)",
                    border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
                    boxShadow: "0 1px 0 var(--border-strong)", lineHeight: 1,
                  }}>{k}</kbd>
                );
              })}
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{sh.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
