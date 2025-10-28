# Chatbot Widget Roadmap

## Vision

A floating chatbot widget that provides two key features:
1. **Feedback Collection** (Phase 1) - Users can submit feedback to help improve the app
2. **AI Assistant** (Phase 2) - Users can ask questions and get contextual help about the project

The widget is designed to be:
- **Non-intrusive**: Small floating button that doesn't block gameplay
- **Mobile-first**: Optimized for mobile devices (primary user platform)
- **Always available**: Accessible from any page in the application
- **Context-aware**: Knows which page the user is on for better feedback/assistance

---

## Phase 1: Feedback Widget ✅ COMPLETED

### Implementation Status
All Week 1 deliverables have been completed and are ready for testing.

### Features Implemented

#### Frontend Components
- **Floating Button** (`/client/src/components/ChatbotWidget/ChatbotWidget.tsx`)
  - Fixed position: bottom-right corner
  - Size: 56x56px (14 Tailwind units) - "smol" and mobile-friendly
  - Smooth animations (hover, scale, fade)
  - Cyan primary color matching app theme
  - Auto-hides when dialog is open

- **Feedback Form** (`/client/src/components/ChatbotWidget/FeedbackForm.tsx`)
  - 5-star rating system with hover effects
  - Category dropdown with 6 options:
    - UI/UX Design
    - Gameplay Experience
    - Trivia Content
    - Technical Issue
    - Feature Request
    - Other
  - Free-text message field (10-1000 characters)
  - Real-time validation using Zod
  - Auto-detects current page for context
  - Loading states and error handling
  - Success toast notifications

#### Backend Storage
- **Dual Storage System** (`/server/storage/feedback.ts`)
  - **Primary**: PostgreSQL via Drizzle ORM (when Neon DB available)
  - **Fallback**: JSON file storage (`/server/data/feedback.json`)
  - Automatic fallback if database unavailable
  - Same API interface for both storage methods

- **Database Schema** (`/shared/schema.ts`)
  - Table: `chatbot_feedback`
  - Columns:
    - `id` (UUID, primary key)
    - `email_hash` (optional, references users)
    - `session_token` (optional)
    - `category` (required)
    - `rating` (1-5, required)
    - `message` (required)
    - `page` (auto-detected route)
    - `status` (pending/reviewed/implemented)
    - `created_at` (timestamp)

#### API Endpoints
- **POST /api/feedback** - Submit new feedback (public)
- **GET /api/admin/feedback** - Get all feedback (admin only)
  - Optional query param: `?status=pending|reviewed|implemented`
- **PATCH /api/admin/feedback/:id/status** - Update feedback status (admin only)

#### Documentation
- **SQL Migration** (`/docs/chatbot-feedback-migration.sql`)
  - Ready to run on Neon database
  - Includes indexes for common queries
  - Table comments for documentation

### Testing the Widget

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Look for the widget**:
   - Blue circular button in bottom-right corner
   - Visible on all pages (Home, Play, Leaderboard, etc.)

3. **Submit test feedback**:
   - Click the floating button
   - Rate your experience (1-5 stars)
   - Select a category
   - Write a message (min 10 characters)
   - Click "Send Feedback"

4. **Verify storage**:
   - **With Neon DB**: Check the `chatbot_feedback` table
   - **Without DB**: Check `/server/data/feedback.json`

### Database Setup (Optional)

If you have a Neon database configured, run this SQL to create the feedback table:

```bash
# In Neon SQL Editor, run:
cat docs/chatbot-feedback-migration.sql
```

