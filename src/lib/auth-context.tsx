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
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

type AuthContextValue = {
  /** null while loading, false when unauthenticated, User otherwise */
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True when Supabase env vars are set; false in local-only mode */
  isCloudMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isCloudMode = useMemo(() => isSupabaseConfigured(), []);

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
    void client.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [isCloudMode]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Cloud sync is not configured.");
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Cloud sync is not configured.");
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    // Supabase returns a session when email confirmation is disabled, or
    // returns a user with session=null when confirmation is required.
    return { needsEmailConfirm: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    isCloudMode,
    signIn,
    signUp,
    signOut,
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
