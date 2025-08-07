import { PrismaClient } from "../generated/prisma-client";
import { execSync } from "child_process";
import { randomBytes } from "crypto";
import path from "path";

export class PrismaTestEnvironment {
  private static instance: PrismaTestEnvironment;
  private prisma: PrismaClient;
  private schemaName: string;
  private databaseUrl: string;
  private originalDatabaseUrl: string;

  private constructor() {
    // Generate unique schema name for test isolation
    this.schemaName = `test_${randomBytes(4).toString("hex")}`;
    this.originalDatabaseUrl = process.env.DATABASE_URL || "";
    
    // Parse and modify DATABASE_URL to use a unique schema
    const url = new URL(this.originalDatabaseUrl);
    url.searchParams.set("schema", this.schemaName);
    this.databaseUrl = url.toString();
    
    // Set the modified URL for Prisma
    process.env.DATABASE_URL = this.databaseUrl;
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
      log: process.env.DEBUG === "true" ? ["query", "error", "warn"] : ["error"],
    });
  }

  static getInstance(): PrismaTestEnvironment {
    if (!PrismaTestEnvironment.instance) {
      PrismaTestEnvironment.instance = new PrismaTestEnvironment();
    }
    return PrismaTestEnvironment.instance;
  }

  async setup(): Promise<void> {
    try {
      // Create schema and run migrations
      await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
      
      // Run migrations for the test schema
      const prismaBinary = path.join(
        process.cwd(),
        "node_modules",
        ".bin",
        "prisma"
      );
      
      execSync(`${prismaBinary} migrate deploy --skip-seed`, {
        env: {
          ...process.env,
          DATABASE_URL: this.databaseUrl,
        },
      });
      
      await this.prisma.$connect();
    } catch (error) {
      console.error("Failed to setup test database:", error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      
      // Drop the test schema
      const adminPrisma = new PrismaClient({
        datasources: {
          db: {
            url: this.originalDatabaseUrl,
          },
        },
      });
      
      await adminPrisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${this.schemaName}" CASCADE`
      );
      await adminPrisma.$disconnect();
      
      // Restore original DATABASE_URL
      process.env.DATABASE_URL = this.originalDatabaseUrl;
    } catch (error) {
      console.error("Failed to teardown test database:", error);
      throw error;
    }
  }

  async clean(): Promise<void> {
    // Clean all tables in the correct order to respect foreign key constraints
    const tables = [
      "sessions",
      "funnel_domains",
      "template_pages",
      "template_images",
      "templates",
      "template_categories",
      "pages",
      "domains",
      "funnels",
      "themes",
      "users",
    ];

    for (const table of tables) {
      await this.prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${this.schemaName}"."${table}" CASCADE`
      );
    }
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  // Transaction helper for isolated test execution
  async executeInTransaction<T>(
    fn: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx as PrismaClient);
    }, {
      maxWait: 5000,
      timeout: 10000,
    });
  }
}

// Export singleton instance getter
export const getTestEnvironment = () => PrismaTestEnvironment.getInstance();