Or manually:
```sql
CREATE TABLE chatbot_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT REFERENCES users(email_hash),
  session_token TEXT,
  category TEXT NOT NULL,
  rating SMALLINT NOT NULL,
  message TEXT NOT NULL,
  page TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### JSON Fallback Structure

When database is unavailable, feedback is stored in `/server/data/feedback.json`:

```json
{
  "metadata": {
    "lastReviewedAt": "2025-10-28T12:00:00Z",
    "reviewedBy": "Admin Name",
    "reviewNotes": "Implemented 3 suggestions from this batch"
  },
  "feedback": [
    {
      "id": "abc123",
      "timestamp": "2025-10-28T11:30:00Z",
      "page": "/play",
      "rating": 4,
      "category": "ui-ux",
      "message": "The trivia timer is too fast on mobile",
      "emailHash": "def456",
      "sessionToken": "session-xyz",
      "status": "pending"
    }
  ]
}
```

### Admin Review Workflow (Future)

In Week 2, we'll add an admin interface to:
1. View all feedback submissions
2. Filter by status, rating, date, page
3. Mark feedback as reviewed/implemented
4. Add review notes and timestamps
5. Track which suggestions have been integrated

---

## Phase 2: AI Chat Integration (Future)

### Timeline: 3-6 months after Phase 1

### Planned Features

#### Month 1: AI Chat Foundation
- Dual-mode widget with tabs:
  - "Feedback" tab (existing)
  - "Ask AI" tab (new)
- Chat interface with message history
- Typing indicators
- Dedicated OpenAI endpoint (GPT-4o-mini for cost efficiency)
- Context-aware system prompts:
  - Current page
  - User session info
  - Recent game performance

#### Month 2: Advanced Features
- **RAG Integration**
  - Index documentation for AI reference
  - Vector embeddings of FAQ content
  - Semantic search for relevant context
- **Analytics Dashboard**
  - Track common questions
  - Sentiment analysis
  - Feature request clustering
- **Proactive Assistance**
  - Detect user struggles
  - Offer contextual tips
  - Onboarding tours

#### Month 3: Refinement & Scale
- Multi-language support
- Game state integration (query leaderboard, stats)
- Human escalation for complex issues
- Conversation history persistence

### Technical Decisions

#### Why JSON for Phase 1?
- **Simplicity**: No database migrations needed immediately
- **Portability**: Easy to inspect, backup, share
- **Git-trackable**: Review history visible in commits
- **Low overhead**: No DB queries for small datasets
- **Migration path**: Easy to move to PostgreSQL later

#### Why Separate Model for Chat?
- **Cost control**: GPT-4o-mini is 90% cheaper than GPT-4o
- **Speed**: Faster responses for simple queries
- **Rate limits**: Isolate chatbot from main game AI logic
- **Flexibility**: Can switch models without affecting game

#### Why Bottom-Right?
- Industry standard (Intercom, Zendesk, Crisp)
- Avoids collision with navigation
- Better for LTR languages (English)
- Right-aligned with call-to-action buttons

---

## Architecture

### Frontend Structure
```
client/src/
├── components/
│   └── ChatbotWidget/
│       ├── ChatbotWidget.tsx       # Main component with floating button
│       ├── FeedbackForm.tsx        # Feedback form UI
│       └── index.ts                # Exports
├── features/
│   └── chatbot/
│       ├── types.ts                # TypeScript types
│       └── validation.ts           # Zod schemas
└── App.tsx                         # Widget integrated globally
```

### Backend Structure
```
server/
├── storage/
│   └── feedback.ts                 # Storage abstraction (DB + JSON)
├── data/
│   └── feedback.json              # JSON fallback storage
└── routes.ts                      # API endpoints
```

### Database Schema
```
shared/
└── schema.ts                      # Drizzle ORM table definitions
```

---

## API Reference

### POST /api/feedback
Submit new feedback.

**Request Body:**
```json
{
  "category": "ui-ux",
  "rating": 4,
  "message": "The trivia timer is too fast on mobile",
  "page": "/play",
  "emailHash": "optional",
  "sessionToken": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "id": "feedback-id-123"
}
```

### GET /api/admin/feedback
Get all feedback (admin only).

**Headers:**
```
x-admin-key: your-admin-key
```

**Query Params:**
- `status` (optional): Filter by status (pending, reviewed, implemented)

**Response:**
```json
[
  {
    "id": "abc123",
    "category": "ui-ux",
    "rating": 4,
    "message": "...",
    "page": "/play",
    "status": "pending",
    "createdAt": "2025-10-28T11:30:00Z"
  }
]
```

### PATCH /api/admin/feedback/:id/status
Update feedback status (admin only).

**Headers:**
```
x-admin-key: your-admin-key
```

**Request Body:**
```json
{
  "status": "reviewed"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Deployment Checklist

### Before Deploying Phase 1

- [x] Widget UI implemented and tested
- [x] Backend endpoints created
- [x] Storage layer (DB + JSON) implemented
- [x] Form validation working
- [x] Build passes without errors
- [ ] Run SQL migration on Neon database (optional)
- [ ] Test widget on all pages
- [ ] Test on mobile devices
- [ ] Verify feedback submissions persist
- [ ] Test admin endpoints with admin key

### Environment Variables
No new environment variables required! The widget uses existing:
- `DATABASE_URL` (optional, for Neon)
- `ADMIN_KEY` (for admin endpoints)

---

## Maintenance

### Reviewing Feedback

1. **Access admin endpoint**:
   ```bash
   curl -H "x-admin-key: your-admin-key" \
     http://localhost:5000/api/admin/feedback
   ```

2. **Filter by status**:
   ```bash
   curl -H "x-admin-key: your-admin-key" \
     "http://localhost:5000/api/admin/feedback?status=pending"
   ```

3. **Update status**:
   ```bash
   curl -X PATCH \
     -H "x-admin-key: your-admin-key" \
     -H "Content-Type: application/json" \
     -d '{"status":"reviewed"}' \
     http://localhost:5000/api/admin/feedback/feedback-id-123
   ```

### Monitoring

Check server logs for feedback activity:
```
Using json storage for feedback
Feedback submitted: abc123 - Rating: 4/5
```

### Backup

If using JSON storage, commit `/server/data/feedback.json` regularly:
```bash
git add server/data/feedback.json
git commit -m "Update feedback data"
```

---

## Future Enhancements

### Phase 1.5 (Week 2)
- Admin dashboard UI (no CLI required)
- Feedback analytics (ratings over time, common categories)
- Email notifications for new feedback
- Feedback export (CSV, JSON)

### Phase 2 (Months 3-6)
- AI chat tab
- RAG with documentation
- Proactive assistance
- Multi-language support

### Phase 3 (Long-term)
- Voice input/output
- Screen recording for bug reports
- Integration with issue tracking (Jira, Linear)
- A/B testing for UI improvements

---

## Contributing

### Adding New Feedback Categories

1. Update validation schema (`/client/src/features/chatbot/validation.ts`):
   ```typescript
   category: z.enum([
     "ui-ux",
     "gameplay",
     "trivia",
     "technical",
     "feature-request",
     "other",
     "your-new-category", // Add here
   ]),
   ```

2. Add label (`/client/src/features/chatbot/validation.ts`):
   ```typescript
   export const categoryLabels = {
     // ...
     "your-new-category": "Your New Category Label",
   };
   ```

3. Update server schema (`/server/routes.ts`):
   ```typescript
   const submitFeedbackSchema = z.object({
     category: z.enum([
       "ui-ux",
       "gameplay",
       "trivia",
       "technical",
       "feature-request",
       "other",
       "your-new-category", // Add here
     ]),
     // ...
   });
   ```

### Customizing Widget Position

Edit `/client/src/components/ChatbotWidget/ChatbotWidget.tsx`:

```typescript
// Change from bottom-right to bottom-left:
className="fixed bottom-4 left-4 z-50"  // instead of right-4

// Change size:
className="h-20 w-20 rounded-full"      // instead of h-14 w-14
```

---

## Support

For questions or issues with the chatbot widget:
1. Check this roadmap document
2. Review the inline code comments
3. Test with the JSON fallback storage first
4. Verify admin key is set correctly
5. Check browser console for errors

---

**Last Updated**: 2025-10-28
**Phase**: 1 (Feedback Widget)
**Status**: Ready for Testing
**Next Milestone**: Week 2 - Admin Dashboard UI
