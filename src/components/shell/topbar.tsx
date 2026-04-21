"use client";

import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { QuickAddMenu } from "./quick-add-menu";

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-3 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 max-w-xl">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search expenses, tasks, contacts..."
            disabled
            className="h-9 w-full rounded-md border border-border bg-muted/40 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <QuickAddMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
