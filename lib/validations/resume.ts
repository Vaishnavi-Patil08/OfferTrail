import { z } from "zod";

export const uploadResumeSchema = z.object({
  versionLabel: z.string().min(1, "Version label is required"),
  file: z
    .custom<FileList>()
    .refine((val) => val?.length > 0 && val[0] instanceof File, "PDF is required")
    .refine(
      (val) => !val?.[0] || val[0].type === "application/pdf",
      "File must be a PDF"
    ),
});

/** Server-side: validate versionLabel; file is checked separately from FormData */
export const uploadResumePayloadSchema = z.object({
  versionLabel: z.string().min(1, "Version label is required"),
});

export type UploadResumeInput = z.infer<typeof uploadResumeSchema>;
