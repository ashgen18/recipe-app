import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMealDb, sendJson } from "./_lib/mealdb";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const s = typeof req.query.s === "string" ? req.query.s.trim() : "";
  if (!s) {
    res.status(400).json({ error: 'Query parameter "s" is required' });
    return;
  }

  const result = await proxyMealDb("search.php", { s }, {
    cacheControl: "public, max-age=120",
  });
  sendJson(res, result);
}
