import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/createApp.js";

let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp({ enableWebSocket: false, provideServer: false }).then(
      ({ app }) => app,
    );
  }

  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  app(req, res);
}

