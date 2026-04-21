"use client";

import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  gatherNotifications,
  groupNotifications,
  NOTIFICATION_GROUP_LABEL,
  type Notification,
  type NotificationSeverity,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  info: "bg-muted-foreground/50",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--destructive)]",
};

const RELOAD_INTERVAL_MS = 30_000;

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next = await gatherNotifications();
      if (!cancelled) {
        setItems(next);
        setLoaded(true);
      }
    }
    void load();
    const handle = setInterval(load, RELOAD_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  // Refresh when the menu opens so it reflects the latest writes.
  useEffect(() => {
    if (!open) return;
    void gatherNotifications().then(setItems);
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const count = items.length;
  const countLabel = count > 9 ? "9+" : String(count);
  const groups = groupNotifications(items);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${count > 0 ? ` (${count})` : ""}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {loaded && count > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--destructive)] px-1 text-[9px] font-semibold text-white">
            {countLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <span className="text-xs text-muted-foreground">
              {count} item{count === 1 ? "" : "s"}
            </span>
          </div>

          {!loaded ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : count === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <BellOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All clear</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                No bills, tasks, or goals need attention right now.
              </p>
            </div>
          ) : (
            <div className="py-1.5">
              {groups.map(({ type, items: list }) => (
                <div key={type} className="py-1">
                  <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {NOTIFICATION_GROUP_LABEL[type]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {list.length}
                    </span>
                  </div>
                  <ul>
                    {list.map((n) => (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                        >
                          <span
                            className={cn(
                              "mt-1 h-2 w-2 shrink-0 rounded-full",
                              SEVERITY_DOT[n.severity]
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{n.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {n.detail}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
