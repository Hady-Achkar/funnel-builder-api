import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  registerRequest,
  RegisterResponse,
} from "../../../types/auth/register";
import { sendVerificationEmail } from "../../../helpers/auth/emails/register";
import { User } from "../../../generated/prisma-client";
import { generateToken } from "../utils";

export class RegisterService {
  static async register(userData: User): Promise<RegisterResponse> {
    try {
      const validatedData = registerRequest.parse(userData);

      const {
        email,
        username,
        firstName,
        lastName,
        password,
        isAdmin,
        plan,
      } = validatedData;

      const prisma = getPrisma();

      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        throw new Error("User with this email already exists");
      }

      const existingUserByUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUserByUsername) {
        throw new Error("Username is already taken");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationToken = generateToken(userData);
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(
        verificationTokenExpiresAt.getHours() + 24
      );

      const user = await prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          password: hashedPassword,
          verified: false,
          verificationToken,
          verificationTokenExpiresAt,
          isAdmin,
          plan,
        },
      });

      try {
        await sendVerificationEmail(email, firstName, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return {
        message:
          "User created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
          plan: user.plan,
          verified: user.verified,
        },
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        throw firstError;
      }
      throw error;
    }
  }
}
