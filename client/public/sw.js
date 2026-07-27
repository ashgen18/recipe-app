/* eslint-disable no-restricted-globals */
/**
 * Manual service worker (no Workbox).
 *
 * Strategies:
 * - Precache app shell + static assets (CACHE_VERSION bump to refresh)
 * - Stale-While-Revalidate: images + /api/categories
 * - Network-First (cache fallback): /api/meal/*, /api/search, /api/filter
 * - Navigation: network, then cache, then /offline.html
 * - Message CACHE_URLS: app asks SW to warm-cache favorite/category assets
 */

const CACHE_VERSION = "recipes-pwa-v3";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
  "/icons/icon.svg",
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    /\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?|$)/i.test(url.pathname) ||
    url.hostname.includes("themealdb.com")
  );
}

function isApiCategories(url) {
  return url.pathname === "/api/categories";
}

function isApiMealOrSearch(url) {
  return (
    url.pathname.startsWith("/api/meal/") ||
    url.pathname === "/api/search" ||
    url.pathname === "/api/filter"
  );
}

/** Stale-While-Revalidate: return cache immediately, refresh in background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        void cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

/** Network-First with cache fallback for meal details / search. */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      void cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Offline and not cached" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME);
    if (response && response.ok) {
      void cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Notify clients so the app can show an offline toast
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.postMessage({ type: "OFFLINE_NAVIGATION" });
    }

    const cache = await caches.open(PRECACHE);
    const cachedPage =
      (await caches.match(request)) ||
      (await cache.match("/index.html")) ||
      (await cache.match("/offline.html"));
    return (
      cachedPage ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

/** App-driven warm cache for favorite images, meal APIs, and category lists. */
async function cacheUrlsFromClient(urls) {
  const cache = await caches.open(RUNTIME);
  await Promise.all(
    (urls || []).map(async (url) => {
      if (!url) return;
      try {
        const existing = await cache.match(url);
        if (existing) return;
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
        });
        if (response && response.ok) {
          await cache.put(url, response.clone());
        }
      } catch {
        // ignore individual failures
      }
    })
  );
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(cacheUrlsFromClient(data.urls));
  }
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Cross-origin images (MealDB thumbs): SWR into runtime cache
    if (isImageRequest(request, url)) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isApiCategories(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (isApiMealOrSearch(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: try cache (precache), then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
