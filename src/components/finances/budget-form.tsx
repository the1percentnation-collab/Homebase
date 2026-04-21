"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BUDGET_PERIOD_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/enum-labels";
import { todayIso } from "@/lib/format";
import {
  BUDGET_PERIODS,
  EXPENSE_CATEGORIES,
  type Budget,
} from "@/lib/schema";

const budgetFormSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  period: z.enum(BUDGET_PERIODS),
  startDate: z.string().min(1, "Start date is required"),
  alertThreshold: z.coerce
    .number()
    .min(0, "Must be between 0 and 100")
    .max(100, "Must be between 0 and 100"),
  rollover: z.boolean(),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export type BudgetFormSubmit = BudgetFormValues;

type Props = {
  defaultValues?: Partial<Budget>;
  onSubmit: (values: BudgetFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function BudgetForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save budget",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: defaultValues?.category ?? "groceries",
      amount: defaultValues?.amount ?? ("" as unknown as number),
      period: defaultValues?.period ?? "monthly",
      startDate: defaultValues?.startDate ?? todayIso(),
      alertThreshold: defaultValues?.alertThreshold ?? 80,
      rollover: defaultValues?.rollover ?? false,
    },
  });

  useEffect(() => {
    reset({
      category: defaultValues?.category ?? "groceries",
      amount: defaultValues?.amount ?? ("" as unknown as number),
      period: defaultValues?.period ?? "monthly",
      startDate: defaultValues?.startDate ?? todayIso(),
      alertThreshold: defaultValues?.alertThreshold ?? 80,
      rollover: defaultValues?.rollover ?? false,
    });
  }, [defaultValues, reset]);

  return (
    <form
      id="budget-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <FormField
        label="Category"
        htmlFor="budget-category"
        required
        error={errors.category?.message}
      >
        <Select id="budget-category" {...register("category")}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Amount"
          htmlFor="budget-amount"
          required
          error={errors.amount?.message}
        >
          <Input
            id="budget-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
          />
        </FormField>

        <FormField
          label="Period"
          htmlFor="budget-period"
          required
          error={errors.period?.message}
        >
          <Select id="budget-period" {...register("period")}>
            {BUDGET_PERIODS.map((p) => (
              <option key={p} value={p}>
                {BUDGET_PERIOD_LABELS[p]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Start date"
          htmlFor="budget-start"
          required
          error={errors.startDate?.message}
        >
          <Input id="budget-start" type="date" {...register("startDate")} />
        </FormField>

        <FormField
          label="Alert threshold (%)"
          htmlFor="budget-alert"
          required
          error={errors.alertThreshold?.message}
          hint="Warn when you've used this % of the budget."
        >
          <Input
            id="budget-alert"
            type="number"
            min="0"
            max="100"
            step="1"
            {...register("alertThreshold")}
          />
        </FormField>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
        <input
          id="budget-rollover"
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border"
          {...register("rollover")}
        />
        <span>
          <span className="block text-sm font-medium">Enable rollover</span>
          <span className="block text-xs text-muted-foreground">
            Carry any unspent amount from the previous period into this one.
          </span>
        </span>
      </label>

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
