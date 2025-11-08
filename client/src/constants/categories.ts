export const CATEGORY_KEYS = [
  "NETWORKING",
  "SECURITY",
  "COLLABORATION",
  "DATA_CENTER"
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_NAMES: Record<CategoryKey, string> = {
  NETWORKING: "Networking",
  SECURITY: "Security",
  COLLABORATION: "Collaboration",
  DATA_CENTER: "Cloud & AI"
};

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  NETWORKING: "#00BCF2", // Cyan
  SECURITY: "#6B21A8", // Dark Purple
  COLLABORATION: "#F97316", // Orange
  DATA_CENTER: "#059669" // Emerald Green
};

export const CATEGORY_TEXT_COLORS: Record<CategoryKey, string> = {
  NETWORKING: "#78DCFF", // Light Cyan
  SECURITY: "#C4B5FD", // Light Purple
  COLLABORATION: "#FFB86B", // Light Orange
  DATA_CENTER: "#86EFAC" // Light Green
};

export const CATEGORY_BADGE_CLASSES: Record<CategoryKey, string> = {
  NETWORKING: "bg-[#00BCF2]", // Cyan
  SECURITY: "bg-[#6B21A8]", // Dark Purple
  COLLABORATION: "bg-[#F97316]", // Orange
  DATA_CENTER: "bg-[#059669]" // Emerald Green
};

export const DEFAULT_CATEGORY_COLOR = "#00AEFF";

export const getCategoryName = (category: string): string =>
  CATEGORY_NAMES[category as CategoryKey] ?? category;
