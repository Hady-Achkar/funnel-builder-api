import { describe, it, expect } from "vitest";
import request from "supertest";
import { getUserFunnels } from "../../../controllers/funnel";
import { $Enums } from "../../../generated/prisma-client";
import { TestHelpers, testPrisma } from "../../helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.get("/funnels", getUserFunnels);

describe("getUserFunnels Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("GET /funnels", () => {
    it("should get all funnels with pagination", async () => {
      const user = getUser();
      
      // Create test funnels
      await TestHelpers.createTestFunnel(user.id, {
        name: "Funnel 1",
        status: $Enums.FunnelStatus.LIVE,
      });
      await TestHelpers.createTestFunnel(user.id, {
        name: "Funnel 2",
        status: $Enums.FunnelStatus.DRAFT,
      });

      const response = await request(app)
        .get("/funnels")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.funnels).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it("should sort funnels by name ascending", async () => {
      const user = getUser();
      
      await TestHelpers.createTestFunnel(user.id, {
        name: "Z Funnel",
        status: $Enums.FunnelStatus.LIVE,
      });
      await TestHelpers.createTestFunnel(user.id, {
        name: "A Funnel",
        status: $Enums.FunnelStatus.LIVE,
      });

      const response = await request(app)
        .get("/funnels?sortBy=name&sortOrder=asc")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.funnels[0].name).toBe("A Funnel");
      expect(response.body.funnels[1].name).toBe("Z Funnel");
    });

    it("should handle pagination correctly", async () => {
      const user = getUser();
      
      // Create 5 test funnels
      for (let i = 1; i <= 5; i++) {
        await TestHelpers.createTestFunnel(user.id, {
          name: `Funnel ${i}`,
          status: $Enums.FunnelStatus.LIVE,
        });
      }

      const response = await request(app)
        .get("/funnels?page=2&limit=2")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.funnels).toHaveLength(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });
});