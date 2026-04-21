"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DEFAULT_USER_ID } from "@/lib/constants";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TAG_LABELS,
  FREQUENCY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/enum-labels";
import { todayIso } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TAGS,
  FREQUENCIES,
  PAYMENT_METHODS,
  type RecurringExpense,
} from "@/lib/schema";

const RECURRING_FREQUENCIES = FREQUENCIES.filter((f) => f !== "once");

const schema = z.object({
  description: z.string().min(1, "Describe the recurring expense"),
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  category: z.enum(EXPENSE_CATEGORIES),
  tag: z.enum(EXPENSE_TAGS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  frequency: z.enum(FREQUENCIES).refine((v) => v !== "once", {
    message: "Choose a recurring frequency",
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  nextDue: z.string().min(1, "Next due date is required"),
  active: z.boolean(),
});

export type RecurringExpenseFormValues = z.infer<typeof schema>;

export type RecurringExpenseFormSubmit = Omit<
  RecurringExpenseFormValues,
  "endDate"
> & {
  userId: string;
  endDate?: string;
};

type Props = {
  defaultValues?: Partial<RecurringExpense>;
  onSubmit: (values: RecurringExpenseFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function RecurringExpenseForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save rule",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecurringExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount ?? ("" as unknown as number),
      category: defaultValues?.category ?? "subscriptions",
      tag: defaultValues?.tag ?? "essential",
      paymentMethod: defaultValues?.paymentMethod ?? "credit_card",
      frequency:
        defaultValues?.frequency && defaultValues.frequency !== "once"
          ? defaultValues.frequency
          : "monthly",
      startDate: defaultValues?.startDate ?? todayIso(),
      endDate: defaultValues?.endDate ?? "",
      nextDue: defaultValues?.nextDue ?? todayIso(),
      active: defaultValues?.active ?? true,
    },
  });

  useEffect(() => {
    reset({
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount ?? ("" as unknown as number),
      category: defaultValues?.category ?? "subscriptions",
      tag: defaultValues?.tag ?? "essential",
      paymentMethod: defaultValues?.paymentMethod ?? "credit_card",
      frequency:
        defaultValues?.frequency && defaultValues.frequency !== "once"
          ? defaultValues.frequency
          : "monthly",
      startDate: defaultValues?.startDate ?? todayIso(),
      endDate: defaultValues?.endDate ?? "",
      nextDue: defaultValues?.nextDue ?? todayIso(),
      active: defaultValues?.active ?? true,
    });
  }, [defaultValues, reset]);

  async function handle(values: RecurringExpenseFormValues) {
    await onSubmit({
      ...values,
      userId: defaultValues?.userId ?? DEFAULT_USER_ID,
      endDate: values.endDate ? values.endDate : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Description"
        htmlFor="rec-description"
        required
        error={errors.description?.message}
      >
        <Input
          id="rec-description"
          placeholder="Netflix, gym membership, rent..."
          {...register("description")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Amount"
          htmlFor="rec-amount"
          required
          error={errors.amount?.message}
        >
          <Input
            id="rec-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
          />
        </FormField>
        <FormField
          label="Frequency"
          htmlFor="rec-frequency"
          required
          error={errors.frequency?.message}
        >
          <Select id="rec-frequency" {...register("frequency")}>
            {RECURRING_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Category"
          htmlFor="rec-category"
          required
          error={errors.category?.message}
        >
          <Select id="rec-category" {...register("category")}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Tag"
          htmlFor="rec-tag"
          required
          error={errors.tag?.message}
        >
          <Select id="rec-tag" {...register("tag")}>
            {EXPENSE_TAGS.map((t) => (
              <option key={t} value={t}>
                {EXPENSE_TAG_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        label="Payment method"
        htmlFor="rec-payment"
        required
        error={errors.paymentMethod?.message}
      >
        <Select id="rec-payment" {...register("paymentMethod")}>
          {PAYMENT_METHODS.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_METHOD_LABELS[p]}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          label="Start date"
          htmlFor="rec-start"
          required
          error={errors.startDate?.message}
        >
          <Input id="rec-start" type="date" {...register("startDate")} />
        </FormField>
        <FormField
          label="Next due"
          htmlFor="rec-next"
          required
          error={errors.nextDue?.message}
        >
          <Input id="rec-next" type="date" {...register("nextDue")} />
        </FormField>
        <FormField
          label="End date"
          htmlFor="rec-end"
          error={errors.endDate?.message}
          hint="Optional"
        >
          <Input id="rec-end" type="date" {...register("endDate")} />
        </FormField>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border"
          {...register("active")}
        />
        <span>
          <span className="block text-sm font-medium">Active</span>
          <span className="block text-xs text-muted-foreground">
            Paused rules won&apos;t be picked up by &ldquo;Generate due&rdquo;.
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
