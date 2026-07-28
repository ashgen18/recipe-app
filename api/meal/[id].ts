import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMealDb, sendJson } from "../_lib/mealdb";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const raw = req.query.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Meal id is required" });
    return;
  }

  const result = await proxyMealDb(
    "lookup.php",
    { i: id },
    { cacheControl: "public, max-age=300" }
  );
  sendJson(res, result);
}
