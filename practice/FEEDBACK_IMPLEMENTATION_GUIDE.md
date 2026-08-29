# Feedback System Implementation Guide for Azure + Neon

**To: Claude (or other AI assistant working on the Azure repo)**
**From: Claude (working on the Cisco Live Melbourne app)**
**Re: Porting the feedback system with improvements**

---

## Overview

You're being asked to implement a feedback collection system for an Azure-hosted application using Neon (serverless Postgres). This document describes the architecture from a working implementation, but you have **full latitude to improve upon it** for the Azure environment. The user wants you to **consult with them on specifics** as you build.

---

## Core Architecture (Reference Implementation)

### 1. Database Schema (Neon/PostgreSQL)

```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT,                    -- SHA-256 hashed, never store raw email
  session_token TEXT,                 -- Optional session tracking
  category TEXT NOT NULL,             -- Categorization (customizable)
  rating SMALLINT NOT NULL,           -- 1-5 star rating
  message TEXT NOT NULL,              -- User's feedback text
  page TEXT NOT NULL,                 -- CRITICAL: Where feedback was submitted from
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/reviewed/resolved/dismissed
  created_at TIMESTAMPTZ DEFAULT now(),

  -- NEW: Enhanced context fields (see Section 4)
  highlighted_text TEXT,              -- Text user highlighted when submitting
  element_selector TEXT,              -- CSS selector of related element
  viewport_context JSONB,             -- Screen size, scroll position, etc.
  user_agent TEXT                     -- Browser/device info
);

-- Performance indexes
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_page ON feedback(page);
```

### 2. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/feedback` | Submit new feedback |
| GET | `/api/admin/feedback` | Retrieve feedback (admin) |
| PATCH | `/api/admin/feedback/:id/status` | Update status (admin) |

**Key validation rules:**
- Message: 10-1000 characters
- Rating: 1-5 integer
- Email: Optional, hashed with SHA-256 before storage
- Page: Required, auto-captured from current URL

### 3. Frontend Components

**A. Floating Feedback Button**
- Fixed position (bottom-right corner)
- Non-intrusive but discoverable
- Opens modal dialog on click

**B. Feedback Form Modal**
- Star rating widget (interactive, hover preview)
- Category dropdown
- Message textarea
- Optional email field
- Auto-captures current page URL

**C. Admin Dashboard**
- Password/auth protected
- Filter by status
- Expandable row details
- CSV export capability

---

## CRITICAL REQUIREMENT: Page Awareness

The user specifically wants **page-aware feedback**. Every feedback submission must capture rich context about where the user was when they submitted:

```typescript
interface FeedbackContext {
  // Basic location
  page: string;           // Current URL path
  fullUrl: string;        // Complete URL with query params

  // Enhanced context
  pageTitle: string;      // Document title
  referrer: string;       // How they got there
  timestamp: string;      // ISO timestamp

  // Visual context (optional but valuable)
  scrollPosition: number; // How far down the page
  viewportSize: {
    width: number;
    height: number;
  };
}
```

**Capture this automatically** when the feedback form opens or when text is highlighted.

---

## NEW FEATURE: Highlight-to-Feedback

**This is a new feature the user wants implemented.** When a user highlights text anywhere on the page, a feedback popup should appear near the selection.

### Implementation Approach

```typescript
// 1. Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('touchend', handleTextSelection);

function handleTextSelection(e: MouseEvent | TouchEvent) {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();

  if (selectedText && selectedText.length > 0) {
    // Get selection position for popup placement
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    // Show feedback popup near the selection
    showHighlightFeedbackPopup({
      text: selectedText,
      position: rect,
      context: capturePageContext()
    });
  }
}

// 2. Popup component (appears above/below selection)
interface HighlightFeedbackPopup {
  highlightedText: string;
  position: DOMRect;
  onSubmit: (message: string) => void;
  onDismiss: () => void;
}
```

### UX Considerations for Highlight Feedback

1. **Popup Positioning**: Appear near but not covering the highlighted text
2. **Quick Submit**: Minimal friction - maybe just a text input and submit button
3. **Dismissal**: Click away, Escape key, or explicit close button
4. **Don't Block Reading**: Small, unobtrusive design
5. **Optional Rating**: Consider making rating optional for quick notes
6. **Auto-include Context**: The highlighted text, page URL, and surrounding context

### Suggested UI Flow

```
User highlights text → Small popup appears above selection
                      ┌──────────────────────────────┐
                      │ 💬 Quick note about this?    │
                      │ ┌────────────────────────┐   │
                      │ │ [Your feedback here]   │   │
                      │ └────────────────────────┘   │
                      │        [Cancel] [Submit]     │
                      └──────────────────────────────┘
```

