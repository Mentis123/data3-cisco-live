# Overview

This is a full-stack web application for Data#3's "Cisco Solution Sprint" activation at Cisco Live Melbourne. The application provides an interactive booth experience where attendees can participate in a solution challenge by proposing business solutions that use Cisco technologies. The system features a live leaderboard display, an AI-powered chat assistant to help craft solutions, and an automated scoring system.

The application consists of a real-time leaderboard for public display, a solution crafting interface with AI assistance, and comprehensive scoring and ranking functionality. Participants accept terms and conditions, interact with an AI coach to develop their solutions, submit their proposals, and see their scores reflected on a live leaderboard with animated updates.

# User Preferences

Preferred communication style: Simple, everyday language.

## Agent Instructions (read-first)
- Always read this file before starting any work.
- Before making changes, append a **Plan** entry in "Changelog" describing intended edits.
- After making changes, append **What changed / How / Results / Issues** and update "Future Planning" with next steps, items to validate, technical debt, and feature requests.
- Never overwrite past entries; always append and date-stamp.
- Safety: work on a branch, run tests, take a backup or snapshot before risky steps, and ask for confirmation before destructive operations.

### Changelog
- [2025-01-27 12:40] Plan: Major rework to implement rotating dashboard display system with Data#3 stats integration, automatic categorization, and enhanced leaderboard functionality based on user feedback
- [2025-01-27 12:45] Done: 
  - **What changed**: Implemented comprehensive dashboard system with 4 rotating views (leaderboard, word cloud, category stats, Data#3 stats)
  - **How**: Updated Leaderboard.tsx with auto-rotating views every 10 seconds, added Recharts for data visualization, integrated Data#3 pre-populated stats in storage.ts
  - **Results**: Dashboard now shows live leaderboard, technology word clouds, category distribution charts, and contextual Data#3 company stats
  - **Issues**: Build error with missing animateScore import needs to be resolved

### Reflections
- The rotating dashboard concept works well for booth displays - keeps content dynamic and engaging
- Pre-populating Data#3 stats provides good context about company scale and expertise
- Auto-categorization removes friction for participants while maintaining data organization
- Recharts integration provides professional data visualization capabilities

### Future Planning
- Next steps: Fix the animateScore import error to get application running
- Items to validate/test: Auto-rotation timing (10s may be too fast/slow), chart responsiveness on portrait displays
- Technical debt: Session management still in-memory (should consider Redis for production)
- Feature ideas: Add sound effects for score updates, implement admin panel for real-time content management

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **Styling**: Tailwind CSS with a dark theme and custom CSS variables for consistent design
- **UI Components**: Radix UI component library with shadcn/ui for accessible, customizable components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: Custom WebSocket hook for live leaderboard updates

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Database**: SQLite with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server for broadcasting live score updates to leaderboard
- **AI Integration**: OpenAI API integration with configurable models (gpt-4o-mini for chat, o3 for evaluation)
- **Session Management**: In-memory session storage with rate limiting for submissions

## Database Design
- **Participants Table**: Stores user information (first name, last name, creation timestamp)
- **Submissions Table**: Contains solution details, structured JSON data, scoring information, and category classification
- **Schema Validation**: Zod schemas for runtime type checking and validation

## API Structure
### Public Routes
- Home page with terms acceptance and navigation
- Portrait-oriented leaderboard for TV display (1080x1920 CSS)
- Solution crafting interface with category selection
- Static "How to Play" reference board

### API Endpoints
- Session management (accept T&C, start session)
- Category listing and selection
- AI chat assistance for solution development
- Solution submission with automated scoring
- Leaderboard data retrieval
- Health check and admin functions

## Real-time Features
- WebSocket connection for live leaderboard updates
- Animated score insertion with flash effects and confetti
- Smooth ranking transitions with easing animations
- Real-time participant count and scoring updates

## AI Integration
- **Chat Assistant**: GPT-4o-mini powered coach helps users develop solutions through targeted questions
- **Solution Evaluation**: O3 model evaluates submissions against a strict 5-criteria rubric (0-50 point scale)
- **Structured Output**: AI formats solutions into standardized JSON schema for consistent evaluation

## Security & Performance
- Rate limiting on submissions (60-second cooldown per IP)
- Input validation and sanitization
- Configurable environment variables for API keys and model selection
- Efficient caching strategies with React Query
- Optimistic UI updates for better user experience

# External Dependencies

## Third-Party Services
- **OpenAI API**: Provides both chat assistance (gpt-4o-mini) and solution evaluation (o3) capabilities
- **Neon Database**: PostgreSQL database service for production deployment (configured via DATABASE_URL)

## Development & Deployment
- **Replit Platform**: Hosting environment with integrated development tools
- **WebSocket Support**: Native WebSocket implementation for real-time features
- **Vite Development Server**: Hot module replacement and optimized development experience

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-styled component collection built on Radix UI
- **Lucide Icons**: Modern icon library for consistent iconography
- **Font Awesome**: Classic icon set for specialized use cases

## Monitoring & Performance
- **TanStack Query**: Intelligent caching, background updates, and error handling
- **Custom Logging**: Request/response logging with performance metrics
- **Error Boundaries**: Graceful error handling and user feedback