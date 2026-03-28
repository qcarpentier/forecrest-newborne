import { useState } from "react";
import { ShieldCheck, ChartBar, Users, HardDrives, ClockCounterClockwise, Gear, ArrowLeft, ChartLine, CurrencyCircleDollar, Pulse } from "@phosphor-icons/react";
import { useT } from "../context/useLang";

var NAV_ITEMS = [
  { id: "overview", icon: ChartBar },
  { id: "users", icon: Users },
  { id: "workspaces", icon: HardDrives },
  { id: "engagement", icon: Pulse },
  { id: "subscriptions", icon: CurrencyCircleDollar },
  { id: "revenue", icon: ChartLine },
  { id: "activity", icon: ClockCounterClockwise },
  { id: "system", icon: Gear },
];

function NavItem({ icon, label, active, onClick }) {
  var Icon = icon;
  var [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={function () { setHovered(true); }}
      onMouseLeave={function () { setHovered(false); }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", height: 40, padding: "0 12px",
        border: "none", borderRadius: 8,
        background: active ? "var(--brand-bg)" : hovered ? "var(--bg-hover)" : "transparent",
        cursor: "pointer", textAlign: "left", transition: "background 0.1s",
        fontFamily: "inherit",
      }}
    >
      <Icon size={18} weight={active ? "fill" : "regular"} color={active ? "var(--brand)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? "var(--brand)" : "var(--text-secondary)" }}>
        {label}
      </span>
    </button>
  );
}

export default function AdminSidebar({ section, setSection, onBack }) {
  var t = useT().admin || {};

  var labels = {
    overview: "Vue d'ensemble",
    users: "Comptes",
    workspaces: "Espaces de travail",
    engagement: "Engagement",
    subscriptions: "Abonnements",
    revenue: "Revenus",
    activity: "Journal",
    system: "Infrastructure",
  };

  return (
    <aside style={{
      width: 272,
      background: "var(--bg-card)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "16px 16px",
      flexShrink: 0,
      height: "calc(100vh - 36px)",
      overflowX: "clip",
    }}>
      {/* Header: logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "4px 8px", marginBottom: 16,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck size={15} weight="fill" color="#fff" />
        </div>
        <span style={{
          fontSize: 18, fontWeight: 800, color: "var(--text-primary)",
          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          letterSpacing: "-0.02em", lineHeight: 1,
        }}>
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(function (item) {
          return (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={labels[item.id]}
              active={section === item.id}
              onClick={function () { setSection(item.id); }}
            />
          );
        })}
      </nav>

      {/* Footer: back to dashboard */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", height: 40, padding: "0 12px",
            border: "none", borderRadius: 8,
            background: "transparent", cursor: "pointer",
            fontFamily: "inherit", transition: "background 0.1s",
          }}
          onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
        >
          <ArrowLeft size={16} color="var(--text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
            {t.admin_back || "Forecrest"}
          </span>
        </button>
      </div>
    </aside>
  );
}
