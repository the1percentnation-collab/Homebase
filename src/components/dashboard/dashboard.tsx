"use client";

import { KpiRow } from "./kpi-row";
import { OverdueTasks } from "./overdue-tasks";
import { QuickAddRow } from "./quick-add-row";
import { UpcomingBills } from "./upcoming-bills";
import { UpcomingEvents } from "./upcoming-events";
import { UpcomingGoals } from "./upcoming-goals";

export function Dashboard() {
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {greeting}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome home.</h1>
        <p className="text-sm text-muted-foreground">
          Everything you need to run the house and the finances, in one place.
        </p>
      </header>

      <QuickAddRow />
      <KpiRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingBills />
        <OverdueTasks />
        <UpcomingGoals />
        <UpcomingEvents />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
