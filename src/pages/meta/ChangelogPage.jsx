import { useState, useMemo, useRef, useEffect } from "react";
import { PageLayout, Card } from "../../components";
import { useT, useDevMode } from "../../context";
import { CHANGELOG } from "../../constants/changelog";
import { Rocket, Bug, Wrench, Warning, CaretDown, Check } from "@phosphor-icons/react";

var PAGE_SIZE = 5;

var TYPE_CONFIG = {
  feature:     { icon: Rocket,  color: "var(--color-success)",  bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.25)" },
  fix:         { icon: Bug,     color: "var(--color-error)",    bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)" },
  improvement: { icon: Wrench,  color: "var(--color-info)",     bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.25)" },
  breaking:    { icon: Warning, color: "var(--color-warning)",  bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
};

var ALL_TYPES = ["feature", "fix", "improvement", "breaking"];

function TypeBadge({ type, label }) {
  var cfg = TYPE_CONFIG[type] || TYPE_CONFIG.improvement;
  var Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: "var(--r-xl)",
      fontSize: 11, fontWeight: 600, lineHeight: 1,
      background: cfg.bg, color: cfg.color,
      border: "1px solid " + cfg.border,
      whiteSpace: "nowrap",
    }}>
      <Icon size={12} weight="bold" />
      {label}
    </span>
  );
}

/* Dropdown button — mirrors Header language switcher pattern */
function DropdownBtn({ label, children, active }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function () {
    if (!open) return;
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return function () { document.removeEventListener("mousedown", onClick); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={function () { setOpen(function (v) { return !v; }); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: "var(--r-md)",
          fontSize: 12, fontWeight: 500,
          background: active ? "var(--brand-bg)" : "var(--bg-card)",
          color: active ? "var(--brand)" : "var(--text-secondary)",
          border: open ? "1px solid var(--brand)" : active ? "1px solid var(--brand)" : "1px solid var(--border)",
          cursor: "pointer",
          boxShadow: open ? "var(--focus-ring)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {label}
        <CaretDown size={11} weight="bold" style={{
          transition: "transform 0.15s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </button>
      {open ? (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-dropdown)",
          padding: "var(--sp-1)", minWidth: 160, zIndex: 200,
          maxHeight: 260, overflowY: "auto",
        }} className="custom-scroll">
          {children(function () { setOpen(false); })}
        </div>
      ) : null}
    </div>
  );
}

function DropdownItem({ label, active, onClick, icon: Icon, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "var(--sp-2)",
        width: "100%", padding: "var(--sp-2) var(--sp-3)",
        border: "none", borderRadius: "var(--r-md)",
        background: active ? "var(--brand-bg)" : "transparent",
        fontSize: 12, fontWeight: active ? 600 : 400,
        color: active ? "var(--brand)" : "var(--text-primary)",
        cursor: "pointer", textAlign: "left",
      }}
    >
      {Icon ? <Icon size={13} weight="bold" color={color || "var(--text-muted)"} style={{ flexShrink: 0 }} /> : null}
      <span style={{ flex: 1 }}>{label}</span>
      {active ? <Check size={12} weight="bold" color="var(--brand)" /> : null}
    </button>
  );
}

function TimelineDot({ isLatest }) {
  return (
    <div style={{
      width: 12, height: 12, borderRadius: "50%",
      background: isLatest ? "var(--brand)" : "var(--border-strong)",
      border: "2px solid var(--bg-card)",
      boxShadow: isLatest ? "0 0 0 3px var(--brand-alpha)" : "none",
      flexShrink: 0, zIndex: 1,
    }} />
  );
}

