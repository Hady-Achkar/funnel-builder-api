import { describe, it, expect } from "vitest";
import request from "supertest";
import { getUserFunnels } from "../../controllers";
import { TestHelpers } from "../../../test/helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.get("/funnels", getUserFunnels);

describe("getUserFunnels Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("GET /funnels", () => {
    it("gets user funnels successfully", async () => {
      const user = getUser();

      const funnel1 = await TestHelpers.createTestFunnel(user.id, {
        name: "Funnel 1",
      });
      const funnel2 = await TestHelpers.createTestFunnel(user.id, {
        name: "Funnel 2",
      });

      const response = await request(app)
        .get("/funnels")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBeDefined();
      expect(response.body.data[0].name).toBeDefined();
      expect(response.body.data[0].status).toBeDefined();
    });

    it("returns empty array when user has no funnels", async () => {
      const user = getUser();

      const response = await request(app)
        .get("/funnels")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it("returns 401 when no user ID provided", async () => {
      const response = await request(app).get("/funnels");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
