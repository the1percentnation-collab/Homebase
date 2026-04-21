"use client";

import { CheckCircle2, Home, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export function SignupClient() {
  const { signUp, isCloudMode } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isCloudMode) {
      setError("Cloud sync isn't configured on this deployment.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result.needsEmailConfirm) {
        setConfirmEmailSent(true);
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmEmailSent) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/10">
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          </div>
          <h1 className="text-lg font-semibold">Check your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Click it,
            then return here to sign in.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-2">
        <Home className="h-6 w-6" />
        <span className="text-lg font-semibold tracking-tight">Homebase</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll create your household on first sign-in. You can invite your
        partner after.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField label="Email" htmlFor="signup-email" required>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="signup-password"
          required
          hint="At least 8 characters"
        >
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="signup-confirm" required>
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </FormField>

        {error && (
          <p className="rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-2 text-xs text-[var(--destructive)]">
            {error}
          </p>
        )}

        {!isCloudMode && (
          <p className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            No Supabase config detected. Add env vars to enable sign-up.
          </p>
        )}

        <Button type="submit" disabled={submitting || !isCloudMode} className="w-full">
          <UserPlus className="h-4 w-4" />
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
