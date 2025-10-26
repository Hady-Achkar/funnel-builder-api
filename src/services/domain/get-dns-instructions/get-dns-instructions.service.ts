import { getPrisma } from "../../../lib/prisma";
import { DomainType } from "../../../generated/prisma-client";
import {
  getAzureFrontDoorCustomDomainDetails,
} from "../../../utils/domain-utils/azure-frontdoor-custom-domain";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  GetDNSInstructionsResponse,
  GetDNSInstructionsRequestSchema,
  GetDNSInstructionsResponseSchema,
} from "../../../types/domain/get-dns-instructions";
import { prepareDNSRecords } from "./utils/prepare-dns-records";
import { calculateProgress } from "./utils/calculate-progress";

export class GetDNSInstructionsService {
  static async getDNSInstructions(
    userId: number,
    requestData: unknown
  ): Promise<GetDNSInstructionsResponse> {
    try {
      const validatedData = GetDNSInstructionsRequestSchema.parse(requestData);
      const { id } = validatedData;

      const domainRecord = await getPrisma().domain.findUnique({
        where: { id },
      });

      if (!domainRecord) {
        throw new NotFoundError("Domain not found");
      }

      await PermissionManager.requirePermission({
        userId,
        workspaceId: domainRecord.workspaceId,
        action: PermissionAction.MANAGE_DOMAIN,
      });

      // For subdomains (*.digitalsite.io), no DNS setup required
      if (domainRecord.type === DomainType.SUBDOMAIN) {
        const response: GetDNSInstructionsResponse = {
          domain: {
            id: domainRecord.id,
            hostname: domainRecord.hostname,
            type: domainRecord.type,
            status: domainRecord.status,
            sslStatus: domainRecord.sslStatus,
            isVerified: true,
            isActive: true,
            createdAt: domainRecord.createdAt,
          },
          dnsRecords: [],
          instructions: "This subdomain is automatically configured. No DNS setup required!",
          totalRecords: 0,
          completedRecords: 0,
          progress: 100,
        };

        return GetDNSInstructionsResponseSchema.parse(response);
      }

      // For custom domains, get latest Azure validation status
      let currentAzureStatus = null;
      if (domainRecord.azureCustomDomainName) {
        try {
          currentAzureStatus = await getAzureFrontDoorCustomDomainDetails(
            domainRecord.azureCustomDomainName
          );
        } catch (error) {
          console.error("[Get DNS Instructions] Failed to get Azure status:", error);
          // Continue with stored data if Azure call fails
        }
      }

      const dnsRecords = prepareDNSRecords(
        domainRecord,
        currentAzureStatus
      );

      const { totalRecords, completedRecords, progress } = calculateProgress(
        domainRecord,
        dnsRecords
      );

      const response: GetDNSInstructionsResponse = {
        domain: {
          id: domainRecord.id,
          hostname: domainRecord.hostname,
          type: domainRecord.type,
          status: domainRecord.status,
          sslStatus: domainRecord.sslStatus,
          isVerified: domainRecord.status !== "PENDING",
          isActive: domainRecord.status === "ACTIVE",
          createdAt: domainRecord.createdAt,
        },
        dnsRecords,
        instructions:
          "Add these DNS records at your domain registrar (GoDaddy, Namecheap, CloudFlare, etc.). DNS changes can take up to 48 hours to propagate, but usually complete within 5-10 minutes.",
        totalRecords,
        completedRecords,
        progress,
      };

      return GetDNSInstructionsResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          error.issues[0]?.message || "Invalid request data"
        );
      }
      throw error;
    }
  }
}
