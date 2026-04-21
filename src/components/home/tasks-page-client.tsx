"use client";

import { ListChecks, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskForm, type TaskFormSubmit } from "./task-form";
import { TaskList } from "./task-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  TASK_VIEW_LABELS,
  TASK_VIEW_ORDER,
  advanceTaskDueDate,
  countTasksByView,
  filterTasks,
  type TaskView,
} from "@/lib/task-helpers";
import type { Task } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; task: Task };

export function TasksPageClient() {
  const { items, loading, refresh } = useCollection("tasks");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<TaskView>("open");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setMode({ kind: "new" });
      const next = new URLSearchParams(searchParams.toString());
      next.delete("new");
      const qs = next.toString();
      router.replace(qs ? `/home/tasks?${qs}` : "/home/tasks");
    }
  }, [searchParams, router]);

  const counts = useMemo(() => countTasksByView(items), [items]);
  const filtered = useMemo(() => filterTasks(items, view), [items, view]);

  const handleCreate = useCallback(
    async (values: TaskFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("tasks", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: TaskFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("tasks", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (task: Task) => {
      if (!window.confirm(`Delete "${task.title}"?`)) return;
      await getStorage().remove("tasks", task.id);
      await refresh();
    },
    [refresh]
  );

  const handleToggleComplete = useCallback(
    async (task: Task) => {
      const storage = getStorage();
      if (task.status === "completed") {
        // Reopen
        await storage.update("tasks", task.id, {
          status: "pending",
          completedAt: undefined,
        });
        await refresh();
        return;
      }

      // Mark complete
      await storage.update("tasks", task.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      // If recurring and has a due date, spawn the next occurrence.
      if (task.frequency !== "once" && task.dueDate) {
        const nextDue = advanceTaskDueDate(task.dueDate, task.frequency);
        if (nextDue) {
          await storage.create("tasks", {
            title: task.title,
            description: task.description,
            assigneeId: task.assigneeId,
            dueDate: nextDue,
            priority: task.priority,
            status: "pending",
            frequency: task.frequency,
            parentId: task.parentId ?? task.id,
            tags: task.tags,
          });
        }
      }

      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Home tasks &amp; chores
            </h1>
            <p className="text-xs text-muted-foreground">
              One-time tasks and recurring chores. Completing a recurring task spawns
              the next one automatically.
            </p>
          </div>
        </div>
        <Button onClick={() => setMode({ kind: "new" })}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </header>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {TASK_VIEW_ORDER.map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {TASK_VIEW_LABELS[v]}
                <span
                  className={cn(
                    "text-[10px] rounded px-1.5 py-0.5",
                    v === "overdue" && counts[v] > 0
                      ? "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts[v]}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading tasks…
          </p>
        ) : (
          <TaskList
            tasks={filtered}
            onToggleComplete={handleToggleComplete}
            onEdit={(t) => setMode({ kind: "edit", task: t })}
            onDelete={handleDelete}
            emptyTitle={
              view === "completed" ? "Nothing completed yet" : "Nothing here"
            }
            emptyDescription={
              view === "overdue"
                ? "You're all caught up."
                : view === "today"
                ? "Nothing due today."
                : view === "week"
                ? "Nothing due this week."
                : view === "completed"
                ? "Completed tasks will appear here."
                : "Add your first task to get started."
            }
          />
        )}
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit task" : "New task"}
        description={
          mode.kind === "edit"
            ? "Update the details below."
            : "Add a one-time task or a recurring chore."
        }
      >
        {mode.kind !== "closed" && (
          <TaskForm
            defaultValues={mode.kind === "edit" ? mode.task : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add task"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.task.id, values);
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
