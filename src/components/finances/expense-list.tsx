"use client";

import { Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EXPENSE_CATEGORY_ACCENT,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { Expense } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

export function ExpenseList({ expenses, onEdit, onDelete }: Props) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Log your first expense with the New expense button in the top right."
      />
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="md:hidden divide-y divide-border">
        {expenses.map((e) => (
          <li key={e.id} className="py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.date)} · {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                </p>
              </div>
              <div className="text-sm font-semibold tabular-nums">
                {formatMoney(e.amount, { cents: true })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                    EXPENSE_CATEGORY_ACCENT[e.category]
                  )}
                >
                  {EXPENSE_CATEGORY_LABELS[e.category]}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                    e.tag === "essential"
                      ? "bg-muted text-muted-foreground"
                      : "bg-[var(--warning)]/10 text-[var(--warning)]"
                  )}
                >
                  {e.tag}
                </span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(e)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(e)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 text-left font-medium">Date</th>
              <th className="py-2 pr-3 text-left font-medium">Description</th>
              <th className="py-2 pr-3 text-left font-medium">Category</th>
              <th className="py-2 pr-3 text-left font-medium">Tag</th>
              <th className="py-2 pr-3 text-left font-medium">Method</th>
              <th className="py-2 pr-3 text-right font-medium">Amount</th>
              <th className="py-2 pl-3 text-right font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-accent/40">
                <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                  {formatDate(e.date)}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="font-medium truncate max-w-[22ch]">
                    {e.description}
                  </div>
                  {e.notes && (
                    <div className="text-xs text-muted-foreground truncate max-w-[22ch]">
                      {e.notes}
                    </div>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                      EXPENSE_CATEGORY_ACCENT[e.category]
                    )}
                  >
                    {EXPENSE_CATEGORY_LABELS[e.category]}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                      e.tag === "essential"
                        ? "bg-muted text-muted-foreground"
                        : "bg-[var(--warning)]/10 text-[var(--warning)]"
                    )}
                  >
                    {e.tag}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                </td>
                <td className="py-2.5 pr-3 text-right font-medium tabular-nums">
                  {formatMoney(e.amount, { cents: true })}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
