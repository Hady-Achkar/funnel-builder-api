import { describe, it, expect } from "vitest";
import request from "supertest";
import { createFunnel } from "../../controllers/create";
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
      expect(response.body.message).toContain("created successfully");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe("Test Funnel");
      expect(response.body.data.status).toBe("DRAFT");
    });

    it("creates funnel with auto-generated name when none provided", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ status: "DRAFT" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("created successfully");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/); // Date format
      expect(response.body.data.status).toBe("DRAFT");
    });

    it("creates funnel with default status when none provided", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("DRAFT");
    });

    it("returns 400 for empty string name", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ name: " " })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid input");
      expect(response.body.error).toContain("cannot be empty");
    });

    it("returns 400 for name too long", async () => {
      const user = getUser();
      const longName = "a".repeat(101);
      
      const response = await request(app)
        .post("/funnels")
        .send({ name: longName })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid input");
      expect(response.body.error).toContain("less than 100 characters");
    });

    it("returns 400 for invalid status", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel", status: "INVALID_STATUS" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid input");
      expect(response.body.error).toContain("DRAFT, LIVE, ARCHIVED, or SHARED");
    });

    it("returns 401 when no user ID provided", async () => {
      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Authentication required");
    });
  });
});