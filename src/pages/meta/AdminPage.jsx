import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, HardDrives, ShieldCheck, Trash, ArrowsClockwise, Clock, UserCircle, Database, PencilSimple, Copy, Check } from "@phosphor-icons/react";
import { KpiCard, Badge, DataTable, Button, PageLayout, SearchInput, FilterDropdown, ButtonUtility, Modal, ModalBody, ModalFooter, DonutChart, PaletteToggle } from "../../components";
import Sparkline from "../../components/Sparkline";
import { getChartPalette } from "../../constants/colors";
import { useAuth } from "../../context/useAuth";
import { useT } from "../../context/useLang";
import { getSupabase } from "../../lib/supabase";
import { VERSION, RELEASE_DATE } from "../../constants/config";
import { isAdminEnabled, hasCloudConfig, getStorageMode } from "../../lib/supabase";

/* ── Chart accent ── */

function formatDate(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

function SectionLabel({ title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{title}</div>
      {count != null ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", background: "var(--bg-accordion)", border: "1px solid var(--border-light)", padding: "2px 8px", borderRadius: "var(--r-full, 999px)" }}>{count}</span>
      ) : null}
      <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  var Icon = icon;
  return (
    <>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-accordion)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--sp-3)" }}>
        <Icon size={22} weight="duotone" color="var(--text-faint)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-faint)" }}>{desc}</div>
    </>
  );
}

