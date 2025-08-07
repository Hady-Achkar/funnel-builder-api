import { describe, it, expect } from "vitest";
import request from "supertest";
import { getFunnelById } from "../../../controllers/funnel";
import { $Enums } from "../../../generated/prisma-client";
import { TestHelpers, testPrisma } from "../../helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.get("/funnels/:id", getFunnelById);

describe("getFunnelById Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("GET /funnels/:id", () => {
    it("should get funnel by id with pages and theme", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        status: $Enums.FunnelStatus.LIVE,
      });

      // Create test pages
      await testPrisma.page.createMany({
        data: [
          { name: "Page 1", order: 1, funnelId: funnel.id, visits: 0, content: "" },
          { name: "Page 2", order: 2, funnelId: funnel.id, visits: 0, content: "" },
        ],
      });

      const response = await request(app)
        .get(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(funnel.id);
      expect(response.body.pages).toHaveLength(2);
      expect(response.body.theme).toBeDefined();
      expect(response.body.pages[0].content).toBeUndefined(); // Content should be excluded
    });

    it("should return 404 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .get("/funnels/999")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel not found");
    });

    it("should return 403 for unauthorized access", async () => {
      const user = getUser();
      
      const otherUser = await TestHelpers.createTestUser();
      const funnel = await TestHelpers.createTestFunnel(otherUser.id);

      const response = await request(app)
        .get(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Access denied");
    });
  });
});