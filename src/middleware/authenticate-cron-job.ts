import { Request, Response, NextFunction } from "express";

export function authenticateCronJob(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const cronSecretToken = process.env.CRON_SECRET_TOKEN;

  // Check if CRON_SECRET_TOKEN is configured
  if (!cronSecretToken) {
    console.error(
      "[CronAuth] CRON_SECRET_TOKEN not configured in environment variables"
    );
    res.status(500).json({
      error: "Server configuration error",
      message: "Cron authentication is not properly configured",
    });
    return;
  }

  // Get Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn(
      `[CronAuth] Unauthorized cron job attempt from ${req.ip} - No Authorization header`
    );
    res.status(401).json({
      error: "Unauthorized",
      message: "Authorization header is required",
    });
    return;
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.warn(
      `[CronAuth] Unauthorized cron job attempt from ${req.ip} - Invalid Authorization header format`
    );
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Authorization header format. Expected: Bearer <token>",
    });
    return;
  }

  const token = parts[1];

  // Validate token (constant-time comparison to prevent timing attacks)
  if (!constantTimeCompare(token, cronSecretToken)) {
    console.warn(
      `[CronAuth] Unauthorized cron job attempt from ${req.ip} - Invalid token`
    );
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid authorization token",
    });
    return;
  }

  // Token is valid, allow the request
  console.log(`[CronAuth] ✅ Authorized cron job request from ${req.ip}`);
  next();
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * This prevents attackers from determining the correct token character-by-character
 * by measuring response times.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
