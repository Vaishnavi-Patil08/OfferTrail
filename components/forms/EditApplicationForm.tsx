"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { updateApplication } from "@/actions/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { editApplicationFormSchema, type EditApplicationFormValues } from "@/lib/validations/application";
import { Plus, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "Applied", label: "Applied" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Offer", label: "Offer" },
  { value: "Rejected", label: "Rejected" },
  { value: "Withdrawn", label: "Withdrawn" },
];

type FormValues = EditApplicationFormValues;

type EditApplicationFormProps = {
  applicationId: string;
  defaultValues: FormValues;
};

export function EditApplicationForm({
  applicationId,
  defaultValues,
}: EditApplicationFormProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(editApplicationFormSchema),
    defaultValues: {
      ...defaultValues,
      answers:
        defaultValues.answers.length > 0
          ? defaultValues.answers
          : [{ question: "", answer: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const fd = new FormData();
      fd.set("company", values.company);
      fd.set("role", values.role);
      fd.set("jobLink", values.jobLink.trim());
      fd.set("jobDescription", values.jobDescription.trim());
      fd.set("status", values.status.trim());
      fd.set("answers", JSON.stringify(values.answers));

      const result = await updateApplication(applicationId, fd);
      if (result?.success === false) {
        setError("root", { type: "server", message: result.message });
        return;
      }
      router.push(`/dashboard/applications/${applicationId}`);
      router.refresh();
    } catch (e) {
      setError("root", { type: "server", message: "Something went wrong. Please try again." });
    }
  });

  return (
    <form onSubmit={onSubmit} className="min-w-0 space-y-6 lg:space-y-8" noValidate>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:gap-8">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Acme Inc."
            {...register("company")}
          />
          {errors.company?.message ? (
            <p className="text-sm text-destructive">{errors.company.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            placeholder="Software Engineer"
            {...register("role")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="jobLink">Job link</Label>
          <Input
            id="jobLink"
            type="url"
            placeholder="https://..."
            {...register("jobLink")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="jobDescription">Job description</Label>
          <textarea
            id="jobDescription"
            rows={4}
            placeholder="Paste or type the job description..."
            className="flex w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:px-4 lg:text-base xl:px-5"
            {...register("jobDescription")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Questions & answers</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ question: "", answer: "" })}
          >
            <Plus className="size-4" />
            Add question
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex min-w-0 flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-start sm:gap-3 lg:gap-4 lg:p-4"
          >
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-4">
              <Input
                placeholder="Question"
                {...register(`answers.${index}.question`)}
              />
              <Input
                placeholder="Answer"
                {...register(`answers.${index}.answer`)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              aria-label="Remove question"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
