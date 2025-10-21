import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes.js";
import { log } from "./logging.js";

export interface CreateAppOptions {
  enableWebSocket?: boolean;
  provideServer?: boolean;
}

export interface CreateAppResult {
  app: Express;
  server: Server | null;
}

export async function createApp(
  options: CreateAppOptions = {},
): Promise<CreateAppResult> {
  const { enableWebSocket = true, provideServer = enableWebSocket } = options;

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    } as typeof res.json;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  const server = provideServer ? createServer(app) : null;
  const httpServer = await registerRoutes(app, {
    server,
    enableWebSocket,
  });

  if (enableWebSocket && !(httpServer ?? server)) {
    throw new Error("WebSocket support requested but no HTTP server was initialised");
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  return {
    app,
    server: httpServer ?? server,
  };
}

