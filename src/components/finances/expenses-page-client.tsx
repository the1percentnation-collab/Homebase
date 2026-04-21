"use client";

import { Download, Plus, Receipt, Search } from "lucide-react";
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
} from "@/lib/enum-labels";
import { exportCollectionCsv } from "@/lib/export";
import { formatMoney, startOfMonthIso, todayIso } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; expense: Expense };

export function ExpensesPageClient() {
  const { items, loading, refresh } = useCollection("expenses");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Open drawer when the quick-add tile routes here with ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setMode({ kind: "new" });
      const next = new URLSearchParams(searchParams.toString());
      next.delete("new");
      const qs = next.toString();
      router.replace(qs ? `/finances/expenses?${qs}` : "/finances/expenses");
    }
  }, [searchParams, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((e) => {
        if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
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
  }, [items, search, categoryFilter]);

  const monthStart = startOfMonthIso();
  const today = todayIso();

  const totals = useMemo(() => {
    const monthTotal = items
      .filter((e) => e.date >= monthStart && e.date <= today)
      .reduce((sum, e) => sum + e.amount, 0);
    const allTotal = items.reduce((sum, e) => sum + e.amount, 0);
    return { monthTotal, allTotal, count: items.length };
  }, [items, monthStart, today]);

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
        <TotalCard label="Entries" value={String(totals.count)} />
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
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or notes..."
              className="pl-8"
            />
          </label>
          <div className="sm:w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
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

function TotalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
