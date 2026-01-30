"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLogin, setUserLogin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsLoggedIn(true);
        setUserLogin(payload.login);
        setIsAdmin(payload.isAdmin || false);
      } catch (e) {
        setIsLoggedIn(false);
      }
    }

    fetch("/api/subjects")
      .then(r => r.json())
      .then(data => {
        setSubjects(data);
        if (data.length > 0) {
          setSelectedFile(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserLogin("");
    setIsAdmin(false);
    router.refresh();
  };

  const handleStartTraining = () => {
    if (selectedFile) {
      router.push(`/train?file=${selectedFile}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <div className="text-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black/[.08] border-t-black dark:border-white/[.145] dark:border-t-white mx-auto mb-4"></div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex items-center justify-between w-full mb-8">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <div className="flex items-center gap-3 flex-wrap">
            {isLoggedIn && (
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {userLogin}
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline underline-offset-2"
                >
                  Личный кабинет
                </button>
              </>
            )}
            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm text-black dark:text-white font-medium"
              >
                Панель управления
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full mb-8">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Выберите тему и начните тренировку
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Выберите набор вопросов и начните практику.
          </p>
        </div>

        <div className="w-full space-y-4 mb-8">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedFile(subject.id)}
              className={`w-full rounded-xl border border-solid transition-colors flex items-center ${
                selectedFile === subject.id
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/[.08] hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
              }`}
            >
              <div className="flex items-center justify-between w-full p-6">
                <div className="flex flex-col justify-center flex-1">
                  <div className="font-medium text-lg mb-1">{subject.name}</div>
                  <div className="text-base opacity-60">
                    {subject.questionCount} вопросов
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 ${
                  selectedFile === subject.id 
                    ? "border-current" 
                    : "border-black/[.08] dark:border-white/[.145]"
                }`}>
                  {selectedFile === subject.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 text-base font-medium w-full sm:flex-row">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            >
              Logout
            </button>
          ) : (
            <a
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              href="/login"
            >
              Login
            </a>
          )}
          <button
            onClick={handleStartTraining}
            disabled={!selectedFile}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed md:w-[158px]"
          >
            Начать
          </button>
        </div>
      </main>
    </div>
  );
}