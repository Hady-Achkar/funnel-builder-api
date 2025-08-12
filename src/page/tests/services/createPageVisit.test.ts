import { describe, it, expect, beforeEach } from "vitest";
import { createPageVisit } from "../../services/createPageVisit";
import { TestHelpers, testPrisma } from "../../../test/helpers";
import { setPrismaClient } from "../../services";

describe("createPageVisit Service", () => {
  let user: any;
  let funnel: any;
  let page: any;

  beforeEach(async () => {
    // Set test Prisma client for page service
    setPrismaClient(testPrisma);
    
    // Create test user
    user = await TestHelpers.createTestUser();

    // Create test funnel (LIVE status needed for visit tracking)
    funnel = await TestHelpers.createTestFunnel(user.id, {
      name: "Test Funnel",
      status: "LIVE"
    });

    // Create test page
    page = await testPrisma.page.create({
      data: {
        name: "Test Page",
        content: "Page content",
        order: 1,
        linkingId: "test-page",
        visits: 0,
        funnelId: funnel.id,
      },
    });
  });

  it("should create a new session and record page visit for first-time visitor", async () => {
    const sessionId = "new-session-123";
    
    // Verify page exists before test
    const pageBeforeVisit = await testPrisma.page.findUnique({
      where: { id: page.id }
    });
    expect(pageBeforeVisit).toBeDefined();
    expect(pageBeforeVisit?.visits).toBe(0);
    
    const result = await createPageVisit({ pageId: page.id }, { sessionId });

    expect(result.message).toBeDefined();
    expect(result.message).toBe("New page visit recorded successfully");

    // Verify session was created
    const session = await testPrisma.session.findUnique({
      where: { sessionId }
    });
    expect(session).toBeTruthy();
    expect(session?.funnelId).toBe(funnel.id);
    expect(session?.visitedPages).toEqual([page.id]);

    // Verify page visit count incremented
    const updatedPage = await testPrisma.page.findUnique({
      where: { id: page.id }
    });
    expect(updatedPage).toBeDefined();
    expect(updatedPage?.visits).toBe(1);
  });

  it("should record page visit for existing session visiting new page", async () => {
    const sessionId = "existing-session-456";

    // Create existing session with visited pages
    await testPrisma.session.create({
      data: {
        sessionId,
        funnelId: funnel.id,
        visitedPages: [999], // Different page ID
        interactions: {}
      }
    });

    const result = await createPageVisit({ pageId: page.id }, { sessionId });

    expect(result.message).toBeDefined();
    expect(result.message).toBe("New page visit recorded successfully");

    // Verify page was added to visitedPages array
    const session = await testPrisma.session.findUnique({
      where: { sessionId }
    });
    expect(session?.visitedPages).toEqual([999, page.id]);

    // Verify page visit count incremented
    const updatedPage = await testPrisma.page.findUnique({
      where: { id: page.id }
    });
    expect(updatedPage?.visits).toBe(1);
  });

  it("should not increment visit count for duplicate visit in same session", async () => {
    const sessionId = "duplicate-session-789";

    // Create session that already visited this page
    await testPrisma.session.create({
      data: {
        sessionId,
        funnelId: funnel.id,
        visitedPages: [page.id],
        interactions: {}
      }
    });

    const result = await createPageVisit({ pageId: page.id }, { sessionId });

    expect(result.message).toBeDefined();
    expect(result.message).toBe("Page visit already recorded for this session");

    // Verify page visit count not incremented
    const updatedPage = await testPrisma.page.findUnique({
      where: { id: page.id }
    });
    expect(updatedPage?.visits).toBe(0);
  });

  it("should throw error for non-existent page", async () => {
    const sessionId = "test-session-999";
    const nonExistentPageId = 99999;

    await expect(createPageVisit({ pageId: nonExistentPageId }, { sessionId }))
      .rejects.toThrow("Page not found");
  });

  it("should handle concurrent visits from different sessions", async () => {
    const sessionId1 = "concurrent-session-1";
    const sessionId2 = "concurrent-session-2";

    // Simulate concurrent visits
    const [result1, result2] = await Promise.all([
      createPageVisit({ pageId: page.id }, { sessionId: sessionId1 }),
      createPageVisit({ pageId: page.id }, { sessionId: sessionId2 })
    ]);

    expect(result1.message).toBeDefined();
    expect(result2.message).toBeDefined();

    // Verify both sessions were created
    const session1 = await testPrisma.session.findUnique({
      where: { sessionId: sessionId1 }
    });
    const session2 = await testPrisma.session.findUnique({
      where: { sessionId: sessionId2 }
    });

    expect(session1?.visitedPages).toEqual([page.id]);
    expect(session2?.visitedPages).toEqual([page.id]);

    // Verify page visit count incremented for both visits
    const updatedPage = await testPrisma.page.findUnique({
      where: { id: page.id }
    });
    expect(updatedPage?.visits).toBe(2);
  });
});