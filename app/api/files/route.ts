import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "data");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "users.json" && f !== "stats.json");

  return new Response(JSON.stringify(files));
}
