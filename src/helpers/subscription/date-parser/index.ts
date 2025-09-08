/**
 * Parse webhook created_date string to Date object
 */
export function parseCreatedDate(createdDate: string): Date {
  try {
    // Format: "2025-09-08-12-18-51"
    const parts = createdDate.split('-');
    if (parts.length === 6) {
      const [year, month, day, hour, minute, second] = parts.map(Number);
      return new Date(year, month - 1, day, hour, minute, second);
    }
    // Fallback to current date if parsing fails
    return new Date();
  } catch {
    return new Date();
  }
}