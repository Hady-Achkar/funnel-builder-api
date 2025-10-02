import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { RegisterService } from "../../../services/auth/register";
import { registerRequest } from "../../../types/auth/register";
import {
  decodeInvitationToken,
  validateTokenEmail,
} from "./utils/validate-invitation";
import { BadRequestError, ConflictError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";

export class RegisterController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = registerRequest.parse(req.body);

      const prisma = getPrisma();

      if (validatedData.workspaceInvitationToken) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          return next(
            new BadRequestError(
              "We're experiencing a configuration issue. Please try again later or contact support."
            )
          );
        }

        const decodedToken = decodeInvitationToken(
          validatedData.workspaceInvitationToken,
          jwtSecret
        );
        if (!decodedToken) {
          return next(
            new BadRequestError(
              "The invitation link appears to be invalid or expired. Please request a new invitation from your workspace administrator."
            )
          );
        }

        if (!validateTokenEmail(decodedToken.email, validatedData.email)) {
          return next(
            new BadRequestError(
              'This invitation was sent to a different email address. Please register with the email address that received the invitation.'
            )
          );
        }

        const pendingMember = await prisma.workspaceMember.findFirst({
          where: {
            email: validatedData.email,
            workspaceId: decodedToken.workspaceId,
            status: "PENDING",
          },
          select: {
            email: true,
            workspaceId: true,
            status: true,
          },
        });

        if (!pendingMember) {
          return next(
            new BadRequestError(
              "This invitation has already been used or is no longer valid. Please contact your workspace administrator for a new invitation."
            )
          );
        }
      }

      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { email: true },
      });

      if (existingUserByEmail) {
        return next(
          new ConflictError(
            "An account with this email address already exists. Please sign in or use a different email address."
          )
        );
      }

      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: validatedData.username },
        select: { username: true },
      });

      if (existingUserByUsername) {
        return next(
          new ConflictError(
            `The username '${validatedData.username}' is already taken. Please choose a different username.`
          )
        );
      }

      const result = await RegisterService.register(validatedData);

      res.status(201).json(result);
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
