# Overview

This full-stack web application is designed for Data#3's "Cisco Solution Sprint" activation at Cisco Live Melbourne. Its primary purpose is to provide an interactive booth experience where attendees develop and propose business solutions using Cisco technologies. The application features an AI-powered chat assistant for solution crafting, an automated scoring system, and a live, animated leaderboard. The goal is to offer a dynamic and engaging experience that guides participants from problem identification to solution submission and ranking.

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
The application implements a "Three-Reply Sprint" methodology through a mobile-first, 4-step process: "Name the Problem," "Quantify the Impact," "Explore Technologies," and "Compete & Win." It targets three user replies with a hard cap of six inputs, allowing submissions at any point with the system inferring missing information.

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
  - Problem Definition & KPIs (0-10 points)
  - Cisco Architecture Fit (0-10 points)
  - Feasibility & Security (0-10 points)
  - Business Impact at Scale (0-10 points)
  - Observability & Automation (0-10 points)
- **Structured Output**: AI formats solutions into a standardized JSON schema.
- **Prompts**: Step-specific guidance and targeted technology recommendations.
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
- Protected system categories (GENERAL, SCALE, EXPERTISE, and 5 solution types) cannot be edited or deleted.
- Custom categories (INFRASTRUCTURE, SECURITY, CLOUD, NETWORKING) can be fully managed with CRUD operations.
- Post-submission UI displays category-specific stats with color-coded headers for 5 minutes, then reverts to general stats.
- Word cloud consolidates case variations of technology terms (e.g., "appdynamics" and "AppDynamics") using proper product casing.

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