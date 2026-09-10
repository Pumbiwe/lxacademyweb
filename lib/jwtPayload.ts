export type ClientJwtPayload = { login: string; isAdmin: boolean };

export function decodeJwtPayload(token: string): ClientJwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return {
      login: String(payload.login ?? ""),
      isAdmin: !!payload.isAdmin,
    };
  } catch {
    return null;
  }
}
