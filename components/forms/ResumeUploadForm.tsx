"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { uploadResume } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadResumeSchema, type UploadResumeInput } from "@/lib/validations/resume";

export function ResumeUploadForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
    reset,
    setError,
  } = useForm<UploadResumeInput>({
    resolver: zodResolver(uploadResumeSchema),
    defaultValues: {
      versionLabel: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const file = values.file?.item(0);
    if (!file) {
      setError("file", { type: "required", message: "PDF is required" });
      return;
    }

    const fd = new FormData();
    fd.set("versionLabel", values.versionLabel);
    fd.set("file", file);

    try {
      const result = await uploadResume(fd);
      if (result?.success === false) {
        setError("root", { type: "server", message: result.message });
        return;
      }
      reset();
    } catch (e) {
      setError("root", { type: "server", message: "Something went wrong. Please try again." });
    }
  });

  return (
    <form onSubmit={onSubmit} className="min-w-0 space-y-4 lg:space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="versionLabel">Version label</Label>
        <Input
          id="versionLabel"
          placeholder="e.g. SWE - Jan 2026"
          {...register("versionLabel")}
        />
        {errors.versionLabel?.message ? (
          <p className="text-sm text-destructive">{errors.versionLabel.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">PDF resume</Label>
        <Input
          id="file"
          type="file"
          accept="application/pdf"
          {...register("file", {
            onChange: (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const name = file.name.replace(/\.pdf$/i, "");
                setValue("versionLabel", name);
              }
            },
          })}
        />
        {errors.file?.message ? (
          <p className="text-sm text-destructive">{errors.file.message}</p>
        ) : null}
      </div>

      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload resume"}
      </Button>
    </form>
  );
}

