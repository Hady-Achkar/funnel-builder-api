import { describe, it, expect } from "vitest";
import request from "supertest";
import { createFunnel } from "../../../controllers/funnel";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.post("/funnels", createFunnel);

describe("createFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("POST /funnels", () => {
    it("creates funnel successfully with provided name", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel", status: "DRAFT" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
      expect(response.body.message).toContain("created successfully");
    });

    it("creates funnel with auto-generated name when none provided", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ status: "DRAFT" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
      expect(response.body.message).toContain("created successfully");
    });

    it("returns 400 for invalid data", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ status: "INVALID_STATUS" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("returns 401 when no user ID provided", async () => {
      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});