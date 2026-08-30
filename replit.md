# Overview

This full-stack web application is designed for Data#3's "Cisco Solution Sprint" activation at Cisco Live Melbourne. Its primary purpose is to provide an interactive booth experience where attendees articulate frustrations, quantify impact, and propose metrics-driven action plans. The application features an AI-powered chat coach, an automated scoring system, and a live, animated leaderboard. The goal is to offer a dynamic and engaging experience that guides participants from problem identification to submission with clear KPIs.

# User Preferences

Preferred communication style: Simple, everyday language.

## Agent Instructions (read-first)
- Always read this file before starting any work.
- Before making changes, append a **Plan** entry in "Changelog" describing intended edits.
- After making changes, append **What changed / How / Results / Issues** and update "Future Planning" with next steps, items to validate, technical debt, and feature requests.
- Never overwrite past entries; always append and date-stamp.
- Safety: work on a branch, run tests, take a backup or snapshot before risky steps, and ask for confirmation before destructive operations.

# System Architecture

## Core Functionality
The application implements a "Three-Reply Sprint" methodology through a mobile-first, 4-step process: "Name the Problem," "Quantify the Impact," "Review & Confirm," and "Compete & Win." It targets three user replies with a hard cap of six inputs, allowing submissions at any point with the system inferring missing information.

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS with custom CSS variables (dark theme).
- **UI Components**: Radix UI and shadcn/ui.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Real-time Updates**: Custom WebSocket hook.

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API.
- **Database**: SQLite with Drizzle ORM.
- **Real-time Communication**: WebSocket server.
- **AI Integration**: OpenAI API.
- **Session Management**: In-memory session storage with rate limiting.

## Database Design
- **Tables**: `Participants` (user info), `Submissions` (solution details, scoring, category), and `CustomCategories` (persistent custom category definitions).
- **Schema Validation**: Zod.

## API Structure
- **Public Routes**: Home, leaderboard, solution crafting, "How to Play."
- **API Endpoints**: Session management, category listing, AI chat, solution submission, leaderboard data, health checks, admin functions.

## Real-time Features
- Live leaderboard updates via WebSocket, including animated score insertion, flash effects, confetti, and smooth ranking transitions.
- Real-time participant count and scoring updates.

## AI Integration
- **Sprint Coach**: GPT-4o guides users through the sprint process, pushing for quantified answers and aligning with scoring criteria.
- **Category Assignment**: GPT-4o automatically categorizes solutions into one of five predefined categories.
- **Solution Evaluation**: GPT-4o evaluates submissions against a five-criterion rubric (0-50 points) with participation floors and balanced scoring.
  - Clarity (0-10 points)
  - Impact (0-10 points)
  - KPI Strength (0-10 points)
  - Execution (0-10 points)
  - Confidence (0-10 points)
- **Structured Output**: AI formats solutions into a standardized JSON schema.
- **Prompts**: Step-specific guidance focused on clarity, quantification, and action plans.
- **AI Calls**: Exactly three inference calls per submission (chat, categorization, scoring).

## Security & Performance
- Rate limiting (60-second cooldown per IP).
- Input validation and sanitization.
- Configurable environment variables for API keys.
- Efficient caching with React Query.
- Optimistic UI updates.

## UI/UX Decisions
- Consistent dark theme with custom CSS variables.
- Unified color scheme across components for categories.
- Header image with custom Melbourne tech skyline.
- Exit/Home buttons with confirmation dialogs to prevent data loss.
- Category management system in the admin dashboard with persistent custom categories stored in database.
- Protected system categories (GENERAL, SCALE, EXPERTISE, and 4 solution types) cannot be edited or deleted.
- Custom categories (INFRASTRUCTURE, SECURITY, CLOUD, NETWORKING) can be fully managed with CRUD operations.
- Post-submission UI displays category-specific stats with color-coded headers for 5 minutes, then reverts to general stats.
- Word cloud consolidates case variations of common solution phrases to keep the display tidy.
- Fullscreen mode for leaderboard display (portrait-optimized) with toggle button and escape key exit.

# Production Safety

## Database Initialization
- Default stats and categories are ONLY initialized in development mode (NODE_ENV !== 'production')
- Production database maintains its own data without interference from deployment
- The `initializeData()` function in `server/storage.ts` checks environment before seeding
- No automatic data population occurs in production to preserve existing stats and categories

# External Dependencies

## Third-Party Services
- **OpenAI API**: Used for AI chat assistance (GPT-4o) and solution evaluation (GPT-4o).
- **Neon Database**: PostgreSQL database service for production deployment.

## Development & Deployment
- **Replit Platform**: Hosting and development environment.
- **Vite Development Server**: For optimized development experience.

## UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **shadcn/ui**: Pre-styled components built on Radix UI.
- **Lucide Icons**: Modern icon library.
- **Font Awesome**: Specialized icon set.

## Monitoring & Performance
- **TanStack Query**: Handles caching, background updates, and error handling.

## Changelog
- 2025-09-15 - **Plan**: Refresh the Home page hero copy with the new tagline, replace the four-step explainer with a concise
  bullet list aligned to Side 3 messaging, update CTA labels to match the signage script while keeping routes intact, and tighten
  the terms gate copy.
- 2025-09-15 - **What changed**: Updated the Home hero, explainer, CTA labels, and terms copy to reflect the new "Beat the Bot"
  storytelling flow.
  - **How**: Replaced the heading/subheading, swapped the four-step grid for a three-point bullet list, renamed the CTA buttons,
    and rewrote the terms text while retaining the checkbox gate.
  - **Results**: Copy now mirrors the onsite signage script and Side 3 messaging while preserving existing navigation behaviour.
  - **Issues**: None.

- 2026-08-30 - **Plan**: Add a responsive AI Practice Operating Architecture landing page at `/practice/oa`, use the supplied three-world artwork as the visual foundation for Capability Owner Index, AI Enablement Journey, and Innovation Engine, keep all assets relative to the Practice mount, and validate the static route without changing existing Practice experiences.

- 2026-08-30 - **What changed**: Added the AI Practice Operating Architecture landing page at `/practice/oa`, grounded in the supplied three-world artwork.
  - **How**: Created a self-contained semantic HTML page and responsive CSS treatment, reused one local JPEG with precise top/middle/bottom crops, and kept every page asset relative so the existing `/practice` Express/Vercel mount serves it correctly.
  - **Results**: Capability Owner Index, AI Enablement Journey, and Innovation Engine now have a cohesive responsive foundation; HTML structure, IDs, local assets, CSS balance, and static HTTP responses passed validation.
  - **Issues**: No functional blockers. Final deployed visual QA behind the Practice access gate remains a follow-up once the Vercel deployment completes.

- 2026-08-30 - **Plan**: Add the OA North Star once at the top of `/practice/oa`, make each of the three system cards open a large accessible detail overlay using the supplied guidance copy, and implement responsive full-height mobile sheets with focus, dismissal, safe-area, and background-scroll handling.

## Future Planning
- Validate `/practice/oa` behind the production Practice access gate on desktop and a narrow phone after deployment.
- Decide the navigation and content model inside each of the three OA worlds before making the foundation cards interactive.
- Confirm the foundation descriptions and terminology with AI Practice leadership.
- Replace the composite source with purpose-exported individual world panels if higher-resolution final artwork becomes available.
- Confirm the onsite signage script team is happy with the phrasing ahead of show open.
- Capture feedback from the booth on whether visitors understand the shortened explainer.
- Revisit the terms copy if legal requests additional language before launch.
