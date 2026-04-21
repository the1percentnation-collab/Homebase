"use client";

import { Download, Plus, Wrench } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MaintenanceForm, type MaintenanceFormSubmit } from "./maintenance-form";
import { MaintenanceList } from "./maintenance-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { advanceDueDate } from "@/lib/bill-helpers";
import { exportCollectionCsv } from "@/lib/export";
import { addDaysIso, todayIso } from "@/lib/format";
import type { MaintenanceItem } from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; item: MaintenanceItem };

export function MaintenancePageClient() {
  const { items, loading, refresh } = useCollection("maintenanceItems");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    const today = todayIso();
    const in7 = addDaysIso(7);
    const in30 = addDaysIso(30);
    const overdue = items.filter((m) => m.nextDue < today);
    const week = items.filter(
      (m) => m.nextDue >= today && m.nextDue <= in7
    );
    const month = items.filter(
      (m) => m.nextDue >= today && m.nextDue <= in30
    );
    return {
      overdue: overdue.length,
      week: week.length,
      month: month.length,
      total: items.length,
    };
  }, [items]);

  const handleCreate = useCallback(
    async (values: MaintenanceFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("maintenanceItems", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: MaintenanceFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("maintenanceItems", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (item: MaintenanceItem) => {
      if (!window.confirm(`Delete "${item.title}"?`)) return;
      await getStorage().remove("maintenanceItems", item.id);
      await refresh();
    },
    [refresh]
  );

  const handleMarkDone = useCallback(
    async (item: MaintenanceItem) => {
      const today = todayIso();
      const next = advanceDueDate(item.nextDue, item.frequency);
      await getStorage().update("maintenanceItems", item.id, {
        lastDone: today,
        nextDue: next ?? item.nextDue,
      });
      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Maintenance
            </h1>
            <p className="text-xs text-muted-foreground">
              HVAC filters, gutters, smoke detectors, seasonal tasks — all set
              and forgotten.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("maintenanceItems")}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setMode({ kind: "new" })}>
            <Plus className="h-4 w-4" />
            New item
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard
          label="Overdue"
          value={String(summary.overdue)}
          tone={summary.overdue > 0 ? "danger" : "default"}
        />
        <TotalCard label="Due in 7 days" value={String(summary.week)} />
        <TotalCard label="Due in 30 days" value={String(summary.month)} />
        <TotalCard label="Tracked" value={String(summary.total)} />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading maintenance…
        </p>
      ) : (
        <MaintenanceList
          items={items}
          onEdit={(m) => setMode({ kind: "edit", item: m })}
          onDelete={handleDelete}
          onMarkDone={handleMarkDone}
        />
      )}

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit maintenance item" : "New maintenance item"}
        description={
          mode.kind === "edit"
            ? "Update the schedule or assignee."
            : "Set a recurring home chore that you'd rather not remember."
        }
      >
        {mode.kind !== "closed" && (
          <MaintenanceForm
            defaultValues={mode.kind === "edit" ? mode.item : undefined}
            submitting={submitting}
            submitLabel={mode.kind === "edit" ? "Save changes" : "Add item"}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={async (values) => {
              if (mode.kind === "edit") {
                await handleUpdate(mode.item.id, values);
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
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  const toneClass = tone === "danger" ? "text-[var(--destructive)]" : "";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
