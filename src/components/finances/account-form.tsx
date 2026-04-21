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
import { ACCOUNT_TYPE_LABELS } from "@/lib/enum-labels";
import { todayIso } from "@/lib/format";
import { ACCOUNT_TYPES, type Account } from "@/lib/schema";

const LIABILITY_TYPES = new Set<(typeof ACCOUNT_TYPES)[number]>(["credit_card"]);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ACCOUNT_TYPES),
  institution: z.string().optional(),
  balance: z.coerce.number(),
  asOfDate: z.string().min(1, "As-of date is required"),
  isAsset: z.boolean(),
  notes: z.string().optional(),
});

export type AccountFormValues = z.infer<typeof schema>;

export type AccountFormSubmit = {
  name: string;
  type: AccountFormValues["type"];
  institution?: string;
  balance: number;
  asOfDate: string;
  isAsset: boolean;
  notes?: string;
};

type Props = {
  defaultValues?: Partial<Account>;
  onSubmit: (values: AccountFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function AccountForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save account",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "checking",
      institution: defaultValues?.institution ?? "",
      balance: defaultValues?.balance ?? ("" as unknown as number),
      asOfDate: defaultValues?.asOfDate ?? todayIso(),
      isAsset:
        defaultValues?.isAsset !== undefined
          ? defaultValues.isAsset
          : !LIABILITY_TYPES.has(defaultValues?.type ?? "checking"),
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "checking",
      institution: defaultValues?.institution ?? "",
      balance: defaultValues?.balance ?? ("" as unknown as number),
      asOfDate: defaultValues?.asOfDate ?? todayIso(),
      isAsset:
        defaultValues?.isAsset !== undefined
          ? defaultValues.isAsset
          : !LIABILITY_TYPES.has(defaultValues?.type ?? "checking"),
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  // When type is picked, flip isAsset unless the user already overrode it.
  const currentType = useWatch({ control, name: "type" });
  useEffect(() => {
    if (!currentType) return;
    if (currentType === "credit_card") setValue("isAsset", false);
    else if (currentType !== "other") setValue("isAsset", true);
  }, [currentType, setValue]);

  async function handle(values: AccountFormValues) {
    await onSubmit({
      name: values.name,
      type: values.type,
      institution: values.institution?.trim() ? values.institution : undefined,
      balance: values.balance,
      asOfDate: values.asOfDate,
      isAsset: values.isAsset,
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Name"
        htmlFor="acct-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="acct-name"
          placeholder="Chase Checking, Vanguard 401k, Chase Freedom..."
          {...register("name")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Type"
          htmlFor="acct-type"
          required
          error={errors.type?.message}
        >
          <Select id="acct-type" {...register("type")}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Institution"
          htmlFor="acct-institution"
          error={errors.institution?.message}
          hint="Optional"
        >
          <Input
            id="acct-institution"
            placeholder="Chase, Fidelity, Wells Fargo..."
            {...register("institution")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Balance"
          htmlFor="acct-balance"
          required
          error={errors.balance?.message}
          hint="Liabilities: enter the amount owed"
        >
          <Input
            id="acct-balance"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register("balance")}
          />
        </FormField>
        <FormField
          label="As of"
          htmlFor="acct-asof"
          required
          error={errors.asOfDate?.message}
        >
          <Input id="acct-asof" type="date" {...register("asOfDate")} />
        </FormField>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-muted/30 p-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border"
          {...register("isAsset")}
        />
        <span>
          <span className="block text-sm font-medium">Counts as an asset</span>
          <span className="block text-xs text-muted-foreground">
            Unchecked = liability. Auto-set by type; override for Other.
          </span>
        </span>
      </label>

      <FormField label="Notes" htmlFor="acct-notes" error={errors.notes?.message}>
        <Textarea id="acct-notes" rows={2} {...register("notes")} />
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
