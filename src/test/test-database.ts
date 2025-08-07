import { PrismaClient } from "../generated/prisma-client";
import { execSync } from "child_process";
import path from "path";

interface TestDatabaseConfig {
  connectionUrl?: string;
  enableLogging?: boolean;
  migrationPath?: string;
}

export class TestDatabase {
  private prisma: PrismaClient;
  private databaseUrl: string;
  private isCI: boolean;

  constructor(config: TestDatabaseConfig = {}) {
    this.isCI = process.env.CI === "true";
    
    // Use CI database URL or local test database
    this.databaseUrl = config.connectionUrl || 
      process.env.DATABASE_URL || 
      (this.isCI 
        ? "postgresql://postgres:postgres@localhost:5432/funnel_builder_test"
        : "postgresql://hadi@localhost:5432/funnel_builder_test");
    
    process.env.DATABASE_URL = this.databaseUrl;
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
      log: config.enableLogging ? ["query", "error", "warn"] : ["error"],
    });
  }

  async setup(): Promise<void> {
    try {
      // Ensure database exists (for local development)
      if (!this.isCI) {
        await this.ensureDatabaseExists();
      }
      
      // Run migrations
      await this.runMigrations();
      
      // Connect to database
      await this.prisma.$connect();
      
      // Clean database before tests
      await this.clean();
    } catch (error) {
      console.error("Failed to setup test database:", error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    try {
      await this.clean();
      await this.prisma.$disconnect();
    } catch (error) {
      console.error("Failed to teardown test database:", error);
      throw error;
    }
  }

  async clean(): Promise<void> {
    // Try non-transactional cleanup directly to avoid deadlocks
    try {
      // Delete in correct order due to foreign key constraints
      await this.prisma.session.deleteMany().catch(() => {});
      await this.prisma.funnelDomain.deleteMany().catch(() => {});
      await this.prisma.templatePages.deleteMany().catch(() => {});
      await this.prisma.templateImage.deleteMany().catch(() => {});
      await this.prisma.template.deleteMany().catch(() => {});
      await this.prisma.templateCategory.deleteMany().catch(() => {});
      await this.prisma.page.deleteMany().catch(() => {});
      await this.prisma.domain.deleteMany().catch(() => {});
      await this.prisma.funnel.deleteMany().catch(() => {});
      await this.prisma.theme.deleteMany().catch(() => {});
      await this.prisma.user.deleteMany().catch(() => {});
    } catch (error: any) {
      // Silently ignore cleanup errors to avoid test failures
      if (process.env.DEBUG_TESTS) {
        console.warn("Cleanup error (ignored):", error.message);
      }
    }
  }

  private async ensureDatabaseExists(): Promise<void> {
    const dbName = "funnel_builder_test";
    const url = new URL(this.databaseUrl);
    const baseUrl = `${url.protocol}//${url.username}${url.password ? `:${url.password}` : ""}@${url.host}/postgres`;
    
    try {
      // Check if database exists
      const checkDb = new PrismaClient({
        datasources: {
          db: {
            url: baseUrl,
          },
        },
      });
      
      const result = await checkDb.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM pg_database WHERE datname = ${dbName}
        ) as exists
      `;
      
      if (!result[0]?.exists) {
        // Create database if it doesn't exist
        await checkDb.$executeRawUnsafe(`CREATE DATABASE ${dbName}`);
        console.log(`Created test database: ${dbName}`);
      }
      
      await checkDb.$disconnect();
    } catch (error) {
      console.warn("Could not ensure database exists:", error);
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      const prismaBinary = path.join(
        process.cwd(),
        "node_modules",
        ".bin",
        "prisma"
      );
      
      // Reset database and apply migrations
      if (this.isCI) {
        // In CI, just deploy migrations
        execSync(`${prismaBinary} migrate deploy --skip-seed`, {
          env: {
            ...process.env,
            DATABASE_URL: this.databaseUrl,
          },
          stdio: "pipe",
        });
      } else {
        // In local development, reset and apply migrations
        execSync(`${prismaBinary} migrate reset --force --skip-seed`, {
          env: {
            ...process.env,
            DATABASE_URL: this.databaseUrl,
          },
          stdio: "pipe",
        });
      }
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  // Helper for running tests in a transaction (rolled back after test)
  async withTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    let result: T;
    
    try {
      await this.prisma.$transaction(async (tx) => {
        result = await fn(tx as PrismaClient);
        // Force rollback by throwing an error
        throw new Error("ROLLBACK");
      });
    } catch (error: any) {
      if (error.message === "ROLLBACK") {
        return result!;
      }
      throw error;
    }
    
    return result!;
  }
}

// Singleton instance for shared test database
let testDatabase: TestDatabase | null = null;

export function getTestDatabase(): TestDatabase {
  if (!testDatabase) {
    testDatabase = new TestDatabase();
  }
  return testDatabase;
}

export function resetTestDatabase(): void {
  testDatabase = null;
}