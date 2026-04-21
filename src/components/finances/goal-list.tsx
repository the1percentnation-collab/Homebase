"use client";

import { Pencil, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  GOAL_HORIZON_LABELS,
  GOAL_TYPE_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { TRACK_LABEL, type GoalStatus } from "@/lib/goal-helpers";
import type { Goal } from "@/lib/schema";
import { GOAL_HORIZONS } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  statuses: GoalStatus[];
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
  onContribute: (g: Goal) => void;
};

export function GoalList({ statuses, onEdit, onDelete, onContribute }: Props) {
  if (statuses.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Emergency fund, vacation, down payment — what are you saving for?"
      />
    );
  }

  const byHorizon = new Map<Goal["horizon"], GoalStatus[]>();
  for (const s of statuses) {
    const list = byHorizon.get(s.goal.horizon) ?? [];
    list.push(s);
    byHorizon.set(s.goal.horizon, list);
  }
  for (const list of byHorizon.values()) {
    list.sort((a, b) => {
      // Soonest deadline first; undeadlined last.
      const ad = a.goal.deadline ?? "9999-99-99";
      const bd = b.goal.deadline ?? "9999-99-99";
      if (ad !== bd) return ad.localeCompare(bd);
      return a.goal.name.localeCompare(b.goal.name);
    });
  }

  return (
    <div className="space-y-6">
      {GOAL_HORIZONS.map((h) => {
        const list = byHorizon.get(h);
        if (!list || list.length === 0) return null;
        return (
          <section key={h} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {GOAL_HORIZON_LABELS[h]} · {list.length}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((s) => (
                <GoalCard
                  key={s.goal.id}
                  status={s}
                  onEdit={() => onEdit(s.goal)}
                  onDelete={() => onDelete(s.goal)}
                  onContribute={() => onContribute(s.goal)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GoalCard({
  status,
  onEdit,
  onDelete,
  onContribute,
}: {
  status: GoalStatus;
  onEdit: () => void;
  onDelete: () => void;
  onContribute: () => void;
}) {
  const { goal, percent, requiredMonthly, projected, track, progressTone } =
    status;

  const trackClass: Record<typeof track, string> = {
    complete: "bg-[var(--success)]/10 text-[var(--success)]",
    ahead: "bg-[var(--success)]/10 text-[var(--success)]",
    onTrack: "bg-muted text-muted-foreground",
    slipping: "bg-[var(--warning)]/10 text-[var(--warning)]",
    none: "bg-muted text-muted-foreground",
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{goal.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {GOAL_TYPE_LABELS[goal.type]}
            </span>
            {track !== "none" && (
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                  trackClass[track]
                )}
              >
                {TRACK_LABEL[track]}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={onContribute} title="Add contribution">
            <Plus className="h-4 w-4" />
          </Button>
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
          {formatMoney(goal.currentAmount, { cents: true })}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          of {formatMoney(goal.targetAmount, { cents: true })}
        </div>
      </div>

      <ProgressBar value={goal.currentAmount} max={goal.targetAmount} tone={progressTone} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{Math.round(percent)}%</span>
        {goal.deadline && <span>by {formatDate(goal.deadline)}</span>}
      </div>

      {(requiredMonthly != null || projected) && (
        <div className="border-t border-border pt-2 text-[11px] text-muted-foreground space-y-0.5">
          {requiredMonthly != null && (
            <p className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatMoney(requiredMonthly, { cents: true })}/mo needed
              {goal.monthlyContribution != null
                ? ` · planning ${formatMoney(goal.monthlyContribution, { cents: true })}`
                : ""}
            </p>
          )}
          {projected && !goal.deadline && (
            <p>
              At {formatMoney(goal.monthlyContribution ?? 0, { cents: true })}/mo you&apos;ll
              hit this by {formatDate(projected)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
