"use client";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DEFAULT_USER_ID } from "@/lib/constants";
import {
  EXPENSE_CATEGORY_ACCENT,
  EXPENSE_CATEGORY_LABELS,
  GOAL_TYPE_LABELS,
} from "@/lib/enum-labels";
import { downloadBlob, toCsv } from "@/lib/export";
import { formatDate, formatMoney } from "@/lib/format";
import {
  buildMonthReport,
  monthRefFromKey,
  monthWindow,
  shiftMonth,
} from "@/lib/report-helpers";
import type { Expense, Income } from "@/lib/schema";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

export function MonthlyReportPageClient() {
  const { items: expenses } = useCollection("expenses");
  const { items: incomes } = useCollection("incomes");
  const { items: budgets } = useCollection("budgets");
  const { items: tasks } = useCollection("tasks");
  const { items: goals } = useCollection("goals");

  const [monthKey, setMonthKey] = useState<string>(monthWindow().monthKey);
  const ref = monthRefFromKey(monthKey);
  const todayKey = monthWindow().monthKey;
  const isCurrent = monthKey === todayKey;

  const report = useMemo(
    () => buildMonthReport({ ref, expenses, incomes, budgets, tasks, goals }),
    [ref, expenses, incomes, budgets, tasks, goals]
  );

  function exportMonthCsv() {
    const rows: Record<string, unknown>[] = [];
    const monthExpenses = expenses.filter(
      (e: Expense) =>
        e.date >= report.window.startIso && e.date <= report.window.endIso
    );
    const monthIncomes = incomes.filter(
      (i: Income) =>
        i.date >= report.window.startIso && i.date <= report.window.endIso
    );
    for (const e of monthExpenses) {
      rows.push({
        kind: "expense",
        date: e.date,
        description: e.description,
        category: EXPENSE_CATEGORY_LABELS[e.category],
        amount: -e.amount,
        tag: e.tag,
        paymentMethod: e.paymentMethod,
        notes: e.notes ?? "",
      });
    }
    for (const i of monthIncomes) {
      rows.push({
        kind: "income",
        date: i.date,
        description: i.sourceName,
        category: i.source,
        amount: i.netAmount,
        gross: i.grossAmount,
        frequency: i.frequency,
        notes: i.notes ?? "",
      });
    }
    rows.sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
    downloadBlob(
      toCsv(rows) || "(no data)",
      `homebase-report-${report.window.monthKey}.csv`,
      "text/csv;charset=utf-8"
    );
  }

  const netTone =
    report.net > 0
      ? "text-[var(--success)]"
      : report.net < 0
      ? "text-[var(--destructive)]"
      : "";
  const savingsPct = Math.round(report.savingsRate * 100);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Monthly report</h1>
            <p className="text-xs text-muted-foreground">
              Spending breakdown, savings rate, goal progress, and task stats.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={exportMonthCsv}
          disabled={report.expenseCount === 0 && report.incomeCount === 0}
        >
          <Download className="h-4 w-4" />
          Export month (CSV)
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonthKey((k) => shiftMonth(k, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[12ch] text-center text-sm font-medium">
            {report.window.label}
          </p>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonthKey((k) => shiftMonth(k, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          size="sm"
          variant={isCurrent ? "ghost" : "outline"}
          onClick={() => setMonthKey(todayKey)}
          disabled={isCurrent}
        >
          This month
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Income (net)"
          value={formatMoney(report.totalIncomeNet, { cents: true })}
          sub={
            report.totalIncomeGross > 0
              ? `${formatMoney(report.totalIncomeGross)} gross`
              : undefined
          }
        />
        <KpiCard
          label="Expenses"
          value={formatMoney(report.totalExpenses, { cents: true })}
          sub={`${report.expenseCount} entr${report.expenseCount === 1 ? "y" : "ies"}`}
        />
        <KpiCard
          label="Net"
          value={formatMoney(report.net, { cents: true })}
          valueClassName={netTone}
        />
        <KpiCard
          label="Savings rate"
          value={report.totalIncomeNet > 0 ? `${savingsPct}%` : "—"}
          sub={
            report.totalIncomeNet > 0
              ? savingsPct >= 20
                ? "Solid"
                : savingsPct >= 0
                ? "Keep building"
                : "Spending exceeds income"
              : "No income logged"
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Spending by category</h2>
          <p className="text-xs text-muted-foreground">
            Share of the month&apos;s total expenses.
          </p>
        </div>
        {report.byCategory.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing spent this month"
            description="Log expenses to see how your spending breaks down."
          />
        ) : (
          <ul className="divide-y divide-border">
            {report.byCategory.map((c) => (
              <li key={c.category} className="px-5 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                      EXPENSE_CATEGORY_ACCENT[c.category]
                    )}
                  >
                    {EXPENSE_CATEGORY_LABELS[c.category]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.count} · {Math.round(c.share * 100)}%
                  </span>
                  <span className="text-sm font-semibold tabular-nums min-w-[8ch] text-right">
                    {formatMoney(c.amount, { cents: true })}
                  </span>
                </div>
                <ProgressBar value={c.amount} max={report.totalExpenses || 1} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Budget adherence</h2>
            <p className="text-xs text-muted-foreground">
              {isCurrent
                ? "Live against the current month."
                : "Historical budgets aren't tracked — this shows only for the current month."}
            </p>
          </div>
          {!isCurrent ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Switch to this month to see budget adherence.
            </p>
          ) : report.budgets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No monthly budgets"
              description="Set budgets to see category-by-category adherence here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {report.budgets.map((b) => {
                const tone: "default" | "warning" | "danger" =
                  b.percent >= 100
                    ? "danger"
                    : b.percent >= (b.budget.alertThreshold ?? 80)
                    ? "warning"
                    : "default";
                return (
                  <li key={b.budget.id} className="px-5 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                          EXPENSE_CATEGORY_ACCENT[b.budget.category]
                        )}
                      >
                        {EXPENSE_CATEGORY_LABELS[b.budget.category]}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatMoney(b.spent)} / {formatMoney(b.amount)}
                      </span>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          tone === "danger" && "text-[var(--destructive)]"
                        )}
                      >
                        {Math.round(b.percent)}%
                      </span>
                    </div>
                    <ProgressBar value={b.spent} max={b.amount || 1} tone={tone} />
                    {b.overBy > 0 && (
                      <p className="text-[11px] text-[var(--destructive)]">
                        Over by {formatMoney(b.overBy, { cents: true })}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Tasks</h2>
            <p className="text-xs text-muted-foreground">
              What landed this month, and what needs attention now.
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            <TaskStat
              icon={<ListChecks className="h-4 w-4" />}
              label="Completed"
              value={report.tasks.completed}
              tone="success"
            />
            <TaskStat
              icon={<ListChecks className="h-4 w-4" />}
              label="Due this month"
              value={report.tasks.dueThisMonth}
            />
            <TaskStat
              icon={<ListChecks className="h-4 w-4" />}
              label="Overdue now"
              value={report.tasks.overdue}
              tone={report.tasks.overdue > 0 ? "danger" : undefined}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Top goals</h2>
          <p className="text-xs text-muted-foreground">
            Snapshot of progress; contribution history coming in a later pass.
          </p>
        </div>
        {report.topGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set a goal to start tracking progress month over month."
          />
        ) : (
          <ul className="divide-y divide-border">
            {report.topGoals.map(({ goal, percent }) => (
              <li key={goal.id} className="px-5 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{goal.name}</p>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(goal.currentAmount)} /{" "}
                    {formatMoney(goal.targetAmount)}
                  </span>
                </div>
                <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    <TrendingUp className="inline h-3 w-3 mr-0.5" />
                    {GOAL_TYPE_LABELS[goal.type]}
                  </span>
                  <span>
                    {Math.round(percent)}%
                    {goal.deadline ? ` · by ${formatDate(goal.deadline)}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Report scoped to user {DEFAULT_USER_ID}. Household-level roll-ups land
        with the user module.
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight",
          valueClassName
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TaskStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "danger"
      ? "text-[var(--destructive)]"
      : "";
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", toneClass)}>
        {value}
      </p>
    </div>
  );
}
