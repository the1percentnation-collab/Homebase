"use client";

import { Camera, Download, Plus, Trash2, TrendingUp } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AccountForm, type AccountFormSubmit } from "./account-form";
import { AccountList } from "./account-list";
import { NetWorthTrend } from "./networth-trend";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { exportCollectionCsv } from "@/lib/export";
import { formatDate, formatMoney, todayIso } from "@/lib/format";
import type { Account, NetWorthSnapshot } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; account: Account };

export function NetWorthPageClient() {
  const { items: accounts, loading: accountsLoading, refresh: refreshAccounts } =
    useCollection("accounts");
  const { items: snapshots, loading: snapsLoading, refresh: refreshSnapshots } =
    useCollection("netWorthSnapshots");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const assets = accounts
      .filter((a) => a.isAsset)
      .reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts
      .filter((a) => !a.isAsset)
      .reduce((s, a) => s + Math.abs(a.balance), 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  const assetAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.isAsset)
        .sort((a, b) => b.balance - a.balance),
    [accounts]
  );
  const liabilityAccounts = useMemo(
    () =>
      accounts
        .filter((a) => !a.isAsset)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [accounts]
  );

  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => b.date.localeCompare(a.date)),
    [snapshots]
  );

  const monthlyDelta = useMemo(() => {
    if (sortedSnapshots.length === 0) return null;
    const latest = sortedSnapshots[0];
    const prev = sortedSnapshots[1];
    return {
      vsLatest: totals.netWorth - latest.netWorth,
      vsPrev: prev ? latest.netWorth - prev.netWorth : null,
      latestDate: latest.date,
    };
  }, [sortedSnapshots, totals]);

  const handleCreate = useCallback(
    async (values: AccountFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("accounts", values);
        await refreshAccounts();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refreshAccounts]
  );

  const handleUpdate = useCallback(
    async (id: string, values: AccountFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("accounts", id, values);
        await refreshAccounts();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refreshAccounts]
  );

  const handleDelete = useCallback(
    async (account: Account) => {
      if (!window.confirm(`Delete "${account.name}"?`)) return;
      await getStorage().remove("accounts", account.id);
      await refreshAccounts();
    },
    [refreshAccounts]
  );

  const handleRecordSnapshot = useCallback(async () => {
    const today = todayIso();
    const storage = getStorage();
    const existing = snapshots.find((s) => s.date === today);
    const payload = {
      date: today,
      assets: totals.assets,
      liabilities: totals.liabilities,
      netWorth: totals.netWorth,
    };
    if (existing) {
      await storage.update("netWorthSnapshots", existing.id, payload);
    } else {
      await storage.create("netWorthSnapshots", payload);
    }
    await refreshSnapshots();
  }, [snapshots, totals, refreshSnapshots]);

  const handleDeleteSnapshot = useCallback(
    async (s: NetWorthSnapshot) => {
      if (!window.confirm(`Delete snapshot from ${formatDate(s.date)}?`)) return;
      await getStorage().remove("netWorthSnapshots", s.id);
      await refreshSnapshots();
    },
    [refreshSnapshots]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Net worth</h1>
            <p className="text-xs text-muted-foreground">
              Assets minus liabilities, with a monthly snapshot trend.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("accounts")}
            disabled={accounts.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleRecordSnapshot}
            disabled={accounts.length === 0}
          >
            <Camera className="h-4 w-4" />
            Record snapshot
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New account
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-xs text-muted-foreground">Current net worth</p>
        <p
          className={cn(
            "text-3xl font-semibold tabular-nums",
            totals.netWorth < 0 && "text-[var(--destructive)]"
          )}
        >
          {formatMoney(totals.netWorth, { cents: true })}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Assets{" "}
            <span className="font-medium text-[var(--success)]">
              {formatMoney(totals.assets, { cents: true })}
            </span>
          </span>
          <span>
            Liabilities{" "}
            <span className="font-medium text-[var(--destructive)]">
              {formatMoney(totals.liabilities, { cents: true })}
            </span>
          </span>
          {monthlyDelta?.vsLatest !== undefined && (
            <span>
              {monthlyDelta.vsLatest >= 0 ? "+" : ""}
              <span
                className={cn(
                  "font-medium",
                  monthlyDelta.vsLatest >= 0
                    ? "text-[var(--success)]"
                    : "text-[var(--destructive)]"
                )}
              >
                {formatMoney(monthlyDelta.vsLatest, { cents: true })}
              </span>{" "}
              since {formatDate(monthlyDelta.latestDate)}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Trend</h2>
          <p className="text-xs text-muted-foreground">
            Net worth (bold), assets (green), liabilities (red) across snapshots.
          </p>
        </div>
        <div className="p-4">
          <NetWorthTrend snapshots={snapshots} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Assets</h2>
            <span className="text-xs text-[var(--success)] font-medium tabular-nums">
              {formatMoney(totals.assets, { cents: true })}
            </span>
          </div>
          {accountsLoading ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            <AccountList
              accounts={assetAccounts}
              onEdit={(a) => setMode({ kind: "edit", account: a })}
              onDelete={handleDelete}
              emptyText="No asset accounts yet."
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Liabilities</h2>
            <span className="text-xs text-[var(--destructive)] font-medium tabular-nums">
              {formatMoney(totals.liabilities, { cents: true })}
            </span>
          </div>
          {accountsLoading ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            <AccountList
              accounts={liabilityAccounts}
              onEdit={(a) => setMode({ kind: "edit", account: a })}
              onDelete={handleDelete}
              emptyText="No liability accounts yet."
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Snapshots</h2>
          <p className="text-xs text-muted-foreground">
            Record monthly to build your trend. Replacing today&apos;s snapshot
            is safe — it updates in place.
          </p>
        </div>
        {snapsLoading ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : sortedSnapshots.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No snapshots yet"
            description="Click Record snapshot above to capture today's totals."
          />
        ) : (
          <ul className="divide-y divide-border">
            {sortedSnapshots.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{formatDate(s.date)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Assets {formatMoney(s.assets)} · Liab{" "}
                    {formatMoney(s.liabilities)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      s.netWorth < 0 && "text-[var(--destructive)]"
                    )}
                  >
                    {formatMoney(s.netWorth, { cents: true })}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteSnapshot(s)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit account" : "New account"}
        description={
          mode.kind === "edit"
            ? "Update the balance or details below."
            : "Add a checking, savings, investment account, or a liability."
        }
      >
        {mode.kind !== "closed" && (
          <AccountForm
            defaultValues={mode.kind === "edit" ? mode.account : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add account"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.account.id, values);
              } else {
                await handleCreate(values);
              }
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
