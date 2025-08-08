import { describe, it, expect } from "vitest";
import { getPageById } from "../../../controllers/page";
import { setupPageControllerTest } from "./test-setup";
import { testPrisma } from "../../helpers";

describe("getPageById Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } = setupPageControllerTest();

  describe("getPageById", () => {
    it("should get page by ID successfully", async () => {
      const user = getUser();
      const funnel = getFunnel();

      // Create a test page
      const page = await testPrisma.page.create({
        data: {
          name: "Test Page",
          content: "Page content",
          order: 1,
          linkingId: "test-page",
          funnelId: funnel.id
        }
      });
      
      setMockReq({ 
        userId: user.id,
        params: { id: page.id.toString() } 
      });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: page.id,
            name: "Test Page",
            content: "Page content",
            order: 1,
            linkingId: "test-page",
          })
        })
      );
    });

    it("should return 400 for invalid page ID", async () => {
      setMockReq({ params: { id: "invalid" } });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid page ID",
      });
    });

    it("should return 404 for non-existent page", async () => {
      const user = getUser();
      
      setMockReq({ 
        userId: user.id,
        params: { id: "99999" } // Non-existent page ID
      });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Page not found or you don't have access",
      });
    });
  });
});