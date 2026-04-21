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
import { DEBT_TYPE_LABELS } from "@/lib/enum-labels";
import {
  DEBT_TYPES,
  PAYOFF_STRATEGIES,
  type Debt,
} from "@/lib/schema";

const debtFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(DEBT_TYPES),
    balance: z.coerce.number().nonnegative("Can't be negative"),
    originalBalance: z
      .union([z.literal(""), z.coerce.number().nonnegative("Can't be negative")])
      .optional(),
    interestRate: z
      .coerce.number()
      .min(0, "APR can't be negative")
      .max(100, "APR over 100% is unusual — double-check"),
    minPayment: z.coerce.number().nonnegative("Can't be negative"),
    payoffDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (v) => {
      if (v.originalBalance === "" || v.originalBalance === undefined) return true;
      return v.originalBalance >= v.balance;
    },
    {
      message: "Original balance should be at least the current balance",
      path: ["originalBalance"],
    }
  );

export type DebtFormValues = z.infer<typeof debtFormSchema>;

export type DebtFormSubmit = {
  name: string;
  type: DebtFormValues["type"];
  balance: number;
  originalBalance?: number;
  interestRate: number;
  minPayment: number;
  payoffDate?: string;
  notes?: string;
  strategy: (typeof PAYOFF_STRATEGIES)[number];
};

type Props = {
  defaultValues?: Partial<Debt>;
  onSubmit: (values: DebtFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function DebtForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save debt",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "credit_card",
      balance: defaultValues?.balance ?? ("" as unknown as number),
      originalBalance:
        defaultValues?.originalBalance ?? ("" as unknown as number),
      interestRate: defaultValues?.interestRate ?? ("" as unknown as number),
      minPayment: defaultValues?.minPayment ?? ("" as unknown as number),
      payoffDate: defaultValues?.payoffDate ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "credit_card",
      balance: defaultValues?.balance ?? ("" as unknown as number),
      originalBalance:
        defaultValues?.originalBalance ?? ("" as unknown as number),
      interestRate: defaultValues?.interestRate ?? ("" as unknown as number),
      minPayment: defaultValues?.minPayment ?? ("" as unknown as number),
      payoffDate: defaultValues?.payoffDate ?? "",
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  async function handle(values: DebtFormValues) {
    const original =
      values.originalBalance === "" || values.originalBalance === undefined
        ? undefined
        : values.originalBalance;
    await onSubmit({
      name: values.name,
      type: values.type,
      balance: values.balance,
      originalBalance: typeof original === "number" ? original : undefined,
      interestRate: values.interestRate,
      minPayment: values.minPayment,
      payoffDate: values.payoffDate ? values.payoffDate : undefined,
      notes: values.notes?.trim() ? values.notes : undefined,
      strategy: defaultValues?.strategy ?? "avalanche",
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Name"
        htmlFor="debt-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="debt-name"
          placeholder="Chase Freedom, Sallie Mae, car loan..."
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Type"
        htmlFor="debt-type"
        required
        error={errors.type?.message}
      >
        <Select id="debt-type" {...register("type")}>
          {DEBT_TYPES.map((t) => (
            <option key={t} value={t}>
              {DEBT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Current balance"
          htmlFor="debt-balance"
          required
          error={errors.balance?.message}
        >
          <Input
            id="debt-balance"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("balance")}
          />
        </FormField>
        <FormField
          label="Original balance"
          htmlFor="debt-original"
          error={errors.originalBalance?.message}
          hint="Optional — enables paid-off % tracking"
        >
          <Input
            id="debt-original"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("originalBalance")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="APR (%)"
          htmlFor="debt-apr"
          required
          error={errors.interestRate?.message}
        >
          <Input
            id="debt-apr"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("interestRate")}
          />
        </FormField>
        <FormField
          label="Minimum payment"
          htmlFor="debt-min"
          required
          error={errors.minPayment?.message}
          hint="Monthly"
        >
          <Input
            id="debt-min"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("minPayment")}
          />
        </FormField>
      </div>

      <FormField
        label="Target payoff date"
        htmlFor="debt-payoff"
        error={errors.payoffDate?.message}
        hint="Optional"
      >
        <Input id="debt-payoff" type="date" {...register("payoffDate")} />
      </FormField>

      <FormField label="Notes" htmlFor="debt-notes" error={errors.notes?.message}>
        <Textarea id="debt-notes" rows={2} {...register("notes")} />
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
