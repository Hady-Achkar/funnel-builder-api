import { describe, it, expect } from "vitest";
import { createPageVisit } from "../../../controllers/page";
import { setupPageControllerTest } from "./test-setup";
import { testPrisma } from "../../helpers";

describe("createPageVisit Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } = setupPageControllerTest();

  describe("createPageVisit", () => {
    it("should create page visit successfully", async () => {
      const user = getUser();
      const funnel = getFunnel();

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

      expect(getMockRes().status).toHaveBeenCalledWith(200);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: true,
        message: "New page visit recorded successfully",
      });

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
        error: "Please provide a valid page ID",
      });
    });

    it("should return 404 for non-existent page", async () => {
      setMockReq({ 
        params: { pageId: "99999" }, // Non-existent page ID
        body: { sessionId: "test-session-456" }
      });

      await createPageVisit(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "The specified page could not be found or you don't have access to it",
      });
    });
  });
});