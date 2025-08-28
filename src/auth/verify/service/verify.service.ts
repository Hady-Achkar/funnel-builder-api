import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  verifyEmailRequest,
  verifyEmailServiceResponse,
  VerifyEmailServiceResponse,
} from "../types";

export class VerifyService {
  static async verifyEmail(token: string): Promise<VerifyEmailServiceResponse> {
    try {
      const validatedData = verifyEmailRequest.parse({ token });
      const prisma = getPrisma();

      let tokenData;
      try {
        const decodedToken = Buffer.from(
          validatedData.token,
          "base64"
        ).toString("utf-8");
        tokenData = JSON.parse(decodedToken);
      } catch {
        throw new Error("Invalid verification token format");
      }

      if (!tokenData.email || !tokenData.password || !tokenData.timestamp) {
        throw new Error("Invalid verification token data");
      }

      const tokenAge = Date.now() - tokenData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (tokenAge > maxAge) {
        throw new Error("Verification token has expired");
      }

      const user = await prisma.user.findUnique({
        where: { verificationToken: validatedData.token },
        select: {
          id: true,
          email: true,
          password: true,
          verified: true,
          verificationTokenExpiresAt: true,
        },
      });

      if (!user) {
        throw new Error("Invalid verification token");
      }

      if (user.verified) {
        throw new Error("Email is already verified");
      }

      if (
        user.email !== tokenData.email ||
        user.password !== tokenData.password
      ) {
        throw new Error("Token data does not match user");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
        },
      });

      const jwtToken = this.generateToken(user.id);

      const response = {
        message: "Email verified successfully",
        verified: true,
        token: jwtToken,
      };

      return verifyEmailServiceResponse.parse(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        throw new Error(`Invalid input: ${firstError.message}`);
      }
      throw error;
    }
  }

  private static generateToken(userId: number): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    return jwt.sign({ userId }, jwtSecret, { expiresIn: "180d" });
  }
}
