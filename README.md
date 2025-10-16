# Cisco Solution Sprint App

This repository hosts the current Express + Vite implementation of the Cisco Solution Sprint experience. It powers the public marketing site, the guided sprint flow, leaderboard visualisations, and internal admin tooling.

The codebase is in the process of being refactored for a Vercel deployment. This document summarises the current state, outlines local development steps, and captures the immediate migration work that has been executed so far.

## What changed in this iteration?

- Removed legacy Replit-only Vite plugins (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`).
- Pruned unused authentication/session packages (passport, express-session, connect-pg-simple, memorystore) plus their TypeScript types.
- Dropped the unused `better-sqlite3` dependency that was only required by the original Replit scaffold.
- Simplified the Vite configuration so that local development matches what we will run on Vercel.

These steps eliminate packages that would bloat the Vercel bundle and remove tooling that is incompatible with the Vercel build environment.

## Local development

```bash
npm install
npm run dev
```

The development server boots the Express API (from `server/index.ts`) and Vite dev server together. Environment variables are loaded from your shell. Required variables:

- `DATABASE_URL` – Neon/Vercel Postgres connection string.
- `OPENAI_API_KEY` – API key used by the AI orchestration layer.
- `ADMIN_KEY` – Shared secret that guards the admin HTTP routes.

Optional tuning variables can remain unset (`CHAT_MODEL`, `EVAL_MODEL`, etc.) while working locally.

## Building the project

The current build pipeline generates static assets into `dist/public` and bundles the Express server entrypoint with esbuild. This is sufficient for preview deployments on a traditional Node host. Until the Vercel migration finishes, you can replicate production locally with:

```bash
npm run build
npm run start
```

## Vercel migration status

We are following the staged task list captured in [`docs/CODEBASE_REVIEW.md`](docs/CODEBASE_REVIEW.md). With the dependency cleanup now complete, the next milestones are:

1. Restructure the repository for a serverless-friendly architecture (either a Next.js 14 app or split Vite static + serverless handlers).
2. Replace in-memory session and rate-limiting maps with persistent storage (Postgres or Vercel KV).
3. Rebuild API routes as edge/serverless functions and select a managed provider for real-time leaderboard updates.

A companion deployment runbook for Vercel (environment variables, build command, output directory, and required integrations) will be added once the new architecture is scaffolded.

## Repository structure

- `client/` – React 18 + Vite front-end.
- `server/` – Express server, REST APIs, WebSocket handler, and storage helpers.
- `shared/` – TypeScript types and Drizzle schema definitions shared between client and server.
- `docs/` – Architecture review and migration planning artefacts.
- `attached_assets/` – Static imagery and audio used across the marketing and leaderboard views.

## License

MIT
