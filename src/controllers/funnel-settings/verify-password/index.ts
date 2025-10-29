import { Request, Response, NextFunction } from "express";
import { verifyFunnelPassword } from "../../../services/funnel-settings/verify-password";
import { ZodError } from "zod";
import { setFunnelAccessSessionCookie } from "../../../lib/jwt";

export const verifyPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const funnelSlug = req.params.funnelSlug;

    if (!funnelSlug) {
      throw new Error("Funnel slug is required");
    }

    const result = await verifyFunnelPassword({
      ...req.body,
      funnelSlug
    });

    // Set session cookie if password is valid
    if (result.valid && result.funnelId) {
      setFunnelAccessSessionCookie(res, funnelSlug, result.funnelId);
    }

    return res.status(200).json(result);
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