import bcrypt from "bcryptjs";
import { getUsersData } from "@/lib/db";
import { createToken } from "@/lib/auth";

const DUMMY_HASH =
  "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV";

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    if (!login || !password || typeof login !== "string" || typeof password !== "string") {
      return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const loginSanitized = login.slice(0, 64).trim();
    if (!loginSanitized) {
      return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const users = await getUsersData();
    const user = users[loginSanitized];
    let isValid = false;
    let isAdmin = false;

    if (user) {
      isValid = await bcrypt.compare(password, user.password);
      isAdmin = user.isAdmin || false;
    } else {
      await bcrypt.compare(password, DUMMY_HASH);
    }

    if (!isValid) {
      return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const token = await createToken({ login: loginSanitized, isAdmin });
    return Response.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Login API error:", error);
    return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
}
