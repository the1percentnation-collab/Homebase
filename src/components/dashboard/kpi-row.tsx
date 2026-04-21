"use client";

import {
  Receipt,
  CalendarClock,
  ListChecks,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatMoney, startOfMonthIso, todayIso, addDaysIso } from "@/lib/format";
import { useCollection } from "@/lib/use-collection";

type Kpi = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  progress?: { value: number; max: number; tone: "default" | "warning" | "danger" };
  href?: string;
};

export function KpiRow() {
  const { items: expenses } = useCollection("expenses");
  const { items: budgets } = useCollection("budgets");
  const { items: bills } = useCollection("bills");
  const { items: tasks } = useCollection("tasks");
  const { items: accounts } = useCollection("accounts");
  const { items: snapshots } = useCollection("netWorthSnapshots");

  const monthStart = startOfMonthIso();
  const today = todayIso();
  const in7 = addDaysIso(7);

  const monthSpend = expenses
    .filter((e) => e.date >= monthStart && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyBudget = budgets
    .filter((b) => b.period === "monthly")
    .reduce((sum, b) => sum + b.amount, 0);

  const upcomingBills = bills.filter((b) => b.dueDate >= today && b.dueDate <= in7);
  const upcomingBillsAmount = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && t.dueDate < today
  );
  const dueTodayTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate === today
  );

  const latestSnapshot = snapshots
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const netWorthFromAccounts = accounts.reduce(
    (sum, a) => sum + (a.isAsset ? a.balance : -a.balance),
    0
  );
  const netWorth = latestSnapshot ? latestSnapshot.netWorth : netWorthFromAccounts;

  const spendPct = monthlyBudget > 0 ? (monthSpend / monthlyBudget) * 100 : 0;
  const spendTone: "default" | "warning" | "danger" =
    spendPct >= 100 ? "danger" : spendPct >= 80 ? "warning" : "default";

  const kpis: Kpi[] = [
    {
      label: "Spending this month",
      value: formatMoney(monthSpend),
      sub:
        monthlyBudget > 0
          ? `of ${formatMoney(monthlyBudget)} budget`
          : "No monthly budget set",
      icon: Receipt,
      progress:
        monthlyBudget > 0
          ? { value: monthSpend, max: monthlyBudget, tone: spendTone }
          : undefined,
      href: "/finances/expenses",
    },
    {
      label: "Bills in next 7 days",
      value: String(upcomingBills.length),
      sub:
        upcomingBills.length > 0
          ? formatMoney(upcomingBillsAmount) + " due"
          : "Nothing due",
      icon: CalendarClock,
      href: "/finances/bills",
    },
    {
      label: "Tasks needing attention",
      value: String(overdueTasks.length + dueTodayTasks.length),
      sub:
        overdueTasks.length > 0
          ? `${overdueTasks.length} overdue`
          : dueTodayTasks.length > 0
          ? `${dueTodayTasks.length} due today`
          : "All clear",
      icon: ListChecks,
      href: "/home/tasks",
    },
    {
      label: "Net worth",
      value: formatMoney(netWorth),
      sub: latestSnapshot
        ? `as of ${latestSnapshot.date}`
        : accounts.length > 0
        ? "from accounts"
        : "No data yet",
      icon: TrendingUp,
      href: "/finances/networth",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{kpi.value}</div>
      {kpi.sub && (
        <div className="mt-1 text-xs text-muted-foreground">{kpi.sub}</div>
      )}
      {kpi.progress && (
        <ProgressBar
          className="mt-3"
          value={kpi.progress.value}
          max={kpi.progress.max}
          tone={kpi.progress.tone}
        />
      )}
    </>
  );
  const base = "rounded-xl border border-border bg-card p-4 shadow-sm";
  if (kpi.href) {
    return (
      <Link href={kpi.href} className={`${base} block transition hover:border-foreground/20`}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}
