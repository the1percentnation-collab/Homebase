"use client";

import { Pencil, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FREQUENCY_LABELS,
  INCOME_SOURCE_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { Income } from "@/lib/schema";

const SOURCE_ACCENT: Record<Income["source"], string> = {
  salary: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  freelance: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  business: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  investment: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rental: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  gift: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  refund: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  other: "bg-muted text-muted-foreground",
};

type Props = {
  incomes: Income[];
  onEdit: (i: Income) => void;
  onDelete: (i: Income) => void;
};

export function IncomeList({ incomes, onEdit, onDelete }: Props) {
  if (incomes.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No income logged yet"
        description="Track paychecks, freelance payments, and other income to see gross vs. net over time."
      />
    );
  }

  return (
    <>
      <ul className="md:hidden divide-y divide-border">
        {incomes.map((i) => (
          <li key={i.id} className="py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{i.sourceName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(i.date)} · {FREQUENCY_LABELS[i.frequency]}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums text-[var(--success)]">
                  {formatMoney(i.netAmount, { cents: true })}
                </div>
                <div className="text-[10px] tabular-nums text-muted-foreground">
                  {formatMoney(i.grossAmount, { cents: true })} gross
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${SOURCE_ACCENT[i.source]}`}
              >
                {INCOME_SOURCE_LABELS[i.source]}
              </span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(i)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 text-left font-medium">Date</th>
              <th className="py-2 pr-3 text-left font-medium">Source</th>
              <th className="py-2 pr-3 text-left font-medium">Type</th>
              <th className="py-2 pr-3 text-left font-medium">Frequency</th>
              <th className="py-2 pr-3 text-right font-medium">Gross</th>
              <th className="py-2 pr-3 text-right font-medium">Net</th>
              <th className="py-2 pl-3 text-right font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {incomes.map((i) => (
              <tr key={i.id} className="hover:bg-accent/40">
                <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                  {formatDate(i.date)}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="font-medium truncate max-w-[24ch]">
                    {i.sourceName}
                  </div>
                  {i.nextPayDate && (
                    <div className="text-xs text-muted-foreground">
                      Next: {formatDate(i.nextPayDate)}
                    </div>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${SOURCE_ACCENT[i.source]}`}
                  >
                    {INCOME_SOURCE_LABELS[i.source]}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {FREQUENCY_LABELS[i.frequency]}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                  {formatMoney(i.grossAmount, { cents: true })}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-[var(--success)]">
                  {formatMoney(i.netAmount, { cents: true })}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(i)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(i)}
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
