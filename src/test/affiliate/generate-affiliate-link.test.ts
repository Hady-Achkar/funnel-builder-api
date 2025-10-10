import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { Response } from "express";
import jwt from "jsonwebtoken";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { AuthRequest } from "../../middleware/auth";
import { AffiliateLinkController } from "../../controllers/affiliate/generate-affiliate-link";

/**
 * Integration tests for Generate Affiliate Link Controller
 * Tests the complete flow: Controller -> Service -> Database
 */
describe("AffiliateLinkController.generateLink - Integration Tests", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();
  let testUserId: number;
  let testWorkspaceId: number;
  const testUserEmail = `test-affiliate-${Date.now()}@example.com`;
  const testUsername = `testaffiliate${Date.now()}`;

  // Mock Express request and response
  const mockRequest = (body: any, userId?: number): Partial<AuthRequest> => ({
    body,
    userId,
  });

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = vi.fn();

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running tests against database: ${dbName}\n`);

    // Set required environment variables
    process.env.JWT_SECRET = "test-secret-key-for-affiliate-links";
    process.env.FRONTEND_URL = "https://testsite.com";

    // Create a test user with commission percentage
    const testUser = await prisma.user.create({
      data: {
        email: testUserEmail,
        username: testUsername,
        firstName: "Test",
        lastName: "Affiliate",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
        commissionPercentage: 20, // 20% commission
      },
    });
    testUserId = testUser.id;

    // Create a test workspace owned by the test user
    const testWorkspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace for Affiliate",
        slug: `test-workspace-${Date.now()}`,
        ownerId: testUserId,
        planType: "BUSINESS",
        status: "ACTIVE",
      },
    });
    testWorkspaceId = testWorkspace.id;
  });

  afterAll(async () => {
    // Clean up: Delete test data in correct order
    await prisma.affiliateLink.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.workspace.deleteMany({
      where: { ownerId: testUserId },
    });

    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  beforeEach(async () => {
    // Clean up affiliate links before each test
    await prisma.affiliateLink.deleteMany({
      where: { userId: testUserId },
    });
    vi.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should generate affiliate link successfully with workspace", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "My Premium Workspace Link",
          workspaceId: testWorkspaceId,
          settings: { tracking: "enabled", source: "email" },
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert - Controller should return 201 Created
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();

      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.message).toBe("Affiliate link created successfully");
      expect(responseData.id).toBeTypeOf("number");
      expect(responseData.url).toContain(
        "https://testsite.com/affiliate?affiliate="
      );
      expect(responseData.token).toBeDefined();

      // Verify the affiliate link was created in database
      const createdLink = await prisma.affiliateLink.findUnique({
        where: { id: responseData.id },
        include: { workspace: true, user: true },
      });

      expect(createdLink).toBeDefined();
      expect(createdLink?.name).toBe("My Premium Workspace Link");
      expect(createdLink?.userId).toBe(testUserId);
      expect(createdLink?.workspaceId).toBe(testWorkspaceId);
      expect(createdLink?.itemType).toBe("BUSINESS"); // From workspace planType
      expect(createdLink?.token).toBe(responseData.token);
      expect(createdLink?.settings).toEqual({
        tracking: "enabled",
        source: "email",
      });

      // Verify JWT token payload
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.workspaceId).toBe(testWorkspaceId);
      expect(decoded.name).toBe("My Premium Workspace Link");
      expect(decoded.commissionPercentage).toBe(20); // From user
      expect(decoded.settings).toEqual({
        tracking: "enabled",
        source: "email",
      });
      expect(decoded.affiliateLinkId).toBe(responseData.id);

      // Should not call next (no errors)
      expect(next).not.toHaveBeenCalled();
    });

    it("should use user commission percentage from database", async () => {
      // Arrange
      // Update user commission percentage
      await prisma.user.update({
        where: { id: testUserId },
        data: { commissionPercentage: 25 },
      });

      const req = mockRequest(
        {
          name: "High Commission Link",
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.commissionPercentage).toBe(25);

      // Reset commission percentage for other tests
      await prisma.user.update({
        where: { id: testUserId },
        data: { commissionPercentage: 20 },
      });
    });

    it("should default to BUSINESS planType when not provided", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Default Plan Link",
          workspaceId: testWorkspaceId,
          // planType not provided
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const createdLink = await prisma.affiliateLink.findUnique({
        where: { id: responseData.id },
      });

      // Should default to BUSINESS
      expect(createdLink?.itemType).toBe("BUSINESS");

      // JWT should also contain BUSINESS planType
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.planType).toBe("BUSINESS");
    });

    it("should allow overriding planType to FREE", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Free Plan Link",
          workspaceId: testWorkspaceId,
          planType: "FREE", // Explicitly set to FREE
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const createdLink = await prisma.affiliateLink.findUnique({
        where: { id: responseData.id },
      });

      // Should use provided FREE planType
      expect(createdLink?.itemType).toBe("FREE");

      // JWT should contain FREE planType
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.planType).toBe("FREE");
    });

    it("should allow overriding planType to AGENCY", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Agency Plan Link",
          workspaceId: testWorkspaceId,
          planType: "AGENCY", // Explicitly set to AGENCY
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const createdLink = await prisma.affiliateLink.findUnique({
        where: { id: responseData.id },
      });

      // Should use provided AGENCY planType
      expect(createdLink?.itemType).toBe("AGENCY");

      // JWT should contain AGENCY planType
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.planType).toBe("AGENCY");
    });

    it("should handle default empty settings when not provided", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Link Without Settings",
          workspaceId: testWorkspaceId,
          // settings not provided
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const createdLink = await prisma.affiliateLink.findUnique({
        where: { id: responseData.id },
      });
      expect(createdLink?.settings).toEqual({});
    });

    it("should generate unique tokens for different links", async () => {
      // Arrange & Act - Create first link
      const req1 = mockRequest(
        {
          name: "Link One",
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res1 = mockResponse();
      await AffiliateLinkController.generateLink(
        req1 as AuthRequest,
        res1 as Response,
        mockNext
      );

      // Create second link
      const req2 = mockRequest(
        {
          name: "Link Two",
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res2 = mockResponse();
      await AffiliateLinkController.generateLink(
        req2 as AuthRequest,
        res2 as Response,
        mockNext
      );

      // Assert
      const response1 = (res1.json as any).mock.calls[0][0];
      const response2 = (res2.json as any).mock.calls[0][0];

      expect(response1.token).not.toBe(response2.token);
      expect(response1.url).not.toBe(response2.url);
      expect(response1.id).not.toBe(response2.id);
    });
  });

  describe("Validation Errors", () => {
    it("should return error when user not found (edge case)", async () => {
      // Arrange
      // This is an edge case - normally auth middleware ensures user exists
      const nonExistentUserId = 999999;
      const req = mockRequest(
        {
          name: "Test Link",
          workspaceId: testWorkspaceId,
        },
        nonExistentUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert - Should call next with error
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/user not found/i);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return user-friendly error when workspace not found", async () => {
      // Arrange
      const nonExistentWorkspaceId = 999999;
      const req = mockRequest(
        {
          name: "Test Link",
          workspaceId: nonExistentWorkspaceId,
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/workspace.*not found|access denied/i);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return user-friendly error when user does not own workspace", async () => {
      // Arrange
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          username: `otheruser${Date.now()}`,
          firstName: "Other",
          lastName: "User",
          password: "hashed-password",
          plan: "FREE",
          verified: true,
        },
      });

      // Create workspace owned by other user
      const otherWorkspace = await prisma.workspace.create({
        data: {
          name: "Other User Workspace",
          slug: `other-workspace-${Date.now()}`,
          ownerId: otherUser.id,
          planType: "FREE",
        },
      });

      const req = mockRequest(
        {
          name: "Unauthorized Link",
          workspaceId: otherWorkspace.id,
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/workspace.*not found|access denied/i);

      // Cleanup
      await prisma.workspace.delete({ where: { id: otherWorkspace.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it("should return user-friendly error when affiliate link name already exists", async () => {
      // Arrange
      const linkName = "Duplicate Name Link";

      // Create first link
      const req1 = mockRequest(
        {
          name: linkName,
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res1 = mockResponse();
      await AffiliateLinkController.generateLink(
        req1 as AuthRequest,
        res1 as Response,
        mockNext
      );

      // Try to create second link with same name
      const req2 = mockRequest(
        {
          name: linkName,
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res2 = mockResponse();
      const next2 = vi.fn();

      // Act
      await AffiliateLinkController.generateLink(
        req2 as AuthRequest,
        res2 as Response,
        next2
      );

      // Assert
      expect(next2).toHaveBeenCalled();
      const error = next2.mock.calls[0][0];
      expect(error.message).toMatch(/already exists|duplicate/i);
    });

    it("should return user-friendly error for missing name", async () => {
      // Arrange
      const req = mockRequest(
        {
          workspaceId: testWorkspaceId,
          // name is missing
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(
        /provide a name|link name|required|expected string/i
      );
    });

    it("should return user-friendly error for missing workspaceId", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Test Link",
          // workspaceId is missing
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/workspace|expected number/i);
    });

    it("should return user-friendly error for invalid workspaceId", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Test Link",
          workspaceId: -1,
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/select a valid workspace|positive/i);
    });
  });

  describe("JWT Token Validation", () => {
    it("should include all required fields in JWT token", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Complete Token Test",
          workspaceId: testWorkspaceId,
          settings: { custom: "value" },
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;

      expect(decoded).toHaveProperty("userId");
      expect(decoded).toHaveProperty("workspaceId");
      expect(decoded).toHaveProperty("name");
      expect(decoded).toHaveProperty("planType"); // NEW: Should include planType
      expect(decoded).toHaveProperty("commissionPercentage");
      expect(decoded).toHaveProperty("settings");
      expect(decoded).toHaveProperty("affiliateLinkId");

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.workspaceId).toBe(testWorkspaceId);
      expect(decoded.name).toBe("Complete Token Test");
      expect(decoded.planType).toBe("BUSINESS"); // Default planType
      expect(decoded.commissionPercentage).toBe(20);
      expect(decoded.settings).toEqual({ custom: "value" });
      expect(decoded.affiliateLinkId).toBe(responseData.id);
    });

    it("should NOT include old fields (funnelId, affiliateAmount) in JWT token", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Token Structure Test",
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const decoded = jwt.verify(
        responseData.token,
        process.env.JWT_SECRET!
      ) as any;

      // Old fields should NOT be present
      expect(decoded).not.toHaveProperty("funnelId");
      expect(decoded).not.toHaveProperty("affiliateAmount");

      // New fields SHOULD be present
      expect(decoded).toHaveProperty("workspaceId");
      expect(decoded).toHaveProperty("planType"); // planType IS present now
      expect(decoded).toHaveProperty("commissionPercentage");
    });
  });

  describe("Database State", () => {
    it("should store correct data in database", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Database Test Link",
          workspaceId: testWorkspaceId,
          settings: { test: "data" },
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const linkFromDb = await prisma.affiliateLink.findUnique({
        where: { id: responseData.id },
        include: {
          user: {
            select: { id: true, email: true, commissionPercentage: true },
          },
          workspace: {
            select: { id: true, name: true, planType: true },
          },
        },
      });

      expect(linkFromDb).not.toBeNull();
      expect(linkFromDb?.name).toBe("Database Test Link");
      expect(linkFromDb?.userId).toBe(testUserId);
      expect(linkFromDb?.workspaceId).toBe(testWorkspaceId);
      expect(linkFromDb?.itemType).toBe("BUSINESS");
      expect(linkFromDb?.token).toBe(responseData.token);
      expect(linkFromDb?.settings).toEqual({ test: "data" });
      expect(linkFromDb?.clickCount).toBe(0);
      expect(linkFromDb?.totalAmount).toBe(0);
      expect(linkFromDb?.user.commissionPercentage).toBe(20);
      expect(linkFromDb?.workspace.planType).toBe("BUSINESS");
    });

    it("should have unique token in database", async () => {
      // Arrange
      const req = mockRequest(
        {
          name: "Unique Token Test",
          workspaceId: testWorkspaceId,
        },
        testUserId
      );
      const res = mockResponse();
      const next = mockNext;

      // Act
      await AffiliateLinkController.generateLink(
        req as AuthRequest,
        res as Response,
        next
      );

      // Assert
      const responseData = (res.json as any).mock.calls[0][0];
      const foundByToken = await prisma.affiliateLink.findUnique({
        where: { token: responseData.token },
      });

      expect(foundByToken).not.toBeNull();
      expect(foundByToken?.id).toBe(responseData.id);
    });
  });
});
