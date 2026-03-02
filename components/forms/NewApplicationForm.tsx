"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { createApplication } from "@/actions/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { newApplicationFormSchema, type NewApplicationFormValues } from "@/lib/validations/application";
import { Plus, Trash2 } from "lucide-react";

type ResumeOption = { id: string; versionLabel: string };
type CoverLetterOption = { coverLetterUrl: string; coverLetterLabel: string };

type FormValues = NewApplicationFormValues;

type NewApplicationFormProps = {
  resumes: ResumeOption[];
  recentCoverLetters: CoverLetterOption[];
};

export function NewApplicationForm({
  resumes,
  recentCoverLetters,
}: NewApplicationFormProps) {
  const router = useRouter();
  const resumeFileRef = React.useRef<HTMLInputElement>(null);
  const coverLetterFileRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
    setError,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(newApplicationFormSchema),
    defaultValues: {
      company: "",
      role: "",
      jobLink: "",
      jobDescription: "",
      resumeChoice: "upload-new",
      resumeVersionLabel: "",
      coverLetterChoice: "none",
      coverLetterLabel: "",
      answers: [{ question: "", answer: "" }],
    },
  });

  const resumeChoice = watch("resumeChoice");
  const coverLetterChoice = watch("coverLetterChoice");
  const useNewResume = resumeChoice === "upload-new";
  const useExistingResume = resumeChoice !== "" && resumeChoice !== "upload-new";
  const useNewCoverLetter = coverLetterChoice === "upload-new";
  const useExistingCoverLetter =
    coverLetterChoice.startsWith("reuse-") &&
    recentCoverLetters.length > 0;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const onSubmit = handleSubmit(async (values) => {
    if (useNewResume) {
      const resumeFile = resumeFileRef.current?.files?.[0];
      if (!resumeFile) {
        setError("resumeVersionLabel", { message: "Resume PDF is required" });
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.set("company", values.company);
      fd.set("role", values.role);
      fd.set("jobLink", values.jobLink.trim());
      fd.set("jobDescription", values.jobDescription.trim());
      fd.set("answers", JSON.stringify(values.answers));

      if (useExistingResume) {
        fd.set("resumeId", values.resumeChoice);
      } else if (useNewResume) {
        const resumeFile = resumeFileRef.current?.files?.[0]!;
        fd.set("resumeVersionLabel", values.resumeVersionLabel.trim());
        fd.set("resume", resumeFile);
      }

      if (useExistingCoverLetter) {
        const idx = parseInt(values.coverLetterChoice.replace("reuse-", ""), 10);
        const existing = recentCoverLetters[idx];
        if (existing) {
          fd.set("coverLetterUrl", existing.coverLetterUrl);
          fd.set("coverLetterLabel", existing.coverLetterLabel);
        }
      } else if (useNewCoverLetter) {
        const coverLetterFile = coverLetterFileRef.current?.files?.[0];
        if (coverLetterFile) {
          fd.set("coverLetter", coverLetterFile);
          fd.set(
            "coverLetterLabel",
            values.coverLetterLabel.trim() ||
              coverLetterFile.name.replace(/\.pdf$/i, "")
          );
        }
      }

      const result = await createApplication(fd);
      if (result?.success === false) {
        setError("root", { type: "server", message: result.message });
        return;
      }
      reset({
        company: "",
        role: "",
        jobLink: "",
        jobDescription: "",
        resumeChoice: "upload-new",
        resumeVersionLabel: "",
        coverLetterChoice: "none",
        coverLetterLabel: "",
        answers: [{ question: "", answer: "" }],
      });
      if (resumeFileRef.current) resumeFileRef.current.value = "";
      if (coverLetterFileRef.current) coverLetterFileRef.current.value = "";
      router.push("/dashboard");
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
      </div>

      <div className="card-premium min-w-0 space-y-3 p-3 sm:p-4 lg:p-5 lg:rounded-xl">
        <Label>Resume (required)</Label>
        <p className="text-sm text-muted-foreground lg:text-base">
          Choose a stored resume or upload a new PDF.
        </p>
        <div className="space-y-3 lg:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resumeChoice">Source</Label>
            <Select
              id="resumeChoice"
              {...register("resumeChoice")}
            >
              <option value="upload-new">Upload new resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.versionLabel}
                </option>
              ))}
            </Select>
          </div>
          {useNewResume && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="resumeVersionLabel">Version label</Label>
                <Input
                  id="resumeVersionLabel"
                  placeholder="e.g. SWE Jan 2026"
                  {...register("resumeVersionLabel")}
                />
                {errors.resumeVersionLabel?.message ? (
                  <p className="text-sm text-destructive">{errors.resumeVersionLabel.message}</p>
                ) : null}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="resumeFile">PDF file</Label>
                <Input
                  id="resumeFile"
                  ref={resumeFileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setValue("resumeVersionLabel", file.name.replace(/\.pdf$/i, ""));
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-3 rounded-lg border border-border/50 border-dashed bg-muted/20 p-3 shadow-sm transition-all duration-200 sm:p-4 lg:p-5 lg:rounded-xl">
        <Label>Cover letter (optional)</Label>
        <p className="text-sm text-muted-foreground lg:text-base">
          Choose a previously used cover letter or upload a new PDF.
        </p>
        <div className="space-y-3 lg:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetterChoice">Source</Label>
            <Select
              id="coverLetterChoice"
              {...register("coverLetterChoice")}
            >
              <option value="none">None</option>
              <option value="upload-new">Upload new cover letter</option>
              {recentCoverLetters.map((cl, i) => (
                <option key={cl.coverLetterUrl} value={`reuse-${i}`}>
                  {cl.coverLetterLabel}
                </option>
              ))}
            </Select>
          </div>
          {useNewCoverLetter && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="coverLetterLabel">Label</Label>
                <Input
                  id="coverLetterLabel"
                  placeholder="e.g. Acme cover letter"
                  className="bg-background"
                  {...register("coverLetterLabel")}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="coverLetterFile">PDF file</Label>
                <Input
                  id="coverLetterFile"
                  ref={coverLetterFileRef}
                  type="file"
                  accept="application/pdf"
                  className="bg-background"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setValue("coverLetterLabel", file.name.replace(/\.pdf$/i, ""));
                  }}
                />
              </div>
            </div>
          )}
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
        {isSubmitting ? "Saving..." : "Save application"}
      </Button>
    </form>
  );
}
