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
  FREQUENCY_LABELS,
  INCOME_SOURCE_LABELS,
} from "@/lib/enum-labels";
import { todayIso } from "@/lib/format";
import {
  FREQUENCIES,
  INCOME_SOURCES,
  type Income,
} from "@/lib/schema";

const incomeFormSchema = z
  .object({
    sourceName: z.string().min(1, "Source name is required"),
    source: z.enum(INCOME_SOURCES),
    grossAmount: z.coerce.number().positive("Enter a gross greater than 0"),
    netAmount: z.coerce.number().positive("Enter a net greater than 0"),
    date: z.string().min(1, "Date is required"),
    frequency: z.enum(FREQUENCIES),
    nextPayDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((v) => v.netAmount <= v.grossAmount, {
    message: "Net can't be more than gross",
    path: ["netAmount"],
  });

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

export type IncomeFormSubmit = {
  userId: string;
  sourceName: string;
  source: IncomeFormValues["source"];
  grossAmount: number;
  netAmount: number;
  date: string;
  frequency: IncomeFormValues["frequency"];
  nextPayDate?: string;
  notes?: string;
};

type Props = {
  defaultValues?: Partial<Income>;
  onSubmit: (values: IncomeFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function IncomeForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save income",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      sourceName: defaultValues?.sourceName ?? "",
      source: defaultValues?.source ?? "salary",
      grossAmount: defaultValues?.grossAmount ?? ("" as unknown as number),
      netAmount: defaultValues?.netAmount ?? ("" as unknown as number),
      date: defaultValues?.date ?? todayIso(),
      frequency: defaultValues?.frequency ?? "biweekly",
      nextPayDate: defaultValues?.nextPayDate ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      sourceName: defaultValues?.sourceName ?? "",
      source: defaultValues?.source ?? "salary",
      grossAmount: defaultValues?.grossAmount ?? ("" as unknown as number),
      netAmount: defaultValues?.netAmount ?? ("" as unknown as number),
      date: defaultValues?.date ?? todayIso(),
      frequency: defaultValues?.frequency ?? "biweekly",
      nextPayDate: defaultValues?.nextPayDate ?? "",
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  async function handle(values: IncomeFormValues) {
    await onSubmit({
      userId: defaultValues?.userId ?? DEFAULT_USER_ID,
      sourceName: values.sourceName,
      source: values.source,
      grossAmount: values.grossAmount,
      netAmount: values.netAmount,
      date: values.date,
      frequency: values.frequency,
      nextPayDate: values.nextPayDate ? values.nextPayDate : undefined,
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Source name"
        htmlFor="income-source-name"
        required
        error={errors.sourceName?.message}
      >
        <Input
          id="income-source-name"
          placeholder="Acme Inc, Freelance project, Dividend..."
          {...register("sourceName")}
        />
      </FormField>

      <FormField
        label="Source type"
        htmlFor="income-source"
        required
        error={errors.source?.message}
      >
        <Select id="income-source" {...register("source")}>
          {INCOME_SOURCES.map((s) => (
            <option key={s} value={s}>
              {INCOME_SOURCE_LABELS[s]}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Gross amount"
          htmlFor="income-gross"
          required
          error={errors.grossAmount?.message}
          hint="Before taxes / deductions"
        >
          <Input
            id="income-gross"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("grossAmount")}
          />
        </FormField>
        <FormField
          label="Net amount"
          htmlFor="income-net"
          required
          error={errors.netAmount?.message}
          hint="Take-home"
        >
          <Input
            id="income-net"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("netAmount")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Date received"
          htmlFor="income-date"
          required
          error={errors.date?.message}
        >
          <Input id="income-date" type="date" {...register("date")} />
        </FormField>
        <FormField
          label="Frequency"
          htmlFor="income-frequency"
          required
          error={errors.frequency?.message}
        >
          <Select id="income-frequency" {...register("frequency")}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        label="Next pay date"
        htmlFor="income-next"
        error={errors.nextPayDate?.message}
        hint="Optional — used for upcoming income KPI"
      >
        <Input id="income-next" type="date" {...register("nextPayDate")} />
      </FormField>

      <FormField label="Notes" htmlFor="income-notes" error={errors.notes?.message}>
        <Textarea id="income-notes" rows={2} {...register("notes")} />
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
