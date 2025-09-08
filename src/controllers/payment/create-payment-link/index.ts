import { Request, Response, NextFunction } from "express";
import { CreatePaymentLinkService } from "../../../services/payment/create-payment-link";

export class CreatePaymentLinkController {
  static async createPaymentLink(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await CreatePaymentLinkService.createPaymentLink(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}