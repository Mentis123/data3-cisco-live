export const CATEGORY_KEYS = [
  "SECURE_CONNECTIVITY",
  "HYBRID_DC",
  "COLLAB_CX",
  "OBSERVABILITY",
  "EDGE_IOT"
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_NAMES: Record<CategoryKey, string> = {
  SECURE_CONNECTIVITY: "Zero Trust & Secure Connectivity",
  HYBRID_DC: "Hybrid Cloud Infrastructure",
  COLLAB_CX: "Collaboration & Customer Experience",
  OBSERVABILITY: "Observability & Automation",
  EDGE_IOT: "Edge & IoT Automation"
};

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  SECURE_CONNECTIVITY: "#00BCF2", // Cyan
  HYBRID_DC: "#6B21A8", // Dark Purple
  COLLAB_CX: "#F97316", // Orange
  OBSERVABILITY: "#EAB308", // Amber
  EDGE_IOT: "#22C55E" // Green
};

export const CATEGORY_TEXT_COLORS: Record<CategoryKey, string> = {
  SECURE_CONNECTIVITY: "#78DCFF", // Light Cyan
  HYBRID_DC: "#C4B5FD", // Light Purple
  COLLAB_CX: "#FFB86B", // Light Orange
  OBSERVABILITY: "#FDE68A", // Light Amber
  EDGE_IOT: "#86EFAC" // Light Green
};

export const CATEGORY_BADGE_CLASSES: Record<CategoryKey, string> = {
  SECURE_CONNECTIVITY: "bg-[#00BCF2]", // Cyan
  HYBRID_DC: "bg-[#6B21A8]", // Dark Purple
  COLLAB_CX: "bg-[#F97316]", // Orange
  OBSERVABILITY: "bg-[#EAB308]", // Amber
  EDGE_IOT: "bg-[#22C55E]" // Green
};

export const DEFAULT_CATEGORY_COLOR = "#00AEFF";

export const getCategoryName = (category: string): string =>
  CATEGORY_NAMES[category as CategoryKey] ?? category;
