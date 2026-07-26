import { useEffect, useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMealById, type MealDetail } from "@/lib/api";
import {
  getFavorite,
  removeFavorite,
  saveFavorite,
} from "@/features/favorites/db";
import { cn } from "@/lib/utils";

type Props = {
  meal: Pick<MealDetail, "idMeal"> & Partial<MealDetail>;
  /** When true, only remove is allowed (used on Favorites page). */
  removeOnly?: boolean;
  className?: string;
  size?: "default" | "sm" | "icon";
};

export function FavoriteButton({
  meal,
  removeOnly = false,
  className,
  size = "icon",
}: Props) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getFavorite(meal.idMeal).then((fav) => {
      if (!cancelled) setActive(Boolean(fav));
    });
    return () => {
      cancelled = true;
    };
  }, [meal.idMeal]);

  async function resolveFullMeal(): Promise<MealDetail> {
    // Prefer an already-complete payload (details page / prior cache).
    if (meal.strInstructions) {
      return meal as MealDetail;
    }

    // Offline: reuse a previously saved favorite record if present.
    const existing = await getFavorite(meal.idMeal);
    if (existing?.strInstructions) {
      return existing;
    }

    // Online: fetch full detail through the proxy so offline favorites are useful.
    const data = await getMealById(meal.idMeal);
    const full = data.meals?.[0];
    if (!full) {
      throw new Error("Could not load recipe details to favorite.");
    }
    return full;
  }

  async function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (active || removeOnly) {
        await removeFavorite(meal.idMeal);
        setActive(false);
        toast.success("Removed from favorites");
        window.dispatchEvent(new CustomEvent("favorites:changed"));
      } else {
        const full = await resolveFullMeal();
        await saveFavorite(full);
        setActive(true);
        toast.success("Saved to favorites");
        window.dispatchEvent(new CustomEvent("favorites:changed"));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update favorites";
      if (!navigator.onLine) {
        toast.error(
          "Offline — open a cached recipe first, then favorite it."
        );
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={active ? "default" : "secondary"}
      size={size}
      className={cn(className)}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      disabled={busy}
      onClick={toggle}
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-current")}
        aria-hidden="true"
      />
      {size !== "icon" && <span>{active ? "Favorited" : "Favorite"}</span>}
    </Button>
  );
}
