"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GOAL_HORIZON_HINT,
  GOAL_HORIZON_LABELS,
  GOAL_TYPE_LABELS,
} from "@/lib/enum-labels";
import { formatMoney, todayIso } from "@/lib/format";
import { monthsUntil } from "@/lib/goal-helpers";
import {
  GOAL_HORIZONS,
  GOAL_TYPES,
  type Goal,
} from "@/lib/schema";

const goalFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(GOAL_TYPES),
    horizon: z.enum(GOAL_HORIZONS),
    targetAmount: z.coerce.number().positive("Target must be greater than 0"),
    currentAmount: z.coerce.number().nonnegative("Can't be negative"),
    deadline: z.string().optional(),
    monthlyContribution: z
      .union([
        z.literal(""),
        z.coerce.number().nonnegative("Can't be negative"),
      ])
      .optional(),
    notes: z.string().optional(),
  })
  .refine((v) => v.currentAmount <= v.targetAmount, {
    message: "Current can't exceed target (mark as complete by lowering the target)",
    path: ["currentAmount"],
  });

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export type GoalFormSubmit = {
  name: string;
  type: GoalFormValues["type"];
  horizon: GoalFormValues["horizon"];
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  monthlyContribution?: number;
  notes?: string;
};

type Props = {
  defaultValues?: Partial<Goal>;
  onSubmit: (values: GoalFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function GoalForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save goal",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "emergency_fund",
      horizon: defaultValues?.horizon ?? "short",
      targetAmount: defaultValues?.targetAmount ?? ("" as unknown as number),
      currentAmount: defaultValues?.currentAmount ?? 0,
      deadline: defaultValues?.deadline ?? "",
      monthlyContribution:
        defaultValues?.monthlyContribution ?? ("" as unknown as number),
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "emergency_fund",
      horizon: defaultValues?.horizon ?? "short",
      targetAmount: defaultValues?.targetAmount ?? ("" as unknown as number),
      currentAmount: defaultValues?.currentAmount ?? 0,
      deadline: defaultValues?.deadline ?? "",
      monthlyContribution:
        defaultValues?.monthlyContribution ?? ("" as unknown as number),
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  const watched = useWatch({ control });

  async function handle(values: GoalFormValues) {
    const monthly =
      values.monthlyContribution === "" || values.monthlyContribution === undefined
        ? undefined
        : values.monthlyContribution;
    await onSubmit({
      name: values.name,
      type: values.type,
      horizon: values.horizon,
      targetAmount: values.targetAmount,
      currentAmount: values.currentAmount,
      deadline: values.deadline ? values.deadline : undefined,
      monthlyContribution: typeof monthly === "number" ? monthly : undefined,
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  const insight = buildInsight(watched);

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Name"
        htmlFor="goal-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="goal-name"
          placeholder="Emergency fund, Italy trip, house down payment..."
          {...register("name")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Type"
          htmlFor="goal-type"
          required
          error={errors.type?.message}
        >
          <Select id="goal-type" {...register("type")}>
            {GOAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {GOAL_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Horizon"
          htmlFor="goal-horizon"
          required
          error={errors.horizon?.message}
          hint={GOAL_HORIZON_HINT[watched.horizon ?? "short"]}
        >
          <Select id="goal-horizon" {...register("horizon")}>
            {GOAL_HORIZONS.map((h) => (
              <option key={h} value={h}>
                {GOAL_HORIZON_LABELS[h]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Target amount"
          htmlFor="goal-target"
          required
          error={errors.targetAmount?.message}
        >
          <Input
            id="goal-target"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("targetAmount")}
          />
        </FormField>
        <FormField
          label="Current amount"
          htmlFor="goal-current"
          required
          error={errors.currentAmount?.message}
        >
          <Input
            id="goal-current"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("currentAmount")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Deadline"
          htmlFor="goal-deadline"
          error={errors.deadline?.message}
          hint="Optional"
        >
          <Input id="goal-deadline" type="date" {...register("deadline")} />
        </FormField>
        <FormField
          label="Monthly contribution"
          htmlFor="goal-monthly"
          error={errors.monthlyContribution?.message}
          hint="Optional — what you plan to set aside"
        >
          <Input
            id="goal-monthly"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("monthlyContribution")}
          />
        </FormField>
      </div>

      {insight && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {insight}
        </div>
      )}

      <FormField label="Notes" htmlFor="goal-notes" error={errors.notes?.message}>
        <Textarea id="goal-notes" rows={2} {...register("notes")} />
      </FormField>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function buildInsight(values: Partial<GoalFormValues>): string | null {
  const target = toNumber(values.targetAmount);
  const current = toNumber(values.currentAmount) ?? 0;
  const monthly = toNumber(values.monthlyContribution);

  if (!target || target <= 0) return null;
  const gap = Math.max(0, target - current);
  if (gap === 0) return "You've already hit the target.";

  const now = new Date();
  const deadlineIso = values.deadline;
  let required: number | null = null;
  if (deadlineIso) {
    const m = monthsUntil(deadlineIso, now);
    required = m > 0 ? gap / m : gap;
  }

  const projectedMonths =
    monthly && monthly > 0 ? gap / monthly : null;

  if (required != null && monthly != null) {
    const delta = monthly - required;
    if (delta >= 0) {
      return `Needed: ${formatMoney(required, { cents: true })}/mo. You're planning ${formatMoney(monthly, { cents: true })}/mo — ahead by ${formatMoney(delta, { cents: true })}.`;
    }
    return `Needed: ${formatMoney(required, { cents: true })}/mo. You're planning ${formatMoney(monthly, { cents: true })}/mo — short by ${formatMoney(-delta, { cents: true })}.`;
  }

  if (required != null) {
    return `To hit this by your deadline you need ${formatMoney(required, {
      cents: true,
    })}/mo.`;
  }

  if (projectedMonths != null) {
    const months = Math.ceil(projectedMonths);
    return `At ${formatMoney(monthly!, { cents: true })}/mo you'll hit this in ${months} month${months === 1 ? "" : "s"}.`;
  }

  return null;
}

function toNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
