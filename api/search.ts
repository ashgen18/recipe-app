import { jsonResponse, methodNotAllowed, proxyMealDb } from "../_lib/mealdb";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed();

  const { searchParams } = new URL(request.url);
  const s = (searchParams.get("s") ?? "").trim();
  if (!s) {
    return Response.json(
      { error: 'Query parameter "s" is required' },
      { status: 400 }
    );
  }

  const result = await proxyMealDb("search.php", { s }, {
    cacheControl: "public, max-age=120",
  });
  return jsonResponse(result);
}
