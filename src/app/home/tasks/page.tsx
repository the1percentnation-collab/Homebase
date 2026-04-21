import { Suspense } from "react";
import { TasksPageClient } from "@/components/home/tasks-page-client";

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <TasksPageClient />
    </Suspense>
  );
}
