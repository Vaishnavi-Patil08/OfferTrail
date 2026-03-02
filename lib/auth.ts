import { cookies } from "next/headers";

import { verifyToken } from "@/lib/jwt";

export type { TokenPayload } from "@/lib/jwt";
export { signToken, verifyToken } from "@/lib/jwt";

/** Server-only: read auth cookie and return session or null. */
export async function getSession(): Promise<{ userId: string } | null> {
  const store = await cookies();
  const token = store.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
