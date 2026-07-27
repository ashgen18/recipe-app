import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  filterByCategory,
  getCategories,
  getRandomMeal,
  searchMeals,
  type Category,
  type MealSummary,
} from "@/lib/api";
import {
  getAllCategorySnapshots,
  getCategorySnapshot,
} from "@/features/favorites/db";
import { warmMealListOffline } from "@/lib/offlineCache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeCard, RecipeCardSkeleton } from "@/components/RecipeCard";
import { Skeleton } from "@/components/ui/skeleton";

const LANDING_CATEGORIES = ["Vegetarian", "Vegan"] as const;

function mergeMeals(...lists: (MealSummary[] | null | undefined)[]): MealSummary[] {
  const merged: MealSummary[] = [];
  for (const list of lists) {
    for (const meal of list ?? []) {
      if (!merged.some((x) => x.idMeal === meal.idMeal)) {
        merged.push(meal);
      }
    }
  }
  return merged;
}

function prioritizePlantBased(categories: Category[]): Category[] {
  const preferred = new Set<string>(LANDING_CATEGORIES);
  const featured = LANDING_CATEGORIES.map((name) =>
    categories.find((c) => c.strCategory === name)
  ).filter((c): c is Category => Boolean(c));
  const rest = categories.filter((c) => !preferred.has(c.strCategory));
  return [...featured, ...rest];
}

export function Home() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const category = params.get("c")?.trim() ?? "";

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const orderedCategories = useMemo(
    () => prioritizePlantBased(categoriesQuery.data?.categories ?? []),
    [categoriesQuery.data]
  );

  const mealsQuery = useQuery({
    queryKey: ["meals", { query, category }],
    queryFn: async () => {
      try {
        if (query) return searchMeals(query);
        if (category) {
          const data = await filterByCategory(category);
          void warmMealListOffline(category, data.meals ?? []);
          return data;
        }
        // Default landing: Vegetarian + Vegan recipes
        const [vegetarian, vegan] = await Promise.all(
          LANDING_CATEGORIES.map((name) => filterByCategory(name))
        );
        void warmMealListOffline("Vegetarian", vegetarian.meals ?? []);
        void warmMealListOffline("Vegan", vegan.meals ?? []);
        return { meals: mergeMeals(vegetarian.meals, vegan.meals) };
      } catch (err) {
        // Offline: serve category snapshots saved while browsing / favoriting
        if (query) throw err;
        if (category) {
          const snap = await getCategorySnapshot(category);
          if (snap?.meals?.length) return { meals: snap.meals };
          throw err;
        }
        const snaps = await getAllCategorySnapshots();
        const plant = LANDING_CATEGORIES.flatMap(
          (name) => snaps.find((s) => s.category === name)?.meals ?? []
        );
        if (plant.length) return { meals: mergeMeals(plant) };
        const any = snaps.flatMap((s) => s.meals);
        if (any.length) return { meals: mergeMeals(any) };
        throw err;
      }
    },
  });

  const meals = useMemo(() => mealsQuery.data?.meals ?? [], [mealsQuery.data]);

  // Remember loaded lists + warm-cache thumbs for offline favorites / browse
  useEffect(() => {
    if (!mealsQuery.isSuccess || meals.length === 0) return;
    if (category) {
      void warmMealListOffline(category, meals);
      return;
    }
    // Search / landing thumbs (landing categories are warmed inside queryFn)
    void warmMealListOffline(null, meals);
  }, [mealsQuery.isSuccess, meals, category]);

  function selectCategory(name: string) {
    const next = new URLSearchParams();
    if (name) next.set("c", name);
    setParams(next);
  }

  function clearFilters() {
    setParams({});
  }

  async function surpriseMe() {
    try {
      const data = await getRandomMeal();
      const meal = data.meals?.[0];
      if (meal) {
        window.location.assign(`/meal/${meal.idMeal}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load a recipe");
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="browse-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              id="browse-heading"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {query
                ? `Results for “${query}”`
                : category
                  ? category
                  : "Vegetarian & Vegan"}
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {query || category
                ? "Search by name or browse categories. Favorites sync to this device and work offline."
                : "Plant-based recipes to start with — pick Vegetarian or Vegan, or browse every category."}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={surpriseMe}>
            Surprise me
          </Button>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Recipe categories"
        >
          {categoriesQuery.isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          {categoriesQuery.isError && (
            <p className="text-sm text-destructive" role="alert">
              Could not load categories.
              {!navigator.onLine && " You appear to be offline."}
            </p>
          )}
          <button
            type="button"
            role="listitem"
            onClick={clearFilters}
            className="rounded-md focus-visible:outline-none"
          >
            <Badge variant={!query && !category ? "default" : "outline"}>
              Vegetarian & Vegan
            </Badge>
          </button>
          {orderedCategories.map((cat) => (
            <button
              key={cat.idCategory}
              type="button"
              role="listitem"
              onClick={() => selectCategory(cat.strCategory)}
              className="rounded-md focus-visible:outline-none"
              aria-pressed={category === cat.strCategory}
            >
              <Badge
                variant={
                  category === cat.strCategory ? "default" : "secondary"
                }
              >
                {cat.strCategory}
              </Badge>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="results-heading" aria-busy={mealsQuery.isLoading}>
        <h2 id="results-heading" className="sr-only">
          Recipe results
        </h2>

        {mealsQuery.isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {mealsQuery.isError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-card p-6"
          >
            <p className="font-medium text-destructive">
              {mealsQuery.error instanceof Error
                ? mealsQuery.error.message
                : "Failed to load recipes"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {!navigator.onLine
                ? "You are offline. Open Favorites for saved recipes, or reconnect to browse."
                : "Check the proxy server and try again."}
            </p>
            <Button className="mt-4" onClick={() => void mealsQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {mealsQuery.isSuccess && meals.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="font-display text-xl font-semibold">No recipes found</p>
            <p className="mt-1 text-muted-foreground">
              Try another search term or category.
            </p>
            <Button className="mt-4" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}

        {mealsQuery.isSuccess && meals.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => (
              <li key={meal.idMeal}>
                <RecipeCard meal={meal} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
