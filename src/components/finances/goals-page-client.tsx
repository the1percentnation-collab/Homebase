"use client";

import { Download, Plus, Target } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { GoalForm, type GoalFormSubmit } from "./goal-form";
import { GoalList } from "./goal-list";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { exportCollectionCsv } from "@/lib/export";
import { formatMoney } from "@/lib/format";
import { computeGoalStatus } from "@/lib/goal-helpers";
import type { Goal } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; goal: Goal };

type ContributeState =
  | { open: false }
  | { open: true; goal: Goal; amount: string };

export function GoalsPageClient() {
  const { items, loading, refresh } = useCollection("goals");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [contribute, setContribute] = useState<ContributeState>({ open: false });

  const statuses = useMemo(
    () => items.map((g) => computeGoalStatus(g)),
    [items]
  );

  const summary = useMemo(() => {
    const totalTarget = items.reduce((s, g) => s + g.targetAmount, 0);
    const totalCurrent = items.reduce((s, g) => s + g.currentAmount, 0);
    const avgPct =
      items.length > 0
        ? items.reduce(
            (s, g) =>
              s + (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0),
            0
          ) /
          items.length *
          100
        : 0;
    const pctOverall = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return {
      totalTarget,
      totalCurrent,
      avgPct,
      pctOverall,
      count: items.length,
    };
  }, [items]);

  const handleCreate = useCallback(
    async (values: GoalFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("goals", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: GoalFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("goals", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (goal: Goal) => {
      if (!window.confirm(`Delete "${goal.name}"?`)) return;
      await getStorage().remove("goals", goal.id);
      await refresh();
    },
    [refresh]
  );

  const handleContribute = useCallback(async () => {
    if (!contribute.open) return;
    const amount = parseFloat(contribute.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const next = Math.min(
      contribute.goal.targetAmount,
      contribute.goal.currentAmount + amount
    );
    await getStorage().update("goals", contribute.goal.id, {
      currentAmount: next,
    });
    setContribute({ open: false });
    await refresh();
  }, [contribute, refresh]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financial goals</h1>
            <p className="text-xs text-muted-foreground">
              Short, mid, and long-term savings goals — with the math done for
              you.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("goals")}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        </div>
      </header>

      {summary.count > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Across all goals</p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(summary.totalCurrent, { cents: true })}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  of {formatMoney(summary.totalTarget, { cents: true })}
                </span>
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.count} goal{summary.count === 1 ? "" : "s"} ·{" "}
              {Math.round(summary.avgPct)}% average
            </div>
          </div>
          <ProgressBar value={summary.totalCurrent} max={summary.totalTarget || 1} />
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading goals…
        </p>
      ) : (
        <GoalList
          statuses={statuses}
          onEdit={(g) => setMode({ kind: "edit", goal: g })}
          onDelete={handleDelete}
          onContribute={(g) =>
            setContribute({ open: true, goal: g, amount: "" })
          }
        />
      )}

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit goal" : "New goal"}
        description={
          mode.kind === "edit"
            ? "Update the details below."
            : "Define what you're saving for and we'll work out the monthly pace."
        }
      >
        {mode.kind !== "closed" && (
          <GoalForm
            defaultValues={mode.kind === "edit" ? mode.goal : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Create goal"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.goal.id, values);
              } else {
                await handleCreate(values);
              }
            }}
          />
        )}
      </Drawer>

      <Dialog
        open={contribute.open}
        onClose={() => setContribute({ open: false })}
        title="Add contribution"
        description={
          contribute.open
            ? `"${contribute.goal.name}" — currently ${formatMoney(contribute.goal.currentAmount, { cents: true })} of ${formatMoney(contribute.goal.targetAmount, { cents: true })}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setContribute({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleContribute}>Add</Button>
          </>
        }
      >
        {contribute.open && (
          <FormField label="Amount" htmlFor="contribute-amount" required>
            <Input
              id="contribute-amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={contribute.amount}
              onChange={(e) =>
                setContribute((prev) =>
                  prev.open ? { ...prev, amount: e.target.value } : prev
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleContribute();
                }
              }}
            />
          </FormField>
        )}
      </Dialog>
    </div>
  );
}
