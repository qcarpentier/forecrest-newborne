import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabase, isConfigured } from "../lib/supabase";

var PresenceContext = createContext(null);

/* ── Deterministic color from userId ── */
var AVATAR_PALETTE = [
  "#E8431A", "#2563EB", "#16A34A", "#9333EA",
  "#DC2626", "#0891B2", "#CA8A04", "#DB2777",
  "#4F46E5", "#059669", "#D97706", "#7C3AED",
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

var PRESENCE_DB_INTERVAL = 30000; // 30s debounced DB write
var POLL_INTERVAL = 15000; // 15s fallback polling

export function PresenceProvider({ children, workspaceId, userId, displayName }) {
  var [members, setMembers] = useState([]);
  var [mode, setMode] = useState("realtime"); // "realtime" | "polling"
  var channelRef = useRef(null);
  var currentPageRef = useRef("overview");
  var dbTimerRef = useRef(null);
  var pollTimerRef = useRef(null);

  /* ── Set current page (called from App.jsx on tab change) ── */
  var setCurrentPage = useCallback(function (tab) {
    currentPageRef.current = tab;

    /* Update presence track if Realtime is active */
    if (channelRef.current && mode === "realtime") {
      channelRef.current.track({
        userId: userId,
        displayName: displayName,
        currentPage: tab,
        color: hashColor(userId),
      });
    }
  }, [userId, displayName, mode]);

  /* ── Debounced DB write for last_seen_at + current_page ── */
  var writePresenceToDB = useCallback(function () {
    if (!workspaceId || !userId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    sb.from("workspace_members")
      .update({
        current_page: currentPageRef.current,
        last_seen_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .then(function () { /* noop */ })
      .catch(function () { /* noop */ });
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
          var isOnline = (now - lastSeen) < 60000; // online if seen in last 60s
          return {
            userId: m.user_id,
            displayName: m.profiles ? m.profiles.display_name : "",
            email: m.profiles ? m.profiles.email : "",
            currentPage: m.current_page || "overview",
            online: isOnline,
            color: hashColor(m.user_id),
            role: m.role,
          };
        });
        setMembers(list);
      })
      .catch(function () { /* noop */ });
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

    var realtimeOk = false;

    /* Parse presence state into members array */
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
        realtimeOk = true;
        setMode("realtime");

        channel.track({
          userId: userId,
          displayName: displayName,
          currentPage: currentPageRef.current,
          color: hashColor(userId),
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        /* Fallback to polling */
        realtimeOk = false;
        setMode("polling");
        pollPresence();
        pollTimerRef.current = setInterval(pollPresence, POLL_INTERVAL);
      }
    });

    channelRef.current = channel;

    /* Periodic DB write for last_seen */
    dbTimerRef.current = setInterval(writePresenceToDB, PRESENCE_DB_INTERVAL);
    writePresenceToDB(); // initial write

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
