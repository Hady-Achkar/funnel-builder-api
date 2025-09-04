import {
  DomainType,
  DomainStatus,
  SslStatus,
  $Enums,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { getCloudFlareAPIHelper, validateWorkspaceAccess } from "../../../helpers/domain/shared";
import { checkWorkspaceSubdomainLimits, createARecord } from "../../../helpers/domain/create-subdomain";
import {
  CreateSubdomainResponse,
  createSubdomainRequest,
  createSubdomainResponse,
} from "../../../types/domain/create-subdomain";
import { DomainConfig } from "../../../types/domain/shared/domain.types";
import { BadRequestError, BadGatewayError } from "../../../errors/http-errors";
import { ZodError } from "zod";

export class CreateSubdomainService {
  static async create(
    userId: number,
    requestData: unknown,
    domainConfig?: DomainConfig
  ): Promise<CreateSubdomainResponse> {
    try {
      const validatedData = createSubdomainRequest.parse(requestData);
      const { subdomain, workspaceId } = validatedData;

      await validateWorkspaceAccess(userId, workspaceId, [
        $Enums.WorkspacePermission.CREATE_DOMAINS,
      ]);
      await checkWorkspaceSubdomainLimits(workspaceId);

      // Use provided domain config or default to mydigitalsite.io
      const baseDomain = domainConfig?.baseDomain || "mydigitalsite.io";
      const fullHostname = `${subdomain}.${baseDomain}`;

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: fullHostname },
      });

      if (existingDomain) {
        throw new BadRequestError(
          "This subdomain is already taken. Please choose another one."
        );
      }

      const workspace = { id: workspaceId };

      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();

      // Use provided config or default values
      const zoneId = domainConfig?.zoneId || config.cfZoneId;
      const targetIp = domainConfig?.targetIp || "74.234.194.84";

      let aRecord: any;
      try {
        aRecord = await createARecord(
          subdomain,
          zoneId,
          targetIp
        );
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`[Subdomain Create] CloudFlare API Error: ${errMsg}`, {
          stack: error.stack,
        });
        throw new BadGatewayError(
          "External service error. Please try again later."
        );
      }

      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: fullHostname,
          type: DomainType.SUBDOMAIN,
          status: DomainStatus.ACTIVE,
          sslStatus: SslStatus.ACTIVE,
          workspaceId: workspace.id,
          createdBy: userId,
          cloudflareRecordId: aRecord.id,
          cloudflareZoneId: zoneId,
          lastVerifiedAt: new Date(),
        },
      });

      const response: CreateSubdomainResponse = {
        message: "Subdomain created and activated successfully.",
        domain: {
          id: newDomain.id,
          hostname: newDomain.hostname,
          type: newDomain.type,
          status: newDomain.status,
          sslStatus: newDomain.sslStatus,
          isVerified: newDomain.status !== DomainStatus.PENDING,
          isActive: newDomain.status === DomainStatus.ACTIVE,
          cloudflareRecordId: newDomain.cloudflareRecordId,
          createdAt: newDomain.createdAt,
          updatedAt: newDomain.updatedAt,
        },
      };

      return createSubdomainResponse.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
