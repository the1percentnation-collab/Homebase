import {
  BUDGET_PERIOD_LABELS,
  DEBT_TYPE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
  GOAL_TYPE_LABELS,
  INCOME_SOURCE_LABELS,
  PRIORITY_LABELS,
} from "./enum-labels";
import { formatDate, formatMoney } from "./format";
import { getStorage } from "./storage";

export type SearchResultType =
  | "expense"
  | "task"
  | "bill"
  | "budget"
  | "income"
  | "goal"
  | "debt";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export const SEARCH_TYPE_LABEL: Record<SearchResultType, string> = {
  expense: "Expenses",
  income: "Income",
  bill: "Bills",
  budget: "Budgets",
  goal: "Goals",
  debt: "Debts",
  task: "Tasks",
};

const TYPE_ORDER: SearchResultType[] = [
  "expense",
  "income",
  "bill",
  "budget",
  "goal",
  "debt",
  "task",
];

function matches(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const storage = getStorage();
  const [expenses, tasks, bills, budgets, incomes, goals, debts] =
    await Promise.all([
      storage.list("expenses"),
      storage.list("tasks"),
      storage.list("bills"),
      storage.list("budgets"),
      storage.list("incomes"),
      storage.list("goals"),
      storage.list("debts"),
    ]);

  const out: SearchResult[] = [];

  for (const e of expenses) {
    if (matches(q, e.description, e.notes, EXPENSE_CATEGORY_LABELS[e.category])) {
      out.push({
        type: "expense",
        id: e.id,
        title: e.description,
        subtitle: `${formatMoney(e.amount, { cents: true })} · ${
          EXPENSE_CATEGORY_LABELS[e.category]
        } · ${formatDate(e.date)}`,
        href: "/finances/expenses",
      });
    }
  }

  for (const t of tasks) {
    if (matches(q, t.title, t.description)) {
      out.push({
        type: "task",
        id: t.id,
        title: t.title,
        subtitle: `${PRIORITY_LABELS[t.priority]} · ${
          t.dueDate ? formatDate(t.dueDate) : "No due date"
        }${t.frequency !== "once" ? ` · ${FREQUENCY_LABELS[t.frequency]}` : ""}`,
        href: "/home/tasks",
      });
    }
  }

  for (const b of bills) {
    if (matches(q, b.name, b.notes, EXPENSE_CATEGORY_LABELS[b.category])) {
      out.push({
        type: "bill",
        id: b.id,
        title: b.name,
        subtitle: `${formatMoney(b.amount, { cents: true })} · ${
          FREQUENCY_LABELS[b.frequency]
        } · due ${formatDate(b.dueDate)}`,
        href: "/finances/bills",
      });
    }
  }

  for (const b of budgets) {
    if (matches(q, EXPENSE_CATEGORY_LABELS[b.category])) {
      out.push({
        type: "budget",
        id: b.id,
        title: `${EXPENSE_CATEGORY_LABELS[b.category]} budget`,
        subtitle: `${formatMoney(b.amount)} ${
          BUDGET_PERIOD_LABELS[b.period]
        }${b.rollover ? " · rollover" : ""}`,
        href: "/finances/budgets",
      });
    }
  }

  for (const i of incomes) {
    if (matches(q, i.sourceName, i.notes, INCOME_SOURCE_LABELS[i.source])) {
      out.push({
        type: "income",
        id: i.id,
        title: i.sourceName,
        subtitle: `${formatMoney(i.netAmount, { cents: true })} net · ${
          INCOME_SOURCE_LABELS[i.source]
        } · ${formatDate(i.date)}`,
        href: "/finances/income",
      });
    }
  }

  for (const g of goals) {
    if (matches(q, g.name, g.notes, GOAL_TYPE_LABELS[g.type])) {
      const pct =
        g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      out.push({
        type: "goal",
        id: g.id,
        title: g.name,
        subtitle: `${pct}% · ${formatMoney(g.currentAmount)} / ${formatMoney(
          g.targetAmount
        )}${g.deadline ? ` · by ${formatDate(g.deadline)}` : ""}`,
        href: "/finances/goals",
      });
    }
  }

  for (const d of debts) {
    if (matches(q, d.name, d.notes, DEBT_TYPE_LABELS[d.type])) {
      out.push({
        type: "debt",
        id: d.id,
        title: d.name,
        subtitle: `${formatMoney(d.balance, { cents: true })} · ${d.interestRate.toFixed(
          2
        )}% APR · ${DEBT_TYPE_LABELS[d.type]}`,
        href: "/finances/debts",
      });
    }
  }

  // Stable order: by type (expenses first), then by title.
  return out.sort((a, b) => {
    const ao = TYPE_ORDER.indexOf(a.type);
    const bo = TYPE_ORDER.indexOf(b.type);
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

export function groupResults(
  results: SearchResult[]
): { type: SearchResultType; items: SearchResult[] }[] {
  const groups = new Map<SearchResultType, SearchResult[]>();
  for (const r of results) {
    const list = groups.get(r.type) ?? [];
    list.push(r);
    groups.set(r.type, list);
  }
  return TYPE_ORDER.filter((t) => groups.has(t)).map((t) => ({
    type: t,
    items: groups.get(t)!,
  }));
}
