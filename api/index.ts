import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/createApp.js";

let appPromise: Promise<Express> | null = null;

// Add global error handlers for uncaught exceptions in serverless environment
// This prevents database connection errors from crashing the entire function
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  process.on('uncaughtException', (error) => {
    console.error('[serverless] Uncaught exception:', error);
    // Don't exit the process in serverless - let the current request fail gracefully
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[serverless] Unhandled rejection at:', promise, 'reason:', reason);
    // Don't exit the process in serverless - let the current request fail gracefully
  });
}

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp({ enableWebSocket: false, provideServer: false }).then(
      ({ app }) => app,
    );
  }

  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (error) {
    console.error('[serverless] Error in request handler:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }));
    }
  }
}

