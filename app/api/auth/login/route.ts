import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import users from "@/data/users.json";

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return Response.json({ error: "Логин и пароль обязательны" }, { status: 400 });
    }

    const user = (users as any)[login];
    if (!user) {
      return Response.json({ error: "Неверный логин" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return Response.json({ error: "Неверный пароль" }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set");
      return Response.json({ error: "Ошибка конфигурации сервера" }, { status: 500 });
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({ login, isAdmin: user.isAdmin })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("7d")
      .sign(secret);

    return Response.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Login API error:", error);
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
