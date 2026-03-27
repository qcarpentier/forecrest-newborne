import { useState } from "react";
import { Card, PageLayout } from "../../components";
import { InfoTip } from "../../components/Tooltip";
import { ShieldCheck, Handshake, Scales, SignOut, Lock } from "@phosphor-icons/react";
import { useT } from "../../context";

var SECTIONS = [
  {
    key: "transfer",
    icon: function () { return <Handshake size={18} weight="bold" />; },
    clauses: ["preemption", "approval", "lockup"],
  },
  {
    key: "governance",
    icon: function () { return <Scales size={18} weight="bold" />; },
    clauses: ["board", "reserved", "info"],
  },
  {
    key: "protection",
    icon: function () { return <ShieldCheck size={18} weight="bold" />; },
    clauses: ["tag_along", "drag_along", "antidilution", "liquidation_pref", "vesting"],
  },
  {
    key: "exit",
    icon: function () { return <SignOut size={18} weight="bold" />; },
    clauses: ["deadlock", "good_bad_leaver"],
  },
  {
    key: "noncompete",
    icon: function () { return <Lock size={18} weight="bold" />; },
    clauses: ["noncompete", "confidentiality"],
  },
];

var ALL_CLAUSES = [];
SECTIONS.forEach(function (s) {
  s.clauses.forEach(function (c) { ALL_CLAUSES.push(c); });
});

export default function PactPage({ cfg, setCfg }) {
  var t = useT().pact;

  var pact = (cfg && cfg.pact) || {};

  function toggle(clauseKey) {
    var next = Object.assign({}, pact, { [clauseKey]: !pact[clauseKey] });
    setCfg(function (prev) { return Object.assign({}, prev, { pact: next }); });
  }

  var enabledCount = ALL_CLAUSES.filter(function (c) { return pact[c]; }).length;
  var totalCount = ALL_CLAUSES.length;
  var coveragePct = totalCount > 0 ? enabledCount / totalCount : 0;

  return (
    <PageLayout title={t.title} subtitle={t.subtitle} icon={ShieldCheck} iconColor="#E8431A">

      {/* Coverage bar */}
      <Card sx={{ marginBottom: "var(--gap-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-3)" }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{t.coverage}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "var(--sp-2)" }}>
              {enabledCount}/{totalCount} {t.coverage_sub}
            </span>
          </div>
          <span style={{
            fontSize: 20, fontWeight: 700,
            color: coveragePct >= 0.8 ? "var(--color-success)" : coveragePct >= 0.5 ? "var(--color-warning)" : "var(--text-muted)",
          }}>
            {Math.round(coveragePct * 100)}%
          </span>
        </div>
        <div style={{ height: 8, background: "var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: coveragePct * 100 + "%",
            background: coveragePct >= 0.8 ? "var(--color-success)" : coveragePct >= 0.5 ? "var(--color-warning)" : "var(--brand)",
            borderRadius: 8, transition: "width 0.4s ease",
          }} />
        </div>
      </Card>

      {/* Sections */}
      {SECTIONS.map(function (section) {
        var Icon = section.icon;
        var sectionEnabled = section.clauses.filter(function (c) { return pact[c]; }).length;

        return (
          <section key={section.key} style={{ marginBottom: "var(--sp-8)" }}>
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                <span style={{ color: "var(--text-muted)", display: "flex" }}><Icon /></span>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  {t["section_" + section.key]}
                </h2>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                  background: sectionEnabled === section.clauses.length ? "var(--color-success-bg)" : "var(--bg-accordion)",
                  color: sectionEnabled === section.clauses.length ? "var(--color-success)" : "var(--text-faint)",
                  border: "1px solid " + (sectionEnabled === section.clauses.length ? "var(--color-success-border)" : "var(--border-light)"),
                }}>
                  {sectionEnabled}/{section.clauses.length}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                {t["section_" + section.key + "_sub"]}
              </p>
            </div>

            <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
              {section.clauses.map(function (clauseKey) {
                var isEnabled = !!pact[clauseKey];
                return (
                  <Card key={clauseKey} sx={{
                    borderLeft: isEnabled ? "3px solid var(--color-success)" : "3px solid var(--border)",
                    transition: "border-color 0.2s, background 0.15s",
                    cursor: "pointer",
                    userSelect: "none",
                  }} onClick={function () { toggle(clauseKey); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--sp-3)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                            {t["clause_" + clauseKey]}
                          </span>
                          <span onClick={function (e) { e.stopPropagation(); }}>
                            <InfoTip tip={t["clause_" + clauseKey + "_tip"]} width={300} />
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                          {t["clause_" + clauseKey + "_desc"]}
                        </p>
                      </div>

                      {/* Toggle */}
                      <div
                        style={{
                          flexShrink: 0, width: 44, height: 24, borderRadius: 12,
                          background: isEnabled ? "var(--color-success)" : "var(--border-strong)",
                          position: "relative", transition: "background 0.2s",
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: "white",
                          position: "absolute", top: 3,
                          left: isEnabled ? 23 : 3,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px var(--shadow)",
                        }} />
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{ marginTop: "var(--sp-3)" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--r-full)",
                        background: isEnabled ? "var(--color-success-bg)" : "var(--bg-accordion)",
                        color: isEnabled ? "var(--color-success)" : "var(--text-faint)",
                        border: "1px solid " + (isEnabled ? "var(--color-success-border)" : "var(--border-light)"),
                      }}>
                        {isEnabled ? t.status_covered : t.status_missing}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </PageLayout>
  );
}
