"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
      return;
    }
    try {
      JSON.parse(atob(token.split(".")[1]));
      setIsLoggedIn(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setError("Новый пароль не менее 6 символов");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка смены пароля");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full max-w-md">
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

          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-2">
            Сменить пароль
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
            Введите текущий пароль и новый пароль (не менее 6 символов).
          </p>

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
              Пароль успешно изменён.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                Текущий пароль
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                placeholder="Текущий пароль"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                placeholder="Новый пароль (не менее 6 символов)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                Подтвердите новый пароль
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                placeholder="Повторите новый пароль"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] disabled:opacity-50"
              >
                {loading ? "Сохранение..." : "Сменить пароль"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
              >
                На главную
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
