"use client";

import {
  CheckCircle2,
  Pencil,
  Play,
  Plus,
  Repeat,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  RecurringExpenseForm,
  type RecurringExpenseFormSubmit,
} from "./recurring-expense-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { advanceDueDate } from "@/lib/bill-helpers";
import {
  EXPENSE_CATEGORY_ACCENT,
  EXPENSE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatMoney, todayIso } from "@/lib/format";
import type { RecurringExpense } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; rule: RecurringExpense };

const MAX_MATERIALIZE_PER_RULE = 12;

async function materializeRule(rule: RecurringExpense): Promise<number> {
  if (!rule.active) return 0;
  const storage = getStorage();
  const today = todayIso();
  let due = rule.nextDue;
  let created = 0;

  while (
    due <= today &&
    (!rule.endDate || due <= rule.endDate) &&
    created < MAX_MATERIALIZE_PER_RULE
  ) {
    await storage.create("expenses", {
      userId: rule.userId,
      amount: rule.amount,
      date: due,
      description: rule.description,
      category: rule.category,
      paymentMethod: rule.paymentMethod,
      tag: rule.tag,
      labels: ["recurring"],
      recurringId: rule.id,
    });
    const next = advanceDueDate(due, rule.frequency);
    if (!next) break;
    due = next;
    created += 1;
  }

  if (created > 0) {
    await storage.update("recurringExpenses", rule.id, { nextDue: due });
  }
  return created;
}

type Props = {
  onDataChanged: () => void;
};

export function RecurringExpensesPanel({ onDataChanged }: Props) {
  const { items, loading, refresh } = useCollection("recurringExpenses");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const today = todayIso();
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.nextDue.localeCompare(b.nextDue)),
    [items]
  );
  const dueCount = sorted.filter(
    (r) => r.active && r.nextDue <= today
  ).length;

  const monthlyBurn = useMemo(() => {
    const perMonth: Record<RecurringExpense["frequency"], number> = {
      once: 0,
      daily: 30,
      weekly: 52 / 12,
      biweekly: 26 / 12,
      monthly: 1,
      quarterly: 1 / 3,
      yearly: 1 / 12,
    };
    return sorted
      .filter((r) => r.active)
      .reduce((sum, r) => sum + r.amount * (perMonth[r.frequency] ?? 0), 0);
  }, [sorted]);

  const handleCreate = useCallback(
    async (values: RecurringExpenseFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("recurringExpenses", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: RecurringExpenseFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("recurringExpenses", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (rule: RecurringExpense) => {
      if (!window.confirm(`Delete recurring rule "${rule.description}"?`))
        return;
      await getStorage().remove("recurringExpenses", rule.id);
      await refresh();
    },
    [refresh]
  );

  const handleToggleActive = useCallback(
    async (rule: RecurringExpense) => {
      await getStorage().update("recurringExpenses", rule.id, {
        active: !rule.active,
      });
      await refresh();
    },
    [refresh]
  );

  const handleGenerateOne = useCallback(
    async (rule: RecurringExpense) => {
      const n = await materializeRule(rule);
      await refresh();
      onDataChanged();
      if (n > 0) setLastRun(`Generated ${n} from "${rule.description}".`);
    },
    [refresh, onDataChanged]
  );

  const handleGenerateAll = useCallback(async () => {
    let total = 0;
    for (const rule of sorted) {
      if (!rule.active || rule.nextDue > today) continue;
      total += await materializeRule(rule);
    }
    await refresh();
    onDataChanged();
    setLastRun(
      total === 0
        ? "Nothing due right now."
        : `Generated ${total} entr${total === 1 ? "y" : "ies"}.`
    );
  }, [sorted, today, refresh, onDataChanged]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">Estimated monthly burn</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">
            {formatMoney(monthlyBurn, { cents: true })}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {sorted.filter((r) => r.active).length} active rule
            {sorted.filter((r) => r.active).length === 1 ? "" : "s"}
            {dueCount > 0 && ` · ${dueCount} due now`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateAll}
            disabled={dueCount === 0}
          >
            <Zap className="h-4 w-4" />
            Generate due{dueCount > 0 ? ` (${dueCount})` : ""}
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New rule
          </Button>
        </div>
      </div>

      {lastRun && (
        <div className="flex items-start gap-2 rounded-md border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
          <p>{lastRun}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading rules…
          </p>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring rules"
            description="Add Netflix, rent, or any repeating expense so it shows up in your budgets automatically."
          />
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((r) => {
              const overdue = r.active && r.nextDue <= today;
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          !r.active && "text-muted-foreground"
                        )}
                      >
                        {r.description}
                      </p>
                      {!r.active && (
                        <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                          EXPENSE_CATEGORY_ACCENT[r.category]
                        )}
                      >
                        {EXPENSE_CATEGORY_LABELS[r.category]}
                      </span>
                      <span>{FREQUENCY_LABELS[r.frequency]}</span>
                      <span>·</span>
                      <span className={overdue ? "text-[var(--destructive)]" : ""}>
                        Next {formatDate(r.nextDue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMoney(r.amount, { cents: true })}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateOne(r)}
                        disabled={!r.active || r.nextDue > today}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Generate
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(r)}
                        title={r.active ? "Pause" : "Resume"}
                      >
                        {r.active ? (
                          <Pause />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setMode({ kind: "edit", rule: r })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit recurring rule" : "New recurring rule"}
        description={
          mode.kind === "edit"
            ? "Update the schedule or amount."
            : "Define a repeating expense (rent, subscriptions, utilities)."
        }
      >
        {mode.kind !== "closed" && (
          <RecurringExpenseForm
            defaultValues={mode.kind === "edit" ? mode.rule : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Create rule"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.rule.id, values);
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

function Pause() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
