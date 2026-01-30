// lib/db.ts
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

const SUBJECTS_KEY = "subjects";

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
