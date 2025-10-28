/**
 * Chatbot Widget Types
 * Phase 1: Feedback Collection
 * Phase 2: AI Chat Integration (future)
 */

export type FeedbackCategory =
  | "ui-ux"
  | "gameplay"
  | "trivia"
  | "technical"
  | "feature-request"
  | "other";

export type FeedbackStatus = "pending" | "reviewed" | "implemented";

export interface FeedbackSubmission {
  category: FeedbackCategory;
  rating: number; // 1-5
  message: string;
  page: string; // Current page/route
  emailHash?: string; // Optional, from session
  sessionToken?: string; // Optional, from session
}

export interface FeedbackRecord extends FeedbackSubmission {
  id: string;
  timestamp: string;
  status: FeedbackStatus;
}

export interface FeedbackResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface ChatbotWidgetState {
  isOpen: boolean;
  isSubmitting: boolean;
}

// Future: Phase 2 AI Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
