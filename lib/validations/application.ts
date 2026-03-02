import { z } from "zod";

const answerSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const newApplicationFormSchema = z
  .object({
    company: z.string().min(1, "Company is required"),
    role: z.string(),
    jobLink: z.string(),
    jobDescription: z.string(),
    resumeChoice: z.string(),
    resumeVersionLabel: z.string(),
    coverLetterChoice: z.string(),
    coverLetterLabel: z.string(),
    answers: z.array(answerSchema),
  })
  .refine(
    (data) =>
      data.resumeChoice !== "upload-new" || data.resumeVersionLabel.trim().length > 0,
    { message: "Version label is required", path: ["resumeVersionLabel"] }
  );

export const editApplicationFormSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string(),
  jobLink: z.string(),
  jobDescription: z.string(),
  status: z.string(),
  answers: z.array(answerSchema),
});

/** Parsed from FormData for createApplication action */
export const createApplicationPayloadSchema = z
  .object({
    company: z.string().min(1, "Company is required"),
    resumeId: z.string().optional(),
    resumeVersionLabel: z.string().optional(),
    resume: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.resumeId?.trim()) return true;
      return (
        (data.resumeVersionLabel?.trim()?.length ?? 0) > 0 &&
        data.resume instanceof File &&
        data.resume.size > 0
      );
    },
    { message: "Resume PDF is required" }
  )
  .refine(
    (data) => {
      if (!(data.resume instanceof File)) return true;
      return data.resume.type === "application/pdf";
    },
    { message: "Resume must be a PDF" }
  );

/** Parsed from FormData for updateApplication action */
export const updateApplicationPayloadSchema = z.object({
  company: z.string().min(1, "Company is required"),
});

export type NewApplicationFormValues = z.infer<typeof newApplicationFormSchema>;
export type EditApplicationFormValues = z.infer<typeof editApplicationFormSchema>;
