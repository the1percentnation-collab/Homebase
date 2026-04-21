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
import { ASSIGNEES } from "@/lib/constants";
import {
  FREQUENCY_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
} from "@/lib/enum-labels";
import { addDaysIso } from "@/lib/format";
import {
  FREQUENCIES,
  MAINTENANCE_CATEGORIES,
  type MaintenanceItem,
} from "@/lib/schema";

// Maintenance is inherently recurring — exclude "once" from the picker.
const MAINTENANCE_FREQUENCIES = FREQUENCIES.filter((f) => f !== "once");

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(MAINTENANCE_CATEGORIES),
  frequency: z.enum(FREQUENCIES).refine((v) => v !== "once", {
    message: "Choose a recurring frequency",
  }),
  nextDue: z.string().min(1, "Next due is required"),
  lastDone: z.string().optional(),
  assigneeId: z.string().optional(),
  notes: z.string().optional(),
});

export type MaintenanceFormValues = z.infer<typeof schema>;

export type MaintenanceFormSubmit = {
  title: string;
  category: MaintenanceFormValues["category"];
  frequency: MaintenanceFormValues["frequency"];
  nextDue: string;
  lastDone?: string;
  assigneeId?: string;
  notes?: string;
};

type Props = {
  defaultValues?: Partial<MaintenanceItem>;
  onSubmit: (values: MaintenanceFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function MaintenanceForm({
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
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      category: defaultValues?.category ?? "hvac",
      frequency:
        defaultValues?.frequency && defaultValues.frequency !== "once"
          ? defaultValues.frequency
          : "quarterly",
      nextDue: defaultValues?.nextDue ?? addDaysIso(30),
      lastDone: defaultValues?.lastDone ?? "",
      assigneeId: defaultValues?.assigneeId ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      title: defaultValues?.title ?? "",
      category: defaultValues?.category ?? "hvac",
      frequency:
        defaultValues?.frequency && defaultValues.frequency !== "once"
          ? defaultValues.frequency
          : "quarterly",
      nextDue: defaultValues?.nextDue ?? addDaysIso(30),
      lastDone: defaultValues?.lastDone ?? "",
      assigneeId: defaultValues?.assigneeId ?? "",
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues, reset]);

  async function handle(values: MaintenanceFormValues) {
    await onSubmit({
      title: values.title,
      category: values.category,
      frequency: values.frequency,
      nextDue: values.nextDue,
      lastDone: values.lastDone ? values.lastDone : undefined,
      assigneeId: values.assigneeId ? values.assigneeId : undefined,
      notes: values.notes?.trim() ? values.notes : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Title"
        htmlFor="maint-title"
        required
        error={errors.title?.message}
      >
        <Input
          id="maint-title"
          placeholder="Change HVAC filter, clean gutters, test smoke detectors..."
          {...register("title")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Category"
          htmlFor="maint-category"
          required
          error={errors.category?.message}
        >
          <Select id="maint-category" {...register("category")}>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MAINTENANCE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Repeats"
          htmlFor="maint-frequency"
          required
          error={errors.frequency?.message}
        >
          <Select id="maint-frequency" {...register("frequency")}>
            {MAINTENANCE_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Next due"
          htmlFor="maint-next"
          required
          error={errors.nextDue?.message}
        >
          <Input id="maint-next" type="date" {...register("nextDue")} />
        </FormField>
        <FormField
          label="Last done"
          htmlFor="maint-last"
          error={errors.lastDone?.message}
          hint="Optional"
        >
          <Input id="maint-last" type="date" {...register("lastDone")} />
        </FormField>
      </div>

      <FormField
        label="Assignee"
        htmlFor="maint-assignee"
        error={errors.assigneeId?.message}
      >
        <Select id="maint-assignee" {...register("assigneeId")}>
          <option value="">Unassigned</option>
          {ASSIGNEES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Notes" htmlFor="maint-notes" error={errors.notes?.message}>
        <Textarea id="maint-notes" rows={2} {...register("notes")} />
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
