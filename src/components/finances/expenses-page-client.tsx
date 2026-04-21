"use client";

import {
  Download,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExpenseForm, type ExpenseFormSubmit } from "./expense-form";
import { ExpenseList } from "./expense-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TAG_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/enum-labels";
import { exportCollectionCsv } from "@/lib/export";
import { formatMoney, startOfMonthIso, todayIso } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TAGS,
  PAYMENT_METHODS,
  type Expense,
} from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; expense: Expense };

type Filters = {
  search: string;
  category: "all" | (typeof EXPENSE_CATEGORIES)[number];
  tag: "all" | (typeof EXPENSE_TAGS)[number];
  method: "all" | (typeof PAYMENT_METHODS)[number];
  dateFrom: string;
  dateTo: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  category: "all",
  tag: "all",
  method: "all",
  dateFrom: "",
  dateTo: "",
};

export function ExpensesPageClient() {
  const { items, loading, refresh } = useCollection("expenses");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setMode({ kind: "new" });
      const next = new URLSearchParams(searchParams.toString());
      next.delete("new");
      const qs = next.toString();
      router.replace(qs ? `/finances/expenses?${qs}` : "/finances/expenses");
    }
  }, [searchParams, router]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const activeAdvancedCount =
    (filters.tag !== "all" ? 1 : 0) +
    (filters.method !== "all" ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const hasAnyFilter =
    activeAdvancedCount > 0 ||
    filters.search !== "" ||
    filters.category !== "all";

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items
      .filter((e) => {
        if (filters.category !== "all" && e.category !== filters.category)
          return false;
        if (filters.tag !== "all" && e.tag !== filters.tag) return false;
        if (filters.method !== "all" && e.paymentMethod !== filters.method)
          return false;
        if (filters.dateFrom && e.date < filters.dateFrom) return false;
        if (filters.dateTo && e.date > filters.dateTo) return false;
        if (!q) return true;
        return (
          e.description.toLowerCase().includes(q) ||
          (e.notes ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [items, filters]);

  const monthStart = startOfMonthIso();
  const today = todayIso();

  const totals = useMemo(() => {
    const monthTotal = items
      .filter((e) => e.date >= monthStart && e.date <= today)
      .reduce((sum, e) => sum + e.amount, 0);
    const allTotal = items.reduce((sum, e) => sum + e.amount, 0);
    const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);
    return {
      monthTotal,
      allTotal,
      filteredTotal,
      count: items.length,
      filteredCount: filtered.length,
    };
  }, [items, filtered, monthStart, today]);

  const handleCreate = useCallback(
    async (values: ExpenseFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("expenses", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: ExpenseFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("expenses", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (expense: Expense) => {
      if (!window.confirm(`Delete "${expense.description}"?`)) return;
      await getStorage().remove("expenses", expense.id);
      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
            <p className="text-xs text-muted-foreground">
              Track every dollar by category, tag, and payment method.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("expenses")}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New expense
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard label="This month" value={formatMoney(totals.monthTotal)} />
        <TotalCard label="All time" value={formatMoney(totals.allTotal)} />
        <TotalCard
          label={hasAnyFilter ? "Filtered total" : "Entries"}
          value={
            hasAnyFilter
              ? formatMoney(totals.filteredTotal)
              : String(totals.count)
          }
          sub={
            hasAnyFilter
              ? `${totals.filteredCount} of ${totals.count}`
              : undefined
          }
        />
        <TotalCard
          label="Average / entry"
          value={
            totals.count > 0
              ? formatMoney(totals.allTotal / totals.count)
              : "—"
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search description or notes..."
                className="pl-8"
              />
            </label>
            <div className="sm:w-48">
              <Select
                value={filters.category}
                onChange={(e) =>
                  setFilter("category", e.target.value as Filters["category"])
                }
              >
                <option value="all">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(showAdvanced && "bg-accent")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeAdvancedCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {activeAdvancedCount}
                </span>
              )}
            </Button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <LabeledField label="From">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter("dateFrom", e.target.value)}
                />
              </LabeledField>
              <LabeledField label="To">
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilter("dateTo", e.target.value)}
                />
              </LabeledField>
              <LabeledField label="Tag">
                <Select
                  value={filters.tag}
                  onChange={(e) =>
                    setFilter("tag", e.target.value as Filters["tag"])
                  }
                >
                  <option value="all">All tags</option>
                  {EXPENSE_TAGS.map((t) => (
                    <option key={t} value={t}>
                      {EXPENSE_TAG_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </LabeledField>
              <LabeledField label="Payment method">
                <Select
                  value={filters.method}
                  onChange={(e) =>
                    setFilter("method", e.target.value as Filters["method"])
                  }
                >
                  <option value="all">All methods</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </LabeledField>
            </div>
          )}

          {hasAnyFilter && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {totals.filteredCount} of {totals.count}
                {" · "}
                {formatMoney(totals.filteredTotal, { cents: true })} total
              </p>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="px-4 pb-2 pt-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading expenses…
            </p>
          ) : (
            <ExpenseList
              expenses={filtered}
              onEdit={(expense) => setMode({ kind: "edit", expense })}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit expense" : "New expense"}
        description={
          mode.kind === "edit"
            ? "Update the details below."
            : "Log a new expense. Recurring entries coming soon."
        }
      >
        {mode.kind !== "closed" && (
          <ExpenseForm
            defaultValues={mode.kind === "edit" ? mode.expense : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add expense"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.expense.id, values);
              } else {
                await handleCreate(values);
              }
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function TotalCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
