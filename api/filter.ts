import { jsonResponse, methodNotAllowed, proxyMealDb } from "../_lib/mealdb";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed();

  const { searchParams } = new URL(request.url);
  const c = (searchParams.get("c") ?? "").trim();
  if (!c) {
    return Response.json(
      { error: 'Query parameter "c" is required' },
      { status: 400 }
    );
  }

  const result = await proxyMealDb(
    "filter.php",
    { c },
    { cacheControl: "public, max-age=180" }
  );
  return jsonResponse(result);
}
