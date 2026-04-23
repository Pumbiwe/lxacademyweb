// app/api/terms/route.ts
import { getSubjectsData } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file") || "terms";

    const subjects = await getSubjectsData();
    const subject = (subjects as any)[file];
    
    if (!subject) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    const entries = Object.entries(subject.questions).map(([q, a]: [string, any]) => {
      const answer = typeof a?.text === "string" ? a.text : "";
      const type = a?.type === "multi" ? "multi" : "single";
      const answers = Array.isArray(a?.answers)
        ? a.answers.map((item: unknown) => String(item ?? "").trim()).filter(Boolean)
        : [];
      const fieldsCountFromAnswers = answers.length > 0 ? answers.length : 1;
      const fieldsCountRaw = Number(a?.fieldsCount);
      const fieldsCount = Number.isFinite(fieldsCountRaw) && fieldsCountRaw > 0
        ? Math.floor(fieldsCountRaw)
        : fieldsCountFromAnswers;

      return {
        question: q,
        answer,
        type,
        fieldsCount: type === "multi" ? Math.max(fieldsCount, 2) : 1,
        answers: type === "multi" ? answers : [],
      };
    });

    return Response.json(entries);
  } catch (error: any) {
    console.error("Failed to get terms:", error);
    return Response.json({ error: error.message || "Failed to get terms" }, { status: 500 });
  }
}