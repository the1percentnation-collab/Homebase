"use client";

import { Menu } from "lucide-react";
import { GlobalSearch } from "./global-search";
import { QuickAddMenu } from "./quick-add-menu";
import { ThemeToggle } from "./theme-toggle";

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
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <QuickAddMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
