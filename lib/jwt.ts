import { SignJWT, jwtVerify } from "jose";

const TOKEN_EXPIRY = "24h";

function getSecret(): Uint8Array {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET?.length) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(JWT_SECRET);
}

export type TokenPayload = { userId: string };

export async function signToken(payload: TokenPayload): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;
    if (typeof userId !== "string") return null;
    return { userId };
  } catch {
    return null;
  }
}
