import { useState, useEffect, useCallback } from "react";
import {
  Check, UserPlus, Link, PaperPlaneTilt,
  UsersThree, Calculator, Handshake, Crown, ShareNetwork, X, WarningCircle,
  Copy, Lock,
} from "@phosphor-icons/react";
import { Modal, ModalBody, ModalFooter, Button, Badge, Select, ButtonUtility } from "../components";
import Avatar from "./Avatar";
import { useAuth } from "../context/useAuth";
import { useT } from "../context";
import { getSupabase, isConfigured } from "../lib/supabase";
import useBreakpoint from "../hooks/useBreakpoint";

/* ── Slot limits ── */
var SLOTS_FREE = { member: 3, accountant: 1, advisor: 2 };
var SLOTS_PRO = { member: 10, accountant: 3, advisor: 5 };

/* ── Role config ── */
var ROLE_META = {
  member: { icon: UsersThree, color: "gray", label_fr: "Membre", label_en: "Member", desc_fr: "Acc\u00e8s complet aux donn\u00e9es", desc_en: "Full access to data" },
  accountant: { icon: Calculator, color: "info", label_fr: "Comptable", label_en: "Accountant", desc_fr: "Validation du plan financier", desc_en: "Financial plan validation" },
  advisor: { icon: Handshake, color: "warning", label_fr: "Accompagnateur", label_en: "Advisor", desc_fr: "Suivi et conseils", desc_en: "Guidance and advice" },
};

