/**
 * Client API layer — talks only to our Express proxy under /api/*.
 * TheMealDB API key never reaches the browser.
 */

const API_BASE = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      message = body.error || body.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export type MealSummary = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
};

export type MealDetail = MealSummary & {
  strInstructions?: string;
  strTags?: string | null;
  strYoutube?: string | null;
  strSource?: string | null;
  /** Ingredient/measure fields: strIngredient1..20, strMeasure1..20 */
  [key: `strIngredient${number}` | `strMeasure${number}`]: string | null | undefined;
};

export type Category = {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
};

export type MealsResponse = { meals: MealSummary[] | null };
export type MealDetailResponse = { meals: MealDetail[] | null };
export type CategoriesResponse = { categories: Category[] | null };

export function searchMeals(query: string) {
  return apiFetch<MealsResponse>(
    `/search?s=${encodeURIComponent(query.trim())}`
  );
}

export function getMealById(id: string) {
  return apiFetch<MealDetailResponse>(`/meal/${encodeURIComponent(id)}`);
}

export function getCategories() {
  return apiFetch<CategoriesResponse>("/categories");
}

export function filterByCategory(category: string) {
  return apiFetch<MealsResponse>(
    `/filter?c=${encodeURIComponent(category.trim())}`
  );
}

export function getRandomMeal() {
  return apiFetch<MealDetailResponse>("/random");
}

/** Extract up to 20 ingredient/measure pairs from a MealDB detail object. */
export function getIngredients(meal: MealDetail): { ingredient: string; measure: string }[] {
  const items: { ingredient: string; measure: string }[] = [];
  const record = meal as MealDetail & Record<string, string | null | undefined>;
  for (let i = 1; i <= 20; i++) {
    const ingredient = record[`strIngredient${i}`]?.trim();
    const measure = record[`strMeasure${i}`]?.trim() ?? "";
    if (ingredient) {
      items.push({ ingredient, measure });
    }
  }
  return items;
}
