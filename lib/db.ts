// lib/db.ts
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

const SUBJECTS_KEY = "subjects";
const USERS_KEY = "users";
const STATS_KEY = "stats";

// Проверяем, доступен ли Redis (Vercel Storage KV / Upstash)
function isRedisAvailable(): boolean {
  // Vercel Storage KV (подключённый Redis в проекте)
  if (process.env.STORAGE_KV_REST_API_URL && (process.env.STORAGE_KV_REST_API_TOKEN || process.env.STORAGE_KV_READ_ONLY_TOKEN))
    return true;
  // Upstash
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    return true;
  // Старый Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return true;
  return false;
}

// Токен для записи (read-only не подходит для сохранения)
function getRedisToken(): string {
  return (
    process.env.STORAGE_KV_REST_API_TOKEN ||
    process.env.STORAGE_KV_READ_ONLY_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    ""
  );
}

function getRedisUrl(): string {
  return (
    process.env.STORAGE_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ""
  );
}

// Кэшируемый клиент Redis
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!isRedisAvailable()) return null;
  const url = getRedisUrl();
  const token = getRedisToken();
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

// Получить данные предметов из Redis или файла
export async function getSubjectsData(): Promise<any> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get(SUBJECTS_KEY);
      if (data) {
        return data;
      }
      // Если данных нет в Redis, инициализируем из файла
      return await initializeFromFile();
    } catch (error) {
      console.error("Redis read error:", error);
      return getSubjectsDataFromFile();
    }
  }
  // Локальная разработка - используем файлы
  return getSubjectsDataFromFile();
}

// Сохранить данные предметов в Redis или файл
export async function saveSubjectsData(data: any): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(SUBJECTS_KEY, data);
      return;
    } catch (error) {
      console.error("Redis write error:", error);
      throw error;
    }
  }
  // Локальная разработка - используем файлы
  saveSubjectsDataToFile(data);
}

// Получить данные из файла
function getSubjectsDataFromFile(): any {
  const filePath = path.join(process.cwd(), "data", "subjects.json");
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

// Сохранить данные в файл (только локально)
function saveSubjectsDataToFile(data: any): void {
  const filePath = path.join(process.cwd(), "data", "subjects.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error: any) {
    if (error.code === "EROFS") {
      throw new Error(
        "Файловая система только для чтения. Настройте Upstash Redis: Vercel → Integrations → Upstash → Connect."
      );
    }
    throw error;
  }
}

// Инициализировать Redis из файла при первом запуске
async function initializeFromFile(): Promise<any> {
  try {
    const fileData = getSubjectsDataFromFile();
    const redis = getRedisClient();
    if (redis) {
      await redis.set(SUBJECTS_KEY, fileData);
      console.log("Initialized Redis from file");
    }
    return fileData;
  } catch (error) {
    console.error("Failed to initialize from file:", error);
    return getSubjectsDataFromFile();
  }
}

// --- Пользователи ---
function getUsersFilePath() {
  return path.join(process.cwd(), "data", "users.json");
}

function getUsersDataFromFile(): Record<string, { password: string; isAdmin: boolean }> {
  const filePath = getUsersFilePath();
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

function saveUsersDataToFile(data: Record<string, { password: string; isAdmin: boolean }>): void {
  const filePath = getUsersFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error: any) {
    if (error.code === "EROFS") throw new Error("Файловая система только для чтения.");
    throw error;
  }
}

export async function getUsersData(): Promise<Record<string, { password: string; isAdmin: boolean }>> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get(USERS_KEY);
      if (data && typeof data === "object" && Object.keys(data as object).length > 0) {
        return data as Record<string, { password: string; isAdmin: boolean }>;
      }
      const fileData = getUsersDataFromFile();
      await redis.set(USERS_KEY, fileData);
      return fileData;
    } catch (error) {
      console.error("Redis users read error:", error);
      return getUsersDataFromFile();
    }
  }
  return getUsersDataFromFile();
}

export async function saveUsersData(data: Record<string, { password: string; isAdmin: boolean }>): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(USERS_KEY, data);
      return;
    } catch (error) {
      console.error("Redis users write error:", error);
      throw error;
    }
  }
  saveUsersDataToFile(data);
}

// --- Статистика ---
export type StatsData = Record<string, Record<string, Record<string, number>>>;

function getStatsFilePath() {
  return path.join(process.cwd(), "data", "stats.json");
}

function getStatsDataFromFile(): StatsData {
  try {
    const filePath = getStatsFilePath();
    const fileContents = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContents);
  } catch {
    return {};
  }
}

export async function getStatsData(): Promise<StatsData> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get(STATS_KEY);
      if (data && typeof data === "object") {
        return data as StatsData;
      }
      return {};
    } catch (error) {
      console.error("Redis stats read error:", error);
      return getStatsDataFromFile();
    }
  }
  return getStatsDataFromFile();
}

export async function saveStatsData(data: StatsData): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(STATS_KEY, data);
      return;
    } catch (error) {
      console.error("Redis stats write error:", error);
      throw error;
    }
  }
  try {
    fs.writeFileSync(getStatsFilePath(), JSON.stringify(data, null, 2), "utf-8");
  } catch (error: any) {
    if (error.code === "EROFS") return; // ignore on read-only
    throw error;
  }
}
