import bcrypt from "bcryptjs";
import { getUsersData, saveUsersData } from "@/lib/db";
import { verifyToken, getBearerToken } from "@/lib/auth";

export async function POST(req: Request) {
  const token = getBearerToken(req);
  const payload = await verifyToken(token);
  if (!payload?.login) {
    return Response.json({ error: "Необходима авторизация" }, { status: 401 });
  }
  try {
    const { currentPassword, newPassword } = await req.json();
    if (
      !currentPassword ||
      !newPassword ||
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return Response.json({ error: "Укажите текущий и новый пароль" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: "Новый пароль не менее 6 символов" }, { status: 400 });
    }
    const login = payload.login;
    const users = await getUsersData();
    const user = users[login];
    if (!user) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return Response.json({ error: "Неверный текущий пароль" }, { status: 401 });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    users[login] = { ...user, password: hashed };
    await saveUsersData(users);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json({ error: "Ошибка смены пароля" }, { status: 500 });
  }
}
