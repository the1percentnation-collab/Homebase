import { cn } from "@/lib/utils";

type Tone = "default" | "warning" | "danger" | "success";

export function ProgressBar({
  value,
  max = 100,
  tone = "default",
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  const fill: Record<Tone, string> = {
    default: "bg-foreground",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger: "bg-[var(--destructive)]",
  };

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", fill[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
