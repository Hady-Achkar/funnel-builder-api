import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetDNSInstructionsService } from "../service";
import { GetDNSInstructionsResponse } from "../types";

export class GetDNSInstructionsController {
  /**
   * Get DNS instructions by domain ID
   * GET /api/domains/:id/dns-instructions
   */
  static async getByDomainId(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.id);
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication is required.' });
        return;
      }

      if (isNaN(domainId)) {
        res.status(400).json({ error: 'Invalid domain ID' });
        return;
      }

      console.log(`[Get DNS Instructions] Processing request for domain ID ${domainId}, user ${userId}`);

      // Get DNS instructions using service
      const result: GetDNSInstructionsResponse = await GetDNSInstructionsService.getDNSInstructions(
        userId, 
        { id: domainId }
      );

      // Return successful response
      res.status(200).json(result);

    } catch (error: any) {
      console.error("Get DNS instructions by ID error:", error);

      // Handle specific errors
      if (error.message.includes("Domain not found")) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes("Invalid domain ID")) {
        res.status(400).json({ error: error.message });
        return;
      }

      // Handle database errors
      if (error.code === 'P2025') { // Prisma record not found
        res.status(404).json({ error: "Domain not found" });
        return;
      }

      // Generic error response
      res.status(500).json({ 
        error: error.message || "Failed to get DNS instructions" 
      });
    }
  }

  /**
   * Get DNS instructions by hostname
   * POST /api/domains/dns-instructions/by-hostname
   */
  static async getByHostname(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { hostname } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication is required.' });
        return;
      }

      if (!hostname || typeof hostname !== 'string') {
        res.status(400).json({ error: 'Hostname is required' });
        return;
      }

      console.log(`[Get DNS Instructions] Processing request for hostname ${hostname}, user ${userId}`);

      // Get DNS instructions using service
      const result: GetDNSInstructionsResponse = await GetDNSInstructionsService.getDNSInstructions(
        userId, 
        { hostname }
      );

      // Return successful response
      res.status(200).json(result);

    } catch (error: any) {
      console.error("Get DNS instructions by hostname error:", error);

      // Handle specific errors
      if (error.message.includes("Domain not found")) {
        res.status(404).json({ error: error.message });
        return;
      }

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

      // Generic error response
      res.status(500).json({ 
        error: error.message || "Failed to get DNS instructions" 
      });
    }
  }
}