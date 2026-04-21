"use client";

import { CalendarClock, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  groupBills,
  type Bucket,
} from "@/lib/bill-helpers";
import {
  EXPENSE_CATEGORY_ACCENT,
  EXPENSE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import type { Bill } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  bills: Bill[];
  onEdit: (b: Bill) => void;
  onDelete: (b: Bill) => void;
  onMarkPaid: (b: Bill) => void;
};

export function BillList({ bills, onEdit, onDelete, onMarkPaid }: Props) {
  if (bills.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No bills tracked"
        description="Add your recurring bills and subscriptions to get reminders before they hit."
      />
    );
  }

  const groups = groupBills(bills);

  return (
    <div className="space-y-6">
      {BUCKET_ORDER.map((bucket) => {
        const list = groups[bucket];
        if (list.length === 0) return null;
        return (
          <BillGroup
            key={bucket}
            bucket={bucket}
            bills={list}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkPaid={onMarkPaid}
          />
        );
      })}
    </div>
  );
}

function BillGroup({
  bucket,
  bills,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  bucket: Bucket;
  bills: Bill[];
  onEdit: (b: Bill) => void;
  onDelete: (b: Bill) => void;
  onMarkPaid: (b: Bill) => void;
}) {
  const total = bills.reduce((sum, b) => sum + b.amount, 0);
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">
            {BUCKET_LABELS[bucket]}
          </h2>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
              bucket === "overdue"
                ? "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                : "bg-muted text-muted-foreground"
            )}
          >
            {bills.length}
          </span>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatMoney(total, { cents: true })}
        </div>
      </header>
      <ul className="divide-y divide-border">
        {bills.map((b) => (
          <BillRow
            key={b.id}
            bill={b}
            onEdit={() => onEdit(b)}
            onDelete={() => onDelete(b)}
            onMarkPaid={() => onMarkPaid(b)}
            overdue={bucket === "overdue"}
          />
        ))}
      </ul>
    </section>
  );
}

function BillRow({
  bill,
  onEdit,
  onDelete,
  onMarkPaid,
  overdue,
}: {
  bill: Bill;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  overdue: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{bill.name}</p>
          {bill.autopay && (
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              Autopay
            </span>
          )}
          {bill.cancelFlag && (
            <span className="text-[10px] uppercase tracking-wide rounded bg-[var(--warning)]/10 px-1.5 py-0.5 text-[var(--warning)]">
              Review
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
              EXPENSE_CATEGORY_ACCENT[bill.category]
            )}
          >
            {EXPENSE_CATEGORY_LABELS[bill.category]}
          </span>
          <span>{FREQUENCY_LABELS[bill.frequency]}</span>
          <span>·</span>
          <span className={overdue ? "text-[var(--destructive)]" : ""}>
            {formatDate(bill.dueDate)} ({formatRelative(bill.dueDate)})
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="text-sm font-semibold tabular-nums">
          {formatMoney(bill.amount, { cents: true })}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onMarkPaid}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
