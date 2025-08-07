import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma-client";

// Allow prisma client to be injected for testing
let prisma: PrismaClient | null = null;

// Function to get Prisma client (lazy initialization)
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    // Only create default client if we're not in test environment
    if (process.env.NODE_ENV !== "test") {
      prisma = new PrismaClient();
    } else {
      throw new Error(
        "PrismaClient not set for test environment. Call setPrismaClient() first."
      );
    }
  }
  return prisma;
};

// Function to set Prisma client for testing
export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export interface RegisterUserData {
  email: string;
  name?: string;
  password: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export class AuthService {
  static async register(userData: RegisterUserData): Promise<AuthResponse> {
    const { email, name, password } = userData;

    // Check if user already exists
    const existingUser = await getPrisma().user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await getPrisma().user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const token = this.generateToken(user.id);

    return {
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async login(userData: LoginUserData): Promise<AuthResponse> {
    const { email, password } = userData;

    const user = await getPrisma().user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user.id);

    return {
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async forgotPassword(
    data: ForgotPasswordData
  ): Promise<{ message: string }> {
    const { email } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetTokenExpiry,
      },
    });

    // TODO: Send email with reset link
    // In a real application, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  static async resetPassword(
    data: ResetPasswordData
  ): Promise<{ message: string }> {
    const { token, newPassword } = data;

    const user = await prisma.user.findUnique({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: "Password has been reset successfully" };
  }

  private static generateToken(userId: number): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    return jwt.sign({ userId }, jwtSecret, { expiresIn: "24h" });
  }
}
