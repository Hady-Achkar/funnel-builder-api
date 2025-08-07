import { describe, it, expect } from "vitest";
import request from "supertest";
import { deleteFunnel } from "../../../controllers/funnel";
import { $Enums } from "../../../generated/prisma-client";
import { TestHelpers, testPrisma } from "../../helpers";
import { createTestApp, setupFunnelTest } from "./test-setup";

const app = createTestApp();
app.delete("/funnels/:id", deleteFunnel);

describe("deleteFunnel Controller", () => {
  const { getUser } = setupFunnelTest();

  describe("DELETE /funnels/:id", () => {
    it("should delete funnel successfully", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id);

      const response = await request(app)
        .delete(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(funnel.id);
      expect(response.body.name).toBe(funnel.name);
      expect(response.body.message).toBe(
        `Funnel "${funnel.name}" has been deleted successfully`
      );

      // Verify funnel is deleted
      const deletedFunnel = await testPrisma.funnel.findUnique({
        where: { id: funnel.id },
      });
      expect(deletedFunnel).toBeNull();
    });

    it("should prevent deletion of LIVE funnel", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id, {
        status: $Enums.FunnelStatus.LIVE,
      });

      const response = await request(app)
        .delete(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Cannot delete a live funnel. Please change the status first."
      );

      // Verify funnel still exists
      const existingFunnel = await testPrisma.funnel.findUnique({
        where: { id: funnel.id },
      });
      expect(existingFunnel).not.toBeNull();
    });

    it("should delete funnel pages when deleting funnel", async () => {
      const user = getUser();
      
      const funnel = await TestHelpers.createTestFunnel(user.id);

      // Create additional pages
      await testPrisma.page.create({
        data: {
          name: "Additional Page",
          content: "test content",
          order: 2,
          funnelId: funnel.id,
        },
      });

      const pagesBeforeDeletion = await testPrisma.page.findMany({
        where: { funnelId: funnel.id },
      });
      expect(pagesBeforeDeletion.length).toBeGreaterThan(0);

      const response = await request(app)
        .delete(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify all pages are deleted
      const pagesAfterDeletion = await testPrisma.page.findMany({
        where: { funnelId: funnel.id },
      });
      expect(pagesAfterDeletion.length).toBe(0);
    });

    it("should return 404 for non-existent funnel", async () => {
      const user = getUser();
      
      const response = await request(app)
        .delete("/funnels/999")
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Funnel not found");
    });

    it("should return 403 for unauthorized deletion", async () => {
      const user = getUser();
      
      const otherUser = await TestHelpers.createTestUser();
      const funnel = await TestHelpers.createTestFunnel(otherUser.id);

      const response = await request(app)
        .delete(`/funnels/${funnel.id}`)
        .set("x-user-id", user.id.toString());

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Access denied");
    });
  });
});