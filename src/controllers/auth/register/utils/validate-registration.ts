export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Check if email exists in the provided list
 * Pure function - no database calls
 */
export function checkEmailExists(existingEmails: string[], email: string): boolean {
  return existingEmails.some(e => e.toLowerCase() === email.toLowerCase());
}

/**
 * Check if username exists in the provided list
 * Pure function - no database calls
 */
export function checkUsernameExists(existingUsernames: string[], username: string): boolean {
  return existingUsernames.some(u => u.toLowerCase() === username.toLowerCase());
}