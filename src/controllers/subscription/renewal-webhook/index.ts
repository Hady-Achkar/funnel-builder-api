import { Request, Response, NextFunction } from "express";
import { RenewalWebhookService } from "../../../services/subscription/renewal-webhook";

export class RenewalWebhookController {
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await RenewalWebhookService.processWebhook(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("[RenewalWebhook] Error processing renewal webhook:", error);
      next(error);
    }
  }
}
