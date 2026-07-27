/**
 * Offline warm-cache helpers.
 *
 * Favorites already persist full MealDetail JSON in IndexedDB.
 * This module additionally:
 * - Puts meal detail + filter API responses into Cache Storage
 * - Downloads meal (and category) images into Cache Storage so <img> works offline
 * - Remembers category meal lists loaded during this session for favorite-time caching
 */
import {
  filterByCategory,
  type MealDetail,
  type MealSummary,
} from "@/lib/api";
import { saveCategorySnapshot } from "@/features/favorites/db";

/** Must stay in sync with CACHE_VERSION runtime name in sw.js */
export const RUNTIME_CACHE = "recipes-pwa-v3-runtime";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "");

/** Categories + meal lists the user has loaded this session (Home browse). */
const loadedCategories = new Map<string, MealSummary[]>();

export function rememberLoadedCategory(
  category: string,
  meals: MealSummary[]
): void {
  const key = category.trim();
  if (!key || meals.length === 0) return;
  loadedCategories.set(key, meals);
}

export function getLoadedCategories(): ReadonlyMap<string, MealSummary[]> {
  return loadedCategories;
}

export function mealDetailApiUrl(id: string): string {
  return `${API_BASE}/meal/${encodeURIComponent(id)}`;
}

export function categoryFilterApiUrl(category: string): string {
  return `${API_BASE}/filter?c=${encodeURIComponent(category.trim())}`;
}

export function categoriesApiUrl(): string {
  return `${API_BASE}/categories`;
}

async function openRuntimeCache(): Promise<Cache | null> {
  if (!("caches" in globalThis)) return null;
  try {
    return await caches.open(RUNTIME_CACHE);
  } catch {
    return null;
  }
}

/** Put an opaque JSON body into Cache Storage under `url`. */
export async function cacheJson(url: string, body: unknown): Promise<void> {
  const cache = await openRuntimeCache();
  if (!cache) return;
  const response = new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Offline-Cache": "idb-warm",
    },
  });
  await cache.put(url, response);
}

/**
 * Fetch and cache URLs (same-origin APIs + CORS MealDB images).
 * Failures are ignored so offline warm-up never blocks favoriting.
 */
export async function cacheUrls(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return;

  const cache = await openRuntimeCache();
  if (!cache) {
    notifyServiceWorker(unique);
    return;
  }

  await Promise.all(
    unique.map(async (url) => {
      try {
        const existing = await cache.match(url);
        if (existing) return;
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
          // Images from MealDB; APIs are same-origin via proxy
        });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // ignore individual failures
      }
    })
  );

  notifyServiceWorker(unique);
}

function notifyServiceWorker(urls: string[]): void {
  if (!("serviceWorker" in navigator)) return;
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;
  controller.postMessage({ type: "CACHE_URLS", urls });
}

async function resolveCategoryMeals(
  category: string
): Promise<MealSummary[]> {
  const cached = loadedCategories.get(category);
  if (cached?.length) return cached;

  try {
    const data = await filterByCategory(category);
    const meals = data.meals ?? [];
    if (meals.length) rememberLoadedCategory(category, meals);
    return meals;
  } catch {
    return [];
  }
}

/**
 * After saving a favorite, make the recipe + related browse data work offline:
 * - Full meal JSON (IndexedDB already saved by caller) + /api/meal cache
 * - Favorite meal image (awaited — critical for offline details/list)
 * - Meal's category list + images, plus any categories loaded this session (background)
 */
export async function persistFavoriteForOffline(
  meal: MealDetail
): Promise<void> {
  // Critical path: recipe API payload + hero image for this favorite
  await cacheJson(mealDetailApiUrl(meal.idMeal), { meals: [meal] });
  if (meal.strMealThumb) {
    await cacheUrls([meal.strMealThumb]);
  }

  // Background: loaded categories + this meal's category lists/images
  void warmRelatedCategories(meal).catch(() => {
    /* non-fatal */
  });
}

async function warmRelatedCategories(meal: MealDetail): Promise<void> {
  const imageUrls: string[] = [];
  const categoriesToCache = new Set<string>();
  if (meal.strCategory?.trim()) {
    categoriesToCache.add(meal.strCategory.trim());
  }
  for (const name of loadedCategories.keys()) {
    categoriesToCache.add(name);
  }

  for (const category of categoriesToCache) {
    const meals = await resolveCategoryMeals(category);
    if (meals.length === 0) continue;

    await saveCategorySnapshot(category, meals);
    await cacheJson(categoryFilterApiUrl(category), { meals });

    for (const m of meals) {
      if (m.strMealThumb) imageUrls.push(m.strMealThumb);
    }
  }

  try {
    const categoriesRes = await fetch(categoriesApiUrl());
    if (categoriesRes.ok) {
      const cache = await openRuntimeCache();
      if (cache) await cache.put(categoriesApiUrl(), categoriesRes.clone());
    }
  } catch {
    // ignore
  }

  await cacheUrls(imageUrls);
}

/** Background warm-cache for a meal list the user is currently browsing. */
export async function warmMealListOffline(
  category: string | null,
  meals: MealSummary[]
): Promise<void> {
  if (meals.length === 0) return;

  if (category) {
    rememberLoadedCategory(category, meals);
    void saveCategorySnapshot(category, meals);
    void cacheJson(categoryFilterApiUrl(category), { meals });
  }

  const thumbs = meals
    .map((m) => m.strMealThumb)
    .filter((url): url is string => Boolean(url));

  void cacheUrls(thumbs);
}
