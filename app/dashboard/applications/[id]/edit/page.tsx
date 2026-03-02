import Link from "next/link";
import { notFound } from "next/navigation";

import { EditApplicationForm } from "@/components/forms/EditApplicationForm";
import { getApplicationForEdit } from "@/actions/application";
import { getSession } from "@/lib/auth";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const application = await getApplicationForEdit(id);
  if (!application) notFound();

  return (
    <main className="mx-auto w-full max-w-screen-xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10 lg:space-y-12 lg:px-8 lg:py-16 xl:space-y-14 xl:px-10 xl:py-20">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/dashboard/applications/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:text-base"
        >
          ← Back to application
        </Link>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl xl:text-4xl">
          Edit application
        </h1>
        <p className="text-sm text-muted-foreground lg:text-base">
          {application.company}
          {application.role ? ` · ${application.role}` : ""}
        </p>
      </div>

      <section className="card-premium min-w-0 rounded-lg p-4 sm:p-5 lg:p-6 lg:rounded-xl">
        <EditApplicationForm
          applicationId={application.id}
          defaultValues={{
            company: application.company,
            role: application.role ?? "",
            jobLink: application.jobLink ?? "",
            jobDescription: application.jobDescription ?? "",
            status: application.status ?? "",
            answers: application.answers.map((a) => ({
              question: a.question,
              answer: a.answer,
            })),
          }}
        />
      </section>
    </main>
  );
}
