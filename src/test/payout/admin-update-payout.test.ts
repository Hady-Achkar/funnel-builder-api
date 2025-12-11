import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { Request, Response } from "express";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import type { User, Payout } from "../../generated/prisma-client";

// Import the controllers that will be created
import { UpdatePayoutController } from "../../controllers/payout/update";

/**
 * Integration tests for Admin Payout Update System
 *
 * What this system should do:
 *
 * ADMIN CAPABILITIES:
 * 1. Update payout status (with transition rules)
 * 2. Update admin fields: documentUrl, documentType, transactionId, transactionProof, adminNotes
 * 3. Optionally provide failureReason when setting to FAILED
 * 4. Cannot modify user-entered data (bank details, amounts, method, etc.)
 *
 * STATUS TRANSITION RULES:
 * - Can transition from: PENDING, PROCESSING, ON_HOLD
 * - Cannot transition from: COMPLETED, FAILED, CANCELLED (immutable)
 *
 * SPECIAL STATUS BEHAVIORS:
 * - COMPLETED: Deduct amount from user balance, create BalanceTransaction, set processedAt
 * - FAILED: Set failedAt, failureReason optional
 * - PROCESSING: Set processedAt
 *
 * USER SELF-CANCELLATION:
 * - Payout creator can cancel ONLY if status is PENDING
 * - Cannot cancel any other status
 * - Cannot update any other fields
 */