export default function ChangelogPage() {
  var tAll = useT();
  var t = tAll.changelog || {};
  var typeLabels = t.types || {};
  var devCtx = useDevMode();
  var devOn = devCtx && devCtx.devMode;

  var SIDEBAR_LIMIT = 5;
  var [filterVersion, setFilterVersion] = useState("");
  var [filterType, setFilterType] = useState("");
  var [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  var versionOptions = useMemo(function () {
    return CHANGELOG.map(function (r) { return r.version; });
  }, []);

  var filtered = useMemo(function () {
    var result = CHANGELOG;
    if (filterVersion) {
      result = result.filter(function (r) { return r.version === filterVersion; });
    }
    if (filterType) {
      result = result.map(function (r) {
        var filteredEntries = r.entries.filter(function (e) { return e.type === filterType; });
        if (filteredEntries.length === 0) return null;
        return { ...r, entries: filteredEntries };
      }).filter(Boolean);
    }
    return result;
  }, [filterVersion, filterType]);

  var totalCount = filtered.length;
  var visible = filtered.slice(0, visibleCount);
  var hasMore = visibleCount < totalCount;

  var entries = useMemo(function () {
    return visible.map(function (release, i) {
      return {
        ...release,
        isLatest: i === 0 && !filterVersion && !filterType,
        entries: release.entries.map(function (e) {
          return {
            ...e,
            label: typeLabels[e.type] || e.type,
            text: t[e.key] || e.key,
          };
        }),
      };
    });
  }, [visible, t, typeLabels, filterVersion, filterType]);

  var hasFilters = filterVersion || filterType;
  var versionLabel = filterVersion ? "v" + filterVersion : (t.filter_all || "Toutes");
  var typeLabel = filterType ? (typeLabels[filterType] || filterType) : (t.filter_all || "Toutes");

  /* ── Sidebar stats ── */
  var stats = useMemo(function () {
    var byType = { feature: 0, fix: 0, improvement: 0, breaking: 0 };
    var total = 0;
    CHANGELOG.forEach(function (r) {
      r.entries.forEach(function (e) {
        if (byType[e.type] !== undefined) byType[e.type]++;
        total++;
      });
    });
    return { byType: byType, total: total, versions: CHANGELOG.length };
  }, []);

  return (
    <PageLayout title={t.title || "Notes de version"} subtitle={t.subtitle || "Release history and updates"}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "var(--sp-6)" }} className="resp-grid-changelog">
      <div>

        {/* Filters bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
          {/* Version dropdown */}
          <DropdownBtn label={<><span style={{ fontWeight: 600 }}>{t.filter_version || "Version"}</span> <span style={{ opacity: 0.7 }}>{versionLabel}</span></>} active={!!filterVersion}>
            {function (close) {
              return (
                <>
                  <DropdownItem
                    label={t.filter_all || "Toutes"}
                    active={!filterVersion}
                    onClick={function () { setFilterVersion(""); setVisibleCount(PAGE_SIZE); close(); }}
                  />
                  {versionOptions.map(function (v) {
                    return (
                      <DropdownItem
                        key={v}
                        label={"v" + v}
                        active={filterVersion === v}
                        onClick={function () { setFilterVersion(filterVersion === v ? "" : v); setVisibleCount(PAGE_SIZE); close(); }}
                      />
                    );
                  })}
                </>
              );
            }}
          </DropdownBtn>

          {/* Type dropdown */}
          <DropdownBtn label={<><span style={{ fontWeight: 600 }}>{t.filter_type || "Type"}</span> <span style={{ opacity: 0.7 }}>{typeLabel}</span></>} active={!!filterType}>
            {function (close) {
              return (
                <>
                  <DropdownItem
                    label={t.filter_all || "Toutes"}
                    active={!filterType}
                    onClick={function () { setFilterType(""); setVisibleCount(PAGE_SIZE); close(); }}
                  />
                  {ALL_TYPES.map(function (type) {
                    var cfg = TYPE_CONFIG[type];
                    return (
                      <DropdownItem
                        key={type}
                        label={typeLabels[type] || type}
                        icon={cfg.icon}
                        color={cfg.color}
                        active={filterType === type}
                        onClick={function () { setFilterType(filterType === type ? "" : type); setVisibleCount(PAGE_SIZE); close(); }}
                      />
                    );
                  })}
                </>
              );
            }}
          </DropdownBtn>

          {/* Result count */}
          {hasFilters ? (
            <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 4 }}>
              {totalCount} {totalCount === 1 ? (t.result_single || "version") : (t.result_plural || "versions")}
              {filterType ? " · " + filtered.reduce(function (s, r) { return s + r.entries.length; }, 0) + " " + (t.entries_label || "entrées") : ""}
            </span>
          ) : null}
        </div>

        {/* Timeline */}
        <div>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--sp-6)", color: "var(--text-faint)", fontSize: 13 }}>
              {t.no_results || "Aucun résultat pour ces filtres."}
            </div>
          ) : null}

          {entries.map(function (release, ri) {
            return (
              <div key={release.version} style={{ display: "flex", gap: 16, position: "relative" }}>
                {/* Timeline line + dot */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  width: 12, flexShrink: 0, position: "relative",
                }}>
                  <TimelineDot isLatest={release.isLatest} />
                  {ri < entries.length - 1 ? (
                    <div style={{
                      width: 2, flex: 1, background: "var(--border)",
                      marginTop: -1,
                    }} />
                  ) : null}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: ri < entries.length - 1 ? "var(--sp-4)" : 0 }}>
                  {/* Version header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--sp-2)", marginTop: -2 }}>
                    <span style={{
                      fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}>
                      v{release.version}
                    </span>
                    {release.isLatest ? (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "1px 6px",
                        borderRadius: "var(--r-xl)", background: "var(--brand)",
                        color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {t.latest || "latest"}
                      </span>
                    ) : null}
                    <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "auto" }}>
                      {release.date}
                    </span>
                  </div>

                  {/* Entries card */}
                  <Card>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {release.entries.map(function (entry, ei) {
                        return (
                          <div key={ei} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "6px 0",
                            borderBottom: ei < release.entries.length - 1 ? "1px solid var(--border-light)" : "none",
                          }}>
                            <TypeBadge type={entry.type} label={entry.label} />
                            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                              {entry.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {hasMore ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "var(--sp-4)" }}>
              <button
                onClick={function () { setVisibleCount(function (c) { return c + PAGE_SIZE; }); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 20px", borderRadius: "var(--r-lg)",
                  fontSize: 13, fontWeight: 500,
                  background: "var(--bg-card)", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <CaretDown size={14} />
                {t.load_more || "Voir plus"} ({totalCount - visibleCount} {t.remaining || "restantes"})
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside>
        <div style={{ position: "sticky", top: devOn ? 120 : 88 }}>
        {/* Quick nav */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-faint)", marginBottom: "var(--sp-2)" }}>
            {t.sidebar_versions || "Versions"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {CHANGELOG.slice(0, SIDEBAR_LIMIT).map(function (r) {
              var isActive = filterVersion === r.version;
              return (
                <button
                  key={r.version}
                  onClick={function () { setFilterVersion(isActive ? "" : r.version); setVisibleCount(PAGE_SIZE); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "4px 8px", border: "none", borderRadius: "var(--r-sm)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    cursor: "pointer", fontSize: 12, textAlign: "left",
                    color: isActive ? "var(--brand)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    transition: "background 0.15s",
                  }}
                >
                  <span>v{r.version}</span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{r.date}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Type breakdown */}
        <div style={{ marginTop: "var(--sp-3)" }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-faint)", marginBottom: "var(--sp-3)" }}>
              {t.sidebar_summary || "Résumé"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ALL_TYPES.map(function (type) {
                var cfg = TYPE_CONFIG[type];
                var Icon = cfg.icon;
                var count = stats.byType[type];
                return (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={13} weight="bold" color={cfg.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>
                      {typeLabels[type] || type}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: cfg.color,
                      background: cfg.bg, padding: "1px 6px", borderRadius: "var(--r-sm)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)",
              borderTop: "1px solid var(--border-light)",
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "var(--text-faint)",
            }}>
              <span>{stats.versions} {t.sidebar_versions_count || "versions"}</span>
              <span>{stats.total} {t.sidebar_entries_count || "entrées"}</span>
            </div>
          </Card>
        </div>
        </div>
      </aside>
      </div>
    </PageLayout>
  );
}
