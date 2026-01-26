// app/api/terms/route.ts
import subjects from "@/data/subjects.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file") || "terms";

  const subject = (subjects as any)[file];
  if (!subject) {
    return Response.json({ error: "Subject not found" }, { status: 404 });
  }

  const entries = Object.entries(subject.questions).map(([q, a]: [string, any]) => ({
    question: q,
    answer: a.text,
  }));

  return Response.json(entries);
}