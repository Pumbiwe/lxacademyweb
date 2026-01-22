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

  useEffect(() => {
    // Фокус на поле ввода при смене вопроса
    const input = document.querySelector("input");
    if (input) {
      input.focus();
    }
  }, [index]);

  if (!terms.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  const current = terms[index];

  // Если вопросы закончились
  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="max-w-xl w-full text-center space-y-6">
          <h1 className="text-3xl font-semibold">✓ Поздравляем!</h1>
          <p className="text-xl">Вы ответили на все вопросы!</p>
          <button
            onClick={() => {
              setIndex(0);
              setAnswer("");
              setResult(null);
              setTerms(shuffle(terms)); // Перемешать заново
            }}
            className="bg-white text-black px-6 py-3 rounded-xl w-full"
          >
            Начать заново
          </button>
        </div>
      </div>
    );
  }

  function check() {
    const score = similarity(
      answer.toLowerCase(),
      current.answer.toLowerCase()
    );
    setResult(score);

    // переход только если 100%
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-sm text-zinc-400 text-center">
          Вопрос {index + 1} из {terms.length}
        </div>

        <h1 className="text-3xl font-semibold">
          {current.question}
        </h1>

        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите ответ"
        />

        <button
          onClick={check}
          className="bg-white text-black px-4 py-2 rounded-xl w-full"
        >
          Проверить
        </button>

        {result !== null && (
          <div className="text-sm text-zinc-400 space-y-2">
            <div className={result >= 0.85 ? "text-green-400" : "text-red-400"}>
              {result >= 0.85 ? "✓ Правильно!" : "Неверно"}
            </div>
            <div>Схожесть: {(result * 100).toFixed(1)}%</div>
            <div>Правильно: {current.answer}</div>
          </div>
        )}

        {result !== null && result < 1 && (
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