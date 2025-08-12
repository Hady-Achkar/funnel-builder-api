import { describe, it, expect } from "vitest";
import request from "supertest";
import { deleteFunnel } from "../../controllers";
import { TestHelpers } from "../../../test/helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.delete("/funnels/:id", deleteFunnel);

describe("deleteFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("DELETE /funnels/:id", () => {
    it("deletes funnel successfully", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        name: "Test Funnel",
        status: "DRAFT"
      });

      const response = await request(app)
        .delete(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Funnel Test Funnel was deleted successfully");
      expect(response.body.data).toBeUndefined();
    });

    it("returns 400 for invalid funnel ID", async () => {
      const user = getUser();
      
      const response = await request(app)
        .delete("/funnels/invalid")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid input");
    });

    it("returns 404 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .delete("/funnels/999999")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel not found");
    });

    it("returns 400 for LIVE funnel", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        name: "Live Funnel",
        status: "LIVE"
      });

      const response = await request(app)
        .delete(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("live");
    });

    it("returns 401 when no user ID provided", async () => {
      const response = await request(app)
        .delete("/funnels/1");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});