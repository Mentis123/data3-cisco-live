export const CATEGORY_KEYS = [
  "NETWORKING",
  "SECURITY",
  "COLLABORATION",
  "DATA_CENTER"
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_NAMES: Record<CategoryKey, string> & Record<string, string> = {
  NETWORKING: "Networking",
  SECURITY: "Security",
  SECURE_CONNECTIVITY: "Security", // Legacy alias for SECURITY
  COLLABORATION: "Collaboration",
  DATA_CENTER: "Cloud & AI",
  // Additional aliases to ensure consistency
  Security: "Security", // case variation
  security: "Security", // case variation
  "Secure Connectivity": "Security", // display name variation
};

export const CATEGORY_COLORS: Record<CategoryKey, string> & Record<string, string> = {
  NETWORKING: "#00D4FF", // Bright Cyan
  SECURITY: "#8B5CF6", // Bright Purple
  SECURE_CONNECTIVITY: "#8B5CF6", // Bright Purple (legacy alias for SECURITY)
  COLLABORATION: "#FF8C00", // Bright Orange
  DATA_CENTER: "#10B981", // Bright Green
  // Additional aliases to ensure purple is used for security
  Security: "#8B5CF6", // Bright Purple (case variation)
  security: "#8B5CF6", // Bright Purple (case variation)
  "Secure Connectivity": "#8B5CF6", // Bright Purple (display name variation)
};

export const CATEGORY_TEXT_COLORS: Record<CategoryKey, string> & Record<string, string> = {
  NETWORKING: "#78DCFF", // Light Cyan
  SECURITY: "#C4B5FD", // Light Purple
  SECURE_CONNECTIVITY: "#C4B5FD", // Light Purple (legacy alias for SECURITY)
  COLLABORATION: "#FFB86B", // Light Orange
  DATA_CENTER: "#86EFAC", // Light Green
  // Additional aliases to ensure consistency
  Security: "#C4B5FD", // Light Purple (case variation)
  security: "#C4B5FD", // Light Purple (case variation)
  "Secure Connectivity": "#C4B5FD", // Light Purple (display name variation)
};

export const CATEGORY_BADGE_CLASSES: Record<CategoryKey, string> & Record<string, string> = {
  NETWORKING: "bg-[#00D4FF]", // Bright Cyan
  SECURITY: "bg-[#8B5CF6]", // Bright Purple
  SECURE_CONNECTIVITY: "bg-[#8B5CF6]", // Bright Purple (legacy alias for SECURITY)
  COLLABORATION: "bg-[#FF8C00]", // Bright Orange
  DATA_CENTER: "bg-[#10B981]", // Bright Green
  // Additional aliases to ensure consistency
  Security: "bg-[#8B5CF6]", // Bright Purple (case variation)
  security: "bg-[#8B5CF6]", // Bright Purple (case variation)
  "Secure Connectivity": "bg-[#8B5CF6]", // Bright Purple (display name variation)
};

export const DEFAULT_CATEGORY_COLOR = "#00AEFF";

export const getCategoryName = (category: string): string =>
  CATEGORY_NAMES[category as CategoryKey] ?? category;
