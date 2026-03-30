import { useState, useEffect, useCallback, useRef } from "react";
import AuthContext from "./authCtx";
import { getSupabase, isConfigured } from "../lib/supabase";

var MODE_KEY = "forecrest_storage_mode";

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [session, setSession] = useState(null);
  var [loading, setLoading] = useState(true);
  var [storageMode, setStorageModeState] = useState(function () {
    try { return localStorage.getItem(MODE_KEY) || "local"; } catch (e) { return "local"; }
  });
  var [workspaceId, setWorkspaceId] = useState(null);
  var [workspaceRole, setWorkspaceRole] = useState(null); // "owner"|"member"|"accountant"|"advisor"
  var [workspaceMembers, setWorkspaceMembers] = useState([]);
  var subscriptionRef = useRef(null);

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

  /* ── Load profile (role, display_name) from profiles table ── */
  var loadProfile = useCallback(function (userId) {
    if (!isConfigured()) return Promise.resolve();
    var sb = getSupabase();
    if (!sb) return Promise.resolve();
    return sb.from("profiles")
      .select("role, display_name")
      .eq("id", userId)
      .single()
      .then(function (res) {
        if (res.data) {
          setUser(function (prev) {
            if (!prev) return prev;
            return Object.assign({}, prev, {
              role: res.data.role || "user",
              displayName: res.data.display_name || prev.displayName,
            });
          });
        }
      })
      .catch(function () { /* profile may not exist yet */ });
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
    if (!isConfigured()) return Promise.resolve(null);
    var sb = getSupabase();
    if (!sb) return Promise.resolve(null);

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
      .catch(function () { return null; });
  }, [loadWorkspaceMembers]);

  /* ── Create first workspace for new user ── */
  var createWorkspace = useCallback(function (userId, name) {
    if (!isConfigured()) return Promise.resolve(null);
    var sb = getSupabase();
    if (!sb) return Promise.resolve(null);
    return sb.from("workspaces")
      .insert({ user_id: userId, name: name || "Mon entreprise", app_state: {}, schema_version: 1 })
      .select("id")
      .single()
      .then(function (res) {
        if (res.data) {
          setWorkspaceId(res.data.id);
          setWorkspaceRole("owner");
          return res.data.id;
        }
        return null;
      })
      .catch(function () { return null; });
  }, []);

  /* ── Restore session on mount ── */
  useEffect(function () {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    var sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    sb.auth.getSession().then(function (res) {
      var sess = res.data && res.data.session;
      if (sess) {
        setSession(sess);
        setUser(userFromSession(sess));
        loadProfile(sess.user.id);
        loadWorkspace(sess.user.id);
      }
      setLoading(false);
    }).catch(function () {
      setLoading(false);
    });

    var authListener = sb.auth.onAuthStateChange(function (event, sess) {
      setSession(sess);
      setUser(userFromSession(sess));
      if (sess && sess.user) {
        loadProfile(sess.user.id);
        loadWorkspace(sess.user.id);
      } else {
        setWorkspaceId(null);
      }
    });

    subscriptionRef.current = authListener.data && authListener.data.subscription;

    return function () {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [loadProfile, loadWorkspace]);

  /* ── Sign up (email + password + optional metadata) ── */
  var signUp = useCallback(function (email, password, metadata) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    var sb = getSupabase();
    var opts = { email: email, password: password };
    if (metadata) opts.options = { data: metadata };
    return sb.auth.signUp(opts)
      .then(function (res) {
        if (res.error) throw res.error;
        var sess = res.data.session;
        if (sess) {
          setSession(sess);
          setUser(userFromSession(sess));
          persistMode("cloud");
          /* Workspace creation deferred to onboarding — not on signup */
          return loadWorkspace(sess.user.id).then(function () { return res.data; });
        }
        return res.data;
      });
  }, [createWorkspace]);

  /* ── Sign in (email + password) ── */
  var signIn = useCallback(function (email, password) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    var sb = getSupabase();
    return sb.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        setSession(res.data.session);
        setUser(userFromSession(res.data.session));
        persistMode("cloud");
        return loadWorkspace(res.data.session.user.id).then(function () { return res.data; });
      });
  }, [loadWorkspace]);

  /* ── Magic link ── */
  var signInMagicLink = useCallback(function (email) {
    if (!isConfigured()) return Promise.reject(new Error("Supabase not configured"));
    var sb = getSupabase();
    return sb.auth.signInWithOtp({ email: email })
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
      setWorkspaceId(null);
      setWorkspaceRole(null);
      setWorkspaceMembers([]);
      persistMode("local");
    });
  }, []);

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

  var value = {
    user: user,
    session: session,
    loading: loading,
    storageMode: storageMode,
    workspaceId: workspaceId,
    workspaceRole: workspaceRole,
    isOwner: isOwner,
    workspaceMembers: workspaceMembers,
    signUp: signUp,
    signIn: signIn,
    signInMagicLink: signInMagicLink,
    signOut: signOut,
    updateDisplayName: updateDisplayName,
    deleteAccount: deleteAccount,
    setStorageMode: persistMode,
    setWorkspaceId: setWorkspaceId,
    setWorkspaceRole: setWorkspaceRole,
    createWorkspace: createWorkspace,
    loadWorkspaceMembers: loadWorkspaceMembers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
