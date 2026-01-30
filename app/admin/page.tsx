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

type AdminTab = "subjects" | "users" | "analytics";

interface UserItem {
  login: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("subjects");
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
  const [showImportText, setShowImportText] = useState(false);
  const [importText, setImportText] = useState("");
  const [importTextError, setImportTextError] = useState("");
  // Пользователи
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [userError, setUserError] = useState("");
  // Аналитика
  const [stats, setStats] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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

  useEffect(() => {
    if (activeTab === "users" && !isLoading) loadUsers();
  }, [activeTab, isLoading]);

  useEffect(() => {
    if (activeTab === "analytics" && !isLoading) loadStats();
  }, [activeTab, isLoading]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users", { headers: getAuthHeaders() });
      if (res.status === 403) {
        router.replace("/");
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/stats", { headers: getAuthHeaders() });
      if (res.status === 403) {
        router.replace("/");
        return;
      }
      const data = await res.json();
      setStats(data && typeof data === "object" ? data : {});
    } catch {
      setStats({});
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteUser = async (login: string) => {
    if (!confirm(`Удалить пользователя «${login}»?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users?login=${encodeURIComponent(login)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ошибка удаления");
        return;
      }
      loadUsers();
    } catch {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    if (!newUserLogin.trim() || !newUserPassword.trim()) {
      setUserError("Введите логин и пароль");
      return;
    }
    if (newUserPassword.length < 6) {
      setUserError("Пароль не менее 6 символов");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          login: newUserLogin.trim(),
          password: newUserPassword,
          isAdmin: newUserIsAdmin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserError(data.error || "Ошибка создания");
        return;
      }
      setNewUserLogin("");
      setNewUserPassword("");
      setNewUserIsAdmin(false);
      loadUsers();
    } catch {
      setUserError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

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

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update");
        }
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

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to add");
        }
      }

      setNewQuestion("");
      setNewAnswer("");
      setEditingQuestion(null);
      setShowAddForm(false);
      loadQuestions(selectedSubject);
    } catch (error: any) {
      console.error("Failed to save", error);
      alert(error.message || "Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (question: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects?subjectId=${selectedSubject}&question=${encodeURIComponent(question)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      loadQuestions(selectedSubject);
    } catch (error: any) {
      console.error("Failed to delete", error);
      alert(error.message || "Ошибка при удалении");
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to import");
      }

      await loadSubjects();
      if (data.id) {
        setSelectedSubject(data.id);
        loadQuestions(data.id);
      }
      alert("Предмет успешно импортирован");
    } catch (error: any) {
      console.error("Failed to import", error);
      alert(error.message || "Ошибка при импорте");
    }
  };

  const handleImportFromText = async () => {
    setImportTextError("");
    const text = importText.trim();
    if (!text) {
      setImportTextError("Вставьте JSON в поле выше");
      return;
    }
    try {
      const data = JSON.parse(text);
      if (!data.id || !data.name) {
        setImportTextError("В JSON должны быть поля id и name");
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка импорта");
      }
      await loadSubjects();
      setSelectedSubject(data.id);
      loadQuestions(data.id);
      setImportText("");
      setImportTextError("");
      setShowImportText(false);
      alert("Предмет успешно импортирован");
    } catch (error: any) {
      setImportTextError(error.message || "Неверный JSON или ошибка сервера");
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }

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
    } catch (error: any) {
      console.error("Failed to delete subject", error);
      alert(error.message || "Ошибка при удалении предмета");
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/")}
            className="hover:opacity-80 transition-opacity shrink-0"
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

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push("/")}
              className="px-3 sm:px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-xs sm:text-sm text-black dark:text-white whitespace-nowrap"
            >
              На главную
            </button>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-xs sm:text-sm text-black dark:text-white whitespace-nowrap"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-semibold text-black dark:text-zinc-50 mb-2">
            Админ-панель
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mb-4">
            Управление вопросами, пользователями и просмотр аналитики
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("subjects")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "subjects"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-solid border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
              }`}
            >
              Предметы
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-solid border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
              }`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "analytics"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-solid border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
              }`}
            >
              Аналитика
            </button>
          </div>
        </div>

        {/* Вкладка: Пользователи */}
        {activeTab === "users" && (
          <div className="mb-8 p-4 sm:p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">Пользователи</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Создавайте обычных пользователей и администраторов.
            </p>
            <form onSubmit={handleCreateUser} className="mb-6 p-4 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] bg-zinc-50 dark:bg-zinc-950 space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-medium text-black dark:text-zinc-50 mb-1">Логин</label>
                <input
                  type="text"
                  value={newUserLogin}
                  onChange={(e) => setNewUserLogin(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg px-3 py-2 text-sm text-black dark:text-white"
                  placeholder="Логин"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black dark:text-zinc-50 mb-1">Пароль (не менее 6 символов)</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg px-3 py-2 text-sm text-black dark:text-white"
                  placeholder="Пароль"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUserIsAdmin}
                  onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                  className="rounded border-black/[.08] dark:border-white/[.145]"
                />
                <span className="text-sm text-black dark:text-zinc-50">Администратор</span>
              </label>
              {userError && <p className="text-sm text-red-600 dark:text-red-400">{userError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] text-sm disabled:opacity-50"
              >
                {loading ? "Создание..." : "Создать пользователя"}
              </button>
            </form>
            {usersLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-black/[.08] dark:border-white/[.145] border-t-black dark:border-t-white"></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                      <th className="py-2 pr-4 text-zinc-600 dark:text-zinc-400 font-medium">Логин</th>
                      <th className="py-2 pr-4 text-zinc-600 dark:text-zinc-400 font-medium">Роль</th>
                      <th className="py-2 text-zinc-600 dark:text-zinc-400 font-medium w-20">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.login} className="border-b border-black/[.08] dark:border-white/[.145]">
                        <td className="py-2 pr-4 text-black dark:text-zinc-50">{u.login}</td>
                        <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{u.isAdmin ? "Админ" : "Пользователь"}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.login)}
                            disabled={loading}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && !usersLoading && (
                  <p className="py-4 text-zinc-500 dark:text-zinc-500 text-sm">Нет пользователей</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Вкладка: Аналитика */}
        {activeTab === "analytics" && (
          <div className="mb-8 p-4 sm:p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">Аналитика / Статистика</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Количество ответов по пользователям, предметам и вопросам (ошибки/повторы).
            </p>
            {statsLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black/[.08] dark:border-white/[.145] border-t-black dark:border-t-white"></div>
            ) : (
              <div className="space-y-6">
                {Object.keys(stats).length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-500 text-sm">Нет данных</p>
                ) : (
                  Object.entries(stats).map(([user, byFile]) => (
                    <div key={user} className="border border-solid border-black/[.08] dark:border-white/[.145] rounded-xl p-4">
                      <h3 className="font-medium text-black dark:text-zinc-50 mb-3">{user}</h3>
                      <div className="space-y-3 pl-2">
                        {Object.entries(byFile).map(([fileId, byQuestion]) => {
                          const total = Object.values(byQuestion).reduce((a, b) => a + b, 0);
                          return (
                            <div key={fileId} className="text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{fileId}</span>
                              <span className="text-zinc-500 dark:text-zinc-500 ml-2">— ответов по вопросам: {total}</span>
                              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500 pl-2">
                                {Object.entries(byQuestion).slice(0, 5).map(([q, count]) => (
                                  <div key={q} className="truncate max-w-full">
                                    «{q.slice(0, 40)}{q.length > 40 ? "…" : ""}»: {count}
                                  </div>
                                ))}
                                {Object.keys(byQuestion).length > 5 && (
                                  <div>… и ещё {Object.keys(byQuestion).length - 5} вопросов</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Subject Management (вкладка Предметы) */}
        {activeTab === "subjects" && (
        <>
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
            <label className="block text-sm font-medium text-black dark:text-zinc-50">
              Управление предметами
            </label>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <label className="px-3 sm:px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-xs sm:text-sm text-black dark:text-white cursor-pointer whitespace-nowrap">
                Импорт из файла
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSubject}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowImportText(!showImportText)}
                className="px-3 sm:px-4 py-2 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-xs sm:text-sm text-black dark:text-white whitespace-nowrap"
              >
                Импорт из текста
              </button>
              <button
                onClick={() => setShowAddSubjectForm(!showAddSubjectForm)}
                className="px-3 sm:px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                + Новый предмет
              </button>
            </div>
          </div>

          {/* Импорт из текста */}
          {showImportText && (
            <div className="mb-6 p-4 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] bg-zinc-50 dark:bg-zinc-950">
              <label className="block text-xs font-medium text-black dark:text-zinc-50 mb-2">
                Вставьте JSON предмета (id, name, description, questions)
              </label>
              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportTextError(""); }}
                rows={8}
                className="w-full bg-white dark:bg-black border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg px-3 py-2 font-mono text-sm text-black dark:text-white resize-y"
                placeholder='{"id":"subject-id","name":"Название","description":"","questions":{"Вопрос 1":"Ответ 1"}}'
              />
              {importTextError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{importTextError}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleImportFromText}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] text-sm disabled:opacity-50"
                >
                  Импортировать
                </button>
                <button
                  type="button"
                  onClick={() => { setShowImportText(false); setImportText(""); setImportTextError(""); }}
                  className="px-3 py-1.5 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-sm text-black dark:text-white"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

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
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className={`group relative px-3 sm:px-4 py-2 rounded-xl border border-solid transition-colors text-xs sm:text-sm ${
                  selectedSubject === subject.id
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
                }`}
              >
                <button
                  onClick={() => handleSubjectChange(subject.id)}
                  className="pr-6 sm:pr-8"
                >
                  <span className="whitespace-nowrap">{subject.name}</span> <span className="opacity-70">({subject.questionCount})</span>
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
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black">
                <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-zinc-50 mb-4">
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
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingQuestion(null);
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] transition-colors text-sm sm:text-base"
                >
                  + Добавить вопрос
                </button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3 sm:space-y-4">
              {questions.length === 0 ? (
                <div className="p-4 sm:p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black text-center text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                  Нет вопросов. Добавьте первый вопрос.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-6 rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black hover:border-black/[.16] dark:hover:border-white/[.24] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-black dark:text-zinc-50 mb-2 break-words">
                          {q.question}
                        </div>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 break-words">
                          {q.answer}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleEdit(q)}
                          disabled={loading}
                          className="px-2 sm:px-3 py-1.5 rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] transition-colors text-xs sm:text-sm text-black dark:text-white disabled:opacity-50 whitespace-nowrap"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(q.question)}
                          disabled={loading}
                          className="px-2 sm:px-3 py-1.5 rounded-lg border border-solid border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-xs sm:text-sm text-red-600 dark:text-red-400 disabled:opacity-50 whitespace-nowrap"
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
        </>
        )}
      </div>
    </div>
  );
}
