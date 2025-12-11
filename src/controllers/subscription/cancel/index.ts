import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { CancelSubscriptionService } from "../../../services/subscription/cancel";
import { cancelSubscriptionRequest } from "../../../types/subscription/cancel";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";
import { AuthRequest } from "../../../middleware/auth";

export class CancelSubscriptionController {
  /**
   * Cancel a subscription
   * - Validates request
   * - Checks ownership
   * - Checks current status
   * - Calls service to cancel
   */
  static async cancel(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Validate request with Zod
      const validatedData = cancelSubscriptionRequest.parse(req.body);
      const userId = req.userId!;

      const prisma = getPrisma();

      // 2. Get subscription and verify it exists
      const subscription = await prisma.subscription.findUnique({
        where: { subscriptionId: validatedData.subscriptionId },
      });

      if (!subscription) {
        return next(
          new NotFoundError(
            "Subscription not found. Please check the subscription ID and try again."
          )
        );
      }

      // 3. Verify user owns the subscription
      if (subscription.userId !== userId) {
        return next(
          new ForbiddenError(
            "You don't have permission to cancel this subscription. Only the subscription owner can cancel it."
          )
        );
      }

      // 4. Check if subscription is currently ACTIVE (can't cancel already cancelled/expired)
      if (subscription.status !== "ACTIVE") {
        return next(
          new BadRequestError(
            `This subscription is already ${subscription.status.toLowerCase()}. Only active subscriptions can be cancelled.`
          )
        );
      }

      // 5. Call service to cancel the subscription
      const result = await CancelSubscriptionService.cancel(
        validatedData.subscriptionId,
        userId
      );

      // 6. Send success response
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const errorMessage = firstError
          ? firstError.message
          : "Please check your input and try again.";
        return next(new BadRequestError(errorMessage));
      }

      next(error);
    }
  }
}
