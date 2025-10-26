# Project Focus & Priority

## Current Priority: /beta Directory
**Status**: Primary focus - Work in Progress
**Owner**: Claude (transitioned from OpenAI Codex)
**Mission**: Complete, refine, and perfect the beta experience

### Key Objectives
1. **Trivia System**: Ensure .json fallback with trivia questions per category all working correctly
2. **Dojo Logic**: Complete practice functionality for all five categories online
3. **Component Completion**: Review and complete all incomplete components
4. **Refactoring**: Improve code quality, performance, and maintainability
5. **Testing**: Verify all functionality works as expected

### Future Plans
- Eventually port /beta to main site
- Currently in WIP (Work in Progress) state

### Categories (5 total)
1. **SECURE_CONNECTIVITY** - Zero Trust & Secure Connectivity (25 questions)
2. **HYBRID_DC** - Hybrid Cloud Infrastructure (25 questions)
3. **COLLAB_CX** - Collaboration & Customer Experience (25 questions)
4. **OBSERVABILITY** - Observability & Automation (25 questions)
5. **EDGE_IOT** - Edge & IoT Automation (25 questions)

**Total Questions**: 125 trivia questions (25 per category)
**Deck Size**: 5 questions per round (1 easy, 3 medium, 1 hard)

### Architecture Overview
- **Client Components**: `/client/src/components/trivia/`, `/client/src/pages/Beta*.tsx`
- **Server Storage**: `/server/storage/` (database.ts + memory.ts fallback)
- **Data Fallback**: `/docs/trivia-items-starter.json` (loads automatically if DB unavailable)
- **Scoring**: Trivia (0-30 max) + Case Card (0-20 max) = Total (0-50)

### Current Status (Post-Review)
- All 5 trivia categories fully functional with JSON fallback
- Dojo practice mode: LIVE
- Ring mode with trivia warmup: LIVE
- Case builder: IN DEVELOPMENT (showing placeholder)

---
**Last Updated**: 2025-10-26
**Reviewed By**: Claude
**Notes**: This is the top priority for the project. Always check this file first.
