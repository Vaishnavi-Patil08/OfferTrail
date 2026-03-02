import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validations/auth";

const COOKIE_NAME = "auth-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse({
      email: typeof body.email === "string" ? body.email.trim() : "",
      password: typeof body.password === "string" ? body.password : "",
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message =
        first.email?.[0] ?? first.password?.[0] ?? "Email and password are required";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({ userId: user.id });
    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("LOGIN_ERROR:", error); 
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}