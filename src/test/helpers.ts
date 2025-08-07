import {
  User,
  Funnel,
  Domain,
  DomainType,
  DomainStatus,
  FunnelStatus,
  Theme,
  Page,
} from "../generated/prisma-client";
import jwt from "jsonwebtoken";
import { testPrisma, testFactory } from "./setup";

// Re-export test factory for backward compatibility
export { testFactory } from "./setup";

export class TestHelpers {
  // Delegate to test factory for consistency
  static async createTestUser(
    overrides: Partial<{
      email?: string;
      name?: string;
      password?: string;
      isAdmin?: boolean;
      maximumFunnels?: number;
    }> = {}
  ): Promise<User> {
    return testFactory.createUser(overrides);
  }

  static async createTestFunnel(
    userId: number,
    overrides: Partial<{
      name?: string;
      status?: FunnelStatus;
      themeId?: number;
      templateId?: number;
    }> = {}
  ): Promise<Funnel> {
    return testFactory.createFunnel(userId, overrides);
  }

  static async createTestDomain(
    userId: number,
    overrides: Partial<{
      hostname?: string;
      type?: DomainType;
      status?: DomainStatus;
      cloudflareHostnameId?: string;
      cloudflareZoneId?: string;
      cloudflareRecordId?: string;
    }> = {}
  ): Promise<Domain> {
    return testFactory.createDomain(userId, overrides);
  }
  
  // New helper methods using test factory
  static async createTestTheme(
    overrides: Parameters<typeof testFactory.createTheme>[0] = {}
  ): Promise<Theme> {
    return testFactory.createTheme(overrides);
  }
  
  static async createTestPage(
    funnelId: number,
    overrides: Parameters<typeof testFactory.createPage>[1] = {}
  ): Promise<Page> {
    return testFactory.createPage(funnelId, overrides);
  }

  static generateJWTToken(userId: number): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET || "test-secret", {
      expiresIn: "24h",
    });
  }

  static async cleanupUser(userId: number): Promise<void> {
    return testFactory.cleanupUser(userId);
  }
  
  // New transaction helper for isolated test execution
  static async runInTransaction<T>(
    fn: (prisma: typeof testPrisma) => Promise<T>
  ): Promise<T> {
    try {
      return await testPrisma.$transaction(async (tx) => {
        await fn(tx as typeof testPrisma);
        // Force rollback by throwing an error
        throw new Error("ROLLBACK_TEST_TRANSACTION");
      });
    } catch (error: any) {
      // If the error is our rollback marker, suppress it
      if (error.message === "ROLLBACK_TEST_TRANSACTION") {
        return undefined as any;
      }
      // Otherwise, re-throw the actual error
      throw error;
    }
  }

  static mockCloudFlareResponse(success = true, result: any = {}) {
    return {
      success,
      errors: success ? [] : [{ code: 1000, message: "Test error" }],
      messages: [],
      result: success ? result : null,
    };
  }

  static mockCloudFlareHostname(
    id = "test-hostname-id",
    hostname = "test.example.com"
  ) {
    return {
      id,
      hostname,
      status: "active",
      ssl: {
        status: "active",
        method: "http",
        type: "dv",
        settings: {
          http2: "on",
          min_tls_version: "1.2",
        },
      },
      ownership_verification: {
        type: "txt",
        name: `_cf-custom-hostname.${hostname}`,
        value: "test-verification-value",
      },
    };
  }

  static mockCloudFlareDNSRecord(
    id = "test-record-id",
    name = "test",
    content = "1.2.3.4"
  ) {
    return {
      id,
      type: "A",
      name,
      content,
      ttl: 3600,
      proxied: true,
    };
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { testPrisma };
