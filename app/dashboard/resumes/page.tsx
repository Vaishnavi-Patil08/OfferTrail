import { ResumeList } from "@/components/dashboard/ResumeList";
import { ResumeUploadForm } from "@/components/forms/ResumeUploadForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ResumesPage() {
  const session = await getSession();
  if (!session) return null;

  const resumes = await prisma.resume.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      versionLabel: true,
      fileUrl: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto w-full max-w-screen-xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10 lg:space-y-12 lg:px-8 lg:py-16 xl:space-y-14 xl:px-10 xl:py-20">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl xl:text-4xl">Resumes</h1>
        <p className="text-sm text-muted-foreground lg:text-base xl:text-lg">
          Upload a PDF resume and assign a version label.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8 xl:items-start">
        <section className="card-premium min-w-0 rounded-lg p-4 sm:p-5 lg:p-6 lg:rounded-xl">
          <h2 className="mb-4 text-sm font-semibold sm:text-base lg:text-lg">Upload a new resume</h2>
          <ResumeUploadForm />
        </section>

        <section className="min-w-0 space-y-3 lg:space-y-4">
          <h2 className="text-sm font-semibold sm:text-base lg:text-lg">Your resumes</h2>
          {resumes.length === 0 ? (
            <p className="text-sm text-muted-foreground lg:text-base">No resumes yet.</p>
          ) : (
            <ResumeList
              resumes={resumes.map((r) => ({
                id: r.id,
                versionLabel: r.versionLabel,
                fileUrl: r.fileUrl,
                createdAt: r.createdAt.toISOString(),
              }))}
            />
          )}
        </section>
      </div>
    </main>
  );
}

