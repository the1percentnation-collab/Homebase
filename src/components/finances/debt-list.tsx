"use client";

import {
  AlertTriangle,
  CreditCard,
  Minus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DebtPayoff } from "@/lib/debt-helpers";
import { DEBT_TYPE_LABELS } from "@/lib/enum-labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { Debt } from "@/lib/schema";

type Props = {
  payoffs: DebtPayoff[];
  onEdit: (d: Debt) => void;
  onDelete: (d: Debt) => void;
  onRecordPayment: (d: Debt) => void;
};

export function DebtList({ payoffs, onEdit, onDelete, onRecordPayment }: Props) {
  if (payoffs.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No debts tracked"
        description="Add credit cards, loans, or anything else you're paying off to see your payoff timeline."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {payoffs.map((p, idx) => (
        <DebtCard
          key={p.debt.id}
          payoff={p}
          priority={idx === 0}
          onEdit={() => onEdit(p.debt)}
          onDelete={() => onDelete(p.debt)}
          onRecordPayment={() => onRecordPayment(p.debt)}
        />
      ))}
    </div>
  );
}

function DebtCard({
  payoff,
  priority,
  onEdit,
  onDelete,
  onRecordPayment,
}: {
  payoff: DebtPayoff;
  priority: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRecordPayment: () => void;
}) {
  const {
    debt,
    months,
    payoffDate,
    totalInterest,
    paidOffPercent,
    neverPaysOff,
  } = payoff;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{debt.name}</p>
            {priority && (
              <span className="text-[10px] uppercase tracking-wide rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                Next
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {DEBT_TYPE_LABELS[debt.type]}
            </span>
            <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {debt.interestRate.toFixed(2)}% APR
            </span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={onRecordPayment} title="Record payment">
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-semibold tabular-nums">
          {formatMoney(debt.balance, { cents: true })}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatMoney(debt.minPayment, { cents: true })}/mo min
        </div>
      </div>

      {paidOffPercent != null && debt.originalBalance && (
        <>
          <ProgressBar
            value={debt.originalBalance - debt.balance}
            max={debt.originalBalance}
            tone="success"
          />
          <p className="text-[11px] text-muted-foreground">
            {Math.round(paidOffPercent)}% paid off ·{" "}
            {formatMoney(debt.originalBalance, { cents: true })} original
          </p>
        </>
      )}

      <div className="border-t border-border pt-2 text-[11px] text-muted-foreground space-y-0.5">
        {neverPaysOff ? (
          <p className="flex items-center gap-1 text-[var(--destructive)]">
            <AlertTriangle className="h-3 w-3" />
            Minimum doesn&apos;t cover monthly interest — balance will grow.
          </p>
        ) : (
          <>
            <p>
              {months} month{months === 1 ? "" : "s"} at minimum · paid off{" "}
              {payoffDate ? formatDate(payoffDate) : "—"}
            </p>
            <p>
              {formatMoney(totalInterest, { cents: true })} interest over that
              period
            </p>
          </>
        )}
        {debt.payoffDate && (
          <p>Target: {formatDate(debt.payoffDate)}</p>
        )}
      </div>
    </div>
  );
}