export default function ShareModal({ open, onClose, workspaceId, workspaceName, isPro, isSolo }) {
  var cfg_name = workspaceName || "";
  var auth = useAuth();
  var t = useT();
  var ct = t.collab || {};
  var isFr = (t._lang || "fr") !== "en";
  var bp = useBreakpoint();
  var isMobile = bp.isMobile;

  var [email, setEmail] = useState("");
  var [displayName, setDisplayName] = useState("");
  var [activeRole, setActiveRole] = useState("member");
  var [sending, setSending] = useState(false);
  var [error, setError] = useState(null);
  var [success, setSuccess] = useState(null);
  var [copiedId, setCopiedId] = useState(null);
  var [copiedLink, setCopiedLink] = useState(false);
  var [confirmRemove, setConfirmRemove] = useState(null);

  var [members, setMembers] = useState([]);
  var [invitations, setInvitations] = useState([]);
  var [loadingData, setLoadingData] = useState(false);

  var slots = isPro ? SLOTS_PRO : SLOTS_FREE;
  var isOwner = auth.isOwner;

  /* ── Load members + invitations ── */
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
      setDisplayName("");
      setError(null);
      setSuccess(null);
      if (isSolo) setActiveRole("accountant");
    }
  }, [open, loadData]);

  /* ── Count used slots per role ── */
  function countUsed(role) {
    var memberCount = members.filter(function (m) { return m.role === role && m.status === "active"; }).length;
    var inviteCount = invitations.filter(function (inv) { return inv.role === role; }).length;
    return memberCount + inviteCount;
  }

  /* ── Send invitation ── */
  function handleInvite() {
    if (!email.trim() || !workspaceId || !auth.user) return;
    setError(null);
    setSuccess(null);

    /* Check slot limit */
    var used = countUsed(activeRole);
    var max = slots[activeRole] || 0;
    if (used >= max) {
      setError(isPro
        ? (isFr ? "Limite atteinte pour ce r\u00f4le." : "Slot limit reached for this role.")
        : (isFr ? "Limite atteinte. Passez \u00e0 Pro pour plus de places." : "Limit reached. Upgrade to Pro for more slots."));
      return;
    }

    /* Solo can't invite members */
    if (isSolo && activeRole === "member") {
      setError(isFr ? "Les ind\u00e9pendants ne peuvent pas inviter de membres d'\u00e9quipe." : "Independent workers cannot invite team members.");
      return;
    }

    /* Check duplicates */
    var emailLower = email.trim().toLowerCase();
    var alreadyMember = members.some(function (m) {
      return m.profiles && m.profiles.email && m.profiles.email.toLowerCase() === emailLower;
    });
    if (alreadyMember) { setError(ct.error_already_member || (isFr ? "D\u00e9j\u00e0 membre." : "Already a member.")); return; }

    var alreadyInvited = invitations.some(function (inv) { return inv.email.toLowerCase() === emailLower; });
    if (alreadyInvited) { setError(ct.error_already_invited || (isFr ? "D\u00e9j\u00e0 invit\u00e9." : "Already invited.")); return; }

    setSending(true);
    var sb = getSupabase();
    if (!sb) { setSending(false); return; }

    sb.from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        email: emailLower,
        role: activeRole,
        invited_by: auth.user.id,
        workspace_name: cfg_name || "",
        inviter_name: displayName.trim() || auth.user.displayName || "",
      })
      .select("id, email, role, token, expires_at, created_at")
      .single()
      .then(function (res) {
        setSending(false);
        if (res.error) { setError((res.error && res.error.message) || "Error"); return; }
        setEmail("");
        setDisplayName("");
        setInvitations(function (prev) { return [res.data].concat(prev); });

        var invUrl = window.location.origin + "/join?token=" + res.data.token;
        navigator.clipboard.writeText(invUrl).then(function () {
          setSuccess(isFr ? "Invitation cr\u00e9\u00e9e ! Lien copi\u00e9." : "Invitation created! Link copied.");
          setCopiedId(res.data.id);
          setTimeout(function () { setCopiedId(null); }, 3000);
        }).catch(function () {
          setSuccess(isFr ? "Invitation cr\u00e9\u00e9e !" : "Invitation created!");
        });
        setTimeout(function () { setSuccess(null); }, 5000);
      })
      .catch(function (err) { setSending(false); setError(err.message || "Error"); });
  }

  function copyLink(token, id) {
    var url = window.location.origin + "/join?token=" + token;
    navigator.clipboard.writeText(url).then(function () {
      setCopiedId(id);
      setTimeout(function () { setCopiedId(null); }, 2000);
    }).catch(function () {});
  }

  function copyWorkspaceLink() {
    navigator.clipboard.writeText(window.location.origin).then(function () {
      setCopiedLink(true);
      setTimeout(function () { setCopiedLink(false); }, 2000);
    }).catch(function () {});
  }

  function cancelInvitation(invId) {
    var sb = getSupabase();
    if (!sb) return;
    sb.from("workspace_invitations").delete().eq("id", invId)
      .then(function () { setInvitations(function (prev) { return prev.filter(function (inv) { return inv.id !== invId; }); }); });
  }

  function removeMember(memberId) {
    var sb = getSupabase();
    if (!sb) return;
    sb.from("workspace_members").update({ status: "removed" }).eq("id", memberId)
      .then(function () { setMembers(function (prev) { return prev.filter(function (m) { return m.id !== memberId; }); }); setConfirmRemove(null); });
  }

  /* ── Role tabs (skip "member" for solo) ── */
  var roleTabs = isSolo
    ? ["accountant", "advisor"]
    : ["member", "accountant", "advisor"];

  /* ── Invitations for active role ── */
  var roleInvitations = invitations.filter(function (inv) { return inv.role === activeRole; });
  var roleMembers = members.filter(function (m) { return m.role === activeRole && m.status === "active"; });
  var used = countUsed(activeRole);
  var max = slots[activeRole] || 0;

  return (
    <>
    <Modal open={open} onClose={onClose} size={isMobile ? "md" : "lg"} title={ct.share_title || (isFr ? "Partager" : "Share")} icon={<ShareNetwork size={20} weight="duotone" color="var(--brand)" />}>
      <ModalBody noPadding>
        {/* ── Copy link bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "var(--sp-2) var(--sp-3)" : "var(--sp-3) var(--sp-5)",
          borderBottom: "1px solid var(--border-light)",
          background: "var(--bg-accordion)",
        }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <Link size={14} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {window.location.origin}
            </span>
          </div>
          <Button color="tertiary" size="sm" onClick={copyWorkspaceLink} iconLeading={copiedLink ? <Check size={14} weight="bold" /> : <Copy size={14} />}>
            {copiedLink ? (isFr ? "Copi\u00e9" : "Copied") : (isFr ? "Copier" : "Copy")}
          </Button>
        </div>

        {/* ── Role tabs ── */}
        <div style={{
          display: "flex", borderBottom: "1px solid var(--border-light)",
          padding: "0 var(--sp-5)",
          overflowX: "auto", flexWrap: "nowrap", WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
        }}>
          {roleTabs.map(function (r) {
            var meta = ROLE_META[r];
            var Icon = meta.icon;
            var isActive = activeRole === r;
            var roleUsed = countUsed(r);
            var roleMax = slots[r] || 0;
            return (
              <button
                key={r}
                onClick={function () { setActiveRole(r); setError(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: isMobile ? "var(--sp-2) var(--sp-3)" : "var(--sp-3) var(--sp-4)",
                  border: "none", borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                  background: "transparent",
                  cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--brand)" : "var(--text-muted)",
                  transition: "color 0.12s, border-color 0.12s",
                  flexShrink: 0,
                }}
              >
                <Icon size={15} weight={isActive ? "fill" : "regular"} />
                {isFr ? meta.label_fr : meta.label_en}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  background: roleUsed >= roleMax ? "var(--color-error-bg, rgba(220,38,38,0.08))" : "var(--bg-accordion)",
                  color: roleUsed >= roleMax ? "var(--color-error)" : "var(--text-faint)",
                }}>
                  {roleUsed}/{roleMax}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: isMobile ? "var(--sp-3)" : "var(--sp-4) var(--sp-5)" }}>
          {/* ── Role description ── */}
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: "var(--sp-3)" }}>
            {isFr ? ROLE_META[activeRole].desc_fr : ROLE_META[activeRole].desc_en}
          </div>

          {/* ── Invite form (owner only, if slots available) ── */}
          {isOwner && used < max ? (
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                <input
                  type="email"
                  value={email}
                  onChange={function (e) { setEmail(e.target.value); }}
                  placeholder={ct.invite_placeholder || "prenom@entreprise.com"}
                  onKeyDown={function (e) { if (e.key === "Enter") handleInvite(); }}
                  style={{
                    flex: 1, height: 36, padding: "0 var(--sp-3)",
                    border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                    background: "var(--bg-card)", color: "var(--text-primary)",
                    fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                />
                <Button color="primary" size="md" onClick={handleInvite} isLoading={sending} isDisabled={!email.trim()} iconLeading={<UserPlus size={14} />}>
                  {ct.invite_btn || (isFr ? "Inviter" : "Invite")}
                </Button>
              </div>
              {error ? <div style={{ marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-error)" }}>{error}</div> : null}
              {success ? <div style={{ marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-success)" }}>{success}</div> : null}
            </div>
          ) : isOwner && used >= max ? (
            <div style={{
              display: "flex", alignItems: "center", gap: "var(--sp-2)",
              padding: "var(--sp-3)", borderRadius: "var(--r-md)",
              background: "var(--bg-accordion)", marginBottom: "var(--sp-4)",
              fontSize: 12, color: "var(--text-faint)",
            }}>
              <Lock size={14} />
              {isPro
                ? (isFr ? "Toutes les places sont occup\u00e9es." : "All slots are taken.")
                : (isFr ? "Limite atteinte. Passez \u00e0 Forecrest Pro pour plus de places." : "Limit reached. Upgrade to Forecrest Pro for more slots.")}
            </div>
          ) : null}

          {/* ── Active members for this role ── */}
          {roleMembers.length > 0 ? (
            <div style={{ marginBottom: roleInvitations.length > 0 ? "var(--sp-4)" : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
                {isFr ? "Actifs" : "Active"} ({roleMembers.length})
              </div>
              {roleMembers.map(function (m, i) {
                var name = m.profiles ? m.profiles.display_name : "";
                var memberEmail = m.profiles ? m.profiles.email : "";
                var isSelf = auth.user && m.user_id === auth.user.id;
                return (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-3)",
                    padding: "var(--sp-2) 0",
                    borderBottom: i < roleMembers.length - 1 ? "1px solid var(--border-light)" : "none",
                  }}>
                    <Avatar name={name} userId={m.user_id} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || memberEmail}</span>
                        {isSelf ? <span style={{ fontSize: 11, color: "var(--text-faint)" }}>({ct.you || "vous"})</span> : null}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{memberEmail}</div>
                    </div>
                    {isOwner && !isSelf && m.role !== "owner" ? (
                      <ButtonUtility icon={<X size={14} weight="bold" />} variant="danger" size="header"
                        onClick={function () { setConfirmRemove({ id: m.id, name: name || memberEmail }); }}
                        title={isFr ? "Exclure" : "Remove"}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* ── Pending invitations for this role ── */}
          {roleInvitations.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-ghost)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
                {isFr ? "En attente" : "Pending"} ({roleInvitations.length})
              </div>
              {roleInvitations.map(function (inv, i) {
                var expired = new Date(inv.expires_at) < new Date();
                return (
                  <div key={inv.id} style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-3)",
                    padding: "var(--sp-2) 0",
                    borderBottom: i < roleInvitations.length - 1 ? "1px solid var(--border-light)" : "none",
                    opacity: expired ? 0.5 : 1,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "var(--r-full)",
                      background: "var(--bg-accordion)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <PaperPlaneTilt size={12} color="var(--text-muted)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{inv.email}</div>
                      <div style={{ fontSize: 11, color: expired ? "var(--color-error)" : "var(--text-faint)" }}>
                        {expired ? (isFr ? "Expir\u00e9" : "Expired") : (isFr ? "En attente" : "Pending")}
                      </div>
                    </div>
                    <ButtonUtility
                      icon={copiedId === inv.id ? <Check size={14} weight="bold" /> : <Link size={14} />}
                      variant={copiedId === inv.id ? "brand" : "default"} size="header"
                      onClick={function () { copyLink(inv.token, inv.id); }}
                      title={isFr ? "Copier le lien" : "Copy link"}
                    />
                    {isOwner ? (
                      <ButtonUtility icon={<X size={14} weight="bold" />} variant="danger" size="header"
                        onClick={function () { cancelInvitation(inv.id); }}
                        title={isFr ? "Annuler" : "Cancel"}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* ── Empty state ── */}
          {roleMembers.length === 0 && roleInvitations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--sp-5) 0", color: "var(--text-faint)", fontSize: 13 }}>
              {isFr ? "Aucun " + (ROLE_META[activeRole].label_fr).toLowerCase() + " pour le moment" : "No " + (ROLE_META[activeRole].label_en).toLowerCase() + " yet"}
            </div>
          ) : null}
        </div>
      </ModalBody>
    </Modal>

    {/* ── Confirm remove ── */}
    {confirmRemove ? (
      <Modal open={true} onClose={function () { setConfirmRemove(null); }} size="sm"
        title={isFr ? "Exclure ce membre ?" : "Remove this member?"}
        icon={<WarningCircle size={20} weight="duotone" color="var(--color-warning)" />}
      >
        <ModalBody>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {isFr ? "Vous \u00eates sur le point d'exclure " : "You are about to remove "}
            <strong style={{ color: "var(--text-primary)" }}>{confirmRemove.name}</strong>
            {isFr ? ". Cette personne n'aura plus acc\u00e8s aux donn\u00e9es." : ". They will no longer have access to data."}
          </div>
        </ModalBody>
        <ModalFooter>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-2)", width: "100%" }}>
            <Button color="tertiary" size="md" onClick={function () { setConfirmRemove(null); }}>{isFr ? "Annuler" : "Cancel"}</Button>
            <Button color="primary-destructive" size="md" onClick={function () { removeMember(confirmRemove.id); }}>{isFr ? "Exclure" : "Remove"}</Button>
          </div>
        </ModalFooter>
      </Modal>
    ) : null}
    </>
  );
}
