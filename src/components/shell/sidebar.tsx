"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, X } from "lucide-react";
import { NAV_GROUPS } from "./nav-config";
import { cn } from "@/lib/utils";

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={onMobileClose}
        >
          <Home className="h-5 w-5" />
          <span>Homebase</span>
        </Link>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                const base =
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition";
                const linkCls = cn(
                  base,
                  active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                );

                if (item.comingSoon) {
                  return (
                    <li key={item.href}>
                      <span
                        className={cn(
                          base,
                          "cursor-not-allowed text-muted-foreground/60"
                        )}
                        title="Coming soon"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          soon
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={onMobileClose} className={linkCls}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        v0.1 · local storage
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        {content}
      </aside>

      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 transition",
          mobileOpen ? "visible" : "invisible"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onMobileClose}
        />
        <aside
          className={cn(
            "relative h-full w-72 max-w-[80%] bg-card border-r border-border transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
