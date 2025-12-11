import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  resetPasswordRequest,
  resetPasswordServiceResponse,
  ResetPasswordServiceResponse,
} from "../../../types/auth/reset-password";
import { generateToken } from "../utils";

export class ResetPasswordService {
  static async resetPassword(
    userData: unknown
  ): Promise<ResetPasswordServiceResponse> {
    try {
      const validatedData = resetPasswordRequest.parse(userData);
      const { token, password } = validatedData;

      const prisma = getPrisma();

      // Decode token to get email and timestamp
      let tokenData;
      try {
        const decodedToken = Buffer.from(token, "base64").toString("utf-8");
        tokenData = JSON.parse(decodedToken);
      } catch {
        throw new Error("Invalid reset token format");
      }

      if (!tokenData.email || !tokenData.timestamp) {
        throw new Error("Invalid reset token data");
      }

      // Check if token is expired (1 hour)
      const tokenAge = Date.now() - tokenData.timestamp;
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      if (tokenAge > maxAge) {
        throw new Error("Reset token has expired");
      }

      // Find user with this reset token
      const user = await prisma.user.findUnique({
        where: { passwordResetToken: token },
      });

      if (!user) {
        throw new Error("Invalid reset token");
      }

      if (!user.verified) {
        throw new Error("Account not verified");
      }

      // Verify that the token data matches the user
      if (user.email !== tokenData.email) {
        throw new Error("Token data does not match user");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      });

      // Generate JWT token for auto-login
      const jwtToken = generateToken(user);

      const response = {
        message: "Password reset successfully",
        token: jwtToken,
      };

      return resetPasswordServiceResponse.parse(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        throw new Error(`Invalid input: ${firstError.message}`);
      }
      throw error;
    }
  }
}
