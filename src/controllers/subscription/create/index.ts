import { Request, Response, NextFunction } from "express";
import { SubscriptionCreateService } from "../../../services/subscription/create";

export class SubscriptionCreateController {
  static async createSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await SubscriptionCreateService.createSubscription(req.body);
      
      // Check if the result is an error
      if ('error' in result) {
        // Return appropriate HTTP status based on error stage
        const statusCode = SubscriptionCreateController.getStatusCodeForError(result.stage);
        res.status(statusCode).json(result);
        return;
      }

      // Success response
      res.status(200).json(result);
    } catch (error) {
      console.error('Unexpected error in subscription controller:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing your request',
        stage: 'controller'
      });
    }
  }

  /**
   * Map error stage to appropriate HTTP status code
   */
  private static getStatusCodeForError(stage?: string): number {
    switch (stage) {
      case 'validation':
        return 400; // Bad Request
      case 'duplicate_check':
        return 409; // Conflict
      case 'user_creation':
      case 'payment_creation':
      case 'subscription_creation':
      case 'affiliate_processing':
        return 422; // Unprocessable Entity
      case 'email_sending':
        return 207; // Multi-Status (partial success)
      default:
        return 500; // Internal Server Error
    }
  }
}