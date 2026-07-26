import type { Recipe } from "./types.js";

export interface NewRecipeInput {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  minutes: number;
  servings: number;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchRecipes(): Promise<Recipe[]> {
  return handle<Recipe[]>(await fetch("/api/recipes"));
}

export async function createRecipe(input: NewRecipeInput): Promise<Recipe> {
  return handle<Recipe>(
    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Failed to delete recipe (status ${res.status})`);
  }
}
