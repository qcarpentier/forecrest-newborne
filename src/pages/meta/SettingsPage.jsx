import { useState, useEffect, useRef } from "react";
import { ArrowCounterClockwise, Sun, Moon, Desktop, Receipt, Gauge, PaintBrush, Code, Trash, Briefcase, Bell, Calculator, ChartLine, Keyboard, Scales, Megaphone, Lock, CheckCircle, CloudCheck, UsersThree, Crown, Handshake, UserPlus, MagnifyingGlass, PaperPlaneTilt, Link, Copy, Check as CheckIcon, ArrowsClockwise, X, WarningCircle } from "@phosphor-icons/react";
import { DEFAULT_CONFIG } from "../../constants/config";
import { COST_DEF, SAL_DEF, GRANT_DEF, CAPTABLE_DEF, ROUND_SIM_DEF, POOL_SIZE_DEF, STREAMS_DEF } from "../../constants/defaults";
import { PageLayout, NumberField, Card, Badge, Button, DataTable, SearchInput, FilterDropdown, ButtonUtility, Modal, ModalBody, ModalFooter } from "../../components";
import Select from "../../components/Select";
import CurrencyInput from "../../components/CurrencyInput";
import Avatar from "../../components/Avatar";
import { save } from "../../utils/storage";
import { STORAGE_KEY } from "../../constants/config";
import { useT, useLang, useDevMode, useTheme, useAuth } from "../../context";
import { getStorageMode } from "../../lib/supabase";
import { getSupabase, isConfigured } from "../../lib/supabase";
import StorageSettings from "../../components/StorageSettings";
import useBreakpoint from "../../hooks/useBreakpoint";

/* ── Sub-sidebar nav item ── */
function NavItem({ icon, label, active, onClick, color }) {
  var Icon = icon;
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "var(--sp-2)",
      width: "100%", padding: "8px 12px", height: 36, whiteSpace: "nowrap", flexShrink: 0,
      border: "none", borderRadius: "var(--r-md)",
      background: active ? "var(--brand-bg)" : "transparent",
      cursor: "pointer", textAlign: "left", transition: "background 0.1s",
    }}>
      <Icon size={15} weight={active ? "fill" : "regular"} color={active ? (color || "var(--brand)") : "var(--text-muted)"} />
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? (color || "var(--brand)") : "var(--text-secondary)" }}>{label}</span>
    </button>
  );
}

function NavGroupLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-ghost)", padding: "var(--sp-3) 12px var(--sp-1)" }}>
      {children}
    </div>
  );
}

