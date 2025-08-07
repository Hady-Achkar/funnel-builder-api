import { describe, it, expect } from "vitest";
import request from "supertest";
import { updateFunnel } from "../../../controllers/funnel";
import { $Enums } from "../../../generated/prisma-client";
import { TestHelpers } from "../../helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.put("/funnels/:id", updateFunnel);

describe("updateFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("PUT /funnels/:id", () => {
    it("should update funnel successfully", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        status: $Enums.FunnelStatus.DRAFT,
      });
      const updateData = {
        name: "Updated Funnel",
        status: "LIVE",
      };

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send(updateData)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.status).toBe(updateData.status);
    });

    it("should return 404 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .put("/funnels/999")
        .send({ name: "Updated Name" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel not found");
    });

    it("should return 403 for unauthorized update", async () => {
      const user = getUser();
      
      const otherUser = await TestHelpers.createTestUser();
      const funnel = await TestHelpers.createTestFunnel(otherUser.id);

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send({ name: "Updated Name" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Access denied");
    });

    it("should return 400 for invalid status", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id);

      const response = await request(app)
        .put(`/funnels/${funnel.id}`)
        .send({ status: "INVALID_STATUS" })
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Status must be one of");
    });
  });
});