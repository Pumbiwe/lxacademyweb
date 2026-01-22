// app/train/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { similarity } from "@/lib/similarity";
import { useSearchParams, useRouter } from "next/navigation";

function TrainContent() {
  const router = useRouter();
  const [terms, setTerms] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const file = searchParams.get("file") || "termsobj";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/terms?file=${file}`)
      .then(r => r.json())
      .then(data => {
        setTerms(shuffle(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [file]);

  useEffect(() => {
    const input = document.querySelector("input");
    if (input && !loading) {
      input.focus();
    }
  }, [index, loading]);

  if (loading) {
    return <LoadingScreen file={file} />;
  }

  // Проверяем, закончились ли вопросы ДО попытки обратиться к current
  if (terms.length === 0) {
    return <CompletionScreen file={file} router={router} />;
  }

  // Проверяем, существует ли текущий вопрос
  const current = terms[index];
  
  if (!current) {
    // Если индекса нет, значит вопросы закончились
    return <CompletionScreen file={file} router={router} />;
  }

  function check() {
    const score = similarity(
      answer.trim().toLowerCase(),
      current.answer.toLowerCase()
    );
    setResult(score);

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
    setIndex(i => i + 1);
    setAnswer("");
    setResult(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="flex justify-between items-center text-sm mb-6">
            <div className="text-zinc-600 dark:text-zinc-400">
              Вопрос {index + 1} из {terms.length}
            </div>
            <div className="px-3 py-1 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] text-xs">
              {getFileName(file)}
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

          {result !== null && result < 1 && (
            <button
              onClick={() => {
                setIndex(i => i + 1);
                setAnswer("");
                setResult(null);
              }}
              className="w-full py-3 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Следующий вопрос
            </button>
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

function CompletionScreen({ file, router }: { file: string; router: any }) {
  const [shuffledTerms, setShuffledTerms] = useState<any[]>([]);

  const handleRestart = () => {
    // Нужно получить вопросы заново и перемешать
    fetch(`/api/terms?file=${file}`)
      .then(r => r.json())
      .then(data => {
        window.location.reload(); // Простой способ перезапустить
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            ✓ Тренировка завершена
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Вы ответили на все вопросы по теме "{getFileName(file)}".
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium w-full sm:flex-row">
          <button
            onClick={() => router.push("/select")}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Выбрать другую тему
          </button>
          <button
            onClick={handleRestart}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
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