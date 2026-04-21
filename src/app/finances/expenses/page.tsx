import { Suspense } from "react";
import { ExpensesPageClient } from "@/components/finances/expenses-page-client";

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <ExpensesPageClient />
    </Suspense>
  );
}
