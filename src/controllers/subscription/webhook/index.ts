import { Request, Response, NextFunction } from "express";
import { PaymentWebhookService } from "../../../services/subscription/webhook";

export class PaymentWebhookController {
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("[Webhook] Received payment webhook:", {
        event_type: req.body.event_type,
        id: req.body.id,
        status: req.body.status,
      });

      const result = await PaymentWebhookService.processWebhook(req.body);

      res.status(200).json(result);
    } catch (error) {
      console.error("[Webhook] Error processing webhook:", error);
      next(error);
    }
  }
}