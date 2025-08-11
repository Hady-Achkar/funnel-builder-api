import { describe, it, expect } from "vitest";
import { createPage } from "../../controllers";
import { setupPageControllerTest } from "./test-setup";

describe("createPage Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } = setupPageControllerTest();

  describe("createPage", () => {
    it("should create a page with funnelId from URL params", async () => {
      const user = getUser();
      const funnel = getFunnel();
      
      setMockReq({ 
        userId: user.id,
        params: { funnelId: funnel.id.toString() } 
      });

      await createPage(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(201);
      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("created successfully"),
        })
      );
    });

    it("should return 401 for missing authentication", async () => {
      setMockReq({ 
        userId: undefined,
        params: { funnelId: "1" } 
      });

      await createPage(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(401);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Authentication required",
      });
    });

    it("should return 400 for invalid funnel ID (handled by Zod)", async () => {
      const user = getUser();
      setMockReq({ 
        userId: user.id,
        params: { funnelId: "0" } // Invalid - must be positive
      });

      await createPage(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("Invalid input"),
        })
      );
    });

    it("should handle funnel not found errors", async () => {
      const user = getUser();
      
      setMockReq({ 
        userId: user.id,
        params: { funnelId: "99999" } // Non-existent funnel ID
      });

      await createPage(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Funnel not found",
      });
    });

    it("should create page with custom data", async () => {
      const user = getUser();
      const funnel = getFunnel();
      
      setMockReq({ 
        userId: user.id,
        params: { funnelId: funnel.id.toString() },
        body: {
          name: "Custom Page",
          content: "<h1>Custom Content</h1>",
          linkingId: "custom-page",
          seoTitle: "Custom SEO Title"
        }
      });

      await createPage(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(201);
      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Custom Page created successfully"),
        })
      );
    });
  });
});