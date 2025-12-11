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
import type { User } from "../../generated/prisma-client";

// Import the controller
import { RequestPayoutController } from "../../controllers/payout/request";

/**
 * Integration tests for Payout Request System
 *
 * What this controller should do:
 * 1. Validate authentication
 * 2. Check minimum balance ($50)
 * 3. Validate request amount <= available balance
 * 4. Calculate fees based on payment method
 * 5. Validate payment method fields
 * 6. Create Payout record with PENDING status
 * 7. Deduct amount from user balance
 * 8. Create BalanceTransaction for audit trail
 * 9. Return success response with payout details
 */
describe("RequestPayoutController.create - Integration Tests", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let testUser: User;
  let poorUser: User;
  let exactUser: User;

  // Mock Express request and response
  const mockRequest = (body: any, userId?: number): Partial<Request> => {
    const req: any = {
      body,
    };

    // Set userId if provided (simulates authenticateToken middleware)
    if (userId !== undefined) {
      req.userId = userId;
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

  // Helper to calculate expected fees
  function calculateFees(
    amount: number,
    method: string
  ): { fees: number; netAmount: number } {
    let fees = 0;

    switch (method) {
      case "UAE_BANK":
        fees = 1;
        break;
      case "INTERNATIONAL_BANK":
        fees = 38;
        break;
      case "USDT":
        fees = 3 + amount * 0.03;
        break;
    }

    fees = Math.round(fees * 100) / 100;
    const netAmount = Math.round((amount - fees) * 100) / 100;

    return { fees, netAmount };
  }

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running payout tests against database: ${dbName}\n`);

    // Set required environment variables
    process.env.JWT_SECRET = "test-secret-key-for-payouts";

    // Clean up any existing test data
    await prisma.payout.deleteMany({});
    await prisma.balanceTransaction.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "payout-test-",
        },
      },
    });

    // Create test users with different balances
    testUser = await prisma.user.create({
      data: {
        email: `payout-test-rich-${Date.now()}@example.com`,
        username: `richuser${Date.now()}`,
        firstName: "Rich",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        balance: 1000,
        pendingBalance: 0,
      },
    });

    poorUser = await prisma.user.create({
      data: {
        email: `payout-test-poor-${Date.now()}@example.com`,
        username: `pooruser${Date.now()}`,
        firstName: "Poor",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        balance: 30,
        pendingBalance: 100,
      },
    });

    exactUser = await prisma.user.create({
      data: {
        email: `payout-test-exact-${Date.now()}@example.com`,
        username: `exactuser${Date.now()}`,
        firstName: "Exact",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        balance: 50,
        pendingBalance: 0,
      },
    });
  });

  beforeEach(async () => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Clean up ALL payouts to ensure clean state
    await prisma.payout.deleteMany({});

    // Reset balances to initial state
    await prisma.user.update({
      where: { id: testUser.id },
      data: { balance: 1000, pendingBalance: 0 },
    });
    await prisma.user.update({
      where: { id: poorUser.id },
      data: { balance: 30, pendingBalance: 100 },
    });
    await prisma.user.update({
      where: { id: exactUser.id },
      data: { balance: 50, pendingBalance: 0 },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.payout.deleteMany({});
    await prisma.balanceTransaction.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "payout-test-",
        },
      },
    });

    await prisma.$disconnect();
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests with 401", async () => {
      const req = mockRequest({
        amount: 100,
        method: "UAE_BANK",
        accountHolderName: "Test User",
        bankName: "Test Bank",
        accountNumber: "123456789",
      });
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Please sign in to request a withdrawal",
      });
    });

    it("should accept authenticated requests", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe("Balance Validation", () => {
    it("should reject if user balance is below $50", async () => {
      const req = mockRequest(
        {
          amount: 50, // Request valid amount to test balance check
          method: "UAE_BANK",
          accountHolderName: "Poor User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        poorUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Your balance must be at least $50 to request a withdrawal",
      });
    });

    it("should reject if requested amount exceeds available balance", async () => {
      const req = mockRequest(
        {
          amount: 1500,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "You don't have enough funds. Your available balance is $1000.00",
      });
    });

    it("should consider pending payouts when calculating available balance", async () => {
      // First create a pending payout for $600
      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 600,
          fees: 1,
          netAmount: 599,
          method: "UAE_BANK",
          status: "PENDING",
          accountHolderName: "Test User",
          bankName: "First Bank",
          accountNumber: "123456789",
        },
      });

      // Now try to request another $500 (total would be $1100, but balance is $1000)
      const req = mockRequest(
        {
          amount: 500,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Second Bank",
          accountNumber: "987654321",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "You don't have enough funds. Your available balance is $400.00 after pending withdrawals",
      });
    });

    it("should allow request if balance minus pending payouts is sufficient", async () => {
      // Create a pending payout for $300
      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 300,
          fees: 1,
          netAmount: 299,
          method: "UAE_BANK",
          status: "PENDING",
          accountHolderName: "Test User",
          bankName: "First Bank",
          accountNumber: "123456789",
        },
      });

      // Request another $500 (total $800, balance is $1000, so should work)
      const req = mockRequest(
        {
          amount: 500,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Second Bank",
          accountNumber: "987654321",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          payout: expect.objectContaining({
            amount: 500,
          }),
        })
      );
    });

    it("should ignore COMPLETED, FAILED, and CANCELLED payouts in balance calculation", async () => {
      // Create various status payouts
      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 200,
          fees: 1,
          netAmount: 199,
          method: "UAE_BANK",
          status: "COMPLETED", // Should be ignored
          accountHolderName: "Test User",
          bankName: "Bank 1",
          accountNumber: "111",
        },
      });

      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 150,
          fees: 1,
          netAmount: 149,
          method: "UAE_BANK",
          status: "FAILED", // Should be ignored
          accountHolderName: "Test User",
          bankName: "Bank 2",
          accountNumber: "222",
        },
      });

      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 100,
          fees: 1,
          netAmount: 99,
          method: "UAE_BANK",
          status: "CANCELLED", // Should be ignored
          accountHolderName: "Test User",
          bankName: "Bank 3",
          accountNumber: "333",
        },
      });

      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 300,
          fees: 1,
          netAmount: 299,
          method: "UAE_BANK",
          status: "PENDING", // Should be counted
          accountHolderName: "Test User",
          bankName: "Bank 4",
          accountNumber: "444",
        },
      });

      // Request $600 (with $300 pending, total $900, balance is $1000, should work)
      const req = mockRequest(
        {
          amount: 600,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "New Bank",
          accountNumber: "555",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          payout: expect.objectContaining({
            amount: 600,
          }),
        })
      );
    });

    it("should consider PROCESSING and ON_HOLD payouts as pending", async () => {
      // Create PROCESSING payout
      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 400,
          fees: 1,
          netAmount: 399,
          method: "UAE_BANK",
          status: "PROCESSING", // Should be counted as pending
          accountHolderName: "Test User",
          bankName: "Processing Bank",
          accountNumber: "666",
        },
      });

      // Create ON_HOLD payout
      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 300,
          fees: 1,
          netAmount: 299,
          method: "UAE_BANK",
          status: "ON_HOLD", // Should be counted as pending
          accountHolderName: "Test User",
          bankName: "Hold Bank",
          accountNumber: "777",
        },
      });

      // Try to request $400 (with $700 already pending/processing, total would be $1100)
      const req = mockRequest(
        {
          amount: 400,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "New Bank",
          accountNumber: "888",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "You don't have enough funds. Your available balance is $300.00 after pending withdrawals",
      });
    });

    it("should show correct available balance in error message", async () => {
      // Create multiple pending payouts
      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 250,
          fees: 1,
          netAmount: 249,
          method: "UAE_BANK",
          status: "PENDING",
          accountHolderName: "Test User",
          bankName: "Bank A",
          accountNumber: "AAA",
        },
      });

      await prisma.payout.create({
        data: {
          userId: testUser.id,
          amount: 350,
          fees: 38,
          netAmount: 312,
          method: "INTERNATIONAL_BANK",
          status: "PROCESSING",
          accountHolderName: "Test User",
          bankName: "Bank B",
          accountNumber: "BBB",
          swiftCode: "TESTUS33",
          bankAddress: "Test Address",
        },
      });

      // Total pending: $600, Balance: $1000, Available: $400
      // Try to request $450
      const req = mockRequest(
        {
          amount: 450,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Bank C",
          accountNumber: "CCC",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "You don't have enough funds. Your available balance is $400.00 after pending withdrawals",
      });
    });

    it("should accept if amount is exactly $50", async () => {
      const req = mockRequest(
        {
          amount: 50,
          method: "UAE_BANK",
          accountHolderName: "Exact User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        exactUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          payout: expect.objectContaining({
            amount: 50,
          }),
        })
      );
    });

    it("should accept if amount equals full balance", async () => {
      const req = mockRequest(
        {
          amount: 1000,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            amount: 1000,
          }),
        })
      );
    });

    it("should reject negative amounts", async () => {
      const req = mockRequest(
        {
          amount: -100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Please enter a valid amount",
      });
    });

    it("should reject zero amount", async () => {
      const req = mockRequest(
        {
          amount: 0,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Please enter a valid amount",
      });
    });

    it("should reject amounts below $50", async () => {
      const req = mockRequest(
        {
          amount: 49.99,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "The minimum withdrawal amount is $50",
      });
    });
  });

  describe("Fee Calculations", () => {
    describe("UAE Bank Transfer", () => {
      it("should apply $1 fee for UAE bank transfer", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Emirates NBD",
            accountNumber: "AE070331234567890123456",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 1,
              netAmount: 99,
            }),
          })
        );
      });

      it("should calculate correct netAmount for $50 request", async () => {
        const req = mockRequest(
          {
            amount: 50,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Dubai Islamic Bank",
            accountNumber: "AE123456789",
          },
          exactUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 1,
              netAmount: 49,
            }),
          })
        );
      });

      it("should handle $1000 request correctly", async () => {
        const req = mockRequest(
          {
            amount: 1000,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Abu Dhabi Commercial Bank",
            accountNumber: "AE987654321",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 1,
              netAmount: 999,
            }),
          })
        );
      });
    });

    describe("International Bank Transfer", () => {
      it("should apply $38 fee for international transfer", async () => {
        const req = mockRequest(
          {
            amount: 200,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "John Smith",
            bankName: "Bank of America",
            accountNumber: "123456789",
            swiftCode: "BOFAUS3N",
            bankAddress: "100 Federal St, Boston, MA 02110, USA",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 38,
              netAmount: 162,
            }),
          })
        );
      });

      it("should calculate correct netAmount for $100 request", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "Jane Doe",
            bankName: "Chase Bank",
            accountNumber: "987654321",
            swiftCode: "CHASUS33",
            bankAddress: "New York, NY 10001, USA",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 38,
              netAmount: 62,
            }),
          })
        );
      });

      it("should handle $500 request correctly", async () => {
        const req = mockRequest(
          {
            amount: 500,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "Test International",
            bankName: "HSBC",
            accountNumber: "GB123456789",
            swiftCode: "HBUKGB4B",
            bankAddress: "London, UK",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 38,
              netAmount: 462,
            }),
          })
        );
      });
    });

    describe("USDT Transfer", () => {
      it("should apply $3 base fee + 3% for USDT", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "USDT",
            usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
            usdtNetwork: "TRC20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        // const expectedFees = 3 + (100 * 0.03); // $3 + 3% = $6
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 6,
              netAmount: 94,
            }),
          })
        );
      });

      it("should calculate fees correctly for $1000 USDT request", async () => {
        const req = mockRequest(
          {
            amount: 1000,
            method: "USDT",
            usdtWalletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
            usdtNetwork: "ERC20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        // const expectedFees = 3 + (1000 * 0.03); // $3 + 30 = $33
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 33,
              netAmount: 967,
            }),
          })
        );
      });

      it("should round fees to 2 decimal places", async () => {
        const req = mockRequest(
          {
            amount: 333.33,
            method: "USDT",
            usdtWalletAddress: "TRX123abc456def789",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        // const expectedFees = Math.round((3 + (333.33 * 0.03)) * 100) / 100; // $13.00
        // const expectedNet = Math.round((333.33 - expectedFees) * 100) / 100;

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 13,
              netAmount: 320.33,
            }),
          })
        );
      });

      it("should handle $50 minimum with USDT fees", async () => {
        const req = mockRequest(
          {
            amount: 50,
            method: "USDT",
            usdtWalletAddress: "TRX123abc456", // At least 10 characters
          },
          exactUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        // const expectedFees = 3 + (50 * 0.03); // $3 + 1.5 = $4.5
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            payout: expect.objectContaining({
              fees: 4.5,
              netAmount: 45.5,
            }),
          })
        );
      });
    });
  });

  describe("Payment Method Field Validation", () => {
    describe("UAE Bank Requirements", () => {
      it("should reject if accountHolderName is missing", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            bankName: "Emirates NBD",
            accountNumber: "AE123456789",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide your bank account holder name",
        });
      });

      it("should reject if bankName is missing", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            accountNumber: "AE123456789",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide your bank name",
        });
      });

      it("should reject if accountNumber is missing", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Emirates NBD",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide your bank account number",
        });
      });

      it("should reject if USDT fields are provided with UAE_BANK", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Emirates NBD",
            accountNumber: "AE123456789",
            usdtWalletAddress: "TRX123456789ABC", // Should not be here (valid length)
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "Please remove cryptocurrency wallet details for bank transfer",
        });
      });

      it("should accept with all required bank fields", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Ahmed Ali",
            bankName: "Dubai Islamic Bank",
            accountNumber: "AE070331234567890123456",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
          })
        );
      });

      it("should reject empty string values", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "",
            bankName: "Emirates NBD",
            accountNumber: "AE123456789",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide your bank account holder name",
        });
      });

      it("should NOT require swiftCode for UAE banks", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Emirates NBD",
            accountNumber: "AE123456789",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.swiftCode).toBeNull();
      });

      it("should NOT require bankAddress for UAE banks", async () => {
        const req = mockRequest(
          {
            amount: 100,
            method: "UAE_BANK",
            accountHolderName: "Test User",
            bankName: "Emirates NBD",
            accountNumber: "AE123456789",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.bankAddress).toBeNull();
      });
    });

    describe("International Bank Requirements", () => {
      it("should require all UAE fields PLUS swiftCode", async () => {
        const req = mockRequest(
          {
            amount: 200,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "John Smith",
            bankName: "Bank of America",
            accountNumber: "123456789",
            bankAddress: "New York, USA",
            // Missing swiftCode
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "Please provide your bank's SWIFT/BIC code for international transfer",
        });
      });

      it("should require bankAddress for international", async () => {
        const req = mockRequest(
          {
            amount: 200,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "John Smith",
            bankName: "Bank of America",
            accountNumber: "123456789",
            swiftCode: "BOFAUS3N",
            // Missing bankAddress
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "Please provide your bank's address for international transfer",
        });
      });

      it("should reject if USDT fields are provided", async () => {
        const req = mockRequest(
          {
            amount: 200,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "John Smith",
            bankName: "Bank of America",
            accountNumber: "123456789",
            swiftCode: "BOFAUS3N",
            bankAddress: "New York, USA",
            usdtWalletAddress: "TRX123456789ABC", // Should not be here (valid length)
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error:
            "Please remove cryptocurrency wallet details for bank transfer",
        });
      });

      it("should validate SWIFT code format (8 or 11 characters)", async () => {
        const req = mockRequest(
          {
            amount: 200,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "John Smith",
            bankName: "Bank of America",
            accountNumber: "123456789",
            swiftCode: "BOF", // Too short
            bankAddress: "New York, USA",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide a valid SWIFT/BIC code (8 or 11 characters)",
        });
      });

      it("should accept valid international bank transfer", async () => {
        const req = mockRequest(
          {
            amount: 200,
            method: "INTERNATIONAL_BANK",
            accountHolderName: "John Smith",
            bankName: "Bank of America",
            accountNumber: "123456789",
            swiftCode: "BOFAUS3N",
            bankAddress: "100 Federal St, Boston, MA 02110, USA",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
          })
        );
      });
    });

    describe("USDT Requirements", () => {
      it("should require usdtWalletAddress", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtNetwork: "TRC20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide your USDT wallet address",
        });
      });

      it("should accept with only wallet address", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.usdtNetwork).toBeNull();
      });

      it("should accept with wallet address + network", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
            usdtNetwork: "TRC20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.usdtNetwork).toBe("TRC20");
      });

      it("should reject if bank fields are provided", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
            accountHolderName: "Test User", // Should not be here
            bankName: "Test Bank", // Should not be here
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please remove bank details for cryptocurrency transfer",
        });
      });

      it("should validate wallet address format", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "invalid",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Please provide a valid USDT wallet address",
        });
      });

      it("should accept TRC20 network", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
            usdtNetwork: "TRC20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.usdtNetwork).toBe("TRC20");
      });

      it("should accept ERC20 network", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
            usdtNetwork: "ERC20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.usdtNetwork).toBe("ERC20");
      });

      it("should accept BEP20 network", async () => {
        const req = mockRequest(
          {
            amount: 150,
            method: "USDT",
            usdtWalletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
            usdtNetwork: "BEP20",
          },
          testUser.id
        );
        const res = mockResponse();

        // Uncomment when controller is implemented
        await RequestPayoutController.create(
          req as Request,
          res as Response,
          mockNext
        );

        expect(res.status).toHaveBeenCalledWith(201);
        const payout = await prisma.payout.findFirst({
          where: { userId: testUser.id },
        });
        expect(payout?.usdtNetwork).toBe("BEP20");
      });
    });
  });

  describe("Database Operations", () => {
    it("should create Payout record with PENDING status", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);

      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });

      expect(payout).toBeDefined();
      expect(payout?.status).toBe("PENDING");
      expect(payout?.amount).toBe(100);
      expect(payout?.method).toBe("UAE_BANK");
    });

    it("should NOT deduct amount from user balance immediately", async () => {
      const initialBalance = testUser.balance;

      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      // // Balance should remain unchanged
      expect(updatedUser?.balance).toBe(initialBalance);
    });

    it("should NOT create BalanceTransaction immediately", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      const transaction = await prisma.balanceTransaction.findFirst({
        where: {
          userId: testUser.id,
          type: "WITHDRAWAL",
        },
      });

      // // No transaction should be created until admin processes the payout
      expect(transaction).toBeNull();
    });

    it("should only reserve the amount in pending payouts", async () => {
      const initialBalance = testUser.balance;

      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      // // Check that balance is unchanged
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.balance).toBe(initialBalance);

      // // Check that payout is created as pending
      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });
      expect(payout?.status).toBe("PENDING");
      expect(payout?.amount).toBe(100);

      // // The amount should be considered when calculating available balance for future requests
      // // but not deducted from actual balance
    });

    it("should store correct fees in payout record", async () => {
      const req = mockRequest(
        {
          amount: 200,
          method: "INTERNATIONAL_BANK",
          accountHolderName: "John Smith",
          bankName: "Bank of America",
          accountNumber: "123456789",
          swiftCode: "BOFAUS3N",
          bankAddress: "New York, USA",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });

      expect(payout?.fees).toBe(38);
    });

    it("should store correct netAmount in payout record", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "USDT",
          usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });

      expect(payout?.netAmount).toBe(94); // 100 - (3 + 3)
    });
  });

  describe("Response Format", () => {
    it("should return success: true on valid request", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("should return payout object with all fields", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
          userNotes: "Test withdrawal",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            id: expect.any(Number),
            amount: 100,
            fees: 1,
            netAmount: 99,
            method: "UAE_BANK",
            status: "PENDING",
            createdAt: expect.any(Date),
            userNotes: "Test withdrawal",
          }),
        })
      );
    });

    it("should include user-friendly success message", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Your withdrawal request for $100.00 has been submitted successfully",
        })
      );
    });

    it("should format amounts to 2 decimal places", async () => {
      const req = mockRequest(
        {
          amount: 333.333,
          method: "USDT",
          usdtWalletAddress: "TRCabc123def456ghi789jkl012mno345pqr",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            amount: 333.33,
            fees: 13, // 3 + (333.33 * 0.03)
            netAmount: 320.33,
          }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should return user-friendly error for low balance", async () => {
      const req = mockRequest(
        {
          amount: 50, // Use valid amount to test balance check
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Test Bank",
          accountNumber: "123456789",
        },
        poorUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Your balance must be at least $50 to request a withdrawal",
      });
    });

    it("should return specific field validation errors", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Please provide your bank account holder name",
      });
    });

    it("should prevent duplicate submissions within 5 seconds", async () => {
      const requestData = {
        amount: 100,
        method: "UAE_BANK",
        accountHolderName: "Test User",
        bankName: "Emirates NBD",
        accountNumber: "AE123456789",
      };

      const req1 = mockRequest(requestData, testUser.id);
      const res1 = mockResponse();

      const req2 = mockRequest(requestData, testUser.id);
      const res2 = mockResponse();

      // Uncomment when controller is implemented
      // First request should succeed
      await RequestPayoutController.create(
        req1 as Request,
        res1 as Response,
        mockNext
      );
      expect(res1.status).toHaveBeenCalledWith(201);

      // Immediate duplicate should be prevented
      await RequestPayoutController.create(
        req2 as Request,
        res2 as Response,
        mockNext
      );
      expect(res2.status).toHaveBeenCalledWith(400);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining(
            "Please wait before submitting another withdrawal request"
          ),
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle maximum balance withdrawal", async () => {
      const req = mockRequest(
        {
          amount: 1000,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payout: expect.objectContaining({
            amount: 1000,
          }),
        })
      );

      // Balance should remain unchanged (not deducted immediately)
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(user?.balance).toBe(1000);
    });

    it("should trim whitespace from input fields", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "  Test User  ",
          bankName: "  Emirates NBD  ",
          accountNumber: "  AE123456789  ",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);

      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });

      expect(payout?.accountHolderName).toBe("Test User");
      expect(payout?.bankName).toBe("Emirates NBD");
      expect(payout?.accountNumber).toBe("AE123456789");
    });
  });

  describe("Optional Fields", () => {
    it("should accept request without userNotes", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });
      expect(payout?.userNotes).toBeNull();
    });

    it("should accept request with userNotes", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
          userNotes: "Monthly commission withdrawal",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });
      expect(payout?.userNotes).toBe("Monthly commission withdrawal");
    });

    it("should handle empty string userNotes as null", async () => {
      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
          userNotes: "",
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(201);
      const payout = await prisma.payout.findFirst({
        where: { userId: testUser.id },
      });
      expect(payout?.userNotes).toBeNull();
    });

    it("should limit userNotes to 1000 characters", async () => {
      const longNotes = "A".repeat(1001); // 1001 characters

      const req = mockRequest(
        {
          amount: 100,
          method: "UAE_BANK",
          accountHolderName: "Test User",
          bankName: "Emirates NBD",
          accountNumber: "AE123456789",
          userNotes: longNotes,
        },
        testUser.id
      );
      const res = mockResponse();

      // Uncomment when controller is implemented
      await RequestPayoutController.create(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Notes must be less than 1000 characters",
      });
    });
  });
});
