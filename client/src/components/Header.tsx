import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getRandomMeal } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    navigate(`/?q=${encodeURIComponent(trimmed)}`);
  }

  async function openRandomRecipe() {
    if (isRandomLoading) return;
    setIsRandomLoading(true);
    try {
      const data = await getRandomMeal();
      const meal = data.meals?.[0];
      if (!meal) throw new Error("Could not load a random recipe");
      navigate(`/meal/${meal.idMeal}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load a random recipe");
    } finally {
      setIsRandomLoading(false);
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-foreground/80 hover:bg-secondary"
    );

  const actionClass = cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground/80 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-primary"
          >
            <img
              src="/favicon.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg shadow-sm"
              decoding="async"
            />
            <span>Recipes</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 sm:hidden">
            <NavLink to="/" className={navClass} end>
              Browse
            </NavLink>
            <button
              type="button"
              onClick={openRandomRecipe}
              disabled={isRandomLoading}
              className={actionClass}
            >
              Random
            </button>
            <NavLink to="/favorites" className={navClass}>
              Favorites
            </NavLink>
            <ThemeToggle />
          </nav>
        </div>

        <form
          onSubmit={onSearch}
          role="search"
          className="flex flex-1 items-center gap-2"
          aria-label="Search recipes"
        >
          <label htmlFor="recipe-search" className="sr-only">
            Search recipes by name
          </label>
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="recipe-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes…"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 sm:flex"
        >
          <NavLink to="/" className={navClass} end>
            Browse
          </NavLink>
          <button
            type="button"
            onClick={openRandomRecipe}
            disabled={isRandomLoading}
            className={actionClass}
          >
            Random
          </button>
          <NavLink to="/favorites" className={navClass}>
            <Heart className="mr-1 h-4 w-4" aria-hidden="true" />
            Favorites
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
