import { jsonResponse, methodNotAllowed, proxyMealDb } from "../../_lib/mealdb";

export const config = { runtime: "edge" };

/**
 * Vercel passes dynamic segments via request URL for Edge functions.
 * Path shape: /api/meal/:id
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed();

  const { pathname } = new URL(request.url);
  const match = pathname.match(/\/api\/meal\/([^/]+)\/?$/);
  const id = match?.[1] ? decodeURIComponent(match[1]) : "";
  if (!id) {
    return Response.json({ error: "Meal id is required" }, { status: 400 });
  }

  const result = await proxyMealDb(
    "lookup.php",
    { i: id },
    { cacheControl: "public, max-age=300" }
  );
  return jsonResponse(result);
}
