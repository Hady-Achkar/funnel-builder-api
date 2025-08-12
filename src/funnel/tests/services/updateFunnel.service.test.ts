import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FunnelService } from "../../services";
import { cacheService } from "../../../services/cache/cache.service";
import { TestHelpers, testPrisma } from "../../../test/helpers";
import { $Enums } from "../../../generated/prisma-client";

describe("FunnelService.updateFunnel", () => {
  let testUser: any;
  let testFunnel: any;

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser();
    testFunnel = await TestHelpers.createTestFunnel(testUser.id, {
      name: "Original Funnel",
      status: $Enums.FunnelStatus.DRAFT,
    });

    // Clear any existing cache
    await cacheService.del(`user:${testUser.id}:funnel:${testFunnel.id}:full`);
    await cacheService.del(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`
    );
  });

  afterEach(async () => {
    // Clean up cache
    await cacheService.del(`user:${testUser.id}:funnel:${testFunnel.id}:full`);
    await cacheService.del(
      `user:${testUser.id}:funnel:${testFunnel.id}:summary`
    );
  });

  it("should require user authentication", async () => {
    await expect(
      FunnelService.updateFunnel(testFunnel.id, 0, { name: "New Name" })
    ).rejects.toThrow("Please provide userId.");
  });

  it("should validate funnelId", async () => {
    await expect(
      FunnelService.updateFunnel(-1, testUser.id, { name: "New Name" })
    ).rejects.toThrow("Invalid input");
  });

  it("should throw error for non-existent funnel", async () => {
    await expect(
      FunnelService.updateFunnel(999999, testUser.id, { name: "New Name" })
    ).rejects.toThrow("Funnel not found.");
  });

  it("should throw access denied for unauthorized user", async () => {
    const otherUser = await TestHelpers.createTestUser();
    await expect(
      FunnelService.updateFunnel(testFunnel.id, otherUser.id, {
        name: "New Name",
      })
    ).rejects.toThrow("You can't update this funnel.");
  });

  it("should throw error when no data provided", async () => {
    await expect(
      FunnelService.updateFunnel(testFunnel.id, testUser.id, {})
    ).rejects.toThrow("Nothing to update.");
  });

  it("should throw error when same data provided (no changes)", async () => {
    await expect(
      FunnelService.updateFunnel(testFunnel.id, testUser.id, {
        name: "Original Funnel",
        status: $Enums.FunnelStatus.DRAFT,
      })
    ).rejects.toThrow("Nothing to update.");
  });

  it("should update funnel name successfully", async () => {
    const result = await FunnelService.updateFunnel(
      testFunnel.id,
      testUser.id,
      {
        name: "Updated Funnel Name",
      }
    );

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe(testFunnel.id);
    expect(result.data.name).toBe("Updated Funnel Name");

    // Verify in database
    const updatedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(updatedFunnel?.name).toBe("Updated Funnel Name");
    expect(updatedFunnel?.status).toBe($Enums.FunnelStatus.DRAFT); // Should remain unchanged
  });

  it("should update funnel status successfully", async () => {
    const result = await FunnelService.updateFunnel(
      testFunnel.id,
      testUser.id,
      {
        status: $Enums.FunnelStatus.LIVE,
      }
    );

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe(testFunnel.id);
    expect(result.data.name).toBe("Original Funnel"); // Should remain unchanged

    // Verify in database
    const updatedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(updatedFunnel?.status).toBe($Enums.FunnelStatus.LIVE);
    expect(updatedFunnel?.name).toBe("Original Funnel");
  });

  it("should update both name and status successfully", async () => {
    const result = await FunnelService.updateFunnel(
      testFunnel.id,
      testUser.id,
      {
        name: "New Name",
        status: $Enums.FunnelStatus.ARCHIVED,
      }
    );

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe(testFunnel.id);
    expect(result.data.name).toBe("New Name");

    // Verify in database
    const updatedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(updatedFunnel?.name).toBe("New Name");
    expect(updatedFunnel?.status).toBe($Enums.FunnelStatus.ARCHIVED);
  });

  it("should trim funnel name", async () => {
    const result = await FunnelService.updateFunnel(
      testFunnel.id,
      testUser.id,
      {
        name: "  Trimmed Name  ",
      }
    );

    expect(result.data.name).toBe("Trimmed Name");

    // Verify in database
    const updatedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(updatedFunnel?.name).toBe("Trimmed Name");
  });

  it("should validate funnel name length", async () => {
    const longName = "a".repeat(101);
    await expect(
      FunnelService.updateFunnel(testFunnel.id, testUser.id, {
        name: longName,
      })
    ).rejects.toThrow("Invalid input");
  });

  it("should validate empty funnel name", async () => {
    await expect(
      FunnelService.updateFunnel(testFunnel.id, testUser.id, {
        name: "",
      })
    ).rejects.toThrow("Invalid input");
  });

  it("should validate invalid status", async () => {
    await expect(
      FunnelService.updateFunnel(testFunnel.id, testUser.id, {
        status: "INVALID_STATUS" as any,
      })
    ).rejects.toThrow("Invalid input");
  });

  it("should only update changed fields (partial name change)", async () => {
    await FunnelService.updateFunnel(testFunnel.id, testUser.id, {
      name: "Changed Name",
      status: $Enums.FunnelStatus.DRAFT, // Same as original
    });

    // Verify only name was updated in database
    const updatedFunnel = await testPrisma.funnel.findUnique({
      where: { id: testFunnel.id },
    });
    expect(updatedFunnel?.name).toBe("Changed Name");
    expect(updatedFunnel?.status).toBe($Enums.FunnelStatus.DRAFT);
  });
});
