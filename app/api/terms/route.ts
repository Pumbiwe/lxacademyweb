// app/api/terms/route.ts
import terms from "@/data/terms.json";
import termsobj from "@/data/termsobj.json";
import termscn from "@/data/termscn.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file") || "terms"; // по умолчанию terms.json

  let data: any;

  switch (file) {
    case "termsobj":
      data = termsobj;
      break;
    case "termscn":
      data = termscn;
      break;
    case "terms":
    default:
      data = terms;
      break;
  }

  const entries = Object.entries(data).map(([q, a]: [string, any]) => ({
    question: q,
    answer: a.text,
  }));

  return Response.json(entries);
}