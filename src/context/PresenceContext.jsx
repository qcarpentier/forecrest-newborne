import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabase, isConfigured } from "../lib/supabase";

var PresenceContext = createContext(null);

/* ── Brand-based avatar colors (hue variations of coral #E8431A) ── */
var AVATAR_PALETTE = [
  "#E8431A", /* brand coral */
  "#1A8FE8", /* blue shift */
  "#1AE87B", /* green shift */
  "#9B1AE8", /* purple shift */
  "#E81A6E", /* pink shift */
  "#E8A01A", /* amber shift */
  "#1ACCE8", /* cyan shift */
  "#E8431A", /* brand repeat */
];

function hashColor(userId) {
  if (!userId) return AVATAR_PALETTE[0];
  var hash = 0;
  for (var i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

var PRESENCE_DB_INTERVAL = 30000;
var POLL_INTERVAL = 15000;
var IDLE_TIMEOUT = 120000; /* 2 minutes without activity = idle */

export function PresenceProvider({ children, workspaceId, userId, displayName }) {
  var [members, setMembers] = useState([]);
  var [mode, setMode] = useState("realtime");
  var channelRef = useRef(null);
  var currentPageRef = useRef(null); /* null until explicitly set */
  var dbTimerRef = useRef(null);
  var pollTimerRef = useRef(null);
  var idleRef = useRef(false);
  var idleTimerRef = useRef(null);

  /* ── Idle detection ── */
  useEffect(function () {
    function resetIdle() {
      if (idleRef.current) {
        idleRef.current = false;
        /* Re-track as active */
        if (channelRef.current && currentPageRef.current) {
          channelRef.current.track({
            userId: userId,
            displayName: displayName,
            currentPage: currentPageRef.current,
            idle: false,
            color: hashColor(userId),
          });
        }
      }
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(function () {
        idleRef.current = true;
        /* Track as idle */
        if (channelRef.current && currentPageRef.current) {
          channelRef.current.track({
            userId: userId,
            displayName: displayName,
            currentPage: currentPageRef.current,
            idle: true,
            color: hashColor(userId),
          });
        }
      }, IDLE_TIMEOUT);
    }

    var events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach(function (e) { document.addEventListener(e, resetIdle, { passive: true }); });
    resetIdle();

    return function () {
      events.forEach(function (e) { document.removeEventListener(e, resetIdle); });
      clearTimeout(idleTimerRef.current);
    };
  }, [userId, displayName]);

  /* ── Set current page (called from CollabBar on tab change) ── */
  var setCurrentPage = useCallback(function (tab) {
    currentPageRef.current = tab;
    idleRef.current = false;

    if (channelRef.current && mode === "realtime") {
      channelRef.current.track({
        userId: userId,
        displayName: displayName,
        currentPage: tab,
        idle: false,
        color: hashColor(userId),
      });
    }
  }, [userId, displayName, mode]);

  /* ── Debounced DB write for last_seen_at + current_page ── */
  var writePresenceToDB = useCallback(function () {
    if (!workspaceId || !userId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    sb.rpc("update_my_presence", {
      ws_id: workspaceId,
      page_id: currentPageRef.current,
    })
      .then(function () {})
      .catch(function () {});
  }, [workspaceId, userId]);

  /* ── Poll DB for presence (fallback) ── */
  var pollPresence = useCallback(function () {
    if (!workspaceId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    sb.from("workspace_members")
      .select("user_id, role, current_page, last_seen_at, profiles(display_name, email)")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .then(function (res) {
        if (!res.data) return;
        var now = Date.now();
        var list = res.data.map(function (m) {
          var lastSeen = m.last_seen_at ? new Date(m.last_seen_at).getTime() : 0;
          var isOnline = (now - lastSeen) < 60000;
          return {
            userId: m.user_id,
            displayName: m.profiles ? m.profiles.display_name : "",
            email: m.profiles ? m.profiles.email : "",
            currentPage: m.current_page || "overview",
            online: isOnline,
            idle: false,
            color: hashColor(m.user_id),
            role: m.role,
          };
        });
        setMembers(list);
      })
      .catch(function () {});
  }, [workspaceId]);

  /* ── Check if user is online ── */
  var isOnline = useCallback(function (uid) {
    var m = members.find(function (mem) { return mem.userId === uid; });
    return m ? m.online : false;
  }, [members]);

  /* ── Setup Realtime presence OR fallback polling ── */
  useEffect(function () {
    if (!workspaceId || !userId || !isConfigured()) return;

    var sb = getSupabase();
    if (!sb) return;

    var channel = sb.channel("workspace:" + workspaceId, {
      config: { presence: { key: userId } },
    });

    function syncPresence() {
      var state = channel.presenceState();
      var list = [];
      var keys = Object.keys(state);
      for (var i = 0; i < keys.length; i++) {
        var presences = state[keys[i]];
        if (presences && presences.length > 0) {
          var p = presences[0];
          list.push({
            userId: p.userId || keys[i],
            displayName: p.displayName || "",
            currentPage: p.currentPage || "overview",
            online: true,
            idle: !!p.idle,
            color: p.color || hashColor(p.userId || keys[i]),
            role: p.role || "member",
          });
        }
      }
      setMembers(list);
    }

    channel.on("presence", { event: "sync" }, syncPresence);
    channel.on("presence", { event: "join" }, syncPresence);
    channel.on("presence", { event: "leave" }, syncPresence);

    channel.subscribe(function (status) {
      if (status === "SUBSCRIBED") {
        setMode("realtime");

        /* Track with the ACTUAL current page (not default "overview") */
        channel.track({
          userId: userId,
          displayName: displayName,
          currentPage: currentPageRef.current || "overview",
          idle: false,
          color: hashColor(userId),
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setMode("polling");
        pollPresence();
        pollTimerRef.current = setInterval(pollPresence, POLL_INTERVAL);
      }
    });

    channelRef.current = channel;

    dbTimerRef.current = setInterval(writePresenceToDB, PRESENCE_DB_INTERVAL);
    writePresenceToDB();

    return function () {
      if (channelRef.current) {
        sb.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (dbTimerRef.current) clearInterval(dbTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [workspaceId, userId, displayName, writePresenceToDB, pollPresence]);

  var value = {
    members: members,
    setCurrentPage: setCurrentPage,
    isOnline: isOnline,
    mode: mode,
    hashColor: hashColor,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}

export { hashColor };
