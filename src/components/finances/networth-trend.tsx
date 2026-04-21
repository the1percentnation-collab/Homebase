"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatMoney } from "@/lib/format";
import type { NetWorthSnapshot } from "@/lib/schema";
import { TrendingUp } from "lucide-react";

type Props = {
  snapshots: NetWorthSnapshot[];
};

export function NetWorthTrend({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={snapshots.length === 0 ? "No snapshots yet" : "Just one snapshot so far"}
        description={
          snapshots.length === 0
            ? "Record your first snapshot to start building a trend."
            : "Record another snapshot next month to see the trend line."
        }
      />
    );
  }

  const data = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date,
      netWorth: s.netWorth,
      assets: s.assets,
      liabilities: s.liabilities,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: string) => formatDate(v, "MMM yy")}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(v)
            }
            stroke="var(--border)"
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
            formatter={(value: number, name: string) => [
              formatMoney(value, { cents: true }),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            labelFormatter={(v: string) => formatDate(v)}
          />
          <Line
            type="monotone"
            dataKey="assets"
            stroke="var(--success)"
            strokeWidth={1.5}
            dot={false}
            opacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="liabilities"
            stroke="var(--destructive)"
            strokeWidth={1.5}
            dot={false}
            opacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="var(--foreground)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
