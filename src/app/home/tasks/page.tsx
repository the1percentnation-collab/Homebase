import { ListChecks } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function TasksPage() {
  return (
    <PlaceholderPage
      title="Home Tasks & Chores"
      description="One-time tasks and recurring chores with assignee, frequency, and due date."
      icon={ListChecks}
      taskNumber={9}
    />
  );
}
