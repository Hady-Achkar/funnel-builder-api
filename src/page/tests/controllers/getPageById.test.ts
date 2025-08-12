import { describe, it, expect } from "vitest";
import { getPageById } from "../../controllers";
import { setupPageControllerTest } from "./test-setup";
import { testPrisma } from "../../../test/helpers";

describe("getPageById Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } =
    setupPageControllerTest();

  describe("getPageById", () => {
    it("should get page by ID successfully", async () => {
      const user = getUser();
      const funnel = getFunnel();

      const page = await testPrisma.page.create({
        data: {
          name: "Test Page",
          content: "Page content",
          order: 1,
          linkingId: "test-page",
          funnelId: funnel.id,
        },
      });

      setMockReq({
        userId: user.id,
        params: { id: page.id.toString() },
      });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(200);
      expect(getMockRes().json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: page.id,
            name: "Test Page",
            content: "Page content",
            order: 1,
            linkingId: "test-page",
          }),
          message: "Page retrieved successfully",
        })
      );
    });

    it("should return 401 for missing authentication", async () => {
      setMockReq({
        userId: undefined,
        params: { id: "1" },
      });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(401);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Authentication required",
      });
    });

    it("should return 404 for non-existent page", async () => {
      const user = getUser();

      setMockReq({
        userId: user.id,
        params: { id: "99999" },
      });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining("Page not found"),
      });
    });

    it("should handle validation errors", async () => {
      const user = getUser();

      setMockReq({
        userId: user.id,
        params: { id: "invalid" },
      });

      await getPageById(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid page ID",
      });
    });
  });
});
