"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCollection } from "@/lib/use-collection";
import { formatDate, formatRelative } from "@/lib/format";

export function UpcomingEvents() {
  const { items, loading } = useCollection("familyEvents");

  const nowIso = new Date().toISOString();
  const events = items
    .filter((e) => e.start >= nowIso)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Next up on the calendar"
        description="Next 5 family events"
        action={
          <Link
            href="/family/calendar"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />
      {!loading && events.length === 0 ? (
        <CardBody className="p-0">
          <EmptyState
            icon={CalendarDays}
            title="Calendar is empty"
            description="Shared events, appointments, birthdays, and school activities will appear here."
          />
        </CardBody>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.start, "EEE, MMM d")}
                  {!e.allDay && ` · ${formatDate(e.start, "p")}`}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatRelative(e.start)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
