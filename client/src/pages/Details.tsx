import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Youtube } from "lucide-react";
import { getIngredients, getMealById } from "@/lib/api";
import { getFavorite } from "@/features/favorites/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";

export function Details() {
  const { id = "" } = useParams();

  const mealQuery = useQuery({
    queryKey: ["meal", id],
    enabled: Boolean(id),
    queryFn: async () => {
      // Prefer IndexedDB immediately when offline so details render without waiting on network errors.
      if (!navigator.onLine) {
        const fav = await getFavorite(id);
        if (fav) return fav;
      }

      try {
        const data = await getMealById(id);
        const meal = data.meals?.[0];
        if (meal) return meal;
        throw new Error("Recipe not found");
      } catch (err) {
        // Offline / API failure fallback: serve from IndexedDB favorites if present
        const fav = await getFavorite(id);
        if (fav) return fav;
        throw err;
      }
    },
  });

  if (mealQuery.isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="aspect-[16/9] w-full max-h-[420px]" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (mealQuery.isError || !mealQuery.data) {
    return (
      <section role="alert" className="rounded-lg border bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Recipe unavailable
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mealQuery.error instanceof Error
            ? mealQuery.error.message
            : "Could not load this recipe."}
          {!navigator.onLine &&
            " You are offline — try Favorites if you saved this meal."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/">Browse recipes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/favorites">Favorites</Link>
          </Button>
        </div>
      </section>
    );
  }

  const meal = mealQuery.data;
  const ingredients = getIngredients(meal);
  const tags =
    meal.strTags
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [];

  return (
    <article className="space-y-8">
      <div className="max-w-xl overflow-hidden rounded-xl border bg-card">
        <div className="aspect-[4/3] bg-muted">
          <img
            src={meal.strMealThumb}
            alt={`Photo of ${meal.strMeal}`}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {meal.strMeal}
          </h1>
          <div className="flex flex-wrap gap-2">
            {meal.strCategory && (
              <Badge variant="secondary">{meal.strCategory}</Badge>
            )}
            {meal.strArea && <Badge variant="outline">{meal.strArea}</Badge>}
            {tags.map((tag) => (
              <Badge key={tag} variant="accent">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <FavoriteButton meal={meal} size="default" />
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="ingredients-heading">
          <h2
            id="ingredients-heading"
            className="font-display text-2xl font-semibold"
          >
            Ingredients
          </h2>
          <ul className="mt-4 space-y-2">
            {ingredients.map(({ ingredient, measure }) => (
              <li
                key={`${ingredient}-${measure}`}
                className="flex justify-between gap-4 border-b border-border/70 py-2 text-sm"
              >
                <span>{ingredient}</span>
                <span className="text-muted-foreground">{measure}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="instructions-heading">
          <h2
            id="instructions-heading"
            className="font-display text-2xl font-semibold"
          >
            Instructions
          </h2>
          <div className="mt-4 space-y-4 whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {meal.strInstructions}
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap gap-3">
        {meal.strYoutube && (
          <Button asChild variant="secondary">
            <a
              href={meal.strYoutube}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Youtube className="h-4 w-4" aria-hidden="true" />
              Watch on YouTube
            </a>
          </Button>
        )}
        {meal.strSource && (
          <Button asChild variant="outline">
            <a href={meal.strSource} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Source
            </a>
          </Button>
        )}
      </footer>
    </article>
  );
}
