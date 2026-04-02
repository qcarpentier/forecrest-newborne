import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AuthContext from "./authCtx";
import { getSupabase, isConfigured } from "../lib/supabase";

var MODE_KEY = "forecrest_storage_mode";
var AUTH_STORAGE_KEY = "forecrest_auth";

function hasPersistedSessionHint() {
  if (typeof window === "undefined") return false;

  try {
    var raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;

    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return false;

    if (parsed.currentSession && (parsed.currentSession.access_token || parsed.currentSession.refresh_token)) {
      return true;
    }

    return !!(parsed.access_token || parsed.refresh_token);
  } catch (e) {
    return false;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getSafeEmailRedirectUrl() {
  if (typeof window === "undefined" || !window.location || !window.location.origin) return undefined;
  return window.location.origin + "/";
}

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [session, setSession] = useState(null);
  var [loading, setLoading] = useState(true);
  var [profileLoaded, setProfileLoaded] = useState(false);
  var [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  var [storageMode, setStorageModeState] = useState(function () {
    try { return localStorage.getItem(MODE_KEY) || "local"; } catch (e) { return "local"; }
  });
  var [workspaceId, setWorkspaceId] = useState(null);
  var [workspaceRole, setWorkspaceRole] = useState(null); // "owner"|"member"|"accountant"|"advisor"
  var [workspaceMembers, setWorkspaceMembers] = useState([]);
  var subscriptionRef = useRef(null);
  var bootstrapDoneRef = useRef(false);
  var bootstrapTimerRef = useRef(null);

  function sameUserBase(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.id === b.id
      && a.email === b.email
      && a.displayName === b.displayName
      && a.role === b.role;
  }

  function mergeUser(prev, nextBase) {
    if (!nextBase) return null;
    if (!prev || prev.id !== nextBase.id) return nextBase;
    return Object.assign({}, prev, nextBase);
  }

  /* ── Persist storage mode ── */
  function persistMode(mode) {
    try { localStorage.setItem(MODE_KEY, mode); } catch (e) { /* noop */ }
    setStorageModeState(mode);
  }

  /* ── Extract user info from Supabase session ── */
  function userFromSession(sess) {
    if (!sess || !sess.user) return null;
    var u = sess.user;
    return {
      id: u.id,
      email: u.email,
      displayName: u.user_metadata && u.user_metadata.display_name
        ? u.user_metadata.display_name
        : (u.email ? u.email.split("@")[0] : ""),
      role: "user",
    };
  }

  var commitSession = useCallback(function (sess, opts) {
    var options = opts || {};
    var nextUser = userFromSession(sess);

    if (!options.skipSessionState) {
      setSession(function (prev) {
        if (!sess) return prev ? null : prev;
        if (prev && prev.user && sess.user && prev.user.id === sess.user.id) return prev;
        return sess;
      });
    }

    setUser(function (prev) {
      if (!nextUser) return prev ? null : prev;
      var merged = mergeUser(prev, nextUser);
      return sameUserBase(prev, merged) ? prev : merged;
    });
  }, []);

  var finishBootstrap = useCallback(function () {
    if (bootstrapDoneRef.current) return;
    bootstrapDoneRef.current = true;
    if (bootstrapTimerRef.current) {
      clearTimeout(bootstrapTimerRef.current);
      bootstrapTimerRef.current = null;
    }
    setLoading(false);
  }, []);

  /* ── Load profile (role, display_name) from profiles table ── */
  var loadProfile = useCallback(function (userId) {
    if (!isConfigured()) {
      setProfileLoaded(true);
      return Promise.resolve();
    }
    var sb = getSupabase();
    if (!sb) {
      setProfileLoaded(true);
      return Promise.resolve();
    }
    setProfileLoaded(false);
    return sb.from("profiles")
      .select("role, display_name, first_name, last_name, birth_date")
      .eq("id", userId)
      .single()
      .then(function (res) {
        if (res.data) {
          setUser(function (prev) {
            if (!prev) return prev;
            return Object.assign({}, prev, {
              role: res.data.role || "user",
              displayName: res.data.display_name || prev.displayName,
              firstName: res.data.first_name || "",
              lastName: res.data.last_name || "",
              birthDate: res.data.birth_date || "",
              profileComplete: !!(res.data.first_name && res.data.last_name),
            });
          });
        }
      })
      .catch(function () { /* profile may not exist yet */ })
      .then(function () {
        setProfileLoaded(true);
      });
  }, []);

  /* ── Load workspace members for a workspace ── */
  var loadWorkspaceMembers = useCallback(function (wsId) {
    if (!wsId || !isConfigured()) return Promise.resolve([]);
    var sb = getSupabase();
    if (!sb) return Promise.resolve([]);
    return sb.rpc("get_workspace_members", { ws_id: wsId })
      .then(function (res) {
        if (res.data) {
          setWorkspaceMembers(res.data);
          return res.data;
        }
        return [];
      })
      .catch(function () { return []; });
  }, []);

  /* ── Load workspace ID for current user ── */
  var loadWorkspace = useCallback(function (userId) {
    if (!isConfigured()) {
      setWorkspaceLoaded(true);
      return Promise.resolve(null);
    }
    var sb = getSupabase();
    if (!sb) {
      setWorkspaceLoaded(true);
      return Promise.resolve(null);
    }
    setWorkspaceLoaded(false);

    /* First: workspace owned by user */
    return sb.from("workspaces")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .then(function (res) {
        if (res.data && res.data.length > 0) {
          setWorkspaceId(res.data[0].id);
          setWorkspaceRole("owner");
          loadWorkspaceMembers(res.data[0].id);
          return res.data[0].id;
        }
        /* Fallback: workspace where user is an active member */
        return sb.from("workspace_members")
          .select("workspace_id, role")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: true })
          .limit(1)
          .then(function (memRes) {
            if (memRes.data && memRes.data.length > 0) {
              setWorkspaceId(memRes.data[0].workspace_id);
              setWorkspaceRole(memRes.data[0].role);
              loadWorkspaceMembers(memRes.data[0].workspace_id);
              return memRes.data[0].workspace_id;
            }
            return null;
          });
      })
      .catch(function () { return null; })
      .then(function (result) {
        setWorkspaceLoaded(true);
        return result;
      });
  }, [loadWorkspaceMembers]);

  /* ── Create first workspace for new user ── */
  var createWorkspace = useCallback(function (userId, name) {
    if (!isConfigured()) return Promise.resolve(null);
    var sb = getSupabase();
    if (!sb) return Promise.resolve(null);
    setWorkspaceLoaded(false);
    return sb.from("workspaces")
      .insert({ user_id: userId, name: name || "Mon entreprise", app_state: {}, schema_version: 1 })
      .select("id")
      .single()
      .then(function (res) {
        if (res.data) {
          setWorkspaceId(res.data.id);
          setWorkspaceRole("owner");
          setWorkspaceLoaded(true);
          return res.data.id;
        }
        setWorkspaceLoaded(true);
        return null;
      })
      .catch(function () {
        setWorkspaceLoaded(true);
        return null;
      });
  }, []);

  /* ── Restore session on mount ── */
  useEffect(function () {
    bootstrapDoneRef.current = false;
    var persistedSessionHint = hasPersistedSessionHint();

    if (!isConfigured()) {
      setProfileLoaded(true);
      setWorkspaceLoaded(true);
      finishBootstrap();
      return;
    }

    var sb = getSupabase();
    if (!sb) {
      setProfileLoaded(true);
      setWorkspaceLoaded(true);
      finishBootstrap();
      return;
    }

    if (persistedSessionHint) {
      /* Give Supabase a short window to republish the persisted session before showing AuthPage. */
      bootstrapTimerRef.current = setTimeout(function () {
        finishBootstrap();
      }, 1800);
    }

    var authListener = sb.auth.onAuthStateChange(function (event, sess) {
      if (event === "INITIAL_SESSION") {
        if (sess && sess.user) {
          commitSession(sess);
          loadProfile(sess.user.id);
          loadWorkspace(sess.user.id);
          finishBootstrap();
        } else {
          setSession(null);
          setUser(null);
          setProfileLoaded(true);
          setWorkspaceLoaded(true);
          setWorkspaceId(null);
          setWorkspaceRole(null);
          setWorkspaceMembers([]);
          if (!persistedSessionHint) {
            finishBootstrap();
          }
        }
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        commitSession(sess, { skipSessionState: true });
        if (sess && sess.user) finishBootstrap();
        return;
      }

      if (event === "SIGNED_OUT" || !sess || !sess.user) {
        setSession(null);
        setUser(null);
        setProfileLoaded(true);
        setWorkspaceLoaded(true);
        setWorkspaceId(null);
        setWorkspaceRole(null);
        setWorkspaceMembers([]);
        finishBootstrap();
        return;
      }

      commitSession(sess);
      finishBootstrap();

      if (event === "USER_UPDATED") {
        loadProfile(sess.user.id);
        return;
      }

      if (sess && sess.user) {
        loadProfile(sess.user.id);
        loadWorkspace(sess.user.id);
      }
    });

    sb.auth.getSession().then(function (res) {
      var sess = res.data && res.data.session;
      if (sess && sess.user) {
        commitSession(sess);
        loadProfile(sess.user.id);
        loadWorkspace(sess.user.id);
        finishBootstrap();
        return;
      }

      if (!persistedSessionHint) {
        finishBootstrap();
      }
    }).catch(function () {
      finishBootstrap();
    });

    subscriptionRef.current = authListener.data && authListener.data.subscription;

    return function () {
      if (bootstrapTimerRef.current) {
        clearTimeout(bootstrapTimerRef.current);
        bootstrapTimerRef.current = null;
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [commitSession, finishBootstrap, loadProfile, loadWorkspace]);

  /* ── Sign up (email + password + optional metadata) ── */
  var signUp = useCallback(function (email, password, metadata) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    var sb = getSupabase();
    var redirectTo = getSafeEmailRedirectUrl();
    var opts = { email: normalizeEmail(email), password: password };
    if (metadata || redirectTo) {
      opts.options = {};
      if (metadata) opts.options.data = metadata;
      if (redirectTo) opts.options.emailRedirectTo = redirectTo;
    }
    return sb.auth.signUp(opts)
      .then(function (res) {
        if (res.error) throw res.error;
        var sess = res.data.session;
        if (sess) {
          commitSession(sess);
          persistMode("cloud");
          /* Workspace creation deferred to onboarding — not on signup */
          return loadWorkspace(sess.user.id).then(function () { return res.data; });
        }
        return res.data;
      });
  }, [commitSession, createWorkspace, loadWorkspace]);

  /* ── Sign in (email + password) ── */
  var signIn = useCallback(function (email, password) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    var sb = getSupabase();
    return sb.auth.signInWithPassword({ email: normalizeEmail(email), password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        commitSession(res.data.session);
        persistMode("cloud");
        return loadWorkspace(res.data.session.user.id).then(function () { return res.data; });
      });
  }, [commitSession, loadWorkspace]);

  /* ── Magic link ── */
  var signInMagicLink = useCallback(function (email) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    var sb = getSupabase();
    var redirectTo = getSafeEmailRedirectUrl();
    return sb.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
  }, []);

  /* ── Sign out ── */
  var signOut = useCallback(function () {
    if (!isConfigured()) return Promise.resolve();
    var sb = getSupabase();
    return sb.auth.signOut().then(function () {
      setSession(null);
      setUser(null);
      setProfileLoaded(true);
      setWorkspaceLoaded(true);
      setWorkspaceId(null);
      setWorkspaceRole(null);
      setWorkspaceMembers([]);
      persistMode("local");
    });
  }, []);

  /* ── Update user profile (first_name, last_name, birth_date) ── */
  var updateProfile = useCallback(function (data) {
    if (!isConfigured() || !session) return Promise.resolve();
    var sb = getSupabase();
    var updates = { updated_at: new Date().toISOString() };
    if (data.firstName != null) updates.first_name = data.firstName;
    if (data.lastName != null) updates.last_name = data.lastName;
    if (data.birthDate != null) updates.birth_date = data.birthDate || null;
    if (data.displayName != null) updates.display_name = data.displayName;
    return sb.from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .then(function () {
        setUser(function (prev) {
          if (!prev) return prev;
          return Object.assign({}, prev, {
            firstName: data.firstName != null ? data.firstName : prev.firstName,
            lastName: data.lastName != null ? data.lastName : prev.lastName,
            birthDate: data.birthDate != null ? data.birthDate : prev.birthDate,
            displayName: data.displayName != null ? data.displayName : prev.displayName,
            profileComplete: !!(data.firstName || prev.firstName) && !!(data.lastName || prev.lastName),
          });
        });
      });
  }, [session]);

  /* ── Update display name ── */
  var updateDisplayName = useCallback(function (name) {
    if (!isConfigured() || !session) return Promise.resolve();
    var sb = getSupabase();
    return sb.auth.updateUser({ data: { display_name: name } })
      .then(function (res) {
        if (res.error) throw res.error;
        /* Update local state */
        setUser(function (prev) {
          return prev ? Object.assign({}, prev, { displayName: name }) : prev;
        });
        /* Also update profiles table so other users see the new name */
        return sb.from("profiles")
          .update({ display_name: name, updated_at: new Date().toISOString() })
          .eq("id", session.user.id);
      });
  }, [session]);

  /* ── Delete account ── */
  var deleteAccount = useCallback(function () {
    if (!isConfigured() || !user) return Promise.resolve();
    var sb = getSupabase();
    /* Delete workspace data first, then sign out.
       Account deletion requires admin API — user signs out and data is cleaned. */
    return sb.from("workspaces")
      .delete()
      .eq("user_id", user.id)
      .then(function () { return signOut(); });
  }, [user, signOut]);

  var isOwner = workspaceRole === "owner";

  var value = useMemo(function () {
    return {
      user: user,
      session: session,
      loading: loading,
      profileLoaded: profileLoaded,
      workspaceLoaded: workspaceLoaded,
      storageMode: storageMode,
      workspaceId: workspaceId,
      workspaceRole: workspaceRole,
      isOwner: isOwner,
      workspaceMembers: workspaceMembers,
      signUp: signUp,
      signIn: signIn,
      signInMagicLink: signInMagicLink,
      signOut: signOut,
      updateProfile: updateProfile,
      updateDisplayName: updateDisplayName,
      deleteAccount: deleteAccount,
      setStorageMode: persistMode,
      setWorkspaceId: setWorkspaceId,
      setWorkspaceRole: setWorkspaceRole,
      createWorkspace: createWorkspace,
      loadWorkspaceMembers: loadWorkspaceMembers,
    };
  }, [
    user,
    session,
    loading,
    profileLoaded,
    workspaceLoaded,
    storageMode,
    workspaceId,
    workspaceRole,
    isOwner,
    workspaceMembers,
    signUp,
    signIn,
    signInMagicLink,
    signOut,
    updateProfile,
    updateDisplayName,
    deleteAccount,
    createWorkspace,
    loadWorkspaceMembers,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
