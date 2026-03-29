import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabase, isConfigured } from "../lib/supabase";

var LockContext = createContext(null);

var LOCK_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
var CLEANUP_INTERVAL = 60000; // 60s
var DB_WRITE_DELAY = 10000; // write to DB after 10s of holding

export function LockProvider({ children, workspaceId, userId, displayName }) {
  var [locks, setLocks] = useState({});
  var myLocksRef = useRef({}); // keys I hold, with timers
  var cleanupRef = useRef(null);
  var channelRef = useRef(null);

  /* ── Create broadcast channel for locks ── */
  useEffect(function () {
    if (!workspaceId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    var ch = sb.channel("locks:" + workspaceId);
    channelRef.current = ch;

    ch.on("broadcast", { event: "lock" }, function (msg) {
      var p = msg.payload;
      if (!p || !p.elementKey || p.userId === userId) return;
      setLocks(function (prev) {
        var next = Object.assign({}, prev);
        next[p.elementKey] = { userId: p.userId, displayName: p.displayName, lockedAt: Date.now() };
        return next;
      });
    });

    ch.on("broadcast", { event: "unlock" }, function (msg) {
      var p = msg.payload;
      if (!p || !p.elementKey) return;
      setLocks(function (prev) {
        var next = Object.assign({}, prev);
        delete next[p.elementKey];
        return next;
      });
    });

    ch.subscribe();

    return function () {
      sb.removeChannel(ch);
      channelRef.current = null;
    };
  }, [workspaceId, userId]);

  /* ── Acquire a lock ── */
  var acquireLock = useCallback(function (elementKey) {
    var existing = locks[elementKey];
    if (existing && existing.userId !== userId) {
      /* Someone else holds this lock */
      return { success: false, lockedBy: existing.displayName || "Unknown" };
    }
    if (existing && existing.userId === userId) {
      /* I already hold it */
      return { success: true, lockedBy: null };
    }

    /* Broadcast lock */
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "lock",
        payload: {
          elementKey: elementKey,
          userId: userId,
          displayName: displayName,
          lockedAt: new Date().toISOString(),
        },
      });
    }

    /* Update local state */
    setLocks(function (prev) {
      var next = Object.assign({}, prev);
      next[elementKey] = {
        userId: userId,
        displayName: displayName,
        lockedAt: Date.now(),
      };
      return next;
    });

    /* Schedule DB write after 10s */
    var dbTimer = setTimeout(function () {
      writeLockToDB(elementKey);
    }, DB_WRITE_DELAY);

    myLocksRef.current[elementKey] = { dbTimer: dbTimer };

    return { success: true, lockedBy: null };
  }, [locks, userId, displayName, workspaceId]);

  /* ── Release a lock ── */
  var releaseLock = useCallback(function (elementKey) {
    /* Broadcast unlock */
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "unlock",
        payload: { elementKey: elementKey, userId: userId },
      });
    }

    /* Clear local state */
    setLocks(function (prev) {
      var next = Object.assign({}, prev);
      delete next[elementKey];
      return next;
    });

    /* Clear DB timer and remove DB lock */
    if (myLocksRef.current[elementKey]) {
      clearTimeout(myLocksRef.current[elementKey].dbTimer);
      delete myLocksRef.current[elementKey];
    }
    deleteLockFromDB(elementKey);
  }, [userId, workspaceId]);

  /* ── Check if an element is locked ── */
  var isLocked = useCallback(function (elementKey) {
    var lock = locks[elementKey];
    if (!lock) return null;
    if (lock.userId === userId) return null; // my own lock doesn't count
    /* Check expiry */
    if (lock.lockedAt && (Date.now() - lock.lockedAt) > LOCK_EXPIRY_MS) return null;
    return { userId: lock.userId, displayName: lock.displayName };
  }, [locks, userId]);

  /* ── DB operations ── */
  function writeLockToDB(elementKey) {
    if (!workspaceId || !userId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    sb.from("element_locks")
      .upsert({
        workspace_id: workspaceId,
        element_key: elementKey,
        locked_by: userId,
        locked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + LOCK_EXPIRY_MS).toISOString(),
      }, { onConflict: "workspace_id,element_key" })
      .then(function () { /* noop */ })
      .catch(function () { /* noop */ });
  }

  function deleteLockFromDB(elementKey) {
    if (!workspaceId || !userId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    sb.from("element_locks")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("element_key", elementKey)
      .eq("locked_by", userId)
      .then(function () { /* noop */ })
      .catch(function () { /* noop */ });
  }

  /* ── Load existing locks from DB on mount ── */
  useEffect(function () {
    if (!workspaceId || !isConfigured()) return;
    var sb = getSupabase();
    if (!sb) return;

    sb.from("element_locks")
      .select("element_key, locked_by, locked_at, expires_at, profiles(display_name)")
      .eq("workspace_id", workspaceId)
      .gt("expires_at", new Date().toISOString())
      .then(function (res) {
        if (!res.data || res.data.length === 0) return;

        var initial = {};
        res.data.forEach(function (lock) {
          if (lock.locked_by === userId) return; // skip own stale locks
          initial[lock.element_key] = {
            userId: lock.locked_by,
            displayName: lock.profiles ? lock.profiles.display_name : "Unknown",
            lockedAt: new Date(lock.locked_at).getTime(),
          };
        });
        setLocks(function (prev) { return Object.assign({}, prev, initial); });
      })
      .catch(function () { /* noop */ });

    /* Clean up own stale locks */
    sb.from("element_locks")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("locked_by", userId)
      .then(function () { /* noop */ })
      .catch(function () { /* noop */ });
  }, [workspaceId, userId]);

  /* ── Periodic cleanup of expired locks ── */
  useEffect(function () {
    cleanupRef.current = setInterval(function () {
      setLocks(function (prev) {
        var now = Date.now();
        var next = {};
        var keys = Object.keys(prev);
        for (var i = 0; i < keys.length; i++) {
          var lock = prev[keys[i]];
          if (lock.lockedAt && (now - lock.lockedAt) < LOCK_EXPIRY_MS) {
            next[keys[i]] = lock;
          }
        }
        return next;
      });
    }, CLEANUP_INTERVAL);

    return function () {
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, []);

  /* ── Release all locks on unload ── */
  useEffect(function () {
    function handleUnload() {
      var keys = Object.keys(myLocksRef.current);
      for (var i = 0; i < keys.length; i++) {
        clearTimeout(myLocksRef.current[keys[i]].dbTimer);

        /* Broadcast unlock */
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "unlock",
            payload: { elementKey: keys[i], userId: userId },
          });
        }
      }

      /* Bulk delete from DB */
      if (keys.length > 0 && workspaceId && isConfigured()) {
        var sb = getSupabase();
        if (sb) {
          sb.from("element_locks")
            .delete()
            .eq("workspace_id", workspaceId)
            .eq("locked_by", userId);
        }
      }

      myLocksRef.current = {};
    }

    window.addEventListener("beforeunload", handleUnload);
    return function () { window.removeEventListener("beforeunload", handleUnload); };
  }, [userId, workspaceId]);

  var value = {
    locks: locks,
    acquireLock: acquireLock,
    releaseLock: releaseLock,
    isLocked: isLocked,
  };

  return (
    <LockContext.Provider value={value}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  return useContext(LockContext);
}
