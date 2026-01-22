// app/train/page.tsx - ОБНОВЛЁННАЯ версия
"use client";

import { useEffect, useState } from "react";
import { similarity } from "@/lib/similarity";
import { useSearchParams } from "next/navigation";

export default function TrainPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const file = searchParams.get("file") || "terms";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/terms?file=${file}`)
      .then(r => r.json())
      .then(data => {
        setTerms(shuffle(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [file]); // Ключевое изменение - добавлена зависимость от file

  useEffect(() => {
    const input = document.querySelector("input");
    if (input && !loading) {
      input.focus();
    }
  }, [index, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 text-white p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-zinc-400">Загрузка вопросов...</p>
          <p className="text-sm text-zinc-500">Тема: {getFileName(file)}</p>
        </div>
      </div>
    );
  }

  if (!terms.length && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 text-white p-4">
        <div className="max-w-xl w-full text-center space-y-6">
          <h1 className="text-3xl font-semibold">✓ Поздравляем!</h1>
          <p className="text-xl text-zinc-300">Вы ответили на все вопросы по теме "{getFileName(file)}"!</p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => window.location.href = "/select"}
              className="flex-1 py-3 px-6 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors"
            >
              Выбрать другую тему
            </button>
            <button
              onClick={() => {
                setIndex(0);
                setAnswer("");
                setResult(null);
                setTerms(shuffle(terms));
              }}
              className="flex-1 py-3 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-colors"
            >
              Начать заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = terms[index];

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 text-white p-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="flex justify-between items-center text-sm">
          <div className="text-zinc-400">
            Вопрос {index + 1} из {terms.length}
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 text-xs">
            {getFileName(file)}
          </div>
        </div>

        <h1 className="text-3xl font-semibold leading-tight">
          {current.question}
        </h1>

        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите ответ"
          autoFocus
        />

        <button
          onClick={check}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-200"
        >
          Проверить ответ
        </button>

        {result !== null && (
          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className={`text-lg font-medium ${result >= 0.85 ? "text-green-400" : "text-red-400"}`}>
              {result >= 0.85 ? "✓ Правильно!" : "Попробуйте ещё раз"}
            </div>
            <div className="text-sm text-zinc-400">
              Схожесть: {(result * 100).toFixed(1)}%
            </div>
            <div className="text-sm">
              <span className="text-zinc-400">Правильный ответ:</span>{" "}
              <span className="text-white">{current.answer}</span>
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
            className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
          >
            Следующий вопрос
          </button>
        )}
      </div>
    </div>
  );
}

function shuffle(arr: any[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getFileName(file: string) {
  switch(file) {
    case "termscn": return "Компьютерные сети";
    case "terms": return "Английский язык";
    default: return "ОБЖ";
  }
}