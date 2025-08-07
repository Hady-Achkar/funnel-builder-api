import { describe, it, expect } from "vitest";
import { createPage } from "../../../controllers/page";
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
          data: expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            linkingId: expect.any(String),
            order: expect.any(Number),
          }),
          message: expect.stringContaining("has been created successfully"),
        })
      );
    });

    it("should return 400 for invalid funnel ID", async () => {
      setMockReq({ params: { funnelId: "invalid" } });

      await createPage(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Please provide a valid funnel ID",
      });
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
        error: "The specified funnel could not be found or you don't have access to it",
      });
    });
  });
});