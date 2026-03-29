import { useState, useEffect, useCallback } from "react";
import {
  Copy, Check, UserPlus, Trash, Link, PaperPlaneTilt, ArrowCounterClockwise,
  UsersThree, Calculator, Handshake, Crown, ShareNetwork, X, WarningCircle,
} from "@phosphor-icons/react";
import { Modal, ModalBody, ModalFooter, Button, Badge, Select, ButtonUtility } from "../components";
import Avatar from "./Avatar";
import { useAuth } from "../context/useAuth";
import { useT } from "../context";
import { getSupabase, isConfigured } from "../lib/supabase";
import { hashColor } from "../context/PresenceContext";

function getRoleIcon(role) {
  if (role === "owner") return Crown;
  if (role === "accountant") return Calculator;
  if (role === "advisor") return Handshake;
  return UsersThree;
}

function getRoleBadgeColor(role) {
  if (role === "owner") return "brand";
  if (role === "accountant") return "info";
  if (role === "advisor") return "warning";
  return "gray";
}

export default function ShareModal({ open, onClose, workspaceId, workspaceName }) {
  var cfg_name = workspaceName || "";
  var auth = useAuth();
  var t = useT();
  var ct = t.collab || {};

  var [email, setEmail] = useState("");
  var [role, setRole] = useState("member");
  var [sending, setSending] = useState(false);
  var [error, setError] = useState(null);
  var [success, setSuccess] = useState(null);
  var [copiedId, setCopiedId] = useState(null);
  var [confirmRemove, setConfirmRemove] = useState(null);

  var [members, setMembers] = useState([]);
  var [invitations, setInvitations] = useState([]);
  var [loadingData, setLoadingData] = useState(false);

  /* ── Load members + invitations on open ── */
  var loadData = useCallback(function () {
    if (!workspaceId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;
    setLoadingData(true);

    Promise.all([
      sb.rpc("get_workspace_members", { ws_id: workspaceId }),
      sb.from("workspace_invitations")
        .select("id, email, role, token, expires_at, accepted_at, created_at")
        .eq("workspace_id", workspaceId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]).then(function (results) {
      if (results[0].data) setMembers(results[0].data);
      if (results[1].data) setInvitations(results[1].data);
      setLoadingData(false);
    }).catch(function () { setLoadingData(false); });
  }, [workspaceId]);

  useEffect(function () {
    if (open) {
      loadData();
      setEmail("");
      setRole("member");
      setError(null);
      setSuccess(null);
    }
  }, [open, loadData]);

  /* ── Send invitation ── */
  function handleInvite() {
    if (!email.trim()) return;
    if (!workspaceId || !auth.user) return;
    setError(null);
    setSuccess(null);
    setSending(true);

    var sb = getSupabase();
    if (!sb) { setSending(false); return; }

    /* Check if already a member */
    var alreadyMember = members.some(function (m) {
      return m.profiles && m.profiles.email && m.profiles.email.toLowerCase() === email.trim().toLowerCase();
    });
    if (alreadyMember) {
      setError(ct.error_already_member || "Cet utilisateur est déjà membre de cet espace.");
      setSending(false);
      return;
    }

    /* Check if already invited */
    var alreadyInvited = invitations.some(function (inv) {
      return inv.email.toLowerCase() === email.trim().toLowerCase();
    });
    if (alreadyInvited) {
      setError(ct.error_already_invited || "Une invitation est déjà en attente pour cet email.");
      setSending(false);
      return;
    }

    /* Get workspace name for denormalized storage */
    var wsName = "";
    var wsMatch = members.find(function (m) { return m.role === "owner"; });
    if (wsMatch && wsMatch.profiles) wsName = wsMatch.profiles.display_name || "";

    sb.from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        email: email.trim().toLowerCase(),
        role: role,
        invited_by: auth.user.id,
        workspace_name: cfg_name || "",
        inviter_name: auth.user.displayName || "",
      })
      .select("id, email, role, token, expires_at, created_at, workspace_name, inviter_name")
      .single()
      .then(function (res) {
        setSending(false);
        if (res.error) {
          setError((res.error && res.error.message) || "Error");
          return;
        }
        setEmail("");
        setInvitations(function (prev) { return [res.data].concat(prev); });

        /* Auto-copy the link and show it */
        var invUrl = window.location.origin + "/join?token=" + res.data.token;
        navigator.clipboard.writeText(invUrl).then(function () {
          setSuccess(ct.invite_sent_link || "Invitation cr\u00e9\u00e9e ! Lien copi\u00e9 dans le presse-papier.");
          setCopiedId(res.data.id);
          setTimeout(function () { setCopiedId(null); }, 3000);
        }).catch(function () {
          setSuccess(ct.invite_sent || "Invitation cr\u00e9\u00e9e !");
        });

        setTimeout(function () { setSuccess(null); }, 5000);
      })
      .catch(function (err) {
        setSending(false);
        setError(err.message || "Error");
      });
  }

  /* ── Copy invitation link ── */
  function copyLink(token, id) {
    var url = window.location.origin + "/join?token=" + token;
    navigator.clipboard.writeText(url).then(function () {
      setCopiedId(id);
      setTimeout(function () { setCopiedId(null); }, 2000);
    }).catch(function () {});
  }

  /* ── Cancel invitation ── */
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

  /* ── Remove member ── */
  function removeMember(memberId) {
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

  var isOwner = auth.isOwner;

  /* ── Localized role options ── */
  var roleOpts = [
    { value: "member", label: ct.role_member || "Membre" },
    { value: "accountant", label: ct.role_accountant || "Comptable" },
    { value: "advisor", label: ct.role_advisor || "Accompagnateur" },
  ];

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={ct.share_title || "Partager l'espace de travail"}
      subtitle={ct.share_sub || "Invitez des collaborateurs à rejoindre votre plan financier."}
      icon={<ShareNetwork size={20} weight="duotone" color="var(--brand)" />}
    >
      <ModalBody>
        {/* ── Invite section (owner only) ── */}
        {isOwner ? (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "flex-end" }}>
              {/* Email */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  {ct.invite_email || "Email"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={function (e) { setEmail(e.target.value); }}
                  placeholder={ct.invite_placeholder || "prenom@entreprise.com"}
                  onKeyDown={function (e) { if (e.key === "Enter") handleInvite(); }}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 var(--sp-3)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Role */}
              <div style={{ width: 140 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  {ct.invite_role || "Rôle"}
                </label>
                <Select
                  value={role}
                  onChange={function (v) { setRole(v); }}
                  options={roleOpts}
                  size="md"
                />
              </div>

              {/* Invite button */}
              <Button
                color="primary"
                size="md"
                onClick={handleInvite}
                isLoading={sending}
                isDisabled={!email.trim()}
                iconLeading={<UserPlus size={14} />}
              >
                {ct.invite_btn || "Inviter"}
              </Button>
            </div>

            {/* Error / Success */}
            {error ? (
              <div style={{ marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-error)" }}>{error}</div>
            ) : null}
            {success ? (
              <div style={{ marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-success)" }}>{success}</div>
            ) : null}
          </div>
        ) : null}

        {/* ── Members list ── */}
        <div style={{ marginBottom: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {ct.members_title || "Membres"} ({members.filter(function (m) { return m.status === "active"; }).length})
          </div>

          {members.filter(function (m) { return m.status === "active"; }).map(function (m) {
            var name = m.profiles ? m.profiles.display_name : "";
            var memberEmail = m.profiles ? m.profiles.email : "";
            var Icon = getRoleIcon(m.role);
            var isSelf = auth.user && m.user_id === auth.user.id;

            return (
              <div key={m.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "var(--sp-2) 0",
                borderBottom: "1px solid var(--border-light)",
              }}>
                <Avatar name={name} userId={m.user_id} size={32} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name || memberEmail}
                    </span>
                    {isSelf ? (
                      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>({ct.you || "vous"})</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{memberEmail}</div>
                </div>

                <Badge color={getRoleBadgeColor(m.role)} size="sm" icon={<Icon size={12} />}>
                  {m.role === "owner" ? (ct.role_owner || "Propriétaire") : (roleOpts.find(function (o) { return o.value === m.role; }) || {}).label || m.role}
                </Badge>

                {/* Remove button (owner only, not self) */}
                {isOwner && !isSelf && m.role !== "owner" ? (
                  <ButtonUtility
                    icon={<X size={14} weight="bold" />}
                    variant="danger"
                    size="header"
                    onClick={function () { setConfirmRemove({ id: m.id, name: name || memberEmail }); }}
                    title={ct.remove || "Exclure"}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* ── Pending invitations ── */}
        {invitations.length > 0 ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
              {ct.pending_title || "Invitations en attente"} ({invitations.length})
            </div>

            {invitations.map(function (inv) {
              var expired = new Date(inv.expires_at) < new Date();
              return (
                <div key={inv.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  padding: "var(--sp-2) 0",
                  borderBottom: "1px solid var(--border-light)",
                  opacity: expired ? 0.5 : 1,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "var(--r-full)",
                    background: "var(--bg-accordion)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <PaperPlaneTilt size={14} color="var(--text-muted)" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{inv.email}</div>
                    <div style={{ fontSize: 11, color: expired ? "var(--color-error)" : "var(--text-faint)" }}>
                      {expired ? (ct.expired || "Expiré") : (ct.pending || "En attente")}
                    </div>
                  </div>

                  <Badge color={getRoleBadgeColor(inv.role)} size="sm">
                    {(roleOpts.find(function (o) { return o.value === inv.role; }) || {}).label || inv.role}
                  </Badge>

                  {/* Copy link */}
                  <ButtonUtility
                    icon={copiedId === inv.id ? <Check size={14} weight="bold" /> : <Link size={14} />}
                    variant={copiedId === inv.id ? "brand" : "default"}
                    size="header"
                    onClick={function () { copyLink(inv.token, inv.id); }}
                    title={ct.copy_link || "Copier le lien"}
                  />

                  {/* Cancel */}
                  {isOwner ? (
                    <ButtonUtility
                      icon={<Trash size={14} />}
                      variant="danger"
                      size="header"
                      onClick={function () { cancelInvitation(inv.id); }}
                      title={ct.cancel_invite || "Annuler"}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </ModalBody>
    </Modal>

    {/* ── Confirm remove modal ── */}
    {confirmRemove ? (
      <Modal
        open={true}
        onClose={function () { setConfirmRemove(null); }}
        size="sm"
        title={ct.confirm_remove_title || "Exclure ce membre ?"}
        icon={<WarningCircle size={20} weight="duotone" color="var(--color-warning)" />}
      >
        <ModalBody>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {(ct.confirm_remove_desc || "Vous \u00eates sur le point d'exclure {name} de cet espace de travail.").replace("{name}", "")}
            <strong style={{ color: "var(--text-primary)" }}>{confirmRemove.name}</strong>
            {ct.confirm_remove_suffix || " n'aura plus acc\u00e8s aux donn\u00e9es."}
          </div>
        </ModalBody>
        <ModalFooter>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-2)", width: "100%" }}>
            <Button color="tertiary" size="md" onClick={function () { setConfirmRemove(null); }}>
              {ct.cancel || "Annuler"}
            </Button>
            <Button color="primary-destructive" size="md" onClick={function () { removeMember(confirmRemove.id); }}>
              {ct.confirm_remove_btn || "Exclure"}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    ) : null}
    </>
  );
}
