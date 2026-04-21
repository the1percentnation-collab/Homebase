"use client";

import { Home, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export function LoginClient() {
  const { signIn, user, isCloudMode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isCloudMode) {
      setError("Cloud sync isn't configured on this deployment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-2">
        <Home className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Homebase</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cloud sync is on — sign in to see your household&apos;s data.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField label="Email" htmlFor="login-email" required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password" required>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>

        {error && (
          <p className="rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-2 text-xs text-[var(--destructive)]">
            {error}
          </p>
        )}

        {!isCloudMode && (
          <p className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            No Supabase config detected. Add env vars to enable sign-in, or use
            the app locally without an account.
          </p>
        )}

        <Button type="submit" disabled={submitting || !isCloudMode} className="w-full">
          <LogIn className="h-4 w-4" />
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="underline hover:text-foreground">
          Create an account
        </Link>
      </p>
    </div>
  );
}
