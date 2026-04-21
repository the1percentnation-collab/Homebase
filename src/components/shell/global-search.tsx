"use client";

import {
  CalendarClock,
  ListChecks,
  PiggyBank,
  Receipt,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  SEARCH_TYPE_LABEL,
  globalSearch,
  groupResults,
  type SearchResult,
  type SearchResultType,
} from "@/lib/search";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<SearchResultType, LucideIcon> = {
  expense: Receipt,
  task: ListChecks,
  bill: CalendarClock,
  budget: PiggyBank,
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Slash shortcut to focus, Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounced search.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      void globalSearch(query).then(setResults);
    }, 120);
    return () => clearTimeout(handle);
  }, [query]);

  const showPanel = open && query.trim().length > 0;
  const groups = groupResults(results);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search expenses, tasks, bills... (press / )"
          className="h-9 w-full rounded-md border border-border bg-muted/40 pl-8 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
          /
        </kbd>
      </label>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="py-1.5">
              {groups.map(({ type, items }) => {
                const Icon = TYPE_ICON[type];
                return (
                  <div key={type} className="py-1">
                    <div className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {SEARCH_TYPE_LABEL[type]}
                      <span className="ml-1 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <ul>
                      {items.map((r) => (
                        <li key={`${r.type}-${r.id}`}>
                          <Link
                            href={r.href}
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                            }}
                            className={cn(
                              "flex items-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {r.title}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {r.subtitle}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
