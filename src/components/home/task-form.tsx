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
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/enum-labels";
import {
  FREQUENCIES,
  PRIORITIES,
  TASK_STATUSES,
  type Task,
} from "@/lib/schema";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(PRIORITIES),
  status: z.enum(TASK_STATUSES),
  frequency: z.enum(FREQUENCIES),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type TaskFormSubmit = {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority: TaskFormValues["priority"];
  status: TaskFormValues["status"];
  frequency: TaskFormValues["frequency"];
  tags: string[];
};

type Props = {
  defaultValues?: Partial<Task>;
  onSubmit: (values: TaskFormSubmit) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save task",
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      assigneeId: defaultValues?.assigneeId ?? "",
      dueDate: defaultValues?.dueDate ?? "",
      priority: defaultValues?.priority ?? "medium",
      status: defaultValues?.status ?? "pending",
      frequency: defaultValues?.frequency ?? "once",
    },
  });

  useEffect(() => {
    reset({
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      assigneeId: defaultValues?.assigneeId ?? "",
      dueDate: defaultValues?.dueDate ?? "",
      priority: defaultValues?.priority ?? "medium",
      status: defaultValues?.status ?? "pending",
      frequency: defaultValues?.frequency ?? "once",
    });
  }, [defaultValues, reset]);

  async function handle(values: TaskFormValues) {
    await onSubmit({
      title: values.title,
      description: values.description?.trim() ? values.description : undefined,
      assigneeId: values.assigneeId ? values.assigneeId : undefined,
      dueDate: values.dueDate ? values.dueDate : undefined,
      priority: values.priority,
      status: values.status,
      frequency: values.frequency,
      tags: defaultValues?.tags ?? [],
    });
  }

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <FormField
        label="Title"
        htmlFor="task-title"
        required
        error={errors.title?.message}
      >
        <Input
          id="task-title"
          placeholder="Clean the gutters, order filters, pay HOA..."
          {...register("title")}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="task-description"
        error={errors.description?.message}
      >
        <Textarea id="task-description" rows={2} {...register("description")} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Due date"
          htmlFor="task-due"
          error={errors.dueDate?.message}
          hint="Leave blank for no deadline"
        >
          <Input id="task-due" type="date" {...register("dueDate")} />
        </FormField>

        <FormField
          label="Assignee"
          htmlFor="task-assignee"
          error={errors.assigneeId?.message}
        >
          <Select id="task-assignee" {...register("assigneeId")}>
            <option value="">Unassigned</option>
            {ASSIGNEES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          label="Priority"
          htmlFor="task-priority"
          required
          error={errors.priority?.message}
        >
          <Select id="task-priority" {...register("priority")}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Status"
          htmlFor="task-status"
          required
          error={errors.status?.message}
        >
          <Select id="task-status" {...register("status")}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Repeats"
          htmlFor="task-frequency"
          required
          error={errors.frequency?.message}
          hint="Once or recurring"
        >
          <Select id="task-frequency" {...register("frequency")}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

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
