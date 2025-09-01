import { getPrisma } from "../../../lib/prisma";
import { getCloudFlareAPIHelper } from "../../shared/helpers";
import { getCustomHostnameDetails } from "../../shared/helpers";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  VerifyDomainResponse,
  VerifyDomainRequestSchema,
  VerifyDomainResponseSchema,
  CloudFlareHostnameStatus,
  CloudFlareSslStatus
} from "../types";
import {
  determineVerificationStatus,
  getStatusUpdateData,
  VerificationStatusResult,
  validateVerifyAccess,
} from "../helpers";

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

      await validateVerifyAccess(userId, domainRecord.workspaceId);

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

      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();
      const cfHostname = await getCustomHostnameDetails(customHostnameId, config.cfZoneId);

      const { status, ssl } = cfHostname;
      const hostnameStatus = status as CloudFlareHostnameStatus;
      const sslStatus = ssl?.status as CloudFlareSslStatus;

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

      return VerifyDomainResponseSchema.parse(response);
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