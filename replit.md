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
- **Category Assignment**: O3-mini automatically categorizes solutions into one of 5 categories.
- **Solution Evaluation**: O3-mini evaluates submissions against a 5-criteria rubric (0-50 points).
- **Structured Output**: AI formats solutions into a standardized JSON schema.
- **Total AI Calls**: Exactly 3 inference calls per submission (chat, categorization, scoring).

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
**Completed Validations:**
- [2025-01-28 18:00] AI Models configured correctly:
  - Chat assistant: GPT-4o-mini
  - Category assignment: O3-mini
  - Solution evaluation: O3-mini
  - Total inference calls: Exactly 3 per submission
- [2025-01-28 18:00] Word cloud spacing improved:
  - Smaller words reduced in size (12-14px for outer ring)
  - Increased radial spacing for better visual hierarchy
- [2025-01-28 18:00] Stats display logic:
  - Shows category-specific stats for 5 minutes after submission
  - Reverts to general Data#3 stats after 5-minute window

### Current User Flow Analysis
**Category Selection Process**
- [2025-01-28 16:47] Confirmed category assignment flow:
  1. User enters problem + impact in chat with AI coach (GPT-4o-mini)
  2. AI helps refine and structure the solution through conversation
  3. When final JSON solution is generated, server auto-categorizes using `categorizeProposal()` function (O3-mini)
  4. Solution is then evaluated for scoring using `evaluateSolution()` function (O3-mini)
  5. Category is assigned automatically based on problem/solution content, not user selection
- **Key Finding**: Category is NOT manually selected by user - it's AI-determined during submission

### Recent Updates
**[2025-01-28 18:00] Improvements:**
- Fixed Data#3 title to display with superscript hashtag (Data<sup>#</sup>3)
- Enhanced word cloud with better spacing - smaller words now smaller (12-14px) with increased radial distances
- Updated category assignment to use O3-mini instead of GPT-4o-mini
- Implemented 5-minute window for category-specific stats display
- Admin dashboard now includes tabbed interface with stats management section

**[2025-01-28 18:15] Critical Fixes:**
- Fixed admin authentication: Now properly stores 'cisco-live-melbourne-2025' in localStorage on successful login
- Reduced pie chart label sizes for optimal readability (24px labels, 28px percentages)
- Improved word cloud centering with adjusted positioning calculation
- Added 6 Data#3 company stats to database under 'GENERAL' category:
  - 2x Revenue Growth in 18 Months
  - 700% Cloud Services Revenue Increase
  - 1000+ Experts Across ANZ
  - 50+ Certified Vendor Technologies
  - 2,500+ Customers Trust Data#3
  - 24/7 Support Coverage

**[2025-01-28 19:00] Color Consistency & Category Stats:**
- Unified color scheme across all components (pie chart, submission labels, admin dashboard):
  - Zero Trust & Secure Connectivity: #00BCF2 (Cyan)
  - Data Centre & Hybrid Cloud: #6CC04A (Green)
  - Collaboration & Contact Centre: #FF6B35 (Orange)
  - Observability & Performance: #9B59B6 (Purple)
  - Edge & IoT Solutions: #F39C12 (Yellow)
- Added 15 category-specific stats to database (3 per solution category)
- Stats now properly filter by category to show relevant data during 5-minute window after submission

**[2025-01-28 19:30] User Experience Enhancement:**
- Added Exit/Home button to chat interface with confirmation dialog
- Prevents accidental loss of work during solution development
- Confirmation dialog warns users about losing unsaved progress
- Two clear options: "Continue Working" to stay or "Exit & Lose Progress" to leave

**[2025-01-28 20:00] Leaderboard Display Fixes:**
- Reduced pie chart font sizes: labels from 24px to 20px, percentages/counts from 28px to 22px for better readability
- Fixed category-specific stats alignment: Stats now correctly match the recent submission's category instead of the overall top category
- Backend now uses `recentSubmission.category` for stats filtering during the 5-minute window
- Ensures proper category correlation between submission badges and displayed statistics

**[2025-01-28 20:30] Navigation Improvements:**
- Added "Back to Home" button on Play registration page for easy exit
- Added exit buttons with confirmation dialogs on preview and edit pages to prevent accidental data loss
- Added "Back to Chat" and "Back to Preview" navigation between solution development steps
- Moved exit confirmation dialog to component level so it works across all Play page sections
- Leaderboard and Admin pages already have proper home navigation buttons
- All pages now have clear escape routes back to the home page

**[2025-01-28 21:00] Header Image Update:**
- Added custom Melbourne tech skyline header image to Home page hero section
- Integrated same header image into Play registration card with overlay gradient
- Enhanced visual consistency across main entry points with branded imagery
- Applied appropriate opacity and gradient overlays for text readability