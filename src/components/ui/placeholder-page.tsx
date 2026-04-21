import type { LucideIcon } from "lucide-react";

type PlaceholderPageProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  taskNumber?: number;
};

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  taskNumber,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        {Icon && (
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        {taskNumber !== undefined && (
          <p className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            Shipping in Task {taskNumber}
          </p>
        )}
      </div>
    </div>
  );
}
