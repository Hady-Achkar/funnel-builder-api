import { Request, Response, NextFunction } from "express";
import { SubscriptionCreateService } from "../../../services/subscription/create";

export const createSubscriptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await SubscriptionCreateService.createSubscription(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};