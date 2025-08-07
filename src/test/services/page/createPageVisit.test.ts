import { describe, it, expect, beforeEach } from "vitest";
import { createPageVisit } from "../../../services/page/createPageVisit";
import { testPrisma } from "../../helpers";

describe("createPageVisit Service", () => {
  let user: any;
  let funnel: any;
  let page: any;

  beforeEach(async () => {
    // Clean up test data
    await testPrisma.session.deleteMany();
    await testPrisma.page.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.user.deleteMany();

    // Create test user
    user = await testPrisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
      },
    });

    // Create test funnel
    funnel = await testPrisma.funnel.create({
      data: {
        name: "Test Funnel",
        userId: user.id,
      },
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
    
    const result = await createPageVisit(page.id, sessionId);

    expect(result.success).toBe(true);
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

    const result = await createPageVisit(page.id, sessionId);

    expect(result.success).toBe(true);
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

    const result = await createPageVisit(page.id, sessionId);

    expect(result.success).toBe(true);
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

    await expect(createPageVisit(nonExistentPageId, sessionId))
      .rejects.toThrow("Page not found");
  });

  it("should handle concurrent visits from different sessions", async () => {
    const sessionId1 = "concurrent-session-1";
    const sessionId2 = "concurrent-session-2";

    // Simulate concurrent visits
    const [result1, result2] = await Promise.all([
      createPageVisit(page.id, sessionId1),
      createPageVisit(page.id, sessionId2)
    ]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

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