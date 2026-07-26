export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  minutes: number;
  servings: number;
  createdAt: string;
}

export type NewRecipe = Omit<Recipe, "id" | "createdAt">;
