import { jsonResponse, methodNotAllowed, proxyMealDb } from "../_lib/mealdb";

export const config = { runtime: "edge" };

const CATEGORIES_TTL_MS = 10 * 60 * 1000;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed();

  const result = await proxyMealDb(
    "categories.php",
    {},
    {
      cacheKey: "categories",
      ttlMs: CATEGORIES_TTL_MS,
      cacheControl: "public, max-age=600",
    }
  );
  return jsonResponse(result);
}
