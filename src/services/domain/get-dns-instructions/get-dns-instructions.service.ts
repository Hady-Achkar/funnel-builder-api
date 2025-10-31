import { getPrisma } from "../../../lib/prisma";
import { getCustomHostnameDetails } from "../../../../api/cloudflare";
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

      let currentSslValidationRecords = null;
      if (domainRecord.cloudflareHostnameId) {
        try {
          // Read Cloudflare configuration from environment variables
          const config = {
            apiToken: process.env.CF_API_TOKEN!,
            accountId: process.env.CF_ACCOUNT_ID,
          };
          // Use custom hostname zone (digitalsite.app) for custom domains
          const zoneId = process.env.CF_ZONE_ID!;

          const cfHostname = await getCustomHostnameDetails(
            domainRecord.cloudflareHostnameId,
            zoneId,
            config
          );

          if (cfHostname.ssl?.validation_records) {
            currentSslValidationRecords = cfHostname.ssl.validation_records;
          }
        } catch (error: any) {
          console.error('[DNS Instructions] Failed to fetch SSL validation records:', error.message);
          // Continue without SSL validation records - they might not be ready yet
        }
      }

      const dnsRecords = prepareDNSRecords(
        domainRecord,
        currentSslValidationRecords
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
          "Add these DNS records at your domain registrar (GoDaddy, Namecheap, CloudFlare, etc.). DNS changes can take up to 48 hours to propagate.",
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
