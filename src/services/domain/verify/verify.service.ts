import { getPrisma } from "../../../lib/prisma";
import { getCustomHostnameDetails } from "../../../../api/cloudflare";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  VerifyDomainResponse,
  VerifyDomainRequestSchema,
  VerifyDomainResponseSchema,
  CloudFlareHostnameStatus,
  CloudFlareSslStatus
} from "../../../types/domain/verify";
import {
  determineVerificationStatus,
  getStatusUpdateData,
  VerificationStatusResult,
} from "./utils/verification-status";

export class VerifyDomainService {
  static async verify(
    userId: number,
    requestData: unknown
  ): Promise<VerifyDomainResponse> {
    try {
      const validatedData = VerifyDomainRequestSchema.parse(requestData);
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
        action: PermissionAction.VERIFY_DOMAIN,
      });

      if (domainRecord.status === 'ACTIVE') {
        const response: VerifyDomainResponse = {
          message: 'Domain is already active.',
          domain: {
            id: domainRecord.id,
            hostname: domainRecord.hostname,
            type: domainRecord.type,
            status: domainRecord.status,
            sslStatus: domainRecord.sslStatus,
            isVerified: true,
            isActive: true,
            verificationToken: domainRecord.verificationToken,
            customHostnameId: domainRecord.cloudflareHostnameId,
            overallStatus: domainRecord.status,
            createdAt: domainRecord.createdAt,
            updatedAt: domainRecord.updatedAt,
          },
          isFullyActive: true,
          nextStep: null,
        };

        return VerifyDomainResponseSchema.parse(response);
      }

      const customHostnameId = domainRecord.cloudflareHostnameId;
      if (!customHostnameId) {
        throw new BadRequestError('Domain is not configured correctly');
      }

      // Read Cloudflare configuration from environment variables
      const config = {
        apiToken: process.env.CF_API_TOKEN!,
        accountId: process.env.CF_ACCOUNT_ID,
      };
      // Use custom hostname zone (digitalsite.app) for custom domains
      const zoneId = process.env.CF_ZONE_ID!;
      const cfHostname = await getCustomHostnameDetails(customHostnameId, zoneId, config);

      console.log('[Verify Domain] Cloudflare response:', JSON.stringify(cfHostname, null, 2));

      const { status, ssl } = cfHostname;
      const hostnameStatus = status as CloudFlareHostnameStatus;
      const sslStatus = ssl?.status as CloudFlareSslStatus;

      console.log('[Verify Domain] SSL validation_records type:', Array.isArray(ssl?.validation_records) ? 'array' : typeof ssl?.validation_records);
      console.log('[Verify Domain] SSL validation_records:', JSON.stringify(ssl?.validation_records, null, 2));

      const verificationResult: VerificationStatusResult = determineVerificationStatus(
        hostnameStatus,
        sslStatus,
        ssl?.validation_records
      );

      const updateData = getStatusUpdateData(hostnameStatus, sslStatus, verificationResult);

      const updatedDomain = await getPrisma().domain.update({
        where: { id: domainRecord.id },
        data: updateData,
      });

      const response: VerifyDomainResponse = {
        message: verificationResult.message,
        domain: {
          id: updatedDomain.id,
          hostname: updatedDomain.hostname,
          type: updatedDomain.type,
          status: updatedDomain.status,
          sslStatus: updatedDomain.sslStatus,
          isVerified: verificationResult.shouldUpdateVerified || updatedDomain.status !== 'PENDING',
          isActive: verificationResult.shouldUpdateActive || updatedDomain.status === 'ACTIVE',
          verificationToken: updatedDomain.verificationToken,
          customHostnameId: updatedDomain.cloudflareHostnameId,
          overallStatus: hostnameStatus,
          createdAt: updatedDomain.createdAt,
          updatedAt: updatedDomain.updatedAt,
        },
        isFullyActive: verificationResult.isFullyActive,
        nextStep: verificationResult.nextStep,
      };

      console.log('[Verify Domain] Response before Zod validation:', JSON.stringify(response, null, 2));
      console.log('[Verify Domain] nextStep type:', Array.isArray(response.nextStep) ? 'array' : typeof response.nextStep);

      return VerifyDomainResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        console.error('[Verify Domain] Zod validation error:', JSON.stringify(error.issues, null, 2));
        throw new BadRequestError(
          error.issues[0]?.message || "Invalid request data"
        );
      }
      throw error;
    }
  }
}