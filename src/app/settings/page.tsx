import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Toggle light and dark mode using the icon in the top bar. Your choice is
          remembered on this device.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium">Household</h2>
        <p className="text-sm text-muted-foreground">
          User profiles (you + your partner), roles, and shared-list permissions will
          live here. Coming alongside cloud sync.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium">Data</h2>
        <p className="text-sm text-muted-foreground">
          Export (CSV/JSON), import, and reset. Enabled once the first modules start
          writing data.
        </p>
      </section>
    </div>
  );
}
