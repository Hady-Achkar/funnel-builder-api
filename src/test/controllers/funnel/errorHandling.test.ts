import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { getUserFunnels, createFunnel } from "../../../controllers/funnel";
import { FunnelService } from "../../../services/funnel";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.get("/funnels", getUserFunnels);
app.post("/funnels", createFunnel);

describe("Funnel Controller Error Handling", () => {
  const { getUser } = setupFunnelTest();

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      const user = getUser();
      
      // Mock service to throw database error
      vi.spyOn(FunnelService, "getUserFunnels").mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .get("/funnels")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Failed to fetch funnels. Please try again later."
      );
    });

    it("should handle service validation errors", async () => {
      const user = getUser();
      
      // Mock service to throw validation error
      vi.spyOn(FunnelService, "createFunnel").mockRejectedValue(
        new Error("Funnel name must be unique")
      );

      const response = await request(app)
        .post("/funnels")
        .send({ name: "Test Funnel", status: "DRAFT" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel name must be unique");
    });
  });
});