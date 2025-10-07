/**
 * Generate a unique slug from a date (for auto-generated funnel names)
 *
 * Creates a timestamp-based slug in format: dd-mm-yyyy-hh-mm-ss
 * Used when funnel is created with auto-generated name (date/time format)
 *
 * @param date - Date to convert to slug (defaults to current date/time)
 * @returns Slug in format "dd-mm-yyyy-hh-mm-ss"
 *
 * @example
 * generateDateSlug(new Date('2024-01-15 14:30:45')) // Returns: "15-01-2024-14-30-45"
 * generateDateSlug() // Returns current timestamp as slug
 */
export const generateDateSlug = (date: Date = new Date()): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year}-${hour}-${minute}-${second}`;
};
