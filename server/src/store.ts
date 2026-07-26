import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NewRecipe, Recipe } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "data", "recipes.json");

const SEED: Recipe[] = [
  {
    id: "seed-classic-pancakes",
    title: "Classic Fluffy Pancakes",
    description: "Light and fluffy pancakes perfect for a weekend breakfast.",
    ingredients: [
      "1 1/2 cups all-purpose flour",
      "3 1/2 tsp baking powder",
      "1 tbsp sugar",
      "1 1/4 cups milk",
      "1 egg",
      "3 tbsp melted butter",
    ],
    steps: [
      "Whisk together the dry ingredients.",
      "Add milk, egg, and melted butter; stir until just combined.",
      "Pour 1/4 cup batter onto a hot greased griddle.",
      "Flip when bubbles form and cook until golden.",
    ],
    minutes: 20,
    servings: 4,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function ensureFile(): void {
  const dir = dirname(DATA_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
  }
}

function readAll(): Recipe[] {
  ensureFile();
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Recipe[];
  } catch {
    return [];
  }
}

function writeAll(recipes: Recipe[]): void {
  ensureFile();
  writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2));
}

export function listRecipes(): Recipe[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRecipe(id: string): Recipe | undefined {
  return readAll().find((r) => r.id === id);
}

export function createRecipe(input: NewRecipe): Recipe {
  const recipes = readAll();
  const recipe: Recipe = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  recipes.push(recipe);
  writeAll(recipes);
  return recipe;
}

export function deleteRecipe(id: string): boolean {
  const recipes = readAll();
  const next = recipes.filter((r) => r.id !== id);
  if (next.length === recipes.length) {
    return false;
  }
  writeAll(next);
  return true;
}
