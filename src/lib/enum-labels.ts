import type {
  ExpenseCategory,
} from "./schema";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  EXPENSE_TAGS,
  FREQUENCIES,
  TASK_STATUSES,
  PRIORITIES,
  BUDGET_PERIODS,
  INCOME_SOURCES,
  GOAL_TYPES,
  GOAL_HORIZONS,
  DEBT_TYPES,
  ACCOUNT_TYPES,
  MAINTENANCE_CATEGORIES,
  INVENTORY_CATEGORIES,
} from "./schema";

function titleCase(s: string): string {
  return s
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function buildLabels<T extends readonly string[]>(
  values: T
): Record<T[number], string> {
  return Object.fromEntries(
    values.map((v) => [v, titleCase(v)])
  ) as Record<T[number], string>;
}

export const EXPENSE_CATEGORY_LABELS = buildLabels(EXPENSE_CATEGORIES);
export const PAYMENT_METHOD_LABELS = buildLabels(PAYMENT_METHODS);
export const EXPENSE_TAG_LABELS = buildLabels(EXPENSE_TAGS);
export const FREQUENCY_LABELS = buildLabels(FREQUENCIES);
export const TASK_STATUS_LABELS = buildLabels(TASK_STATUSES);
export const PRIORITY_LABELS = buildLabels(PRIORITIES);
export const BUDGET_PERIOD_LABELS = buildLabels(BUDGET_PERIODS);
export const INCOME_SOURCE_LABELS = buildLabels(INCOME_SOURCES);
export const GOAL_TYPE_LABELS = buildLabels(GOAL_TYPES);
export const DEBT_TYPE_LABELS = buildLabels(DEBT_TYPES);
export const ACCOUNT_TYPE_LABELS = buildLabels(ACCOUNT_TYPES);

export const MAINTENANCE_CATEGORY_LABELS: Record<
  (typeof MAINTENANCE_CATEGORIES)[number],
  string
> = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliance: "Appliance",
  exterior: "Exterior",
  yard: "Yard",
  cleaning: "Cleaning",
  safety: "Safety",
  seasonal: "Seasonal",
  other: "Other",
};

export const INVENTORY_CATEGORY_LABELS = buildLabels(INVENTORY_CATEGORIES);

export const INVENTORY_CATEGORY_ACCENT: Record<
  (typeof INVENTORY_CATEGORIES)[number],
  string
> = {
  appliance: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  electronics: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  furniture: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  tool: "bg-stone-500/10 text-stone-700 dark:text-stone-300",
  vehicle: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  jewelry: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  other: "bg-muted text-muted-foreground",
};

export const MAINTENANCE_CATEGORY_ACCENT: Record<
  (typeof MAINTENANCE_CATEGORIES)[number],
  string
> = {
  hvac: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  plumbing: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  electrical: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  appliance: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  exterior: "bg-stone-500/10 text-stone-700 dark:text-stone-300",
  yard: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
  cleaning: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  safety: "bg-red-500/10 text-red-700 dark:text-red-300",
  seasonal: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  other: "bg-muted text-muted-foreground",
};

export const GOAL_HORIZON_LABELS: Record<
  (typeof GOAL_HORIZONS)[number],
  string
> = {
  short: "Short-term",
  mid: "Mid-term",
  long: "Long-term",
};

export const GOAL_HORIZON_HINT: Record<
  (typeof GOAL_HORIZONS)[number],
  string
> = {
  short: "Within the next year",
  mid: "1 – 5 years",
  long: "5+ years",
};

// Tailwind class suggestions per category — drives colored chips in lists.
export const EXPENSE_CATEGORY_ACCENT: Record<ExpenseCategory, string> = {
  groceries: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  dining: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  transport: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  utilities: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  housing: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  entertainment: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  healthcare: "bg-red-500/10 text-red-700 dark:text-red-300",
  personal: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  gifts: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  education: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  childcare: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  pets: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
  travel: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  subscriptions: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  debt_payment: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  savings: "bg-green-500/10 text-green-700 dark:text-green-300",
  other: "bg-muted text-muted-foreground",
};
