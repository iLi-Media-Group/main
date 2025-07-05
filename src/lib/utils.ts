import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse array fields from database that might be stored as JSON strings or comma-separated strings
 * This handles cases where genres, moods, etc. are stored as ["hiphop", "rnb"] vs "hiphop,rnb"
 */
export function parseArrayField(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    // Try to parse as JSON first (handles ["hiphop", "rnb"] format)
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If JSON parsing fails, try comma-separated string
      return field.split(',').map((item: string) => item.trim()).filter(Boolean);
    }
  }
  return [];
}
