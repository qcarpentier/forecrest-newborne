import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Lifebuoy, ShareNetwork, UserPlus, SignOut, ArrowsClockwise } from "@phosphor-icons/react";
import { usePresence } from "../context/PresenceContext";
import { useAuth } from "../context/useAuth";
import { useT } from "../context";
import AvatarGroup from "./AvatarGroup";
import { ButtonUtility } from "../components";
import useBreakpoint from "../hooks/useBreakpoint";

var MAX_NOTIFICATIONS = 50;

export default function CollabBar({
  onOpenShare,
  onViewAll,
  currentTab,
  tabLabels,
  embedded,
  showMembers,
  showNotifications,
  showShare,
  showSupport,
}) {
  var auth = useAuth();
  var presence = usePresence();
  var t = useT();
  var ct = t.collab || {};
  var bp = useBreakpoint();
  var isMobile = bp.isMobile;
  var ctRef = useRef(ct);
  ctRef.current = ct;

  /* Track current page in presence (skip settings = personal/async) */
  var ASYNC_TABS = ["set", "admin", "dev-tooltips", "dev-calc", "design-system", "dev-roadmap", "dev-sitemap", "dev-perf"];
  useEffect(function () {
    if (!presence || !currentTab) return;
    if (ASYNC_TABS.indexOf(currentTab) >= 0) return;
    presence.setCurrentPage(currentTab);
  }, [currentTab, presence]);

  var [notifications, setNotifications] = useState([]);
  var [unreadCount, setUnreadCount] = useState(0);
  var [bellOpen, setBellOpen] = useState(false);
  var bellRef = useRef(null);
  var [bellPos, setBellPos] = useState({ top: 0, right: 0 });
  var prevMembersRef = useRef([]);

  /* Track presence changes -> generate notifications */
  var members = presence ? presence.members : [];
  var readyForNotifs = useRef(false);

  /* Wait 5s after mount before generating notifications (skip initial sync flood) */
  useEffect(function () {
    var timer = setTimeout(function () {
      readyForNotifs.current = true;
      prevMembersRef.current = (presence ? presence.members : []).slice();
    }, 5000);
    return function () { clearTimeout(timer); };
  }, []);

  var addNotification = useCallback(function (type, name, template) {
    var text = template.replace("{name}", name || "?");
    var notif = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      type: type,
      name: name,
      text: text,
      time: new Date(),
      read: false,
    };
    setNotifications(function (prev) {
      var next = [notif].concat(prev);
      if (next.length > MAX_NOTIFICATIONS) next = next.slice(0, MAX_NOTIFICATIONS);
      return next;
    });
    setUnreadCount(function (c) { return c + 1; });
  }, []);

  useEffect(function () {
    if (!readyForNotifs.current) {
      prevMembersRef.current = members.slice();
      return;
    }

    var prev = prevMembersRef.current;
    var prevIds = prev.map(function (m) { return m.userId; });
    var currIds = members.map(function (m) { return m.userId; });
    var c = ctRef.current;

    /* Online -> user opened the app */
    members.forEach(function (m) {
      if (m.userId === (auth.user && auth.user.id)) return;
      if (prevIds.indexOf(m.userId) === -1 && m.online) {
        addNotification("join", m.displayName, c.notif_online || "{name} est en ligne");
      }
    });

    /* Offline -> user closed tab (not leaving workspace) */
    prev.forEach(function (m) {
      if (m.userId === (auth.user && auth.user.id)) return;
      if (currIds.indexOf(m.userId) === -1) {
        addNotification("leave", m.displayName, c.notif_offline || "{name} est hors ligne");
      }
    });

    prevMembersRef.current = members.slice();
  }, [members, addNotification, auth.user]);

  /* Bell dropdown position */
  useEffect(function () {
    if (!bellOpen || !bellRef.current) return;
    var rect = bellRef.current.getBoundingClientRect();
    setBellPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, [bellOpen]);

  useEffect(function () {
    if (!bellOpen) return;
    function handleClick(e) {
      if (bellRef.current && bellRef.current.contains(e.target)) return;
      setBellOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return function () { document.removeEventListener("mousedown", handleClick); };
  }, [bellOpen]);

  function markAllRead() {
    setNotifications(function (prev) {
      return prev.map(function (n) { return Object.assign({}, n, { read: true }); });
    });
    setUnreadCount(0);
  }

  function formatRelTime(date) {
    var diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return ct.just_now || "\u00e0 l'instant";
    if (diff < 3600) return Math.floor(diff / 60) + "min";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    return Math.floor(diff / 86400) + (ct.day_short || "j");
  }

  function getNotifIcon(type) {
    if (type === "join") return UserPlus;
    if (type === "leave") return SignOut;
    if (type === "sync") return ArrowsClockwise;
    return Bell;
  }

  /* Don't render if not logged in */
  if (!auth.user || auth.storageMode !== "cloud") return null;
  if (isMobile) return null;

  var membersVisible = showMembers !== false && members.length > 0;
  var notificationsVisible = showNotifications !== false;
  var shareVisible = showShare !== false;
  var supportVisible = showSupport !== false;
  var showDivider = membersVisible && (notificationsVisible || shareVisible || supportVisible);

  if (!membersVisible && !notificationsVisible && !shareVisible && !supportVisible) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: embedded ? "var(--sp-2)" : "var(--sp-3)",
      marginTop: embedded ? 0 : -32,
      paddingTop: embedded ? 0 : 16,
      paddingBottom: embedded ? 0 : 16,
      flexShrink: 0,
    }}>
      {membersVisible ? (
        <AvatarGroup
          members={members}
          max={3}
          tabLabels={tabLabels}
          onViewAll={onViewAll}
          currentTab={currentTab}
          currentUserId={auth.user ? auth.user.id : null}
        />
      ) : null}

      {showDivider ? (
        <div style={{ width: 1, height: 20, background: "var(--border-light)" }} />
      ) : null}

      {notificationsVisible ? (
        <div ref={bellRef} style={{ position: "relative" }}>
          <ButtonUtility
            icon={<Bell size={16} weight={bellOpen ? "fill" : "regular"} />}
            variant="default"
            size="header"
            onClick={function () { setBellOpen(function (v) { return !v; }); }}
            title={ct.notifications || "Notifications"}
          />
          {unreadCount > 0 ? (
            <div style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--color-error)",
              border: "2px solid var(--bg-card)",
              boxSizing: "content-box",
              animation: "fcDotPulse 2s infinite",
            }} />
          ) : null}
        </div>
      ) : null}

      {shareVisible ? (
        <ButtonUtility
          icon={<ShareNetwork size={16} />}
          variant="default"
          size="header"
          onClick={onOpenShare}
          title={ct.share || "Partager"}
        />
      ) : null}

      {supportVisible ? (
        <ButtonUtility
          icon={<Lifebuoy size={16} />}
          variant="default"
          size="header"
          disabled={true}
          title={ct.support || "Support"}
          sx={{ opacity: 0.4, cursor: "default" }}
        />
      ) : null}

      {bellOpen && notificationsVisible ? createPortal(
        <div style={{
          position: "fixed",
          top: bellPos.top,
          right: bellPos.right,
          zIndex: 200,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-dropdown)",
          width: 340,
          maxWidth: "92vw",
          maxHeight: 400,
          display: "flex",
          flexDirection: "column",
          animation: "tooltipIn 0.1s ease",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--sp-3) var(--sp-4)",
            borderBottom: "1px solid var(--border-light)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {ct.notifications || "Notifications"}
            </span>
            {unreadCount > 0 ? (
              <button
                onMouseDown={function (e) { e.preventDefault(); e.stopPropagation(); markAllRead(); }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--brand)",
                  padding: 0,
                }}
              >
                {ct.mark_all_read || "Tout marquer comme lu"}
              </button>
            ) : null}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-1)" }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "var(--sp-6) var(--sp-4)",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-faint)",
              }}>
                {ct.no_notifications || "Aucune notification"}
              </div>
            ) : null}

            {notifications.map(function (n) {
              var Icon = getNotifIcon(n.type);
              return (
                <div key={n.id} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--sp-3)",
                  padding: "var(--sp-2) var(--sp-3)",
                  borderRadius: "var(--r-md)",
                  background: n.read ? "transparent" : "var(--brand-bg, rgba(232,67,26,0.04))",
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--r-full)",
                    background: "var(--bg-accordion)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <Icon size={14} color="var(--text-muted)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {n.text}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                      {formatRelTime(n.time)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
