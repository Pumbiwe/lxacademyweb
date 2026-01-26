"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Ошибка входа");
      setLoading(false);
      return;
    }

    localStorage.setItem("token", data.token);
    
    // Декодируем токен для проверки isAdmin
    try {
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      if (payload.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (e) {
      router.push("/");
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="mb-8">
            <button
              onClick={() => router.push("/")}
              className="hover:opacity-80 transition-opacity mb-6"
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
          <div className="max-w-xl w-full space-y-6">
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
                    className="flex h-12 w-full items-center justify-center rounded-full bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors disabled:opacity-60"
                  >
                    {loading ? "Вход..." : "Login"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
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