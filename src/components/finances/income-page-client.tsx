"use client";

import { Download, Plus, Wallet } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { IncomeForm, type IncomeFormSubmit } from "./income-form";
import { IncomeList } from "./income-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { exportCollectionCsv } from "@/lib/export";
import {
  addDaysIso,
  formatMoney,
  startOfMonthIso,
  todayIso,
} from "@/lib/format";
import type { Income } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; income: Income };

export function IncomePageClient() {
  const { items, loading, refresh } = useCollection("incomes");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [items]
  );

  const totals = useMemo(() => {
    const today = todayIso();
    const monthStart = startOfMonthIso();
    const yearStart = today.slice(0, 4) + "-01-01";
    const in30 = addDaysIso(30);

    const thisMonth = items.filter((i) => i.date >= monthStart && i.date <= today);
    const ytd = items.filter((i) => i.date >= yearStart && i.date <= today);
    const upcoming = items.filter(
      (i) => i.nextPayDate && i.nextPayDate >= today && i.nextPayDate <= in30
    );

    const monthGross = thisMonth.reduce((s, i) => s + i.grossAmount, 0);
    const monthNet = thisMonth.reduce((s, i) => s + i.netAmount, 0);
    const ytdGross = ytd.reduce((s, i) => s + i.grossAmount, 0);
    const ytdNet = ytd.reduce((s, i) => s + i.netAmount, 0);
    const upcomingNet = upcoming.reduce((s, i) => s + i.netAmount, 0);

    const taxWithheld = ytdGross - ytdNet;
    const takeHomePct = ytdGross > 0 ? (ytdNet / ytdGross) * 100 : 0;

    return {
      monthGross,
      monthNet,
      ytdGross,
      ytdNet,
      upcomingNet,
      upcomingCount: upcoming.length,
      taxWithheld,
      takeHomePct,
    };
  }, [items]);

  const handleCreate = useCallback(
    async (values: IncomeFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("incomes", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: IncomeFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("incomes", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (income: Income) => {
      if (!window.confirm(`Delete income from "${income.sourceName}"?`)) return;
      await getStorage().remove("incomes", income.id);
      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
            <p className="text-xs text-muted-foreground">
              Paychecks, freelance, and every other dollar coming in. Net vs.
              gross at a glance.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("incomes")}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New income
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard
          label="This month (net)"
          value={formatMoney(totals.monthNet)}
          sub={`${formatMoney(totals.monthGross)} gross`}
        />
        <TotalCard
          label="YTD (net)"
          value={formatMoney(totals.ytdNet)}
          sub={`${formatMoney(totals.ytdGross)} gross`}
        />
        <TotalCard
          label="Upcoming in 30 days"
          value={
            totals.upcomingCount > 0
              ? formatMoney(totals.upcomingNet)
              : "—"
          }
          sub={
            totals.upcomingCount > 0
              ? `${totals.upcomingCount} pay date${
                  totals.upcomingCount === 1 ? "" : "s"
                }`
              : "No scheduled pay dates"
          }
        />
        <TotalCard
          label="YTD tax withheld"
          value={formatMoney(totals.taxWithheld)}
          sub={
            totals.ytdGross > 0
              ? `${Math.round(totals.takeHomePct)}% take-home`
              : undefined
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">All income</h2>
          <p className="text-xs text-muted-foreground">
            Logged, most recent first.
          </p>
        </div>
        <div className="px-4 pb-2 pt-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading income…
            </p>
          ) : (
            <IncomeList
              incomes={sorted}
              onEdit={(income) => setMode({ kind: "edit", income })}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit income" : "New income"}
        description={
          mode.kind === "edit"
            ? "Update the details below."
            : "Log a paycheck, freelance payment, dividend, etc."
        }
      >
        {mode.kind !== "closed" && (
          <IncomeForm
            defaultValues={mode.kind === "edit" ? mode.income : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add income"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.income.id, values);
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

function TotalCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
