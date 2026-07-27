import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = NODE_ENV === "production";

/** Optional comma-separated list of allowed browser origins (split client/server deploys). */
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Compiled output lives in server/dist → client build is ../../client/dist
const clientDist = path.resolve(__dirname, "../../client/dist");

const app = express();

app.use(
  helmet({
    // Allow MealDB images + Google Fonts used by the PWA shell
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "img-src": [
          "'self'",
          "data:",
          "https://www.themealdb.com",
          "https://*.themealdb.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "connect-src": ["'self'", ...CORS_ORIGINS],
        "media-src": ["'self'", "https://www.themealdb.com"],
        "frame-src": ["'self'", "https://www.youtube.com"],
        "worker-src": ["'self'"],
        "manifest-src": ["'self'"],
      },
    },
    // SPA + service worker over a single origin
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: CORS_ORIGINS.length > 0 ? CORS_ORIGINS : true,
    methods: ["GET", "OPTIONS"],
  })
);
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "recipe-app-server" });
});

// All TheMealDB traffic is proxied under /api/*
app.use("/api", mealdbRouter);

// Production: serve the Vite build from the same host (one public URL)
if (isProd) {
  app.use(
    express.static(clientDist, {
      // Keep hashed assets cached; HTML/SW revalidated
      setHeaders(res, filePath) {
        if (filePath.endsWith("sw.js")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // SPA fallback for client-side routes (/meal/:id, /favorites, …)
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((req: Request, res: Response) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
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
  console.log(`Recipe app listening on http://localhost:${PORT}`);
  console.log(`Mode: ${NODE_ENV}`);
  console.log("API key is server-side only (MEALDB_API_KEY).");
});
