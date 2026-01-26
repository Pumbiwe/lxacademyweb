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

    const entries = Object.entries(subject.questions).map(([q, a]: [string, any]) => ({
      question: q,
      answer: a.text,
    }));

    return Response.json(entries);
  } catch (error: any) {
    console.error("Failed to get terms:", error);
    return Response.json({ error: error.message || "Failed to get terms" }, { status: 500 });
  }
}