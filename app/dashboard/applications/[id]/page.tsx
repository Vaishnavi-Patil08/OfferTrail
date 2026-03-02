import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function statusVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" | "success" {
  if (!status) return "outline";
  const s = status.toLowerCase();
  if (s === "interviewing" || s === "offer") return "success";
  if (s === "rejected" || s === "withdrawn") return "destructive";
  if (s === "applied") return "secondary";
  return "outline";
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      appliedAt: true,
      createdAt: true,
      coverLetterUrl: true,
      coverLetterLabel: true,
      resume: { select: { id: true, versionLabel: true, fileUrl: true } },
      answers: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!application) notFound();

  const date = application.appliedAt ?? application.createdAt;

  return (
    <main className="mx-auto w-full max-w-screen-xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10 lg:space-y-12 lg:px-8 lg:py-16 xl:space-y-14 xl:px-10 xl:py-20">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground lg:text-base"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl xl:text-4xl">
            {application.company}
            {application.role ? ` · ${application.role}` : ""}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground lg:text-base">
            <span>{date.toLocaleDateString()}</span>
            {application.status && (
              <Badge variant={statusVariant(application.status)}>
                {application.status}
              </Badge>
            )}
            {application.jobLink ? (
              <a
                href={application.jobLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:no-underline"
              >
                Job posting
              </a>
            ) : null}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/dashboard/applications/${application.id}/edit`}>
            Edit
          </Link>
        </Button>
      </div>

      {(application.jobDescription ?? "").trim() ? (
        <section className="card-premium min-w-0 space-y-3 p-4 sm:p-5 lg:p-6 lg:rounded-xl">
          <h2 className="text-sm font-semibold sm:text-base lg:text-lg">Job description</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground lg:text-base">
            {application.jobDescription}
          </p>
        </section>
      ) : null}

      <section className="card-premium min-w-0 space-y-3 p-4 sm:p-5 lg:p-6 lg:rounded-xl">
        <h2 className="text-sm font-semibold sm:text-base lg:text-lg">Resume used</h2>
        <p className="text-sm text-muted-foreground lg:text-base">
          Version: <span className="font-medium text-foreground">{application.resume.versionLabel}</span>
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/api/resume/${application.resume.id}/view`} target="_blank" rel="noopener noreferrer">
            View PDF
          </Link>
        </Button>
      </section>

      {application.coverLetterUrl ? (
        <section className="card-premium min-w-0 space-y-3 p-4 sm:p-5 lg:p-6 lg:rounded-xl">
          <h2 className="text-sm font-semibold sm:text-base lg:text-lg">Cover letter</h2>
          <p className="text-sm text-muted-foreground lg:text-base">
            {application.coverLetterLabel ? (
              <>Label: <span className="font-medium text-foreground">{application.coverLetterLabel}</span></>
            ) : (
              "Attached cover letter"
            )}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/api/application/${application.id}/cover-letter`} target="_blank" rel="noopener noreferrer">
              View PDF
            </Link>
          </Button>
        </section>
      ) : null}

      <section className="card-premium min-w-0 space-y-3 p-4 sm:p-5 lg:p-6 lg:rounded-xl">
        <h2 className="text-sm font-semibold sm:text-base lg:text-lg">Q&A evidence</h2>
        {application.answers.length === 0 ? (
          <p className="text-sm text-muted-foreground lg:text-base">No Q&A recorded.</p>
        ) : (
          <ul className="space-y-4 lg:space-y-5">
            {application.answers.map((a) => (
              <li key={a.id} className="border-b border-border pb-4 last:border-0 last:pb-0 lg:pb-5">
                <p className="text-sm font-medium text-foreground lg:text-base">{a.question}</p>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap lg:text-base">{a.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
