import Link from "next/link";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="shrink-0 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 min-h-12 w-full max-w-screen-xl items-center justify-between gap-3 px-4 sm:h-14 sm:min-h-14 sm:px-6 lg:px-12 xl:px-16">
        <Link
          href="/"
          className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl xl:text-3xl"
        >
          OfferTrail
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          {session ? (
            <LogoutButton />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
