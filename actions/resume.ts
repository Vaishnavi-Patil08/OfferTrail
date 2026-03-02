"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadResumePayloadSchema } from "@/lib/validations/resume";

const DEFAULT_RESUME_BUCKET = "resumes";
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadResume(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const payload = uploadResumePayloadSchema.safeParse({
    versionLabel: String(formData.get("versionLabel") ?? "").trim(),
  });
  if (!payload.success) {
    const msg = payload.error.flatten().fieldErrors.versionLabel?.[0] ?? "Invalid input";
    return { success: false as const, message: msg };
  }

  const versionLabel = payload.data.versionLabel;
  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false as const, message: "PDF file is required" };
  if (file.type !== "application/pdf") return { success: false as const, message: "File must be a PDF" };
  if (file.size > MAX_PDF_BYTES) return { success: false as const, message: "PDF must be 10MB or less" };

  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");

  const bucket = process.env.SUPABASE_RESUME_BUCKET ?? DEFAULT_RESUME_BUCKET;

  const { error: bucketError } = await supabaseAdmin.storage.createBucket(
    bucket,
    { public: false }
  );
  const alreadyExists =
    bucketError?.message?.toLowerCase().includes("already exists") ||
    (bucketError as { error?: string })?.error === "BucketAlreadyExists";
  if (bucketError && !alreadyExists) {
    throw new Error("Storage error");
  }

  const storagePath = `${session.userId}/${crypto.randomUUID()}.pdf`;

  const uploadRes = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadRes.error) {
    throw new Error("Upload failed");
  }

  const publicUrl = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath)
    .data.publicUrl;

  const resume = await prisma.resume.create({
    data: {
      userId: session.userId,
      versionLabel,
      fileUrl: publicUrl,
    },
  });

  revalidatePath("/dashboard/resumes");
  revalidatePath("/dashboard/new-application");
  return { success: true as const, id: resume.id, versionLabel: resume.versionLabel };
}

export async function deleteResume(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.userId },
    include: { _count: { select: { applications: true } } },
  });
  if (!resume) return { success: false as const, message: "Resume not found" };

  if (resume._count.applications > 0) {
    return {
      success: false as const,
      message: "This resume is used by one or more applications. Remove it from those applications first.",
    };
  }

  await prisma.resume.delete({
    where: { id: resume.id },
  });

  revalidatePath("/dashboard/resumes");
  revalidatePath("/dashboard/new-application");
  return { success: true as const };
}

export async function getResumesForPicker() {
  const session = await getSession();
  if (!session) return [];

  const resumes = await prisma.resume.findMany({
    where: { userId: session.userId },
    select: { id: true, versionLabel: true },
    orderBy: { updatedAt: "desc" },
  });
  return resumes;
}

