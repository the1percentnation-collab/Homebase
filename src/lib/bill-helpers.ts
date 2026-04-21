import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { addDaysIso, todayIso } from "./format";
import type { Bill } from "./schema";

export type Bucket = "overdue" | "thisWeek" | "thisMonth" | "later";

export const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: "Overdue",
  thisWeek: "Due this week",
  thisMonth: "Due this month",
  later: "Later",
};

export const BUCKET_ORDER: Bucket[] = ["overdue", "thisWeek", "thisMonth", "later"];

export function bucketFor(dueDate: string, now: string = todayIso()): Bucket {
  if (dueDate < now) return "overdue";
  if (dueDate <= addDaysIso(7, new Date(now))) return "thisWeek";
  if (dueDate <= addDaysIso(30, new Date(now))) return "thisMonth";
  return "later";
}

export function groupBills(bills: Bill[]): Record<Bucket, Bill[]> {
  const now = todayIso();
  const groups: Record<Bucket, Bill[]> = {
    overdue: [],
    thisWeek: [],
    thisMonth: [],
    later: [],
  };
  for (const b of bills) {
    groups[bucketFor(b.dueDate, now)].push(b);
  }
  for (const k of BUCKET_ORDER) {
    groups[k].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
  return groups;
}

// Advance a date string (YYYY-MM-DD) by the bill's frequency. Returns
// undefined for "once" so callers know the bill shouldn't recur.
export function advanceDueDate(
  dueDate: string,
  frequency: Bill["frequency"]
): string | undefined {
  const base = new Date(dueDate + "T00:00:00");
  let next: Date;
  switch (frequency) {
    case "once":
      return undefined;
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
  return next.toISOString().slice(0, 10);
}