describe("Admin Payout Update System - Integration Tests", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let adminUser: User;
  let regularUser: User;
  let payoutCreatorUser: User;

  // Sample payouts in different states
  let pendingPayout: Payout;
  let processingPayout: Payout;
  let onHoldPayout: Payout;
  let completedPayout: Payout;
  let failedPayout: Payout;
  let cancelledPayout: Payout;

  // Mock Express request and response
  const mockRequest = (
    body: any,
    params: any,
    userId?: number,
    isAdmin?: boolean
  ): Partial<Request> => {
    const req: any = {
      body,
      params,
    };

    if (userId !== undefined) {
      req.userId = userId;
      req.isAdmin = isAdmin || false;
    }

    return req;
  };

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = vi.fn();

  // Helper Functions
  async function createTestPayout(
    userId: number,
    status: string,
    amount: number,
    method: string = "UAE_BANK"
  ): Promise<Payout> {
    return await prisma.payout.create({
      data: {
        userId,
        amount,
        fees:
          method === "UAE_BANK" ? 1 : method === "INTERNATIONAL_BANK" ? 38 : 6,
        netAmount:
          amount -
          (method === "UAE_BANK"
            ? 1
            : method === "INTERNATIONAL_BANK"
            ? 38
            : 6),
        method: method as any,
        status: status as any,
        accountHolderName: method !== "USDT" ? "Test User" : null,
        bankName: method !== "USDT" ? "Test Bank" : null,
        accountNumber: method !== "USDT" ? "123456789" : null,
        swiftCode: method === "INTERNATIONAL_BANK" ? "TESTUS33" : null,
        bankAddress: method === "INTERNATIONAL_BANK" ? "Test Address" : null,
        usdtWalletAddress: method === "USDT" ? "TRX123456789ABC" : null,
        usdtNetwork: method === "USDT" ? "TRC20" : null,
      },
    });
  }

  async function assertBalanceDeducted(userId: number, expectedAmount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(expectedAmount);
  }

  async function assertBalanceNotChanged(
    userId: number,
    expectedBalance: number
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.balance).toBe(expectedBalance);
  }

  async function assertBalanceTransactionCreated(
    payoutId: number,
    userId: number,
    amount: number
  ) {
    const transaction = await prisma.balanceTransaction.findFirst({
      where: {
        payoutId,
        userId,
        type: "WITHDRAWAL",
      },
    });

    expect(transaction).toBeDefined();
    expect(transaction?.amount).toBe(-Math.abs(amount));
    expect(transaction?.referenceType).toBe("PAYOUT");
    expect(transaction?.referenceId).toBe(payoutId);
  }

  function assertTimestampSet(payout: Payout, field: keyof Payout) {
    expect(payout[field]).toBeDefined();
    expect(payout[field]).toBeInstanceOf(Date);
  }

  function assertFieldUnchanged(before: any, after: any, field: string) {
    expect(after[field]).toBe(before[field]);
  }

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(
      `\n🔧 Running admin payout update tests against database: ${dbName}\n`
    );

    // Set required environment variables
    process.env.JWT_SECRET = "test-secret-key-for-admin-payouts";

    // Clean up any existing test data (order matters: balanceTransaction -> payout -> user)
    await prisma.balanceTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: "admin-payout-test-",
          },
        },
      },
    });
    await prisma.payout.deleteMany({
      where: {
        user: {
          email: {
            contains: "admin-payout-test-",
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "admin-payout-test-",
        },
      },
    });

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        email: `admin-payout-test-admin-${Date.now()}@example.com`,
        username: `adminuser${Date.now()}`,
        firstName: "Admin",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        isAdmin: true,
        balance: 5000,
      },
    });

    regularUser = await prisma.user.create({
      data: {
        email: `admin-payout-test-regular-${Date.now()}@example.com`,
        username: `regularuser${Date.now()}`,
        firstName: "Regular",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        isAdmin: false,
        balance: 1000,
      },
    });

    payoutCreatorUser = await prisma.user.create({
      data: {
        email: `admin-payout-test-creator-${Date.now()}@example.com`,
        username: `creatoruser${Date.now()}`,
        firstName: "Creator",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        isAdmin: false,
        balance: 500,
      },
    });
  });

  beforeEach(async () => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Clean up all payouts and balance transactions before each test
    await prisma.balanceTransaction.deleteMany({});
    await prisma.payout.deleteMany({});

    // Reset user balances (users are created in beforeAll)
    await prisma.user.update({
      where: { id: regularUser.id },
      data: { balance: 1000 },
    });

    await prisma.user.update({
      where: { id: payoutCreatorUser.id },
      data: { balance: 500 },
    });

    // Create fresh test payouts for each test
    pendingPayout = await createTestPayout(
      payoutCreatorUser.id,
      "PENDING",
      100
    );
    processingPayout = await createTestPayout(
      regularUser.id,
      "PROCESSING",
      200
    );
    onHoldPayout = await createTestPayout(regularUser.id, "ON_HOLD", 150);
    completedPayout = await createTestPayout(regularUser.id, "COMPLETED", 300);
    failedPayout = await createTestPayout(regularUser.id, "FAILED", 250);
    cancelledPayout = await createTestPayout(regularUser.id, "CANCELLED", 180);
  });

  afterAll(async () => {
    // Clean up test data (order matters: balanceTransaction -> payout -> user)
    await prisma.balanceTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: "admin-payout-test-",
          },
        },
      },
    });
    await prisma.payout.deleteMany({
      where: {
        user: {
          email: {
            contains: "admin-payout-test-",
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "admin-payout-test-",
        },
      },
    });

    await prisma.$disconnect();
  });

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated requests with 401", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() }
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Please sign in to update payout",
      });
    });

    it("should reject non-admin users trying to update status with 403", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You don't have permission to perform this action",
      });
    });

    it("should accept admin users for all updates", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("should reject if payout doesn't exist with 404", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: "99999" },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Payout not found",
      });
    });

    it("should allow payout creator to cancel ONLY if status is PENDING", async () => {
      const req = mockRequest(
        { status: "CANCELLED" },
        { id: pendingPayout.id.toString() },
        payoutCreatorUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Your withdrawal request has been cancelled successfully",
        })
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("CANCELLED");
    });

    it("should reject payout creator trying to cancel if status is not PENDING", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only cancel your pending withdrawal request",
      });
    });

    it("should reject payout creator trying to update any field other than status", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM", adminNotes: "User trying to add notes" },
        { id: pendingPayout.id.toString() },
        payoutCreatorUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only cancel your pending withdrawal request",
      });
    });

    it("should reject regular user (non-creator, non-admin) from any updates", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          username: `otheruser${Date.now()}`,
          firstName: "Other",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          balance: 100,
        },
      });

      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        otherUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You don't have permission to perform this action",
      });
    });
  });

  describe("Status Transition Rules - Valid Transitions (Admin Only)", () => {
    it("PENDING → PROCESSING should set processedAt", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("PROCESSING");
      assertTimestampSet(updated!, "processedAt");
    });

    it("PENDING → COMPLETED should deduct balance and create transaction", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("COMPLETED");
      assertTimestampSet(updated!, "processedAt");

      await assertBalanceDeducted(payoutCreatorUser.id, 400); // 500 - 100
      await assertBalanceTransactionCreated(
        pendingPayout.id,
        payoutCreatorUser.id,
        100
      );
    });

    it("PENDING → FAILED should set failedAt, failureReason optional", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("FAILED");
      assertTimestampSet(updated!, "failedAt");

      // Balance should NOT be deducted
      await assertBalanceNotChanged(payoutCreatorUser.id, 500);
    });

    it("PENDING → FAILED with failureReason should save it", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: "Insufficient bank details" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("FAILED");
      expect(updated?.failureReason).toBe("Insufficient bank details");
      assertTimestampSet(updated!, "failedAt");
    });

    it("PENDING → CANCELLED should allow (admin)", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("CANCELLED");
    });

    it("PENDING → ON_HOLD should allow", async () => {
      const req = mockRequest(
        { status: "ON_HOLD", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("ON_HOLD");
    });

    it("PROCESSING → COMPLETED should deduct balance and create transaction", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.status).toBe("COMPLETED");

      await assertBalanceDeducted(regularUser.id, 800); // 1000 - 200
      await assertBalanceTransactionCreated(
        processingPayout.id,
        regularUser.id,
        200
      );
    });

    it("PROCESSING → FAILED should set failedAt", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: "Bank rejected transfer" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.status).toBe("FAILED");
      expect(updated?.failureReason).toBe("Bank rejected transfer");
      assertTimestampSet(updated!, "failedAt");

      await assertBalanceNotChanged(regularUser.id, 1000);
    });

    it("PROCESSING → ON_HOLD should allow", async () => {
      const req = mockRequest(
        { status: "ON_HOLD", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.status).toBe("ON_HOLD");
    });

    it("PROCESSING → CANCELLED should allow (admin)", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.status).toBe("CANCELLED");
    });

    it("ON_HOLD → PROCESSING should set processedAt", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: onHoldPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: onHoldPayout.id },
      });
      expect(updated?.status).toBe("PROCESSING");
      assertTimestampSet(updated!, "processedAt");
    });

    it("ON_HOLD → COMPLETED should deduct balance and create transaction", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: onHoldPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: onHoldPayout.id },
      });
      expect(updated?.status).toBe("COMPLETED");

      await assertBalanceDeducted(regularUser.id, 850); // 1000 - 150
      await assertBalanceTransactionCreated(
        onHoldPayout.id,
        regularUser.id,
        150
      );
    });

    it("ON_HOLD → FAILED should set failedAt", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: onHoldPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: onHoldPayout.id },
      });
      expect(updated?.status).toBe("FAILED");
      assertTimestampSet(updated!, "failedAt");
    });

    it("ON_HOLD → CANCELLED should allow", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: onHoldPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: onHoldPayout.id },
      });
      expect(updated?.status).toBe("CANCELLED");
    });
  });

  describe("Status Transition Rules - Invalid Transitions (Final States)", () => {
    it("COMPLETED → any status should reject (immutable)", async () => {
      const req = mockRequest(
        { status: "PENDING", adminCode: "AALM" },
        { id: completedPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot modify a completed payout",
      });
    });

    it("FAILED → any status should reject (immutable)", async () => {
      const req = mockRequest(
        { status: "PENDING", adminCode: "AALM" },
        { id: failedPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot modify a failed payout",
      });
    });

    it("CANCELLED → any status should reject (immutable)", async () => {
      const req = mockRequest(
        { status: "PENDING" },
        { id: cancelledPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot modify a cancelled payout",
      });
    });

    it("should allow updating admin fields on final states (not status)", async () => {
      const req = mockRequest(
        { adminCode: "AALM", adminNotes: "Adding notes to completed payout" },
        { id: completedPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: completedPayout.id },
      });
      expect(updated?.adminNotes).toBe("Adding notes to completed payout");
      expect(updated?.status).toBe("COMPLETED"); // Status unchanged
    });
  });

  describe("User Self-Cancellation Rules", () => {
    it("payout creator can cancel PENDING payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED" },
        { id: pendingPayout.id.toString() },
        payoutCreatorUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Your withdrawal request has been cancelled successfully",
        })
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("CANCELLED");
    });

    it("should NOT allow creator to cancel PROCESSING payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only cancel your pending withdrawal request",
      });
    });

    it("should NOT allow creator to cancel ON_HOLD payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: onHoldPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should NOT allow creator to cancel COMPLETED payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: completedPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should NOT allow creator to cancel FAILED payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: failedPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should NOT allow creator to cancel already CANCELLED payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM" },
        { id: cancelledPayout.id.toString() },
        regularUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot modify a cancelled payout",
      });
    });

    it("should NOT allow creator to update any other fields when cancelling", async () => {
      const req = mockRequest(
        { status: "CANCELLED", adminCode: "AALM", adminNotes: "Trying to add notes" },
        { id: pendingPayout.id.toString() },
        payoutCreatorUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only cancel your pending withdrawal request",
      });
    });

    it("should NOT deduct balance when user cancels PENDING payout", async () => {
      const req = mockRequest(
        { status: "CANCELLED" },
        { id: pendingPayout.id.toString() },
        payoutCreatorUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceNotChanged(payoutCreatorUser.id, 500);

      // No balance transaction should be created
      const transaction = await prisma.balanceTransaction.findFirst({
        where: { payoutId: pendingPayout.id },
      });
      expect(transaction).toBeNull();
    });
  });

  describe("COMPLETED Status Special Behavior", () => {
    it("should deduct exact amount from user balance", async () => {
      const initialBalance = 1000;
      const payoutAmount = 200;

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceDeducted(
        regularUser.id,
        initialBalance - payoutAmount
      );
    });

    it("should create BalanceTransaction with type WITHDRAWAL", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceTransactionCreated(
        processingPayout.id,
        regularUser.id,
        200
      );
    });

    it("BalanceTransaction should have correct balanceBefore/balanceAfter", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const transaction = await prisma.balanceTransaction.findFirst({
        where: { payoutId: processingPayout.id },
      });

      expect(transaction?.balanceBefore).toBe(1000);
      expect(transaction?.balanceAfter).toBe(800);
    });

    it("BalanceTransaction should link to payout", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const transaction = await prisma.balanceTransaction.findFirst({
        where: { payoutId: processingPayout.id },
      });

      expect(transaction?.payoutId).toBe(processingPayout.id);
      expect(transaction?.referenceType).toBe("PAYOUT");
      expect(transaction?.referenceId).toBe(processingPayout.id);
    });

    it("BalanceTransaction should have correct amount (negative)", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const transaction = await prisma.balanceTransaction.findFirst({
        where: { payoutId: processingPayout.id },
      });

      expect(transaction?.amount).toBe(-200);
    });

    it("should set processedAt if not already set", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      assertTimestampSet(updated!, "processedAt");
    });

    it("should reject if user has insufficient balance", async () => {
      // Create a payout for more than user has
      const largePayout = await createTestPayout(
        regularUser.id,
        "PENDING",
        1500
      );

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: largePayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User has insufficient balance to complete this payout",
      });

      // Balance should not be changed
      await assertBalanceNotChanged(regularUser.id, 1000);
    });

    it("should handle edge case: user has exactly the amount needed", async () => {
      // Set user balance to exactly the payout amount
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { balance: 200 },
      });

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceDeducted(regularUser.id, 0);
    });

    it("should work for UAE_BANK method", async () => {
      const uaePayout = await createTestPayout(
        regularUser.id,
        "PENDING",
        100,
        "UAE_BANK"
      );

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: uaePayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceDeducted(regularUser.id, 900); // 1000 - 100
      await assertBalanceTransactionCreated(uaePayout.id, regularUser.id, 100);
    });

    it("should work for INTERNATIONAL_BANK method", async () => {
      const intlPayout = await createTestPayout(
        regularUser.id,
        "PENDING",
        200,
        "INTERNATIONAL_BANK"
      );

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: intlPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceDeducted(regularUser.id, 800); // 1000 - 200
    });

    it("should work for USDT method", async () => {
      const usdtPayout = await createTestPayout(
        regularUser.id,
        "PENDING",
        150,
        "USDT"
      );

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: usdtPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceDeducted(regularUser.id, 850); // 1000 - 150
    });

    it("should only create ONE BalanceTransaction (not duplicate)", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const transactions = await prisma.balanceTransaction.findMany({
        where: { payoutId: processingPayout.id },
      });

      expect(transactions.length).toBe(1);
    });
  });

  describe("FAILED Status Special Behavior", () => {
    it("failureReason is OPTIONAL when setting to FAILED", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("FAILED");
      expect(updated?.failureReason).toBeNull();
    });

    it("should accept FAILED with failureReason", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: "Invalid bank account" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.failureReason).toBe("Invalid bank account");
    });

    it("should set failedAt timestamp automatically", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      assertTimestampSet(updated!, "failedAt");
    });

    it("should NOT deduct balance", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      await assertBalanceNotChanged(payoutCreatorUser.id, 500);
    });

    it("should NOT create BalanceTransaction", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const transaction = await prisma.balanceTransaction.findFirst({
        where: { payoutId: pendingPayout.id },
      });

      expect(transaction).toBeNull();
    });

    it("should save adminNotes along with optional failureReason", async () => {
      const req = mockRequest(
        {
          adminCode: "AALM",
          status: "FAILED",
          failureReason: "Bank details incorrect",
          adminNotes: "User notified via email",
        },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.failureReason).toBe("Bank details incorrect");
      expect(updated?.adminNotes).toBe("User notified via email");
    });

    it("should trim whitespace from failureReason", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: "  Bank rejected  " },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.failureReason).toBe("Bank rejected");
    });
  });

  describe("PROCESSING Status Special Behavior", () => {
    it("should set processedAt timestamp automatically", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      assertTimestampSet(updated!, "processedAt");
    });

    it("should NOT deduct balance", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      await assertBalanceNotChanged(payoutCreatorUser.id, 500);
    });

    it("should NOT create BalanceTransaction", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const transaction = await prisma.balanceTransaction.findFirst({
        where: { payoutId: pendingPayout.id },
      });

      expect(transaction).toBeNull();
    });

    it("should NOT override processedAt if already set", async () => {
      // First, set to PROCESSING
      await prisma.payout.update({
        where: { id: pendingPayout.id },
        data: {
          status: "PROCESSING",
          processedAt: new Date("2025-01-01T00:00:00Z"),
        },
      });

      // Now update to ON_HOLD (which should not change processedAt)
      const req = mockRequest(
        { status: "ON_HOLD", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.processedAt?.toISOString()).toBe(
        "2025-01-01T00:00:00.000Z"
      );
    });
  });

  describe("Admin-Updatable Fields", () => {
    it("should update documentUrl", async () => {
      const req = mockRequest(
        { adminCode: "AALM", documentUrl: "https://example.com/document.pdf" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.documentUrl).toBe("https://example.com/document.pdf");
    });

    it("should update documentType", async () => {
      const req = mockRequest(
        { adminCode: "AALM", documentType: "BANK_STATEMENT" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.documentType).toBe("BANK_STATEMENT");
    });

    it("should update transactionId", async () => {
      const req = mockRequest(
        { adminCode: "AALM", transactionId: "TXN123456789" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.transactionId).toBe("TXN123456789");
    });

    it("should update transactionProof", async () => {
      const req = mockRequest(
        { adminCode: "AALM", transactionProof: "https://example.com/receipt.pdf" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.transactionProof).toBe("https://example.com/receipt.pdf");
    });

    it("should update adminNotes", async () => {
      const req = mockRequest(
        { adminCode: "AALM", adminNotes: "User notified about delay" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.adminNotes).toBe("User notified about delay");
    });

    it("should update status alone", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("PROCESSING");
    });

    it("should update multiple fields simultaneously", async () => {
      const req = mockRequest(
        {
          adminCode: "AALM",
          status: "COMPLETED",
          transactionId: "TXN987654321",
          transactionProof: "https://example.com/proof.pdf",
          adminNotes: "Completed successfully",
        },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: processingPayout.id },
      });
      expect(updated?.status).toBe("COMPLETED");
      expect(updated?.transactionId).toBe("TXN987654321");
      expect(updated?.transactionProof).toBe("https://example.com/proof.pdf");
      expect(updated?.adminNotes).toBe("Completed successfully");
    });

    it("should allow empty string for optional fields", async () => {
      // First set a value
      await prisma.payout.update({
        where: { id: pendingPayout.id },
        data: { adminNotes: "Some notes" },
      });

      const req = mockRequest(
        { adminCode: "AALM", adminNotes: "" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.adminNotes).toBe("");
    });

    it("should validate transactionId uniqueness", async () => {
      // Set transactionId on first payout
      await prisma.payout.update({
        where: { id: processingPayout.id },
        data: { transactionId: "UNIQUE123" },
      });

      // Try to set same transactionId on another payout
      const req = mockRequest(
        { adminCode: "AALM", transactionId: "UNIQUE123" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Transaction ID already exists",
      });
    });

    it("should trim whitespace from text fields", async () => {
      const req = mockRequest(
        { adminCode: "AALM", adminNotes: "  Some notes with spaces  " },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.adminNotes).toBe("Some notes with spaces");
    });

    it("should allow null for optional fields", async () => {
      const req = mockRequest(
        { adminCode: "AALM", adminNotes: null },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.adminNotes).toBeNull();
    });
  });

  describe("User Data Protection (Read-Only Fields)", () => {
    it("should NOT allow updating amount", async () => {
      const originalAmount = pendingPayout.amount;

      const req = mockRequest(
        { amount: 999 },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.amount).toBe(originalAmount);
    });

    it("should NOT allow updating fees", async () => {
      const originalFees = pendingPayout.fees;

      const req = mockRequest(
        { fees: 50 },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.fees).toBe(originalFees);
    });

    it("should NOT allow updating netAmount", async () => {
      const originalNetAmount = pendingPayout.netAmount;

      const req = mockRequest(
        { netAmount: 999 },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.netAmount).toBe(originalNetAmount);
    });

    it("should NOT allow updating method", async () => {
      const originalMethod = pendingPayout.method;

      const req = mockRequest(
        { method: "USDT" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.method).toBe(originalMethod);
    });

    it("should NOT allow updating accountHolderName", async () => {
      const original = pendingPayout.accountHolderName;

      const req = mockRequest(
        { accountHolderName: "Hacker Name" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.accountHolderName).toBe(original);
    });

    it("should NOT allow updating bankName", async () => {
      const original = pendingPayout.bankName;

      const req = mockRequest(
        { bankName: "Hacker Bank" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.bankName).toBe(original);
    });

    it("should NOT allow updating accountNumber", async () => {
      const original = pendingPayout.accountNumber;

      const req = mockRequest(
        { accountNumber: "999999999" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.accountNumber).toBe(original);
    });

    it("should NOT allow updating userNotes", async () => {
      await prisma.payout.update({
        where: { id: pendingPayout.id },
        data: { userNotes: "User's original notes" },
      });

      const req = mockRequest(
        { userNotes: "Admin trying to modify" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.userNotes).toBe("User's original notes");
    });

    it("should NOT allow updating userId", async () => {
      const originalUserId = pendingPayout.userId;

      const req = mockRequest(
        { userId: 99999 },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.userId).toBe(originalUserId);
    });

    it("verify all protected fields remain unchanged after admin update", async () => {
      const before = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });

      const req = mockRequest(
        {
          adminCode: "AALM",
          status: "PROCESSING",
          adminNotes: "Processing now",
          // Try to modify protected fields
          amount: 999,
          fees: 50,
          method: "USDT",
          accountHolderName: "Changed",
          userId: 99999,
        },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const after = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });

      // Admin fields should be updated
      expect(after?.status).toBe("PROCESSING");
      expect(after?.adminNotes).toBe("Processing now");

      // Protected fields should remain unchanged
      assertFieldUnchanged(before, after, "amount");
      assertFieldUnchanged(before, after, "fees");
      assertFieldUnchanged(before, after, "netAmount");
      assertFieldUnchanged(before, after, "method");
      assertFieldUnchanged(before, after, "accountHolderName");
      assertFieldUnchanged(before, after, "bankName");
      assertFieldUnchanged(before, after, "accountNumber");
      assertFieldUnchanged(before, after, "userId");
    });
  });

  describe("Validation Rules", () => {
    it("should reject invalid status values", async () => {
      const req = mockRequest(
        { status: "INVALID_STATUS" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Invalid status"),
        })
      );
    });

    it("should reject invalid payoutId (non-numeric)", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: "not-a-number" },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid payout ID",
      });
    });

    it("should limit adminNotes to 2000 characters", async () => {
      const longNotes = "A".repeat(2001);

      const req = mockRequest(
        { adminCode: "AALM", adminNotes: longNotes },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Admin notes must be less than 2000 characters",
      });
    });

    it("should limit failureReason to 1000 characters", async () => {
      const longReason = "A".repeat(1001);

      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: longReason },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failure reason must be less than 1000 characters",
      });
    });

    it("should accept update with only status field", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept update with only admin fields (no status change)", async () => {
      const req = mockRequest(
        { adminCode: "AALM", adminNotes: "Just adding a note" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.adminNotes).toBe("Just adding a note");
      expect(updated?.status).toBe("PENDING"); // Status unchanged
    });

    it("should handle missing optional fields gracefully", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle very large balances correctly", async () => {
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { balance: 999999999.99 },
      });

      const largePayout = await createTestPayout(
        regularUser.id,
        "PENDING",
        100000
      );

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: largePayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      await assertBalanceDeducted(regularUser.id, 999899999.99);
    });

    it("should handle decimal precision in balance deduction", async () => {
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { balance: 100.55 },
      });

      const decimalPayout = await createTestPayout(
        regularUser.id,
        "PENDING",
        50.25
      );

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: decimalPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);

      // Should be 100.55 - 50.25 = 50.30
      await assertBalanceDeducted(regularUser.id, 50.3);
    });

    it("should return updated payout object in response", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            id: pendingPayout.id,
            status: "PROCESSING",
          }),
        })
      );
    });

    it("should include all payout fields in response", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            id: expect.any(Number),
            amount: expect.any(Number),
            fees: expect.any(Number),
            netAmount: expect.any(Number),
            status: expect.any(String),
            method: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return 200 status on success", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle user with zero balance trying to complete payout", async () => {
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { balance: 0 },
      });

      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User has insufficient balance to complete this payout",
      });
    });

    it("should preserve existing timestamps when updating other fields", async () => {
      // First set to PROCESSING (sets processedAt)
      await prisma.payout.update({
        where: { id: pendingPayout.id },
        data: {
          status: "PROCESSING",
          processedAt: new Date("2025-01-01T00:00:00Z"),
        },
      });

      // Now add admin notes (should not change processedAt)
      const req = mockRequest(
        { adminCode: "AALM", adminNotes: "Adding notes" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.processedAt?.toISOString()).toBe(
        "2025-01-01T00:00:00.000Z"
      );
      expect(updated?.adminNotes).toBe("Adding notes");
    });
  });

  describe("Multiple Status Updates Flow (Admin)", () => {
    it("PENDING → PROCESSING → COMPLETED (full flow)", async () => {
      // Step 1: PENDING → PROCESSING
      let req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      let res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );
      expect(res.status).toHaveBeenCalledWith(200);

      let updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("PROCESSING");
      assertTimestampSet(updated!, "processedAt");
      const processedAt = updated?.processedAt;

      // Step 2: PROCESSING → COMPLETED
      req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );
      expect(res.status).toHaveBeenCalledWith(200);

      updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("COMPLETED");
      expect(updated?.processedAt).toEqual(processedAt); // Should preserve

      await assertBalanceDeducted(payoutCreatorUser.id, 400);
    });

    it("PENDING → ON_HOLD → PROCESSING → COMPLETED", async () => {
      // PENDING → ON_HOLD
      let req = mockRequest(
        { status: "ON_HOLD", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      let res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      // ON_HOLD → PROCESSING
      req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      // PROCESSING → COMPLETED
      req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("COMPLETED");

      await assertBalanceDeducted(payoutCreatorUser.id, 400);
    });

    it("PENDING → PROCESSING → FAILED", async () => {
      // PENDING → PROCESSING
      let req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      let res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      // PROCESSING → FAILED
      req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: "Bank rejected" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.status).toBe("FAILED");
      assertTimestampSet(updated!, "failedAt");

      // Balance should NOT be deducted
      await assertBalanceNotChanged(payoutCreatorUser.id, 500);
    });

    it("verify processedAt persists through status changes", async () => {
      // Set to PROCESSING
      let req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      let res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const afterProcessing = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      const originalProcessedAt = afterProcessing?.processedAt;

      // Change to ON_HOLD
      req = mockRequest(
        { status: "ON_HOLD", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      // Change to COMPLETED
      req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      const final = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(final?.processedAt).toEqual(originalProcessedAt);
    });

    it("verify balance is only deducted once (on COMPLETED)", async () => {
      // PENDING → PROCESSING (should not deduct)
      let req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      let res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      await assertBalanceNotChanged(payoutCreatorUser.id, 500);

      // PROCESSING → COMPLETED (should deduct)
      req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      await assertBalanceDeducted(payoutCreatorUser.id, 400);

      // Verify only one transaction
      const transactions = await prisma.balanceTransaction.findMany({
        where: { payoutId: pendingPayout.id },
      });
      expect(transactions.length).toBe(1);
    });

    it("verify failedAt is set only when transitioning to FAILED", async () => {
      // PENDING → PROCESSING
      let req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      let res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      let updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      expect(updated?.failedAt).toBeNull();

      // PROCESSING → FAILED
      req = mockRequest(
        { status: "FAILED", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      res = mockResponse();
      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      updated = await prisma.payout.findUnique({
        where: { id: pendingPayout.id },
      });
      assertTimestampSet(updated!, "failedAt");
    });
  });

  describe("Response Format", () => {
    it("should return success: true", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("should return updated payout object", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM", adminNotes: "Now processing" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            id: pendingPayout.id,
            status: "PROCESSING",
            adminNotes: "Now processing",
          }),
        })
      );
    });

    it("should include timestamps (processedAt, failedAt, updatedAt)", async () => {
      const req = mockRequest(
        { status: "FAILED", adminCode: "AALM", failureReason: "Test" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            failedAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return user-friendly success message", async () => {
      const req = mockRequest(
        { status: "COMPLETED", adminCode: "AALM" },
        { id: processingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Payout updated successfully"),
        })
      );
    });

    it("should format response consistently", async () => {
      const req = mockRequest(
        { status: "PROCESSING", adminCode: "AALM" },
        { id: pendingPayout.id.toString() },
        adminUser.id,
        true
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        payout: expect.objectContaining({
          id: expect.any(Number),
        }),
      });
    });

    it("should include message for user self-cancellation", async () => {
      const req = mockRequest(
        { status: "CANCELLED" },
        { id: pendingPayout.id.toString() },
        payoutCreatorUser.id,
        false
      );
      const res = mockResponse();

      await UpdatePayoutController.update(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Your withdrawal request has been cancelled successfully",
        })
      );
    });
  });
});
