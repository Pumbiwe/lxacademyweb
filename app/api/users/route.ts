import bcrypt from "bcryptjs";
import { getUsersData, saveUsersData } from "@/lib/db";
import { verifyToken, getBearerToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = getBearerToken(req);
  const payload = await verifyToken(token);
  if (!payload?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const users = await getUsersData();
    const list = Object.entries(users).map(([login, u]) => ({
      login,
      isAdmin: u.isAdmin,
    }));
    return Response.json(list);
  } catch (error) {
    console.error("Users GET error:", error);
    return Response.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  const payload = await verifyToken(token);
  if (!payload?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { login, password, isAdmin } = await req.json();
    if (!login || !password || typeof login !== "string" || typeof password !== "string") {
      return Response.json({ error: "Логин и пароль обязательны" }, { status: 400 });
    }
    const loginSanitized = login.slice(0, 64).trim();
    if (!loginSanitized) {
      return Response.json({ error: "Некорректный логин" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Пароль не менее 6 символов" }, { status: 400 });
    }
    const users = await getUsersData();
    if (users[loginSanitized]) {
      return Response.json({ error: "Пользователь уже существует" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    users[loginSanitized] = { password: hashed, isAdmin: !!isAdmin };
    await saveUsersData(users);
    return Response.json({ success: true, login: loginSanitized });
  } catch (error) {
    console.error("Users POST error:", error);
    return Response.json({ error: "Ошибка создания пользователя" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const token = getBearerToken(req);
  const payload = await verifyToken(token);
  if (!payload?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const login = searchParams.get("login");
    if (!login || typeof login !== "string") {
      return Response.json({ error: "Укажите логин" }, { status: 400 });
    }
    const loginSanitized = login.slice(0, 64).trim();
    if (!loginSanitized) {
      return Response.json({ error: "Некорректный логин" }, { status: 400 });
    }
    if (loginSanitized === payload.login) {
      return Response.json({ error: "Нельзя удалить самого себя" }, { status: 400 });
    }
    const users = await getUsersData();
    if (!users[loginSanitized]) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    delete users[loginSanitized];
    await saveUsersData(users);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Users DELETE error:", error);
    return Response.json({ error: "Ошибка удаления пользователя" }, { status: 500 });
  }
}
