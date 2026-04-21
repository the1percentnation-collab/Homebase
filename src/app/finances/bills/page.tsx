import { CalendarClock } from "lucide-react";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export default function BillsPage() {
  return (
    <PlaceholderPage
      title="Bills & Subscriptions"
      description="Due dates, autopay status, renewal reminders, and a 'cancel this?' flag for unused subscriptions."
      icon={CalendarClock}
      taskNumber={8}
    />
  );
}
