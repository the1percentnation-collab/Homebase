"use client";

import { Download, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AccountForm, type AccountFormSubmit } from "./account-form";
import { SavingsAllocation } from "./savings-allocation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ACCOUNT_TYPE_LABELS } from "@/lib/enum-labels";
import { exportCollectionCsv } from "@/lib/export";
import { formatDate, formatMoney } from "@/lib/format";
import type { Account } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; account: Account };

const SAVINGS_TYPES = new Set<Account["type"]>([
  "savings",
  "investment",
  "retirement",
]);

export function SavingsPageClient() {
  const { items: accounts, loading, refresh } = useCollection("accounts");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);

  const relevant = useMemo(
    () =>
      accounts
        .filter((a) => a.isAsset && SAVINGS_TYPES.has(a.type))
        .sort((a, b) => b.balance - a.balance),
    [accounts]
  );

  const totals = useMemo(() => {
    let savings = 0;
    let investment = 0;
    let retirement = 0;
    for (const a of relevant) {
      if (a.type === "savings") savings += a.balance;
      else if (a.type === "investment") investment += a.balance;
      else if (a.type === "retirement") retirement += a.balance;
    }
    return {
      savings,
      investment,
      retirement,
      grand: savings + investment + retirement,
      count: relevant.length,
    };
  }, [relevant]);

  const handleCreate = useCallback(
    async (values: AccountFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("accounts", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: AccountFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("accounts", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (account: Account) => {
      if (!window.confirm(`Delete "${account.name}"?`)) return;
      await getStorage().remove("accounts", account.id);
      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Landmark className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Savings &amp; investments
            </h1>
            <p className="text-xs text-muted-foreground">
              Savings, investment, and retirement accounts with an allocation
              view.
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
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New account
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard
          label="Savings"
          value={formatMoney(totals.savings, { cents: true })}
        />
        <TotalCard
          label="Investments"
          value={formatMoney(totals.investment, { cents: true })}
        />
        <TotalCard
          label="Retirement"
          value={formatMoney(totals.retirement, { cents: true })}
        />
        <TotalCard
          label="Grand total"
          value={formatMoney(totals.grand, { cents: true })}
          sub={`${totals.count} account${totals.count === 1 ? "" : "s"}`}
          emphasis
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Allocation</h2>
          <p className="text-xs text-muted-foreground">
            Share of the total by account.
          </p>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            <SavingsAllocation accounts={relevant} />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Accounts</h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : relevant.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No savings or investment accounts yet"
            description="Add an emergency fund, brokerage account, 401k, or Roth IRA to start tracking."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {relevant.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                total={totals.grand}
                onEdit={() => setMode({ kind: "edit", account: a })}
                onDelete={() => handleDelete(a)}
              />
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit account" : "New account"}
        description={
          mode.kind === "edit"
            ? "Update balance or details below."
            : "Log a savings, investment, or retirement account."
        }
      >
        {mode.kind !== "closed" && (
          <AccountForm
            defaultValues={
              mode.kind === "edit"
                ? mode.account
                : { type: "savings", isAsset: true }
            }
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

function AccountCard({
  account,
  total,
  onEdit,
  onDelete,
}: {
  account: Account;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = total > 0 ? (account.balance / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{account.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </span>
            {account.institution && (
              <span className="text-[10px] text-muted-foreground">
                {account.institution}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-semibold tabular-nums">
          {formatMoney(account.balance, { cents: true })}
        </div>
        <div className="text-xs text-muted-foreground">
          {pct.toFixed(1)}%
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        as of {formatDate(account.asOfDate)}
      </p>
    </div>
  );
}

function TotalCard({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border ${emphasis ? "border-foreground/20" : "border-border"} bg-card p-4`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
