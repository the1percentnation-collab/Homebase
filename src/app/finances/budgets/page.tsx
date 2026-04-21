import { PiggyBank } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function BudgetsPage() {
  return (
    <PlaceholderPage
      title="Budgets"
      description="Monthly/weekly budgets per category with progress bars, threshold alerts, and rollover."
      icon={PiggyBank}
      taskNumber={7}
    />
  );
}
