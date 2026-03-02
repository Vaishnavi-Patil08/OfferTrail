"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import {
  createApplicationPayloadSchema,
  updateApplicationPayloadSchema,
} from "@/lib/validations/application";

export type ApplicationAnswerInput = { question: string; answer: string };

export async function getRecentCoverLetters() {
  const session = await getSession();
  if (!session) return [];

  const applications = await prisma.application.findMany({
    where: { userId: session.userId, coverLetterUrl: { not: null } },
    select: { coverLetterUrl: true, coverLetterLabel: true },
    orderBy: { updatedAt: "desc" },
  });

  const seen = new Set<string>();
  return applications
    .filter((a) => a.coverLetterUrl && !seen.has(a.coverLetterUrl) && seen.add(a.coverLetterUrl))
    .map((a) => ({
      coverLetterUrl: a.coverLetterUrl!,
      coverLetterLabel: a.coverLetterLabel ?? "Cover letter",
    }));
}

const DEFAULT_BUCKET = "resumes";
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

export async function createApplication(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const payload = createApplicationPayloadSchema.safeParse({
    company: String(formData.get("company") ?? "").trim(),
    resumeId: String(formData.get("resumeId") ?? "").trim() || undefined,
    resumeVersionLabel: String(formData.get("resumeVersionLabel") ?? "").trim() || undefined,
    resume: formData.get("resume") ?? undefined,
  });
  if (!payload.success) {
    const msg = payload.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false as const, message: msg };
  }

  const company = payload.data.company;
  const answersRaw = formData.get("answers");
  const answers: ApplicationAnswerInput[] = Array.isArray(answersRaw)
    ? answersRaw as ApplicationAnswerInput[]
    : typeof answersRaw === "string"
      ? (JSON.parse(answersRaw) as ApplicationAnswerInput[])
      : [];

  const existingResumeId = payload.data.resumeId?.trim();
  let resume: { id: string };

  if (existingResumeId) {
    const found = await prisma.resume.findFirst({
      where: { id: existingResumeId, userId: session.userId },
      select: { id: true },
    });
    if (!found) return { success: false as const, message: "Selected resume not found" };
    resume = found;
  } else {
    const resumeVersionLabel = payload.data.resumeVersionLabel!;
    const resumeFile = payload.data.resume!;
    if (resumeFile.size > MAX_PDF_BYTES) return { success: false as const, message: "Resume must be 10MB or less" };

    if (!supabaseAdmin) throw new Error("Storage not configured");
    const bucket = process.env.SUPABASE_RESUME_BUCKET ?? DEFAULT_BUCKET;

    const { error: bucketError } = await supabaseAdmin.storage.createBucket(
      bucket,
      { public: false }
    );
    const alreadyExists =
      bucketError?.message?.toLowerCase().includes("already exists") ||
      (bucketError as { error?: string })?.error === "BucketAlreadyExists";
    if (bucketError && !alreadyExists) throw new Error("Storage error");

    const storagePath = `${session.userId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, resumeFile, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (uploadError) throw new Error("Upload failed");

    const fileUrl = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;

    resume = await prisma.resume.create({
      data: {
        userId: session.userId,
        versionLabel: resumeVersionLabel,
        fileUrl,
      },
    });
  }

  let coverLetterUrl: string | null = null;
  let coverLetterLabel: string | null = null;

  const existingCoverLetterUrl = String(formData.get("coverLetterUrl") ?? "").trim();
  if (existingCoverLetterUrl) {
    coverLetterUrl = existingCoverLetterUrl;
    coverLetterLabel = String(formData.get("coverLetterLabel") ?? "").trim() || "Cover letter";
  } else {
    const coverLetterFile = formData.get("coverLetter");
    if (coverLetterFile instanceof File && coverLetterFile.size > 0) {
      if (coverLetterFile.type !== "application/pdf") return { success: false as const, message: "Cover letter must be a PDF" };
      if (coverLetterFile.size > MAX_PDF_BYTES) return { success: false as const, message: "Cover letter must be 10MB or less" };
      if (!supabaseAdmin) throw new Error("Storage not configured");

      const bucket = process.env.SUPABASE_RESUME_BUCKET ?? DEFAULT_BUCKET;
      const storagePath = `cover-letters/${session.userId}/${crypto.randomUUID()}.pdf`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(storagePath, coverLetterFile, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw new Error("Upload failed");

      coverLetterUrl = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
      coverLetterLabel =
        String(formData.get("coverLetterLabel") ?? "").trim() ||
        coverLetterFile.name.replace(/\.pdf$/i, "") ||
        "Cover letter";
    }
  }

  const jobLink = String(formData.get("jobLink") ?? "").trim() || null;
  const jobDescription = String(formData.get("jobDescription") ?? "").trim() || null;

  const application = await prisma.application.create({
    data: {
      userId: session.userId,
      resumeId: resume.id,
      company,
      role: String(formData.get("role") ?? "").trim() || null,
      jobLink,
      jobDescription,
      coverLetterUrl,
      coverLetterLabel,
      answers: {
        create: answers
          .filter((a) => String(a?.question ?? "").trim() || String(a?.answer ?? "").trim())
          .map((a) => ({
            question: String(a.question ?? "").trim() || "(no question)",
            answer: String(a.answer ?? "").trim() || "",
          })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/new-application");
  return { success: true as const, id: application.id };
}

export async function getApplicationForEdit(id: string) {
  const session = await getSession();
  if (!session) return null;

  const application = await prisma.application.findFirst({
    where: { id, userId: session.userId },
    select: {
      id: true,
      company: true,
      role: true,
      jobLink: true,
      jobDescription: true,
      status: true,
      resumeId: true,
      resume: { select: { id: true, versionLabel: true } },
      answers: { orderBy: { createdAt: "asc" }, select: { id: true, question: true, answer: true } },
    },
  });
  return application;
}

export async function updateApplication(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const payload = updateApplicationPayloadSchema.safeParse({
    company: String(formData.get("company") ?? "").trim(),
  });
  if (!payload.success) {
    const msg = payload.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false as const, message: msg };
  }

  const application = await prisma.application.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!application) return { success: false as const, message: "Application not found" };

  const company = payload.data.company;

  const answersRaw = formData.get("answers");
  const answers: ApplicationAnswerInput[] = Array.isArray(answersRaw)
    ? (answersRaw as ApplicationAnswerInput[])
    : typeof answersRaw === "string"
      ? (JSON.parse(answersRaw) as ApplicationAnswerInput[])
      : [];

  await prisma.$transaction([
    prisma.applicationAnswer.deleteMany({ where: { applicationId: application.id } }),
    prisma.application.update({
      where: { id: application.id },
      data: {
        company,
        role: String(formData.get("role") ?? "").trim() || null,
        jobLink: String(formData.get("jobLink") ?? "").trim() || null,
        jobDescription: String(formData.get("jobDescription") ?? "").trim() || null,
        status: String(formData.get("status") ?? "").trim() || null,
        answers: {
          create: answers
            .filter((a) => String(a?.question ?? "").trim() || String(a?.answer ?? "").trim())
            .map((a) => ({
              question: String(a.question ?? "").trim() || "(no question)",
              answer: String(a.answer ?? "").trim() || "",
            })),
        },
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/applications/${id}`);
  revalidatePath(`/dashboard/applications/${id}/edit`);
  return { success: true as const };
}

export async function updateApplicationStatus(id: string, status: string | null) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const application = await prisma.application.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!application) return { success: false as const, message: "Application not found" };

  await prisma.application.update({
    where: { id: application.id },
    data: { status: status?.trim() || null },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteApplication(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const application = await prisma.application.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!application) return { success: false as const, message: "Application not found" };

  await prisma.application.delete({
    where: { id: application.id },
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}
