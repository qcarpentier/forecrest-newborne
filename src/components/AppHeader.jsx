import { useState } from "react";
import { Lifebuoy, MagnifyingGlass, ShareNetwork, QrCode } from "@phosphor-icons/react";
import { useGlossary, useLang, useT } from "../context";
import useBreakpoint from "../hooks/useBreakpoint";
import CollabBar from "./CollabBar";
import ButtonUtility from "./ButtonUtility";

var MARKETING_TABS = ["marketing", "mkt_campaigns", "mkt_channels", "mkt_budget", "mkt_conversions"];
var TOOLS_TABS = ["tool_qr", "tool_domain", "tool_trademark", "tool_employee", "tool_freelance", "tool_costing", "tool_currency", "tool_vat"];
var META_TABS = ["profile", "set", "changelog", "credits", "admin", "design-system", "dev-tooltips", "dev-calc", "dev-roadmap", "dev-sitemap", "dev-perf"];
var MODULES = [
  { id: "core", label: { fr: "Finance", en: "Finance" }, tab: "overview" },
  { id: "marketing", label: { fr: "Marketing", en: "Marketing" }, tab: "marketing" },
  { id: "tools_mod", label: { fr: "Outils", en: "Tools" }, tab: "tool_qr" },
];

// A module is considered entirely hidden when all of its entry tabs are in cfg.hiddenTabs.
var MODULE_ENTRY_TABS = {
  marketing: ["marketing", "mkt_campaigns", "mkt_channels", "mkt_budget", "mkt_conversions"],
  tools_mod: ["tool_qr", "tool_domain", "tool_trademark", "tool_employee", "tool_freelance", "tool_costing", "tool_currency", "tool_vat"],
};

var RAIL_SURFACE = {
  background: "var(--bg-card-translucent)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-sm)",
  backdropFilter: "blur(16px)",
};

function isModuleActive(moduleId, tab, activeModule) {
  if (moduleId === "marketing") return MARKETING_TABS.indexOf(tab) >= 0 || activeModule === "marketing";
  if (moduleId === "tools_mod") return TOOLS_TABS.indexOf(tab) >= 0 || activeModule === "tools_mod";
  if (META_TABS.indexOf(tab) >= 0) return false;
  return MARKETING_TABS.indexOf(tab) < 0 && TOOLS_TABS.indexOf(tab) < 0;
}

