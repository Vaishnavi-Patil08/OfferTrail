import Link from "next/link";

import { NewApplicationForm } from "@/components/forms/NewApplicationForm";
import { getRecentCoverLetters } from "@/actions/application";
import { getResumesForPicker } from "@/actions/resume";
import { getSession } from "@/lib/auth";

export default async function NewApplicationPage() {
  const session = await getSession();
  if (!session) return null;

  const [resumes, recentCoverLetters] = await Promise.all([
    getResumesForPicker(),
    getRecentCoverLetters(),
  ]);

  return (
    <main className="mx-auto w-full max-w-screen-xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10 lg:space-y-12 lg:px-8 lg:py-16 xl:space-y-14 xl:px-10 xl:py-20">
      <div className="min-w-0 space-y-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:text-base"
        >
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl xl:text-4xl">
          New application
        </h1>
        <p className="text-sm text-muted-foreground lg:text-base xl:text-lg">
          Record company, role, resume used, and application Q&A.
        </p>
      </div>

      <section className="card-premium min-w-0 rounded-lg p-4 sm:p-5 lg:p-6 lg:rounded-xl">
        <NewApplicationForm
          resumes={resumes}
          recentCoverLetters={recentCoverLetters}
        />
      </section>
    </main>
  );
}
