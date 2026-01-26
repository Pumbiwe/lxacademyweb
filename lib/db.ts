// lib/db.ts
import { kv } from "@vercel/kv";
import fs from "fs";
import path from "path";

const SUBJECTS_KEY = "subjects";

// Проверяем, доступен ли KV
function isKvAvailable(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

// Безопасный доступ к KV (только если доступен)
async function getKvData(key: string): Promise<any> {
  if (!isKvAvailable()) {
    return null;
  }
  try {
    return await kv.get(key);
  } catch (error) {
    console.error("KV get error:", error);
    return null;
  }
}

async function setKvData(key: string, value: any): Promise<void> {
  if (!isKvAvailable()) {
    throw new Error("KV is not available");
  }
  try {
    await kv.set(key, value);
  } catch (error) {
    console.error("KV set error:", error);
    throw error;
  }
}

// Получить данные предметов из KV или файла
export async function getSubjectsData(): Promise<any> {
  if (isKvAvailable()) {
    try {
      const data = await getKvData(SUBJECTS_KEY);
      if (data) {
        return data;
      }
      // Если данных нет в KV, инициализируем из файла
      return await initializeFromFile();
    } catch (error) {
      console.error("KV read error:", error);
      // Fallback на файл при ошибке KV
      return getSubjectsDataFromFile();
    }
  }
  // Локальная разработка - используем файлы
  return getSubjectsDataFromFile();
}

// Сохранить данные предметов в KV или файл
export async function saveSubjectsData(data: any): Promise<void> {
  if (isKvAvailable()) {
    try {
      await setKvData(SUBJECTS_KEY, data);
      return;
    } catch (error) {
      console.error("KV write error:", error);
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

// Сохранить данные в файл
function saveSubjectsDataToFile(data: any): void {
  const filePath = path.join(process.cwd(), "data", "subjects.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Инициализировать KV из файла (только один раз)
async function initializeFromFile(): Promise<any> {
  try {
    const fileData = getSubjectsDataFromFile();
    if (isKvAvailable()) {
      await setKvData(SUBJECTS_KEY, fileData);
      console.log("Initialized KV from file");
    }
    return fileData;
  } catch (error) {
    console.error("Failed to initialize from file:", error);
    return getSubjectsDataFromFile();
  }
}
