import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMealDb, sendJson } from "./_lib/mealdb";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const c = typeof req.query.c === "string" ? req.query.c.trim() : "";
  if (!c) {
    res.status(400).json({ error: 'Query parameter "c" is required' });
    return;
  }

  const result = await proxyMealDb(
    "filter.php",
    { c },
    { cacheControl: "public, max-age=180" }
  );
  sendJson(res, result);
}
