import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import users from "@/data/users.json";

export async function POST(req: Request) {
  const { login, password } = await req.json();

  const user = (users as any)[login];
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid login" }), {
      status: 401,
    });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
    });
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const token = await new SignJWT({ login, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("7d")
    .sign(secret);

  return new Response(JSON.stringify({ token }), { status: 200 });
}
