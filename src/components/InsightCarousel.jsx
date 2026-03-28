/**
 * InsightCarousel — Horizontal swipeable insight/suggestion cards.
 *
 * Props:
 *   cards: [{
 *     id, icon, color ("info"|"success"|"warning"|"error"|"brand"),
 *     title, body (JSX), action: { label, onClick }
 *   }]
 *   skeleton: boolean — show placeholder cards when no data
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { ALERT_VARIANTS } from "../constants/colors";

var CARD_MIN_W = 300;
var CARD_MAX_W = 400;
var GAP = 12;

export default function InsightCarousel({ cards, skeleton }) {
  var scrollRef = useRef(null);
  var [activeIdx, setActiveIdx] = useState(0);
  var [showArrows, setShowArrows] = useState(false);
  var [canLeft, setCanLeft] = useState(false);
  var [canRight, setCanRight] = useState(false);

  var updateArrows = useCallback(function () {
    var el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    var cardW = CARD_MIN_W + GAP;
    var idx = Math.round(el.scrollLeft / cardW);
    setActiveIdx(Math.min(idx, (cards || []).length - 1));
  }, [cards]);

  useEffect(function () {
    var el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return function () { el.removeEventListener("scroll", updateArrows); };
  }, [updateArrows]);

  function scrollBy(dir) {
    var el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (CARD_MIN_W + GAP), behavior: "smooth" });
  }

  /* Skeleton state */
  if (skeleton) {
    return (
      <div style={{ display: "flex", gap: GAP, marginBottom: "var(--gap-md)" }}>
        {[280, 300, 260].map(function (w, i) {
          return (
            <div key={i} style={{
              minWidth: w, height: 80, borderRadius: "var(--r-lg)",
              background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
              animation: "pulse 1.5s ease infinite", animationDelay: (i * 150) + "ms",
            }} />
          );
        })}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  var needsScroll = cards.length > 2;

  return (
    <div
      style={{ position: "relative", marginBottom: "var(--gap-md)" }}
      onMouseEnter={function () { setShowArrows(true); }}
      onMouseLeave={function () { setShowArrows(false); }}
    >
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: GAP,
          overflowX: needsScroll ? "auto" : "hidden", overflowY: "hidden",
          scrollSnapType: needsScroll ? "x mandatory" : "none",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {cards.map(function (card, i) {
          var variant = ALERT_VARIANTS[card.color] || ALERT_VARIANTS.info;
          var Icon = card.icon;
          return (
            <div
              key={card.id || i}
              style={{
                minWidth: needsScroll ? CARD_MIN_W : 0,
                maxWidth: needsScroll ? CARD_MAX_W : "none",
                flex: needsScroll ? "0 0 auto" : "1 1 0%",
                scrollSnapAlign: needsScroll ? "start" : "none",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-3) var(--sp-4)",
                display: "flex", gap: "var(--sp-3)",
                alignItems: "flex-start",
              }}
            >
              {Icon ? (
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--r-md)",
                  background: variant.bg, border: "1px solid " + variant.border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={16} weight="duotone" color={variant.accent} />
                </div>
              ) : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: variant.accent, marginBottom: 2, lineHeight: 1.3 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {card.body}
                </div>
                {card.action ? (
                  <button
                    type="button"
                    onClick={card.action.onClick}
                    style={{
                      marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 12, fontWeight: 600, color: variant.accent,
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    {card.action.label} <CaretRight size={12} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Left arrow — only when scrollable and > 2 cards */}
      {needsScroll && showArrows && canLeft ? (
        <button type="button" onClick={function () { scrollBy(-1); }}
          style={{
            position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)",
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 2, padding: 0,
          }}>
          <CaretLeft size={14} weight="bold" color="var(--text-muted)" />
        </button>
      ) : null}

      {/* Right arrow */}
      {needsScroll && showArrows && canRight ? (
        <button type="button" onClick={function () { scrollBy(1); }}
          style={{
            position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 2, padding: 0,
          }}>
          <CaretRight size={14} weight="bold" color="var(--text-muted)" />
        </button>
      ) : null}

      {/* Dots — only when > 3 cards */}
      {cards.length > 3 ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
          {cards.map(function (_, i) {
            return (
              <div key={i} style={{
                width: activeIdx === i ? 16 : 6, height: 6, borderRadius: 3,
                background: activeIdx === i ? "var(--brand)" : "var(--border-strong)",
                transition: "width 0.2s ease, background 0.2s ease",
              }} />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
