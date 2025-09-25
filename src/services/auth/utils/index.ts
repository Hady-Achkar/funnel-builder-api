import jwt from "jsonwebtoken";
import { RegisterRequest } from "../../../types/auth/register";

export const generateToken = (user: RegisterRequest) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not configured");
  }

  const payload = extractTokenDataFromUser(user);

  return jwt.sign(payload, jwtSecret, { expiresIn: "180d" });
};

const extractTokenDataFromUser = (user: RegisterRequest) => {
  return {
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin || false,
    plan: user.plan || "FREE",
  };
};
