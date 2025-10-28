import { z } from "zod";

export const feedbackSchema = z.object({
  category: z.enum([
    "ui-ux",
    "gameplay",
    "trivia",
    "technical",
    "feature-request",
    "other",
  ]),
  rating: z.number().min(1).max(5),
  message: z
    .string()
    .min(10, "Please provide at least 10 characters of feedback")
    .max(1000, "Feedback must be less than 1000 characters"),
  page: z.string(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")), // Claude: Optional email field
  emailHash: z.string().optional(),
  sessionToken: z.string().optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

export const categoryLabels: Record<string, string> = {
  "ui-ux": "UI/UX Design",
  gameplay: "Gameplay Experience",
  trivia: "Trivia Content",
  technical: "Technical Issue",
  "feature-request": "Feature Request",
  other: "Other",
};
