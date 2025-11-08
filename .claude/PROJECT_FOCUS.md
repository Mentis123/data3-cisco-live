# Project Focus & Priority

## Current Priority: /beta Directory
**Status**: Primary focus - Work in Progress
**Owner**: Claude (transitioned from OpenAI Codex)
**Mission**: Complete, refine, and perfect the beta experience

### Key Objectives
1. **Trivia System**: Ensure .json fallback with trivia questions per category all working correctly
2. **Dojo Logic**: Complete training functionality for all five categories online
3. **Component Completion**: Review and complete all incomplete components
4. **Refactoring**: Improve code quality, performance, and maintainability
5. **Testing**: Verify all functionality works as expected

### Future Plans
- Eventually port /beta to main site
- Currently in WIP (Work in Progress) state

### Categories (4 total)
1. **NETWORKING** - Networking (25 questions)
2. **SECURITY** - Security (18 questions)
3. **COLLABORATION** - Collaboration (18 questions)
4. **DATA_CENTER** - Cloud & AI (20 questions)

**Total Questions**: 81 trivia questions
**Deck Size**: 5 questions per round (1 easy, 3 medium, 1 hard)

### Architecture Overview
- **Client Components**: `/client/src/components/trivia/`, `/client/src/pages/Beta*.tsx`
- **Server Storage**: `/server/storage/` (database.ts + memory.ts fallback)
- **Data Fallback**: `/docs/trivia-items-starter.json` (loads automatically if DB unavailable)
- **Scoring**: Trivia (0-30 max) + Case Card (0-20 max) = Total (0-50)

### Current Status (Post-Review)
- All 4 trivia categories fully functional with JSON fallback
- Dojo training mode: LIVE
- Ring mode with trivia warmup: LIVE
- Case builder: IN DEVELOPMENT (showing placeholder)

---
**Last Updated**: 2025-10-26
**Reviewed By**: Claude
**Notes**: This is the top priority for the project. Always check this file first.
