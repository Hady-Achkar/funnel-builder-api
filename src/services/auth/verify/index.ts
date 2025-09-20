import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { getPrisma } from "../../../lib/prisma";
import {
  verifyEmailRequest,
  verifyEmailServiceResponse,
  VerifyEmailServiceResponse,
} from "../../../types/auth/verify";
import { generateToken } from "../utils";

export class VerifyService {
  static async verifyEmail(token: string): Promise<VerifyEmailServiceResponse> {
    try {
      const validatedData = verifyEmailRequest.parse({ token });
      const prisma = getPrisma();

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT secret not configured");
      }

      let tokenData;
      try {
        tokenData = jwt.verify(validatedData.token, jwtSecret) as any;
      } catch (error: any) {
        if (error.name === "TokenExpiredError") {
          throw new Error("Verification token has expired");
        }
        throw new Error("Invalid verification token");
      }

      if (!tokenData.email) {
        throw new Error("Invalid verification token data");
      }

      const user = await prisma.user.findUnique({
        where: { email: tokenData.email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.verified) {
        throw new Error("Email is already verified");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
        },
      });

      const jwtToken = generateToken(user);

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
}
