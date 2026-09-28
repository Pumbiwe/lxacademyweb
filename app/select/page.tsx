// app/select/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState("termsobj");

  const files = [
    { 
      id: "termsobj", 
      name: "ОБЖ и военная подготовка", 
      description: "28 вопросов по основам безопасности жизнедеятельности",
    },
    { 
      id: "termscn", 
      name: "Компьютерные сети", 
      description: "   47 вопросов по сетевым технологиям и протоколам",
    },
    { 
      id: "terms", 
      name: "Английский язык", 
      description: "   29 вопросов по техническому английскому",
    },
  ];

  const handleStartTraining = () => {
    router.push(`/train?file=${selectedFile}`);
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center p-4 sm:p-8 font-sans">
      <main className="page-panel flex w-full max-w-3xl flex-col items-center gap-8 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Выберите тему для тренировки
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Выберите набор вопросов и начните практику.
          </p>
        </div>

<div className="w-full space-y-4">
  {files.map((file) => (
    <button
      key={file.id}
      onClick={() => setSelectedFile(file.id)}
      className={`w-full rounded-xl border border-solid transition-colors flex items-center ${
        selectedFile === file.id
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-white/[.145] hover:bg-white/18"
      }`}
    >
      <div className="flex items-center justify-between w-full p-6">
        <div className="flex flex-col justify-center">
          <div className="font-medium text-lg">{file.name}</div>
          <div className="text-base opacity-60 mt-1">{file.description}</div>
        </div>
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 ${
          selectedFile === file.id 
            ? "border-current" 
            : "border-black/[.08] dark:border-white/[.145]"
        }`}>
          {selectedFile === file.id && (
            <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
          )}
        </div>
      </div>
    </button>
  ))}
</div>

        <div className="flex flex-col gap-4 text-base font-medium w-full sm:flex-row">
          <button
            onClick={() => router.push("/")}
            className="btn-ghost flex h-12 w-full items-center justify-center rounded-full px-5 md:w-[158px]"
          >
            Назад
          </button>
          <button
            onClick={handleStartTraining}
            className="btn-gradient flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 md:w-[158px]"
          >
            Начать
          </button>
        </div>
      </main>
    </div>
  );
}