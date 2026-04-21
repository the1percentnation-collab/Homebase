import { endOfMonth, format, startOfMonth, subMonths, addMonths } from "date-fns";
import { computeBudgetStatus, currentPeriodWindow } from "./budget-helpers";
import type {
  Budget,
  Expense,
  ExpenseCategory,
  Goal,
  Income,
  Task,
} from "./schema";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function monthWindow(ref: Date = new Date()): {
  startIso: string;
  endIso: string;
  label: string;
  monthKey: string; // YYYY-MM
} {
  const s = startOfMonth(ref);
  const e = endOfMonth(ref);
  return {
    startIso: iso(s),
    endIso: iso(e),
    label: format(s, "MMMM yyyy"),
    monthKey: format(s, "yyyy-MM"),
  };
}

export function shiftMonth(key: string, delta: number): string {
  const d = new Date(key + "-01T00:00:00");
  return format(delta < 0 ? subMonths(d, -delta) : addMonths(d, delta), "yyyy-MM");
}

export function monthRefFromKey(key: string): Date {
  return new Date(key + "-01T00:00:00");
}

export type CategoryBreakdown = {
  category: ExpenseCategory;
  amount: number;
  count: number;
  share: number;
};

export type TaskReport = {
  completed: number;
  overdue: number;
  dueThisMonth: number;
};

export type BudgetReportRow = {
  budget: Budget;
  spent: number;
  amount: number;
  percent: number;
  overBy: number;
};

export type MonthReport = {
  window: { startIso: string; endIso: string; label: string; monthKey: string };
  totalIncomeNet: number;
  totalIncomeGross: number;
  totalExpenses: number;
  net: number;
  savingsRate: number; // 0..1 based on net income
  expenseCount: number;
  incomeCount: number;
  byCategory: CategoryBreakdown[];
  budgets: BudgetReportRow[];
  tasks: TaskReport;
  topGoals: { goal: Goal; percent: number }[];
};

export function buildMonthReport(input: {
  ref: Date;
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  tasks: Task[];
  goals: Goal[];
}): MonthReport {
  const { ref, expenses, incomes, budgets, tasks, goals } = input;
  const w = monthWindow(ref);
  const now = new Date();
  const today = iso(now);

  const monthExpenses = expenses.filter(
    (e) => e.date >= w.startIso && e.date <= w.endIso
  );
  const monthIncomes = incomes.filter(
    (i) => i.date >= w.startIso && i.date <= w.endIso
  );

  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncomeNet = monthIncomes.reduce((s, i) => s + i.netAmount, 0);
  const totalIncomeGross = monthIncomes.reduce((s, i) => s + i.grossAmount, 0);
  const net = totalIncomeNet - totalExpenses;
  const savingsRate = totalIncomeNet > 0 ? net / totalIncomeNet : 0;

  const categoryTotals = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const e of monthExpenses) {
    const entry = categoryTotals.get(e.category) ?? { amount: 0, count: 0 };
    entry.amount += e.amount;
    entry.count += 1;
    categoryTotals.set(e.category, entry);
  }
  const byCategory: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      count,
      share: totalExpenses > 0 ? amount / totalExpenses : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Only current-month / active budget progress makes sense; for past months
  // the budget may have changed. Keep the report focused on the budget-as-of-now
  // if the selected month is the current month.
  const isCurrentMonth = w.monthKey === format(now, "yyyy-MM");
  const budgetRows: BudgetReportRow[] = isCurrentMonth
    ? budgets
        .filter((b) => b.period === "monthly")
        .map((b) => {
          const status = computeBudgetStatus(b, expenses, now);
          return {
            budget: b,
            spent: status.spent,
            amount: status.effectiveBudget,
            percent: status.percent,
            overBy: Math.max(0, status.spent - status.effectiveBudget),
          };
        })
        .sort((a, b) => b.percent - a.percent)
    : [];

  // Tasks completed in the window (by completedAt) and due in the window.
  const taskReport: TaskReport = {
    completed: tasks.filter(
      (t) =>
        t.status === "completed" &&
        t.completedAt &&
        t.completedAt.slice(0, 10) >= w.startIso &&
        t.completedAt.slice(0, 10) <= w.endIso
    ).length,
    overdue: isCurrentMonth
      ? tasks.filter(
          (t) =>
            t.status !== "completed" &&
            t.status !== "cancelled" &&
            t.dueDate &&
            t.dueDate < today
        ).length
      : 0,
    dueThisMonth: tasks.filter(
      (t) => t.dueDate && t.dueDate >= w.startIso && t.dueDate <= w.endIso
    ).length,
  };

  const topGoals = goals
    .map((g) => ({
      goal: g,
      percent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
    }))
    .sort((a, b) => {
      const ad = a.goal.deadline ?? "9999-99-99";
      const bd = b.goal.deadline ?? "9999-99-99";
      if (ad !== bd) return ad.localeCompare(bd);
      return b.percent - a.percent;
    })
    .slice(0, 3);

  return {
    window: w,
    totalIncomeNet,
    totalIncomeGross,
    totalExpenses,
    net,
    savingsRate,
    expenseCount: monthExpenses.length,
    incomeCount: monthIncomes.length,
    byCategory,
    budgets: budgetRows,
    tasks: taskReport,
    topGoals,
  };
}

// Reference to imports we use but may not have hit elsewhere — keeps the
// tree-shaker honest.
export { currentPeriodWindow };
