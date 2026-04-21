"use client";

import {
  AlertTriangle,
  Download,
  Package,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { InventoryForm, type InventoryFormSubmit } from "./inventory-form";
import { InventoryList } from "./inventory-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INVENTORY_CATEGORY_LABELS } from "@/lib/enum-labels";
import { exportCollectionCsv } from "@/lib/export";
import { addDaysIso, formatDate, formatMoney, todayIso } from "@/lib/format";
import {
  INVENTORY_CATEGORIES,
  type InventoryItem,
} from "@/lib/schema";
import { getStorage } from "@/lib/storage";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

type Mode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; item: InventoryItem };

type WarrantyFilter = "all" | "active" | "expiring" | "expired" | "none";

export function InventoryPageClient() {
  const { items, loading, refresh } = useCollection("inventoryItems");
  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] =
    useState<WarrantyFilter>("all");

  const today = todayIso();
  const soon = addDaysIso(60);

  const summary = useMemo(() => {
    const totalValue = items.reduce(
      (s, i) => s + (i.purchasePrice ?? 0),
      0
    );
    const expiringSoon = items.filter(
      (i) =>
        i.warrantyExpiry &&
        i.warrantyExpiry >= today &&
        i.warrantyExpiry <= soon
    );
    const expired = items.filter(
      (i) => i.warrantyExpiry && i.warrantyExpiry < today
    );
    const withoutWarranty = items.filter((i) => !i.warrantyExpiry);
    return {
      count: items.length,
      totalValue,
      expiringSoon,
      expired: expired.length,
      withoutWarranty: withoutWarranty.length,
    };
  }, [items, today, soon]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => {
        if (categoryFilter !== "all" && i.category !== categoryFilter)
          return false;
        if (warrantyFilter !== "all") {
          const exp = i.warrantyExpiry;
          if (warrantyFilter === "none" && exp) return false;
          if (warrantyFilter === "expired" && (!exp || exp >= today))
            return false;
          if (
            warrantyFilter === "expiring" &&
            (!exp || exp < today || exp > soon)
          )
            return false;
          if (warrantyFilter === "active" && (!exp || exp < today))
            return false;
        }
        if (!q) return true;
        return (
          i.name.toLowerCase().includes(q) ||
          (i.notes ?? "").toLowerCase().includes(q) ||
          (i.serialNumber ?? "").toLowerCase().includes(q) ||
          (i.location ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search, categoryFilter, warrantyFilter, today, soon]);

  const handleCreate = useCallback(
    async (values: InventoryFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().create("inventoryItems", values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, values: InventoryFormSubmit) => {
      setSubmitting(true);
      try {
        await getStorage().update("inventoryItems", id, values);
        await refresh();
        setMode({ kind: "closed" });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (item: InventoryItem) => {
      if (!window.confirm(`Delete "${item.name}"?`)) return;
      await getStorage().remove("inventoryItems", item.id);
      await refresh();
    },
    [refresh]
  );

  const hasAnyFilter =
    search !== "" || categoryFilter !== "all" || warrantyFilter !== "all";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Home inventory
            </h1>
            <p className="text-xs text-muted-foreground">
              Appliances, electronics, furniture — serial numbers, warranties,
              and receipts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCollectionCsv("inventoryItems")}
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

      {summary.expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4">
          <AlertTriangle className="h-5 w-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {summary.expiringSoon.length} warrant
              {summary.expiringSoon.length === 1 ? "y" : "ies"} expiring in the
              next 60 days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.expiringSoon
                .slice(0, 4)
                .map((i) => `${i.name} (${formatDate(i.warrantyExpiry!, "MMM d")})`)
                .join(", ")}
              {summary.expiringSoon.length > 4 ? ", …" : ""}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TotalCard label="Items tracked" value={String(summary.count)} />
        <TotalCard
          label="Total value"
          value={formatMoney(summary.totalValue)}
          sub="Sum of purchase prices"
        />
        <TotalCard
          label="Warranty expiring"
          value={String(summary.expiringSoon.length)}
          sub="Next 60 days"
          tone={summary.expiringSoon.length > 0 ? "warning" : "default"}
        />
        <TotalCard
          label="Without warranty info"
          value={String(summary.withoutWarranty)}
          sub={
            summary.expired > 0
              ? `${summary.expired} expired tracked`
              : undefined
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, serial, location..."
              className="pl-8"
            />
          </label>
          <div className="sm:w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {INVENTORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {INVENTORY_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-44">
            <Select
              value={warrantyFilter}
              onChange={(e) =>
                setWarrantyFilter(e.target.value as WarrantyFilter)
              }
            >
              <option value="all">Any warranty</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring (60d)</option>
              <option value="expired">Expired</option>
              <option value="none">Not tracked</option>
            </Select>
          </div>
        </div>

        {hasAnyFilter && (
          <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {summary.count}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setWarrantyFilter("all");
              }}
              className="hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="px-4 pb-2 pt-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading inventory…
            </p>
          ) : (
            <InventoryList
              items={filtered}
              onEdit={(item) => setMode({ kind: "edit", item })}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <Drawer
        open={mode.kind !== "closed"}
        onClose={() => setMode({ kind: "closed" })}
        title={mode.kind === "edit" ? "Edit item" : "New item"}
        description={
          mode.kind === "edit"
            ? "Update purchase, warranty, or serial."
            : "Log a major appliance, electronic, or asset worth tracking."
        }
      >
        {mode.kind !== "closed" && (
          <InventoryForm
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
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight",
          tone === "warning" && "text-[var(--warning)]"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {sub}
          {tone === "warning" && <ShieldCheck className="inline h-3 w-3 ml-1" />}
        </p>
      )}
    </div>
  );
}
