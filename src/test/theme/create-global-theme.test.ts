import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient, ThemeType, BorderRadius } from "../../generated/prisma-client";
import { createGlobalThemeController } from "../../controllers/theme/create-global";
import { AuthRequest } from "../../middleware/auth";
import { Response, NextFunction } from "express";

/**
 * Integration tests for Create Global Theme Controller
 * Tests the complete flow with real test database
 * Following ARCHITECTURE.md patterns
 *
 * Key assertions in EVERY test:
 * - type MUST BE GLOBAL (never CUSTOM)
 * - funnelId MUST BE null (never has value)
 */
describe("CreateGlobalThemeController - Integration Tests", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let adminUserId: number;
  let nonAdminUserId: number;
  const testTimestamp = Date.now();
  const adminEmail = `admin-${testTimestamp}@example.com`;
  const nonAdminEmail = `nonadmin-${testTimestamp}@example.com`;

  const createdThemeIds: number[] = [];

  const validThemeData = {
    name: "Dark Theme",
    backgroundColor: "#0e1e12",
    textColor: "#d4ecd0",
    buttonColor: "#387e3d",
    buttonTextColor: "#e8f5e9",
    borderColor: "#214228",
    optionColor: "#16331b",
    fontFamily: "Inter, sans-serif",
    borderRadius: "SOFT" as const,
  };

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running create global theme tests against database: ${dbName}\n`);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: `admin${testTimestamp}`,
        firstName: "Admin",
        lastName: "User",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
        isAdmin: true,
      },
    });
    adminUserId = admin.id;

    // Create non-admin user
    const nonAdmin = await prisma.user.create({
      data: {
        email: nonAdminEmail,
        username: `nonadmin${testTimestamp}`,
        firstName: "NonAdmin",
        lastName: "User",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
        isAdmin: false,
      },
    });
    nonAdminUserId = nonAdmin.id;
  });

  afterEach(async () => {
    // Clean up created themes after each test
    if (createdThemeIds.length > 0) {
      await prisma.theme.deleteMany({
        where: {
          id: { in: createdThemeIds },
        },
      });
      createdThemeIds.length = 0;
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, nonAdminUserId] },
      },
    });

    await prisma.$disconnect();
  });

  // Helper to create mock request/response
  const createMockContext = (userId: number | undefined, body: any) => {
    const mockReq = {
      userId,
      body,
    } as AuthRequest;

    const mockRes = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
      statusCode: 200,
      jsonData: null,
    } as unknown as Response;

    const mockNext: NextFunction = (err?: any) => {
      if (err) throw err;
    };

    return { mockReq, mockRes, mockNext };
  };

  describe("Authentication", () => {
    it("should reject request without userId", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(undefined, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect((mockRes as any).jsonData.message).toContain("Unauthorized");
    });

    it("should reject request with userId = 0", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(0, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(401);
      expect((mockRes as any).jsonData.message).toContain("Unauthorized");
    });

    it("should reject if user does not exist", async () => {
      const nonExistentUserId = 999999;
      const { mockReq, mockRes, mockNext } = createMockContext(nonExistentUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(404);
      expect((mockRes as any).jsonData.message).toContain("User not found");
    });
  });

  describe("Authorization - Admin Only", () => {
    it("should reject non-admin users (isAdmin = false)", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(nonAdminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(403);
      expect((mockRes as any).jsonData.message).toContain("administrators");
    });

    it("should allow admin users (isAdmin = true)", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(201);
      expect((mockRes as any).jsonData).toHaveProperty("id");

      // Track for cleanup
      createdThemeIds.push((mockRes as any).jsonData.id);
    });

    it("should verify admin status before creation", async () => {
      // Verify theme doesn't exist before request
      const themesBefore = await prisma.theme.findMany({
        where: { type: ThemeType.GLOBAL },
      });
      const countBefore = themesBefore.length;

      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);
      await createGlobalThemeController(mockReq, mockRes, mockNext);

      // Verify theme was created
      const themesAfter = await prisma.theme.findMany({
        where: { type: ThemeType.GLOBAL },
      });
      expect(themesAfter.length).toBe(countBefore + 1);

      createdThemeIds.push((mockRes as any).jsonData.id);
    });
  });

  describe("Theme Type Validation - MUST BE GLOBAL", () => {
    it("should create theme with type = GLOBAL (NEVER CUSTOM)", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.type).toBe(ThemeType.GLOBAL);
      expect(result.type).toBe("GLOBAL");
      expect(result.type).not.toBe(ThemeType.CUSTOM);
      expect(result.type).not.toBe("CUSTOM");

      createdThemeIds.push(result.id);
    });

    it("should create theme with funnelId = null (ALWAYS null)", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.funnelId).toBeNull();
      expect(result.funnelId).not.toBe(0);

      createdThemeIds.push(result.id);
    });

    it("should verify type in database is GLOBAL", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const themeId = (mockRes as any).jsonData.id;
      const themeInDb = await prisma.theme.findUnique({ where: { id: themeId } });

      expect(themeInDb).not.toBeNull();
      expect(themeInDb!.type).toBe(ThemeType.GLOBAL);

      createdThemeIds.push(themeId);
    });

    it("should verify funnelId in database is null", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const themeId = (mockRes as any).jsonData.id;
      const themeInDb = await prisma.theme.findUnique({ where: { id: themeId } });

      expect(themeInDb).not.toBeNull();
      expect(themeInDb!.funnelId).toBeNull();

      createdThemeIds.push(themeId);
    });

    it("should never allow type = CUSTOM", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      const themeInDb = await prisma.theme.findUnique({ where: { id: result.id } });

      expect(themeInDb!.type).not.toBe(ThemeType.CUSTOM);

      createdThemeIds.push(result.id);
    });
  });

  describe("Field Validation - Name", () => {
    it("should reject empty name", async () => {
      const invalidData = { ...validThemeData, name: "" };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Theme name cannot be empty");
    });

    it("should reject name > 100 characters", async () => {
      const longName = "a".repeat(101);
      const invalidData = { ...validThemeData, name: longName };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Theme name must be less than 100 characters");
    });

    it("should accept name at maximum length (100 chars)", async () => {
      const maxName = "a".repeat(100);
      const data = { ...validThemeData, name: maxName };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, data);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.name).toBe(maxName);
      expect(result.name.length).toBe(100);

      createdThemeIds.push(result.id);
    });
  });

  describe("Field Validation - Colors", () => {
    it("should reject invalid backgroundColor hex", async () => {
      const invalidData = { ...validThemeData, backgroundColor: "invalid" };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Background color must be a valid hex color");
    });

    it("should reject invalid textColor hex", async () => {
      const invalidData = { ...validThemeData, textColor: "#zzz" };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Text color must be a valid hex color");
    });

    it("should reject invalid buttonColor hex", async () => {
      const invalidData = { ...validThemeData, buttonColor: "red" };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Button color must be a valid hex color");
    });

    it("should accept valid hex colors for all fields", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.backgroundColor).toBe("#0e1e12");
      expect(result.textColor).toBe("#d4ecd0");
      expect(result.buttonColor).toBe("#387e3d");
      expect(result.buttonTextColor).toBe("#e8f5e9");
      expect(result.borderColor).toBe("#214228");
      expect(result.optionColor).toBe("#16331b");

      createdThemeIds.push(result.id);
    });
  });

  describe("Field Validation - FontFamily", () => {
    it("should reject empty fontFamily", async () => {
      const invalidData = { ...validThemeData, fontFamily: "" };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Font family cannot be empty");
    });

    it("should reject fontFamily > 100 characters", async () => {
      const longFont = "a".repeat(101);
      const invalidData = { ...validThemeData, fontFamily: longFont };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Font family must be less than 100 characters");
    });

    it("should accept valid fontFamily", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.fontFamily).toBe("Inter, sans-serif");

      createdThemeIds.push(result.id);
    });
  });

  describe("Field Validation - BorderRadius", () => {
    it("should reject invalid borderRadius enum", async () => {
      const invalidData = { ...validThemeData, borderRadius: "INVALID" as any };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, invalidData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(400);
      expect((mockRes as any).jsonData.message).toContain("Border radius must be NONE, SOFT, or ROUNDED");
    });

    it("should accept NONE borderRadius", async () => {
      const data = { ...validThemeData, borderRadius: "NONE" as const };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, data);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.borderRadius).toBe(BorderRadius.NONE);

      createdThemeIds.push(result.id);
    });

    it("should accept SOFT borderRadius", async () => {
      const data = { ...validThemeData, borderRadius: "SOFT" as const };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, data);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.borderRadius).toBe(BorderRadius.SOFT);

      createdThemeIds.push(result.id);
    });

    it("should accept ROUNDED borderRadius", async () => {
      const data = { ...validThemeData, borderRadius: "ROUNDED" as const };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, data);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.borderRadius).toBe(BorderRadius.ROUNDED);

      createdThemeIds.push(result.id);
    });
  });

  describe("Business Logic", () => {
    it("should create theme with all fields", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("backgroundColor");
      expect(result).toHaveProperty("textColor");
      expect(result).toHaveProperty("buttonColor");
      expect(result).toHaveProperty("buttonTextColor");
      expect(result).toHaveProperty("borderColor");
      expect(result).toHaveProperty("optionColor");
      expect(result).toHaveProperty("fontFamily");
      expect(result).toHaveProperty("borderRadius");
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("funnelId");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");

      createdThemeIds.push(result.id);
    });

    it("should generate timestamps", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(new Date(result.createdAt)).toBeInstanceOf(Date);
      expect(new Date(result.updatedAt)).toBeInstanceOf(Date);

      createdThemeIds.push(result.id);
    });

    it("should allow duplicate theme names", async () => {
      const { mockReq: mockReq1, mockRes: mockRes1, mockNext: mockNext1 } = createMockContext(adminUserId, validThemeData);
      const { mockReq: mockReq2, mockRes: mockRes2, mockNext: mockNext2 } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq1, mockRes1, mockNext1);
      await createGlobalThemeController(mockReq2, mockRes2, mockNext2);

      const result1 = (mockRes1 as any).jsonData;
      const result2 = (mockRes2 as any).jsonData;

      expect(result1.name).toBe(result2.name);
      expect(result1.id).not.toBe(result2.id);

      createdThemeIds.push(result1.id, result2.id);
    });

    it("should include success message", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.message).toBe("Global theme created successfully");

      createdThemeIds.push(result.id);
    });
  });

  describe("Response Format", () => {
    it("should return 201 Created status", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(201);

      createdThemeIds.push((mockRes as any).jsonData.id);
    });

    it("should return complete theme object", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe(validThemeData.name);
      expect(result.type).toBe(ThemeType.GLOBAL);
      expect(result.funnelId).toBeNull();

      createdThemeIds.push(result.id);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in name", async () => {
      const specialName = "Theme !@#$%^&*()";
      const data = { ...validThemeData, name: specialName };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, data);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.name).toBe(specialName);

      createdThemeIds.push(result.id);
    });

    it("should handle unicode characters in name", async () => {
      const unicodeName = "テーマ 主题";
      const data = { ...validThemeData, name: unicodeName };
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, data);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const result = (mockRes as any).jsonData;
      expect(result.name).toBe(unicodeName);

      createdThemeIds.push(result.id);
    });

    it("should persist data correctly in database", async () => {
      const { mockReq, mockRes, mockNext } = createMockContext(adminUserId, validThemeData);

      await createGlobalThemeController(mockReq, mockRes, mockNext);

      const themeId = (mockRes as any).jsonData.id;
      const themeInDb = await prisma.theme.findUnique({ where: { id: themeId } });

      expect(themeInDb).not.toBeNull();
      expect(themeInDb!.name).toBe(validThemeData.name);
      expect(themeInDb!.backgroundColor).toBe(validThemeData.backgroundColor);
      expect(themeInDb!.type).toBe(ThemeType.GLOBAL);
      expect(themeInDb!.funnelId).toBeNull();

      createdThemeIds.push(themeId);
    });
  });
});
