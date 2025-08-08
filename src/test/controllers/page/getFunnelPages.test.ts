import { describe, it, expect } from "vitest";
import { getFunnelPages } from "../../../controllers/page";
import { setupPageControllerTest } from "./test-setup";
import { testPrisma } from "../../helpers";

describe("getFunnelPages Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } = setupPageControllerTest();

  describe("getFunnelPages", () => {
    it("should get funnel pages successfully", async () => {
      const user = getUser();
      const funnel = getFunnel();

      // Create test pages
      await testPrisma.page.create({
        data: { name: "Page 1", order: 1, linkingId: "page1", content: "", funnelId: funnel.id }
      });
      await testPrisma.page.create({
        data: { name: "Page 2", order: 2, linkingId: "page2", content: "", funnelId: funnel.id }
      });
      
      setMockReq({ 
        userId: user.id,
        params: { funnelId: funnel.id.toString() } 
      });

      await getFunnelPages(getMockReq(), getMockRes());

      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ name: "Page 1" }),
            expect.objectContaining({ name: "Page 2" }),
          ])
        })
      );
    });

    it("should return 400 for invalid funnel ID", async () => {
      setMockReq({ params: { funnelId: "invalid" } });

      await getFunnelPages(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid funnel ID",
      });
    });

    it("should handle single page correctly", async () => {
      const user = getUser();
      const funnel = getFunnel();

      // Clean up any existing pages for this funnel first
      await testPrisma.page.deleteMany({ where: { funnelId: funnel.id } });

      // Create a single test page
      await testPrisma.page.create({
        data: { name: "Single Page", order: 1, linkingId: "single", content: "", funnelId: funnel.id }
      });
      
      setMockReq({ 
        userId: user.id,
        params: { funnelId: funnel.id.toString() } 
      });

      await getFunnelPages(getMockReq(), getMockRes());

      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ name: "Single Page" }),
          ])
        })
      );
    });
  });
});