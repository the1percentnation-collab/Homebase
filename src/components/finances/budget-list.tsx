"use client";

import { Pencil, PiggyBank, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { BudgetStatus } from "@/lib/budget-helpers";
import {
  BUDGET_PERIOD_LABELS,
  EXPENSE_CATEGORY_ACCENT,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/enum-labels";
import { formatMoney } from "@/lib/format";
import type { Budget } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  statuses: BudgetStatus[];
  onEdit: (b: Budget) => void;
  onDelete: (b: Budget) => void;
};

export function BudgetList({ statuses, onEdit, onDelete }: Props) {
  if (statuses.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="No budgets yet"
        description="Set a monthly or weekly cap per category to start tracking against your spending."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {statuses.map((s) => (
        <BudgetCard
          key={s.budget.id}
          status={s}
          onEdit={() => onEdit(s.budget)}
          onDelete={() => onDelete(s.budget)}
        />
      ))}
    </div>
  );
}

function BudgetCard({
  status,
  onEdit,
  onDelete,
}: {
  status: BudgetStatus;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { budget, spent, effectiveBudget, remaining, percent, tone, window, rolloverIn } =
    status;

  const remainingLabel =
    remaining >= 0
      ? `${formatMoney(remaining, { cents: true })} left`
      : `Over by ${formatMoney(-remaining, { cents: true })}`;

  const toneClasses: Record<BudgetStatus["tone"], string> = {
    default: "text-muted-foreground",
    warning: "text-[var(--warning)]",
    danger: "text-[var(--destructive)]",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                EXPENSE_CATEGORY_ACCENT[budget.category]
              )}
            >
              {EXPENSE_CATEGORY_LABELS[budget.category]}
            </span>
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {BUDGET_PERIOD_LABELS[budget.period]}
            </span>
            {budget.rollover && (
              <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                Rollover
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{window.label}</p>
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
          {formatMoney(spent, { cents: true })}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          of {formatMoney(effectiveBudget, { cents: true })}
        </div>
      </div>

      <ProgressBar value={spent} max={effectiveBudget || 1} tone={tone} />

      <div className="flex items-center justify-between text-xs">
        <span className={toneClasses[tone]}>{remainingLabel}</span>
        <span className="text-muted-foreground">{Math.round(percent)}% used</span>
      </div>

      {rolloverIn > 0 && (
        <p className="text-[11px] text-muted-foreground">
          +{formatMoney(rolloverIn, { cents: true })} rolled over from last period
        </p>
      )}
    </div>
  );
}
