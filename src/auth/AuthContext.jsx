import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase, supabaseConfigError } from "../lib/supabase";

const AuthContext = createContext(null);
const PROFILE_CACHE_KEY = "shiftguard-profile-cache";

function getCachedProfile() {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function cacheProfile(profile) {
  try {
    if (profile) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Cache is an optimization; authentication remains authoritative.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(() => getCachedProfile());
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  async function loadProfile(user) {
    if (!supabase || !user) {
      setProfile(null);
      cacheProfile(null);
      return;
    }
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id, full_name, role, employee_id, organizations(id, name, slug)")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    setProfile(data);
    cacheProfile(data);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      try {
        await loadProfile(data.session?.user);
      } catch (profileError) {
        setError(profileError.message);
      } finally {
        if (mounted) setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      try {
        await loadProfile(nextSession?.user);
      } catch (profileError) {
        setError(profileError.message);
      } finally {
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
  }

  async function signUp({ email, password, fullName, organizationName }) {
    setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, organization_name: organizationName } }
    });
    if (signUpError) throw signUpError;
    return data;
  }

  async function resetPassword(email) {
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (resetError) throw resetError;
  }

  async function signOut() {
    cacheProfile(null);
    if (supabase) await supabase.auth.signOut();
  }

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    organization: profile?.organizations || null,
    role: profile?.role || null,
    loading,
    error: error || supabaseConfigError,
    configError: supabaseConfigError,
    isSupabaseConfigured,
    signIn,
    signUp,
    resetPassword,
    signOut
  }), [session, profile, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
