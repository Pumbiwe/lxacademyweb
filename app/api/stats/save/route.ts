import fs from "fs";
import path from "path";

const statsPath = path.join(process.cwd(), "data/stats.json");

export async function POST(req: Request) {
  const { user, file, question } = await req.json();
  const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));

  stats[user] ??= {};
  stats[user][file] ??= {};
  stats[user][file][question] =
    (stats[user][file][question] ?? 0) + 1;

  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  return Response.json({ ok: true });
}
