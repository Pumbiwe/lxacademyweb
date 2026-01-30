import { getStatsData, saveStatsData } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { user, file, question } = await req.json();
    if (!user || !file || !question || typeof user !== "string" || typeof file !== "string" || typeof question !== "string") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    const userSanitized = user.slice(0, 128).trim();
    const fileSanitized = file.slice(0, 128).trim();
    const questionSanitized = question.slice(0, 500).trim();
    if (!userSanitized || !fileSanitized || !questionSanitized) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    const stats = await getStatsData();
    stats[userSanitized] ??= {};
    stats[userSanitized][fileSanitized] ??= {};
    stats[userSanitized][fileSanitized][questionSanitized] = (stats[userSanitized][fileSanitized][questionSanitized] ?? 0) + 1;
    await saveStatsData(stats);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Stats save error:", error);
    return Response.json({ error: "Failed to save stats" }, { status: 500 });
  }
}
