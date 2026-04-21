"use client";

import Link from "next/link";
import { Receipt, ListChecks, StickyNote } from "lucide-react";

const actions = [
  {
    label: "Log expense",
    href: "/finances/expenses?new=1",
    icon: Receipt,
  },
  {
    label: "Add task",
    href: "/home/tasks?new=1",
    icon: ListChecks,
  },
  {
    label: "Quick note",
    href: "#",
    icon: StickyNote,
  },
];

export function QuickAddRow() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="group flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 transition hover:border-foreground/30 hover:bg-accent"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}
