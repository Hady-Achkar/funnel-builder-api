import { describe, it, expect } from "vitest";
import request from "supertest";
import { updateFunnel } from "../../controllers";
import { TestHelpers } from "../../../test/helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.put("/funnels/:id", updateFunnel);

describe("updateFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("PUT /funnels/:id", () => {
    it("updates funnel successfully", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        name: "Original Funnel",
        status: "DRAFT",
      });

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send({ name: "Updated Funnel", status: "LIVE" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(funnel.id);
      expect(response.body.data.name).toBe("Updated Funnel");
      expect(response.body.message).toBe("Funnel Updated Funnel was updated successfully");
    });

    it("returns 400 for invalid funnel ID", async () => {
      const user = getUser();
      
      const response = await request(app)
        .put("/funnels/invalid")
        .send({ name: "Updated Name" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid input");
    });

    it("returns 404 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .put("/funnels/999999")
        .send({ name: "Updated Name" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel not found");
    });

    it("returns 400 for no changes", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        name: "Same Name",
        status: "DRAFT",
      });

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send({ name: "Same Name", status: "DRAFT" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Nothing to update");
    });

    it("returns 400 for empty update", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id);

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send({})
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Nothing to update");
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