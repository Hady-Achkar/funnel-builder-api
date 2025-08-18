import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateTemplate } from "../service/update.service";
import { TestHelpers, testPrisma } from "../../../test/helpers";

// Mock the helpers module
vi.mock("../../helpers", () => ({
  uploadTemplateThumbnail: vi.fn().mockResolvedValue("https://example.com/new-thumbnail.jpg"),
  uploadTemplatePreviewImages: vi.fn().mockResolvedValue([
    "https://example.com/new-preview1.jpg",
    "https://example.com/new-preview2.jpg"
  ]),
  deleteTemplateImage: vi.fn().mockResolvedValue(true),
  createSlug: vi.fn((name) => name.toLowerCase().replace(/\s+/g, "-")),
  ensureUniqueSlug: vi.fn((slug) => Promise.resolve(slug)),
  generateShortUniqueId: vi.fn().mockReturnValue("newid123"),
  replaceLinkingIdsInContent: vi.fn((content) => content)
}));

describe("updateTemplate Service", () => {
  let testUser: any;
  let adminUser: any;
  let category1: any;
  let category2: any;

  beforeEach(async () => {
    // Create test users
    testUser = await TestHelpers.createTestUser({
      email: "user@example.com",
      isAdmin: false
    });
    
    adminUser = await TestHelpers.createTestUser({
      email: "admin@example.com",
      isAdmin: true
    });


    // Create test categories
    category1 = await testPrisma.templateCategory.create({
      data: {
        name: "Category 1",
        slug: "category-1"
      }
    });

    category2 = await testPrisma.templateCategory.create({
      data: {
        name: "Category 2",
        slug: "category-2"
      }
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should update template basic information", async () => {
      const template = await testPrisma.template.create({
        data: {
          name: "Original Template",
          slug: "original-template",
          description: "Original description",
          categoryId: category1.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: false
        }
      });

      const result = await updateTemplate({
        id: template.id,
        name: "Updated Template",
        description: "Updated description",
        categoryId: category2.id,
        isActive: false
      });

      expect(result.message).toBe("Template updated successfully");

      // Verify changes in database
      const updatedTemplate = await testPrisma.template.findUnique({
        where: { id: template.id }
      });

      expect(updatedTemplate!.name).toBe("Updated Template");
      expect(updatedTemplate!.description).toBe("Updated description");
      expect(updatedTemplate!.categoryId).toBe(category2.id);
      expect(updatedTemplate!.isActive).toBe(false);
    });

    it("should allow admin to update any template", async () => {
      const template = await testPrisma.template.create({
        data: {
          name: "User Template",
          slug: "user-template",
          categoryId: category1.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: false
        }
      });

      const result = await updateTemplate({
        id: template.id,
        name: "Admin Updated Template",
        isPublic: true
      });

      expect(result.message).toBe("Template updated successfully");

      const updatedTemplate = await testPrisma.template.findUnique({
        where: { id: template.id }
      });

      expect(updatedTemplate!.name).toBe("Admin Updated Template");
      expect(updatedTemplate!.isPublic).toBe(true);
    });
  });

  describe("Error Cases", () => {
    it("should throw error for invalid data", async () => {
      await expect(
        updateTemplate(null as any)
      ).rejects.toThrow();
    });

    it("should throw error for non-existent template", async () => {
      await expect(
        updateTemplate({
          id: 999999,
          name: "Updated Name"
        })
      ).rejects.toThrow();
    });
  });
});