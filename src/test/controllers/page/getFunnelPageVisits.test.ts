import { describe, it, expect } from "vitest";
import { getFunnelPageVisits } from "../../../controllers/page";
import { setupPageControllerTest } from "./test-setup";
import { testPrisma } from "../../helpers";

describe("getFunnelPageVisits Controller", () => {
  const { getMockReq, getMockRes, setMockReq, getUser, getFunnel } = setupPageControllerTest();

  describe("getFunnelPageVisits", () => {
    it("should get funnel page visits successfully", async () => {
      const user = getUser();
      const funnel = getFunnel();

      // Create test pages with different visit counts
      const pages = await Promise.all([
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
            linkingId: null,
            visits: 0,
            funnelId: funnel.id,
          },
        }),
      ]);

      setMockReq({ 
        params: { funnelId: funnel.id.toString() },
        userId: user.id
      });

      await getFunnelPageVisits(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(200);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: pages[0].id,
            name: "Home Page",
            linkingId: "home",
            visits: 10,
          },
          {
            id: pages[1].id,
            name: "About Page",
            linkingId: "about",
            visits: 5,
          },
          {
            id: pages[2].id,
            name: "Contact Page",
            linkingId: null,
            visits: 0,
          },
        ],
        message: "Retrieved visit statistics for 3 pages with 15 total visits",
      });
    });

    it("should return 400 for invalid funnel ID", async () => {
      const user = getUser();

      setMockReq({ 
        params: { funnelId: "invalid" },
        userId: user.id
      });

      await getFunnelPageVisits(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Please provide a valid funnel ID",
      });
    });

    it("should return 404 for non-existent funnel", async () => {
      const user = getUser();

      setMockReq({ 
        params: { funnelId: "99999" },
        userId: user.id
      });

      await getFunnelPageVisits(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "The specified funnel could not be found or you don't have access to it",
      });
    });

    it("should return empty array for funnel with no pages", async () => {
      const user = getUser();

      // Create empty funnel
      const emptyFunnel = await testPrisma.funnel.create({
        data: {
          name: "Empty Funnel",
          userId: user.id,
        },
      });

      setMockReq({ 
        params: { funnelId: emptyFunnel.id.toString() },
        user
      });

      await getFunnelPageVisits(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(200);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: true,
        data: [],
        message: "Retrieved visit statistics for 0 pages with 0 total visits",
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      setMockReq({ 
        params: { funnelId: "1" },
        userId: undefined // Simulating unauthenticated request
      });

      await getFunnelPageVisits(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(401);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "Authentication required",
      });
    });

    it("should deny access to funnel owned by different user", async () => {
      const user = getUser();

      // Create another user and their funnel
      const otherUser = await testPrisma.user.create({
        data: {
          email: "other@example.com",
          name: "Other User",
          password: "hashedPassword",
        },
      });

      const otherUserFunnel = await testPrisma.funnel.create({
        data: {
          name: "Other User's Funnel",
          userId: otherUser.id,
        },
      });

      setMockReq({ 
        params: { funnelId: otherUserFunnel.id.toString() },
        userId: user.id
      });

      await getFunnelPageVisits(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: "The specified funnel could not be found or you don't have access to it",
      });
    });
  });
});