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
import {
  PrismaClient,
  UserPlan,
  AddOnType,
  WorkspaceStatus,
  FunnelStatus,
  DomainType,
  DomainStatus,
  WorkspaceRole,
} from "../../generated/prisma-client";
import { AddonExpirationService } from "../../services/cron/addon-expiration";
import sgMail from "@sendgrid/mail";

// Mock SendGrid
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

const prismaClient = new PrismaClient();
setPrismaClient(prismaClient);
const prisma = getPrisma();

describe.skip("Addon Expiration Cron Job", () => {
  let testUser: any;
  let testWorkspace: any;

  beforeAll(async () => {
    // Verify test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(
      `\n🔧 Running addon expiration tests against database: ${dbName}\n`
    );

    // Set environment variables
    process.env.SENDGRID_API_KEY = "test-key";
    process.env.SENDGRID_FROM_EMAIL = "test@digitalsite.com";
    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.page.deleteMany({
      where: {
        funnel: {
          workspace: {
            owner: {
              email: { contains: "addon-expiration-test" },
            },
          },
        },
      },
    });

    await prisma.domain.deleteMany({
      where: {
        workspace: {
          owner: {
            email: { contains: "addon-expiration-test" },
          },
        },
      },
    });

    await prisma.funnel.deleteMany({
      where: {
        workspace: {
          owner: {
            email: { contains: "addon-expiration-test" },
          },
        },
      },
    });

    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          owner: {
            email: { contains: "addon-expiration-test" },
          },
        },
      },
    });

    await prisma.addOn.deleteMany({
      where: {
        user: {
          email: { contains: "addon-expiration-test" },
        },
      },
    });

    await prisma.workspace.deleteMany({
      where: {
        owner: {
          email: { contains: "addon-expiration-test" },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: "addon-expiration-test" },
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `addon-expiration-test-${Date.now()}@example.com`,
        username: `addontest${Date.now()}`,
        firstName: "Test",
        lastName: "User",
        password: "hashed-password",
        verified: true,
        plan: UserPlan.BUSINESS,
        balance: 1000,
      },
    });

    // Create test workspace
    testWorkspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: `test-workspace-${Date.now()}`,
        ownerId: testUser.id,
        planType: UserPlan.BUSINESS,
        status: WorkspaceStatus.ACTIVE,
      },
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  describe("EXTRA_WORKSPACE Expiration", () => {
    it("should set workspace to SUSPENDED when addon expires", async () => {
      // BUSINESS plan has 1 base workspace, create a 2nd workspace (the extra one)
      const extraWorkspace = await prisma.workspace.create({
        data: {
          name: "Extra Workspace",
          slug: `extra-workspace-${Date.now()}`,
          ownerId: testUser.id,
          planType: UserPlan.BUSINESS,
          status: WorkspaceStatus.ACTIVE,
        },
      });

      // Create an EXTRA_WORKSPACE addon that expired yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const addon = await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: null, // EXTRA_WORKSPACE is user-level
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          startDate: new Date(),
          endDate: yesterday,
        },
      });

      // Process expired addons
      const result = await AddonExpirationService.processExpiredAddons();

      // Verify results
      expect(result.success).toBe(true);
      expect(result.totalExpired).toBe(1);
      expect(result.totalProcessed).toBe(1);

      // Verify the NEWEST workspace (extra one) was suspended
      const updatedExtraWorkspace = await prisma.workspace.findUnique({
        where: { id: extraWorkspace.id },
      });
      expect(updatedExtraWorkspace?.status).toBe(WorkspaceStatus.SUSPENDED);

      // Verify the OLDEST workspace (base one) is still ACTIVE
      const updatedBaseWorkspace = await prisma.workspace.findUnique({
        where: { id: testWorkspace.id },
      });
      expect(updatedBaseWorkspace?.status).toBe(WorkspaceStatus.ACTIVE);

      // Verify addon status is still EXPIRED
      const updatedAddon = await prisma.addOn.findUnique({
        where: { id: addon.id },
      });
      expect(updatedAddon?.status).toBe("EXPIRED");
    });

    it("should set all funnels in workspace to ARCHIVED", async () => {
      // Create a 2nd workspace (the extra one) with funnels
      const extraWorkspace = await prisma.workspace.create({
        data: {
          name: "Extra Workspace",
          slug: `extra-workspace-${Date.now()}`,
          ownerId: testUser.id,
          planType: UserPlan.BUSINESS,
          status: WorkspaceStatus.ACTIVE,
        },
      });

      // Create funnels in the EXTRA workspace
      const funnel1 = await prisma.funnel.create({
        data: {
          name: "Funnel 1",
          slug: `funnel-1-${Date.now()}`,
          workspaceId: extraWorkspace.id,
          createdBy: testUser.id,
          status: FunnelStatus.LIVE,
        },
      });

      const funnel2 = await prisma.funnel.create({
        data: {
          name: "Funnel 2",
          slug: `funnel-2-${Date.now()}`,
          workspaceId: extraWorkspace.id,
          createdBy: testUser.id,
          status: FunnelStatus.LIVE,
        },
      });

      // Create expired addon
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: null, // EXTRA_WORKSPACE is user-level
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      // Process
      await AddonExpirationService.processExpiredAddons();

      // Verify all funnels in the extra workspace are ARCHIVED
      const updatedFunnel1 = await prisma.funnel.findUnique({
        where: { id: funnel1.id },
      });
      const updatedFunnel2 = await prisma.funnel.findUnique({
        where: { id: funnel2.id },
      });

      expect(updatedFunnel1?.status).toBe(FunnelStatus.ARCHIVED);
      expect(updatedFunnel2?.status).toBe(FunnelStatus.ARCHIVED);

      // Verify the extra workspace was suspended
      const updatedExtraWorkspace = await prisma.workspace.findUnique({
        where: { id: extraWorkspace.id },
      });
      expect(updatedExtraWorkspace?.status).toBe(WorkspaceStatus.SUSPENDED);
    });
  });

  describe("EXTRA_FUNNEL Expiration", () => {
    it("should archive excess funnels (newest first)", async () => {
      // Business plan allows 1 funnel, create 3 funnels
      const funnel1 = await prisma.funnel.create({
        data: {
          name: "Funnel 1 (oldest)",
          slug: `funnel-1-${Date.now()}`,
          workspaceId: testWorkspace.id,
          createdBy: testUser.id,
          status: FunnelStatus.LIVE,
          createdAt: new Date("2024-01-01"),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const funnel2 = await prisma.funnel.create({
        data: {
          name: "Funnel 2 (middle)",
          slug: `funnel-2-${Date.now()}`,
          workspaceId: testWorkspace.id,
          createdBy: testUser.id,
          status: FunnelStatus.LIVE,
          createdAt: new Date("2024-02-01"),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const funnel3 = await prisma.funnel.create({
        data: {
          name: "Funnel 3 (newest)",
          slug: `funnel-3-${Date.now()}`,
          workspaceId: testWorkspace.id,
          createdBy: testUser.id,
          status: FunnelStatus.LIVE,
          createdAt: new Date("2024-03-01"),
        },
      });

      // Create EXTRA_FUNNEL addon for 2 more funnels (total 3), now expired
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 2,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      // Process - should archive 2 newest funnels (funnel3 and funnel2)
      await AddonExpirationService.processExpiredAddons();

      const updatedFunnel1 = await prisma.funnel.findUnique({
        where: { id: funnel1.id },
      });
      const updatedFunnel2 = await prisma.funnel.findUnique({
        where: { id: funnel2.id },
      });
      const updatedFunnel3 = await prisma.funnel.findUnique({
        where: { id: funnel3.id },
      });

      // Oldest should remain active
      expect(updatedFunnel1?.status).toBe(FunnelStatus.LIVE);
      // Newest two should be archived
      expect(updatedFunnel2?.status).toBe(FunnelStatus.ARCHIVED);
      expect(updatedFunnel3?.status).toBe(FunnelStatus.ARCHIVED);
    });
  });

  describe("EXTRA_PAGE Expiration", () => {
    it("should clear linkingId for excess pages", async () => {
      // Create a funnel
      const funnel = await prisma.funnel.create({
        data: {
          name: "Test Funnel",
          slug: `test-funnel-${Date.now()}`,
          workspaceId: testWorkspace.id,
          createdBy: testUser.id,
          status: FunnelStatus.LIVE,
        },
      });

      // Base allocation is 35 pages, create 37 pages
      const pages = [];
      for (let i = 1; i <= 37; i++) {
        // Create progressively newer pages with unique timestamps
        const baseDate = new Date("2024-01-01T00:00:00.000Z");
        baseDate.setMinutes(baseDate.getMinutes() + i); // Add minutes to make each page unique

        const page = await prisma.page.create({
          data: {
            name: `Page ${i}`,
            funnelId: funnel.id,
            order: i,
            linkingId: `page-${i}`,
            createdAt: baseDate,
          },
        });
        pages.push(page);
      }

      // Create EXTRA_PAGE addon for 2 more pages (total 37), now expired
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_PAGE,
          quantity: 1, // 1 unit = 5 pages, so 35 + 5 = 40, but we have 37
          pricePerUnit: 5,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      // Process - should clear linkingId for 2 newest pages
      await AddonExpirationService.processExpiredAddons();

      // Check the pages
      const updatedPages = await prisma.page.findMany({
        where: { funnelId: funnel.id },
        orderBy: { createdAt: "asc" },
      });

      // First 35 should still have linkingId
      for (let i = 0; i < 35; i++) {
        expect(updatedPages[i].linkingId).not.toBeNull();
      }

      // Last 2 should have linkingId cleared
      expect(updatedPages[35].linkingId).toBeNull();
      expect(updatedPages[36].linkingId).toBeNull();
    });
  });

  describe("EXTRA_SUBDOMAIN Expiration", () => {
    it("should delete excess subdomains (newest first)", async () => {
      // Business plan allows 1 subdomain
      // Create workspace with Business plan
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: `test-workspace-subdomain-${Date.now()}`,
          ownerId: testUser.id,
          planType: UserPlan.BUSINESS,
          status: WorkspaceStatus.ACTIVE,
        },
      });

      // Create 3 subdomains (1 base + 2 from addon)
      const subdomains = [];
      for (let i = 1; i <= 3; i++) {
        const subdomain = await prisma.domain.create({
          data: {
            hostname: `subdomain-${i}.digitalsite.com`,
            workspaceId: workspace.id,
            createdBy: testUser.id,
            type: DomainType.SUBDOMAIN,
            status: DomainStatus.ACTIVE,
            createdAt: new Date(Date.now() + i * 1000), // Progressively newer
          },
        });
        subdomains.push(subdomain);
      }

      // Create EXTRA_SUBDOMAIN addon for 2 more subdomains, now expired
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: workspace.id,
          type: AddOnType.EXTRA_SUBDOMAIN,
          quantity: 2,
          pricePerUnit: 5,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(1);
      expect(result.totalProcessed).toBe(1);
      expect(result.results[0].resourcesAffected.domains).toBe(2);

      // Check that newest 2 subdomains were deleted
      const remainingDomains = await prisma.domain.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
      });

      expect(remainingDomains.length).toBe(1);
      // Oldest subdomain should remain
      expect(remainingDomains[0].hostname).toBe("subdomain-1.digitalsite.com");
    });
  });

  describe("EXTRA_CUSTOM_DOMAIN Expiration", () => {
    it("should delete excess custom domains (newest first)", async () => {
      // Business plan allows 1 custom domain
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: `test-workspace-customdomain-${Date.now()}`,
          ownerId: testUser.id,
          planType: UserPlan.BUSINESS,
          status: WorkspaceStatus.ACTIVE,
        },
      });

      // Create 3 custom domains (1 base + 2 from addon)
      const customDomains = [];
      for (let i = 1; i <= 3; i++) {
        const domain = await prisma.domain.create({
          data: {
            hostname: `example${i}.com`,
            workspaceId: workspace.id,
            createdBy: testUser.id,
            type: DomainType.CUSTOM_DOMAIN,
            status: DomainStatus.ACTIVE,
            createdAt: new Date(Date.now() + i * 1000), // Progressively newer
          },
        });
        customDomains.push(domain);
      }

      // Create EXTRA_CUSTOM_DOMAIN addon for 2 more domains, now expired
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: workspace.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 2,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(1);
      expect(result.totalProcessed).toBe(1);
      expect(result.results[0].resourcesAffected.domains).toBe(2);

      // Check that newest 2 custom domains were deleted
      const remainingDomains = await prisma.domain.findMany({
        where: { workspaceId: workspace.id, type: DomainType.CUSTOM_DOMAIN },
        orderBy: { createdAt: "asc" },
      });

      expect(remainingDomains.length).toBe(1);
      // Oldest domain should remain
      expect(remainingDomains[0].hostname).toBe("example1.com");
    });
  });

  describe("EXTRA_ADMIN Expiration", () => {
    it("should remove excess workspace members (newest first, never owner)", async () => {
      // Business plan allows 2 members total
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: `test-workspace-members-${Date.now()}`,
          ownerId: testUser.id,
          planType: UserPlan.BUSINESS,
          status: WorkspaceStatus.ACTIVE,
        },
      });

      // Create additional users to be members (4 total: 2 base + 2 from addon)
      const memberUsers = [];
      const timestamp = Date.now();
      for (let i = 1; i <= 4; i++) {
        const user = await prisma.user.create({
          data: {
            email: `member${i}-${timestamp}@example.com`,
            username: `member${i}-${timestamp}`,
            firstName: `Member${i}`,
            lastName: `User${i}`,
            password: "hashed",
          },
        });
        memberUsers.push(user);

        // Add as workspace member
        await prisma.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            role: WorkspaceRole.ADMIN,
            status: "ACTIVE",
            joinedAt: new Date(Date.now() + i * 1000), // Progressively newer
          },
        });
      }

      // Now we have 4 members (2 base + 2 from addon)
      // Create EXTRA_ADMIN addon for 2 more admins, now expired
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: workspace.id,
          type: AddOnType.EXTRA_ADMIN,
          quantity: 2,
          pricePerUnit: 15,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(1);
      expect(result.totalProcessed).toBe(1);
      expect(result.results[0].resourcesAffected.members).toBe(2);

      // Check that newest 2 members were removed
      const remainingMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id, status: "ACTIVE" },
        orderBy: { joinedAt: "asc" },
      });

      expect(remainingMembers.length).toBe(2);
      // Oldest 2 should remain
      expect(remainingMembers[0].userId).toBe(memberUsers[0].id);
      expect(remainingMembers[1].userId).toBe(memberUsers[1].id);
    });

    it("should never remove workspace owner", async () => {
      // Free plan allows 1 member total
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: `test-workspace-owner-${Date.now()}`,
          ownerId: testUser.id,
          planType: UserPlan.FREE,
          status: WorkspaceStatus.ACTIVE,
        },
      });

      // Create 2 workspace members (1 base + 1 from addon)
      const member1 = await prisma.user.create({
        data: {
          email: `member1-owner-test-${Date.now()}@example.com`,
          username: `member1-owner-${Date.now()}`,
          firstName: "Member1",
          lastName: "User1",
          password: "hashed",
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: member1.id,
          role: WorkspaceRole.ADMIN,
          status: "ACTIVE",
          joinedAt: new Date(Date.now() - 2000), // Older member
        },
      });

      const member2 = await prisma.user.create({
        data: {
          email: `member2-owner-test-${Date.now()}@example.com`,
          username: `member2-owner-${Date.now()}`,
          firstName: "Member2",
          lastName: "User2",
          password: "hashed",
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: member2.id,
          role: WorkspaceRole.ADMIN,
          status: "ACTIVE",
          joinedAt: new Date(Date.now() - 1000), // Newer member
        },
      });

      // Create addon that's now expired (allowed 1 extra member)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: workspace.id,
          type: AddOnType.EXTRA_ADMIN,
          quantity: 1,
          pricePerUnit: 15,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(1);
      expect(result.totalProcessed).toBe(1);
      expect(result.results[0].resourcesAffected.members).toBe(1);

      // Member2 (newest) should be removed, Member1 (oldest) should remain
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id, status: "ACTIVE" },
      });

      expect(members.length).toBe(1); // 1 member remains (Free plan allows 1)
      expect(members[0].userId).toBe(member1.id); // Oldest member remains

      // Verify owner still has access to workspace (owner is not a workspace member)
      const workspaceCheck = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });
      expect(workspaceCheck?.ownerId).toBe(testUser.id);
    });
  });

  describe("Warning Emails", () => {
    it("should send 7-day warning email when addon expires in 7 days", async () => {
      // Set endDate to exactly 7 days from now (set to end of day)
      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7,
        23,
        59,
        59,
        999
      );

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: sevenDaysFromNow,
          expirationReminders: {},
        },
      });

      const result = await AddonExpirationService.sendWarningEmails();

      expect(result.day7Sent).toBe(1);
      expect(result.day3Sent).toBe(0);
      expect(result.day1Sent).toBe(0);
      expect(sgMail.send).toHaveBeenCalled();
    });

    it("should not send duplicate 7-day warnings", async () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7,
        23,
        59,
        59,
        999
      );

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: sevenDaysFromNow,
          expirationReminders: { day7: true }, // Already sent
        },
      });

      const result = await AddonExpirationService.sendWarningEmails();

      expect(result.day7Sent).toBe(0);
    });

    it("should send 3-day warning email", async () => {
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 3,
        23,
        59,
        59,
        999
      );

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: threeDaysFromNow,
          expirationReminders: { day7: true },
        },
      });

      const result = await AddonExpirationService.sendWarningEmails();

      expect(result.day3Sent).toBe(1);
      expect(sgMail.send).toHaveBeenCalled();
    });

    it("should send 1-day warning email", async () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        23,
        59,
        59,
        999
      );

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_PAGE,
          quantity: 1,
          pricePerUnit: 5,
          status: "EXPIRED",
          endDate: tomorrow,
          expirationReminders: { day7: true, day3: true },
        },
      });

      const result = await AddonExpirationService.sendWarningEmails();

      expect(result.day1Sent).toBe(1);
      expect(sgMail.send).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle workspace with multiple expired addons", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Create multiple expired addons
      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_PAGE,
          quantity: 1,
          pricePerUnit: 5,
          status: "EXPIRED",
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(2);
      expect(result.totalProcessed).toBe(2);
    });

    it("should skip already EXPIRED addons", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED", // Already expired
          endDate: yesterday,
          expirationReminders: { resourcesProcessed: true }, // Resources already processed
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(1); // Found 1 expired addon
      expect(result.totalProcessed).toBe(0); // But skipped processing (already processed)
    });

    it("should handle addon with null endDate", async () => {
      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED",
          endDate: null, // No expiration
        },
      });

      const result = await AddonExpirationService.processExpiredAddons();

      expect(result.totalExpired).toBe(0);
    });
  });

  describe("Expiration Marking", () => {
    it("should mark expired subscriptions as EXPIRED", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Create test subscriptions
      const subscription1 = await prisma.subscription.create({
        data: {
          subscriptionId: `test-sub-1-${Date.now()}`,
          userId: testUser.id,
          subscriptionType: "BUSINESS",
          itemType: "PLAN",
          status: "ACTIVE", // Still ACTIVE but expired
          startsAt: new Date("2024-01-01"),
          endsAt: yesterday,
          intervalUnit: "MONTH",
          intervalCount: 1,
        },
      });

      const subscription2 = await prisma.subscription.create({
        data: {
          subscriptionId: `test-sub-2-${Date.now()}`,
          userId: testUser.id,
          subscriptionType: "AGENCY",
          itemType: "PLAN",
          status: "CANCELLED", // CANCELLED and expired
          startsAt: new Date("2024-01-01"),
          endsAt: yesterday,
          intervalUnit: "MONTH",
          intervalCount: 1,
        },
      });

      const result = await AddonExpirationService.markExpiredItems();

      expect(result.success).toBe(true);
      expect(result.subscriptions.totalMarked).toBe(2);
      expect(result.subscriptions.results).toHaveLength(2);

      // Check first subscription
      const sub1Result = result.subscriptions.results.find(
        (r) => r.subscriptionId === subscription1.id
      );
      expect(sub1Result?.success).toBe(true);
      expect(sub1Result?.previousStatus).toBe("ACTIVE");

      // Check second subscription
      const sub2Result = result.subscriptions.results.find(
        (r) => r.subscriptionId === subscription2.id
      );
      expect(sub2Result?.success).toBe(true);
      expect(sub2Result?.previousStatus).toBe("CANCELLED");

      // Verify database update
      const updatedSub1 = await prisma.subscription.findUnique({
        where: { id: subscription1.id },
      });
      const updatedSub2 = await prisma.subscription.findUnique({
        where: { id: subscription2.id },
      });

      expect(updatedSub1?.status).toBe("EXPIRED");
      expect(updatedSub2?.status).toBe("EXPIRED");
    });

    it("should mark expired addons as EXPIRED without processing", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Create test addons with various statuses
      const addon1 = await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 1,
          pricePerUnit: 10,
          status: "ACTIVE", // ACTIVE but expired - should be marked
          endDate: yesterday,
        },
      });

      const addon2 = await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_PAGE,
          quantity: 2,
          pricePerUnit: 5,
          status: "CANCELLED", // CANCELLED and expired - should be marked
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.markExpiredItems();

      expect(result.success).toBe(true);
      expect(result.addons.totalMarked).toBe(2);
      expect(result.addons.results).toHaveLength(2);

      // Check first addon
      const addon1Result = result.addons.results.find(
        (r) => r.addonId === addon1.id
      );
      expect(addon1Result?.success).toBe(true);
      expect(addon1Result?.previousStatus).toBe("ACTIVE");
      expect(addon1Result?.addonType).toBe(AddOnType.EXTRA_FUNNEL);

      // Check second addon
      const addon2Result = result.addons.results.find(
        (r) => r.addonId === addon2.id
      );
      expect(addon2Result?.success).toBe(true);
      expect(addon2Result?.previousStatus).toBe("CANCELLED");
      expect(addon2Result?.addonType).toBe(AddOnType.EXTRA_PAGE);

      // Verify database update
      const updatedAddon1 = await prisma.addOn.findUnique({
        where: { id: addon1.id },
      });
      const updatedAddon2 = await prisma.addOn.findUnique({
        where: { id: addon2.id },
      });

      expect(updatedAddon1?.status).toBe("EXPIRED");
      expect(updatedAddon2?.status).toBe("EXPIRED");
    });

    it("should skip already EXPIRED subscriptions and addons", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Create already expired items
      await prisma.subscription.create({
        data: {
          subscriptionId: `test-sub-expired-${Date.now()}`,
          userId: testUser.id,
          subscriptionType: "BUSINESS",
          itemType: "PLAN",
          status: "EXPIRED", // Already EXPIRED
          startsAt: new Date("2024-01-01"),
          endsAt: yesterday,
          intervalUnit: "MONTH",
          intervalCount: 1,
        },
      });

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 1,
          pricePerUnit: 10,
          status: "EXPIRED", // Already EXPIRED
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.markExpiredItems();

      expect(result.success).toBe(true);
      expect(result.subscriptions.totalMarked).toBe(0);
      expect(result.addons.totalMarked).toBe(0);
    });

    it("should handle subscriptions and addons with future endDate", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create items with future endDate (not expired yet)
      await prisma.subscription.create({
        data: {
          subscriptionId: `test-sub-future-${Date.now()}`,
          userId: testUser.id,
          subscriptionType: "BUSINESS",
          itemType: "PLAN",
          status: "ACTIVE",
          startsAt: new Date("2024-01-01"),
          endsAt: tomorrow, // Not expired yet
          intervalUnit: "MONTH",
          intervalCount: 1,
        },
      });

      await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 1,
          pricePerUnit: 10,
          status: "ACTIVE",
          endDate: null, // No expiration
        },
      });

      const result = await AddonExpirationService.markExpiredItems();

      expect(result.success).toBe(true);
      expect(result.subscriptions.totalMarked).toBe(0);
      expect(result.addons.totalMarked).toBe(0);
    });

    it("should handle both subscriptions and addons in single run", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Create both expired subscription and addon
      const subscription = await prisma.subscription.create({
        data: {
          subscriptionId: `test-sub-both-${Date.now()}`,
          userId: testUser.id,
          subscriptionType: "BUSINESS",
          itemType: "PLAN",
          status: "CANCELLED", // Will be marked as EXPIRED
          startsAt: new Date("2024-01-01"),
          endsAt: yesterday,
          intervalUnit: "MONTH",
          intervalCount: 1,
        },
      });

      const addon = await prisma.addOn.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          type: AddOnType.EXTRA_FUNNEL,
          quantity: 1,
          pricePerUnit: 10,
          status: "CANCELLED", // Will be marked as EXPIRED
          endDate: yesterday,
        },
      });

      const result = await AddonExpirationService.markExpiredItems();

      expect(result.success).toBe(true);
      expect(result.subscriptions.totalMarked).toBe(1);
      expect(result.addons.totalMarked).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify both are marked
      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });
      const updatedAddon = await prisma.addOn.findUnique({
        where: { id: addon.id },
      });

      expect(updatedSub?.status).toBe("EXPIRED");
      expect(updatedAddon?.status).toBe("EXPIRED");
    });
  });
});
