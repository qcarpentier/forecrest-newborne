import { useState, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import {
  UsersThree, Calculator, Handshake, CheckCircle, WarningCircle,
  ArrowRight, ShieldCheck, Eye, PencilSimple, Gear, XCircle,
} from "@phosphor-icons/react";
import { Button, Card, Badge, Checkbox } from "../components";
import { useAuth } from "../context/useAuth";
import { useT, useLang } from "../context";
import { getSupabase, isConfigured } from "../lib/supabase";

var AuthPage = lazy(function () { return import("./AuthPage"); });

var ROLE_CONFIG = {
  member: {
    icon: UsersThree,
    color: "var(--text-primary)",
    permissions: [
      { icon: Eye, key: "join_perm_view" },
      { icon: PencilSimple, key: "join_perm_edit" },
    ],
    restrictions: [
      { icon: Gear, key: "join_restrict_settings" },
    ],
  },
  accountant: {
    icon: Calculator,
    color: "var(--color-info)",
    permissions: [
      { icon: Eye, key: "join_perm_view" },
    ],
    restrictions: [
      { icon: PencilSimple, key: "join_restrict_edit" },
      { icon: Gear, key: "join_restrict_settings" },
    ],
    notice: "join_accountant_notice",
  },
  advisor: {
    icon: Handshake,
    color: "var(--color-warning)",
    permissions: [
      { icon: Eye, key: "join_perm_view" },
    ],
    restrictions: [
      { icon: PencilSimple, key: "join_restrict_edit" },
      { icon: Gear, key: "join_restrict_settings" },
    ],
    notice: "join_advisor_notice",
  },
};

/* ── Default translations ── */
var DEFAULTS = {
  join_title_member: "Vous \u00eates invit\u00e9 \u00e0 collaborer",
  join_title_accountant: "Invitation en tant que comptable",
  join_title_advisor: "Invitation en tant qu'accompagnateur",
  join_sub: "{inviter} vous invite \u00e0 rejoindre l'espace de travail",
  join_sub_no_name: "Vous avez \u00e9t\u00e9 invit\u00e9 \u00e0 rejoindre un espace de travail",
  join_workspace: "Espace de travail",
  join_role: "Votre r\u00f4le",
  join_permissions: "Ce que vous pourrez faire",
  join_restrictions: "Restrictions",
  join_perm_view: "Voir toutes les donn\u00e9es financi\u00e8res",
  join_perm_edit: "Modifier les donn\u00e9es",
  join_restrict_settings: "Pas d'acc\u00e8s aux param\u00e8tres avanc\u00e9s",
  join_restrict_edit: "Modification non disponible pour le moment",
  join_accountant_notice: "La vue comptable d\u00e9di\u00e9e sera bient\u00f4t disponible.",
  join_advisor_notice: "La vue accompagnateur d\u00e9di\u00e9e sera bient\u00f4t disponible.",
  join_accept_terms: "J'accepte de rejoindre cet espace de travail",
  join_btn: "Rejoindre",
  join_decline: "Refuser",
  join_expired: "Cette invitation a expir\u00e9",
  join_invalid: "Invitation invalide ou d\u00e9j\u00e0 utilis\u00e9e",
  join_success: "Bienvenue ! Redirection en cours...",
  join_error: "Une erreur est survenue",
  join_login_first: "Connectez-vous pour accepter l'invitation",
  role_member: "Membre",
  role_accountant: "Comptable",
  role_advisor: "Accompagnateur",
};

export default function JoinPage({ token, onComplete }) {
  var auth = useAuth();
  var t = useT();
  var ct = t.collab || {};
  var { lang } = useLang();

  var [invitation, setInvitation] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [accepted, setAccepted] = useState(false);
  var [termsChecked, setTermsChecked] = useState(false);
  var [joining, setJoining] = useState(false);
  var [needsAuth, setNeedsAuth] = useState(false);

  function tr(key) {
    return ct[key] || DEFAULTS[key] || key;
  }

  /* ── Load invitation by token ── */
  useEffect(function () {
    if (!token || !isConfigured()) {
      setError(tr("join_invalid"));
      setLoading(false);
      return;
    }

    var sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    sb.from("workspace_invitations")
      .select("id, email, role, token, expires_at, accepted_at, workspace_id, workspace_name, inviter_name")
      .eq("token", token)
      .single()
      .then(function (res) {
        setLoading(false);
        if (res.error || !res.data) {
          setError(tr("join_invalid"));
          return;
        }

        var inv = res.data;

        /* Check if already accepted */
        if (inv.accepted_at) {
          setError(tr("join_invalid"));
          return;
        }

        /* Check expiry */
        if (new Date(inv.expires_at) < new Date()) {
          setError(tr("join_expired"));
          return;
        }

        /* Fallback: fetch workspace name if missing (old invitations) */
        if (!inv.workspace_name && inv.workspace_id) {
          sb.rpc("get_workspace_name", { ws_id: inv.workspace_id }).then(function (rpcRes) {
            if (rpcRes.data) {
              inv.workspace_name = rpcRes.data;
              setInvitation(Object.assign({}, inv));
            }
          }).catch(function () { /* ignore, just show dash */ });
        }

        setInvitation(inv);

        /* Check if user is authenticated */
        if (!auth.user) {
          setNeedsAuth(true);
          /* Store token for after auth */
          try { sessionStorage.setItem("forecrest_join_token", token); } catch (e) {}
        }
      })
      .catch(function () {
        setLoading(false);
        setError(tr("join_invalid"));
      });
  }, [token, auth.user]);

  /* ── After auth, check if we came from a join flow ── */
  useEffect(function () {
    if (auth.user && needsAuth) {
      setNeedsAuth(false);
    }
  }, [auth.user, needsAuth]);

  /* ── Accept invitation (via SECURITY DEFINER RPC) ── */
  function handleJoin() {
    if (!invitation || !auth.user) return;
    setJoining(true);
    setError(null);

    var sb = getSupabase();
    if (!sb) { setJoining(false); return; }

    sb.rpc("accept_invitation", { invite_token: invitation.token })
      .then(function (res) {
        if (res.error) throw res.error;

        var result = res.data;
        if (result && result.error) {
          setJoining(false);
          setError(result.error);
          return;
        }

        /* Set workspace in auth context */
        auth.setWorkspaceId(result.workspace_id || invitation.workspace_id);
        auth.setWorkspaceRole(result.role || invitation.role);

        setAccepted(true);
        setJoining(false);

        /* Clean up URL and session */
        try { sessionStorage.removeItem("forecrest_join_token"); } catch (e) {}
        window.history.replaceState(null, "", "/");

        /* Redirect to dashboard after short delay */
        setTimeout(function () {
          if (onComplete) onComplete();
        }, 1500);
      })
      .catch(function (err) {
        setJoining(false);
        setError(err.message || tr("join_error"));
      });
  }

  /* ── Decline ── */
  function handleDecline() {
    try { sessionStorage.removeItem("forecrest_join_token"); } catch (e) {}
    window.history.replaceState(null, "", "/");
    if (onComplete) onComplete();
  }

  /* ── Show auth page if not logged in ── */
  if (needsAuth && !auth.user) {
    return (
      <Suspense fallback={null}>
        <AuthPage />
      </Suspense>
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-page)",
        fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {ct.loading || "Chargement..."}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !invitation) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-page)",
        fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      }}>
        <Card sx={{ maxWidth: 420, width: "100%", padding: "var(--sp-6)", textAlign: "center" }}>
          <XCircle size={48} weight="duotone" color="var(--color-error)" style={{ marginBottom: "var(--sp-3)" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>
            {error}
          </div>
          <Button color="secondary" size="md" onClick={handleDecline}>
            {ct.go_home || "Retour \u00e0 l'accueil"}
          </Button>
        </Card>
      </div>
    );
  }

  /* ── Success state ── */
  if (accepted) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-page)",
        fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      }}>
        <Card sx={{ maxWidth: 420, width: "100%", padding: "var(--sp-6)", textAlign: "center" }}>
          <CheckCircle size={48} weight="duotone" color="var(--color-success)" style={{ marginBottom: "var(--sp-3)" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {tr("join_success")}
          </div>
        </Card>
      </div>
    );
  }

  /* ── Main join screen ── */
  var roleCfg = ROLE_CONFIG[invitation.role] || ROLE_CONFIG.member;
  var RoleIcon = roleCfg.icon;
  var workspaceName = invitation.workspace_name || "\u2014";
  var inviterName = invitation.inviter_name || "";

  var titleKey = "join_title_" + invitation.role;
  var roleLabel = tr("role_" + invitation.role);

  return createPortal(
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-page)",
      fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      color: "var(--text-primary)",
      padding: "var(--sp-6)",
    }}>
      <Card sx={{ maxWidth: 480, width: "100%", padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "var(--sp-6) var(--sp-6) var(--sp-5)",
          background: "var(--bg-accordion)",
          borderBottom: "1px solid var(--border-light)",
          textAlign: "center",
        }}>
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: "var(--sp-4)", opacity: 0.5,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "var(--text-on-brand, #fff)",
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}>F</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Forecrest</span>
          </div>

          {/* Role icon */}
          <div style={{
            width: 52, height: 52, borderRadius: "var(--r-lg)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--sp-3)",
          }}>
            <RoleIcon size={22} weight="duotone" color={roleCfg.color} />
          </div>

          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--text-primary)",
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            marginBottom: "var(--sp-2)",
          }}>
            {tr(titleKey)}
          </div>

          <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {inviterName
              ? tr("join_sub").replace("{inviter}", inviterName)
              : tr("join_sub_no_name")}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--sp-5) var(--sp-6)" }}>
          {/* Workspace info */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "var(--sp-3) 0", borderBottom: "1px solid var(--border-light)",
          }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{tr("join_workspace")}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{workspaceName}</span>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "var(--sp-3) 0", borderBottom: "1px solid var(--border-light)",
          }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{tr("join_role")}</span>
            <Badge color={invitation.role === "accountant" ? "info" : invitation.role === "advisor" ? "warning" : "gray"} size="sm">
              {roleLabel}
            </Badge>
          </div>

          {/* Permissions */}
          <div style={{ marginTop: "var(--sp-4)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
              {tr("join_permissions")}
            </div>
            {roleCfg.permissions.map(function (p) {
              var PIcon = p.icon;
              return (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-1) 0" }}>
                  <CheckCircle size={16} weight="fill" color="var(--color-success)" />
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{tr(p.key)}</span>
                </div>
              );
            })}
          </div>

          {/* Restrictions */}
          {roleCfg.restrictions && roleCfg.restrictions.length > 0 ? (
            <div style={{ marginTop: "var(--sp-3)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
                {tr("join_restrictions")}
              </div>
              {roleCfg.restrictions.map(function (r) {
                return (
                  <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-1) 0" }}>
                    <WarningCircle size={16} weight="fill" color="var(--color-warning)" />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{tr(r.key)}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Role notice */}
          {roleCfg.notice ? (
            <div style={{
              marginTop: "var(--sp-3)",
              padding: "var(--sp-3)",
              borderRadius: "var(--r-md)",
              background: "var(--color-info-bg, rgba(37,99,235,0.06))",
              border: "1px solid var(--color-info-border, rgba(37,99,235,0.15))",
              fontSize: 12,
              color: "var(--color-info)",
              lineHeight: 1.5,
            }}>
              {tr(roleCfg.notice)}
            </div>
          ) : null}

          {/* Terms */}
          <div style={{ marginTop: "var(--sp-5)" }}>
            <Checkbox
              checked={termsChecked}
              onChange={function (v) { setTermsChecked(v); }}
              label={tr("join_accept_terms")}
            />
          </div>

          {error ? (
            <div style={{ marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-error)" }}>{error}</div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "var(--sp-4) var(--sp-6)",
          borderTop: "1px solid var(--border-light)",
          background: "var(--bg-card)",
        }}>
          <Button color="tertiary" size="md" onClick={handleDecline}>
            {tr("join_decline")}
          </Button>
          <Button
            color="primary"
            size="md"
            onClick={handleJoin}
            isLoading={joining}
            isDisabled={!termsChecked}
            iconTrailing={<ArrowRight size={14} />}
          >
            {tr("join_btn")}
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
