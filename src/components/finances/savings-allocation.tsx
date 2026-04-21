"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/lib/schema";

const PALETTE = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
  "#0ea5e9",
  "#a855f7",
];

type Props = {
  accounts: Account[];
};

export function SavingsAllocation({ accounts }: Props) {
  const positive = accounts.filter((a) => a.balance > 0);
  const total = positive.reduce((s, a) => s + a.balance, 0);

  if (positive.length === 0 || total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Add a savings or investment account to see your allocation.
      </p>
    );
  }

  const data = positive
    .map((a, i) => ({
      name: a.name,
      value: a.balance,
      color: PALETTE[i % PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="90%"
              strokeWidth={1}
              stroke="var(--card)"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [
                formatMoney(value, { cents: true }),
                "Balance",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-1.5">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li
              key={d.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="flex items-baseline gap-2 text-right tabular-nums">
                <span className="text-xs text-muted-foreground">
                  {pct.toFixed(1)}%
                </span>
                <span className="font-medium">
                  {formatMoney(d.value, { cents: true })}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
