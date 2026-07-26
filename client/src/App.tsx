import { useEffect, useMemo, useState } from "react";
import {
  createRecipe,
  deleteRecipe,
  fetchRecipes,
  type NewRecipeInput,
} from "./api.js";
import type { Recipe } from "./types.js";

const EMPTY_FORM = {
  title: "",
  description: "",
  ingredients: "",
  steps: "",
  minutes: "20",
  servings: "2",
};

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await fetchRecipes();
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selected = useMemo(
    () => recipes.find((r) => r.id === selectedId) ?? null,
    [recipes, selectedId],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload: NewRecipeInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      ingredients: toLines(form.ingredients),
      steps: toLines(form.steps),
      minutes: Number(form.minutes) || 0,
      servings: Number(form.servings) || 1,
    };
    if (!payload.title) {
      setError("Please give your recipe a title.");
      return;
    }
    try {
      const created = await createRecipe(payload);
      setForm({ ...EMPTY_FORM });
      setError(null);
      await refresh();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRecipe(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe.");
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🍳 Recipe App</h1>
        <p>Save, browse, and revisit your favorite recipes.</p>
      </header>

      {error && <div className="banner banner--error">{error}</div>}

      <main className="layout">
        <section className="panel">
          <h2>Add a recipe</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                type="text"
                value={form.title}
                placeholder="Grandma's Apple Pie"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                placeholder="A short summary of the dish"
                rows={2}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <div className="form__row">
              <label>
                Minutes
                <input
                  type="number"
                  min={0}
                  value={form.minutes}
                  onChange={(e) =>
                    setForm({ ...form, minutes: e.target.value })
                  }
                />
              </label>
              <label>
                Servings
                <input
                  type="number"
                  min={1}
                  value={form.servings}
                  onChange={(e) =>
                    setForm({ ...form, servings: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Ingredients (one per line)
              <textarea
                value={form.ingredients}
                placeholder={"2 cups flour\n1 cup sugar"}
                rows={4}
                onChange={(e) =>
                  setForm({ ...form, ingredients: e.target.value })
                }
              />
            </label>
            <label>
              Steps (one per line)
              <textarea
                value={form.steps}
                placeholder={"Preheat oven to 350F\nMix the dry ingredients"}
                rows={4}
                onChange={(e) => setForm({ ...form, steps: e.target.value })}
              />
            </label>
            <button type="submit" className="button button--primary">
              Save recipe
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Recipes ({recipes.length})</h2>
          {loading ? (
            <p>Loading…</p>
          ) : recipes.length === 0 ? (
            <p className="muted">No recipes yet. Add your first one!</p>
          ) : (
            <ul className="recipe-list">
              {recipes.map((recipe) => (
                <li
                  key={recipe.id}
                  className={
                    recipe.id === selectedId
                      ? "recipe-list__item recipe-list__item--active"
                      : "recipe-list__item"
                  }
                >
                  <button
                    type="button"
                    className="recipe-list__select"
                    onClick={() => setSelectedId(recipe.id)}
                  >
                    <strong>{recipe.title}</strong>
                    <span className="muted">
                      {recipe.minutes} min · {recipe.servings} servings
                    </span>
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    aria-label={`Delete ${recipe.title}`}
                    onClick={() => handleDelete(recipe.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel--detail">
          <h2>Details</h2>
          {selected ? (
            <article className="detail">
              <h3>{selected.title}</h3>
              {selected.description && <p>{selected.description}</p>}
              <p className="muted">
                {selected.minutes} minutes · {selected.servings} servings
              </p>
              <h4>Ingredients</h4>
              {selected.ingredients.length ? (
                <ul>
                  {selected.ingredients.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No ingredients listed.</p>
              )}
              <h4>Steps</h4>
              {selected.steps.length ? (
                <ol>
                  {selected.steps.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p className="muted">No steps listed.</p>
              )}
            </article>
          ) : (
            <p className="muted">Select a recipe to see the full details.</p>
          )}
        </section>
      </main>
    </div>
  );
}
