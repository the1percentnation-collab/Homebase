"use client";

import { ListChecks, Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getAssignee } from "@/lib/constants";
import { FREQUENCY_LABELS } from "@/lib/enum-labels";
import { formatDate, todayIso } from "@/lib/format";
import type { Task } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  onToggleComplete: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  emptyTitle = "No tasks here",
  emptyDescription = "Add a task to keep chores, projects, and errands moving.",
}: Props) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const today = todayIso();

  return (
    <ul className="divide-y divide-border">
      {tasks.map((t) => {
        const completed = t.status === "completed";
        const overdue = !completed && t.dueDate && t.dueDate < today;
        const assignee = getAssignee(t.assigneeId);
        return (
          <li
            key={t.id}
            className="flex items-start gap-3 px-5 py-3"
          >
            <button
              type="button"
              onClick={() => onToggleComplete(t)}
              aria-label={completed ? "Mark as open" : "Mark complete"}
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                completed
                  ? "bg-[var(--success)] border-[var(--success)] text-white"
                  : "border-border hover:border-foreground"
              )}
            >
              {completed && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    completed && "line-through text-muted-foreground"
                  )}
                >
                  {t.title}
                </p>
                {t.frequency !== "once" && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground"
                    title={`Repeats ${FREQUENCY_LABELS[t.frequency].toLowerCase()}`}
                  >
                    <Repeat className="h-3 w-3" />
                    {FREQUENCY_LABELS[t.frequency]}
                  </span>
                )}
              </div>
              {t.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {t.description}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {t.dueDate ? (
                  <span className={overdue ? "text-[var(--destructive)]" : ""}>
                    {formatDate(t.dueDate)}
                    {overdue && " · overdue"}
                  </span>
                ) : (
                  <span>No due date</span>
                )}
                <span>·</span>
                <PriorityChip priority={t.priority} />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {assignee ? (
                <span
                  title={assignee.label}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                    assignee.color
                  )}
                >
                  {assignee.initials}
                </span>
              ) : (
                <span
                  title="Unassigned"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-[11px] text-muted-foreground"
                >
                  ?
                </span>
              )}
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(t)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PriorityChip({ priority }: { priority: Task["priority"] }) {
  const classes =
    priority === "high"
      ? "bg-[var(--destructive)]/10 text-[var(--destructive)]"
      : priority === "medium"
      ? "bg-[var(--warning)]/10 text-[var(--warning)]"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
        classes
      )}
    >
      {priority}
    </span>
  );
}
