import { Receipt } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function ExpensesPage() {
  return (
    <PlaceholderPage
      title="Expenses"
      description="Log expenses by category, date, payment method, and essential/discretionary tag. Recurring entries supported."
      icon={Receipt}
      taskNumber={6}
    />
  );
}
