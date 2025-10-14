import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { PaymentWebhookService } from "../../services/subscription/webhook";
import * as setPasswordEmail from "../../helpers/subscription/emails/set-password";
import * as affiliateCongratulationsEmail from "../../helpers/subscription/emails/affiliate/congratulations";
import * as verificationEmail from "../../helpers/auth/emails/register";

describe("PLAN_PURCHASE with Affiliate Link - Integration Tests", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  // Test data IDs
  let affiliateOwnerId: number;
  let affiliateLinkId: number;
  let workspaceId: number;

  // Spy on email functions
  const sendSetPasswordEmailSpy = vi.spyOn(
    setPasswordEmail,
    "sendSetPasswordEmail"
  );
  const sendAffiliateCongratulationsEmailSpy = vi.spyOn(
    affiliateCongratulationsEmail,
    "sendAffiliateCongratulationsEmail"
  );
  const sendVerificationEmailSpy = vi.spyOn(
    verificationEmail,
    "sendVerificationEmail"
  );

  beforeAll(async () => {
    // Verify we're using test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running affiliate tests against database: ${dbName}\n`);

    // Mock email functions to prevent actual email sending
    sendSetPasswordEmailSpy.mockResolvedValue(undefined);
    sendAffiliateCongratulationsEmailSpy.mockResolvedValue(undefined);
    sendVerificationEmailSpy.mockResolvedValue(undefined);

    // Create affiliate owner (AGENCY plan, Level 1)
    const affiliateOwner = await prisma.user.create({
      data: {
        email: `affiliate-owner-${Date.now()}@example.com`,
        username: `affiliateowner${Date.now()}`,
        firstName: "Affiliate",
        lastName: "Owner",
        password: "hashed-password",
        plan: "AGENCY",
        verified: true,
        partnerLevel: 1,
        totalSales: 0,
        balance: 0,
        commissionPercentage: 5,
      },
    });
    affiliateOwnerId = affiliateOwner.id;

    // Create workspace for affiliate owner
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Affiliate Workspace",
        slug: `test-affiliate-workspace-${Date.now()}`,
        ownerId: affiliateOwnerId,
        planType: "AGENCY",
        status: "ACTIVE",
      },
    });
    workspaceId = workspace.id;

    // Create affiliate link
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        name: "Test Affiliate Link",
        token: `test-token-${Date.now()}`,
        itemType: "BUSINESS",
        userId: affiliateOwnerId,
        workspaceId: workspaceId,
        clickCount: 0,
        totalAmount: 0,
      },
    });
    affiliateLinkId = affiliateLink.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all test data in correct order (respecting foreign keys)

    // 1. Delete domains AND Cloudflare DNS records (they reference workspaces)
    const domainsToDelete = await prisma.domain.findMany({
      where: {
        workspace: {
          OR: [
            { id: workspaceId },
            {
              ownerId: {
                in: await prisma.user
                  .findMany({
                    where: { referralLinkUsedId: affiliateLinkId },
                    select: { id: true },
                  })
                  .then((users) => users.map((u) => u.id)),
              },
            },
          ],
        },
      },
      select: {
        id: true,
        hostname: true,
        cloudflareRecordId: true,
        cloudflareZoneId: true,
        type: true,
      },
    });

    // Delete Cloudflare DNS records for subdomains
    const { deleteARecord } = await import(
      "../../services/domain/delete/utils/cloudflare-cleanup"
    );

    for (const domain of domainsToDelete) {
      if (domain.type === "SUBDOMAIN" && domain.cloudflareRecordId && domain.cloudflareZoneId) {
        try {
          await deleteARecord(domain.cloudflareRecordId, domain.cloudflareZoneId);
          console.log(`✅ Deleted Cloudflare DNS record for: ${domain.hostname}`);
        } catch (error: any) {
          console.error(
            `⚠️ Failed to delete Cloudflare DNS for ${domain.hostname}:`,
            error.message
          );
          // Continue cleanup even if Cloudflare deletion fails
        }
      }
    }

    // Delete domains from database
    await prisma.domain.deleteMany({
      where: {
        id: {
          in: domainsToDelete.map((d) => d.id),
        },
      },
    });

    // 2. Delete workspace clones
    await prisma.workspaceClone.deleteMany({
      where: {
        OR: [
          { sellerId: affiliateOwnerId },
          {
            buyerId: {
              in: await prisma.user
                .findMany({
                  where: { referralLinkUsedId: affiliateLinkId },
                  select: { id: true },
                })
                .then((users) => users.map((u) => u.id)),
            },
          },
        ],
      },
    });

    // 3. Delete balance transactions
    await prisma.balanceTransaction.deleteMany({
      where: { userId: affiliateOwnerId },
    });

    // 4. Delete subscriptions
    await prisma.subscription.deleteMany({
      where: {
        user: {
          referralLinkUsedId: affiliateLinkId,
        },
      },
    });

    // 5. Delete payments
    await prisma.payment.deleteMany({
      where: { affiliateLinkId: affiliateLinkId },
    });

    // 6. Delete cloned workspaces (owned by buyers)
    await prisma.workspace.deleteMany({
      where: {
        owner: {
          referralLinkUsedId: affiliateLinkId,
        },
      },
    });

    // 7. Delete buyers (users who used affiliate link)
    await prisma.user.deleteMany({
      where: { referralLinkUsedId: affiliateLinkId },
    });

    // 8. Delete affiliate link
    await prisma.affiliateLink.deleteMany({
      where: { id: affiliateLinkId },
    });

    // 9. Delete source workspace
    await prisma.workspace.deleteMany({
      where: { id: workspaceId },
    });

    // 10. Delete affiliate owner
    await prisma.user.deleteMany({
      where: { id: affiliateOwnerId },
    });

    await prismaClient.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to create webhook payload
   */
  const createWebhookPayload = (
    email: string,
    planType: string,
    frequency: string = "annually",
    frequencyInterval: number = 1,
    subscriptionId: string | null = null
  ) => ({
    status: "captured",
    id: `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    event_type: "charge.succeeded",
    amount: 115.0,
    amount_currency: "USD",
    subscription_id: subscriptionId,
    custom_data: {
      details: {
        email,
        firstName: "Test",
        lastName: "User",
        planType,
        frequency,
        frequencyInterval,
        paymentType: "PLAN_PURCHASE",
        trialDays: 0,
        trialEndDate: new Date().toISOString(),
      },
      affiliateLink: {
        id: affiliateLinkId,
        token: `test-token-${affiliateLinkId}`,
        userId: affiliateOwnerId,
        itemType: "BUSINESS",
        commissionPercentage: 53, // Ignored - use from database
      },
    },
    created_date: new Date().toISOString(),
    customer_details: {
      name: "Test User",
      email,
      phone_number: "+1234567890",
    },
    payment_method: {
      card_id: null,
      type: "CREDIT VISA",
      card_holder_name: "Test User",
      card_last4: "4242",
      card_expiry_month: "12",
      card_expiry_year: "2028",
      origin: "International card",
    },
    next_payment_date: null,
  });

  describe("Success Cases - Commission Eligible", () => {
    it("should process AGENCY invites BUSINESS with $50 commission (Level 1)", async () => {
      const email = `buyer-level1-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      const result = await PaymentWebhookService.processWebhook(payload);

      // Verify webhook response
      expect(result.received).toBe(true);
      expect(result.data?.userId).toBeDefined();
      expect(result.data?.paymentId).toBeDefined();
      expect(result.data?.subscriptionId).toBeDefined();

      // Verify user created with referralLinkUsedId
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(user).toBeDefined();
      expect(user?.referralLinkUsedId).toBe(affiliateLinkId);
      expect(user?.plan).toBe("BUSINESS");
      expect(user?.trialStartDate).toBeDefined();
      expect(user?.trialEndDate).toBeDefined();

      // Verify payment created with affiliate data
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment).toBeDefined();
      expect(payment?.affiliateLinkId).toBe(affiliateLinkId);
      expect(payment?.level1AffiliateAmount).toBe(50); // Level 1 commission
      expect(payment?.affiliatePaid).toBe(true);

      // Verify subscription created
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user?.id },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.status).toBe("ACTIVE");

      // Verify affiliate owner balance updated
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);
      expect(affiliateOwner?.totalSales).toBe(1);

      // Verify BalanceTransaction created
      const transaction = await prisma.balanceTransaction.findFirst({
        where: {
          userId: affiliateOwnerId,
          referenceId: payment?.id,
        },
      });
      expect(transaction).toBeDefined();
      expect(transaction?.type).toBe("COMMISSION");
      expect(transaction?.amount).toBe(50);
      expect(transaction?.balanceBefore).toBe(0);
      expect(transaction?.balanceAfter).toBe(50);

      // Verify emails sent
      expect(sendVerificationEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendSetPasswordEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendAffiliateCongratulationsEmailSpy).toHaveBeenCalledTimes(1);

      // Verify affiliate link stats updated
      const affiliateLink = await prisma.affiliateLink.findUnique({
        where: { id: affiliateLinkId },
      });
      expect(affiliateLink?.totalAmount).toBe(50);
    });

    it("should upgrade to Level 2 after 10th sale", async () => {
      // Set affiliate owner to 9 sales
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { totalSales: 9, partnerLevel: 1 },
      });

      const email = `buyer-10th-sale-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify partner level upgraded to 2 with 10% commission
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.partnerLevel).toBe(2);
      expect(affiliateOwner?.totalSales).toBe(10);
      expect(affiliateOwner?.commissionPercentage).toBe(10); // Updated to 10%
    });

    it("should pay $75 commission at Level 2", async () => {
      // Set affiliate owner to Level 2
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { totalSales: 15, partnerLevel: 2, balance: 0 },
      });

      const email = `buyer-level2-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify $75 commission
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.level1AffiliateAmount).toBe(75);

      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(75);
    });

    it("should upgrade to Level 3 after 50th sale with 15% commission", async () => {
      // Set affiliate owner to 49 sales
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: {
          totalSales: 49,
          partnerLevel: 2,
          balance: 0,
          commissionPercentage: 5,
        },
      });

      const email = `buyer-50th-sale-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify partner level upgraded to 3 with 15% commission
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.partnerLevel).toBe(3);
      expect(affiliateOwner?.totalSales).toBe(50);
      expect(affiliateOwner?.commissionPercentage).toBe(15);
    });

    it("should pay $100 commission at Level 3", async () => {
      // Set affiliate owner to Level 3
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: {
          totalSales: 60,
          partnerLevel: 3,
          balance: 0,
          commissionPercentage: 15,
        },
      });

      const email = `buyer-level3-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify $100 commission
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.level1AffiliateAmount).toBe(100);

      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(100);
    });
  });

  describe("No Commission Cases", () => {
    beforeEach(async () => {
      // Reset affiliate owner
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { totalSales: 0, partnerLevel: 1, balance: 0, plan: "AGENCY" },
      });
    });

    it("should NOT pay commission for AGENCY invites AGENCY", async () => {
      const email = `buyer-agency-to-agency-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "AGENCY");

      await PaymentWebhookService.processWebhook(payload);

      // Verify payment created but NO commission
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.level1AffiliateAmount).toBe(0);
      expect(payment?.affiliatePaid).toBe(false);

      // Verify affiliate balance NOT updated
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(0);
      expect(affiliateOwner?.totalSales).toBe(0);

      // Verify NO congratulations email sent
      expect(sendAffiliateCongratulationsEmailSpy).not.toHaveBeenCalled();
    });

    it("should NOT pay commission for BUSINESS invites BUSINESS", async () => {
      // Change affiliate owner to BUSINESS plan
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { plan: "BUSINESS" },
      });

      const email = `buyer-business-to-business-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify NO commission
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.level1AffiliateAmount).toBe(0);

      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(0);
    });

    it("should NOT pay commission for FREE invites BUSINESS", async () => {
      // Change affiliate owner to FREE plan
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { plan: "FREE" },
      });

      const email = `buyer-free-to-business-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify NO commission
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.level1AffiliateAmount).toBe(0);

      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(0);
    });

    it("should NOT pay commission for AGENCY invites FREE", async () => {
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { plan: "AGENCY" },
      });

      const email = `buyer-agency-to-free-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "FREE");

      await PaymentWebhookService.processWebhook(payload);

      // Verify NO commission
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.level1AffiliateAmount).toBe(0);

      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(0);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    beforeEach(async () => {
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { totalSales: 0, partnerLevel: 1, balance: 0, plan: "AGENCY" },
      });
    });

    it("should prevent duplicate transaction processing", async () => {
      const email = `buyer-duplicate-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      // Process first time
      await PaymentWebhookService.processWebhook(payload);

      // Process again with same transaction ID
      const result = await PaymentWebhookService.processWebhook(payload);

      // Should be ignored
      expect(result.ignored).toBe(true);
      expect(result.reason).toContain("already processed");

      // Verify only 1 payment created
      const payments = await prisma.payment.findMany({
        where: { transactionId: payload.id },
      });
      expect(payments).toHaveLength(1);

      // Verify balance only updated once
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50); // Not $100
    });

    it("should handle verification email failure gracefully", async () => {
      sendVerificationEmailSpy.mockRejectedValueOnce(
        new Error("Email service down")
      );

      const email = `buyer-email-fail-1-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      // Should not throw error
      const result = await PaymentWebhookService.processWebhook(payload);

      // Should still succeed
      expect(result.received).toBe(true);

      // User should still be created
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(user).toBeDefined();

      // Commission should still be processed
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);
    });

    it("should handle set password email failure gracefully", async () => {
      sendSetPasswordEmailSpy.mockRejectedValueOnce(
        new Error("Email service down")
      );

      const email = `buyer-email-fail-2-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      // Should not throw error
      const result = await PaymentWebhookService.processWebhook(payload);

      expect(result.received).toBe(true);

      // Commission should still be processed
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);
    });

    it("should handle congratulations email failure gracefully", async () => {
      sendAffiliateCongratulationsEmailSpy.mockRejectedValueOnce(
        new Error("Email service down")
      );

      const email = `buyer-email-fail-3-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      // Should not throw error
      const result = await PaymentWebhookService.processWebhook(payload);

      expect(result.received).toBe(true);

      // Commission should still be processed
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);

      // Payment should be marked as paid
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment?.affiliatePaid).toBe(true);
    });

    it("should handle existing user with affiliate link", async () => {
      const email = `existing-buyer-${Date.now()}@example.com`;

      // Create user first
      await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: `existingbuyer${Date.now()}`,
          firstName: "Existing",
          lastName: "Buyer",
          password: "hashed-password",
          plan: "BUSINESS",
          verified: true,
        },
      });

      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify NO new user emails sent
      expect(sendVerificationEmailSpy).not.toHaveBeenCalled();
      expect(sendSetPasswordEmailSpy).not.toHaveBeenCalled();

      // Verify payment and subscription still created
      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment).toBeDefined();

      // Verify commission still processed
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);
    });
  });

  describe("User & Subscription Verification", () => {
    beforeEach(async () => {
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { totalSales: 0, partnerLevel: 1, balance: 0, plan: "AGENCY" },
      });
    });

    it("should set trialStartDate and trialEndDate correctly", async () => {
      const email = `buyer-trial-dates-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS", "annually", 1);

      await PaymentWebhookService.processWebhook(payload);

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      expect(user?.trialStartDate).toBeDefined();
      expect(user?.trialEndDate).toBeDefined();

      // Trial end should be 1 year from trial start
      const trialStart = user?.trialStartDate!;
      const trialEnd = user?.trialEndDate!;
      const diffDays = Math.floor(
        (trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBeGreaterThanOrEqual(364); // Account for leap years
      expect(diffDays).toBeLessThanOrEqual(366);
    });

    it("should create subscription with correct intervalUnit and intervalCount", async () => {
      const email = `buyer-subscription-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS", "monthly", 2);

      const result = await PaymentWebhookService.processWebhook(payload);

      const subscription = await prisma.subscription.findFirst({
        where: { userId: result.data?.userId },
      });

      expect(subscription?.intervalUnit).toBe("MONTH");
      expect(subscription?.intervalCount).toBe(2);
      expect(subscription?.subscriptionType).toBe("BUSINESS");
    });

    it("should send 2 emails to new user and 1 to affiliate owner", async () => {
      const email = `buyer-emails-${Date.now()}@example.com`;
      const payload = createWebhookPayload(email, "BUSINESS");

      await PaymentWebhookService.processWebhook(payload);

      // Verify buyer receives 2 emails
      expect(sendVerificationEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendSetPasswordEmailSpy).toHaveBeenCalledTimes(1);

      // Verify affiliate owner receives 1 email
      expect(sendAffiliateCongratulationsEmailSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Workspace Cloning with Affiliate Link", () => {
    beforeEach(async () => {
      await prisma.user.update({
        where: { id: affiliateOwnerId },
        data: { totalSales: 0, partnerLevel: 1, balance: 0, plan: "AGENCY" },
      });
    });

    it("should clone workspace when provided, OR process payment successfully if cloning fails", async () => {
      const email = `buyer-workspace-clone-${Date.now()}@example.com`;

      // Create webhook payload with workspace data
      const payload = createWebhookPayload(email, "BUSINESS");
      (payload.custom_data as any).workspace = {
        id: workspaceId,
        name: "Test Affiliate Workspace",
        slug: `test-affiliate-workspace-${affiliateLinkId}`,
        sellerId: affiliateOwnerId,
      };

      const result = await PaymentWebhookService.processWebhook(payload);

      // Verify webhook processed successfully
      expect(result.received).toBe(true);
      expect(result.data?.userId).toBeDefined();

      const buyerId = result.data?.userId!;

      // Verify buyer created with referralLinkUsed
      const buyer = await prisma.user.findUnique({
        where: { id: buyerId },
        include: {
          ownedWorkspaces: true,
          referralLinkUsed: true,
        },
      });

      expect(buyer).toBeDefined();
      expect(buyer?.referralLinkUsedId).toBe(affiliateLinkId);
      expect(buyer?.referralLinkUsed?.id).toBe(affiliateLinkId);

      // Verify commission processed
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);
      expect(affiliateOwner?.totalSales).toBe(1);

      // Check if workspace cloning succeeded or failed
      const workspaceClone = await prisma.workspaceClone.findFirst({
        where: {
          buyerId: buyerId,
          sellerId: affiliateOwnerId,
        },
        include: {
          sourceWorkspace: true,
          clonedWorkspace: true,
          seller: true,
          buyer: true,
        },
      });

      if (workspaceClone) {
        // Workspace cloning SUCCEEDED (Cloudflare API call succeeded)
        console.log("✅ Workspace cloning succeeded");

        // Verify cloned workspace exists in buyer's ownedWorkspaces
        expect(buyer?.ownedWorkspaces).toHaveLength(1);
        const clonedWorkspace = buyer?.ownedWorkspaces[0];
        expect(clonedWorkspace?.name).toBe("Test Affiliate Workspace");
        expect(clonedWorkspace?.ownerId).toBe(buyerId);
        expect(clonedWorkspace?.planType).toBe("BUSINESS");

        // Verify WorkspaceClone record
        expect(workspaceClone.sourceWorkspaceId).toBe(workspaceId);
        expect(workspaceClone.clonedWorkspaceId).toBe(clonedWorkspace?.id);
        expect(workspaceClone.sellerId).toBe(affiliateOwnerId);
        expect(workspaceClone.buyerId).toBe(buyerId);

        // Verify workspace subdomain created
        const workspaceDomains = await prisma.domain.findMany({
          where: { workspaceId: clonedWorkspace?.id },
        });

        expect(workspaceDomains.length).toBeGreaterThanOrEqual(1);
        expect(workspaceDomains[0].type).toBe("SUBDOMAIN");
        expect(workspaceDomains[0].status).toBe("ACTIVE");
        expect(workspaceDomains[0].hostname).toContain(clonedWorkspace?.slug);

        // Verify payment linked to workspace clone
        const payment = await prisma.payment.findUnique({
          where: { transactionId: payload.id },
          include: { workspaceClone: true },
        });

        expect(payment?.workspaceClone).toBeDefined();
        expect(payment?.workspaceClone?.clonedWorkspaceId).toBe(
          clonedWorkspace?.id
        );
      } else {
        // Workspace cloning FAILED (likely Cloudflare DNS conflict)
        console.log(
          "⚠️ Workspace cloning failed (likely Cloudflare DNS conflict), but payment processed successfully"
        );

        // Verify buyer has NO owned workspaces (cloning failed and was cleaned up)
        expect(buyer?.ownedWorkspaces).toHaveLength(0);

        // Verify NO WorkspaceClone record
        expect(workspaceClone).toBeNull();

        // Verify payment NOT linked to workspace clone
        const payment = await prisma.payment.findUnique({
          where: { transactionId: payload.id },
          include: { workspaceClone: true },
        });

        expect(payment?.workspaceClone).toBeNull();
      }

      // Regardless of cloning success/failure, verify these are ALWAYS true:
      // - User created
      // - Password reset token set
      // - Emails sent
      // - Commission processed
      // - Payment created
      // - Subscription created
      expect(buyer).toBeDefined();
      expect(buyer?.email).toBe(email.toLowerCase());
      expect(buyer?.plan).toBe("BUSINESS");

      const payment = await prisma.payment.findUnique({
        where: { transactionId: payload.id },
      });
      expect(payment).toBeDefined();
      expect(payment?.affiliateLinkId).toBe(affiliateLinkId);
      expect(payment?.level1AffiliateAmount).toBe(50);

      const subscription = await prisma.subscription.findFirst({
        where: { userId: buyerId },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.status).toBe("ACTIVE");
    });

    it("should continue processing even if workspace cloning fails", async () => {
      const email = `buyer-clone-fail-${Date.now()}@example.com`;

      // Create webhook payload with invalid workspace ID
      const payload = createWebhookPayload(email, "BUSINESS");
      (payload.custom_data as any).workspace = {
        id: 999999, // Non-existent workspace
        name: "Invalid Workspace",
        slug: "invalid-workspace",
        sellerId: affiliateOwnerId,
      };

      // Should succeed despite invalid workspace (cloning is optional)
      const result = await PaymentWebhookService.processWebhook(payload);
      expect(result.received).toBe(true);

      const buyerId = result.data?.userId!;

      // Verify buyer WAS created (payment succeeds even if cloning fails)
      const buyer = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(buyer).toBeDefined();
      expect(buyer?.id).toBe(buyerId);

      // Verify commission WAS paid (payment succeeds even if cloning fails)
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwnerId },
      });
      expect(affiliateOwner?.balance).toBe(50);
      expect(affiliateOwner?.totalSales).toBe(1);

      // Verify NO workspace cloned (cloning failed silently)
      const workspaceClone = await prisma.workspaceClone.findFirst({
        where: { buyerId: buyerId },
      });
      expect(workspaceClone).toBeNull();

      // Verify buyer has NO owned workspaces
      const buyerWorkspaces = await prisma.workspace.findMany({
        where: { ownerId: buyerId },
      });
      expect(buyerWorkspaces).toHaveLength(0);
    });
  });
});
