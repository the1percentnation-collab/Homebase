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
import { INVENTORY_CATEGORY_LABELS } from "@/lib/enum-labels";
import {
  INVENTORY_CATEGORIES,
  type InventoryItem,
} from "@/lib/schema";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(INVENTORY_CATEGORIES),
  purchaseDate: z.string().optional(),
  purchasePrice: z
    .union([z.literal(""), z.coerce.number().nonnegative("Can't be negative")])
    .optional(),
  warrantyExpiry: z.string().optional(),
  serialNumber: z.string().optional(),
  receiptUrl: z
    .union([z.literal(""), z.string().url("Enter a valid URL")])
    .optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type InventoryFormValues = z.infer<typeof schema>;

export type InventoryFormSubmit = {
  name: string;
  category: InventoryFormValues["category"];
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  serialNumber?: string;
  receiptUrl?: string;
  location?: string;
  notes?: string;
};

type Props = {
  defaultValues?: Partial<InventoryItem>;
  onSubmit: (values: InventoryFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function InventoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save item",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? "appliance",
      purchaseDate: defaultValues?.purchaseDate ?? "",
      purchasePrice:
        defaultValues?.purchasePrice ?? ("" as unknown as number),
      warrantyExpiry: defaultValues?.warrantyExpiry ?? "",
      serialNumber: defaultValues?.serialNumber ?? "",
      receiptUrl: defaultValues?.receiptUrl ?? "",
      location: defaultValues?.location ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? "appliance",
      purchaseDate: defaultValues?.purchaseDate ?? "",
      purchasePrice:
        defaultValues?.purchasePrice ?? ("" as unknown as number),
      warrantyExpiry: defaultValues?.warrantyExpiry ?? "",
      serialNumber: defaultValues?.serialNumber ?? "",
      receiptUrl: defaultValues?.receiptUrl ?? "",
      location: defaultValues?.location ?? "",
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  async function handle(values: InventoryFormValues) {
    const price =
      values.purchasePrice === "" || values.purchasePrice === undefined
        ? undefined
        : values.purchasePrice;
    const url =
      values.receiptUrl === "" || values.receiptUrl === undefined
        ? undefined
        : values.receiptUrl;
    await onSubmit({
      name: values.name,
      category: values.category,
      purchaseDate: values.purchaseDate ? values.purchaseDate : undefined,
      purchasePrice: typeof price === "number" ? price : undefined,
      warrantyExpiry: values.warrantyExpiry ? values.warrantyExpiry : undefined,
      serialNumber: values.serialNumber?.trim()
        ? values.serialNumber
        : undefined,
      receiptUrl: url,
      location: values.location?.trim() ? values.location : undefined,
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Name"
        htmlFor="inv-name"
        required
        error={errors.name?.message}
      >
        <Input
          id="inv-name"
          placeholder="Samsung fridge, MacBook Pro, riding mower..."
          {...register("name")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Category"
          htmlFor="inv-category"
          required
          error={errors.category?.message}
        >
          <Select id="inv-category" {...register("category")}>
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {INVENTORY_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Location"
          htmlFor="inv-location"
          error={errors.location?.message}
          hint="Kitchen, garage, office..."
        >
          <Input id="inv-location" {...register("location")} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Purchase date"
          htmlFor="inv-purchased"
          error={errors.purchaseDate?.message}
          hint="Optional"
        >
          <Input id="inv-purchased" type="date" {...register("purchaseDate")} />
        </FormField>
        <FormField
          label="Purchase price"
          htmlFor="inv-price"
          error={errors.purchasePrice?.message}
          hint="Optional"
        >
          <Input
            id="inv-price"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            {...register("purchasePrice")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Warranty expires"
          htmlFor="inv-warranty"
          error={errors.warrantyExpiry?.message}
          hint="Optional"
        >
          <Input
            id="inv-warranty"
            type="date"
            {...register("warrantyExpiry")}
          />
        </FormField>
        <FormField
          label="Serial number"
          htmlFor="inv-serial"
          error={errors.serialNumber?.message}
          hint="Optional"
        >
          <Input id="inv-serial" {...register("serialNumber")} />
        </FormField>
      </div>

      <FormField
        label="Receipt URL"
        htmlFor="inv-receipt"
        error={errors.receiptUrl?.message}
        hint="Link to a photo, PDF, or cloud file"
      >
        <Input
          id="inv-receipt"
          type="url"
          placeholder="https://..."
          {...register("receiptUrl")}
        />
      </FormField>

      <FormField label="Notes" htmlFor="inv-notes" error={errors.notes?.message}>
        <Textarea id="inv-notes" rows={2} {...register("notes")} />
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
