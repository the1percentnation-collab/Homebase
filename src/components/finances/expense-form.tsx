"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_USER_ID } from "@/lib/constants";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TAG_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/enum-labels";
import { todayIso } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TAGS,
  PAYMENT_METHODS,
  type Expense,
} from "@/lib/schema";

const expenseFormSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Describe the expense"),
  category: z.enum(EXPENSE_CATEGORIES),
  tag: z.enum(EXPENSE_TAGS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export type ExpenseFormSubmit = {
  userId: string;
  labels: string[];
  amount: number;
  date: string;
  description: string;
  category: ExpenseFormValues["category"];
  tag: ExpenseFormValues["tag"];
  paymentMethod: ExpenseFormValues["paymentMethod"];
  notes?: string;
};

type Props = {
  defaultValues?: Partial<Expense>;
  onSubmit: (values: ExpenseFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function ExpenseForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save expense",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? ("" as unknown as number),
      date: defaultValues?.date ?? todayIso(),
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "groceries",
      tag: defaultValues?.tag ?? "essential",
      paymentMethod: defaultValues?.paymentMethod ?? "credit_card",
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      amount: defaultValues?.amount ?? ("" as unknown as number),
      date: defaultValues?.date ?? todayIso(),
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "groceries",
      tag: defaultValues?.tag ?? "essential",
      paymentMethod: defaultValues?.paymentMethod ?? "credit_card",
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  async function handle(values: ExpenseFormValues) {
    await onSubmit({
      ...values,
      userId: defaultValues?.userId ?? DEFAULT_USER_ID,
      labels: defaultValues?.labels ?? [],
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  return (
    <form
      id="expense-form"
      onSubmit={handleSubmit(handle)}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Amount"
          htmlFor="expense-amount"
          required
          error={errors.amount?.message}
        >
          <Input
            id="expense-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
          />
        </FormField>

        <FormField
          label="Date"
          htmlFor="expense-date"
          required
          error={errors.date?.message}
        >
          <Input id="expense-date" type="date" {...register("date")} />
        </FormField>
      </div>

      <FormField
        label="Description"
        htmlFor="expense-description"
        required
        error={errors.description?.message}
      >
        <Input
          id="expense-description"
          placeholder="Grocery run, dinner out, etc."
          {...register("description")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Category"
          htmlFor="expense-category"
          required
          error={errors.category?.message}
        >
          <Select id="expense-category" {...register("category")}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Tag"
          htmlFor="expense-tag"
          required
          error={errors.tag?.message}
          hint="Essential or discretionary"
        >
          <Select id="expense-tag" {...register("tag")}>
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
        htmlFor="expense-payment"
        required
        error={errors.paymentMethod?.message}
      >
        <Select id="expense-payment" {...register("paymentMethod")}>
          {PAYMENT_METHODS.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_METHOD_LABELS[p]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Notes" htmlFor="expense-notes" error={errors.notes?.message}>
        <Textarea id="expense-notes" rows={3} {...register("notes")} />
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