/* ── Chart card wrapper (matches RevenueStreamsPage pattern) ── */
function ChartCard({ title, trailing, children }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {title}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

/* ── Tabs component ── */
function TabList({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--sp-6)" }}>
      {tabs.map(function (tab) {
        var isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={function () { onChange(tab.id); }} style={{
            padding: "var(--sp-3) var(--sp-5)",
            border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
            background: "transparent", cursor: "pointer",
            fontSize: 14, fontWeight: isActive ? 600 : 400,
            color: isActive ? "var(--brand)" : "var(--text-muted)",
            marginBottom: -2, transition: "0.15s", fontFamily: "inherit",
          }}>
            {tab.label}
            {tab.count != null ? <span style={{ fontSize: 11, marginLeft: 6, color: "var(--text-faint)" }}>({tab.count})</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function CopyBtn({ text, size }) {
  var s = size || 28;
  var [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(function () {
      setCopied(true);
      setTimeout(function () { setCopied(false); }, 1500);
    });
  }
  return (
    <button onClick={handleCopy} title={copied ? "Copié !" : "Copier"} style={{
      flexShrink: 0, width: s, height: s,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: copied ? "1px solid var(--color-success-border)" : "1px solid var(--border)",
      borderRadius: "var(--r-sm)",
      background: copied ? "var(--color-success-bg)" : "transparent",
      cursor: "pointer",
      color: copied ? "var(--color-success)" : "var(--text-faint)",
      transition: "all 0.2s",
    }}>
      {copied ? <Check size={s === 32 ? 14 : 13} weight="bold" /> : <Copy size={s === 32 ? 14 : 13} />}
    </button>
  );
}

export default function AdminPage({ section }) {
  var t = useT().admin || {};
  var auth = useAuth();
  var [profiles, setProfiles] = useState([]);
  var [workspaces, setWorkspaces] = useState([]);
  var [loading, setLoading] = useState(true);
  var [userSearch, setUserSearch] = useState("");
  var [wsSearch, setWsSearch] = useState("");
  var [actSearch, setActSearch] = useState("");
  var [actTypeFilter, setActTypeFilter] = useState("all");
  var [actDateFilter, setActDateFilter] = useState("all");
  var [subTab, setSubTab] = useState("active");
  var [subSearch, setSubSearch] = useState("");
  var [subPlanFilter, setSubPlanFilter] = useState("all");
  var [userTab, setUserTab] = useState("founder");
  var [paletteMode, setPaletteMode] = useState("brand");

  /* Default accent (brand coral) */
  var accentRgb = [232, 67, 26];
  var accentHex = "#E8431A";
  var chartPalette = getChartPalette(paletteMode, accentRgb, accentHex);

  /* ── Edit user modal ── */
  var [editUser, setEditUser] = useState(null);
  var [editName, setEditName] = useState("");
  var [editRole, setEditRole] = useState("user");
  var [editSaving, setEditSaving] = useState(false);

  function openEditUser(profile) { setEditUser(profile); setEditName(profile.display_name || ""); setEditRole(profile.role || "user"); }
  function handleSaveUser() {
    if (!editUser) return;
    var sb = getSupabase(); if (!sb) return;
    setEditSaving(true);
    sb.from("profiles").update({ display_name: editName.trim(), role: editRole }).eq("id", editUser.id)
      .then(function () { setEditSaving(false); setEditUser(null); fetchData(); })
      .catch(function () { setEditSaving(false); });
  }

  var fetchData = useCallback(function () {
    var sb = getSupabase(); if (!sb) return;
    setLoading(true);
    Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("workspaces").select("id, user_id, name, schema_version, created_at, updated_at").order("updated_at", { ascending: false }),
    ]).then(function (results) {
      if (results[0].data) setProfiles(results[0].data);
      if (results[1].data) setWorkspaces(results[1].data);
      setLoading(false);
    }).catch(function () { setLoading(false); });
  }, []);

  useEffect(function () { fetchData(); }, [fetchData]);

  /* ── Computed stats ── */
  var totalUsers = profiles.length;
  var totalWorkspaces = workspaces.length;
  var adminCount = profiles.filter(function (p) { return p.role === "admin"; }).length;
  var founderCount = profiles.filter(function (p) { return !p.role || p.role === "user" || p.role === "founder"; }).length;
  var accountantCount = profiles.filter(function (p) { return p.role === "accountant"; }).length;
  var advisorCount = profiles.filter(function (p) { return p.role === "advisor"; }).length;
  var activeUsers = (function () { var ids = {}; workspaces.forEach(function (w) { if (w.updated_at && (Date.now() - new Date(w.updated_at).getTime()) < 30 * 86400000) ids[w.user_id] = true; }); return Object.keys(ids).length; })();

  /* ── Signup sparkline (12 weeks) ── */
  var signupSparkline = useMemo(function () {
    var weeks = [];
    for (var i = 0; i < 12; i++) weeks.push(0);
    var now = Date.now();
    profiles.forEach(function (p) {
      if (!p.created_at) return;
      var age = Math.floor((now - new Date(p.created_at).getTime()) / (7 * 86400000));
      if (age >= 0 && age < 12) weeks[11 - age]++;
    });
    return weeks;
  }, [profiles]);

  /* ── Activity sparkline (12 weeks) ── */
  var activitySparkline = useMemo(function () {
    var weeks = [];
    for (var i = 0; i < 12; i++) weeks.push(0);
    var now = Date.now();
    workspaces.forEach(function (w) {
      if (!w.updated_at) return;
      var age = Math.floor((now - new Date(w.updated_at).getTime()) / (7 * 86400000));
      if (age >= 0 && age < 12) weeks[11 - age]++;
    });
    return weeks;
  }, [workspaces]);

  /* ── Role distribution for donut ── */
  var roleDistribution = useMemo(function () {
    return { admin: adminCount, founder: founderCount, accountant: accountantCount, advisor: advisorCount };
  }, [adminCount, founderCount, accountantCount, advisorCount]);

  var roleLabels = { admin: "Admin", founder: "Entrepreneur", accountant: "Comptable", advisor: "Accompagnateur" };

  /* ── Activity log ── */
  var activityLog = useMemo(function () {
    var events = [];
    profiles.forEach(function (p) { events.push({ type: "signup", email: p.email, date: p.created_at, detail: "Inscription" }); });
    workspaces.forEach(function (w) {
      var owner = profiles.find(function (p) { return p.id === w.user_id; });
      var email = owner ? owner.email : "\u2014";
      if (w.created_at) events.push({ type: "workspace", email: email, date: w.created_at, detail: "Espace cr\u00e9\u00e9 : " + (w.name || "Sans nom") });
      if (w.updated_at && w.updated_at !== w.created_at) events.push({ type: "update", email: email, date: w.updated_at, detail: "Mise \u00e0 jour : " + (w.name || "Sans nom") });
    });
    events.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return events.slice(0, 50);
  }, [profiles, workspaces]);

  function handleDeleteUser(profileId) {
    if (!window.confirm("Supprimer ce compte et toutes ses donn\u00e9es ?")) return;
    var sb = getSupabase(); if (!sb) return;
    sb.from("workspaces").delete().eq("user_id", profileId)
      .then(function () { return sb.from("profiles").delete().eq("id", profileId); })
      .then(function () { fetchData(); });
  }


  /* ── Filtered users by tab + search ── */
  var filteredByTab = profiles.filter(function (p) {
    if (userTab === "founder") return !p.role || p.role === "user" || p.role === "founder";
    return p.role === userTab;
  });

  var filteredProfiles = filteredByTab.filter(function (p) {
    if (userSearch.trim()) {
      var q = userSearch.trim().toLowerCase();
      return (p.email || "").toLowerCase().indexOf(q) >= 0 || (p.display_name || "").toLowerCase().indexOf(q) >= 0;
    }
    return true;
  });

  var filteredWorkspaces = workspaces.filter(function (w) {
    if (!wsSearch.trim()) return true;
    var q = wsSearch.trim().toLowerCase();
    var owner = profiles.find(function (p) { return p.id === w.user_id; });
    return (w.name || "").toLowerCase().indexOf(q) >= 0 || (owner && owner.email || "").toLowerCase().indexOf(q) >= 0;
  });

  /* ── Toolbars ── */
  var userToolbar = (
    <>
      <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Rechercher..." />
    </>
  );

  var wsToolbar = (
    <>
      <SearchInput value={wsSearch} onChange={setWsSearch} placeholder="Rechercher un espace..." />
    </>
  );

  /* ── Filtered activity ── */
  var filteredActivity = activityLog.filter(function (ev) {
    if (actTypeFilter !== "all" && ev.type !== actTypeFilter) return false;
    if (actDateFilter !== "all") {
      var age = Date.now() - new Date(ev.date).getTime();
      if (actDateFilter === "today" && age > 86400000) return false;
      if (actDateFilter === "week" && age > 7 * 86400000) return false;
      if (actDateFilter === "month" && age > 30 * 86400000) return false;
    }
    if (actSearch.trim()) {
      var q = actSearch.trim().toLowerCase();
      return (ev.email || "").toLowerCase().indexOf(q) >= 0 || (ev.detail || "").toLowerCase().indexOf(q) >= 0;
    }
    return true;
  });

  var actToolbar = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={actSearch} onChange={setActSearch} placeholder="Rechercher..." />
        <FilterDropdown
          value={actTypeFilter}
          onChange={setActTypeFilter}
          options={[
            { value: "all", label: "Toutes les actions" },
            { value: "signup", label: "Inscriptions" },
            { value: "workspace", label: "Nouveaux espaces" },
            { value: "update", label: "Mises \u00e0 jour" },
          ]}
        />
        <FilterDropdown
          value={actDateFilter}
          onChange={setActDateFilter}
          options={[
            { value: "all", label: "Toutes les dates" },
            { value: "today", label: "Aujourd'hui" },
            { value: "week", label: "Cette semaine" },
            { value: "month", label: "Ce mois" },
          ]}
        />
      </div>
    </>
  );

  var refreshBtn = (
    <Button color="tertiary" size="lg" onClick={fetchData} isLoading={loading} iconLeading={<ArrowsClockwise size={16} />}>
      Actualiser
    </Button>
  );

  /* ── Column defs ── */
  var userColumns = [
    { header: "Email", accessorKey: "email", cell: function (info) { return <span style={{ fontSize: 13, fontWeight: 500 }}>{info.getValue()}</span>; } },
    { header: "Utilisateur", accessorKey: "display_name", cell: function (info) { return <span style={{ fontSize: 13 }}>{info.getValue() || "\u2014"}</span>; } },
    { header: "Entreprise", id: "company", accessorFn: function (row) { return row.company || "\u2014"; }, cell: function (info) { return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{info.getValue()}</span>; } },
    { header: "Inscrit le", accessorKey: "created_at", cell: function (info) { return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{formatDate(info.getValue())}</span>; } },
    {
      header: "Actions", id: "actions", enableSorting: false,
      accessorFn: function (row) { return row.id; },
      cell: function (info) {
        var pid = info.getValue(); var row = info.row.original;
        var isSelf = auth.user && auth.user.id === pid;
        return (
          <div style={{ display: "flex", gap: "var(--sp-1)" }}>
            <ButtonUtility icon={<PencilSimple size={14} />} onClick={function () { openEditUser(row); }} title="Modifier" />
            <ButtonUtility icon={<Trash size={14} />} variant="danger" onClick={function () { handleDeleteUser(pid); }} disabled={isSelf} title="Supprimer" />
          </div>
        );
      },
    },
  ];

  var workspaceColumns = [
    { header: "Nom", accessorKey: "name", cell: function (info) { return <span style={{ fontSize: 13, fontWeight: 500 }}>{info.getValue()}</span>; } },
    { header: "Utilisateur", accessorKey: "user_id", cell: function (info) { var uid = info.getValue(); var profile = profiles.find(function (p) { return p.id === uid; }); return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{profile ? profile.email : "\u2014"}</span>; } },
    { header: "Modifi\u00e9 le", accessorKey: "updated_at", cell: function (info) { return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{formatDate(info.getValue())}</span>; } },
    { header: "Version", accessorKey: "schema_version", cell: function (info) { return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>v{info.getValue()}</span>; } },
  ];

  var activityColumns = [
    { header: "Date", accessorKey: "date", cell: function (info) { var d = info.getValue(); if (!d) return "\u2014"; return <span style={{ fontSize: 12, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{new Date(d).toLocaleDateString("fr-BE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>; } },
    { header: "Heure", id: "time", accessorKey: "date", enableSorting: false, cell: function (info) { var d = info.getValue(); if (!d) return "\u2014"; return <span style={{ fontSize: 12, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>{new Date(d).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>; } },
    { header: "Utilisateur", accessorKey: "email", cell: function (info) { return <span style={{ fontSize: 13 }}>{info.getValue()}</span>; } },
    { header: "Action", accessorKey: "detail", cell: function (info) { var row = info.row.original; var colors = { signup: "brand", workspace: "info", update: "gray" }; return (<div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}><Badge color={colors[row.type] || "gray"} size="sm">{row.type === "signup" ? "Inscription" : row.type === "workspace" ? "Nouveau" : "Mise \u00e0 jour"}</Badge><span style={{ fontSize: 13 }}>{info.getValue()}</span></div>); } },
  ];

  /* ── Page titles ── */
  var pageTitles = {
    overview: { title: "Administration", subtitle: "Vue d'ensemble de votre instance Forecrest." },
    users: { title: "Comptes", subtitle: "Gestion des comptes et des permissions." },
    workspaces: { title: "Espaces de travail", subtitle: "Tous les plans cr\u00e9\u00e9s par vos utilisateurs." },
    engagement: { title: "Engagement", subtitle: "Activit\u00e9 et r\u00e9tention des utilisateurs." },
    subscriptions: { title: "Abonnements", subtitle: "R\u00e9partition des plans et modules actifs." },
    revenue: { title: "Revenus", subtitle: "Suivi financier de la plateforme." },
    activity: { title: "Journal d'activit\u00e9", subtitle: "Historique des actions sur la plateforme." },
    system: { title: "Infrastructure", subtitle: "Configuration et sant\u00e9 de l'instance." },
  };
  var pg = pageTitles[section] || pageTitles.overview;

  return (
    <PageLayout title={pg.title} subtitle={pg.subtitle} actions={refreshBtn}>

      {/* ══════ Overview ══════ */}
      {section === "overview" ? (
        <>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="Comptes" value={totalUsers} />
            <KpiCard label="Espaces de travail" value={totalWorkspaces} />
            <KpiCard label="Administrateurs" value={adminCount} />
            <KpiCard label="Actifs les 30 derniers jours" value={activeUsers} />
          </div>

          {/* Charts row */}
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--sp-8)" }}>
            {/* Sparkline: signups over 12 weeks */}
            <ChartCard title="Inscriptions (12 semaines)">
              <div style={{ height: 80, display: "flex", alignItems: "center" }}>
                <Sparkline data={signupSparkline} color={accentHex} width={400} height={64} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-2)", fontSize: 11, color: "var(--text-faint)" }}>
                <span>12 sem.</span>
                <span>Cette semaine : {signupSparkline[11] || 0}</span>
              </div>
            </ChartCard>

            {/* Donut: modules payants */}
            <ChartCard title="Modules payants" trailing={<PaletteToggle value={paletteMode} onChange={setPaletteMode} accentRgb={accentRgb} />}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
                <DonutChart data={{ marketing: 0, production: 0, affiliation: 0 }} palette={chartPalette} size={100} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { key: "marketing", label: "Marketing", desc: "Acquisition & budget" },
                    { key: "production", label: "Production", desc: "Recettes & ingredients" },
                    { key: "affiliation", label: "Affiliation", desc: "Partenaires & commissions" },
                  ].map(function (mod, i) {
                    return (
                      <div key={mod.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: chartPalette[i], flexShrink: 0 }} />
                        <div>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{mod.label}</span>
                          <span style={{ color: "var(--text-faint)", marginLeft: 6 }}>0</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                    Disponible quand les modules seront actifs.
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          <SectionLabel title="Derniers comptes" count={Math.min(totalUsers, 10)} />
          <div style={{ marginBottom: "var(--sp-8)" }}>
            <DataTable data={profiles.slice(0, 10)} columns={userColumns.filter(function (c) { return c.id !== "actions"; })} footer={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{totalUsers} {totalUsers > 1 ? "comptes" : "compte"}</span>} emptyState={<EmptyState icon={UserCircle} title="Aucun compte" desc="Les comptes apparaitront ici." />} />
          </div>

          <SectionLabel title="Derniers espaces de travail" count={Math.min(totalWorkspaces, 10)} />
          <DataTable data={workspaces.slice(0, 10)} columns={workspaceColumns} footer={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{totalWorkspaces} {totalWorkspaces > 1 ? "espaces" : "espace"}</span>} emptyState={<EmptyState icon={Database} title="Aucun espace" desc="Les espaces de travail apparaitront ici." />} />
        </>
      ) : null}

      {/* ══════ Comptes ══════ */}
      {section === "users" ? (
        <>
          {/* KPIs */}
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="Entrepreneurs" value={founderCount} />
            <KpiCard label="Comptables" value={accountantCount} />
            <KpiCard label="Accompagnateurs" value={advisorCount} />
            <KpiCard label="Administrateurs" value={adminCount} />
          </div>

          {/* Charts */}
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <ChartCard title="Types de comptes" trailing={<PaletteToggle value={paletteMode} onChange={setPaletteMode} accentRgb={accentRgb} />}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
                <DonutChart data={totalUsers > 0 ? roleDistribution : {}} palette={chartPalette} size={90} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["admin", "founder", "accountant", "advisor"].map(function (key, i) {
                    var count = roleDistribution[key] || 0;
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: totalUsers > 0 ? chartPalette[i] : "var(--bg-hover)", flexShrink: 0 }} />
                        <span style={{ color: totalUsers > 0 ? "var(--text-secondary)" : "var(--text-faint)", fontWeight: 500 }}>{roleLabels[key]}</span>
                        <span style={{ color: "var(--text-faint)" }}>{totalUsers > 0 ? count : "\u2014"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Conversion">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                {[
                  { label: "Inscrits", value: totalUsers, pct: 100 },
                  { label: "Plan actif", value: activeUsers, pct: totalUsers > 0 ? Math.round(activeUsers / totalUsers * 100) : 0 },
                  { label: "Module payant", value: 0, pct: 0 },
                ].map(function (step) {
                  return (
                    <div key={step.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{step.label}</span>
                        <span style={{ color: "var(--text-faint)" }}>{step.value} ({step.pct}%)</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                        <div style={{ width: Math.max(step.pct, 2) + "%", height: "100%", background: "var(--brand)", borderRadius: 3, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>

          {/* Tabs by user type */}
          <TabList
            active={userTab}
            onChange={setUserTab}
            tabs={[
              { id: "founder", label: "Entrepreneurs", count: founderCount },
              { id: "accountant", label: "Comptables", count: accountantCount },
              { id: "advisor", label: "Accompagnateurs", count: advisorCount },
            ]}
          />

          <DataTable
            data={filteredProfiles}
            columns={userColumns}
            toolbar={userToolbar}
            pageSize={20}
            footer={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{filteredProfiles.length} {filteredProfiles.length > 1 ? "comptes" : "compte"}</span>}
            emptyState={<EmptyState icon={UserCircle} title="Aucun compte" desc="Aucun r\u00e9sultat pour cette recherche." />}
          />
        </>
      ) : null}

      {/* ══════ Espaces de travail ══════ */}
      {section === "workspaces" ? (
        <>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="Espaces de travail" value={totalWorkspaces} />
            <KpiCard label="Actifs cette semaine" value={workspaces.filter(function (w) { return w.updated_at && (Date.now() - new Date(w.updated_at).getTime()) < 7 * 86400000; }).length} />
            <KpiCard label="Actifs ce mois" value={workspaces.filter(function (w) { return w.updated_at && (Date.now() - new Date(w.updated_at).getTime()) < 30 * 86400000; }).length} />
            <KpiCard label="Espace par utilisateur" value={totalUsers > 0 ? (totalWorkspaces / totalUsers).toFixed(1) : "\u2014"} />
          </div>

          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <ChartCard title={"Activit\u00e9 (12 semaines)"}>
              <div style={{ height: 70, display: "flex", alignItems: "center" }}>
                <Sparkline data={activitySparkline} color={chartPalette[1] || "#2563EB"} width={400} height={56} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-2)", fontSize: 11, color: "var(--text-faint)" }}>
                <span>12 sem.</span>
                <span>Cette semaine : {activitySparkline[11] || 0}</span>
              </div>
            </ChartCard>
            <ChartCard title="Modules actifs" trailing={<PaletteToggle value={paletteMode} onChange={setPaletteMode} accentRgb={accentRgb} />}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
                <DonutChart data={{ marketing: 0, production: 0, affiliation: 0 }} palette={chartPalette} size={90} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[{ key: "marketing", label: "Marketing" }, { key: "production", label: "Production" }, { key: "affiliation", label: "Affiliation" }].map(function (mod, i) {
                    return (
                      <div key={mod.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-hover)", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>{mod.label}</span>
                        <span style={{ color: "var(--text-faint)" }}>&#8212;</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartCard>
          </div>

          <DataTable
            data={filteredWorkspaces}
            columns={workspaceColumns}
            toolbar={wsToolbar}
            pageSize={20}
            footer={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{filteredWorkspaces.length} {filteredWorkspaces.length > 1 ? "espaces" : "espace"}</span>}
            emptyState={<EmptyState icon={Database} title="Aucun espace" desc="Aucun r\u00e9sultat pour cette recherche." />}
          />
        </>
      ) : null}

      {/* ══════ Engagement ══════ */}
      {section === "engagement" ? (
        <>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="Utilisateurs actifs (7j)" value={workspaces.filter(function (w) { return w.updated_at && (Date.now() - new Date(w.updated_at).getTime()) < 7 * 86400000; }).length} />
            <KpiCard label="Utilisateurs actifs (30j)" value={activeUsers} />
            <KpiCard label="Taux d'activation" value={totalUsers > 0 ? Math.round(activeUsers / totalUsers * 100) + "%" : "\u2014"} />
            <KpiCard label="Espaces par utilisateur" value={totalUsers > 0 ? (totalWorkspaces / totalUsers).toFixed(1) : "\u2014"} />
          </div>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <ChartCard title={"Activit\u00e9 hebdomadaire"}>
              <div style={{ height: 70, display: "flex", alignItems: "center" }}>
                <Sparkline data={activitySparkline} color={chartPalette[1] || "#2563EB"} width={400} height={56} />
              </div>
            </ChartCard>
            <ChartCard title="Inscriptions hebdomadaires">
              <div style={{ height: 70, display: "flex", alignItems: "center" }}>
                <Sparkline data={signupSparkline} color={accentHex} width={400} height={56} />
              </div>
            </ChartCard>
          </div>
          <ChartCard title="Funnel d'activation">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", padding: "var(--sp-2) 0" }}>
              {[
                { label: "Inscrits", value: totalUsers, pct: 100 },
                { label: "Espace cr\u00e9\u00e9", value: totalWorkspaces > 0 ? Math.min(totalUsers, totalWorkspaces) : 0, pct: totalUsers > 0 ? Math.round(Math.min(totalWorkspaces, totalUsers) / totalUsers * 100) : 0 },
                { label: "Actif (30j)", value: activeUsers, pct: totalUsers > 0 ? Math.round(activeUsers / totalUsers * 100) : 0 },
                { label: "Module payant", value: 0, pct: 0 },
              ].map(function (step, i) {
                return (
                  <div key={step.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{step.label}</span>
                      <span style={{ color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{step.value} ({step.pct}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "var(--bg-hover)", overflow: "hidden" }}>
                      <div style={{ width: Math.max(step.pct, 2) + "%", height: "100%", background: "var(--brand)", borderRadius: 4, transition: "width 0.3s", opacity: 1 - (i * 0.15) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </>
      ) : null}

      {/* ══════ Abonnements ══════ */}
      {section === "subscriptions" ? (
        <>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="Free" value={founderCount} />
            <KpiCard label="Pro" value={0} />
            <KpiCard label="Taux de conversion" value={founderCount > 0 ? "0%" : "\u2014"} />
            <KpiCard label="MRR abonnements" value={"0 \u20ac"} />
          </div>

          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <ChartCard title={"R\u00e9partition des plans"} trailing={<PaletteToggle value={paletteMode} onChange={setPaletteMode} accentRgb={accentRgb} />}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
                <DonutChart data={founderCount > 0 ? { free: founderCount, pro: 0 } : {}} palette={chartPalette} size={90} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { key: "free", label: "Free", count: founderCount, desc: "Finance + Outils" },
                    { key: "pro", label: "Pro", count: 0, desc: "Tous les modules" },
                  ].map(function (plan, i) {
                    return (
                      <div key={plan.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: founderCount > 0 ? chartPalette[i] : "var(--bg-hover)", flexShrink: 0 }} />
                        <div>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{plan.label}</span>
                          <span style={{ color: "var(--text-faint)", marginLeft: 6 }}>{plan.count}</span>
                          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{plan.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Modules Pro">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                {[
                  { label: "Marketing", desc: "Acquisition & budget" },
                  { label: "Production", desc: "Recettes & co\u00fbts" },
                  { label: "Affiliation", desc: "Partenaires & commissions" },
                ].map(function (mod) {
                  return (
                    <div key={mod.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{mod.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{mod.desc}</div>
                      </div>
                      <Badge color="gray">0</Badge>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>

          {/* Pricing reminder */}
          <div style={{
            padding: "var(--sp-4)", borderRadius: "var(--r-lg)",
            background: "var(--bg-card)", border: "1px solid var(--border-light)",
            marginBottom: "var(--sp-6)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
              {"Mod\u00e8le tarifaire"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
              <div style={{ padding: "var(--sp-3)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>Free</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Finance, Outils, Cloud sync</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>Entrepreneurs, comptables et accompagnateurs</div>
              </div>
              <div style={{ padding: "var(--sp-3)", borderRadius: "var(--r-md)", border: "1.5px solid var(--brand)", background: "var(--brand-bg)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand)", marginBottom: 2 }}>Pro</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Free + Marketing, Production, Affiliation + futurs modules</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>Entrepreneurs uniquement</div>
              </div>
            </div>
          </div>

          <TabList
            active={subTab}
            onChange={setSubTab}
            tabs={[
              { id: "active", label: "Actifs", count: 0 },
              { id: "cancelled", label: "Annul\u00e9s", count: 0 },
              { id: "all", label: "Tous", count: 0 },
            ]}
          />
          <DataTable
            data={[]}
            columns={[
              { header: "Utilisateur", accessorKey: "email", cell: function (info) { return <span style={{ fontSize: 13, fontWeight: 500 }}>{info.getValue()}</span>; } },
              { header: "Plan", accessorKey: "plan", cell: function (info) { var p = info.getValue(); return <Badge color={p === "pro" ? "brand" : "gray"}>{p === "pro" ? "Pro" : "Free"}</Badge>; } },
              { header: "Statut", accessorKey: "status", cell: function (info) { var s = info.getValue(); return <Badge color={s === "active" ? "success" : s === "cancelled" ? "error" : "gray"}>{s === "active" ? "Actif" : s === "cancelled" ? "Annul\u00e9" : "Inactif"}</Badge>; } },
              { header: "Modules", accessorKey: "modules", cell: function (info) { return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{info.getValue() || "\u2014"}</span>; } },
              { header: "Souscrit le", accessorKey: "startDate", cell: function (info) { return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{formatDate(info.getValue())}</span>; } },
              { header: "Annul\u00e9 le", accessorKey: "cancelDate", cell: function (info) { return <span style={{ fontSize: 12, color: info.getValue() ? "var(--color-error)" : "var(--text-faint)" }}>{info.getValue() ? formatDate(info.getValue()) : "\u2014"}</span>; } },
            ]}
            toolbar={
              <>
                <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
                  <SearchInput value={subSearch} onChange={setSubSearch} placeholder="Rechercher..." />
                  <FilterDropdown
                    value={subPlanFilter}
                    onChange={setSubPlanFilter}
                    options={[
                      { value: "all", label: "Tous les plans" },
                      { value: "free", label: "Free" },
                      { value: "pro", label: "Pro" },
                    ]}
                  />
                </div>
              </>
            }
            pageSize={20}
            footer={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>0 abonnement</span>}
            emptyState={<EmptyState icon={Database} title="Aucun abonnement" desc="Les abonnements Pro apparaitront ici." />}
          />
        </>
      ) : null}

      {/* ══════ Revenus ══════ */}
      {section === "revenue" ? (
        <>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="MRR" value={"0 \u20ac"} />
            <KpiCard label="ARR" value={"0 \u20ac"} />
            <KpiCard label="ARPU" value={"0 \u20ac"} />
            <KpiCard label="Clients payants" value={0} />
          </div>
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)" }}>
            <ChartCard title="MRR (12 mois)">
              <div style={{ height: 70, display: "flex", alignItems: "center" }}>
                <Sparkline data={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} color={chartPalette[2] || "#0D9488"} width={400} height={56} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-2)" }}>
                Disponible quand le billing sera actif.
              </div>
            </ChartCard>
            <ChartCard title="Revenus par module" trailing={<PaletteToggle value={paletteMode} onChange={setPaletteMode} accentRgb={accentRgb} />}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
                <DonutChart data={{}} palette={chartPalette} size={90} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Marketing", "Production", "Affiliation"].map(function (label, i) {
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-hover)", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>{label}</span>
                        <span style={{ color: "var(--text-faint)" }}>&#8212;</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}

      {/* ══════ Journal ══════ */}
      {section === "activity" ? (
        <DataTable
          data={filteredActivity}
          columns={activityColumns}
          toolbar={actToolbar}
          pageSize={25}
          footer={<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{filteredActivity.length} {filteredActivity.length > 1 ? "actions" : "action"}</span>}
          emptyState={<EmptyState icon={Clock} title={"Aucune activit\u00e9"} desc={"Aucun r\u00e9sultat pour ces filtres."} />}
        />
      ) : null}

      {/* ══════ Infrastructure ══════ */}
      {section === "system" ? (
        <>
          {/* KPIs */}
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
            <KpiCard label="Version" value={VERSION} />
            <KpiCard label="Comptes" value={totalUsers} />
            <KpiCard label="Espaces" value={totalWorkspaces} />
            <KpiCard label="Stockage" value={getStorageMode() === "cloud" ? "Cloud" : "Local"} />
          </div>

          {/* Instance card */}
          <SectionLabel title="Instance" />
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--r-lg)", border: "1px solid var(--border-light)", padding: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
              {[
                { label: "Serveur", value: "83.228.242.140" },
                { label: "OS", value: "Ubuntu 24.04 LTS" },
                { label: "Domaine", value: "app.forecrest.be" },
                { label: "Release", value: RELEASE_DATE },
                { label: "Cloud", value: hasCloudConfig() ? "Actif" : "Non configur\u00e9" },
                { label: "Admin", value: isAdminEnabled() ? "Activ\u00e9" : "D\u00e9sactiv\u00e9" },
                { label: "Webhook", value: "https://app.forecrest.be/webhook/deploy" },
                { label: "SSL", value: "Let's Encrypt (auto-renew)" },
              ].map(function (row) {
                return (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-2) 0", borderBottom: "1px solid var(--border-light)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{row.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commandes SSH */}
          <SectionLabel title="Commandes SSH" />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", marginBottom: "var(--sp-6)" }}>
            {[
              { label: "Connexion", cmd: "ssh -i C:\\Users\\Thomas\\Documents\\Forecrest\\.ssh\\forekey.pem ubuntu@83.228.242.140" },
              { label: "Deploy", cmd: "cd /var/www/forecrest && git pull origin dev && npm install && npm run build" },
            ].map(function (row) {
              return (
                <div key={row.label} style={{ background: "var(--bg-card)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", padding: "var(--sp-3) var(--sp-4)", display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{row.label}</span>
                  <code style={{ flex: 1, fontSize: 12, color: "var(--text-primary)", fontFamily: "ui-monospace, SFMono-Regular, monospace", background: "var(--bg-accordion)", padding: "6px 10px", borderRadius: "var(--r-sm)", border: "1px solid var(--border-light)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{row.cmd}</code>
                  <CopyBtn text={row.cmd} size={32} />
                </div>
              );
            })}
          </div>

          {/* Monitoring */}
          <SectionLabel title="Monitoring" />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)", marginBottom: "var(--sp-6)" }}>
            {[
              { label: "Logs trafic", cmd: "sudo tail -f /var/log/nginx/access.log" },
              { label: "Logs erreurs", cmd: "sudo tail -f /var/log/nginx/error.log" },
              { label: "Logs deploy", cmd: "sudo journalctl -u webhook -f" },
              { label: "Status services", cmd: "sudo systemctl status webhook nginx" },
            ].map(function (row) {
              return (
                <div key={row.label} style={{ background: "var(--bg-card)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", padding: "var(--sp-3) var(--sp-4)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>{row.label}</div>
                    <code style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "ui-monospace, monospace" }}>{row.cmd}</code>
                  </div>
                  <CopyBtn text={row.cmd} />
                </div>
              );
            })}
          </div>

          {/* Maintenance */}
          <SectionLabel title="Maintenance" />
          <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
            {[
              { label: "Restart Nginx", cmd: "sudo systemctl reload nginx" },
              { label: "Restart Webhook", cmd: "sudo systemctl restart webhook" },
              { label: "Renouveler SSL", cmd: "sudo certbot renew" },
              { label: "Espace disque", cmd: "df -h /" },
              { label: "Mise \u00e0 jour OS", cmd: "sudo apt update && sudo apt upgrade -y" },
              { label: "Logs syst\u00e8me", cmd: "sudo journalctl --since '1 hour ago'" },
            ].map(function (row) {
              return (
                <div key={row.label} style={{ background: "var(--bg-card)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", padding: "var(--sp-3) var(--sp-4)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>{row.label}</div>
                    <code style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "ui-monospace, monospace" }}>{row.cmd}</code>
                  </div>
                  <CopyBtn text={row.cmd} />
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* ── Edit user modal ── */}
      <Modal open={!!editUser} onClose={function () { setEditUser(null); }} size="sm" title="Modifier le compte" subtitle={editUser ? editUser.email : ""}>
        <ModalBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>Nom d'affichage</label>
              <input type="text" value={editName} onChange={function (e) { setEditName(e.target.value); }} placeholder="Nom de l'utilisateur" style={{ width: "100%", height: 40, padding: "0 12px", fontSize: 13, background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>Role</label>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                {[{ value: "user", label: "Entrepreneur" }, { value: "accountant", label: "Comptable" }, { value: "advisor", label: "Accompagnateur" }, { value: "admin", label: "Admin" }].map(function (opt) {
                  var active = editRole === opt.value;
                  return (<button key={opt.value} onClick={function () { setEditRole(opt.value); }} style={{ flex: 1, height: 36, fontSize: 12, fontWeight: active ? 600 : 400, border: active ? "1.5px solid var(--brand)" : "1px solid var(--border)", borderRadius: "var(--r-md)", cursor: "pointer", background: active ? "var(--brand-bg)" : "var(--bg-card)", color: active ? "var(--brand)" : "var(--text-secondary)", transition: "all 0.12s", fontFamily: "inherit" }}>{opt.label}</button>);
                })}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>Email</label>
              <div style={{ height: 40, padding: "0 12px", fontSize: 13, background: "var(--bg-accordion)", border: "1px solid var(--border-light)", borderRadius: "var(--r-md)", color: "var(--text-faint)", display: "flex", alignItems: "center" }}>{editUser ? editUser.email : ""}</div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, display: "block" }}>L'email ne peut pas \u00eatre modifi\u00e9 depuis l'admin.</span>
            </div>
            {editUser ? (<div style={{ fontSize: 12, color: "var(--text-faint)", borderTop: "1px solid var(--border-light)", paddingTop: "var(--sp-3)" }}>Inscrit le {formatDate(editUser.created_at)}</div>) : null}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="tertiary" size="md" onClick={function () { setEditUser(null); }}>Annuler</Button>
          <Button color="primary" size="md" onClick={handleSaveUser} isLoading={editSaving}>Enregistrer</Button>
        </ModalFooter>
      </Modal>

    </PageLayout>
  );
}
