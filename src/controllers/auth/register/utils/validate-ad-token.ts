import jwt from "jsonwebtoken";

export interface DecodedAdToken {
  campaignId?: string;
  source?: string;
  medium?: string;
  [key: string]: unknown;
}

/**
 * Decodes and validates the structure of an ad token
 * Pure function - no database calls, no try-catch
 */
export function decodeAdToken(token: string, jwtSecret: string): DecodedAdToken | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedAdToken;

    // Ad token is valid as long as JWT verification passes
    // Additional fields are optional and can be used for tracking
    return decoded;
  } catch {
    return null;
  }
}
