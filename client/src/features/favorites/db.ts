/**
 * IndexedDB favorites + offline category snapshots via `idb`.
 * Favorites remain available offline (view / add from cached detail / remove).
 * Category snapshots keep recently browsed lists available when offline.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { MealDetail, MealSummary } from "@/lib/api";

const DB_NAME = "recipes-pwa";
const DB_VERSION = 2;
const FAVORITES_STORE = "favorites";
const CATEGORIES_STORE = "categorySnapshots";

export type FavoriteMeal = MealDetail & {
  savedAt: number;
};

export type CategorySnapshot = {
  category: string;
  meals: MealSummary[];
  savedAt: number;
};

interface FavoritesDB extends DBSchema {
  favorites: {
    key: string;
    value: FavoriteMeal;
    indexes: { "by-savedAt": number };
  };
  categorySnapshots: {
    key: string;
    value: CategorySnapshot;
    indexes: { "by-savedAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<FavoritesDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FavoritesDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1 || !db.objectStoreNames.contains(FAVORITES_STORE)) {
          const store = db.createObjectStore(FAVORITES_STORE, {
            keyPath: "idMeal",
          });
          store.createIndex("by-savedAt", "savedAt");
        }
        if (
          oldVersion < 2 ||
          !db.objectStoreNames.contains(CATEGORIES_STORE)
        ) {
          const store = db.createObjectStore(CATEGORIES_STORE, {
            keyPath: "category",
          });
          store.createIndex("by-savedAt", "savedAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveFavorite(meal: MealDetail): Promise<FavoriteMeal> {
  const db = await getDb();
  const record: FavoriteMeal = { ...meal, savedAt: Date.now() };
  await db.put(FAVORITES_STORE, record);
  return record;
}

export async function removeFavorite(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(FAVORITES_STORE, id);
}

export async function getFavorite(id: string): Promise<FavoriteMeal | undefined> {
  const db = await getDb();
  return db.get(FAVORITES_STORE, id);
}

export async function getAllFavorites(): Promise<FavoriteMeal[]> {
  const db = await getDb();
  const all = await db.getAll(FAVORITES_STORE);
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function isFavorite(id: string): Promise<boolean> {
  const fav = await getFavorite(id);
  return Boolean(fav);
}

export async function saveCategorySnapshot(
  category: string,
  meals: MealSummary[]
): Promise<CategorySnapshot> {
  const db = await getDb();
  const record: CategorySnapshot = {
    category: category.trim(),
    meals,
    savedAt: Date.now(),
  };
  await db.put(CATEGORIES_STORE, record);
  return record;
}

export async function getCategorySnapshot(
  category: string
): Promise<CategorySnapshot | undefined> {
  const db = await getDb();
  return db.get(CATEGORIES_STORE, category.trim());
}

export async function getAllCategorySnapshots(): Promise<CategorySnapshot[]> {
  const db = await getDb();
  const all = await db.getAll(CATEGORIES_STORE);
  return all.sort((a, b) => b.savedAt - a.savedAt);
}
