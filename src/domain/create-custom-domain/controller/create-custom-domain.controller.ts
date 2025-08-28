import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { CreateCustomDomainService } from "../service";
import { 
  CreateCustomDomainRequest, 
  CreateCustomDomainRequestSchema,
  CreateCustomDomainResponse 
} from "../types";

export class CreateCustomDomainController {
  /**
   * Create a custom domain
   * POST /api/domains/create-custom-domain
   */
  static async create(
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
      let requestData: CreateCustomDomainRequest;
      try {
        requestData = CreateCustomDomainRequestSchema.parse(req.body);
      } catch (validationError: any) {
        console.warn('[Domain Create] Request validation failed:', validationError.errors);
        res.status(400).json({ 
          error: 'Invalid request data',
          details: validationError.errors 
        });
        return;
      }

      console.log(`[Domain Create] Processing custom domain creation for user ${userId}:`, requestData);

      // Create custom domain using service
      const result: CreateCustomDomainResponse = await CreateCustomDomainService.create(
        userId, 
        requestData
      );

      // Return successful response
      res.status(201).json(result);

    } catch (error: any) {
      console.error("Create custom domain error:", error);

      // Handle specific domain-related errors
      if (error.message.includes("reached your limit")) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes("already taken") || 
          error.message.includes("taken, please choose another")) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes("subdomain") || 
          error.message.includes("Please provide a subdomain")) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes("User not found") || 
          error.message.includes("no workspace")) {
        res.status(404).json({ error: error.message });
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
      if (error.code === 'P2002') { // Prisma unique constraint violation
        res.status(400).json({ error: "This domain name is already registered" });
        return;
      }

      // Generic error response
      res.status(500).json({ 
        error: error.message || "Failed to create custom domain" 
      });
    }
  }
}