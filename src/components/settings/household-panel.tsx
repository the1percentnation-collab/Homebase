"use client";

import { Copy, Check, RotateCcw, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  fetchHousehold,
  rotateInviteCode,
  type Household,
} from "@/lib/household";
import { getSupabaseClient } from "@/lib/supabase";

export function HouseholdPanel() {
  const { isCloudMode, profile, bootstrapError, refreshProfile } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    try {
      const h = await fetchHousehold(client, profile.householdId);
      setHousehold(h);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load household");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyCode() {
    if (!household) return;
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  async function handleRotate() {
    if (!household) return;
    if (
      !window.confirm(
        "Rotate the invite code? The old code stops working immediately. Anyone already in the household keeps access."
      )
    ) {
      return;
    }
    const client = getSupabaseClient();
    if (!client) return;
    setRotating(true);
    try {
      const next = await rotateInviteCode(client, household.id);
      setHousehold({ ...household, inviteCode: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setRotating(false);
    }
  }

  if (!isCloudMode) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Household</h2>
      </div>

      {bootstrapError ? (
        <div className="rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-sm">
          <p className="font-medium text-[var(--destructive)]">
            Couldn&apos;t load your household
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{bootstrapError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            If you just set up Supabase, make sure the Task 22 SQL has been
            applied.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={refreshProfile}
          >
            Retry
          </Button>
        </div>
      ) : loading || !household ? (
        <p className="text-sm text-muted-foreground">Loading household…</p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Invite code</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tracking-widest">
                {household.inviteCode}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              {profile?.role === "owner" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  disabled={rotating}
                  title="Rotate invite code"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {rotating ? "Rotating…" : "Rotate"}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with your partner when they sign up so you share
            data. You can rotate it anytime.
            {profile?.role !== "owner" && " Only the household owner can rotate."}
          </p>
        </>
      )}

      {error && !bootstrapError && (
        <p className="rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-2 text-xs text-[var(--destructive)]">
          {error}
        </p>
      )}
    </section>
  );
}
