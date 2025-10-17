# Cisco Solution Sprint Codebase Review

_Last updated: 2025-10-16_

## Executive Summary
- The project is a monolithic Express + Vite application with a React client that powers the Cisco Solution Sprint experience, including an AI-guided chat flow, automated scoring, and a live leaderboard.【F:server/index.ts†L1-L71】【F:client/src/App.tsx†L1-L39】
- Runtime behaviour depends on several long-lived in-memory maps (sessions, rate limiting) and direct WebSocket broadcasts, which will not survive Vercel's serverless execution model without redesign.【F:server/routes.ts†L16-L139】【F:server/ws.ts†L1-L37】
- Data is persisted in Neon/Postgres via Drizzle ORM, but there is no schema or migration story for session data; leaderboard logic is embedded in large utility methods and JSON blobs that complicate maintenance.【F:server/db.ts†L1-L15】【F:server/storage.ts†L61-L675】【F:shared/schema.ts†L8-L87】
- The repo still carries significant Replit-specific tooling and unused dependencies (passport, express-session, better-sqlite3, etc.), signalling legacy baggage to trim before porting to Vercel.【F:vite.config.ts†L1-L37】【F:package.json†L13-L112】

## Frontend Architecture

### Framework & Tooling
- React 18 with TypeScript, built via Vite; entrypoint mounts `App` into `#root` and applies global styles.【F:client/src/main.tsx†L1-L5】
- Routing uses Wouter with TanStack Query for data fetching and caching.【F:client/src/App.tsx†L1-L39】【F:client/src/lib/queryClient.ts†L1-L57】
- UI composition leans on shadcn/Radix components and Tailwind classes; there is extensive bespoke animation/audio logic for the leaderboard view.【F:client/src/pages/Leaderboard.tsx†L1-L157】

### Key Screens
- **Home**: marketing splash with terms gate and CTA buttons; includes hidden admin links in the header.【F:client/src/pages/Home.tsx†L1-L205】
- **Play**: (not reviewed line-by-line) hosts the sprint conversation workflow, pulling in chat, metrics, and AI assistance.
- **Leaderboard**: consumes `/api/dashboard-data` and WebSocket updates to animate rankings, word clouds, and stats; also drives an announcement mode for new submissions.【F:client/src/pages/Leaderboard.tsx†L87-L156】
- **Admin views**: accessible via hidden routes, fetch detailed leaderboards and stats (relying on admin headers server-side).

### Observations & Risks
- Real-time behaviour depends on a browser WebSocket connecting to `/ws` on the same host. This assumes sticky processes and breaks under Vercel's serverless routing without a managed WebSocket provider or SSE alternative.【F:client/src/lib/websocket.ts†L9-L88】
- Query client assumes cookie-based sessions, but the backend never sets cookies; `credentials: "include"` is redundant and may cause CORS friction post-port.【F:client/src/lib/queryClient.ts†L15-L41】
- There is no frontend feature flagging or build-time environment handling beyond Vite's defaults, complicating multi-env deployments.

## Backend Architecture

### Server Bootstrap
- Express app is created in `server/index.ts`, with JSON body parsing, API logging middleware, and environment-based Vite/static serving. Production expects prebuilt assets in `dist/public` that are served from the same Node process.【F:server/index.ts†L1-L70】
- The server is started manually via `server.listen(...)`; there is no clustering or graceful shutdown handling, which is acceptable on Replit but not on Vercel (serverless functions do not expose long-lived listeners).

### Routing & Business Logic
- `registerRoutes` wires REST endpoints for session start, chat, submission, leaderboard, dashboard, and admin CRUD for stats/categories. The function also seeds the HTTP server with WebSocket support and static file serving.【F:server/routes.ts†L129-L675】
- Sessions and rate limits are stored in `Map` instances in memory, meaning every server restart drops user context and multiple instances would desync—unworkable for Vercel's ephemeral lambdas.【F:server/routes.ts†L16-L139】
- Submission handling normalizes structured form data, calls OpenAI for categorisation and scoring, persists to Postgres, then broadcasts a WebSocket update.【F:server/routes.ts†L199-L316】
- Admin endpoints trust an `x-admin-key` header and expose full leaderboard data without authentication layers or audit logging.【F:server/routes.ts†L400-L545】

