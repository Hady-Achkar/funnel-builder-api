import { describe, it, expect, beforeEach } from "vitest";
import { getFunnelPageVisits } from "../../../services/page/getFunnelPageVisits";
import { TestHelpers, testPrisma } from "../../helpers";
import { setPrismaClient } from "../../../services/page";

describe("getFunnelPageVisits Service", () => {
  let user: any;
  let otherUser: any;
  let funnel: any;
  let pages: any[];

  beforeEach(async () => {
    // Set test Prisma client for page service
    setPrismaClient(testPrisma);
    
    // Create test users
    user = await TestHelpers.createTestUser();
    otherUser = await TestHelpers.createTestUser();

    // Create test funnel
    funnel = await TestHelpers.createTestFunnel(user.id, {
      name: "Test Funnel",
    });

    // Create test pages with different visit counts
    pages = await Promise.all([
      testPrisma.page.create({
        data: {
          name: "Home Page",
          content: "Home content",
          order: 1,
          linkingId: "home",
          visits: 10,
          funnelId: funnel.id,
        },
      }),
      testPrisma.page.create({
        data: {
          name: "About Page",
          content: "About content",
          order: 2,
          linkingId: "about",
          visits: 5,
          funnelId: funnel.id,
        },
      }),
      testPrisma.page.create({
        data: {
          name: "Contact Page",
          content: "Contact content",
          order: 3,
          linkingId: "contact",
          visits: 0,
          funnelId: funnel.id,
        },
      }),
    ]);
  });

  it("should get page visits for all pages in funnel", async () => {
    // Verify funnel exists before test
    expect(funnel).toBeDefined();
    expect(user).toBeDefined();
    
    const result = await getFunnelPageVisits(funnel.id, user.id);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.message).toBe("Retrieved visit statistics for 3 pages with 15 total visits");

    // Verify pages are ordered by order field
    expect(result.data[0]).toEqual({
      id: pages[0].id,
      name: "Home Page",
      linkingId: "home",
      visits: 10,
    });
    expect(result.data[1]).toEqual({
      id: pages[1].id,
      name: "About Page",
      linkingId: "about",
      visits: 5,
    });
    expect(result.data[2]).toEqual({
      id: pages[2].id,
      name: "Contact Page",
      linkingId: "contact",
      visits: 0,
    });
  });

  it("should include pages with 0 visits", async () => {
    const result = await getFunnelPageVisits(funnel.id, user.id);

    expect(result.success).toBe(true);
    const zeroVisitPage = result.data.find(page => page.visits === 0);
    expect(zeroVisitPage).toBeTruthy();
    expect(zeroVisitPage?.name).toBe("Contact Page");
  });

  it("should return empty array for funnel with no pages", async () => {
    // Create empty funnel
    const emptyFunnel = await testPrisma.funnel.create({
      data: {
        name: "Empty Funnel",
        userId: user.id,
      },
    });

    const result = await getFunnelPageVisits(emptyFunnel.id, user.id);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.message).toBe("Retrieved visit statistics for 0 pages with 0 total visits");
  });

  it("should throw error for non-existent funnel", async () => {
    const nonExistentFunnelId = 99999;

    await expect(getFunnelPageVisits(nonExistentFunnelId, user.id))
      .rejects.toThrow("Funnel not found or you don't have access to it");
  });

  it("should throw error when user doesn't have access to funnel", async () => {
    await expect(getFunnelPageVisits(funnel.id, otherUser.id))
      .rejects.toThrow("Funnel not found or you don't have access to it");
  });

  it("should calculate correct total visits", async () => {
    const result = await getFunnelPageVisits(funnel.id, user.id);

    expect(result.success).toBe(true);
    
    const calculatedTotal = result.data.reduce((sum, page) => sum + page.visits, 0);
    expect(calculatedTotal).toBe(15); // 10 + 5 + 0
    expect(result.message).toContain("15 total visits");
  });

  it("should handle funnel with large number of pages", async () => {
    // Create additional pages
    const additionalPages = [];
    for (let i = 4; i <= 10; i++) {
      additionalPages.push(
        await testPrisma.page.create({
          data: {
            name: `Page ${i}`,
            content: `Content ${i}`,
            order: i,
            linkingId: `page-${i}`,
            visits: i,
            funnelId: funnel.id,
          },
        })
      );
    }

    const result = await getFunnelPageVisits(funnel.id, user.id);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(10); // 3 original + 7 additional
    
    // Verify pages are ordered correctly (by creation order in this test)
    // First three pages have order 1, 2, 3 and additional pages have order 4-10
    // Since pages are ordered by 'order' field, visits should increase accordingly
    for (let i = 0; i < result.data.length - 1; i++) {
      const currentPage = result.data[i];
      const nextPage = result.data[i + 1];
      // Pages are ordered by 'order' field, and in this test visits = order for additional pages
      if (i >= 2) { // For pages after the initial 3
        expect(currentPage.visits).toBeLessThan(nextPage.visits);
      }
    }
  });

  it("should handle pages with null linkingId", async () => {
    // Create page with null linkingId
    const pageWithNullLinkingId = await testPrisma.page.create({
      data: {
        name: "Page Without Linking ID",
        content: "Content",
        order: 4,
        linkingId: null,
        visits: 3,
        funnelId: funnel.id,
      },
    });

    const result = await getFunnelPageVisits(funnel.id, user.id);

    expect(result.success).toBe(true);
    const pageWithNull = result.data.find(page => page.id === pageWithNullLinkingId.id);
    expect(pageWithNull).toBeTruthy();
    expect(pageWithNull?.linkingId).toBeNull();
    expect(pageWithNull?.visits).toBe(3);
  });
});