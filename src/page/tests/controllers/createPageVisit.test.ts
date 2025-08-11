import { describe, it, expect } from "vitest";
import { createPageVisit } from "../../controllers";
import { setupPageControllerTest } from "./test-setup";
import { testPrisma } from "../../../test/helpers";

describe("createPageVisit Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } = setupPageControllerTest();

  describe("createPageVisit", () => {
    it("should create page visit successfully", async () => {
      const user = getUser();
      const funnel = getFunnel();

      // Make sure the funnel is LIVE for visit tracking
      await testPrisma.funnel.update({
        where: { id: funnel.id },
        data: { status: "LIVE" }
      });

      // Create a test page
      const page = await testPrisma.page.create({
        data: {
          name: "Test Page",
          content: "Page content",
          order: 1,
          linkingId: "test-page",
          visits: 0,
          funnelId: funnel.id
        }
      });
      
      // No authentication needed for page visits
      setMockReq({ 
        params: { pageId: page.id.toString() },
        body: { sessionId: "test-session-123" }
      });

      await createPageVisit(getMockReq(), getMockRes());

      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );

      // Verify the visit was recorded in database
      const updatedPage = await testPrisma.page.findUnique({
        where: { id: page.id }
      });
      expect(updatedPage?.visits).toBe(1);
    });

    it("should return 400 for invalid page ID", async () => {
      setMockReq({ 
        params: { pageId: "invalid" },
        body: { sessionId: "test-session-123" }
      });

      await createPageVisit(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid page ID",
      });
    });

    it("should return 404 for non-existent page", async () => {
      setMockReq({ 
        params: { pageId: "99999" }, // Non-existent page ID
        body: { sessionId: "test-session-456" }
      });

      await createPageVisit(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Page not found.",
      });
    });
  });
});