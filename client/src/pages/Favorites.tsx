import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, Filter } from "lucide-react";
import {
  getAllFavorites,
  type FavoriteMeal,
} from "@/features/favorites/db";
import { RecipeCard, RecipeCardSkeleton } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SortDir = "newest" | "az" | "za";

export function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteMeal[] | null>(null);
  const [sort, setSort] = useState<SortDir>("newest");
  const [filterText, setFilterText] = useState("");
  const [category, setCategory] = useState<string>("");

  const load = useCallback(async () => {
    const all = await getAllFavorites();
    setFavorites(all);
  }, []);

  useEffect(() => {
    void load();
    function onChange() {
      void load();
    }
    window.addEventListener("favorites:changed", onChange);
    return () => window.removeEventListener("favorites:changed", onChange);
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const f of favorites ?? []) {
      if (f.strCategory) set.add(f.strCategory);
    }
    return Array.from(set).sort();
  }, [favorites]);

  const visible = useMemo(() => {
    let list = [...(favorites ?? [])];
    if (category) {
      list = list.filter((f) => f.strCategory === category);
    }
    if (filterText.trim()) {
      const q = filterText.trim().toLowerCase();
      list = list.filter((f) => f.strMeal.toLowerCase().includes(q));
    }
    if (sort === "az") {
      list.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
    } else if (sort === "za") {
      list.sort((a, b) => b.strMeal.localeCompare(a.strMeal));
    } else {
      list.sort((a, b) => b.savedAt - a.savedAt);
    }
    return list;
  }, [favorites, category, filterText, sort]);

  if (favorites === null) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Favorites
          </h1>
          <p className="mt-1 text-muted-foreground">
            Saved on this device via IndexedDB — available offline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={sort === "newest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("newest")}
            aria-pressed={sort === "newest"}
          >
            Newest
          </Button>
          <Button
            type="button"
            variant={sort === "az" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("az")}
            aria-pressed={sort === "az"}
          >
            <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
            A–Z
          </Button>
          <Button
            type="button"
            variant={sort === "za" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("za")}
            aria-pressed={sort === "za"}
          >
            <ArrowUpAZ className="h-4 w-4" aria-hidden="true" />
            Z–A
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" size="sm">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter favorites</DialogTitle>
                <DialogDescription>
                  Narrow by name or category. Filters apply only on this page.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fav-filter" className="text-sm font-medium">
                    Name contains
                  </label>
                  <Input
                    id="fav-filter"
                    className="mt-1"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="e.g. chicken"
                  />
                </div>
                <div className="flex flex-wrap gap-2" role="list">
                  <button
                    type="button"
                    onClick={() => setCategory("")}
                    aria-pressed={!category}
                  >
                    <Badge variant={!category ? "default" : "outline"}>All</Badge>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                    >
                      <Badge variant={category === c ? "default" : "secondary"}>
                        {c}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {favorites.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-display text-xl font-semibold">No favorites yet</p>
          <p className="mt-1 text-muted-foreground">
            Heart a recipe to save it for offline cooking.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Browse recipes</Link>
          </Button>
        </div>
      )}

      {favorites.length > 0 && visible.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-display text-xl font-semibold">No matches</p>
          <p className="mt-1 text-muted-foreground">
            Adjust your filter to see saved recipes.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              setFilterText("");
              setCategory("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((meal) => (
            <li key={meal.idMeal}>
              <RecipeCard meal={meal} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
