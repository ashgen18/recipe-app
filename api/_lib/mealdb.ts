/**
 * Shared TheMealDB proxy helpers for Vercel serverless `/api/*` routes.
 * Keeps MEALDB_API_KEY server-side only.
 */

const MEALDB_API_BASE =
  process.env.MEALDB_API_BASE ?? "https://www.themealdb.com/api/json/v1";
const MEALDB_API_KEY = process.env.MEALDB_API_KEY ?? "1";

type CacheEntry = { expiresAt: number; body: unknown };
const memoryCache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.body;
}

function setCached(key: string, body: unknown, ttlMs: number): void {
  memoryCache.set(key, { body, expiresAt: Date.now() + ttlMs });
}

export type MealDbResult =
  | {
      ok: true;
      status: number;
      body: unknown;
      cache: "HIT" | "MISS" | "BYPASS";
      cacheControl: string;
    }
  | {
      ok: false;
      status: number;
      body: unknown;
    };

export async function proxyMealDb(
  path: string,
  query: Record<string, string | undefined>,
  options?: { cacheKey?: string; ttlMs?: number; cacheControl?: string }
): Promise<MealDbResult> {
  const cacheControl = options?.cacheControl ?? "public, max-age=60";

  if (options?.cacheKey) {
    const cached = getCached(options.cacheKey);
    if (cached) {
      return {
        ok: true,
        status: 200,
        body: cached,
        cache: "HIT",
        cacheControl: options.cacheControl ?? "public, max-age=300",
      };
    }
  }

  const url = new URL(
    `${MEALDB_API_BASE.replace(/\/$/, "")}/${MEALDB_API_KEY}/${path}`
  );
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const upstream = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return {
      ok: false,
      status: upstream.status,
      body: {
        error: "Upstream TheMealDB error",
        status: upstream.status,
        detail: text.slice(0, 300),
      },
    };
  }

  const data = await upstream.json();

  if (options?.cacheKey && options.ttlMs) {
    setCached(options.cacheKey, data, options.ttlMs);
  }

  return {
    ok: true,
    status: 200,
    body: data,
    cache: options?.cacheKey ? "MISS" : "BYPASS",
    cacheControl,
  };
}

export function jsonResponse(result: MealDbResult): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (result.ok) {
    headers["X-Cache"] = result.cache;
    headers["Cache-Control"] = result.cacheControl;
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers,
  });
}

export function methodNotAllowed(): Response {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
