import { getStatsData } from "@/lib/db";
import { verifyToken, getBearerToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = getBearerToken(req);
  const payload = await verifyToken(token);
  if (!payload?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const stats = await getStatsData();
    return Response.json(stats);
  } catch (error) {
    console.error("Stats GET error:", error);
    return Response.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
