import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mealdbRouter from "./routes/mealdb.js";

const PORT = Number(process.env.PORT) || 5174;

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: true, // allow Vite/dev origins; tighten in production if needed
    methods: ["GET", "OPTIONS"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "recipe-app-server" });
});

// All TheMealDB traffic is proxied under /api/*
app.use("/api", mealdbRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Recipe proxy listening on http://localhost:${PORT}`);
  console.log("API key is server-side only (MEALDB_API_KEY).");
});
