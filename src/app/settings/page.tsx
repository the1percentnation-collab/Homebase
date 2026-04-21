import { Settings } from "lucide-react";
import { AccountPanel } from "@/components/settings/account-panel";
import { DataPanel } from "@/components/settings/data-panel";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <AccountPanel />

      <section className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Toggle light and dark mode using the icon in the top bar. Your choice
          is remembered on this device.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold">Household</h2>
        <p className="text-sm text-muted-foreground">
          Household membership and invite codes land alongside the cloud
          schema (Task 21).
        </p>
      </section>

      <DataPanel />
    </div>
  );
}
