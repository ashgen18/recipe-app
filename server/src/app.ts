import cors from "cors";
import express, { type Request, type Response } from "express";
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
} from "./store.js";
import type { NewRecipe } from "./types.js";

function parseNewRecipe(body: unknown): NewRecipe | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) {
    return { error: "A recipe title is required." };
  }
  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.map((v) => String(v).trim()).filter((v) => v.length > 0)
      : [];

  return {
    title,
    description: typeof b.description === "string" ? b.description.trim() : "",
    ingredients: toStringArray(b.ingredients),
    steps: toStringArray(b.steps),
    minutes: Number.isFinite(Number(b.minutes)) ? Number(b.minutes) : 0,
    servings: Number.isFinite(Number(b.servings)) ? Number(b.servings) : 1,
  };
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/api/recipes", (_req: Request, res: Response) => {
    res.json(listRecipes());
  });

  app.get("/api/recipes/:id", (req: Request, res: Response) => {
    const recipe = getRecipe(req.params.id);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.json(recipe);
  });

  app.post("/api/recipes", (req: Request, res: Response) => {
    const parsed = parseNewRecipe(req.body);
    if ("error" in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    res.status(201).json(createRecipe(parsed));
  });

  app.delete("/api/recipes/:id", (req: Request, res: Response) => {
    const removed = deleteRecipe(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.status(204).end();
  });

  return app;
}
