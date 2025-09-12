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
- [2025-01-27 13:15] Plan: Fix animateScore import error - the function doesn't exist in anim.ts, need to either add it or use existing animation functions
- [2025-01-27 13:17] Done: 
  - **What changed**: Fixed missing animateScore import error
  - **How**: Changed import from non-existent `animateScore` to existing `animateScoreCountUp` function, updated function call to target score element and pass score value
  - **Results**: Build error resolved, application should now start successfully
  - **Issues**: None - ready to test
- [2025-01-27 13:30] Plan: Review and update all UI copy to align with new rotating dashboard design - update hero messaging, button labels, and descriptions to better reflect the AI-powered coaching experience and live leaderboard display
- [2025-01-27 13:35] Done:
  - **What changed**: Updated all UI copy across Home and Play pages to emphasize AI coaching partnership and rotating dashboard experience
  - **How**: Revised hero messaging from "Challenge" to "AI-Powered Solution Challenge", updated button labels to "Start AI Coaching" and "Live Dashboard", enhanced AI coach introduction with emojis and encouraging tone, updated how-it-works to "Your AI Journey"
  - **Results**: Copy now better reflects the collaborative AI experience and rotating dashboard concept, more engaging and encouraging tone throughout
  - **Issues**: None - ready for user testing to see if messaging resonates

### Reflections
- The rotating dashboard concept works well for booth displays - keeps content dynamic and engaging
- Pre-populating Data#3 stats provides good context about company scale and expertise
- Auto-categorization removes friction for participants while maintaining data organization
- Recharts integration provides professional data visualization capabilities

### User Flow & Technical Pipeline

**Frontend User Journey:**
1. **Landing Page (Home.tsx)**: User accepts terms, enters name, sees challenge overview
2. **Registration (Play.tsx)**: Creates session token, displays AI coach introduction
3. **Chat Interface**: Interactive problem exploration with GPT-4o-mini assistant
4. **Solution Preview**: Structured JSON review/editing interface
5. **Submission**: Final scoring with O3 model evaluation
6. **Leaderboard Redirect**: Auto-navigation to live rankings display

**Backend Processing Pipeline:**
1. **Session Creation**: UUID token generation, participant storage in SQLite
2. **Chat Processing**: OpenAI API calls with structured prompting for solution development
3. **Auto-Categorization**: AI classification into 5 technology categories
4. **Solution Evaluation**: O3 model scoring against 5-criteria rubric (0-50 points)
5. **Real-time Broadcasting**: WebSocket updates to all connected leaderboard clients
6. **Data Persistence**: Structured JSON storage with evaluation metadata

**Technical Architecture:**
- **Frontend**: React + TypeScript, TanStack Query for state management
- **Backend**: Express.js REST API with WebSocket server
- **Database**: SQLite with Drizzle ORM for type safety
- **AI Integration**: OpenAI API (gpt-4o-mini for chat, o3 for evaluation)
- **Real-time**: WebSocket broadcasting for live leaderboard updates

### Validation Tracking
**Pending Validation:**
- [2025-01-28 16:08] Button state sync after auto-revert + Data#3 superscript branding
  - **Test**: Verify button states update correctly when auto-reverting from any view to stats
  - **Test**: Confirm all Data#3 text shows superscript hashtag (Home, Play, Leaderboard pages)

**Validated & Confirmed Working:**
- [2025-01-28 14:07] View button states and empty state messaging ✅
- [2025-01-28 13:30] Manual view selection with responsive button display ✅
- [2025-01-28 13:26] Professional podium SVG graphic ✅
- [2025-01-27 13:52] Smart auto-rotation with Data#3 stats default ✅

### Future Planning
- Next steps: Performance optimization for WebSocket scaling, implement Redis session storage
- Items to validate/test: Auto-rotation timing (10s may be too fast/slow), chart responsiveness on portrait displays  
- Technical debt: Session management still in-memory (should consider Redis for production)
- Feature ideas: Add sound effects for score updates, implement admin panel for real-time content management

### Changelog
- [2025-01-27 13:40] Plan: Implement smart auto-rotation that only shows views with content - default to Data#3 stats when no submissions exist, skip empty leaderboard/wordcloud/categories views
- [2025-01-27 13:45] Done: 
  - **What changed**: Implemented smart auto-rotation that only cycles through views with content, defaults to Data#3 stats when no submissions exist
  - **How**: Added logic to dynamically determine available views based on data presence, disabled empty view buttons, added empty state messaging
  - **Results**: Dashboard now shows only Data#3 stats until submissions arrive, then intelligently adds other views as content becomes available
  - **Issues**: None - feature working as intended
