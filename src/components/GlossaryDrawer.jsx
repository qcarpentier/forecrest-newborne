import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, BookOpen, ArrowRight, ArrowsOutSimple, ArrowsInSimple, Link, CaretLeft, CaretRight } from "@phosphor-icons/react";
import SearchInput from "./SearchInput";
import { useGlossary, useT } from "../context";
import { GLOSSARY, GLOSSARY_MAP, GLOSSARY_CATEGORIES } from "../constants/glossary";
import { eur } from "../utils";

var SECTION_LABEL_STYLE = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" };

/* ── Term detail panel ── */
function TermDetail({ entry, g, navigate, termKey, financials, setTab, currentTab }) {
  if (!entry) return null;
  var def = g[entry.id + "_def"] || "";
  var formula = entry.formula;
  var related = entry.related || [];
  var categoryLabel = g["category_" + entry.category] || entry.category;
  var interpret = entry.interpret ? (g[entry.id + "_interpret"] || null) : null;
  var aliasesStr = entry.aliases ? (g[entry.id + "_aliases"] || null) : null;
  var aliases = aliasesStr ? aliasesStr.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
  var loc = entry.location;
  var settingsSection = entry.settings;
  var valueKey = entry.valueKey;
  var liveValue = valueKey && financials ? financials[valueKey] : undefined;

  function formatValue(v) {
    if (v == null) return "—";
    if (typeof v === "number") {
      if (valueKey === "costCoverage" || valueKey === "ebitdaMargin" || valueKey === "utilizationRate") return v + " %";
      if (valueKey === "runway") return v + " " + (g.unit_months || "months");
      if (valueKey === "activeSources") return String(v);
      if (valueKey === "healthScore") return v + "/100";
      return eur(v);
    }
    return String(v);
  }

  return (
    <div key={termKey} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)", animation: "glossaryFade 0.15s ease" }}>
      <div>
        <span style={{
          display: "inline-block",
          padding: "3px 10px", borderRadius: "var(--r-full)",
          background: "var(--bg-accordion)", border: "1px solid var(--border)",
          fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.03em",
        }}>
          {categoryLabel}
        </span>
      </div>

      {/* Aliases */}
      {aliases.length > 0 ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
            {g.aliases_label || "Also known as"}
          </span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {aliases.map(function (alias) {
              return (
                <span key={alias} style={{
                  padding: "2px 8px", borderRadius: "var(--r-full)",
                  background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
                  fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap",
                }}>
                  {alias}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Live value */}
      {liveValue !== undefined ? (
        <div style={{
          padding: "var(--sp-3) var(--sp-4)",
          background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
          border: "1px solid var(--border-light)",
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{g.your_value || "Your current value"}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {formatValue(liveValue)}
          </span>
        </div>
      ) : null}

      {/* Definition */}
      <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)" }}>
        {def}
      </div>

      {/* Interpretation (positive/negative context) */}
      {interpret ? (
        <div style={{
          padding: "var(--sp-3) var(--sp-4)",
          background: "var(--color-info-bg)", borderRadius: "var(--r-md)",
          border: "1px solid var(--color-info-border)",
          fontSize: 13, lineHeight: 1.55, color: "var(--text-primary)",
        }}>
          {interpret}
        </div>
      ) : null}

      {/* Formula */}
      {formula ? (
        <div>
          <div style={SECTION_LABEL_STYLE}>{g.formula || "Formula"}</div>
          <div style={{
            padding: "var(--sp-3) var(--sp-4)",
            background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
            border: "1px solid var(--border-light)",
            fontFamily: "'DM Sans', monospace", fontSize: 13,
            color: "var(--text-secondary)", letterSpacing: "0.01em",
          }}>
            {formula}
          </div>
        </div>
      ) : null}

      {/* Where to find it */}
      {loc ? (
        <div>
          <div style={SECTION_LABEL_STYLE}>{g.location_label || "Where to find it"}</div>
          {currentTab === loc.tab ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px",
              border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              background: "var(--bg-accordion)",
              fontSize: 12, fontWeight: 500, color: "var(--text-muted)",
            }}>
              {g["location_" + loc.tab] || loc.tab}
              {loc.section ? (" > " + (g["section_" + loc.section] || loc.section)) : ""}
              <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 4 }}>— {g.already_here || "Vous y êtes"}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={function () { if (setTab) setTab(loc.tab); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                background: "transparent", cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: "var(--brand)",
                fontFamily: "inherit",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; e.currentTarget.style.borderColor = "var(--brand)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <ArrowRight size={12} weight="bold" />
              {g["location_" + loc.tab] || loc.tab}
              {loc.section ? (" > " + (g["section_" + loc.section] || loc.section)) : ""}
            </button>
          )}
        </div>
      ) : null}

      {/* Settings link */}
      {settingsSection ? (
        <div>
          <div style={SECTION_LABEL_STYLE}>{g.settings_label || "Configuration"}</div>
          <button
            type="button"
            onClick={function () { if (setTab) setTab("set"); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px",
              border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              background: "transparent", cursor: "pointer",
              fontSize: 12, fontWeight: 500, color: "var(--brand)",
              fontFamily: "inherit",
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; e.currentTarget.style.borderColor = "var(--brand)"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <ArrowRight size={12} weight="bold" />
            {g.location_set || "Settings"} {" > " + (g["section_" + settingsSection] || settingsSection)}
          </button>
        </div>
      ) : null}

      {/* Related terms */}
      {related.length > 0 ? (
        <div>
          <div style={SECTION_LABEL_STYLE}>{g.related || "Related terms"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {related.map(function (rid) {
              var re = GLOSSARY_MAP[rid];
              if (!re) return null;
              var rTitle = g[rid + "_title"] || rid;
              var rCat = g["category_" + re.category] || re.category;
              return (
                <button
                  key={rid}
                  type="button"
                  onClick={function () { navigate(rid); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    padding: "8px var(--sp-3)",
                    border: "none", borderRadius: "var(--r-md)",
                    background: "transparent",
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
                >
                  <Link size={14} color="var(--text-muted)" weight="bold" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>{rTitle}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{rCat}</span>
                  <ArrowRight size={12} color="var(--text-muted)" weight="bold" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Glossary list (expanded mode sidebar) ── */
function GlossaryList({ g, activeTerm, onSelect, search, setSearch, activeCategory, setActiveCategory }) {
  var listRef = useRef(null);

  var filtered = GLOSSARY.filter(function (entry) {
    if (activeCategory !== "all" && entry.category !== activeCategory) return false;
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      var title = (g[entry.id + "_title"] || entry.id).toLowerCase();
      return title.indexOf(q) !== -1;
    }
    return true;
  });

  /* auto-scroll to active term */
  useEffect(function () {
    if (!activeTerm || !listRef.current) return;
    var el = listRef.current.querySelector('[data-term="' + activeTerm + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeTerm]);

  /* group by category */
  var grouped = {};
  filtered.forEach(function (entry) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  });

  /* count per category for pills */
  var resultCount = filtered.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Search */}
      <div style={{ padding: "var(--sp-3) var(--sp-4)", flexShrink: 0 }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={g.search_placeholder || "Search..."}
          width="100%"
          height={36}
        />
        {search.trim() ? (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {resultCount} {g.result_count || "result(s)"}
          </div>
        ) : null}
      </div>

      {/* Category pills + shadow */}
      <div style={{
        padding: "var(--sp-2) var(--sp-4) var(--sp-3)",
        display: "flex", gap: 4, flexWrap: "wrap", flexShrink: 0,
        boxShadow: "0 4px 8px -2px rgba(0,0,0,0.06)",
        position: "relative", zIndex: 1,
      }}>
        {[{ id: "all" }].concat(GLOSSARY_CATEGORIES).map(function (cat) {
          var isActive = activeCategory === cat.id;
          var label = cat.id === "all"
            ? (g.category_all || "All")
            : (g["category_" + cat.id] || cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={function () { setActiveCategory(cat.id); }}
              style={{
                height: 26, padding: "0 10px",
                border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                borderRadius: "var(--r-full)",
                background: isActive ? "var(--brand-bg)" : "transparent",
                color: isActive ? "var(--brand)" : "var(--text-secondary)",
                fontSize: 11, fontWeight: isActive ? 600 : 500,
                fontFamily: "inherit", cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Term list */}
      <div ref={listRef} className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "var(--sp-6)", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {g.no_results || "No terms found"}
          </div>
        ) : (function () {
          var visibleCats = GLOSSARY_CATEGORIES.filter(function (cat) { return !!grouped[cat.id]; });
          return visibleCats.map(function (cat, catIdx) {
            var catLabel = g["category_" + cat.id] || cat.id;
            var catCount = grouped[cat.id].length;
            return (
              <div key={cat.id} style={{ marginBottom: "var(--sp-1)" }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "var(--text-faint)",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: catIdx === 0 ? "4px var(--sp-3) 4px" : "10px var(--sp-3) 4px",
                  marginTop: catIdx === 0 ? 0 : "var(--sp-1)",
                  borderTop: catIdx === 0 ? "none" : "1px solid var(--border-light)",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>{catLabel}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-ghost)" }}>{catCount}</span>
                </div>
                {grouped[cat.id].map(function (entry) {
                  var eTitle = g[entry.id + "_title"] || entry.id;
                  var isActive = activeTerm === entry.id;
                  return (
                    <button
                      key={entry.id}
                      data-term={entry.id}
                      type="button"
                      onClick={function () { onSelect(entry.id); }}
                      style={{
                        display: "flex", alignItems: "center",
                        width: "100%", padding: "7px var(--sp-3)",
                        border: "none", borderRadius: "var(--r-md)",
                        background: isActive ? "var(--brand-bg)" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.1s",
                        fontFamily: "inherit", marginBottom: 1,
                      }}
                      onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                    >
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-primary)" }}>
                        {eTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

/* ── Main drawer ── */
export default function GlossaryDrawer() {
  var { openTerm, drawerOpen, expanded, close, navigate, toggleExpanded, financials, goToTab, currentTab } = useGlossary();
  var g = useT().glossary || {};
  var drawerRef = useRef(null);
  var [search, setSearch] = useState("");
  var [activeCategory, setActiveCategory] = useState("all");

  var [closing, setClosing] = useState(false);
  var ANIM_MS = 200;

  var entry = openTerm ? GLOSSARY_MAP[openTerm] : null;
  var title = entry ? (g[entry.id + "_title"] || entry.id) : "";

  /* animated close */
  var handleClose = useCallback(function () {
    setClosing(true);
    setTimeout(function () { setClosing(false); close(); }, ANIM_MS);
  }, [close]);

  /* prev/next navigation */
  var currentIdx = -1;
  GLOSSARY.forEach(function (e, i) { if (e.id === openTerm) currentIdx = i; });
  var prevTerm = currentIdx > 0 ? GLOSSARY[currentIdx - 1].id : null;
  var nextTerm = currentIdx < GLOSSARY.length - 1 ? GLOSSARY[currentIdx + 1].id : null;

  /* Escape to close */
  useEffect(function () {
    if (!drawerOpen) return;
    function onKey(e) { if (e.key === "Escape") handleClose(); }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, [drawerOpen, handleClose]);

  /* Ctrl+G = toggle glossary drawer */
  useEffect(function () {
    function onKey(e) {
      if (e.key === "g" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        if (drawerOpen) { handleClose(); } else { navigate(openTerm || GLOSSARY[0].id); }
      }
    }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, [drawerOpen, handleClose, navigate, openTerm]);

  /* focus drawer on open */
  useEffect(function () {
    if (drawerOpen && drawerRef.current) drawerRef.current.focus();
  }, [drawerOpen, openTerm]);

  if (!drawerOpen && !closing) return null;
  var showWelcome = !entry;

  var drawerWidth = expanded ? "50vw" : 420;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 899,
          background: expanded ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)",
          opacity: closing ? 0 : 1,
          animation: closing ? "none" : "glossaryFadeIn " + ANIM_MS + "ms ease",
          transition: closing ? "opacity " + ANIM_MS + "ms ease" : "background 0.2s",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="complementary"
        aria-label={g.page_title || "Glossary"}
        tabIndex={-1}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: drawerWidth, maxWidth: "95vw",
          zIndex: 900,
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          boxShadow: expanded ? "none" : "-8px 0 32px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column",
          outline: "none",
          transform: closing ? "translateX(100%)" : "translateX(0)",
          animation: closing ? "none" : "slideInRight " + ANIM_MS + "ms ease",
          transition: closing ? "transform " + ANIM_MS + "ms ease" : "width 0.25s ease",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-2)",
          padding: "var(--sp-4) var(--sp-5)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "var(--r-md)",
            background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <BookOpen size={16} weight="bold" color="var(--brand)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 }}>
                {g.page_title || "Glossary"}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                {GLOSSARY.length} {g.terms_count || "terms"}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.3, marginTop: 2 }}>
              {title || (g.welcome_title || "Glossaire financier")}
            </div>
          </div>

          {/* Prev/Next */}
          <button
            onClick={prevTerm ? function () { navigate(prevTerm); } : undefined}
            disabled={!prevTerm}
            type="button"
            aria-label="Previous term"
            style={{
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: prevTerm ? "pointer" : "default",
              opacity: prevTerm ? 1 : 0.3, flexShrink: 0,
            }}
          >
            <CaretLeft size={12} color="var(--text-muted)" weight="bold" />
          </button>
          <button
            onClick={nextTerm ? function () { navigate(nextTerm); } : undefined}
            disabled={!nextTerm}
            type="button"
            aria-label="Next term"
            style={{
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: nextTerm ? "pointer" : "default",
              opacity: nextTerm ? 1 : 0.3, flexShrink: 0,
            }}
          >
            <CaretRight size={12} color="var(--text-muted)" weight="bold" />
          </button>

          {/* Expand/Minimize */}
          <button
            onClick={toggleExpanded}
            type="button"
            title={expanded ? "Minimize" : "Expand"}
            aria-label={expanded ? "Minimize" : "Expand"}
            style={{
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer", flexShrink: 0,
            }}
          >
            {expanded
              ? <ArrowsInSimple size={12} color="var(--text-muted)" weight="bold" />
              : <ArrowsOutSimple size={12} color="var(--text-muted)" weight="bold" />
            }
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            type="button"
            aria-label="Close"
            style={{
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer", flexShrink: 0,
            }}
          >
            <X size={12} color="var(--text-muted)" weight="bold" />
          </button>
        </div>

        {/* Body */}
        {showWelcome ? (
          <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-5)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)", paddingTop: "var(--sp-6)", textAlign: "center" }}>
              <BookOpen size={40} weight="duotone" color="var(--brand)" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)" }}>
                  {g.welcome_title || "Glossaire financier"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 280, lineHeight: 1.5 }}>
                  {g.welcome_desc || "Retrouvez ici tous les termes financiers expliqués simplement. Cliquez sur un terme souligné dans l'application pour en savoir plus."}
                </div>
              </div>
              <div style={{ width: "100%", marginTop: "var(--sp-2)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)", textAlign: "left" }}>
                  {g.welcome_popular || "Termes courants"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {["annual_revenue", "ebitda", "burn_rate", "runway", "cost_coverage", "treasury"].map(function (termId) {
                    var e = GLOSSARY_MAP[termId];
                    if (!e) return null;
                    var termTitle = g[termId + "_title"] || termId;
                    return (
                      <button key={termId} type="button" onClick={function () { navigate(termId); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "var(--sp-2)",
                          padding: "8px var(--sp-3)", border: "none", borderRadius: "var(--r-md)",
                          background: "transparent", cursor: "pointer", textAlign: "left",
                          fontFamily: "inherit", transition: "background 0.1s",
                        }}
                        onMouseEnter={function (ev) { ev.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={function (ev) { ev.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>{termTitle}</span>
                        <ArrowRight size={12} color="var(--text-muted)" weight="bold" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : expanded ? (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <GlossaryList
                g={g}
                activeTerm={openTerm}
                onSelect={navigate}
                search={search}
                setSearch={setSearch}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            </div>
            <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-5)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
              <TermDetail entry={entry} g={g} navigate={navigate} termKey={openTerm} financials={financials ? financials.current : {}} setTab={function (tab) { handleClose(); goToTab(tab); }} currentTab={currentTab ? currentTab.current : null} />
            </div>
          </div>
        ) : (
          <div className="custom-scroll" style={{
            flex: 1, overflowY: "auto", padding: "var(--sp-5)",
            scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent",
          }}>
            <TermDetail entry={entry} g={g} navigate={navigate} termKey={openTerm} financials={financials ? financials.current : {}} setTab={function (tab) { handleClose(); goToTab(tab); }} currentTab={currentTab ? currentTab.current : null} />
          </div>
        )}

        {/* Footer — shortcut hint */}
        <div style={{
          padding: "var(--sp-2) var(--sp-5)",
          borderTop: "1px solid var(--border-light)",
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3,
        }}>
          {["Ctrl", "G"].map(function (k) {
            return (
              <kbd key={k} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 20, height: 20, padding: "0 5px",
                fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
                color: "var(--text-secondary)", background: "var(--bg-page)",
                border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)",
                boxShadow: "0 1px 0 var(--border-strong)",
                lineHeight: 1, whiteSpace: "nowrap",
              }}>
                {k}
              </kbd>
            );
          })}
        </div>
      </div>

      <style>{"\
        @keyframes slideInRight {\
          from { transform: translateX(100%); }\
          to { transform: translateX(0); }\
        }\
        @keyframes glossaryFadeIn {\
          from { opacity: 0; }\
          to { opacity: 1; }\
        }\
        @keyframes glossaryFade {\
          from { opacity: 0; transform: translateY(4px); }\
          to { opacity: 1; transform: translateY(0); }\
        }\
      "}</style>
    </>,
    document.body
  );
}
