import { describe, it, expect } from "vitest";
import request from "supertest";
import { createFunnel, updateFunnel, deleteFunnel } from "../../controllers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.post("/funnels", createFunnel);
app.put("/funnels/:id", updateFunnel);
app.delete("/funnels/:id", deleteFunnel);

describe("Funnel Controller Error Handling", () => {
  const { getUser } = setupFunnelTest();

  describe("Authentication Errors", () => {
    it("returns 401 for missing authentication on create", async () => {
      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 for missing authentication on update", async () => {
      const response = await request(app)
        .put("/funnels/1")
        .send({ name: "Updated Funnel" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 for missing authentication on delete", async () => {
      const response = await request(app)
        .delete("/funnels/1");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Validation Errors", () => {
    it("returns 400 for invalid funnel ID format", async () => {
      const user = getUser();
      
      const response = await request(app)
        .put("/funnels/invalid-id")
        .send({ name: "Updated Funnel" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid funnel ID");
    });
  });
});