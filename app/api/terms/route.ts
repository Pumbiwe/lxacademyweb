import terms from "@/data/terms.json";

export async function GET() {
  const entries = Object.entries(terms).map(([q, a]) => ({
    question: q,
    answer: a.text,
  }));

  return Response.json(entries);
}
