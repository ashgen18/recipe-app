import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { MealDetail, MealSummary } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  meal: MealSummary | MealDetail;
};

export function RecipeCard({ meal }: Props) {
  return (
    <Card className="group overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link to={`/meal/${meal.idMeal}`} className="block h-full w-full">
          <img
            src={meal.strMealThumb}
            alt={`Photo of ${meal.strMeal}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute right-2 top-2">
          <FavoriteButton meal={meal} />
        </div>
      </div>
      <CardHeader className="space-y-2">
        <CardTitle>
          <Link
            to={`/meal/${meal.idMeal}`}
            className="hover:text-primary hover:underline"
          >
            {meal.strMeal}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {meal.strCategory && (
          <Badge variant="secondary">{meal.strCategory}</Badge>
        )}
        {meal.strArea && <Badge variant="outline">{meal.strArea}</Badge>}
      </CardContent>
    </Card>
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </CardContent>
    </Card>
  );
}
