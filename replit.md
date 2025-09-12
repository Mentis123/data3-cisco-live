# Overview

This is a full-stack web application for Data#3's "Cisco Solution Sprint" activation at Cisco Live Melbourne. The application offers an interactive booth experience where attendees propose business solutions using Cisco technologies. It features a live leaderboard, an AI-powered chat assistant for solution crafting, and an automated scoring system.

The application guides participants through accepting terms, interacting with an AI coach to develop proposals, submitting them for scoring, and viewing their results on a live, animated leaderboard display. The system is designed to provide a dynamic and engaging experience for attendees.

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
The application facilitates a user journey from landing page (terms acceptance, challenge overview) to solution crafting with AI assistance, structured submission, and live leaderboard display.

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS with custom CSS variables for a consistent dark theme.
- **UI Components**: Radix UI and shadcn/ui for accessible and customizable components.
- **State Management**: TanStack Query for server state management and caching.
- **Routing**: Wouter for lightweight client-side routing.
- **Real-time Updates**: Custom WebSocket hook for live leaderboard.

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API.
- **Database**: SQLite with Drizzle ORM for type-safe operations.
- **Real-time Communication**: WebSocket server for broadcasting live score updates.
- **AI Integration**: OpenAI API for chat and evaluation.
- **Session Management**: In-memory session storage with rate limiting.

## Database Design
- **Participants Table**: Stores user information (first name, last name, timestamp).
- **Submissions Table**: Stores solution details, structured JSON, scoring, and category.
- **Schema Validation**: Zod for runtime type checking.

## API Structure
- **Public Routes**: Home, portrait-oriented leaderboard, solution crafting, "How to Play" board.
- **API Endpoints**: Session management, category listing, AI chat assistance, solution submission, leaderboard data retrieval, health checks, and admin functions.

## Real-time Features
- Live leaderboard updates via WebSocket connection.
- Animated score insertion, flash effects, confetti.
- Smooth ranking transitions with easing animations.
- Real-time participant count and scoring updates.

## AI Integration
- **Chat Assistant**: GPT-4o-mini coaches users to develop solutions.
- **Solution Evaluation**: O3 model evaluates submissions against a 5-criteria rubric (0-50 points).
- **Structured Output**: AI formats solutions into a standardized JSON schema.

## Security & Performance
- Rate limiting on submissions (60-second cooldown per IP).
- Input validation and sanitization.
- Configurable environment variables for API keys.
- Efficient caching with React Query.
- Optimistic UI updates.

# External Dependencies

## Third-Party Services
- **OpenAI API**: Used for chat assistance (gpt-4o-mini) and solution evaluation (o3).
- **Neon Database**: PostgreSQL database service for production deployment.

## Development & Deployment
- **Replit Platform**: Hosting environment with integrated development tools.
- **Vite Development Server**: For hot module replacement and optimized development.

## UI Component Libraries
- **Radix UI**: Provides accessible, unstyled UI primitives.
- **shadcn/ui**: Pre-styled component collection built on Radix UI.
- **Lucide Icons**: Modern icon library.
- **Font Awesome**: Specialized icon set.

## Monitoring & Performance
- **TanStack Query**: Handles caching, background updates, and error handling.

### Validation Tracking
**Pending Validation:**
- [2025-01-28 16:08] Button state sync after auto-revert + Data#3 superscript branding
  - **Test**: Verify button states update correctly when auto-reverting from any view to stats
  - **Test**: Confirm all Data#3 text shows superscript hashtag (Home, Play, Leaderboard pages)

### Current User Flow Analysis
**Question: Category Selection Process**
- [2025-01-28 16:47] User asks about when category selection happens in the flow
- **Current Process**: 
  1. User enters problem + impact in chat with AI coach
  2. AI helps refine and structure the solution through conversation
  3. When final JSON solution is generated, server auto-categorizes using `categorizeProposal()` function
  4. Category is assigned automatically based on problem/solution content, not user selection
- **Key Finding**: Category is NOT manually selected by user - it's AI-determined during submission