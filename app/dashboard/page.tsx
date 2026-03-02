import Link from "next/link";

import { ApplicationsDataTable } from "@/components/dashboard/ApplicationsDataTable";
import type { ApplicationRow } from "@/components/dashboard/ApplicationsDataTable";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const applications = await prisma.application.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      appliedAt: true,
      createdAt: true,
    },
  });

  const rows: ApplicationRow[] = applications.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    date: a.appliedAt ?? a.createdAt,
    status: a.status,
  }));

  return (
    <main className="mx-auto w-full max-w-screen-xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10 lg:space-y-12 lg:px-8 lg:py-16 xl:space-y-14 xl:px-10 xl:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl xl:text-4xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground lg:text-base xl:text-lg">
            Your job applications.
          </p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/dashboard/new-application">New application</Link>
        </Button>
      </div>

      <section className="min-w-0 space-y-3 lg:space-y-4">
        <h2 className="text-sm font-semibold sm:text-base lg:text-lg">Applications</h2>
        <p className="text-sm text-muted-foreground lg:text-base">
          Click a row to view resume version and Q&A evidence.
        </p>
        <ApplicationsDataTable data={rows} />
      </section>
    </main>
  );
}
