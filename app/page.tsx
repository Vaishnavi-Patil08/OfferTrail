import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] w-full flex-col items-center justify-center bg-background sm:min-h-[calc(100vh-3.5rem)]">
      <main className="flex w-full max-w-screen-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24 md:py-32 lg:py-20 lg:px-8 xl:py-24 xl:px-10">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
        Keep a complete record of your job hunt
        </h1>
        <p className="mt-3 max-w-md text-center text-base text-muted-foreground sm:mt-4 sm:text-lg lg:max-w-xl lg:text-xl">
        Upload resumes, cover letters, and application responses, so you always know what you sent and how to improve next time.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center lg:mt-12 lg:gap-6">
          <Button asChild size="lg">
            <Link href={session ? "/dashboard" : "/login"}>
              {session ? "Go to dashboard" : "Get started"}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-muted-foreground">
            <Link href="/dashboard/resumes">Manage resumes</Link>
          </Button>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground/80 sm:mt-16 lg:mt-20 lg:text-base">
          Personal Project by Vaishnavi
        </p>
      </main>
    </div>
  );
}
