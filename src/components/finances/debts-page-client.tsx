"use client";

import {
  AlertTriangle,
  CreditCard,
  Download,
  Plus,
  Snowflake,
  TrendingDown,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DebtForm, type DebtFormSubmit } from "./debt-form";
import { DebtList } from "./debt-list";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  computeDebtPayoff,
  sortByStrategy,
  summarize,
  type PayoffStrategy,
} from "@/lib/debt-helpers";
import { exportCollectionCsv } from "@/lib/export";
import { formatDate, formatMoney } from "@/lib/format";
import type { Debt } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; debt: Debt };

type PaymentState =
  | { open: false }
  | { open: true; debt: Debt; amount: string };

export function DebtsPageClient() {
  const { items, loading, refresh } = useCollection("debts");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const [payment, setPayment] = useState<PaymentState>({ open: false });

  const payoffs = useMemo(
    () => items.map((d) => computeDebtPayoff(d)),
    [items]
  );
  const sorted = useMemo(
    () => sortByStrategy(payoffs, strategy),
    [payoffs, strategy]
  );
  const summary = useMemo(() => summarize(items, payoffs), [items, payoffs]);

  const handleCreate = useCallback(
    async (values: DebtFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("debts", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: DebtFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("debts", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (debt: Debt) => {
      if (!window.confirm(`Delete "${debt.name}"?`)) return;
      await getStorage().remove("debts", debt.id);
      await refresh();
    },
    [refresh]
  );

  const handleRecordPayment = useCallback(async () => {
    if (!payment.open) return;
    const amount = parseFloat(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const next = Math.max(0, payment.debt.balance - amount);
    const original =
      payment.debt.originalBalance ??
      Math.max(payment.debt.balance, amount + next);
    await getStorage().update("debts", payment.debt.id, {
      balance: next,
      originalBalance: original,
    });
    setPayment({ open: false });
    await refresh();
  }, [payment, refresh]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Debt</h1>
            <p className="text-xs text-muted-foreground">
              Balances, interest rates, and payoff timeline. Switch between
              snowball and avalanche.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("debts")}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New debt
          </Button>
        </div>
      </header>

      {summary.anyNeverPaysOff && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-4">
          <AlertTriangle className="h-5 w-5 text-[var(--destructive)] shrink-0 mt-0.5" />
          <p className="text-sm">
            One or more debts have a minimum payment below their monthly
            interest. At the current minimum, those balances grow — raise the
            payment to start paying them down.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TotalCard
            label="Total balance"
            value={formatMoney(summary.totalBalance, { cents: true })}
            sub={
              summary.overallPaidOffPercent != null
                ? `${Math.round(summary.overallPaidOffPercent)}% paid off`
                : undefined
            }
          />
          <TotalCard
            label="Weighted APR"
            value={`${summary.weightedApr.toFixed(2)}%`}
            sub={`${items.length} debt${items.length === 1 ? "" : "s"}`}
          />
          <TotalCard
            label="Total minimums"
            value={formatMoney(summary.totalMin, { cents: true })}
            sub="per month"
          />
          <TotalCard
            label="Debt-free date"
            value={
              summary.debtFreeDate
                ? formatDate(summary.debtFreeDate)
                : "—"
            }
            sub={
              summary.debtFreeDate
                ? `${summary.longestMonths} month${
                    summary.longestMonths === 1 ? "" : "s"
                  } at minimums`
                : summary.anyNeverPaysOff
                ? "Never at current minimums"
                : undefined
            }
          />
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2">
          <span className="text-xs text-muted-foreground">Order by</span>
          <div className="inline-flex rounded-md border border-border p-1">
            <StrategyButton
              active={strategy === "avalanche"}
              onClick={() => setStrategy("avalanche")}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Avalanche
              <span className="text-[10px] text-muted-foreground">
                (highest APR)
              </span>
            </StrategyButton>
            <StrategyButton
              active={strategy === "snowball"}
              onClick={() => setStrategy("snowball")}
            >
              <Snowflake className="h-3.5 w-3.5" />
              Snowball
              <span className="text-[10px] text-muted-foreground">
                (smallest balance)
              </span>
            </StrategyButton>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading debts…
        </p>
      ) : (
        <DebtList
          payoffs={sorted}
          onEdit={(d) => setMode({ kind: "edit", debt: d })}
          onDelete={handleDelete}
          onRecordPayment={(d) =>
            setPayment({ open: true, debt: d, amount: "" })
          }
        />
      )}

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit debt" : "New debt"}
        description={
          mode.kind === "edit"
            ? "Update balance, APR, or minimum payment."
            : "Track a credit card, loan, or anything else you're paying off."
        }
      >
        {mode.kind !== "closed" && (
          <DebtForm
            defaultValues={mode.kind === "edit" ? mode.debt : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add debt"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.debt.id, values);
              } else {
                await handleCreate(values);
              }
            }}
          />
        )}
      </Drawer>

      <Dialog
        open={payment.open}
        onClose={() => setPayment({ open: false })}
        title="Record payment"
        description={
          payment.open
            ? `"${payment.debt.name}" — current balance ${formatMoney(payment.debt.balance, { cents: true })}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayment({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record</Button>
          </>
        }
      >
        {payment.open && (
          <FormField
            label="Payment amount"
            htmlFor="payment-amount"
            required
            hint="Deducted from the current balance."
          >
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={payment.amount}
              onChange={(e) =>
                setPayment((prev) =>
                  prev.open ? { ...prev, amount: e.target.value } : prev
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleRecordPayment();
                }
              }}
            />
          </FormField>
        )}
      </Dialog>
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

function StrategyButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
