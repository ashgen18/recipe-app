import { Router, type Request, type Response, type NextFunction } from "express";

const MEALDB_API_BASE =
  process.env.MEALDB_API_BASE ?? "https://www.themealdb.com/api/json/v1";
const MEALDB_API_KEY = process.env.MEALDB_API_KEY ?? "1";

const router = Router();

/** Simple in-memory TTL cache (categories change rarely). */
type CacheEntry = { expiresAt: number; body: unknown };
const memoryCache = new Map<string, CacheEntry>();
const CATEGORIES_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

/**
 * Forward a request to TheMealDB. The API key never leaves the server.
 * Format: `${MEALDB_API_BASE}/${MEALDB_API_KEY}/${path}?query`
 */
async function proxyMealDb(
  path: string,
  query: Record<string, string | undefined>,
  res: Response,
  next: NextFunction,
  options?: { cacheKey?: string; ttlMs?: number; cacheControl?: string }
): Promise<void> {
  try {
    if (options?.cacheKey) {
      const cached = getCached(options.cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader(
          "Cache-Control",
          options.cacheControl ?? "public, max-age=300"
        );
        res.json(cached);
        return;
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
      res.status(upstream.status).json({
        error: "Upstream TheMealDB error",
        status: upstream.status,
        detail: text.slice(0, 300),
      });
      return;
    }

    const data = await upstream.json();

    if (options?.cacheKey && options.ttlMs) {
      setCached(options.cacheKey, data, options.ttlMs);
    }

    res.setHeader("X-Cache", options?.cacheKey ? "MISS" : "BYPASS");
    res.setHeader(
      "Cache-Control",
      options?.cacheControl ?? "public, max-age=60"
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/** GET /api/search?s=pasta */
router.get("/search", (req: Request, res: Response, next: NextFunction) => {
  const s = typeof req.query.s === "string" ? req.query.s : "";
  if (!s.trim()) {
    res.status(400).json({ error: 'Query parameter "s" is required' });
    return;
  }
  void proxyMealDb("search.php", { s: s.trim() }, res, next, {
    cacheControl: "public, max-age=120",
  });
});

/** GET /api/meal/:id */
router.get("/meal/:id", (req: Request, res: Response, next: NextFunction) => {
  const id = String(req.params.id ?? "");
  if (!id) {
    res.status(400).json({ error: "Meal id is required" });
    return;
  }
  void proxyMealDb("lookup.php", { i: id }, res, next, {
    cacheControl: "public, max-age=300",
  });
});

/** GET /api/categories — TTL-cached in memory */
router.get("/categories", (req: Request, res: Response, next: NextFunction) => {
  void proxyMealDb("categories.php", {}, res, next, {
    cacheKey: "categories",
    ttlMs: CATEGORIES_TTL_MS,
    cacheControl: "public, max-age=600",
  });
});

/** GET /api/filter?c=Seafood */
router.get("/filter", (req: Request, res: Response, next: NextFunction) => {
  const c = typeof req.query.c === "string" ? req.query.c : "";
  if (!c.trim()) {
    res.status(400).json({ error: 'Query parameter "c" is required' });
    return;
  }
  void proxyMealDb("filter.php", { c: c.trim() }, res, next, {
    cacheControl: "public, max-age=180",
  });
});

/** GET /api/random */
router.get("/random", (req: Request, res: Response, next: NextFunction) => {
  void proxyMealDb("random.php", {}, res, next, {
    cacheControl: "no-store",
  });
});

export default router;
