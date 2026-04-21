"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Receipt, ListChecks, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

type Action = {
  label: string;
  icon: typeof Receipt;
  onSelect: () => void;
};

export function QuickAddMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Handlers wire to real forms in later tasks; for now they just route.
  const actions: Action[] = [
    {
      label: "Expense",
      icon: Receipt,
      onSelect: () => {
        setOpen(false);
        window.location.href = "/finances/expenses?new=1";
      },
    },
    {
      label: "Task",
      icon: ListChecks,
      onSelect: () => {
        setOpen(false);
        window.location.href = "/home/tasks?new=1";
      },
    },
    {
      label: "Note",
      icon: StickyNote,
      onSelect: () => {
        setOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Quick add</span>
      </button>
      <div
        className={cn(
          "absolute right-0 mt-2 w-44 rounded-md border border-border bg-card shadow-lg py-1 z-50",
          open ? "block" : "hidden"
        )}
        role="menu"
      >
        {actions.map(({ label, icon: Icon, onSelect }) => (
          <button
            key={label}
            type="button"
            onClick={onSelect}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
