import {
  BUDGET_PERIOD_LABELS,
  EXPENSE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
  PRIORITY_LABELS,
} from "./enum-labels";
import { formatDate, formatMoney } from "./format";
import { getStorage } from "./storage";

export type SearchResultType = "expense" | "task" | "bill" | "budget";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export const SEARCH_TYPE_LABEL: Record<SearchResultType, string> = {
  expense: "Expenses",
  task: "Tasks",
  bill: "Bills",
  budget: "Budgets",
};

const TYPE_ORDER: SearchResultType[] = ["expense", "bill", "task", "budget"];

function matches(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const storage = getStorage();
  const [expenses, tasks, bills, budgets] = await Promise.all([
    storage.list("expenses"),
    storage.list("tasks"),
    storage.list("bills"),
    storage.list("budgets"),
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
