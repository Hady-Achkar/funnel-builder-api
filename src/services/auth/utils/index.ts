import { User } from "../../../generated/prisma-client";
import jwt from "jsonwebtoken";

export const generateToken = (user: User) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not configured");
  }

  const payload = extractTokenDataFromUser(user);

  return jwt.sign(payload, jwtSecret, { expiresIn: "180d" });
};

const extractTokenDataFromUser = (user: User) => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin || false,
    balance: user.balance,
    plan: user.plan || "FREE",
    maximumFunnels: user.maximumFunnels,
    maximumCustomDomains: user.maximumCustomDomains,
    maximumSubdomains: user.maximumSubdomains,
  };
};
