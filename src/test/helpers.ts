import { PrismaClient, User, Funnel, Domain } from '../generated/prisma-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testPrisma } from './setup';

export interface TestUser {
  id: number;
  email: string;
  name: string | null;
  password: string;
}

export interface TestFunnel {
  id: number;
  name: string;
  status: string;
  userId: number;
}

export interface TestDomain {
  id: number;
  hostname: string;
  type: string;
  status: string;
  userId: number;
}

export class TestHelpers {
  static async createTestUser(overrides: Partial<TestUser> = {}): Promise<User> {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return await testPrisma.user.create({
      data: {
        email: `test${randomId}@example.com`,
        name: 'Test User',
        password: hashedPassword,
        ...overrides
      }
    });
  }

  static async createTestFunnel(userId: number, overrides: Partial<TestFunnel> = {}): Promise<Funnel> {
    const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return await testPrisma.funnel.create({
      data: {
        name: `Test Funnel ${randomId}`,
        status: 'draft',
        userId,
        ...overrides
      }
    });
  }

  static async createTestDomain(userId: number, overrides: Partial<TestDomain> = {}): Promise<Domain> {
    const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return await testPrisma.domain.create({
      data: {
        hostname: `test${randomId}.example.com`,
        type: 'CUSTOM_DOMAIN',
        status: 'PENDING',
        userId,
        ...overrides
      }
    });
  }

  static generateJWTToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  }

  static async cleanupUser(userId: number): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await testPrisma.funnelDomain.deleteMany({ where: { funnel: { userId } } });
    await testPrisma.page.deleteMany({ where: { funnel: { userId } } });
    await testPrisma.domain.deleteMany({ where: { userId } });
    await testPrisma.funnel.deleteMany({ where: { userId } });
    await testPrisma.user.delete({ where: { id: userId } });
  }

  static mockCloudFlareResponse(success = true, result: any = {}) {
    return {
      success,
      errors: success ? [] : [{ code: 1000, message: 'Test error' }],
      messages: [],
      result: success ? result : null
    };
  }

  static mockCloudFlareHostname(id = 'test-hostname-id', hostname = 'test.example.com') {
    return {
      id,
      hostname,
      status: 'active',
      ssl: {
        status: 'active',
        method: 'http',
        type: 'dv',
        settings: {
          http2: 'on',
          min_tls_version: '1.2'
        }
      },
      ownership_verification: {
        type: 'txt',
        name: `_cf-custom-hostname.${hostname}`,
        value: 'test-verification-value'
      }
    };
  }

  static mockCloudFlareDNSRecord(id = 'test-record-id', name = 'test', content = '1.2.3.4') {
    return {
      id,
      type: 'A',
      name,
      content,
      ttl: 3600,
      proxied: true
    };
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { testPrisma };