import { jsonResponse, methodNotAllowed, proxyMealDb } from "../_lib/mealdb";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed();

  const result = await proxyMealDb(
    "random.php",
    {},
    { cacheControl: "no-store" }
  );
  return jsonResponse(result);
}
