import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  ConnectFunnelDomainRequestSchema,
  ConnectFunnelDomainResponse,
  ConnectFunnelDomainResponseSchema,
} from "../../../types/domain-funnel/connect";
import {
  validateConnectFunnelDomainAccess,
  validateFunnelExists,
  validateDomainExists,
  validateSameWorkspace,
} from "../../../helpers/domain-funnel/connect";

export class ConnectFunnelDomainService {
  static async connect(
    userId: number,
    requestData: unknown
  ): Promise<ConnectFunnelDomainResponse> {
    try {
      const validatedData = ConnectFunnelDomainRequestSchema.parse(requestData);
      const { funnelId, domainId } = validatedData;

      const funnel = await validateFunnelExists(funnelId);
      const domain = await validateDomainExists(domainId);
      
      validateSameWorkspace(funnel, domain);

      await validateConnectFunnelDomainAccess(userId, funnel.workspaceId);

      const prisma = getPrisma();

      await prisma.$transaction(async (tx) => {
        const existingExactConnection = await tx.funnelDomain.findFirst({
          where: { funnelId, domainId },
        });

        if (existingExactConnection) {
          throw new BadRequestError(
            "This funnel is already connected to this domain"
          );
        }

        await tx.funnelDomain.deleteMany({
          where: { funnelId },
        });

        await tx.funnelDomain.create({
          data: {
            funnelId,
            domainId,
            isActive: true,
          },
        });
      });

      const response: ConnectFunnelDomainResponse = {
        message: "Funnel connected successfully",
      };

      return ConnectFunnelDomainResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}