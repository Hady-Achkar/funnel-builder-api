import jwt from "jsonwebtoken";
import { isValidAdminCode } from "../../../../constants/admin-codes";
import { UserPlan } from "../../../../generated/prisma-client";

export interface DecodedOuterPaymentToken {
  userId?: number;
  paymentId?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  addedBy?: string;
  // Admin invitation token fields
  type?: string;
  adminCode?: string;
  invitedEmail?: string;
  plan?: UserPlan;
  tokenId?: string;
  [key: string]: unknown;
}

export interface TokenValidationResult {
  decoded: DecodedOuterPaymentToken | null;
  error: string | null;
}

/**
 * Decodes and validates the structure of an outer payment token
 * Supports both legacy payment tokens and new admin invitation tokens
 * Pure function - no database calls, no try-catch
 */
export function decodeOuterPaymentToken(
  token: string,
  jwtSecret: string,
  registrationEmail?: string
): TokenValidationResult {
  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedOuterPaymentToken;

    // Check if this is an admin invitation token
    if (decoded.type === "admin_invitation") {
      // Validate required fields for admin invitation
      if (!decoded.adminCode || !decoded.invitedEmail || !decoded.plan) {
        return {
          decoded: null,
          error: "This invitation link is invalid. Please check your email or contact support.",
        };
      }

      // Validate admin code
      if (!isValidAdminCode(decoded.adminCode)) {
        return {
          decoded: null,
          error: "This invitation link is invalid. Please check your email or contact support.",
        };
      }

      // Validate invited email matches registration email
      if (registrationEmail && decoded.invitedEmail.toLowerCase() !== registrationEmail.toLowerCase()) {
        return {
          decoded: null,
          error: "This invitation was sent to a different email address. Please use the email address from your invitation.",
        };
      }

      // Map adminCode to addedBy for consistency with existing system
      decoded.addedBy = decoded.adminCode;

      return { decoded, error: null };
    }

    // Legacy payment token validation
    // Validate required addedBy field exists
    if (!decoded.addedBy) {
      return {
        decoded: null,
        error: "This invitation link is invalid. Please check your email or contact support.",
      };
    }

    // Validate addedBy is a valid admin code
    if (!isValidAdminCode(decoded.addedBy)) {
      return {
        decoded: null,
        error: "This invitation link is invalid. Please check your email or contact support.",
      };
    }

    return { decoded, error: null };
  } catch (error: any) {
    // Check if token is expired
    if (error.name === "TokenExpiredError") {
      return {
        decoded: null,
        error: "This invitation link has expired. Please request a new invitation from your administrator.",
      };
    }

    // Invalid token
    return {
      decoded: null,
      error: "This invitation link is invalid. Please check your email or contact support.",
    };
  }
}
