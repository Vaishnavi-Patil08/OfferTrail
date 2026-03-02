"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    const result = registerSchema.safeParse({ email, password });
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors;
      setEmailError(issues.email?.[0] ?? "");
      setPasswordError(issues.password?.[0] ?? "");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error ?? "Registration failed");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setSubmitError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] w-full flex-col items-center justify-center sm:min-h-[calc(100vh-3.5rem)]">
      <main className="w-full max-w-sm px-4">
        <h1 className="text-center text-xl font-semibold tracking-tight text-foreground">
          Sign up
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Create an account with email and password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
            {emailError ? (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">At least 8 characters</p>
            {passwordError ? (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
