import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import users from "@/data/users.json";

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    // Всегда выполняем проверку пароля для одинакового времени ответа
    // Это предотвращает перебор логинов по времени ответа
    const user = (users as any)[login];
    let isValid = false;
    let isAdmin = false;

    if (user) {
      isValid = await bcrypt.compare(password, user.password);
      isAdmin = user.isAdmin || false;
    } else {
      // Если пользователя нет, все равно выполняем bcrypt.compare для одинакового времени
      // Используем фиктивный хеш для предотвращения timing attack
      const dummyHash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV";
      await bcrypt.compare(password, dummyHash);
    }

    if (!isValid) {
      return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    // Используем дефолтный секрет, если не установлен (с предупреждением)
    const jwtSecret = process.env.JWT_SECRET || "default-secret-key-change-in-production";
    
    if (!process.env.JWT_SECRET) {
      console.warn("⚠️  WARNING: JWT_SECRET is not set! Using default secret. This is insecure for production!");
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({ login, isAdmin })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("7d")
      .sign(secret);

    return Response.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Login API error:", error);
    return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
}
