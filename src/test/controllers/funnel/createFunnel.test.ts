import { describe, it, expect } from "vitest";
import request from "supertest";
import { createFunnel } from "../../../controllers/funnel";
import { TestHelpers, testPrisma } from "../../helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.post("/funnels", createFunnel);

describe("createFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("POST /funnels", () => {
    it("should create funnel successfully", async () => {
      const user = getUser();
      
      const funnelData = {
        name: "Test Funnel",
        status: "DRAFT",
      };

      const response = await request(app)
        .post("/funnels")
        .send(funnelData)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe(funnelData.name);
      expect(response.body.status).toBe(funnelData.status);
      expect(response.body.userId).toBe(user.id);
    });

    it("should return 400 for invalid status", async () => {
      const user = getUser();
      
      const funnelData = {
        name: "Test Funnel",
        status: "INVALID_STATUS",
      };

      const response = await request(app)
        .post("/funnels")
        .send(funnelData)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Status must be one of");
    });

    it("should return 400 for missing required fields", async () => {
      const user = getUser();
      
      const response = await request(app)
        .post("/funnels")
        .send({})
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when maximum funnel limit is reached", async () => {
      const user = getUser();
      
      // Set user's maximum funnels to 2
      await testPrisma.user.update({
        where: { id: user.id },
        data: { maximumFunnels: 2 },
      });

      // Create 2 funnels to reach the limit
      await TestHelpers.createTestFunnel(user.id, { name: "Funnel 1" });
      await TestHelpers.createTestFunnel(user.id, { name: "Funnel 2" });

      const funnelData = {
        name: "Test Funnel - Should Fail",
        status: "DRAFT",
      };

      const response = await request(app)
        .post("/funnels")
        .send(funnelData)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Maximum funnel limit reached. You can create up to 2 funnels."
      );
    });

    it("should allow creating funnel when under maximum limit", async () => {
      const user = getUser();
      
      // Set user's maximum funnels to 3
      await testPrisma.user.update({
        where: { id: user.id },
        data: { maximumFunnels: 3 },
      });

      // Create 1 funnel (under the limit)
      await TestHelpers.createTestFunnel(user.id, { name: "Existing Funnel" });

      const funnelData = {
        name: "New Funnel - Should Succeed",
        status: "DRAFT",
      };

      const response = await request(app)
        .post("/funnels")
        .send(funnelData)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe(funnelData.name);
    });

    it("should allow creating funnel when no maximum limit is set", async () => {
      const user = getUser();
      
      // Ensure user has no maximum limit (null)
      await testPrisma.user.update({
        where: { id: user.id },
        data: { maximumFunnels: null },
      });

      // Create multiple funnels to test no limit
      await TestHelpers.createTestFunnel(user.id, { name: "Funnel 1" });
      await TestHelpers.createTestFunnel(user.id, { name: "Funnel 2" });
      await TestHelpers.createTestFunnel(user.id, { name: "Funnel 3" });

      const funnelData = {
        name: "Unlimited Funnel",
        status: "DRAFT",
      };

      const response = await request(app)
        .post("/funnels")
        .send(funnelData)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe(funnelData.name);
    });
  });
});