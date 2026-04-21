"use client";

import { AlertTriangle, CalendarClock, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { BillForm, type BillFormSubmit } from "./bill-form";
import { BillList } from "./bill-list";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { advanceDueDate } from "@/lib/bill-helpers";
import { DEFAULT_USER_ID } from "@/lib/constants";
import {
  addDaysIso,
  formatDate,
  formatMoney,
  todayIso,
} from "@/lib/format";
import type { Bill } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; bill: Bill };

type PaidDialogState =
  | { open: false }
  | { open: true; bill: Bill; logExpense: boolean };

export function BillsPageClient() {
  const { items, loading, refresh } = useCollection("bills");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [paidDialog, setPaidDialog] = useState<PaidDialogState>({ open: false });

  const summary = useMemo(() => {
    const today = todayIso();
    const in7 = addDaysIso(7);
    const in30 = addDaysIso(30);
    const overdue = items.filter((b) => b.dueDate < today);
    const next7 = items.filter((b) => b.dueDate >= today && b.dueDate <= in7);
    const next30 = items.filter((b) => b.dueDate >= today && b.dueDate <= in30);
    const flagged = items.filter((b) => b.cancelFlag);
    return {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, b) => s + b.amount, 0),
      next7Count: next7.length,
      next7Amount: next7.reduce((s, b) => s + b.amount, 0),
      next30Count: next30.length,
      next30Amount: next30.reduce((s, b) => s + b.amount, 0),
      flagged,
      flaggedMonthlyTotal: flagged
        .filter((b) => b.frequency === "monthly")
        .reduce((s, b) => s + b.amount, 0),
    };
  }, [items]);

  const handleCreate = useCallback(
    async (values: BillFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("bills", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: BillFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("bills", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (bill: Bill) => {
      if (!window.confirm(`Delete "${bill.name}"?`)) return;
      await getStorage().remove("bills", bill.id);
      await refresh();
    },
    [refresh]
  );

  const openMarkPaid = useCallback((bill: Bill) => {
    setPaidDialog({ open: true, bill, logExpense: true });
  }, []);

  const confirmMarkPaid = useCallback(async () => {
    if (!paidDialog.open) return;
    const { bill, logExpense } = paidDialog;
    const storage = getStorage();
    const today = todayIso();

    if (logExpense) {
      await storage.create("expenses", {
        userId: DEFAULT_USER_ID,
        amount: bill.amount,
        date: today,
        description: bill.name,
        category: bill.category,
        paymentMethod: bill.autopay ? "bank_transfer" : "credit_card",
        tag: "essential",
        labels: ["bill"],
        notes: `Payment for ${bill.name}`,
      });
    }

    const nextDue = advanceDueDate(bill.dueDate, bill.frequency);
    if (nextDue) {
      await storage.update("bills", bill.id, {
        dueDate: nextDue,
        lastPaidDate: today,
      });
    } else {
      // "once" bills don't recur — just mark paid and delete, or keep for record?
      // Keep it and only update lastPaidDate so the user has a record.
      await storage.update("bills", bill.id, { lastPaidDate: today });
    }

    setPaidDialog({ open: false });
    await refresh();
  }, [paidDialog, refresh]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bills &amp; subscriptions</h1>
            <p className="text-xs text-muted-foreground">
              Track due dates, autopay, renewals, and cancellable subscriptions.
            </p>
          </div>
        </div>
        <Button onClick={() => setMode({ kind: "new" })}>
          <Plus className="h-4 w-4" />
          New bill
        </Button>
      </header>

      {summary.flagged.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4">
          <AlertTriangle className="h-5 w-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {summary.flagged.length} subscription
              {summary.flagged.length === 1 ? "" : "s"} flagged for review
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cancelling would save roughly{" "}
              <span className="font-medium text-foreground">
                {formatMoney(summary.flaggedMonthlyTotal, { cents: true })}
              </span>{" "}
              per month ·{" "}
              {summary.flagged.map((b) => b.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard
          label="Overdue"
          value={String(summary.overdueCount)}
          sub={summary.overdueCount > 0 ? formatMoney(summary.overdueAmount) : undefined}
          tone={summary.overdueCount > 0 ? "danger" : "default"}
        />
        <TotalCard
          label="Due in 7 days"
          value={String(summary.next7Count)}
          sub={formatMoney(summary.next7Amount)}
        />
        <TotalCard
          label="Due in 30 days"
          value={String(summary.next30Count)}
          sub={formatMoney(summary.next30Amount)}
        />
        <TotalCard
          label="Flagged to cancel"
          value={String(summary.flagged.length)}
          sub={
            summary.flaggedMonthlyTotal > 0
              ? `${formatMoney(summary.flaggedMonthlyTotal)}/mo`
              : undefined
          }
          tone={summary.flagged.length > 0 ? "warning" : "default"}
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading bills…
        </p>
      ) : (
        <BillList
          bills={items}
          onEdit={(b) => setMode({ kind: "edit", bill: b })}
          onDelete={handleDelete}
          onMarkPaid={openMarkPaid}
        />
      )}

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit bill" : "New bill"}
        description={
          mode.kind === "edit"
            ? "Update the details below."
            : "Track a new bill or subscription."
        }
      >
        {mode.kind !== "closed" && (
          <BillForm
            defaultValues={mode.kind === "edit" ? mode.bill : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add bill"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.bill.id, values);
              } else {
                await handleCreate(values);
              }
            }}
          />
        )}
      </Drawer>

      <Dialog
        open={paidDialog.open}
        onClose={() => setPaidDialog({ open: false })}
        title="Mark bill as paid"
        description={
          paidDialog.open
            ? `"${paidDialog.bill.name}" — ${formatMoney(paidDialog.bill.amount, {
                cents: true,
              })}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaidDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={confirmMarkPaid}>Confirm</Button>
          </>
        }
      >
        {paidDialog.open && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              We&apos;ll update the last-paid date
              {advanceDueDate(paidDialog.bill.dueDate, paidDialog.bill.frequency)
                ? ` and advance the next due date to ${formatDate(
                    advanceDueDate(paidDialog.bill.dueDate, paidDialog.bill.frequency)
                  )}.`
                : "."}
            </p>
            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border"
                checked={paidDialog.logExpense}
                onChange={(e) =>
                  setPaidDialog((prev) =>
                    prev.open ? { ...prev, logExpense: e.target.checked } : prev
                  )
                }
              />
              <span>
                <span className="block text-sm font-medium">
                  Also log as expense
                </span>
                <span className="block text-xs text-muted-foreground">
                  Adds a {formatMoney(paidDialog.bill.amount, { cents: true })} entry
                  to expenses dated today.
                </span>
              </span>
            </label>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function TotalCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--destructive)]"
      : tone === "warning"
      ? "text-[var(--warning)]"
      : "";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
