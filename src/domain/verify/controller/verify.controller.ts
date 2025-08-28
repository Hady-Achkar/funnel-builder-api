import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { VerifyDomainService } from "../service";
import { 
  VerifyDomainRequest, 
  VerifyDomainRequestSchema,
  VerifyDomainResponse 
} from "../types";

export class VerifyDomainController {
  /**
   * Verify a domain
   * POST /api/domains/verify
   */
  static async verify(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.userId!;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication is required.' });
        return;
      }

      // Validate request body
      let requestData: VerifyDomainRequest;
      try {
        requestData = VerifyDomainRequestSchema.parse(req.body);
      } catch (validationError: any) {
        console.warn('[Domain Verify] Request validation failed:', validationError.errors);
        res.status(400).json({ 
          error: 'Invalid request data',
          details: validationError.errors 
        });
        return;
      }

      console.log(`[Domain Verify] Processing domain verification for user ${userId}:`, requestData);

      // Verify domain using service
      const result: VerifyDomainResponse = await VerifyDomainService.verify(
        userId, 
        requestData
      );

      // Return successful response
      res.status(200).json(result);

    } catch (error: any) {
      console.error("Verify domain error:", error);

      // Handle specific domain verification errors
      if (error.message.includes("Domain not found")) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes("already active")) {
        res.status(200).json({ 
          error: false, 
          message: error.message 
        });
        return;
      }

      if (error.message.includes("not configured correctly")) {
        res.status(400).json({ error: error.message });
        return;
      }

      // Handle CloudFlare API errors
      if (error.message.includes("CloudFlare") || 
          error.message.includes("Cloudflare")) {
        console.error("CloudFlare API error:", error);
        res.status(502).json({ 
          error: "External service error. Please try again later." 
        });
        return;
      }

      // Handle validation errors
      if (error.message.includes("Hostname") ||
          error.message.includes("Invalid domain") ||
          error.message.includes("Domain labels cannot be empty") ||
          error.message.includes("exceeds maximum length")) {
        res.status(400).json({ error: error.message });
        return;
      }

      // Handle database errors
      if (error.code === 'P2025') { // Prisma record not found
        res.status(404).json({ error: "Domain not found" });
        return;
      }

      if (error.code === 'P2002') { // Prisma unique constraint violation
        res.status(400).json({ error: "Domain conflict" });
        return;
      }

      // Generic error response
      res.status(500).json({ 
        error: error.message || "Failed to verify domain" 
      });
    }
  }
}