function HeaderNavItem({ active, label, onClick, compact }) {
  var [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={function () { setHovered(true); }}
      onMouseLeave={function () { setHovered(false); }}
      onFocus={function () { setHovered(true); }}
      onBlur={function () { setHovered(false); }}
      style={{
        height: compact ? 38 : 40,
        padding: active ? (compact ? "0 16px" : "0 18px") : (compact ? "0 14px" : "0 16px"),
        borderRadius: "var(--r-full)",
        border: "1px solid " + (active ? "var(--brand-border)" : "transparent"),
        background: active ? "var(--brand-bg)" : hovered ? "var(--bg-hover)" : "transparent",
        color: active ? "var(--brand)" : hovered ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: compact ? 13 : 14,
        fontWeight: active ? 700 : 600,
        letterSpacing: "-0.01em",
        transition: "background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s",
        whiteSpace: "nowrap",
        boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function SearchTrigger({ compact, label, shortcut, onClick }) {
  if (compact) {
    return (
      <ButtonUtility
        icon={<MagnifyingGlass size={16} />}
        variant="default"
        size="header"
        onClick={onClick}
        title={label}
        sx={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-full)",
          border: "1px solid var(--border-light)",
          background: "var(--bg-page)",
          color: "var(--text-secondary)",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 42,
        minWidth: 224,
        padding: "0 10px 0 12px",
        borderRadius: "var(--r-full)",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        fontFamily: "inherit",
      }}
    >
      <span style={{
        width: 24,
        height: 24,
        borderRadius: "var(--r-full)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: "var(--text-faint)",
        flexShrink: 0,
      }}>
        <MagnifyingGlass size={14} />
      </span>
      <span style={{
        flex: 1,
        minWidth: 0,
        textAlign: "left",
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {label}
      </span>
      <span style={{
        height: 24,
        padding: "0 8px",
        borderRadius: "var(--r-full)",
        border: "1px solid var(--border-light)",
        background: "var(--bg-page)",
        color: "var(--text-faint)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.01em",
        flexShrink: 0,
      }}>
        {shortcut}
      </span>
    </button>
  );
}

function MarketplaceYearPill({ cfg, setCfg, marketplaceProj, effectiveViewYear, lk }) {
  if (!marketplaceProj || !marketplaceProj.years || !marketplaceProj.years.length) return null;
  var rawYear = cfg && cfg.viewYear;
  // Highlight: use effective year if computed upstream, else raw value
  var viewYear = effectiveViewYear != null ? effectiveViewYear : rawYear;
  function set(y) {
    if (!setCfg) return;
    setCfg(function (prev) { return Object.assign({}, prev, { viewYear: y }); });
  }
  var options = [];
  marketplaceProj.years.forEach(function (_, i) {
    options.push({ value: i + 1, label: (lk === "fr" ? "A" : "Y") + (i + 1) });
  });
  options.push({ value: null, label: lk === "fr" ? "Reg." : "SS" });
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 8px", borderRadius: "var(--r-full)",
      background: "var(--brand-bg)", border: "1px solid var(--brand)",
    }} title={lk === "fr" ? "Vue business plan (année projetée ou régime stable)" : "Business plan view (projected year or steady state)"}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.04em" }}>BP</span>
      {options.map(function (o) {
        var active = (o.value === viewYear) || (!o.value && !viewYear);
        return (
          <button key={String(o.value)} type="button" onClick={function () { set(o.value); }}
            style={{
              padding: "2px 8px", fontSize: 11, fontWeight: 600,
              border: "none", borderRadius: "var(--r-full)",
              background: active ? "var(--brand)" : "transparent",
              color: active ? "white" : "var(--brand)",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.12s",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AppHeader({ tab, setTab, activeModule, onOpenSearch, onOpenShare, onOpenViewerShare, onViewAll, isViewer, cfg, setCfg, marketplaceProj, effectiveViewYear }) {
  var { lang } = useLang();
  var t = useT();
  var glossary = useGlossary();
  var bp = useBreakpoint();
  var lk = lang === "en" ? "en" : "fr";
  var isTablet = bp.isTablet;
  var isCompact = bp.downXl;
  var shortcutLabel = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd K" : "Ctrl K";
  var searchLabel = lk === "fr" ? "Rechercher" : "Search";

  if (bp.isMobile) return null;

  return (
    <div style={{
      width: "calc(100% + (var(--page-px) * 2))",
      marginLeft: "calc(var(--page-px) * -1)",
      marginRight: "calc(var(--page-px) * -1)",
      marginBottom: "var(--gap-lg)",
      padding: "0 var(--page-px) 14px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--sp-3)",
        minHeight: 60,
        padding: isTablet ? "10px 12px" : "10px 14px",
        borderRadius: "var(--r-xl)",
        flexWrap: isTablet ? "wrap" : "nowrap",
        minWidth: 0,
        ...RAIL_SURFACE,
      }}>
        <nav
          aria-label={lk === "fr" ? "Navigation principale" : "Primary navigation"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: isCompact ? "var(--sp-1)" : "var(--sp-2)",
            flexWrap: isTablet ? "nowrap" : "wrap",
            minWidth: 0,
            overflowX: isTablet ? "auto" : "visible",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {(function () {
            var hidden = (cfg && cfg.hiddenTabs) || [];
            var hiddenSet = {};
            hidden.forEach(function (h) { hiddenSet[h] = true; });
            return MODULES.filter(function (module) {
              var entries = MODULE_ENTRY_TABS[module.id];
              if (!entries) return true; // core always shown
              return entries.some(function (t) { return !hiddenSet[t]; });
            }).map(function (module) {
              return (
                <HeaderNavItem
                  key={module.id}
                  active={isModuleActive(module.id, tab, activeModule)}
                  label={module.label[lk]}
                  compact={isCompact}
                  onClick={function () { setTab(module.tab); }}
                />
              );
            });
          })()}
        </nav>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          marginLeft: "auto",
          flexShrink: 0,
          flexWrap: isTablet ? "wrap" : "nowrap",
          justifyContent: isTablet ? "space-between" : "flex-end",
          width: isTablet ? "100%" : "auto",
        }}>
          <MarketplaceYearPill cfg={cfg} setCfg={setCfg} marketplaceProj={marketplaceProj} effectiveViewYear={effectiveViewYear} lk={lk} />
          <SearchTrigger
            compact={isCompact}
            label={searchLabel}
            shortcut={shortcutLabel}
            onClick={onOpenSearch}
          />
          <CollabBar
            embedded={true}
            onViewAll={onViewAll}
            currentTab={tab}
            tabLabels={t.tabs}
            showShare={false}
            showSupport={false}
          />
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-1)",
            paddingLeft: "var(--sp-2)",
            borderLeft: "1px solid var(--border-light)",
          }}>
            {!isViewer && onOpenViewerShare ? (
              <ButtonUtility
                icon={<QrCode size={16} />}
                variant="default"
                size="header"
                onClick={onOpenViewerShare}
                title={lk === "fr" ? "Partager en lecture seule" : "Share read-only"}
                sx={{
                  borderRadius: "var(--r-full)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "1px solid transparent",
                }}
              />
            ) : null}
            {!isViewer ? (
              <ButtonUtility
                icon={<ShareNetwork size={16} />}
                variant="default"
                size="header"
                onClick={onOpenShare}
                title={lk === "fr" ? "Partager" : "Share"}
                sx={{
                  borderRadius: "var(--r-full)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "1px solid transparent",
                }}
              />
            ) : null}
            <ButtonUtility
              icon={<Lifebuoy size={16} />}
              variant="default"
              size="header"
              onClick={function () { glossary.open(null); }}
              title={lk === "fr" ? "Aide" : "Help"}
              sx={{
                borderRadius: "var(--r-full)",
                color: "var(--text-secondary)",
                background: "transparent",
                border: "1px solid transparent",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
