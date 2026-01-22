"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    router.push("/train");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-3xl font-semibold">Login</h1>

        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          value={login}
          onChange={e => setLogin(e.target.value)}
          placeholder="Логин"
        />

        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          placeholder="Пароль"
        />

        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}

        {/* Кнопки */}
        <div className="flex flex-col gap-4">
          <button
            onClick={submit}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-white text-black px-5 transition-colors hover:bg-zinc-100 disabled:opacity-60"
          >
            {loading ? "Вход..." : "Login"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04]"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