### Data to Capture with Highlight Feedback

```typescript
interface HighlightFeedback {
  highlightedText: string;      // The selected text
  surroundingContext?: string;  // Text before/after (for context)
  elementPath?: string;         // DOM path to the element
  page: string;                 // Current page URL
  message: string;              // User's note about the highlight
  category?: string;            // Optional quick category
  rating?: number;              // Optional rating (1-5)
}
```

---

## Categories (Customize for Your App)

The reference implementation uses these, but **adapt to your domain**:

```typescript
const categories = {
  "ui-ux": "UI/UX Design",
  "gameplay": "Gameplay Experience",
  "trivia": "Trivia Content",
  "technical": "Technical Issue",
  "feature-request": "Feature Request",
  "other": "Other"
};
```

**Consult with the user** about what categories make sense for their Azure app.

---

## Privacy Best Practices

1. **Never store raw emails** - Hash with SHA-256
2. **Session tokens optional** - Don't require identification
3. **Minimal data collection** - Only what's needed
4. **Clear purpose** - Tell users how feedback is used

```typescript
function hashEmail(email: string): string {
  // Node.js
  return crypto.createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');

  // Browser (Web Crypto API)
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

---

## Azure + Neon Specific Considerations

### Neon Connection

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Serverless-friendly: connection pooling built-in
async function submitFeedback(data: FeedbackInput) {
  const result = await sql`
    INSERT INTO feedback (category, rating, message, page, highlighted_text, status)
    VALUES (${data.category}, ${data.rating}, ${data.message}, ${data.page}, ${data.highlightedText}, 'pending')
    RETURNING id
  `;
  return result[0].id;
}
```

### Azure Functions / API Routes

If using Azure Functions or Next.js API routes on Azure, ensure:
- Environment variables for `DATABASE_URL`
- Proper CORS configuration for frontend calls
- Rate limiting to prevent abuse

---

## Improvements to Consider

You have **latitude to improve** upon this reference. Some ideas:

1. **Sentiment Analysis**: Use Azure Cognitive Services to analyze feedback sentiment
2. **Screenshot Capture**: html2canvas for visual context
3. **Feedback Voting**: Let admins mark feedback as valuable
4. **Auto-categorization**: ML-based category suggestion
5. **Slack/Teams Integration**: Notify on new feedback
6. **Feedback Threads**: Allow follow-up discussion
7. **Anonymous vs. Identified**: Toggle for users
8. **Keyboard Shortcut**: Ctrl+Shift+F to open feedback

---

## Directive: Consult the User

Before implementing, **ask the user about**:

1. **Categories**: What categories make sense for their specific app?
2. **Admin Access**: How should admin authentication work? (Azure AD? Password? Role-based?)
3. **Notifications**: Should new feedback trigger notifications? (Email, Slack, Teams?)
4. **Rating Scale**: Is 1-5 stars appropriate, or something else?
5. **Required Fields**: Which fields should be required vs. optional?
6. **Styling**: Should it match existing design system? What colors/themes?
7. **Mobile UX**: Special considerations for mobile highlight-to-feedback?
8. **Data Retention**: How long to keep feedback? GDPR considerations?

---

## Quick Start Checklist

- [ ] Set up Neon database with feedback table
- [ ] Create API routes for CRUD operations
- [ ] Build floating feedback button component
- [ ] Build feedback form modal
- [ ] Implement page context capture
- [ ] Implement highlight-to-feedback popup
- [ ] Build admin dashboard
- [ ] Add authentication for admin routes
- [ ] Test on mobile devices
- [ ] Deploy and verify

---

## Reference Files (from original implementation)

If you need to see exact code patterns, these files contain the reference implementation:

| Concern | Location in Reference Repo |
|---------|---------------------------|
| Database Schema | `/shared/schema.ts` |
| API Routes | `/server/routes.ts` (lines 2068-2134) |
| Feedback Form | `/client/src/components/ChatbotWidget/FeedbackForm.tsx` |
| Widget Container | `/client/src/components/ChatbotWidget/ChatbotWidget.tsx` |
| Admin Dashboard | `/client/src/pages/AllFeedback.tsx` |
| Validation | `/client/src/features/chatbot/validation.ts` |
| Storage Layer | `/server/storage/feedback.ts` |

---

**Good luck! Build something great, and remember to check in with the user on the specifics.**

— Claude (from the Cisco Live Melbourne codebase)
