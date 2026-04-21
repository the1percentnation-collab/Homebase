import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { todayIso } from "./format";
import type { Task } from "./schema";

export type TaskView = "open" | "today" | "week" | "overdue" | "completed";

export const TASK_VIEW_LABELS: Record<TaskView, string> = {
  open: "All open",
  today: "Today",
  week: "This week",
  overdue: "Overdue",
  completed: "Completed",
};

export const TASK_VIEW_ORDER: TaskView[] = [
  "open",
  "today",
  "week",
  "overdue",
  "completed",
];

function isOpen(status: Task["status"]): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function filterTasks(tasks: Task[], view: TaskView): Task[] {
  const today = todayIso();
  const in7 = iso(addDays(new Date(today + "T00:00:00"), 7));

  const filtered = tasks.filter((t) => {
    switch (view) {
      case "open":
        return isOpen(t.status);
      case "today":
        return isOpen(t.status) && t.dueDate === today;
      case "week":
        return isOpen(t.status) && !!t.dueDate && t.dueDate <= in7;
      case "overdue":
        return isOpen(t.status) && !!t.dueDate && t.dueDate < today;
      case "completed":
        return t.status === "completed";
    }
  });

  return filtered.sort((a, b) => {
    if (view === "completed") {
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    }
    // No due date sinks to the bottom; otherwise earliest first.
    const ad = a.dueDate ?? "9999-99-99";
    const bd = b.dueDate ?? "9999-99-99";
    if (ad !== bd) return ad.localeCompare(bd);
    const prio = { high: 0, medium: 1, low: 2 } as const;
    return prio[a.priority] - prio[b.priority];
  });
}

export function countTasksByView(tasks: Task[]): Record<TaskView, number> {
  const today = todayIso();
  const in7 = iso(addDays(new Date(today + "T00:00:00"), 7));
  const counts: Record<TaskView, number> = {
    open: 0,
    today: 0,
    week: 0,
    overdue: 0,
    completed: 0,
  };
  for (const t of tasks) {
    if (t.status === "completed") {
      counts.completed += 1;
      continue;
    }
    if (!isOpen(t.status)) continue;
    counts.open += 1;
    if (t.dueDate === today) counts.today += 1;
    if (t.dueDate && t.dueDate <= in7) counts.week += 1;
    if (t.dueDate && t.dueDate < today) counts.overdue += 1;
  }
  return counts;
}

// Advance a due date by the task's frequency. Returns null for "once" tasks
// so callers know not to spawn a next occurrence.
export function advanceTaskDueDate(
  dueDate: string,
  frequency: Task["frequency"]
): string | null {
  if (frequency === "once") return null;
  const base = new Date(dueDate + "T00:00:00");
  let next: Date;
  switch (frequency) {
    case "daily":
      next = addDays(base, 1);
      break;
    case "weekly":
      next = addWeeks(base, 1);
      break;
    case "biweekly":
      next = addWeeks(base, 2);
      break;
    case "monthly":
      next = addMonths(base, 1);
      break;
    case "quarterly":
      next = addMonths(base, 3);
      break;
    case "yearly":
      next = addYears(base, 1);
      break;
  }
  return iso(next);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
