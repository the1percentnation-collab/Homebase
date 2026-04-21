import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import type { Budget, Expense } from "./schema";

export type PeriodWindow = {
  startIso: string;
  endIso: string;
  label: string;
};

const WEEK_OPTS = { weekStartsOn: 0 } as const; // Sunday

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function currentPeriodWindow(
  period: Budget["period"],
  now: Date = new Date()
): PeriodWindow {
  if (period === "monthly") {
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    return {
      startIso: iso(s),
      endIso: iso(e),
      label: s.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }
  const s = startOfWeek(now, WEEK_OPTS);
  const e = endOfWeek(now, WEEK_OPTS);
  return {
    startIso: iso(s),
    endIso: iso(e),
    label: `Week of ${s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`,
  };
}

export function previousPeriodWindow(
  period: Budget["period"],
  now: Date = new Date()
): PeriodWindow {
  const ref = period === "monthly" ? subMonths(now, 1) : subWeeks(now, 1);
  return currentPeriodWindow(period, ref);
}

export function sumExpensesInWindow(
  expenses: Expense[],
  window: PeriodWindow,
  category: Budget["category"]
): number {
  return expenses
    .filter(
      (e) =>
        e.category === category &&
        e.date >= window.startIso &&
        e.date <= window.endIso
    )
    .reduce((sum, e) => sum + e.amount, 0);
}

export type BudgetStatus = {
  budget: Budget;
  window: PeriodWindow;
  spent: number;
  rolloverIn: number;
  effectiveBudget: number;
  remaining: number;
  percent: number;
  tone: "default" | "warning" | "danger";
};

export function computeBudgetStatus(
  budget: Budget,
  expenses: Expense[],
  now: Date = new Date()
): BudgetStatus {
  const window = currentPeriodWindow(budget.period, now);
  const spent = sumExpensesInWindow(expenses, window, budget.category);

  let rolloverIn = 0;
  if (budget.rollover) {
    const prev = previousPeriodWindow(budget.period, now);
    const prevSpent = sumExpensesInWindow(expenses, prev, budget.category);
    rolloverIn = Math.max(0, budget.amount - prevSpent);
  }

  const effectiveBudget = budget.amount + rolloverIn;
  const remaining = effectiveBudget - spent;
  const percent = effectiveBudget > 0 ? (spent / effectiveBudget) * 100 : 0;

  const threshold = budget.alertThreshold ?? 80;
  const tone: BudgetStatus["tone"] =
    percent >= 100 ? "danger" : percent >= threshold ? "warning" : "default";

  return {
    budget,
    window,
    spent,
    rolloverIn,
    effectiveBudget,
    remaining,
    percent,
    tone,
  };
}
