import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMealDb, sendJson } from "./_lib/mealdb";

const CATEGORIES_TTL_MS = 10 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await proxyMealDb(
    "categories.php",
    {},
    {
      cacheKey: "categories",
      ttlMs: CATEGORIES_TTL_MS,
      cacheControl: "public, max-age=600",
    }
  );
  sendJson(res, result);
}