### AI Integration
- All OpenAI access is funneled through `server/openai.ts`, which defines prompts, selects GPT-4o by default, and uses the legacy Chat Completions API with `max_completion_tokens` tuning.【F:server/openai.ts†L1-L200】
- Evaluation applies participation floors and clamps subscores before recomputing totals, returning fallback scores on error.【F:server/openai.ts†L151-L205】
- API keys default to `default_key` when missing, masking misconfiguration and risking accidental production exposure.【F:server/openai.ts†L5-L13】

### Data Layer
- `server/db.ts` wires Drizzle ORM to a Neon/Postgres connection, requiring a persistent connection string (`DATABASE_URL` or a `POSTGRES_URL*` secret). WebSocket support is patched via Neon config to allow serverless usage.【F:server/db.ts†L1-L25】
- Drizzle schema defines `participants`, `submissions`, `data3Stats`, and `customCategories`; submissions store JSON blobs (`structuredJson`, `subScores`) as text, implying downstream parsing everywhere.【F:shared/schema.ts†L8-L87】
- Storage helper is a 600+ line object mixing seed logic, leaderboard queries, word-cloud tokenisation, and admin CRUD—a prime candidate for modularisation.【F:server/storage.ts†L6-L675】
- Default stats are seeded automatically unless `NODE_ENV === 'production'`, but the guard relies on runtime environment correctness and still executes queries on every cold start.【F:server/storage.ts†L22-L48】

## Deployment & DevOps
- `package.json` scripts bundle server code with esbuild and expect a Node runtime serving both API and static assets—compatible with Replit or traditional servers, not Vercel's serverless platform.【F:package.json†L6-L12】
- Vite config injects Replit-specific plugins (`runtime-error-modal`, `cartographer`) and sets aliases rooted to the current directory, none of which translate to Vercel automatically.【F:vite.config.ts†L6-L37】
- `replit.md` serves as the de facto project README but still references SQLite and Replit deployment, demonstrating documentation drift from the Neon-based implementation.【F:replit.md†L35-L66】

## Legacy & Unused Inventory
- Dependencies such as `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`, and `better-sqlite3` are listed but unused in the codebase, likely remnants from earlier auth experiments.【F:package.json†L46-L112】
- Frontend assets reference `attached_assets/` for imagery; confirm whether all assets are required during migration or can be moved to a CDN/static bucket.
- There is no automated test suite or lint configuration; quality gates rely entirely on manual testing.

## Refactoring Opportunities
1. **Modularise storage**: split `server/storage.ts` into dedicated repositories (participants, submissions, stats) with typed return values and shared parsing helpers to reduce accidental JSON handling bugs.【F:server/storage.ts†L61-L675】
2. **Persist sessions & rate limits**: replace in-memory maps with database tables (e.g., `sessions`, `submission_rate_limits`) keyed by token/IP to support horizontal scaling.【F:server/routes.ts†L16-L139】
3. **Normalize structured data**: instead of storing `structuredJson` blobs, introduce relational tables for metrics, action items, etc., enabling richer queries and analytics on Vercel.【F:shared/schema.ts†L18-L44】
4. **Centralise OpenAI config**: enforce required env vars, support streaming responses, and migrate to the Responses API to reduce latency and align with modern SDK usage.【F:server/openai.ts†L5-L205】
5. **Strengthen admin auth**: implement proper authentication (e.g., Auth0, Clerk, or signed tokens) and audit logging for admin routes before internet-facing deployment.【F:server/routes.ts†L400-L545】
6. **Remove Replit tooling**: drop Cartographer/runtime overlay plugins and unused deps to shrink bundle size and simplify CI/CD.【F:vite.config.ts†L6-L37】【F:package.json†L46-L112】

