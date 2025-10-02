import jwt from "jsonwebtoken";
import { RegisterRequest } from "../../../../types/auth/register";

/**
 * Generate a JWT verification token for email verification
 */
export function generateVerificationToken(userData: RegisterRequest): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not configured");
  }

  const payload = {
    email: userData.email,
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    isAdmin: userData.isAdmin || false,
    plan: userData.plan || "FREE",
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: "24h" });
}

/**
 * Calculate verification token expiry (24 hours from now)
 */
export function getVerificationTokenExpiry(): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  return expiryDate;
}