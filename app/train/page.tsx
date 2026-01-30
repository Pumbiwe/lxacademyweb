// app/train/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { similarity } from "@/lib/similarity";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

interface ErrorRecord {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  similarity: number;
}

function TrainContent() {
  const router = useRouter();
  const [terms, setTerms] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [skipped, setSkipped] = useState(0);
  
  const searchParams = useSearchParams();
  const file = searchParams.get("file") || "termsobj";
  const modeErrors = searchParams.get("mode") === "errors";
  const errorsKey = `train_errors_${file}`;

  useEffect(() => {
    setLoading(true);
    if (modeErrors) {
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem(errorsKey) : null;
        const parsed = raw ? JSON.parse(raw) : null;
        const list = Array.isArray(parsed) ? parsed : [];
        const termsFromErrors = list
          .filter((x: any) => x && typeof x.question === "string" && typeof x.answer === "string")
          .map((x: any) => ({ question: x.question, answer: x.answer }));
        const shuffled = termsFromErrors.length > 0 ? shuffle(termsFromErrors) : [];
        setTerms(shuffled);
        setIndex(0);
        setAnswer("");
        setResult(null);
        setErrors([]);
        setSkipped(0);
      } catch {
        setTerms([]);
      }
      setLoading(false);
      return;
    }
    fetch(`/api/terms?file=${file}`)
      .then(r => r.json())
      .then(data => {
        setTerms(shuffle(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [file, modeErrors, errorsKey]);

  useEffect(() => {
    const input = document.querySelector("input");
    if (input && !loading) {
      input.focus();
    }
  }, [index, loading]);

  if (loading) {
    return <LoadingScreen file={file} />;
  }

  // Режим "только ошибки": если нет сохранённых ошибок — показываем экран "нет ошибок"
  if (modeErrors && terms.length === 0 && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
          <div className="w-full text-center sm:text-left">
            <button onClick={() => router.push("/")} className="hover:opacity-80 transition-opacity mb-6">
              <Image className="dark:invert" src="/next.svg" alt="Logo" width={80} height={16} priority />
            </button>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-2">Нет сохранённых ошибок</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Пройдите тренировку по теме и ответьте с ошибками — затем можно будет потренироваться только по ним.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-5 py-3 hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
            >
              На главную
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Проверяем, закончились ли вопросы ДО попытки обратиться к current
  if (terms.length === 0) {
    return <CompletionScreen file={file} router={router} errors={errors} skipped={skipped} />;
  }

  // Проверяем, существует ли текущий вопрос
  const current = terms[index];
  
  if (!current) {
    // Если индекса нет, значит вопросы закончились
    return <CompletionScreen file={file} router={router} errors={errors} skipped={skipped} />;
  }

  function check() {
    const score = similarity(
      answer.trim().toLowerCase(),
      current.answer.toLowerCase()
    );
    setResult(score);

    if (score < 0.85) {
      // Записываем ошибку
      setErrors(prev => [...prev, {
        question: current.question,
        userAnswer: answer.trim(),
        correctAnswer: current.answer,
        similarity: score,
      }]);
    }

    if (score >= 1) {
      setTimeout(() => {
        setIndex(i => i + 1);
        setAnswer("");
        setResult(null);
      }, 400);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      check();
    }
  }

  function handleSkip() {
    setSkipped(prev => prev + 1);
    setIndex(i => i + 1);
    setAnswer("");
    setResult(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Вопрос {index + 1} из {terms.length}
              </div>
              <div className="px-3 py-1 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] text-xs">
                {getFileName(file)}
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold leading-tight text-black dark:text-zinc-50 mb-6">
            {current.question}
          </h1>

          <input
            className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите ответ"
            autoFocus
          />

          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={check}
              className="w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors"
            >
              Проверить ответ
            </button>
            
            <button
              onClick={handleSkip}
              className="w-full py-3 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm"
            >
              Пропустить вопрос
            </button>
          </div>

          {result !== null && (
            <div className="space-y-3 p-4 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] mb-6">
              <div className={`font-medium ${result >= 0.85 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {result >= 0.85 ? "✓ Правильно!" : "Попробуйте ещё раз"}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Схожесть: {(result * 100).toFixed(1)}%
              </div>
              <div className="text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Правильный ответ:</span>{" "}
                <span className="text-black dark:text-white">{current.answer}</span>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Отдельные компоненты для экранов загрузки и завершения
function LoadingScreen({ file }: { file: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="text-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-black/[.08] border-t-black dark:border-white/[.145] dark:border-t-white mx-auto mb-4"></div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Загрузка вопросов...</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
            {getFileName(file)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CompletionScreen({ file, router, errors, skipped }: { file: string; router: any; errors: ErrorRecord[]; skipped: number }) {
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (errors.length === 0 || typeof window === "undefined") return;
    try {
      const errorsForRetry = errors.map((e) => ({ question: e.question, answer: e.correctAnswer }));
      sessionStorage.setItem(`train_errors_${file}`, JSON.stringify(errorsForRetry));
    } catch (_) {}
  }, [file, errors]);

  const handleRestart = () => {
    window.location.reload();
  };

  const handleTrainErrors = () => {
    router.push(`/train?file=${encodeURIComponent(file)}&mode=errors`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="mb-6">
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

          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full mb-8">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              ✓ Тренировка завершена
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Вы ответили на все вопросы по теме "{getFileName(file)}".
            </p>
          </div>

          {/* Статистика */}
          <div className="w-full space-y-4 mb-8">
            <div className="p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145]">
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">Статистика</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Ошибок допущено:</span>
                  <span className="text-lg font-medium text-black dark:text-zinc-50">{errors.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Пропущено вопросов:</span>
                  <span className="text-lg font-medium text-black dark:text-zinc-50">{skipped}</span>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Ошибки</h2>
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {showErrors ? "Скрыть" : "Показать"}
                  </button>
                </div>
                {showErrors && (
                  <div className="space-y-4 mt-4">
                    {errors.map((error, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                        <div className="font-medium text-sm text-red-900 dark:text-red-300 mb-2">{error.question}</div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Ваш ответ: </span>
                            <span className="text-red-700 dark:text-red-400">{error.userAnswer || "(пусто)"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Правильный ответ: </span>
                            <span className="text-green-700 dark:text-green-400">{error.correctAnswer}</span>
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            Схожесть: {(error.similarity * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium w-full sm:flex-row flex-wrap">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] sm:w-auto sm:min-w-[140px]"
          >
            На главную
          </button>
          {errors.length > 0 && (
            <button
              onClick={handleTrainErrors}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-600 text-white px-5 transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 sm:w-auto sm:min-w-[200px]"
            >
              Тренироваться по ошибкам
            </button>
          )}
          <button
            onClick={handleRestart}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] sm:w-auto sm:min-w-[140px]"
          >
            Начать заново
          </button>
        </div>
      </main>
    </div>
  );
}

function shuffle(arr: any[]) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function getFileName(file: string) {
  switch(file) {
    case "termscn": return "Компьютерные сети";
    case "terms": return "Английский язык";
    default: return "ОБЖ";
  }
}

export default function TrainPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <div className="text-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black/[.08] border-t-black dark:border-white/[.145] dark:border-t-white mx-auto mb-4"></div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">Загрузка...</p>
          </div>
        </div>
      </div>
    }>
      <TrainContent />
    </Suspense>
  );
}