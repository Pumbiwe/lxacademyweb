// lib/auth.ts
import * as jose from "jose";

// В продакшене обязательно задайте JWT_SECRET в переменных окружения (длинная случайная строка).
const JWT_SECRET = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-in-production"
  );

export type JWTPayload = { login: string; isAdmin: boolean };

export async function verifyToken(token: string | null): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET());
}

export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
