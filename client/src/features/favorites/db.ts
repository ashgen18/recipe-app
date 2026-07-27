/**
 * IndexedDB favorites store via `idb`.
 * Favorites remain available offline (view / add from cached detail / remove).
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { MealDetail } from "@/lib/api";

const DB_NAME = "recipes-pwa";
const DB_VERSION = 1;
const STORE = "favorites";

interface FavoritesDB extends DBSchema {
  favorites: {
    key: string;
    value: FavoriteMeal;
    indexes: { "by-savedAt": number };
  };
}

export type FavoriteMeal = MealDetail & {
  savedAt: number;
};

let dbPromise: Promise<IDBPDatabase<FavoritesDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FavoritesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "idMeal" });
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
  await db.put(STORE, record);
  return record;
}

export async function removeFavorite(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function getFavorite(id: string): Promise<FavoriteMeal | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

export async function getAllFavorites(): Promise<FavoriteMeal[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function isFavorite(id: string): Promise<boolean> {
  const fav = await getFavorite(id);
  return Boolean(fav);
}