/* ── Section header + card pattern ── */
function SectionBlock({ title, sub, children }) {
  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <div style={{ marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
        {sub ? <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div> : null}
      </div>
      <Card sx={{ padding: "var(--sp-1) var(--sp-4)" }}>
        {children}
      </Card>
    </div>
  );
}

/* ── Setting row ── */
function SettingRow({ label, desc, children, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--border-light)",
      gap: "var(--sp-4)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {desc ? <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{desc}</div> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ── Page title ── */
function PageTitle({ title }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px", margin: "0 0 var(--sp-6)" }}>
      {title}
    </h2>
  );
}

/* ── Toggle ── */
function Toggle({ on, onChange, color, disabled }) {
  return (
    <button role="switch" aria-checked={on} aria-disabled={disabled} onClick={disabled ? undefined : onChange} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: disabled ? "not-allowed" : "pointer",
      background: on ? (color || "var(--brand)") : "var(--border-strong)",
      position: "relative", transition: "background 150ms", flexShrink: 0, padding: 0,
      opacity: disabled ? 0.45 : 1,
    }}>
      <span style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "var(--bg-card)", left: on ? 22 : 2, transition: "left 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

/* ── Theme picker ── */
function ThemePicker({ value, onChange, lang }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[{ id: "light", icon: Sun, l: lang === "fr" ? "Clair" : "Light" }, { id: "dark", icon: Moon, l: lang === "fr" ? "Sombre" : "Dark" }, { id: "auto", icon: Desktop, l: lang === "fr" ? "Système" : "System" }].map(function (o) {
        var active = value === o.id; var Icon = o.icon;
        return (<button key={o.id} onClick={function () { onChange(o.id); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: "var(--r-md)", border: active ? "1px solid var(--brand)" : "1px solid var(--border)", background: active ? "var(--brand-bg)" : "transparent", color: active ? "var(--brand)" : "var(--text-secondary)", fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer" }}><Icon size={14} weight={active ? "fill" : "regular"} /> {o.l}</button>);
      })}
    </div>
  );
}

function cfgSet(setCfg, key, val) {
  setCfg(function (p) { var n = {}; Object.keys(p).forEach(function (k) { n[k] = p[k]; }); n[key] = val; return n; });
}

/* ── Danger: Workspace (reset data with type-to-confirm) ── */
function DangerWorkspaceSection({ lang, cfg, setCfg, setCosts, setSals, setGrants, setPoolSize, setShareholders, setRoundSim, setStreams, setEsopEnabled, setMarketing }) {
  var isFr = lang !== "en";
  var [confirmText, setConfirmText] = useState("");
  var [done, setDone] = useState(false);
  var expected = (cfg && cfg.companyName) || "Forecrest";
  var matches = confirmText.trim().toLowerCase() === expected.trim().toLowerCase();

  function handleReset() {
    if (!matches) return;
    setCfg(function () { return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); });
    setCosts(JSON.parse(JSON.stringify(COST_DEF)));
    setSals(JSON.parse(JSON.stringify(SAL_DEF)));
    setGrants(JSON.parse(JSON.stringify(GRANT_DEF)));
    setPoolSize(POOL_SIZE_DEF);
    setShareholders(JSON.parse(JSON.stringify(CAPTABLE_DEF)));
    setRoundSim(function () { return JSON.parse(JSON.stringify(ROUND_SIM_DEF)); });
    setStreams(JSON.parse(JSON.stringify(STREAMS_DEF)));
    setEsopEnabled(false);
    if (setMarketing) setMarketing({});
    save(STORAGE_KEY, null);
    setDone(true);
    setConfirmText("");
  }

  return (
    <>
      <PageTitle title={isFr ? "Zone danger \u2014 Espace de travail" : "Danger zone \u2014 Workspace"} />

      <div style={{
        border: "1px solid var(--color-error-border, rgba(220,38,38,0.25))",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        marginBottom: "var(--sp-6)",
      }}>
        {/* Reset data */}
        <div style={{ padding: "var(--sp-5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
            <ArrowCounterClockwise size={16} weight="bold" color="var(--color-error)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-error)" }}>
              {isFr ? "R\u00e9initialiser toutes les donn\u00e9es" : "Reset all data"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-3) 0", lineHeight: 1.5 }}>
            {isFr
              ? "Cette action supprime d\u00e9finitivement toutes les donn\u00e9es financi\u00e8res (revenus, charges, salaires, \u00e9quipements, etc.). Les membres de l'\u00e9quipe conserveront leur acc\u00e8s."
              : "This permanently deletes all financial data (revenue, costs, salaries, equipment, etc.). Team members will keep their access."}
          </p>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
            {isFr ? "Tapez" : "Type"} <strong style={{ color: "var(--text-primary)" }}>{expected}</strong> {isFr ? "pour confirmer" : "to confirm"}
          </label>
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
            <input
              type="text"
              value={confirmText}
              onChange={function (e) { setConfirmText(e.target.value); setDone(false); }}
              placeholder={expected}
              style={{
                flex: 1, height: 36, padding: "0 var(--sp-3)",
                border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                background: "var(--bg-card)", color: "var(--text-primary)",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <Button color="primary-destructive" size="md" onClick={handleReset} isDisabled={!matches}>
              <ArrowCounterClockwise size={14} style={{ marginRight: 4 }} />
              {isFr ? "R\u00e9initialiser" : "Reset"}
            </Button>
          </div>
          {done ? (
            <div style={{ marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-success)" }}>
              {isFr ? "Donn\u00e9es r\u00e9initialis\u00e9es." : "Data reset complete."}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ── Danger: Account (delete account with type-to-confirm) ── */
function DangerAccountSection({ lang, auth }) {
  var isFr = lang !== "en";
  var [confirmEmail, setConfirmEmail] = useState("");
  var [deleting, setDeleting] = useState(false);
  var [leaving, setLeaving] = useState(false);
  var userEmail = (auth && auth.user) ? auth.user.email : "";
  var matches = confirmEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
  var isNonOwner = auth && auth.isOwner === false;

  function handleDelete() {
    if (!matches || !auth.deleteAccount) return;
    setDeleting(true);
    auth.deleteAccount().then(function () {
      window.location.href = "/";
    }).catch(function () {
      setDeleting(false);
    });
  }

  function handleLeave() {
    if (!auth || !auth.user || !auth.workspaceId) return;
    setLeaving(true);
    var sb = getSupabase();
    if (sb) {
      sb.rpc("leave_workspace", { ws_id: auth.workspaceId })
        .then(function () {
          auth.setWorkspaceId(null);
          auth.setWorkspaceRole(null);
          window.location.href = "/";
        })
        .catch(function () { setLeaving(false); });
    }
  }

  return (
    <>
      <PageTitle title={isFr ? "Zone danger \u2014 Compte" : "Danger zone \u2014 Account"} />

      {/* Leave workspace (non-owners) */}
      {isNonOwner ? (
        <div style={{
          border: "1px solid var(--color-error-border, rgba(220,38,38,0.25))",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          marginBottom: "var(--sp-4)",
        }}>
          <div style={{ padding: "var(--sp-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <UserPlus size={16} weight="bold" color="var(--color-error)" style={{ transform: "scaleX(-1)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-error)" }}>
                {isFr ? "Quitter l'espace de travail" : "Leave workspace"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-3) 0", lineHeight: 1.5 }}>
              {isFr
                ? "Vous n'aurez plus acc\u00e8s aux donn\u00e9es de cet espace. Le propri\u00e9taire devra vous r\u00e9inviter pour y acc\u00e9der \u00e0 nouveau."
                : "You will no longer have access to this workspace. The owner will need to re-invite you to access it again."}
            </p>
            <Button color="primary-destructive" size="md" onClick={handleLeave} isLoading={leaving}>
              {isFr ? "Quitter l'espace" : "Leave workspace"}
            </Button>
          </div>
        </div>
      ) : null}

      <div style={{
        border: "1px solid var(--color-error-border, rgba(220,38,38,0.25))",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        marginBottom: "var(--sp-6)",
      }}>
        <div style={{ padding: "var(--sp-5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
            <Trash size={16} weight="bold" color="var(--color-error)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-error)" }}>
              {isFr ? "Supprimer mon compte" : "Delete my account"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-3) 0", lineHeight: 1.5 }}>
            {isFr
              ? "Cette action est d\u00e9finitive. Votre compte, vos espaces de travail et toutes vos donn\u00e9es seront supprim\u00e9s. Les espaces partag\u00e9s o\u00f9 vous \u00eates invit\u00e9 ne seront pas affect\u00e9s."
              : "This action is permanent. Your account, workspaces and all data will be deleted. Shared workspaces where you are invited will not be affected."}
          </p>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
            {isFr ? "Tapez" : "Type"} <strong style={{ color: "var(--text-primary)" }}>{userEmail}</strong> {isFr ? "pour confirmer" : "to confirm"}
          </label>
          <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
            <input
              type="text"
              value={confirmEmail}
              onChange={function (e) { setConfirmEmail(e.target.value); }}
              placeholder={userEmail}
              style={{
                flex: 1, height: 36, padding: "0 var(--sp-3)",
                border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                background: "var(--bg-card)", color: "var(--text-primary)",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <Button color="primary-destructive" size="md" onClick={handleDelete} isDisabled={!matches} isLoading={deleting}>
              <Trash size={14} style={{ marginRight: 4 }} />
              {isFr ? "Supprimer" : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Team Settings section ── */
function TeamSection({ lang, auth }) {
  var [members, setMembers] = useState([]);
  var [invitations, setInvitations] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState("");
  var [roleFilter, setRoleFilter] = useState("all");

  var isFr = lang !== "en";

  var ROLE_LABELS = {
    owner: isFr ? "Propri\u00e9taire" : "Owner",
    member: isFr ? "Membre" : "Member",
    accountant: isFr ? "Comptable" : "Accountant",
    advisor: isFr ? "Accompagnateur" : "Advisor",
  };
  var ROLE_COLORS = { owner: "brand", member: "gray", accountant: "info", advisor: "warning" };
  var STATUS_COLORS = { active: "success", invited: "gray" };
  var STATUS_LABELS = { active: isFr ? "Actif" : "Active", invited: isFr ? "Invit\u00e9" : "Invited" };
  var ROLE_ICONS = { owner: Crown, member: UsersThree, accountant: Calculator, advisor: Handshake };

  useEffect(function () {
    if (!auth.workspaceId || !isConfigured()) { setLoading(false); return; }
    var sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    Promise.all([
      sb.rpc("get_workspace_members", { ws_id: auth.workspaceId }),
      sb.from("workspace_invitations")
        .select("id, email, role, token, expires_at, accepted_at, created_at")
        .eq("workspace_id", auth.workspaceId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]).then(function (results) {
      var dbMembers = results[0].data || [];
      if (results[1].data) setInvitations(results[1].data);

      /* If no members returned (migration not run yet), show current user */
      if (dbMembers.length === 0 && auth.user) {
        dbMembers = [{
          id: "self",
          user_id: auth.user.id,
          role: auth.workspaceRole || "member",
          status: "active",
          joined_at: null,
          last_seen_at: new Date().toISOString(),
          current_page: null,
          profiles: { display_name: auth.user.displayName, email: auth.user.email },
        }];
      }
      setMembers(dbMembers);
      setLoading(false);
    }).catch(function () {
      /* Fallback: show current user */
      if (auth.user) {
        setMembers([{
          id: "self",
          user_id: auth.user.id,
          role: auth.workspaceRole || "member",
          status: "active",
          joined_at: null,
          last_seen_at: new Date().toISOString(),
          current_page: null,
          profiles: { display_name: auth.user.displayName, email: auth.user.email },
        }]);
      }
      setLoading(false);
    });
  }, [auth.workspaceId]);

  var [copiedId, setCopiedId] = useState(null);
  var [confirmRemove, setConfirmRemove] = useState(null); // { id, name }

  function removeMember(memberId) {
    if (!auth.isOwner) return;
    var sb = getSupabase();
    if (!sb) return;
    sb.from("workspace_members")
      .update({ status: "removed" })
      .eq("id", memberId)
      .then(function () {
        setMembers(function (prev) { return prev.filter(function (m) { return m.id !== memberId; }); });
        setConfirmRemove(null);
      });
  }

  function cancelInvitation(invId) {
    var sb = getSupabase();
    if (!sb) return;
    sb.from("workspace_invitations")
      .delete()
      .eq("id", invId)
      .then(function () {
        setInvitations(function (prev) { return prev.filter(function (inv) { return inv.id !== invId; }); });
      });
  }

  function copyInviteLink(token, id) {
    var url = window.location.origin + "/join?token=" + token;
    navigator.clipboard.writeText(url).then(function () {
      setCopiedId(id);
      setTimeout(function () { setCopiedId(null); }, 2000);
    }).catch(function () {});
  }

  function formatLastSeen(ts) {
    if (!ts) return "\u2014";
    var diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return isFr ? "en ligne" : "online";
    if (diff < 3600) return Math.floor(diff / 60) + "min";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    return Math.floor(diff / 86400) + (isFr ? "j" : "d");
  }

  /* ── Filter data ── */
  var filtered = members.filter(function (m) {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (search) {
      var q = search.toLowerCase();
      var name = m.profiles ? (m.profiles.display_name || "").toLowerCase() : "";
      var email = m.profiles ? (m.profiles.email || "").toLowerCase() : "";
      if (name.indexOf(q) === -1 && email.indexOf(q) === -1) return false;
    }
    return true;
  });

  var activeCount = members.filter(function (m) { return m.status === "active"; }).length;

  /* ── DataTable columns (TanStack) ── */
  var tableColumns = [
    {
      header: isFr ? "Membre" : "Member",
      accessorKey: "user_id",
      cell: function (info) {
        var row = info.row.original;
        var name = row.profiles ? row.profiles.display_name : "";
        var email = row.profiles ? row.profiles.email : "";
        var isSelf = auth.user && row.user_id === auth.user.id;
        var isOnline = row.last_seen_at && (Date.now() - new Date(row.last_seen_at).getTime()) < 60000;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <Avatar name={name} userId={row.user_id} size={32} online={isOnline} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || email}</span>
                {isSelf ? <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 400 }}>({isFr ? "vous" : "you"})</span> : null}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: isFr ? "R\u00f4le" : "Role",
      accessorKey: "role",
      cell: function (info) {
        var r = info.getValue();
        var RIcon = ROLE_ICONS[r] || UsersThree;
        return <Badge color={ROLE_COLORS[r] || "gray"} size="sm" icon={<RIcon size={12} />}>{ROLE_LABELS[r] || r}</Badge>;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: function (info) {
        var s = info.getValue();
        return <Badge color={STATUS_COLORS[s] || "gray"} size="sm" dot>{STATUS_LABELS[s] || s}</Badge>;
      },
    },
    {
      header: isFr ? "Derni\u00e8re activit\u00e9" : "Last seen",
      accessorKey: "last_seen_at",
      cell: function (info) {
        return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{formatLastSeen(info.getValue())}</span>;
      },
    },
  ];

  if (auth.isOwner) {
    tableColumns.push({
      header: "",
      id: "actions",
      enableSorting: false,
      accessorFn: function (row) { return row.id; },
      cell: function (info) {
        var row = info.row.original;
        var isSelf = auth.user && row.user_id === auth.user.id;
        if (isSelf || row.role === "owner") return null;
        var name = row.profiles ? row.profiles.display_name || row.profiles.email : "";
        return (
          <ButtonUtility
            icon={<X size={14} weight="bold" />}
            variant="danger"
            size="header"
            onClick={function () { setConfirmRemove({ id: row.id, name: name }); }}
            title={isFr ? "Exclure" : "Remove"}
          />
        );
      },
    });
  }

  /* ── Invitation columns (TanStack) ── */
  var invitationColumns = [
    {
      header: "Email",
      accessorKey: "email",
      cell: function (info) {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--r-full)",
              background: "var(--bg-accordion)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <PaperPlaneTilt size={14} color="var(--text-muted)" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{info.getValue()}</span>
          </div>
        );
      },
    },
    {
      header: isFr ? "R\u00f4le" : "Role",
      accessorKey: "role",
      cell: function (info) {
        var r = info.getValue();
        var RIcon = ROLE_ICONS[r] || UsersThree;
        return <Badge color={ROLE_COLORS[r] || "gray"} size="sm" icon={<RIcon size={12} />}>{ROLE_LABELS[r] || r}</Badge>;
      },
    },
    {
      header: "Status",
      id: "inv_status",
      accessorKey: "expires_at",
      cell: function (info) {
        var expired = new Date(info.getValue()) < new Date();
        return (
          <Badge color={expired ? "error" : "gray"} size="sm" dot>
            {expired ? (isFr ? "Expir\u00e9" : "Expired") : (isFr ? "En attente" : "Pending")}
          </Badge>
        );
      },
    },
    {
      header: isFr ? "Envoy\u00e9 le" : "Sent",
      accessorKey: "created_at",
      cell: function (info) {
        var d = info.getValue();
        if (!d) return "\u2014";
        return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{new Date(d).toLocaleDateString(isFr ? "fr-BE" : "en-GB", { day: "2-digit", month: "short" })}</span>;
      },
    },
  ];

  if (auth.isOwner) {
    invitationColumns.push({
      header: "",
      id: "inv_actions",
      enableSorting: false,
      accessorFn: function (row) { return row.id; },
      cell: function (info) {
        var row = info.row.original;
        var isCopied = copiedId === row.id;
        return (
          <div style={{ display: "flex", gap: "var(--sp-1)", justifyContent: "flex-end" }}>
            <ButtonUtility
              icon={isCopied ? <CheckIcon size={14} weight="bold" /> : <Link size={14} />}
              variant={isCopied ? "brand" : "default"}
              size="header"
              onClick={function () { copyInviteLink(row.token, row.id); }}
              title={isFr ? "Copier le lien" : "Copy link"}
            />
            <ButtonUtility
              icon={<Trash size={14} />}
              variant="danger"
              size="header"
              onClick={function () { cancelInvitation(row.id); }}
              title={isFr ? "Annuler" : "Cancel"}
            />
          </div>
        );
      },
    });
  }

  /* ── Toolbar ── */
  var filterOptions = [
    { value: "all", label: isFr ? "Tous" : "All" },
    { value: "owner", label: ROLE_LABELS.owner },
    { value: "member", label: ROLE_LABELS.member },
    { value: "accountant", label: ROLE_LABELS.accountant },
    { value: "advisor", label: ROLE_LABELS.advisor },
  ];

  var toolbar = (
    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
      <SearchInput value={search} onChange={setSearch} placeholder={isFr ? "Rechercher..." : "Search..."} width={200} />
      <FilterDropdown value={roleFilter} onChange={setRoleFilter} options={filterOptions} />
    </div>
  );

  var footerContent = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
        {activeCount} {isFr ? (activeCount > 1 ? "membres" : "membre") : (activeCount > 1 ? "members" : "member")}
      </span>
      {invitations.length > 0 ? (
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {invitations.length} {isFr ? "invitation(s) en attente" : "pending invitation(s)"}
        </span>
      ) : null}
    </div>
  );

  var emptyState = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-6) 0" }}>
      <UsersThree size={32} weight="duotone" color="var(--text-ghost)" />
      <span style={{ fontSize: 13, color: "var(--text-faint)" }}>{isFr ? "Aucun membre trouv\u00e9" : "No members found"}</span>
    </div>
  );

  return (
    <>
      <PageTitle title={isFr ? "\u00c9quipe" : "Team"} />
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ marginBottom: "var(--sp-3)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{isFr ? "Membres de l'espace" : "Workspace members"}</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>{isFr ? "G\u00e9rez les personnes ayant acc\u00e8s \u00e0 votre plan financier." : "Manage people with access to your financial plan."}</div>
        </div>
        {loading ? (
          <div style={{ padding: "var(--sp-6)", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
            {isFr ? "Chargement..." : "Loading..."}
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={tableColumns}
            toolbar={toolbar}
            footer={footerContent}
            emptyState={emptyState}
            pageSize={10}
            compact
          />
        )}
      </div>

      {/* ── Pending invitations (always visible) ── */}
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ marginBottom: "var(--sp-3)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{isFr ? "Invitations en attente" : "Pending invitations"}</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>{isFr ? "Personnes invit\u00e9es qui n'ont pas encore accept\u00e9." : "Invited people who haven't accepted yet."}</div>
        </div>
        <DataTable
          data={invitations}
          columns={invitationColumns}
          footer={invitations.length > 0 ? <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{invitations.length} {isFr ? (invitations.length > 1 ? "invitations" : "invitation") : (invitations.length > 1 ? "invitations" : "invitation")}</span> : null}
          emptyState={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-6) 0" }}>
              <PaperPlaneTilt size={32} weight="duotone" color="var(--text-ghost)" />
              <span style={{ fontSize: 13, color: "var(--text-faint)" }}>{isFr ? "Aucune invitation en attente" : "No pending invitations"}</span>
              {auth.isOwner ? (
                <Button
                  color="secondary"
                  size="sm"
                  iconLeading={<UserPlus size={14} />}
                  onClick={function () { window.dispatchEvent(new CustomEvent("fc-open-share")); }}
                >
                  {isFr ? "Inviter quelqu'un" : "Invite someone"}
                </Button>
              ) : null}
            </div>
          }
          pageSize={10}
          compact
        />
      </div>

      {/* ── Confirm remove modal ── */}
      {confirmRemove ? (
        <Modal
          open={true}
          onClose={function () { setConfirmRemove(null); }}
          size="sm"
          title={isFr ? "Exclure ce membre ?" : "Remove this member?"}
          icon={<WarningCircle size={20} weight="duotone" color="var(--color-warning)" />}
        >
          <ModalBody>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {isFr
                ? "Vous \u00eates sur le point d'exclure "
                : "You are about to remove "}
              <strong style={{ color: "var(--text-primary)" }}>{confirmRemove.name}</strong>
              {isFr
                ? " de cet espace de travail. Cette personne n'aura plus acc\u00e8s aux donn\u00e9es."
                : " from this workspace. They will no longer have access to the data."}
            </div>
          </ModalBody>
          <ModalFooter>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-2)", width: "100%" }}>
              <Button color="tertiary" size="md" onClick={function () { setConfirmRemove(null); }}>
                {isFr ? "Annuler" : "Cancel"}
              </Button>
              <Button color="primary-destructive" size="md" onClick={function () { removeMember(confirmRemove.id); }}>
                {isFr ? "Exclure" : "Remove"}
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      ) : null}
    </>
  );
}

/* ══════════════════════════════════════════ */

export default function SettingsPage({
  cfg, setCfg, setCosts, setSals, setGrants, setPoolSize,
  setShareholders, setRoundSim, setStreams, setEsopEnabled,
  marketing, setMarketing,
  initialSection,
  getSnapshot,
}) {
  var tAll = useT(); var t = tAll.settings; var td = tAll.dev || {};
  var { lang, toggleLang } = useLang();
  var { dark, toggle: toggleTheme } = useTheme();
  var { devMode, toggle: toggleDevMode } = useDevMode();
  var auth = useAuth();
  var bp = useBreakpoint(); var isMobile = bp.isMobile;
  var storageMode = getStorageMode();
  var canDevMode = storageMode !== "cloud" || (auth.user && auth.user.role === "admin");
  var isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  var [section, setSection] = useState(initialSection || "appearance");
  var contentRef = useRef(null);

  var [themeMode, setThemeModeState] = useState(function () {
    try { var pref = localStorage.getItem("themeMode"); if (pref === "dark" || pref === "light" || pref === "auto") return pref; } catch (e) {}
    return dark ? "dark" : "light";
  });
  function setThemeMode(mode) {
    setThemeModeState(mode);
    try { localStorage.setItem("themeMode", mode); } catch (e) {}
    if (mode === "auto") { var pd = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; if ((pd && !dark) || (!pd && dark)) toggleTheme(window.innerWidth / 2, window.innerHeight / 2); }
    else if (mode === "dark" && !dark) toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
    else if (mode === "light" && dark) toggleTheme(window.innerWidth / 2, window.innerHeight / 2);
  }

  useEffect(function () {
    function onSection(e) { if (e.detail) setSection(e.detail); }
    window.addEventListener("settings-section", onSection);
    return function () { window.removeEventListener("settings-section", onSection); };
  }, []);
  useEffect(function () { if (contentRef.current) contentRef.current.scrollTop = 0; }, [section]);

  var BIZ = { saas: "SaaS", ecommerce: "E-commerce", retail: "Retail", services: "Services", freelancer: lang === "fr" ? "Indépendant" : "Freelancer", other: lang === "fr" ? "Général" : "General" };

  return (
    <PageLayout
      title={lang === "fr" ? "Paramètres" : "Settings"}
      subtitle={lang === "fr" ? "Apparence, fiscalité et préférences." : "Appearance, tax and preferences."}
    >
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "var(--sp-3)" : "var(--gap-lg)", alignItems: "flex-start", minHeight: "calc(100vh - 200px)" }}>

        {/* ── Sub-sidebar ── */}
        <div style={{ width: isMobile ? "100%" : 190, flexShrink: 0, position: isMobile ? "static" : "sticky", top: isMobile ? undefined : "calc(var(--page-py) + 60px)", display: "flex", flexDirection: isMobile ? "row" : "column", overflowX: isMobile ? "auto" : "visible", gap: isMobile ? "var(--sp-1)" : 0, paddingBottom: isMobile ? "var(--sp-2)" : 0, borderBottom: isMobile ? "1px solid var(--border-light)" : "none", scrollbarWidth: "none" }}>
          {/* ── Mon compte (personal, everyone sees) ── */}
          {isMobile ? null : <NavGroupLabel>{lang === "fr" ? "Mon compte" : "My account"}</NavGroupLabel>}
          <NavItem icon={CloudCheck} label={lang === "fr" ? "Compte" : "Account"} active={section === "account"} onClick={function () { setSection("account"); }} />
          <NavItem icon={PaintBrush} label={lang === "fr" ? "Pr\u00e9f\u00e9rences" : "Preferences"} active={section === "appearance"} onClick={function () { setSection("appearance"); }} />
          <NavItem icon={Bell} label={lang === "fr" ? "Alertes" : "Alerts"} active={section === "alerts"} onClick={function () { setSection("alerts"); }} />
          <NavItem icon={Keyboard} label={lang === "fr" ? "Raccourcis" : "Shortcuts"} active={section === "shortcuts"} onClick={function () { setSection("shortcuts"); }} />

          {/* ── Espace de travail (workspace, owner-only for financial) ── */}
          {!auth.user || auth.isOwner !== false ? (
            <>
              {isMobile ? null : <NavGroupLabel>{lang === "fr" ? "Espace de travail" : "Workspace"}</NavGroupLabel>}
              <NavItem icon={Receipt} label={lang === "fr" ? "Fiscalit\u00e9" : "Tax"} active={section === "fiscal"} onClick={function () { setSection("fiscal"); }} />
              <NavItem icon={Briefcase} label={BIZ[cfg.businessType] || "Metrics"} active={section === "business"} onClick={function () { setSection("business"); }} />
              <NavItem icon={Gauge} label={lang === "fr" ? "Objectifs" : "Targets"} active={section === "metrics"} onClick={function () { setSection("metrics"); }} />
              <NavItem icon={ChartLine} label="Projections" active={section === "projections"} onClick={function () { setSection("projections"); }} />
              <NavItem icon={Calculator} label={lang === "fr" ? "Comptabilit\u00e9" : "Accounting"} active={section === "accounting"} onClick={function () { setSection("accounting"); }} />
              <NavItem icon={Megaphone} label={lang === "fr" ? "Modules" : "Modules"} active={section === "modules"} onClick={function () { setSection("modules"); }} />
            </>
          ) : null}
          {auth.user && auth.storageMode === "cloud" ? (
            <NavItem icon={UsersThree} label={lang === "fr" ? "\u00c9quipe" : "Team"} active={section === "team"} onClick={function () { setSection("team"); }} />
          ) : null}
          {!auth.user || auth.isOwner !== false ? (
            <NavItem icon={Scales} label={lang === "fr" ? "Mode comptable" : "Accountant mode"} active={section === "accountant"} onClick={function () { setSection("accountant"); }} />
          ) : null}
          {canDevMode ? <NavItem icon={Code} label={lang === "fr" ? "D\u00e9veloppeur" : "Developer"} active={section === "developer"} onClick={function () { setSection("developer"); }} /> : null}

          {/* ── Zone danger ── */}
          {isMobile ? null : <NavGroupLabel>{lang === "fr" ? "Zone danger" : "Danger zone"}</NavGroupLabel>}
          {!auth.user || auth.isOwner !== false ? (
            <NavItem icon={Trash} label={lang === "fr" ? "Espace" : "Workspace"} active={section === "danger"} onClick={function () { setSection("danger"); }} color="var(--color-error)" />
          ) : null}
          {auth.user ? (
            <NavItem icon={Trash} label={lang === "fr" ? "Compte" : "Account"} active={section === "danger_account"} onClick={function () { setSection("danger_account"); }} color="var(--color-error)" />
          ) : null}
        </div>

        {/* ── Content ── */}
        <div ref={contentRef} style={{ flex: 1, minWidth: 0 }}>

          {section === "appearance" ? (
            <>
              <PageTitle title={lang === "fr" ? "Apparence" : "Appearance"} />

              <SectionBlock title={lang === "fr" ? "Général" : "General"} sub={lang === "fr" ? "Langue et format d'affichage." : "Language and display format."}>
                <SettingRow label={lang === "fr" ? "Langue" : "Language"}><Select value={lang} onChange={function () { toggleLang(); }} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} width={130} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Format montants" : "Amount format"} last><Select value={cfg.kpiShort !== false ? "short" : "long"} onChange={function (v) { cfgSet(setCfg, "kpiShort", v === "short"); }} options={[{ value: "short", label: "12k" }, { value: "long", label: "12 000" }]} width={100} /></SettingRow>
              </SectionBlock>

              <SectionBlock title={lang === "fr" ? "Interface et thème" : "Interface and theme"} sub={lang === "fr" ? "Apparence visuelle de l'application." : "Visual appearance of the application."}>
                <SettingRow label={lang === "fr" ? "Thème" : "Theme"}><ThemePicker value={themeMode} onChange={setThemeMode} lang={lang} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Taille de police" : "Font size"} desc={lang === "fr" ? "Ajustez la lisibilité." : "Adjust readability."}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <span style={{ fontSize: 12 }}>A</span>
                    <input type="range" min="0.85" max="1.30" step="0.05" value={cfg.fontScale || 1} onChange={function (e) { var v = parseFloat(e.target.value); cfgSet(setCfg, "fontScale", v); document.documentElement.style.setProperty("--font-scale", String(v)); try { localStorage.setItem("fontScale", String(v)); } catch (err) {} }} style={{ width: 80, accentColor: "var(--brand)", cursor: "pointer" }} />
                    <span style={{ fontSize: 16 }}>A</span>
                    <span style={{ fontSize: 11, fontWeight: 600, background: "var(--bg-page)", padding: "2px 6px", borderRadius: 4 }}>{Math.round((cfg.fontScale || 1) * 100)}%</span>
                  </div>
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Animations" : "Animations"} desc={lang === "fr" ? "Désactiver réduit les mouvements." : "Disabling reduces motion."}>
                  <Toggle on={cfg.animationsEnabled !== false} onChange={function () { cfgSet(setCfg, "animationsEnabled", cfg.animationsEnabled === false); }} />
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Icônes de page" : "Page icons"} desc={lang === "fr" ? "Afficher une icône colorée dans l'en-tête de chaque page." : "Display a colored icon in each page header."}>
                  <Toggle on={cfg.showPageIcons === true} onChange={function () { cfgSet(setCfg, "showPageIcons", !cfg.showPageIcons); }} />
                </SettingRow>
                <SettingRow label={lang === "fr" ? "Palette des charts" : "Chart palette"} desc={lang === "fr" ? "Dégradé de la brand color ou couleurs distinctes." : "Brand color gradient or distinct colors."} last>
                  <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                    {[
                      { value: "brand", label: lang === "fr" ? "Brand" : "Brand" },
                      { value: "multi", label: lang === "fr" ? "Multi" : "Multi" },
                    ].map(function (opt) {
                      var active = (cfg.chartPalette || "brand") === opt.value;
                      return (
                        <button key={opt.value} type="button" onClick={function () { cfgSet(setCfg, "chartPalette", opt.value); }}
                          style={{
                            height: 32, padding: "0 12px",
                            border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
                            borderRadius: "var(--r-md)",
                            background: active ? "var(--brand-bg)" : "transparent",
                            color: active ? "var(--brand)" : "var(--text-secondary)",
                            fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: "inherit",
                            cursor: "pointer", transition: "all 0.12s",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "alerts" ? (
            <>
              <PageTitle title={lang === "fr" ? "Alertes" : "Alerts"} />
              <SectionBlock title={lang === "fr" ? "Seuils d'alerte" : "Alert thresholds"} sub={lang === "fr" ? "Avertissements visuels sur le dashboard." : "Visual warnings on the dashboard."}>
                <SettingRow label={lang === "fr" ? "Runway minimum" : "Min runway"} desc={lang === "fr" ? "Alerte si trésorerie < X mois." : "Alert if cash < X months."}><NumberField value={cfg.alertRunwayMonths || 6} onChange={function (v) { cfgSet(setCfg, "alertRunwayMonths", v); }} min={1} max={36} step={1} width="60px" suf="mo" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Couverture minimum" : "Min coverage"} desc={lang === "fr" ? "Alerte si revenus < X% des charges." : "Alert if revenue < X% of costs."} last><NumberField value={cfg.alertMinCoverage || 0.80} onChange={function (v) { cfgSet(setCfg, "alertMinCoverage", v); }} min={0} max={2} step={0.05} width="70px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "shortcuts" ? (
            <>
              <PageTitle title={lang === "fr" ? "Raccourcis clavier" : "Keyboard shortcuts"} />
              <SectionBlock title={lang === "fr" ? "Navigation" : "Navigation"}>
                {[{ k: "1 — 9", l: lang === "fr" ? "Pages" : "Pages" }, { k: isMac ? "⌘ K" : "Ctrl K", l: lang === "fr" ? "Commandes" : "Commands" }].map(function (s, i, a) {
                  return (<div key={s.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.l}</span><div style={{ display: "flex", gap: 3 }}>{s.k.split(" ").map(function (k2, ki) { return <kbd key={ki} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 6px", fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,monospace", color: "var(--text-secondary)", background: "var(--bg-page)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)", boxShadow: "0 1px 0 var(--border-strong)" }}>{k2}</kbd>; })}</div></div>);
                })}
              </SectionBlock>
              <SectionBlock title="Actions">
                {[{ k: isMac ? "⌘ Z" : "Ctrl Z", l: lang === "fr" ? "Annuler" : "Undo" }, { k: isMac ? "⌘ S" : "Ctrl S", l: lang === "fr" ? "Exporter" : "Export" }, { k: isMac ? "⌘ ⇧ D" : "Ctrl ⇧ D", l: lang === "fr" ? "Mode dev" : "Dev mode" }, { k: "?", l: lang === "fr" ? "Aide" : "Help" }].map(function (s, i, a) {
                  return (<div key={s.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid var(--border-light)" : "none" }}><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.l}</span><div style={{ display: "flex", gap: 3 }}>{s.k.split(" ").map(function (k2, ki) { return <kbd key={ki} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 6px", fontSize: 11, fontWeight: 600, fontFamily: "ui-monospace,monospace", color: "var(--text-secondary)", background: "var(--bg-page)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-sm)", boxShadow: "0 1px 0 var(--border-strong)" }}>{k2}</kbd>; })}</div></div>);
                })}
              </SectionBlock>
            </>
          ) : null}

          {section === "fiscal" ? (
            <>
              <PageTitle title={lang === "fr" ? "Fiscalité" : "Tax"} />
              <SectionBlock title="TVA" sub={lang === "fr" ? "Taxe sur la valeur ajoutée." : "Value-added tax."}>
                <SettingRow label={lang === "fr" ? "Taux" : "Rate"}><NumberField value={cfg.vat} onChange={function (v) { cfgSet(setCfg, "vat", v); }} min={0} max={0.30} step={0.01} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Régime" : "Regime"} last><Select value={cfg.tvaRegime || "quarterly"} onChange={function (v) { cfgSet(setCfg, "tvaRegime", v); }} options={[{ value: "monthly", label: lang === "fr" ? "Mensuel" : "Monthly" }, { value: "quarterly", label: lang === "fr" ? "Trimestriel" : "Quarterly" }, { value: "exempt", label: lang === "fr" ? "Exonéré" : "Exempt" }]} width={140} /></SettingRow>
              </SectionBlock>
              <SectionBlock title="ISOC" sub={lang === "fr" ? "Impôt des sociétés." : "Corporate tax."}>
                <SettingRow label={lang === "fr" ? "Capital social" : "Share capital"}><NumberField value={cfg.capitalSocial} onChange={function (v) { cfgSet(setCfg, "capitalSocial", v); }} min={0} max={500000} step={1000} width="100px" /></SettingRow>
                <SettingRow label="DRI" desc={lang === "fr" ? "Déduction pour revenus d'innovation." : "Innovation income deduction."} last><Toggle on={cfg.driEnabled} onChange={function () { cfgSet(setCfg, "driEnabled", !cfg.driEnabled); }} /></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Charges sociales" : "Social charges"} sub={lang === "fr" ? "ONSS, précompte et patronales." : "Social security contributions."}>
                <SettingRow label="ONSS"><NumberField value={cfg.onss} onChange={function (v) { cfgSet(setCfg, "onss", v); }} min={0} max={1} step={0.001} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Précompte" : "Withholding"}><NumberField value={cfg.prec} onChange={function (v) { cfgSet(setCfg, "prec", v); }} min={0} max={1} step={0.001} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Patronales" : "Employer"} last><NumberField value={cfg.patr} onChange={function (v) { cfgSet(setCfg, "patr", v); }} min={0} max={1} step={0.001} width="80px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "business" ? (
            <>
              <PageTitle title={(lang === "fr" ? "Métriques " : "Metrics ") + (BIZ[cfg.businessType] || "")} />
              <SectionBlock title={lang === "fr" ? "Type d'activité" : "Business type"}>
                <SettingRow label={BIZ[cfg.businessType]} last>
                  <button onClick={function () { window.dispatchEvent(new CustomEvent("nav-tab", { detail: "profile" })); }} style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}>{lang === "fr" ? "Modifier" : "Change"}</button>
                </SettingRow>
              </SectionBlock>
              {cfg.businessType === "saas" ? (
                <SectionBlock title="SaaS">
                  <SettingRow label={lang === "fr" ? "Churn mensuel" : "Monthly churn"}><NumberField value={cfg.churnMonthly} onChange={function (v) { cfgSet(setCfg, "churnMonthly", v); }} min={0} max={0.50} step={0.001} width="80px" pct /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Expansion MRR" : "MRR expansion"}><NumberField value={cfg.expansionRate} onChange={function (v) { cfgSet(setCfg, "expansionRate", v); }} min={0} max={0.20} step={0.005} width="80px" pct /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Croissance CA" : "Revenue growth"}><NumberField value={cfg.revenueGrowthRate} onChange={function (v) { cfgSet(setCfg, "revenueGrowthRate", v); }} min={0} max={3} step={0.05} width="80px" pct /></SettingRow>
                  <SettingRow label="CAC" last><NumberField value={cfg.cacTarget} onChange={function (v) { cfgSet(setCfg, "cacTarget", v); }} min={0} max={20000} step={100} width="90px" /></SettingRow>
                </SectionBlock>
              ) : null}
              {cfg.businessType === "ecommerce" ? (<SectionBlock title="E-commerce">
                <SettingRow label={lang === "fr" ? "Commandes / mois" : "Orders / mo"}><NumberField value={cfg.ordersPerMonth} onChange={function (v) { cfgSet(setCfg, "ordersPerMonth", v); }} min={0} max={100000} step={10} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Visiteurs / mois" : "Visitors / mo"}><NumberField value={cfg.monthlyVisitors} onChange={function (v) { cfgSet(setCfg, "monthlyVisitors", v); }} min={0} max={10000000} step={100} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Taux de retour" : "Return rate"} last><NumberField value={cfg.returnRate} onChange={function (v) { cfgSet(setCfg, "returnRate", v); }} min={0} max={0.50} step={0.01} width="80px" pct /></SettingRow>
              </SectionBlock>) : null}
              {cfg.businessType === "services" ? (<SectionBlock title="Services">
                <SettingRow label={lang === "fr" ? "Taux horaire" : "Hourly rate"}><NumberField value={cfg.avgHourlyRate} onChange={function (v) { cfgSet(setCfg, "avgHourlyRate", v); }} min={0} max={500} step={5} width="80px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Utilisation" : "Utilization"}><NumberField value={cfg.utilizationTarget} onChange={function (v) { cfgSet(setCfg, "utilizationTarget", v); }} min={0} max={1} step={0.05} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Marge projet" : "Project margin"} last><NumberField value={cfg.avgProjectMargin} onChange={function (v) { cfgSet(setCfg, "avgProjectMargin", v); }} min={0} max={1} step={0.05} width="80px" pct /></SettingRow>
              </SectionBlock>) : null}
              {cfg.businessType === "freelancer" ? (<SectionBlock title={lang === "fr" ? "Indépendant" : "Freelancer"}>
                <SettingRow label={lang === "fr" ? "Tarif journalier" : "Daily rate"}><NumberField value={cfg.dailyRate} onChange={function (v) { cfgSet(setCfg, "dailyRate", v); }} min={0} max={5000} step={50} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Jours ouvrés" : "Working days"}><NumberField value={cfg.workingDaysPerYear} onChange={function (v) { cfgSet(setCfg, "workingDaysPerYear", v); }} min={100} max={300} step={1} width="70px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Jours facturés" : "Days billed"} last><NumberField value={cfg.daysBilled} onChange={function (v) { cfgSet(setCfg, "daysBilled", v); }} min={0} max={300} step={1} width="70px" /></SettingRow>
              </SectionBlock>) : null}
              {cfg.businessType === "retail" ? (<SectionBlock title="Retail">
                <SettingRow label={lang === "fr" ? "Surface (m²)" : "Store (m²)"}><NumberField value={cfg.storeSize} onChange={function (v) { cfgSet(setCfg, "storeSize", v); }} min={0} max={10000} step={10} width="80px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Fréquentation" : "Footfall"}><NumberField value={cfg.monthlyFootfall} onChange={function (v) { cfgSet(setCfg, "monthlyFootfall", v); }} min={0} max={100000} step={100} width="90px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Démarque" : "Shrinkage"} last><NumberField value={cfg.shrinkageRate} onChange={function (v) { cfgSet(setCfg, "shrinkageRate", v); }} min={0} max={0.10} step={0.001} width="80px" pct /></SettingRow>
              </SectionBlock>) : null}
            </>
          ) : null}

          {section === "metrics" ? (
            <>
              <PageTitle title={lang === "fr" ? "Objectifs" : "Targets"} />
              <SectionBlock title={lang === "fr" ? "Objectifs financiers" : "Financial targets"} sub={lang === "fr" ? "Vos objectifs pour suivre la progression." : "Your goals to track progress."}>
                <SettingRow label={lang === "fr" ? "ARR cible" : "Target ARR"}><NumberField value={(cfg.targets || {}).arr || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { arr: v })); }} min={0} max={10000000} step={10000} width="110px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "MRR cible" : "Target MRR"}><NumberField value={(cfg.targets || {}).mrr || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { mrr: v })); }} min={0} max={1000000} step={1000} width="100px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Runway cible" : "Target runway"}><NumberField value={(cfg.targets || {}).runway || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { runway: v })); }} min={0} max={60} step={1} width="60px" suf="mo" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Marge EBITDA" : "EBITDA margin"} last><NumberField value={(cfg.targets || {}).ebitdaMargin || 0} onChange={function (v) { cfgSet(setCfg, "targets", Object.assign({}, cfg.targets || {}, { ebitdaMargin: v })); }} min={0} max={1} step={0.01} width="80px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "projections" ? (
            <>
              <PageTitle title="Projections" />
              <SectionBlock title={lang === "fr" ? "Paramètres de projection" : "Projection settings"} sub={lang === "fr" ? "Valeurs par défaut pour la trésorerie." : "Defaults for cash flow projections."}>
                <SettingRow label={lang === "fr" ? "Horizon" : "Horizon"}><NumberField value={cfg.projectionYears || 3} onChange={function (v) { cfgSet(setCfg, "projectionYears", v); }} min={1} max={10} step={1} width="60px" suf={lang === "fr" ? "ans" : "yrs"} /></SettingRow>
                <SettingRow label={lang === "fr" ? "Croissance CA" : "Revenue growth"}><NumberField value={cfg.revenueGrowthRate || 0.10} onChange={function (v) { cfgSet(setCfg, "revenueGrowthRate", v); }} min={-0.50} max={5} step={0.05} width="80px" pct /></SettingRow>
                <SettingRow label={lang === "fr" ? "Inflation charges" : "Cost escalation"} last><NumberField value={cfg.costEscalation || 0.02} onChange={function (v) { cfgSet(setCfg, "costEscalation", v); }} min={0} max={0.50} step={0.01} width="80px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "modules" ? (
            <>
              <PageTitle title={lang === "fr" ? "Modules" : "Modules"} />
              <SectionBlock
                title={lang === "fr" ? "Modules premium" : "Premium modules"}
                sub={lang === "fr" ? "Activez les modules deja disponibles sur votre compte. Le toggle reste verrouille tant que le module n'est pas paye." : "Enable the modules already available on your account. The toggle stays locked until the module is paid."}
              >
                <SettingRow
                  label="Marketing & Acquisition"
                  desc={marketing && marketing.paid
                    ? (lang === "fr" ? "Module paye. Activez-le pour le faire apparaitre dans la navigation." : "Paid module. Enable it to show it in navigation.")
                    : (lang === "fr" ? "Module premium non paye. La page de presentation reste accessible, mais la navigation detaillee est verrouillee." : "Premium module not paid. The overview page remains accessible, but detailed navigation is locked.")}
                  last
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 10px", borderRadius: "var(--r-full)",
                      background: marketing && marketing.paid ? "var(--color-success-bg)" : "var(--bg-accordion)",
                      border: "1px solid " + (marketing && marketing.paid ? "var(--color-success-border)" : "var(--border-light)"),
                      fontSize: 11, fontWeight: 600,
                      color: marketing && marketing.paid ? "var(--color-success)" : "var(--text-secondary)",
                    }}>
                      {marketing && marketing.paid ? <CheckCircle size={12} weight="fill" /> : <Lock size={12} weight="bold" />}
                      {marketing && marketing.paid
                        ? (lang === "fr" ? "Paye" : "Paid")
                        : (lang === "fr" ? "Bloque" : "Locked")}
                    </div>
                    <Toggle
                      on={!!(marketing && marketing.enabled)}
                      onChange={function () {
                        setMarketing(function (prev) {
                          return Object.assign({}, prev || {}, { enabled: !(prev && prev.enabled) });
                        });
                      }}
                      disabled={!(marketing && marketing.paid)}
                    />
                  </div>
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "accounting" ? (
            <>
              <PageTitle title={lang === "fr" ? "Comptabilité" : "Accounting"} />
              <SectionBlock title={lang === "fr" ? "Exercice fiscal" : "Fiscal year"}>
                <SettingRow label={lang === "fr" ? "Début" : "Start"} last><Select value={cfg.fiscalYearStart || "01-01"} onChange={function (v) { cfgSet(setCfg, "fiscalYearStart", v); }} options={[{ value: "01-01", label: lang === "fr" ? "Janvier" : "January" }, { value: "04-01", label: lang === "fr" ? "Avril" : "April" }, { value: "07-01", label: lang === "fr" ? "Juillet" : "July" }, { value: "10-01", label: lang === "fr" ? "Octobre" : "October" }]} width={130} /></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Amortissement" : "Depreciation"}>
                <SettingRow label={lang === "fr" ? "Méthode par défaut" : "Default method"} last><Select value={cfg.depreciationMethod || "linear"} onChange={function (v) { cfgSet(setCfg, "depreciationMethod", v); }} options={[{ value: "linear", label: lang === "fr" ? "Linéaire" : "Straight-line" }, { value: "declining", label: lang === "fr" ? "Dégressif" : "Declining" }]} width={130} /></SettingRow>
              </SectionBlock>
              {cfg.showPcmn ? (
                <SectionBlock title={lang === "fr" ? "Durées d'amortissement" : "Depreciation durations"} sub={lang === "fr" ? "Durées légales belges par catégorie d'actif. Modifiables si justifié." : "Belgian legal durations per asset category. Can be adjusted if justified."}>
                  <SettingRow label={lang === "fr" ? "Matériel informatique" : "IT equipment"} desc="PCMN 2410"><NumberField value={(cfg.depYears || {})["2410"] || 3} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2410"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Mobilier & véhicules" : "Furniture & vehicles"} desc="PCMN 2400"><NumberField value={(cfg.depYears || {})["2400"] || 5} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2400"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Brevets & marques" : "Patents & trademarks"} desc="PCMN 2110"><NumberField value={(cfg.depYears || {})["2110"] || 5} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2110"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Constructions" : "Buildings"} desc="PCMN 2210"><NumberField value={(cfg.depYears || {})["2210"] || 33} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2210"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Installations & machines" : "Plant & machinery"} desc="PCMN 2300"><NumberField value={(cfg.depYears || {})["2300"] || 10} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2300"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                  <SettingRow label={lang === "fr" ? "Frais d'établissement" : "Setup costs"} desc="PCMN 2010" last><NumberField value={(cfg.depYears || {})["2010"] || 5} onChange={function (v) { var dy = Object.assign({}, cfg.depYears || {}); dy["2010"] = v; cfgSet(setCfg, "depYears", dy); }} min={1} max={50} step={1} width="50px" suf={lang === "fr" ? "ans" : "yr"} /></SettingRow>
                </SectionBlock>
              ) : null}
              <SectionBlock title={lang === "fr" ? "Délais de paiement" : "Payment terms"} sub={lang === "fr" ? "Pour le calcul du BFR." : "For working capital calculation."}>
                <SettingRow label={lang === "fr" ? "Clients" : "Clients"}><NumberField value={cfg.paymentTermsClient || 30} onChange={function (v) { cfgSet(setCfg, "paymentTermsClient", v); }} min={0} max={120} step={5} width="60px" suf="j" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Fournisseurs" : "Suppliers"} last><NumberField value={cfg.paymentTermsSupplier || 30} onChange={function (v) { cfgSet(setCfg, "paymentTermsSupplier", v); }} min={0} max={120} step={5} width="60px" suf="j" /></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Titres-repas" : "Meal vouchers"} sub={lang === "fr" ? "Valeur faciale et répartition employeur / employé." : "Face value and employer / employee split."}>
                <SettingRow label={lang === "fr" ? "Valeur faciale" : "Face value"} desc={lang === "fr" ? "Maximum légal : 8,00 €" : "Legal max: €8.00"}><NumberField value={cfg.mealVoucherTotal || 8} onChange={function (v) { cfgSet(setCfg, "mealVoucherTotal", v); }} min={1} max={8} step={0.5} width="60px" suf="€" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Part employeur" : "Employer share"} desc={lang === "fr" ? "Maximum légal : 6,91 €" : "Legal max: €6.91"}><NumberField value={cfg.mealVoucherEmployer || 6.91} onChange={function (v) { cfgSet(setCfg, "mealVoucherEmployer", v); }} min={0} max={6.91} step={0.1} width="60px" suf="€" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Part employé" : "Employee share"} desc={lang === "fr" ? "Minimum légal : 1,09 €" : "Legal min: €1.09"} last><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{((cfg.mealVoucherTotal || 8) - (cfg.mealVoucherEmployer || 6.91)).toFixed(2)} €</span></SettingRow>
              </SectionBlock>
              <SectionBlock title={lang === "fr" ? "Bilan prévisionnel" : "Balance sheet"} sub={lang === "fr" ? "Postes manuels pour le bilan. Les prêts associés se synchronisent automatiquement depuis la page Financement." : "Manual balance sheet items. Shareholder loans auto-sync from the Financing page."}>
                <SettingRow label={lang === "fr" ? "Prime d'émission" : "Share premium"} desc="PCMN 11"><CurrencyInput value={cfg.capitalPremium || 0} onChange={function (v) { cfgSet(setCfg, "capitalPremium", v); }} suffix="€" width="120px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Charges à reporter" : "Prepaid expenses"} desc="PCMN 490"><CurrencyInput value={cfg.prepaidExpenses || 0} onChange={function (v) { cfgSet(setCfg, "prepaidExpenses", v); }} suffix="€" width="120px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Produits à reporter" : "Deferred revenue"} desc="PCMN 493"><CurrencyInput value={cfg.deferredRevenue || 0} onChange={function (v) { cfgSet(setCfg, "deferredRevenue", v); }} suffix="€" width="120px" /></SettingRow>
                <SettingRow label={lang === "fr" ? "Dépréciation stock" : "Stock obsolescence"} desc={lang === "fr" ? "Provision pour dépréciation" : "Write-down provision"} last><NumberField value={cfg.stockObsolescence || 0} onChange={function (v) { cfgSet(setCfg, "stockObsolescence", v); }} min={0} max={1} step={0.01} width="70px" pct /></SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "account" ? (
            <>
              <PageTitle title={lang === "fr" ? "Compte & Sync" : "Account & Sync"} />
              <StorageSettings getSnapshot={getSnapshot} />
            </>
          ) : null}

          {section === "team" ? (
            <TeamSection lang={lang} auth={auth} />
          ) : null}

          {section === "accountant" ? (
            <>
              <PageTitle title={lang === "fr" ? "Mode comptable" : "Accounting mode"} />
              <SectionBlock title={lang === "fr" ? "Mode comptable" : "Accounting mode"} sub={lang === "fr" ? "Affiche les codes PCMN, les options comptables avancées et la barre comptable." : "Shows PCMN codes, advanced accounting options and the accounting bar."}>
                <SettingRow label={lang === "fr" ? "Activer" : "Enable"} desc={lang === "fr" ? "Ctrl+Shift+E pour basculer rapidement." : "Ctrl+Shift+E to toggle quickly."} last>
                  <Toggle on={cfg.showPcmn === true} onChange={function () { cfgSet(setCfg, "showPcmn", !cfg.showPcmn); }} />
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "developer" && canDevMode ? (
            <>
              <PageTitle title={lang === "fr" ? "Développeur" : "Developer"} />
              <SectionBlock title={lang === "fr" ? "Mode développeur" : "Developer mode"} sub={lang === "fr" ? "Outils de debug et formules." : "Debug tools and formulas."}>
                <SettingRow label={lang === "fr" ? "Activer" : "Enable"} desc={lang === "fr" ? "Affiche les formules au survol des valeurs." : "Shows formulas on hover."} last>
                  <Toggle on={devMode} onChange={toggleDevMode} color="var(--color-dev)" />
                </SettingRow>
              </SectionBlock>
            </>
          ) : null}

          {section === "danger" ? (
            <DangerWorkspaceSection lang={lang} cfg={cfg} setCfg={setCfg} setCosts={setCosts} setSals={setSals} setGrants={setGrants} setPoolSize={setPoolSize} setShareholders={setShareholders} setRoundSim={setRoundSim} setStreams={setStreams} setEsopEnabled={setEsopEnabled} setMarketing={setMarketing} />
          ) : null}

          {section === "danger_account" ? (
            <DangerAccountSection lang={lang} auth={auth} />
          ) : null}

        </div>
      </div>
    </PageLayout>
  );
}
