import {
  EXPENSE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
} from "./enum-labels";
import {
  addDaysIso,
  formatDate,
  formatMoney,
  formatRelative,
  todayIso,
} from "./format";
import { getStorage } from "./storage";

export type NotificationSeverity = "info" | "warning" | "danger";

export type NotificationType =
  | "bill_due"
  | "bill_overdue"
  | "task_today"
  | "task_overdue"
  | "goal_deadline"
  | "debt_growing"
  | "warranty_expiring";

export type Notification = {
  id: string; // unique, stable per source record
  type: NotificationType;
  title: string;
  detail: string;
  href: string;
  severity: NotificationSeverity;
  sortKey: string; // for chronological ordering
};

const TYPE_ORDER: NotificationType[] = [
  "bill_overdue",
  "task_overdue",
  "debt_growing",
  "bill_due",
  "task_today",
  "warranty_expiring",
  "goal_deadline",
];

export const NOTIFICATION_GROUP_LABEL: Record<NotificationType, string> = {
  bill_overdue: "Bills overdue",
  task_overdue: "Tasks overdue",
  debt_growing: "Debts outpacing payments",
  bill_due: "Bills due soon",
  task_today: "Tasks due today",
  warranty_expiring: "Warranties expiring",
  goal_deadline: "Goals nearing deadline",
};

export async function gatherNotifications(): Promise<Notification[]> {
  const storage = getStorage();
  const [bills, tasks, goals, debts, inventory] = await Promise.all([
    storage.list("bills"),
    storage.list("tasks"),
    storage.list("goals"),
    storage.list("debts"),
    storage.list("inventoryItems"),
  ]);

  const today = todayIso();
  const in7 = addDaysIso(7);
  const in30 = addDaysIso(30);
  const in60 = addDaysIso(60);
  const out: Notification[] = [];

  for (const b of bills) {
    if (b.dueDate < today) {
      out.push({
        id: `bill_overdue:${b.id}`,
        type: "bill_overdue",
        title: b.name,
        detail: `${formatMoney(b.amount, { cents: true })} · ${formatRelative(b.dueDate)}`,
        href: "/finances/bills",
        severity: "danger",
        sortKey: b.dueDate,
      });
    } else if (b.dueDate <= in7) {
      out.push({
        id: `bill_due:${b.id}`,
        type: "bill_due",
        title: b.name,
        detail: `${formatMoney(b.amount, { cents: true })} · due ${formatDate(b.dueDate)}`,
        href: "/finances/bills",
        severity: b.dueDate === today ? "warning" : "info",
        sortKey: b.dueDate,
      });
    }
  }

  for (const t of tasks) {
    if (t.status === "completed" || t.status === "cancelled") continue;
    if (!t.dueDate) continue;
    if (t.dueDate < today) {
      out.push({
        id: `task_overdue:${t.id}`,
        type: "task_overdue",
        title: t.title,
        detail: `${formatRelative(t.dueDate)}${
          t.frequency !== "once" ? ` · ${FREQUENCY_LABELS[t.frequency]}` : ""
        }`,
        href: "/home/tasks",
        severity: "danger",
        sortKey: t.dueDate,
      });
    } else if (t.dueDate === today) {
      out.push({
        id: `task_today:${t.id}`,
        type: "task_today",
        title: t.title,
        detail: `Due today · ${t.priority}`,
        href: "/home/tasks",
        severity: "warning",
        sortKey: t.dueDate,
      });
    }
  }

  for (const g of goals) {
    if (!g.deadline) continue;
    if (g.currentAmount >= g.targetAmount) continue;
    if (g.deadline >= today && g.deadline <= in30) {
      out.push({
        id: `goal_deadline:${g.id}`,
        type: "goal_deadline",
        title: g.name,
        detail: `${formatMoney(g.currentAmount)} / ${formatMoney(g.targetAmount)} · by ${formatDate(g.deadline)}`,
        href: "/finances/goals",
        severity: "warning",
        sortKey: g.deadline,
      });
    }
  }

  for (const d of debts) {
    const monthlyInterest = (d.balance * d.interestRate) / 100 / 12;
    if (d.minPayment > 0 && d.minPayment <= monthlyInterest) {
      out.push({
        id: `debt_growing:${d.id}`,
        type: "debt_growing",
        title: d.name,
        detail: `Minimum ${formatMoney(d.minPayment, { cents: true })} below monthly interest ${formatMoney(monthlyInterest, { cents: true })}`,
        href: "/finances/debts",
        severity: "danger",
        sortKey: "0",
      });
    }
  }

  for (const i of inventory) {
    if (!i.warrantyExpiry) continue;
    if (i.warrantyExpiry >= today && i.warrantyExpiry <= in60) {
      out.push({
        id: `warranty_expiring:${i.id}`,
        type: "warranty_expiring",
        title: i.name,
        detail: `Warranty ${formatRelative(i.warrantyExpiry)} (${formatDate(i.warrantyExpiry, "MMM d")})`,
        href: "/home/inventory",
        severity: "warning",
        sortKey: i.warrantyExpiry,
      });
    }
  }

  // Primary: type priority (overdue first). Secondary: sortKey (earliest first).
  out.sort((a, b) => {
    const ao = TYPE_ORDER.indexOf(a.type);
    const bo = TYPE_ORDER.indexOf(b.type);
    if (ao !== bo) return ao - bo;
    return a.sortKey.localeCompare(b.sortKey);
  });

  return out;
}

export function groupNotifications(
  list: Notification[]
): { type: NotificationType; items: Notification[] }[] {
  const byType = new Map<NotificationType, Notification[]>();
  for (const n of list) {
    const cur = byType.get(n.type) ?? [];
    cur.push(n);
    byType.set(n.type, cur);
  }
  return TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({
    type: t,
    items: byType.get(t)!,
  }));
}

// Used by EXPENSE_CATEGORY_LABELS/EXPENSE_CATEGORY_ACCENT re-exports to
// keep the tree-shaker honest if a consumer imports lazily.
export { EXPENSE_CATEGORY_LABELS };
