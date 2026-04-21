"use client";

import { CheckCircle2, Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  bucketFor,
  type Bucket,
} from "@/lib/bill-helpers";
import { getAssignee } from "@/lib/constants";
import {
  FREQUENCY_LABELS,
  MAINTENANCE_CATEGORY_ACCENT,
  MAINTENANCE_CATEGORY_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatRelative } from "@/lib/format";
import type { MaintenanceItem } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  items: MaintenanceItem[];
  onEdit: (m: MaintenanceItem) => void;
  onDelete: (m: MaintenanceItem) => void;
  onMarkDone: (m: MaintenanceItem) => void;
};

export function MaintenanceList({ items, onEdit, onDelete, onMarkDone }: Props) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No maintenance scheduled"
        description="Add HVAC filters, gutters, smoke detectors, and seasonal tasks so nothing slips."
      />
    );
  }

  const groups: Record<Bucket, MaintenanceItem[]> = {
    overdue: [],
    thisWeek: [],
    thisMonth: [],
    later: [],
  };
  for (const m of items) {
    groups[bucketFor(m.nextDue)].push(m);
  }
  for (const k of BUCKET_ORDER) {
    groups[k].sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  }

  return (
    <div className="space-y-6">
      {BUCKET_ORDER.map((bucket) => {
        const list = groups[bucket];
        if (list.length === 0) return null;
        return (
          <Group
            key={bucket}
            bucket={bucket}
            items={list}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkDone={onMarkDone}
          />
        );
      })}
    </div>
  );
}

function Group({
  bucket,
  items,
  onEdit,
  onDelete,
  onMarkDone,
}: {
  bucket: Bucket;
  items: MaintenanceItem[];
  onEdit: (m: MaintenanceItem) => void;
  onDelete: (m: MaintenanceItem) => void;
  onMarkDone: (m: MaintenanceItem) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
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
          {items.length}
        </span>
      </header>
      <ul className="divide-y divide-border">
        {items.map((m) => (
          <Row
            key={m.id}
            item={m}
            overdue={bucket === "overdue"}
            onEdit={() => onEdit(m)}
            onDelete={() => onDelete(m)}
            onMarkDone={() => onMarkDone(m)}
          />
        ))}
      </ul>
    </section>
  );
}

function Row({
  item,
  overdue,
  onEdit,
  onDelete,
  onMarkDone,
}: {
  item: MaintenanceItem;
  overdue: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
}) {
  const assignee = getAssignee(item.assigneeId);
  return (
    <li className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
              MAINTENANCE_CATEGORY_ACCENT[item.category]
            )}
          >
            {MAINTENANCE_CATEGORY_LABELS[item.category]}
          </span>
          <span>{FREQUENCY_LABELS[item.frequency]}</span>
          <span>·</span>
          <span className={overdue ? "text-[var(--destructive)]" : ""}>
            Due {formatDate(item.nextDue)} ({formatRelative(item.nextDue)})
          </span>
          {item.lastDone && (
            <>
              <span>·</span>
              <span>Last done {formatDate(item.lastDone)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {assignee ? (
          <span
            title={assignee.label}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white",
              assignee.color
            )}
          >
            {assignee.initials}
          </span>
        ) : null}
        <Button size="sm" variant="outline" onClick={onMarkDone}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done
        </Button>
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
