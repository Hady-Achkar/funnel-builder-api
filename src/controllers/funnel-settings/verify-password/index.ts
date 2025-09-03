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
    const funnelId = parseInt(req.params.funnelId);

    if (!funnelId || isNaN(funnelId)) {
      throw new Error("Invalid funnel ID");
    }

    const result = await verifyFunnelPassword({
      ...req.body,
      funnelId
    });

    // Set session cookie if password is valid
    if (result.valid) {
      setFunnelAccessSessionCookie(res, funnelId);
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