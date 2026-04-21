"use client";

import {
  ExternalLink,
  Package,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  INVENTORY_CATEGORY_ACCENT,
  INVENTORY_CATEGORY_LABELS,
} from "@/lib/enum-labels";
import { formatDate, formatMoney, todayIso } from "@/lib/format";
import type { InventoryItem } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  items: InventoryItem[];
  onEdit: (i: InventoryItem) => void;
  onDelete: (i: InventoryItem) => void;
};

export function InventoryList({ items, onEdit, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No inventory tracked"
        description="Add major appliances, electronics, and furniture with warranties and serial numbers."
      />
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="md:hidden divide-y divide-border">
        {items.map((i) => (
          <li key={i.id} className="py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {i.location ?? "—"}
                  {i.serialNumber && ` · SN ${i.serialNumber}`}
                </p>
              </div>
              <div className="text-right">
                {i.purchasePrice != null && (
                  <div className="text-sm font-semibold tabular-nums">
                    {formatMoney(i.purchasePrice)}
                  </div>
                )}
                {i.purchaseDate && (
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(i.purchaseDate)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                    INVENTORY_CATEGORY_ACCENT[i.category]
                  )}
                >
                  {INVENTORY_CATEGORY_LABELS[i.category]}
                </span>
                <WarrantyChip expiry={i.warrantyExpiry} />
              </div>
              <div className="flex gap-1">
                {i.receiptUrl && (
                  <a
                    href={i.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    aria-label="Open receipt"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
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

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 text-left font-medium">Item</th>
              <th className="py-2 pr-3 text-left font-medium">Category</th>
              <th className="py-2 pr-3 text-left font-medium">Location</th>
              <th className="py-2 pr-3 text-left font-medium">Warranty</th>
              <th className="py-2 pr-3 text-right font-medium">Price</th>
              <th className="py-2 pl-3 text-right font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-accent/40">
                <td className="py-2.5 pr-3">
                  <div className="font-medium truncate max-w-[22ch]">
                    {i.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[22ch]">
                    {i.serialNumber ? `SN ${i.serialNumber}` : ""}
                    {i.purchaseDate
                      ? `${i.serialNumber ? " · " : ""}Bought ${formatDate(i.purchaseDate)}`
                      : ""}
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
                      INVENTORY_CATEGORY_ACCENT[i.category]
                    )}
                  >
                    {INVENTORY_CATEGORY_LABELS[i.category]}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {i.location ?? "—"}
                </td>
                <td className="py-2.5 pr-3">
                  <WarrantyChip expiry={i.warrantyExpiry} />
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                  {i.purchasePrice != null
                    ? formatMoney(i.purchasePrice)
                    : "—"}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <div className="inline-flex gap-1">
                    {i.receiptUrl && (
                      <a
                        href={i.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                        aria-label="Open receipt"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
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

function WarrantyChip({ expiry }: { expiry?: string }) {
  if (!expiry) {
    return (
      <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
        —
      </span>
    );
  }
  const today = todayIso();
  const expired = expiry < today;
  const classes = expired
    ? "bg-muted text-muted-foreground"
    : "bg-[var(--success)]/10 text-[var(--success)]";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5",
        classes
      )}
      title={expired ? `Expired ${formatDate(expiry)}` : `Until ${formatDate(expiry)}`}
    >
      {expired ? (
        <ShieldAlert className="h-3 w-3" />
      ) : (
        <ShieldCheck className="h-3 w-3" />
      )}
      {expired ? "Expired" : formatDate(expiry, "MMM yyyy")}
    </span>
  );
}
