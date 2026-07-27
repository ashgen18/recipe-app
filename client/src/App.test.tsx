import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";
import type { Recipe } from "./types.js";

const sampleRecipes: Recipe[] = [
  {
    id: "1",
    title: "Sample Soup",
    description: "Warm and cozy.",
    ingredients: ["water", "salt"],
    steps: ["boil water"],
    minutes: 15,
    servings: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Promise.resolve({
        ok: true,
        json: async () => sampleRecipes,
      } as Response),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renders the heading", async () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /recipe app/i }),
    ).toBeInTheDocument();
  });

  it("shows recipes loaded from the API", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Sample Soup")).toBeInTheDocument();
    });
  });

  it("exposes mobile primary navigation tabs", async () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(nav).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^browse$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^details$/i }),
    ).toBeInTheDocument();
  });
});
