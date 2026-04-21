import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function DashboardHome() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="KPI cards, upcoming bills, overdue tasks, goal progress, and a calendar preview will live here."
      icon={LayoutDashboard}
      taskNumber={5}
    />
  );
}
