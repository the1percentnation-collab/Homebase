"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCollection } from "@/lib/use-collection";
import { addDaysIso, formatDate, formatMoney, todayIso } from "@/lib/format";

export function UpcomingBills() {
  const { items, loading } = useCollection("bills");
  const today = todayIso();
  const in30 = addDaysIso(30);

  const upcoming = items
    .filter((b) => b.dueDate >= today && b.dueDate <= in30)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader
        title="Upcoming bills"
        description="Next 30 days"
        action={
          <Link
            href="/finances/bills"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />
      {!loading && upcoming.length === 0 ? (
        <CardBody className="p-0">
          <EmptyState
            icon={CalendarClock}
            title="No bills scheduled"
            description="Add bills to get reminders before they're due."
          />
        </CardBody>
      ) : (
        <ul className="divide-y divide-border">
          {upcoming.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(b.dueDate)}
                  {b.autopay && " · autopay"}
                </p>
              </div>
              <div className="text-sm font-medium tabular-nums">
                {formatMoney(b.amount, { cents: true })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
