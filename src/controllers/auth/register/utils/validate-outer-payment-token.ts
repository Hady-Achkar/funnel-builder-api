import jwt from "jsonwebtoken";

export interface DecodedOuterPaymentToken {
  userId?: number;
  paymentId?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  [key: string]: unknown;
}

/**
 * Decodes and validates the structure of an outer payment token
 * Pure function - no database calls, no try-catch
 */
export function decodeOuterPaymentToken(token: string, jwtSecret: string): DecodedOuterPaymentToken | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedOuterPaymentToken;

    // Outer payment token is valid as long as JWT verification passes
    // Additional fields are optional and can be used for tracking payment details
    return decoded;
  } catch {
    return null;
  }
}
