// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Subject {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

interface Question {
  question: string;
  answer: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.isAdmin) {
        router.replace("/");
        return;
      }
      
      setIsLoading(false);
      loadSubjects();
    } catch (e) {
      router.replace("/");
    }
  }, [router]);

  const loadSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id);
        loadQuestions(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load subjects", error);
    }
  };

  const loadQuestions = async (subjectId: string) => {
    try {
      const res = await fetch(`/api/terms?file=${subjectId}`);
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to load questions", error);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setEditingQuestion(null);
    setShowAddForm(false);
    loadQuestions(subjectId);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowAddForm(false);
    setNewQuestion(question.question);
    setNewAnswer(question.answer);
  };

  const handleSave = async () => {
    if (!selectedSubject || !newQuestion.trim() || !newAnswer.trim()) return;

    setLoading(true);
    try {
      if (editingQuestion) {
        // Update existing question
        const res = await fetch("/api/subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId: selectedSubject,
            oldQuestion: editingQuestion.question,
            newQuestion: newQuestion.trim(),
            newAnswer: newAnswer.trim(),
          }),
        });

        if (!res.ok) throw new Error("Failed to update");
      } else {
        // Add new question
        const res = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId: selectedSubject,
            question: newQuestion.trim(),
            answer: newAnswer.trim(),
          }),
        });

        if (!res.ok) throw new Error("Failed to add");
      }

      setNewQuestion("");
      setNewAnswer("");
      setEditingQuestion(null);
      setShowAddForm(false);
      loadQuestions(selectedSubject);
    } catch (error) {
      console.error("Failed to save", error);
      alert("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (question: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот вопрос?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/subjects?subjectId=${selectedSubject}&question=${encodeURIComponent(question)}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      loadQuestions(selectedSubject);
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Ошибка при удалении");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingQuestion(null);
    setShowAddForm(false);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleExportSubject = async (subjectId: string) => {
    try {
      const res = await fetch(`/api/subjects/manage?subjectId=${subjectId}`);
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${subjectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export", error);
      alert("Ошибка при экспорте");
    }
  };

  const handleImportSubject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.id || !data.name) {
        alert("Неверный формат файла");
        return;
      }

      const res = await fetch("/api/subjects/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: data.id,
          name: data.name,
          description: data.description || "",
          questions: data.questions || {},
        }),
      });

      if (!res.ok) throw new Error("Failed to import");

      await loadSubjects();
      if (data.id) {
        setSelectedSubject(data.id);
        loadQuestions(data.id);
      }
      alert("Предмет успешно импортирован");
    } catch (error) {
      console.error("Failed to import", error);
      alert("Ошибка при импорте");
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectId.trim() || !newSubjectName.trim()) {
      alert("Заполните ID и название предмета");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subjects/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newSubjectId.trim(),
          name: newSubjectName.trim(),
          description: newSubjectDescription.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }

      setNewSubjectId("");
      setNewSubjectName("");
      setNewSubjectDescription("");
      setShowAddSubjectForm(false);
      await loadSubjects();
      setSelectedSubject(newSubjectId.trim());
      loadQuestions(newSubjectId.trim());
    } catch (error: any) {
      console.error("Failed to create subject", error);
      alert(error.message || "Ошибка при создании предмета");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm(`Вы уверены, что хотите удалить предмет "${subjects.find(s => s.id === subjectId)?.name}"? Это действие нельзя отменить.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/manage?subjectId=${subjectId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      await loadSubjects();
      if (subjects.length > 1) {
        const remainingSubjects = subjects.filter(s => s.id !== subjectId);
        if (remainingSubjects.length > 0) {
          setSelectedSubject(remainingSubjects[0].id);
          loadQuestions(remainingSubjects[0].id);
        } else {
          setSelectedSubject("");
          setQuestions([]);
        }
      } else {
        setSelectedSubject("");
        setQuestions([]);
      }
    } catch (error) {
      console.error("Failed to delete subject", error);
      alert("Ошибка при удалении предмета");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/[.145] border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <div className="border-b border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm text-black dark:text-white"
            >
              На главную
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm text-black dark:text-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-black dark:text-zinc-50 mb-2">
            Админ-панель
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Управление вопросами и ответами
          </p>
        </div>

        {/* Subject Management */}
        <div className="mb-8 p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-black dark:text-zinc-50">
              Управление предметами
            </label>
            <div className="flex gap-3">
              <label className="px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm text-black dark:text-white cursor-pointer">
                Импорт
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSubject}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowAddSubjectForm(!showAddSubjectForm)}
                className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors text-sm"
              >
                + Новый предмет
              </button>
            </div>
          </div>

          {/* Add Subject Form */}
          {showAddSubjectForm && (
            <div className="mb-6 p-4 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] bg-zinc-50 dark:bg-zinc-950">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-black dark:text-zinc-50 mb-1">
                    ID предмета (латиница, без пробелов)
                  </label>
                  <input
                    type="text"
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-sm text-black dark:text-white"
                    placeholder="например: newsubject"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black dark:text-zinc-50 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-sm text-black dark:text-white"
                    placeholder="Название предмета"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black dark:text-zinc-50 mb-1">
                    Описание
                  </label>
                  <input
                    type="text"
                    value={newSubjectDescription}
                    onChange={(e) => setNewSubjectDescription(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-sm text-black dark:text-white"
                    placeholder="Описание предмета"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateSubject}
                    disabled={loading || !newSubjectId.trim() || !newSubjectName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors text-sm disabled:opacity-50"
                  >
                    Создать
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubjectForm(false);
                      setNewSubjectId("");
                      setNewSubjectName("");
                      setNewSubjectDescription("");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm text-black dark:text-white"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subject Selector */}
          <div className="flex flex-wrap gap-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className={`group relative px-4 py-2 rounded-xl border border-solid transition-colors text-sm ${
                  selectedSubject === subject.id
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
                }`}
              >
                <button
                  onClick={() => handleSubjectChange(subject.id)}
                  className="pr-8"
                >
                  {subject.name} ({subject.questionCount})
                </button>
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportSubject(subject.id);
                    }}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    title="Экспорт"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubject(subject.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                    title="Удалить"
                  >
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedSubject && (
          <>
            {/* Add/Edit Form */}
            {(showAddForm || editingQuestion) && (
              <div className="mb-8 p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                  {editingQuestion ? "Редактировать вопрос" : "Добавить вопрос"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                      Вопрос
                    </label>
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white"
                      placeholder="Введите вопрос"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                      Ответ
                    </label>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={3}
                      className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white resize-none"
                      placeholder="Введите ответ"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={loading || !newQuestion.trim() || !newAnswer.trim()}
                      className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Сохранение..." : "Сохранить"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-black dark:text-white disabled:opacity-50"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Button */}
            {!showAddForm && !editingQuestion && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingQuestion(null);
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors"
                >
                  + Добавить вопрос
                </button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black text-center text-zinc-600 dark:text-zinc-400">
                  Нет вопросов. Добавьте первый вопрос.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black hover:border-black/[.16] dark:hover:border-white/[.24] transition-colors"
                  >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-black dark:text-zinc-50 mb-2">
                        {q.question}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {q.answer}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(q)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-sm text-black dark:text-white disabled:opacity-50"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(q.question)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-solid border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm text-red-600 dark:text-red-400 disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
