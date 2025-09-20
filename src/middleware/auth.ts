import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: number;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check for token in cookie first, then fallback to Authorization header
  let token = req.cookies?.authToken;
  
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: "JWT secret not configured" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.id; // Changed from decoded.userId to decoded.id

    // Get user from database to check trial status
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        trialEndDate: true,
        plan: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Check if trial has expired (only for users with trial end date)
    if (user.trialEndDate && new Date() > user.trialEndDate) {
      res.status(403).json({ 
        error: "Trial period has expired. Please upgrade your plan to continue.",
        trialExpired: true 
      });
      return;
    }

    req.userId = userId;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};
