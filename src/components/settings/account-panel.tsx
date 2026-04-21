"use client";

import { Cloud, CloudOff, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function AccountPanel() {
  const { user, isCloudMode, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = "/login";
    } catch (_err) {
      setSigningOut(false);
    }
  }

  if (!isCloudMode) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Storage mode</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Running in <strong>local-only mode</strong>. Data lives in this
          browser&apos;s storage. Add{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to your environment to enable cloud sync.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-[var(--success)]" />
        <h2 className="text-sm font-semibold">Account</h2>
      </div>
      {user ? (
        <>
          <p className="text-sm">
            Signed in as{" "}
            <span className="font-medium">{user.email ?? user.id}</span>
          </p>
          <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Not signed in.</p>
      )}
    </section>
  );
}
