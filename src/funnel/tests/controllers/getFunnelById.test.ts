import { describe, it, expect } from "vitest";
import request from "supertest";
import { getFunnelById } from "../../controllers";
import { TestHelpers } from "../../../test/helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.get("/funnels/:id", getFunnelById);

describe("getFunnelById Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("GET /funnels/:id", () => {
    it("gets funnel by ID successfully", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id);

      const response = await request(app)
        .get(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(funnel.id);
      expect(response.body.data.name).toBe(funnel.name);
      expect(response.body.data.userId).toBe(user.id);
    });

    it("returns 400 for invalid funnel ID", async () => {
      const user = getUser();
      
      const response = await request(app)
        .get("/funnels/invalid")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid input");
    });

    it("returns 404 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .get("/funnels/999999")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel not found");
    });

    it("returns 401 when no user ID provided", async () => {
      const response = await request(app)
        .get("/funnels/1");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});