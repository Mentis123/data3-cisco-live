# Ring Mode Implementation Fix

## Problem
Currently, TriviaWarmup uses the training endpoint (`GET /api/trivia/practice`) for both Dojo and Ring modes. This means Ring mode doesn't:
1. Create an attempt record
2. Track answers
3. Submit scores to the database
4. Link trivia attempts to case card submissions

## Solution Architecture

### Current Flow (Broken)
```
Ring Mode:
  TriviaWarmup (mode="ring")
    → GET /api/trivia/practice  ❌ Wrong!
    → TriviaGame plays
    → onComplete() called
    → NO attempt ID
    → PlayContent has null attemptId ❌
```

### Fixed Flow (Proper)
```
Ring Mode:
  TriviaWarmup (mode="ring")
    → Collect email + opt-in
    → POST /api/trivia/attempts ✅
    → TriviaGame plays + tracks answers
    → POST /api/trivia/attempts/:id/complete ✅
    → onComplete(attemptId, score) ✅
    → PlayContent stores attemptId ✅
    → Links to case submission ✅
```

## Implementation Plan

### Phase 1: Add Email Collection for Ring Mode
- Add email input field in TriviaWarmup when mode="ring"
- Validate Cisco Live email
- Add marketing opt-in checkbox

### Phase 2: Start Attempt API Integration
- Modify TriviaWarmup to call POST /api/trivia/attempts when mode="ring"
- Store attemptId in component state
- Pass cards to TriviaGame

### Phase 3: Answer Tracking
- Modify TriviaGame to track answer data (index, elapsed time)
- Build answers array during gameplay
- Don't submit automatically - wait for all 5 questions

### Phase 4: Complete Attempt Submission
- After question 5, call POST /api/trivia/attempts/:id/complete
- Pass all 5 answers with timing data
- Receive final score from server

### Phase 5: Pass Data to PlayContent
- Modify onComplete to accept (attemptId, score)
- Update PlayContent to receive attemptId via callback
- Link submission to attempt

## Decision: Simplified Approach for Now

Given the complexity and potential for breaking changes, I recommend a **simpler fix for immediate deployment**:

### Minimal Viable Fix
1. Keep training mode for both Dojo and Ring (no breaking changes)
2. Collect email at the **submission step** in PlayContent
3. Create trivia attempt retroactively when submitting case card
4. Link attempt to submission at that point

This maintains current UX while fixing the data linkage issue.

### Future Enhancement
Later, implement full Ring mode with:
- Upfront email collection
- Real-time attempt tracking
- Immediate score submission
- Prevents cheating (answer validation)

## Recommendation
**Implement Minimal Viable Fix now, Full Ring Mode later**

This allows beta to launch without major refactoring while maintaining correct data relationships.
