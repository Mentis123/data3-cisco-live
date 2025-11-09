import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a full name to show first name and last initial
 * @param fullName - The full name to format (e.g., "John Doe")
 * @returns Formatted name (e.g., "John D.")
 *
 * Examples:
 * - "John Doe" → "John D."
 * - "Mary Jane Smith" → "Mary S."
 * - "Bob" → "Bob"
 * - "" → ""
 */
export function formatNameToInitials(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return '';
  }

  const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);

  if (nameParts.length === 0) {
    return '';
  }

  if (nameParts.length === 1) {
    // Single name: return as-is
    return nameParts[0];
  }

  // Multiple names: first name and last initial
  const firstName = nameParts[0];
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}
