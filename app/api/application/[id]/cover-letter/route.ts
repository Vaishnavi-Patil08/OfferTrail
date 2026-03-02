import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

const SIGNED_URL_EXPIRES_SEC = 3600; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: applicationId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.userId },
    select: { coverLetterUrl: true },
  });
  if (!application?.coverLetterUrl) {
    return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  const match = application.coverLetterUrl.match(
    /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
  );
  if (!match) {
    return NextResponse.json(
      { error: "Invalid cover letter URL format" },
      { status: 400 }
    );
  }
  const [, bucket, rawPath] = match;
  const storagePath = decodeURIComponent(rawPath);

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_SEC);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
