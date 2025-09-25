import jwt from "jsonwebtoken";
import { User } from "../../../generated/prisma-client";
import { RegisterRequest } from "../../../types/auth/register";

export const generateToken = (user: User) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not configured");
  }

  const payload = extractTokenDataFromUser(user);

  return jwt.sign(payload, jwtSecret, { expiresIn: "180d" });
};

export const generateVerificationToken = (userData: RegisterRequest) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not configured");
  }

  const payload = extractVerificationDataFromUser(userData);

  return jwt.sign(payload, jwtSecret, { expiresIn: "24h" });
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
    maximumWorkspaces: user.maximumWorkspaces,
  };
};

const extractVerificationDataFromUser = (userData: RegisterRequest) => {
  return {
    email: userData.email,
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    isAdmin: userData.isAdmin || false,
    plan: userData.plan || "FREE",
  };
};
