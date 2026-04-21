"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  bootstrapProfile,
  setPendingInviteCode,
  type Profile,
} from "./household";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Error from the most recent household-bootstrap attempt */
  bootstrapError: string | null;
  /** True when Supabase env vars are set; false in local-only mode */
  isCloudMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    inviteCode?: string
  ) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const isCloudMode = useMemo(() => isSupabaseConfigured(), []);

  const runBootstrap = useCallback(async (next: Session | null) => {
    if (!next?.user) {
      setProfile(null);
      return;
    }
    const client = getSupabaseClient();
    if (!client) return;
    try {
      setBootstrapError(null);
      const p = await bootstrapProfile(client, next.user);
      setProfile(p);
    } catch (err) {
      setBootstrapError(err instanceof Error ? err.message : "Bootstrap failed");
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isCloudMode) {
      setLoading(false);
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void client.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      await runBootstrap(data.session);
      if (!cancelled) setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void runBootstrap(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [isCloudMode, runBootstrap]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Cloud sync is not configured.");
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, inviteCode?: string) => {
      const client = getSupabaseClient();
      if (!client) throw new Error("Cloud sync is not configured.");
      if (inviteCode) setPendingInviteCode(inviteCode);
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      return { needsEmailConfirm: !data.session };
    },
    []
  );

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setPendingInviteCode(null);
    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
  }, []);

  const refreshProfile = useCallback(async () => {
    await runBootstrap(session);
  }, [runBootstrap, session]);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    bootstrapError,
    isCloudMode,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
