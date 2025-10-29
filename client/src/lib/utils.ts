import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a full name to show only first initial and last initial
 * @param fullName - The full name to format (e.g., "John Doe")
 * @returns Formatted initials (e.g., "J. D.")
 *
 * Examples:
 * - "John Doe" → "J. D."
 * - "Mary Jane Smith" → "M. S."
 * - "Bob" → "B."
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
    // Single name: just first initial
    return `${nameParts[0].charAt(0).toUpperCase()}.`;
  }

  // Multiple names: first initial and last initial
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

  return `${firstInitial}. ${lastInitial}.`;
}
