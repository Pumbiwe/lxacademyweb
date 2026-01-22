"use client";

import { useEffect, useState } from "react";
import { similarity } from "@/lib/similarity";

export default function TrainPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/terms")
      .then(r => r.json())
      .then(data => setTerms(shuffle(data)));
  }, []);

  if (!terms.length) return null;

  const current = terms[index];

  function check() {
    const score = similarity(
      answer.toLowerCase(),
      current.answer.toLowerCase()
    );
    setResult(score);

    // если ответ правильный — сразу следующий
    if (score >= 0.85) {
      setTimeout(() => {
        setIndex(i => i + 1);
        setAnswer("");
        setResult(null);
      }, 400); // небольшой эффект задержки
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-3xl font-semibold">
          {current.question}
        </h1>

        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Введите ответ"
        />

        <button
          onClick={check}
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          Проверить
        </button>

        {result !== null && (
          <div className="text-sm text-zinc-400">
            {result >= 0.85 ? "✅ Успех" : "❌ Неверно"} <br />
            Схожесть: {(result * 100).toFixed(1)}% <br />
            Правильно: {current.answer}
          </div>
        )}

        {result !== null && result < 0.85 && (
          <button
            onClick={() => {
              setIndex(i => i + 1);
              setAnswer("");
              setResult(null);
            }}
            className="flex h-12 w-full items-center justify-center rounded-full bg-black border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04]"
          >
            Следующий
          </button>
        )}
      </div>
    </div>
  );
}

function shuffle(arr: any[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}
