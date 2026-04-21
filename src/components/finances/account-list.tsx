"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPE_LABELS } from "@/lib/enum-labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { Account } from "@/lib/schema";

type Props = {
  accounts: Account[];
  onEdit: (a: Account) => void;
  onDelete: (a: Account) => void;
  emptyText: string;
};

export function AccountList({ accounts, onEdit, onDelete, emptyText }: Props) {
  if (accounts.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {accounts.map((a) => (
        <li
          key={a.id}
          className="flex items-center justify-between gap-3 px-5 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                {ACCOUNT_TYPE_LABELS[a.type]}
              </span>
              {a.institution && <span>{a.institution}</span>}
              <span>·</span>
              <span>as of {formatDate(a.asOfDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={
                a.isAsset
                  ? "text-sm font-semibold tabular-nums text-[var(--success)]"
                  : "text-sm font-semibold tabular-nums text-[var(--destructive)]"
              }
            >
              {formatMoney(a.balance, { cents: true })}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => onEdit(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(a)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
