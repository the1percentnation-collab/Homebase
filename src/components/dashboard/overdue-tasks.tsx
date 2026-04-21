"use client";

import Link from "next/link";
import { ListChecks, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCollection } from "@/lib/use-collection";
import { formatDate, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OverdueTasks() {
  const { items, loading } = useCollection("tasks");
  const today = todayIso();

  const open = items
    .filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        t.dueDate &&
        t.dueDate <= today
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader
        title="Tasks needing attention"
        description="Overdue or due today"
        action={
          <Link
            href="/home/tasks"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />
      {!loading && open.length === 0 ? (
        <CardBody className="p-0">
          <EmptyState
            icon={ListChecks}
            title="Nothing on your plate"
            description="Add a task to keep household chores and projects on track."
          />
        </CardBody>
      ) : (
        <ul className="divide-y divide-border">
          {open.map((t) => {
            const overdue = t.dueDate && t.dueDate < today;
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0 flex items-start gap-2">
                  <AlertCircle
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      overdue ? "text-[var(--destructive)]" : "text-muted-foreground"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {overdue ? "Overdue · " : "Due · "}
                      {formatDate(t.dueDate)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                    t.priority === "high"
                      ? "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                      : t.priority === "medium"
                      ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.priority}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
