"use client";

import Link from "next/link";
import { Target, ChevronRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useCollection } from "@/lib/use-collection";
import { formatMoney } from "@/lib/format";

export function UpcomingGoals() {
  const { items, loading } = useCollection("goals");

  const goals = items
    .slice()
    .sort((a, b) => {
      // Nearest deadline first; goals without deadlines sink to the bottom.
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    })
    .slice(0, 3);

  return (
    <Card>
      <CardHeader
        title="Top financial goals"
        description="Next 3 by deadline"
        action={
          <Link
            href="/finances/goals"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />
      {!loading && goals.length === 0 ? (
        <CardBody className="p-0">
          <EmptyState
            icon={Target}
            title="Set your first goal"
            description="Emergency fund, vacation, down payment — what are you saving for?"
          />
        </CardBody>
      ) : (
        <ul className="divide-y divide-border">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            return (
              <li key={g.id} className="px-5 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(g.currentAmount)} / {formatMoney(g.targetAmount)}
                  </p>
                </div>
                <ProgressBar value={g.currentAmount} max={g.targetAmount} />
                <p className="text-[11px] text-muted-foreground">
                  {Math.round(pct)}%
                  {g.deadline && ` · target ${g.deadline}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
