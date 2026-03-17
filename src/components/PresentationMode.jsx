import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { eur, pct } from "../utils";

function Slide({ children }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "70vh",
      padding: "var(--sp-8)",
      textAlign: "center",
      animation: "fadeIn 0.3s ease",
    }}>
      {children}
    </div>
  );
}

function BigMetric({ label, value, color, sub }) {
  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-2)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 72, fontWeight: 800, color: color || "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>{value}</div>
      {sub ? <div style={{ fontSize: 16, color: "var(--text-faint)", marginTop: "var(--sp-2)" }}>{sub}</div> : null}
    </div>
  );
}

function MetricRow({ items }) {
  return (
    <div style={{ display: "flex", gap: "var(--sp-8)", justifyContent: "center", flexWrap: "wrap" }}>
      {items.map(function (item, i) {
        return (
          <div key={i} style={{ minWidth: 180, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: item.color || "var(--text-primary)", lineHeight: 1.2 }}>{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PresentationMode({ data, t, onClose }) {
  var [slide, setSlide] = useState(0);

  var slides = useMemo(function () {
  var s = [];

  // Slide 0: Title
  s.push(function () {
    return (
      <Slide>
        <div style={{ fontSize: 48, fontWeight: 800, color: "var(--brand)", marginBottom: "var(--sp-4)", letterSpacing: "-0.02em" }}>
          {data.companyName || t.pres_company}
        </div>
        <div style={{ fontSize: 20, color: "var(--text-muted)", fontWeight: 400 }}>
          {t.pres_subtitle}
        </div>
      </Slide>
    );
  });

  // Slide 1: ARR & MRR
  s.push(function () {
    return (
      <Slide>
        <BigMetric label="ARR" value={eur(data.totalRevenue)} color="var(--brand)" />
        <MetricRow items={[
          { label: "MRR", value: eur(data.totalRevenue / 12), color: "var(--brand)" },
          { label: t.pres_clients, value: String(data.totS) },
        ]} />
      </Slide>
    );
  });

  // Slide 2: Profitability
  s.push(function () {
    var ebitdaColor = data.ebitda >= 0 ? "var(--color-success)" : "var(--color-error)";
    return (
      <Slide>
        <BigMetric label="EBITDA" value={eur(data.ebitda)} color={ebitdaColor} />
        <MetricRow items={[
          { label: t.pres_margin, value: pct(data.ebitdaMargin), color: ebitdaColor },
          { label: t.pres_net, value: eur(data.netP), color: data.netP >= 0 ? "var(--color-success)" : "var(--color-error)" },
          { label: t.pres_monthly_costs, value: eur(data.monthlyCosts) },
        ]} />
      </Slide>
    );
  });

  // Slide 3: Unit economics
  s.push(function () {
    return (
      <Slide>
        <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-6)" }}>{t.pres_unit_economics}</div>
        <MetricRow items={[
          { label: "ARPU", value: eur(data.arpuMonthly), color: "var(--brand)" },
          { label: "LTV", value: eur(data.ltv) },
          { label: "LTV:CAC", value: data.ltvCac > 0 ? data.ltvCac.toFixed(1) + "x" : "N/A", color: data.ltvCac >= 3 ? "var(--color-success)" : "var(--color-warning)" },
        ]} />
      </Slide>
    );
  });

  // Slide 4: Runway & Cash
  s.push(function () {
    var runwayColor = data.runway > 12 ? "var(--color-success)" : data.runway > 6 ? "var(--color-warning)" : "var(--color-error)";
    return (
      <Slide>
        <BigMetric
          label={t.pres_runway}
          value={data.isProfitable ? t.pres_profitable : Math.round(data.runway) + " " + t.pres_months}
          color={data.isProfitable ? "var(--color-success)" : runwayColor}
        />
        {!data.isProfitable ? (
          <MetricRow items={[
            { label: t.pres_burn, value: eur(data.netBurn) + "/mo", color: "var(--color-error)" },
            { label: t.pres_cash, value: eur(data.cash) },
          ]} />
        ) : null}
      </Slide>
    );
  });

  return s;
  }, [data, t]);

  var totalSlides = slides.length;

  var goNext = useCallback(function () {
    setSlide(function (s) { return Math.min(s + 1, totalSlides - 1); });
  }, [totalSlides]);

  var goPrev = useCallback(function () {
    setSlide(function (s) { return Math.max(s - 1, 0); });
  }, []);

  useEffect(function () {
    var prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    return function () { document.documentElement.style.overflowY = prev; };
  }, []);

  useEffect(function () {
    function onKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); goNext(); return; }
      if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); goPrev(); return; }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [goNext, goPrev, onClose]);

  var SlideContent = slides[slide];

  return createPortal(
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "var(--bg-page)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--sp-3) var(--sp-4)",
        borderBottom: "1px solid var(--border-light)",
      }}>
        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {slide + 1} / {totalSlides}
        </div>
        <div style={{ display: "flex", gap: "var(--sp-1)" }}>
          {Array.from({ length: totalSlides }).map(function (_, i) {
            return (
              <div
                key={i}
                onClick={function () { setSlide(i); }}
                style={{
                  width: 8, height: 8,
                  borderRadius: "50%",
                  background: i === slide ? "var(--brand)" : "var(--border-strong)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              />
            );
          })}
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Left arrow */}
        {slide > 0 ? (
          <button
            onClick={goPrev}
            style={{
              position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)",
              background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "50%",
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-secondary)", boxShadow: "var(--shadow-md)",
            }}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        ) : null}

        <div style={{ maxWidth: 900, width: "100%", padding: "0 80px" }}>
          <SlideContent />
        </div>

        {/* Right arrow */}
        {slide < totalSlides - 1 ? (
          <button
            onClick={goNext}
            style={{
              position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
              background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "50%",
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-secondary)", boxShadow: "var(--shadow-md)",
            }}
          >
            <CaretRight size={20} weight="bold" />
          </button>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{ padding: "var(--sp-2) var(--sp-4)", textAlign: "center", fontSize: 11, color: "var(--text-faint)" }}>
        {t.pres_nav_hint}
      </div>
    </div>,
    document.body
  );
}
