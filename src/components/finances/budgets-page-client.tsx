"use client";

import { PiggyBank, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { BudgetForm, type BudgetFormSubmit } from "./budget-form";
import { BudgetList } from "./budget-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { computeBudgetStatus } from "@/lib/budget-helpers";
import { formatMoney } from "@/lib/format";
import type { Budget } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; budget: Budget };

export function BudgetsPageClient() {
  const { items: budgets, loading, refresh } = useCollection("budgets");
  const { items: expenses } = useCollection("expenses");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);

  const statuses = useMemo(
    () =>
      budgets
        .map((b) => computeBudgetStatus(b, expenses))
        .sort((a, b) => b.percent - a.percent),
    [budgets, expenses]
  );

  const summary = useMemo(() => {
    const monthly = statuses.filter((s) => s.budget.period === "monthly");
    const totalBudgeted = monthly.reduce((sum, s) => sum + s.effectiveBudget, 0);
    const totalSpent = monthly.reduce((sum, s) => sum + s.spent, 0);
    const pct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    const tone: "default" | "warning" | "danger" =
      pct >= 100 ? "danger" : pct >= 80 ? "warning" : "default";
    return {
      count: monthly.length,
      totalBudgeted,
      totalSpent,
      pct,
      tone,
    };
  }, [statuses]);

  const handleCreate = useCallback(
    async (values: BudgetFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("budgets", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: BudgetFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("budgets", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (budget: Budget) => {
      if (!window.confirm(`Delete this budget?`)) return;
      await getStorage().remove("budgets", budget.id);
      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PiggyBank className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
            <p className="text-xs text-muted-foreground">
              Set monthly and weekly caps per category. Alerts fire at the threshold
              you choose.
            </p>
          </div>
        </div>
        <Button onClick={() => setMode({ kind: "new" })}>
          <Plus className="h-4 w-4" />
          New budget
        </Button>
      </header>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Monthly spend vs. budget</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(summary.totalSpent, { cents: true })}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                of {formatMoney(summary.totalBudgeted, { cents: true })}
              </span>
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {summary.count} monthly budget{summary.count === 1 ? "" : "s"} ·{" "}
            {Math.round(summary.pct)}% used
          </div>
        </div>
        <ProgressBar
          value={summary.totalSpent}
          max={summary.totalBudgeted || 1}
          tone={summary.tone}
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading budgets…
        </p>
      ) : (
        <BudgetList
          statuses={statuses}
          onEdit={(b) => setMode({ kind: "edit", budget: b })}
          onDelete={handleDelete}
        />
      )}

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit budget" : "New budget"}
        description={
          mode.kind === "edit"
            ? "Update the amount, period, or rollover setting."
            : "Set a spending cap for a category."
        }
      >
        {mode.kind !== "closed" && (
          <BudgetForm
            defaultValues={mode.kind === "edit" ? mode.budget : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Create budget"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.budget.id, values);
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
