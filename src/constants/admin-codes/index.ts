/**
 * Valid admin codes for outer payment registration tracking
 * These codes identify which admin added the user
 */
export const VALID_ADMIN_CODES = [
  'ADM7K2X',
  'XPL9M4N',
  'QRT5W8Z',
  'VBN3H6Y',
  'FGH2L9P',
  'JKL4T7R',
  'MNP6S1Q',
  'WXY8D5C',
] as const;

export type AdminCode = (typeof VALID_ADMIN_CODES)[number];

/**
 * Check if a code is a valid admin code
 */
export function isValidAdminCode(code: string): code is AdminCode {
  return VALID_ADMIN_CODES.includes(code as AdminCode);
}
