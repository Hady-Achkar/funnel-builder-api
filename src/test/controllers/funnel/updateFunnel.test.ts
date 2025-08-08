import { describe, it, expect } from "vitest";
import request from "supertest";
import { updateFunnel } from "../../../controllers/funnel";
import { TestHelpers } from "../../helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.put("/funnels/:id", updateFunnel);

describe("updateFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("PUT /funnels/:id", () => {
    it("updates funnel successfully", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        status: "DRAFT",
      });

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send({ name: "Updated Funnel", status: "LIVE" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.funnel.name).toBe("Updated Funnel");
      expect(response.body.funnel.status).toBe("LIVE");
      expect(response.body.message).toBe("Funnel updated successfully");
    });

    it("returns 400 for invalid funnel ID", async () => {
      const user = getUser();
      
      const response = await request(app)
        .put("/funnels/invalid")
        .send({ name: "Updated Name" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid funnel ID");
    });

    it("returns 400 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .put("/funnels/999")
        .send({ name: "Updated Name" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("returns 401 when no user ID provided", async () => {
      const response = await request(app)
        .put("/funnels/1")
        .send({ name: "Updated Name" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});