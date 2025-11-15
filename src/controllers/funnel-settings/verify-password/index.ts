import { Request, Response, NextFunction } from "express";
import { verifyFunnelPassword } from "../../../services/funnel-settings/verify-password";
import { ZodError } from "zod";
import { generateFunnelAccessToken } from "../../../lib/jwt";

export const verifyPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hostname = req.query.hostname as string;
    const funnelSlug = req.query.funnelSlug as string;

    if (!hostname || !funnelSlug) {
      throw new Error("Hostname and funnel slug are required");
    }

    const result = await verifyFunnelPassword({
      ...req.body,
      hostname,
      funnelSlug
    });

    // Generate session token if password is valid
    if (result.valid && result.funnelId) {
      const sessionToken = generateFunnelAccessToken(funnelSlug, result.funnelId);
      result.sessionToken = sessionToken;
      return res.status(200).json(result);
    }

    // If password is invalid, return 401 Unauthorized
    return res.status(401).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        valid: false,
        message: error.issues[0]?.message || 'Invalid data provided'
      });
    }
    next(error);
  }
};