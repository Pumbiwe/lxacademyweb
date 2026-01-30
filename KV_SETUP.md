# Настройка Redis для продакшена (Vercel)

## Проблема EROFS

Ошибка `EROFS: read-only file system` возникает, когда Redis не настроен: приложение пытается писать в файл, а на Vercel файловая система только для чтения.

## Решение: Upstash Redis

1. **Установите Upstash в проекте:**
   - Vercel Dashboard → ваш проект → **Integrations**
   - Найдите **Upstash** → **Add Integration**
   - Выберите **Upstash for Redis**
   - Свяжите с проектом и создайте/выберите базу Redis

2. **Переменные окружения:**
   Поддерживаются (в порядке приоритета):
   - **Vercel Storage KV:** `STORAGE_KV_REST_API_URL`, `STORAGE_KV_REST_API_TOKEN` (для записи; `STORAGE_KV_READ_ONLY_TOKEN` только для чтения)
   - **Upstash:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - **Старый Vercel KV:** `KV_REST_API_URL`, `KV_REST_API_TOKEN`

3. **Подтяните переменные локально:**
   ```bash
   vercel env pull .env.development.local
   ```

4. **Установите зависимости и перезадеплойте:**
   ```bash
   npm install
   vercel --prod
   ```

## Важно

- Redis должен быть **подключён к проекту** через Integrations.
- Переменные должны быть в **Production** (Settings → Environment Variables).
- После добавления интеграции сделайте **Redeploy** проекта.
