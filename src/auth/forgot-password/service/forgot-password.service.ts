import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  forgotPasswordRequest,
  forgotPasswordResponse,
  ForgotPasswordResponse,
} from "../types";
import { sendPasswordResetEmail } from "../emails";

export class ForgotPasswordService {
  static async forgotPassword(
    userData: unknown
  ): Promise<ForgotPasswordResponse> {
    try {
      const validatedData = forgotPasswordRequest.parse(userData);
      const { email } = validatedData;

      const prisma = getPrisma();

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          verified: true,
        },
      });

      const successMessage =
        "If an account with that email exists and is verified, you will receive a password reset link shortly.";

      if (!user) {
        return forgotPasswordResponse.parse({
          message: successMessage,
        });
      }

      if (!user.verified) {
        return forgotPasswordResponse.parse({
          message: successMessage,
        });
      }

      const tokenData = {
        email: user.email,
        timestamp: Date.now(),
      };
      const resetToken = Buffer.from(JSON.stringify(tokenData)).toString(
        "base64"
      );
      const resetTokenExpiresAt = new Date();
      resetTokenExpiresAt.setHours(resetTokenExpiresAt.getHours() + 1); // 1 hour expiration

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: resetTokenExpiresAt,
        },
      });

      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      return forgotPasswordResponse.parse({
        message: successMessage,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        throw new Error(`Invalid input: ${firstError.message}`);
      }
      throw error;
    }
  }
}
