import { Request, Response, NextFunction } from "express";
import { PaymentWebhookService } from "../../../services/subscription/first-subscription-webhook";

export class FirstSubscriptionWebhookController {
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await PaymentWebhookService.processWebhook(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("[FirstSubscriptionWebhook] Error processing webhook:", error);
      next(error);
    }
  }
}
