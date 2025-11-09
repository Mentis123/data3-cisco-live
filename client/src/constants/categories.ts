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
  NETWORKING: "#00BCF2", // Cyan
  SECURITY: "rgb(107, 33, 168)", // Dark Purple - using RGB to avoid browser color profile issues
  SECURE_CONNECTIVITY: "rgb(107, 33, 168)", // Dark Purple (legacy alias for SECURITY)
  COLLABORATION: "#F97316", // Orange
  DATA_CENTER: "#059669", // Emerald Green
  // Additional aliases to ensure purple is used for security
  Security: "rgb(107, 33, 168)", // Dark Purple (case variation)
  security: "rgb(107, 33, 168)", // Dark Purple (case variation)
  "Secure Connectivity": "rgb(107, 33, 168)", // Dark Purple (display name variation)
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
  NETWORKING: "bg-[#00BCF2]", // Cyan
  SECURITY: "bg-[rgb(107,33,168)]", // Dark Purple - RGB format
  SECURE_CONNECTIVITY: "bg-[rgb(107,33,168)]", // Dark Purple (legacy alias for SECURITY)
  COLLABORATION: "bg-[#F97316]", // Orange
  DATA_CENTER: "bg-[#059669]", // Emerald Green
  // Additional aliases to ensure consistency
  Security: "bg-[rgb(107,33,168)]", // Dark Purple (case variation)
  security: "bg-[rgb(107,33,168)]", // Dark Purple (case variation)
  "Secure Connectivity": "bg-[rgb(107,33,168)]", // Dark Purple (display name variation)
};

export const DEFAULT_CATEGORY_COLOR = "#00AEFF";

export const getCategoryName = (category: string): string =>
  CATEGORY_NAMES[category as CategoryKey] ?? category;
