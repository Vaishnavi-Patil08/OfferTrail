import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/lib/jwt";

const AUTH_COOKIE = "auth-token";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return verifyToken(token).then((payload) => {
    if (!payload) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
      return res;
    }
    return NextResponse.next();
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
