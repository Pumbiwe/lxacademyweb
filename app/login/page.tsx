"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { decodeJwtPayload } from "@/lib/jwtPayload";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        setError("Ошибка при обработке ответа сервера");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        setLoading(false);
        return;
      }

      if (!data.token) {
        setError("Токен не получен");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);

      const payload = decodeJwtPayload(data.token);
      if (payload?.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Ошибка соединения. Проверьте подключение к интернету.");
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submit(e);
    }
  };

  return (
    <div className="page-shell min-h-screen flex items-center justify-center p-4 sm:p-8 font-sans">
      <main className="page-panel flex w-full max-w-md flex-col items-center text-center">
        <div className="w-full">
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => router.push("/")}
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Logo"
                width={80}
                height={16}
                priority
              />
            </button>
          </div>
          <div className="w-full space-y-6">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">Login</h1>

            <form onSubmit={submit}>
              <div className="space-y-6">
                <input
                  className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Логин"
                />

                <input
                  className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="password"
                  placeholder="Пароль"
                />

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                )}

                {/* Кнопки */}
                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gradient flex h-12 w-full items-center justify-center rounded-full font-medium disabled:opacity-60"
                  >
                    {loading ? "Вход..." : "Login"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="btn-ghost flex h-12 w-full items-center justify-center rounded-full px-5"
                  >
                    Назад
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}