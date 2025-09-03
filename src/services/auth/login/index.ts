import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { loginRequest, LoginResponse } from "../../../types/auth/login";

// Internal service response includes token
interface LoginServiceResponse extends LoginResponse {
  token: string;
}

export class LoginService {
  static async login(userData: unknown): Promise<LoginServiceResponse> {
    try {
      const validatedData = loginRequest.parse(userData);
      const { identifier, password } = validatedData;

      const prisma = getPrisma();

      // Check if input is email or username
      const isEmail = identifier.includes("@");
      
      const user = await prisma.user.findUnique({
        where: isEmail ? { email: identifier } : { username: identifier },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          password: true,
          isAdmin: true,
          verified: true,
        },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Check if user email is verified
      if (!user.verified) {
        throw new Error("Please verify your email address before logging in. Check your inbox for a verification link.");
      }

      const token = this.generateToken(user.id);

      return {
        message: "Login successful",
        token, // Keep token for setting cookie in controller
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
        },
      };
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