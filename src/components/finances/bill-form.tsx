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
import {
  EXPENSE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/enum-labels";
import { addDaysIso } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  FREQUENCIES,
  type Bill,
} from "@/lib/schema";

const billFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  frequency: z.enum(FREQUENCIES),
  category: z.enum(EXPENSE_CATEGORIES),
  autopay: z.boolean(),
  cancelFlag: z.boolean(),
  notes: z.string().optional(),
});

export type BillFormValues = z.infer<typeof billFormSchema>;

export type BillFormSubmit = Omit<BillFormValues, "notes"> & {
  notes?: string;
};

type Props = {
  defaultValues?: Partial<Bill>;
  onSubmit: (values: BillFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function BillForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save bill",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      amount: defaultValues?.amount ?? ("" as unknown as number),
      dueDate: defaultValues?.dueDate ?? addDaysIso(7),
      frequency: defaultValues?.frequency ?? "monthly",
      category: defaultValues?.category ?? "subscriptions",
      autopay: defaultValues?.autopay ?? false,
      cancelFlag: defaultValues?.cancelFlag ?? false,
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      amount: defaultValues?.amount ?? ("" as unknown as number),
      dueDate: defaultValues?.dueDate ?? addDaysIso(7),
      frequency: defaultValues?.frequency ?? "monthly",
      category: defaultValues?.category ?? "subscriptions",
      autopay: defaultValues?.autopay ?? false,
      cancelFlag: defaultValues?.cancelFlag ?? false,
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  async function handle(values: BillFormValues) {
    await onSubmit({
      ...values,
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Name"
        htmlFor="bill-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="bill-name"
          placeholder="Netflix, electric bill, mortgage..."
          {...register("name")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Amount"
          htmlFor="bill-amount"
          required
          error={errors.amount?.message}
        >
          <Input
            id="bill-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
          />
        </FormField>

        <FormField
          label="Next due"
          htmlFor="bill-due"
          required
          error={errors.dueDate?.message}
        >
          <Input id="bill-due" type="date" {...register("dueDate")} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Frequency"
          htmlFor="bill-frequency"
          required
          error={errors.frequency?.message}
        >
          <Select id="bill-frequency" {...register("frequency")}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Category"
          htmlFor="bill-category"
          required
          error={errors.category?.message}
        >
          <Select id="bill-category" {...register("category")}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border"
            {...register("autopay")}
          />
          <span>
            <span className="block text-sm font-medium">Autopay</span>
            <span className="block text-xs text-muted-foreground">
              Charged automatically each period.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border"
            {...register("cancelFlag")}
          />
          <span>
            <span className="block text-sm font-medium">Consider cancelling</span>
            <span className="block text-xs text-muted-foreground">
              Flag this subscription for review.
            </span>
          </span>
        </label>
      </div>

      <FormField label="Notes" htmlFor="bill-notes" error={errors.notes?.message}>
        <Textarea id="bill-notes" rows={3} {...register("notes")} />
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
