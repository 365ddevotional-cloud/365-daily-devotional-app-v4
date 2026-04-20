import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function summarizeResponseBody(body: unknown): string {
  if (body == null) return "empty";
  if (Array.isArray(body)) return `array(length=${body.length})`;
  if (typeof body === "object") {
    const keys = Object.keys(body as Record<string, unknown>);
    return `object(keys=${keys.slice(0, 8).join(",")}${keys.length > 8 ? ",…" : ""})`;
  }
  return typeof body;
}

export async function createApp(options?: {
  enableStatic?: boolean;
}): Promise<{ app: express.Express; httpServer: Server }> {
  const app = express();
  const httpServer = createServer(app);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  const configuredCorsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const allowedOrigin = configuredCorsOrigin || requestOrigin;

    if (allowedOrigin) {
      res.header("Access-Control-Allow-Origin", allowedOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    console.warn(
      "WARNING: SESSION_SECRET not set. Using default for development only.",
    );
  }

  const usesExternalFrontend = Boolean(configuredCorsOrigin);

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      secret: sessionSecret || "dev-only-secret-not-for-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: usesExternalFrontend ? "none" : "lax",
      },
    }),
  );

  app.use((req, res, next) => {
    const start = Date.now();
    const requestPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = ((bodyJson: any) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson);
    }) as typeof res.json;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (requestPath.startsWith("/api")) {
        let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse !== undefined) {
          logLine += ` :: ${summarizeResponseBody(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  if (options?.enableStatic !== false) {
    const publicDir = path.join(process.cwd(), "client", "public");
    const distPublicDir = path.join(process.cwd(), "dist", "public");
    const isDevelopment = process.env.NODE_ENV === "development";

    app.use(express.static(publicDir));

    if (!isDevelopment) {
      app.use(express.static(distPublicDir));
    }

    app.get("/manifest.json", (_req, res) => {
      const manifestPath = isDevelopment
        ? path.join(publicDir, "manifest.json")
        : path.join(distPublicDir, "manifest.json");
      res.sendFile(manifestPath);
    });
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (options?.enableStatic !== false) {
    if (process.env.NODE_ENV === "development") {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    } else {
      serveStatic(app);
    }
  }

  return { app, httpServer };
}