## Vercel Migration Considerations
- **Runtime Model**: Vercel functions are stateless; Express listeners and WebSockets must be replaced with Next.js route handlers and a managed real-time service (Ably, Pusher, or Vercel's Edge functions + SSE).【F:server/index.ts†L39-L70】【F:server/ws.ts†L1-L37】
- **Data Persistence**: Continue using Neon/Vercel Postgres but formalise schema migrations (Drizzle `drizzle-kit push`) and add new tables for sessions and rate limiting. Consider storing structured solution data in typed tables for simpler serverless access.【F:server/db.ts†L1-L15】【F:shared/schema.ts†L8-L87】
- **Asset Hosting**: Move static assets into Next.js `public/` or Vercel Blob storage; stop serving via Express static middleware.【F:server/routes.ts†L133-L141】
- **Environment Variables**: Replace `default_key` fallbacks and document required env vars (`OPENAI_API_KEY`, `DATABASE_URL`/`POSTGRES_URL*`, `ADMIN_KEY`, optional `CHAT_MODEL`/`EVAL_MODEL`).【F:server/openai.ts†L5-L13】
- **Build Process**: Swap Vite + esbuild pipeline for Next.js `next build`, eliminating the need for manual bundling; ensure Tailwind config adapts to Next.js conventions.
- **Real-time Updates**: Evaluate migrating leaderboard refresh to polling + SSE or integrate Vercel's `@vercel/kv` pub/sub or a third-party Pusher channel; adjust frontend hook accordingly.【F:client/src/lib/websocket.ts†L9-L88】

## Proposed Task List for Vercel Port
1. **Repository hygiene** – Remove unused dependencies and Replit-only tooling; add a conventional README that supersedes `replit.md`. Update scripts to reflect the migration plan.【F:package.json†L6-L112】【F:vite.config.ts†L6-L37】
2. **Define Vercel architecture** – Scaffold a Next.js 14 project (App Router) with TypeScript, Tailwind, and shadcn component setup; map current routes (`/`, `/play`, `/leaderboard`, admin) into pages/layouts.
3. **Extract shared domain logic** – Move Zod schemas and TypeScript types into a `packages/shared` module consumable by both API handlers and React components.【F:shared/schema.ts†L8-L87】
4. **Rebuild API endpoints** – Port Express routes into Next.js route handlers (e.g., `/api/start/route.ts`), replacing middleware with per-handler validation. Ensure streaming or incremental responses for chat where useful.【F:server/routes.ts†L129-L375】
5. **Persist sessions** – Introduce a `sessions` table in Drizzle, storing `sessionToken`, `participantId`, timestamps, and message history pointers; update handlers to load/save session state from Postgres (or Redis) instead of in-memory maps.【F:server/routes.ts†L16-L195】
6. **Implement rate limiting** – Replace in-memory `Map` with a database-backed or KV-based throttle (e.g., Upstash Redis, Vercel KV). Document cooldown values for ops.【F:server/routes.ts†L199-L238】
7. **Restructure structured data** – Create normalized tables (`metrics`, `actions`, `risks`) linked to submissions; adapt storage methods and UI queries to consume typed rows instead of parsing JSON strings.【F:server/storage.ts†L61-L675】
8. **AI integration hardening** – Update to OpenAI Responses API with enforced env vars, improved error handling, and instrumentation (logging, tracing). Remove `default_key` fallback and adopt streaming if beneficial.【F:server/openai.ts†L5-L205】
9. **Real-time delivery** – Choose a Vercel-compatible solution (e.g., SSE via Edge route or Ably). Update frontend `useWebSocket` hook to use the new protocol, adding exponential backoff only where the provider lacks reliability.【F:client/src/lib/websocket.ts†L9-L88】
10. **Admin authentication** – Implement secure auth (JWT + NextAuth, Clerk, etc.) and migrate admin endpoints to require verified identity; log actions for audit compliance.【F:server/routes.ts†L400-L545】
11. **Deployment pipeline** – Configure Vercel project with environment variables, Drizzle migrations in CI, and preview deployments. Verify Neon connection pooling via `@neondatabase/serverless` works in Edge/serverless contexts.【F:server/db.ts†L1-L15】
12. **Functional testing** – Add integration tests (Playwright/Cypress) for sprint flow and leaderboard plus API contract tests. Ensure scoreboard updates and admin workflows pass before going live.

## Open Questions / Follow-ups
- Decide whether to keep the existing React/Vite client and host it separately (Vercel static + serverless API) or fully embrace Next.js for unified hosting.
- Confirm legal/compliance requirements for storing participant data in Postgres when moving off Replit.
- Assess whether audio/animation assets require optimisation or CDN hosting for global performance.
