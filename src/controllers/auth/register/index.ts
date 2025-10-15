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
import { RegistrationSource } from "../../../generated/prisma-client";
import { WorkspaceMemberAllocations } from "../../../utils/allocations/workspace-member-allocations";

export class RegisterController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = registerRequest.parse(req.body);

      const prisma = getPrisma();

      // Determine registration source and validate tokens
      let registrationSource: RegistrationSource = RegistrationSource.DIRECT;

      // Validate affiliate token if provided (but don't link it yet - that happens after payment)
      if (validatedData.affiliateToken) {
        const affiliateLink = await prisma.affiliateLink.findUnique({
          where: { token: validatedData.affiliateToken },
          select: { id: true, token: true },
        });

        if (!affiliateLink) {
          return next(
            new BadRequestError(
              "The affiliate link you used is invalid or no longer active. Please check the link and try again."
            )
          );
        }

        // Only set registration source, don't link affiliate yet (happens after payment)
        registrationSource = RegistrationSource.AFFILIATE;
      }

      // Validate workspace invitation token if provided
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

        // Check invitation type
        const isDirectLink = decodedToken.type === "workspace_direct_link";

        // For email invitations, validate email match
        if (!isDirectLink && decodedToken.email) {
          if (!validateTokenEmail(decodedToken.email, validatedData.email)) {
            return next(
              new BadRequestError(
                'This invitation was sent to a different email address. Please register with the email address that received the invitation.'
              )
            );
          }

          // For email invitations, check for pending member
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

        // Verify the workspace exists and check member limits (applies to both direct links and email invitations)
        const workspace = await prisma.workspace.findUnique({
          where: { id: decodedToken.workspaceId },
          select: {
            id: true,
            planType: true,
            _count: {
              select: {
                members: {
                  where: {
                    status: "ACTIVE"
                  }
                }
              }
            }
          },
        });

        if (!workspace) {
          return next(
            new BadRequestError(
              "The workspace associated with this invitation no longer exists."
            )
          );
        }

        // Check if workspace has reached member limit
        // For direct links, we need to check the limit before accepting
        // For email invitations, the pending member was already counted when invited
        if (isDirectLink) {
          // Get workspace add-ons to check total allocation
          const addOns = await prisma.addOn.findMany({
            where: {
              workspaceId: workspace.id,
              status: "ACTIVE",
            },
            select: {
              type: true,
              quantity: true,
              status: true,
            },
          });

          const currentMemberCount = workspace._count.members;
          const canAddMember = WorkspaceMemberAllocations.canAddMember(
            currentMemberCount,
            {
              workspacePlanType: workspace.planType,
              addOns,
            }
          );

          if (!canAddMember) {
            return next(
              new BadRequestError(
                "This workspace has reached its maximum member limit. Please contact the workspace owner to upgrade or purchase additional member slots."
              )
            );
          }
        }

        // Workspace invitation takes precedence over affiliate
        registrationSource = RegistrationSource.WORKSPACE_INVITE;
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

      const result = await RegisterService.register(
        validatedData,
        registrationSource
      );

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