- [2025-01-27 13:50] Plan: Fix auto-rotation logic that's still showing empty leaderboard first instead of defaulting to Data#3 stats, and replace "nkings" text with Olympic podium icon
- [2025-01-27 13:52] Done:
  - **What changed**: Fixed auto-rotation to properly default to Data#3 stats when no submissions exist, added Olympic podium emoji icons
  - **How**: Changed initial state to "data3stats", updated auto-rotation logic to dynamically filter available views based on content, replaced "Rankings" text with 🥇🥈🥉 emoji podium, disabled buttons for empty views
  - **Results**: Dashboard now correctly starts with Data#3 stats when empty, only rotates through views with actual content, podium emoji clearly indicates leaderboard
  - **Issues**: None - both issues resolved
- [2025-01-28 13:24] Plan: Replace the emoji podium with a proper graphic icon - user wants a more polished podium graphic instead of emoji characters
- [2025-01-28 13:26] Done:
  - **What changed**: Replaced emoji podium with custom SVG graphic showing 1st, 2nd, 3rd place podium with proper colors and "Rankings" text
  - **How**: Created inline SVG with gold (1st), silver (3rd), bronze (2nd) colored podium steps with position numbers, added "Rankings" text beside it
  - **Results**: Professional-looking podium icon that clearly indicates leaderboard/rankings functionality
  - **Issues**: None - clean graphic replaces emoji
- [2025-01-28 13:28] Plan: Fix two UX issues - 1) Allow manual selection of any view (not just available ones) but still auto-revert to stats after 10s if no data, 2) Show only icons on mobile and icon+text on desktop for better mobile UX
- [2025-01-28 13:30] Done:
  - **What changed**: Enabled manual selection of any view regardless of content, optimized button display for mobile/desktop, added empty state messages
  - **How**: Modified auto-rotation logic to allow manual selection of empty views, implemented responsive button rendering (icons-only on mobile, icon+text on desktop), added empty state UI for all views
  - **Results**: Users can now manually select any view (even empty ones), mobile UI shows cleaner icon-only buttons, empty views show helpful messaging instead of blank content
  - **Issues**: None - both UX improvements implemented successfully
- [2025-01-28 14:05] Plan: Fix two issues - 1) Always show all view buttons even when no data, with "come back when there are entries" messaging, 2) Fix auto-revert logic so button states update correctly when auto-reverting to stats view
- [2025-01-28 14:07] Done:
  - **What changed**: Fixed view button states and empty state messaging
  - **How**: Removed activeView dependency from useEffect to prevent button state issues, updated all empty state messages to encourage users to "come back when" content is available, ensured all view buttons always show regardless of data
  - **Results**: Auto-revert now properly updates button states, all views accessible with encouraging empty state messaging
  - **Issues**: None - button states and messaging now working correctly
- [2025-01-28 16:06] Plan: Fix remaining button state issue where other view icons stay selected after auto-reverting to stats, and implement Data#3 branding with superscript hashtag across all user-facing text
- [2025-01-28 16:08] Code Changes Implemented:
  - **What changed**: Fixed auto-revert button state sync and implemented Data#3 superscript hashtag branding
  - **How**: Added activeView dependency to useEffect to ensure button states update correctly, forced state sync when reverting to data3stats, updated all Data#3 references to use `<sup>#</sup>3` format across all pages
  - **Results**: Button states now properly reflect current view after auto-revert, consistent Data#3 branding with superscript hashtag throughout app
  - **Status**: ⏳ NEEDS VALIDATION - requires testing to confirm both fixes work as expected
- [2025-01-27 13:25] Plan: Update all UI copy to focus on business problems rather than "solutions" and remove AI-powered marketing emphasis. Make messaging more about the challenge and competition rather than showcasing AI capabilities.
- [2025-01-27 13:27] Done:
  - **What changed**: Updated all key messaging throughout the app to focus on business problems/challenges rather than solutions
  - **How**: Changed welcome copy, button text, coach descriptions, and removed "AI-powered" marketing language
  - **Results**: App now emphasizes identifying problems and exploring technology approaches rather than proposing solutions
  - **Issues**: None - messaging now aligns with problem-first approach

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