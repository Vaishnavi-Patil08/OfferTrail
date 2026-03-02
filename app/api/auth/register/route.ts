import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse({
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
      password: typeof body.password === "string" ? body.password : "",
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message =
        first.email?.[0] ?? first.password?.[0] ?? "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.create({
      data: { email, passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
