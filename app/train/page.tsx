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

  // ... остальной код компонента без изменений ...
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