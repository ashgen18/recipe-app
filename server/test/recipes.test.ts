import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("recipes API", () => {
  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("lists recipes", async () => {
    const res = await request(app).get("/api/recipes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("creates and fetches a recipe", async () => {
    const create = await request(app)
      .post("/api/recipes")
      .send({
        title: "Test Toast",
        description: "Toasted bread.",
        ingredients: ["1 slice bread"],
        steps: ["Toast the bread."],
        minutes: 3,
        servings: 1,
      });
    expect(create.status).toBe(201);
    expect(create.body.id).toBeTruthy();

    const fetched = await request(app).get(`/api/recipes/${create.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.title).toBe("Test Toast");

    await request(app).delete(`/api/recipes/${create.body.id}`);
  });

  it("rejects a recipe without a title", async () => {
    const res = await request(app).post("/api/recipes").send({ title: "" });
    expect(res.status).toBe(400);
  });
});
