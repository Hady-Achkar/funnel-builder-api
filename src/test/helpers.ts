import {
  PrismaClient,
  User,
  Funnel,
  Domain,
  DomainType,
  DomainStatus,
  $Enums,
} from "../generated/prisma-client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { testPrisma } from "./setup";

export interface TestUser {
  id: number;
  email: string;
  name: string | null;
  password: string;
}

export interface TestFunnel {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  themeId?: number;
}

export interface TestDomain {
  id: number;
  hostname: string;
  type: DomainType;
  status: DomainStatus;
  userId: number;
  cloudflareHostnameId?: string | null;
  cloudflareZoneId?: string | null;
  cloudflareRecordId?: string | null;
}

export class TestHelpers {
  static async createTestUser(
    overrides: Partial<TestUser> = {}
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const randomId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    return await testPrisma.user.create({
      data: {
        email: `test${randomId}@example.com`,
        name: "Test User",
        password: hashedPassword,
        ...overrides,
      },
    });
  }

  static async createTestFunnel(
    userId: number,
    overrides: Partial<TestFunnel> = {}
  ): Promise<Funnel> {
    const randomId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Create a test theme first if themeId is not provided
    let themeId = overrides.themeId;
    if (!themeId) {
      const theme = await testPrisma.theme.create({
        data: {
          name: `Test Theme ${randomId}`,
        },
      });
      themeId = theme.id;
    }

    return await testPrisma.funnel.create({
      data: {
        name: `Test Funnel ${randomId}`,
        status: overrides.status || $Enums.FunnelStatus.DRAFT,
        userId: userId,
        themeId: themeId,
        ...overrides,
      },
    });
  }

  static async createTestDomain(
    userId: number,
    overrides: Partial<TestDomain> = {}
  ): Promise<Domain> {
    const randomId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    return await testPrisma.domain.create({
      data: {
        hostname: `test${randomId}.example.com`,
        type: DomainType.CUSTOM_DOMAIN,
        status: DomainStatus.PENDING,
        userId,
        ...overrides,
      },
    });
  }

  static generateJWTToken(userId: number): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET || "test-secret", {
      expiresIn: "24h",
    });
  }

  static async cleanupUser(userId: number): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await testPrisma.funnelDomain.deleteMany({ where: { funnel: { userId } } });
    await testPrisma.page.deleteMany({ where: { funnel: { userId } } });
    await testPrisma.domain.deleteMany({ where: { userId } });

    // Get funnel IDs to clean up associated themes
    const funnels = await testPrisma.funnel.findMany({
      where: { userId },
      select: { id: true, themeId: true },
    });

    await testPrisma.funnel.deleteMany({ where: { userId } });

    // Clean up themes that were created for these funnels
    const themeIds = funnels
      .map((f) => f.themeId)
      .filter((id): id is number => id !== null);
    if (themeIds.length > 0) {
      await testPrisma.theme.deleteMany({ where: { id: { in: themeIds } } });
    }

    await testPrisma.user.delete({ where: { id: userId } });
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
