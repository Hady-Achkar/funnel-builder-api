import { getPrisma } from "../../../lib/prisma";
import { getCloudFlareAPIHelper } from "../../../helpers/domain/shared";
import { getCustomHostnameDetails } from "../../../helpers/domain/shared";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  GetDNSInstructionsResponse,
  GetDNSInstructionsRequestSchema,
  GetDNSInstructionsResponseSchema,
} from "../../../types/domain/get-dns-instructions";
import {
  validateDNSInstructionsAccess,
  prepareDNSRecords,
  calculateProgress,
} from "../../../helpers/domain/get-dns-instructions";

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

      await validateDNSInstructionsAccess(userId, domainRecord.workspaceId);

      let currentSslValidationRecords = null;
      if (domainRecord.cloudflareHostnameId) {
        try {
          const cloudflareHelper = getCloudFlareAPIHelper();
          const config = cloudflareHelper.getConfig();
          const cfHostname = await getCustomHostnameDetails(
            domainRecord.cloudflareHostnameId,
            config.cfZoneId
          );

          if (cfHostname.ssl?.validation_records) {
            currentSslValidationRecords = cfHostname.ssl.validation_records;
          }
        } catch (error) {
          return error;
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
