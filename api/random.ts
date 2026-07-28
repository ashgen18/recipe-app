import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyMealDb, sendJson } from "../_lib/mealdb";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await proxyMealDb(
    "random.php",
    {},
    { cacheControl: "no-store" }
  );
  sendJson(res, result);
}
