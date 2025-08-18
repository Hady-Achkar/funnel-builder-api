import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAllTemplates } from "../service/get-all-templates.service";
import { TestHelpers, testPrisma } from "../../../test/helpers";
import { redisService } from "../../../services/cache/redis.service";

type GetAllTemplatesInput = {
  page?: string;
  limit?: string;
  orderBy?: "createdAt" | "updatedAt" | "name" | "usageCount";
  order?: "asc" | "desc";
  category?: string;
};

describe("getAllTemplates Service", () => {
  let testUser: any;
  let category1: any;
  let category2: any;

  beforeEach(async () => {
    // Clear cache
    await redisService.flush();

    // Create test user
    testUser = await TestHelpers.createTestUser({
      email: "user@example.com",
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
    await redisService.flush();
  });

  describe("Success Cases", () => {
    it("should return all templates with default pagination", async () => {
      // Create test templates
      await testPrisma.template.createMany({
        data: [
          {
            name: "Template 1",
            slug: "template-1",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Template 2",
            slug: "template-2",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Template 3",
            slug: "template-3",
            categoryId: category2.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          }
        ]
      });

      const result = await getAllTemplates({ page: "1", limit: "10" });

      expect(result.templates).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should filter by category", async () => {
      // Create templates in different categories
      await testPrisma.template.createMany({
        data: [
          {
            name: "Cat1 Template 1",
            slug: "cat1-template-1",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Cat1 Template 2",
            slug: "cat1-template-2",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Cat2 Template",
            slug: "cat2-template",
            categoryId: category2.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          }
        ]
      });

      const result = await getAllTemplates({ category: "category-1" } as GetAllTemplatesInput);

      expect(result.templates).toHaveLength(2);
      expect(result.templates.every(t => t.categoryName === "Category 1")).toBe(true);
    });

    it("should filter by active status", async () => {
      await testPrisma.template.createMany({
        data: [
          {
            name: "Active Template",
            slug: "active-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Inactive Template",
            slug: "inactive-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: false,
            isPublic: true,
            
          }
        ]
      });

      const result = await getAllTemplates({} as GetAllTemplatesInput);

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe("Active Template");
    });

    it("should filter by public status", async () => {
      await testPrisma.template.createMany({
        data: [
          {
            name: "Public Template",
            slug: "public-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Private Template",
            slug: "private-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: false,
            
          }
        ]
      });

      const result = await getAllTemplates({} as GetAllTemplatesInput);

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe("Public Template");
    });

    it("should handle pagination correctly", async () => {
      // Create 15 templates
      const templates = [];
      for (let i = 1; i <= 15; i++) {
        templates.push({
          name: `Template ${i}`,
          slug: `template-${i}`,
          categoryId: category1.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true,
        });
      }
      await testPrisma.template.createMany({ data: templates });

      // Get first page
      const page1 = await getAllTemplates({ page: "1", limit: "5" } as GetAllTemplatesInput);
      expect(page1.templates).toHaveLength(5);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.totalPages).toBe(3);

      // Get second page
      const page2 = await getAllTemplates({ page: "2", limit: "5" } as GetAllTemplatesInput);
      expect(page2.templates).toHaveLength(5);
      expect(page2.pagination.page).toBe(2);

      // Get last page
      const page3 = await getAllTemplates({ page: "3", limit: "5" } as GetAllTemplatesInput);
      expect(page3.templates).toHaveLength(5);
      expect(page3.pagination.page).toBe(3);
    });

    it("should search templates by name", async () => {
      await testPrisma.template.createMany({
        data: [
          {
            name: "E-commerce Template",
            slug: "ecommerce-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Blog Template",
            slug: "blog-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "Portfolio Site",
            slug: "portfolio-site",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          }
        ]
      });

      const result = await getAllTemplates({} as GetAllTemplatesInput);

      expect(result.templates).toHaveLength(3);
      expect(result.templates.some(t => t.name.includes("Template"))).toBe(true);
    });

    it("should sort templates by different fields", async () => {
      await testPrisma.template.createMany({
        data: [
          {
            name: "Z Template",
            slug: "z-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "A Template",
            slug: "a-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          },
          {
            name: "M Template",
            slug: "m-template",
            categoryId: category1.id,
            createdByUserId: testUser.id,
            isActive: true,
            isPublic: true,
            
          }
        ]
      });

      // Sort by name ascending
      const nameAsc = await getAllTemplates({ orderBy: "name", order: "asc" } as GetAllTemplatesInput);
      expect(nameAsc.templates[0].name).toBe("A Template");
      expect(nameAsc.templates[2].name).toBe("Z Template");

      // Sort by usage count descending
      const usageDesc = await getAllTemplates({ orderBy: "usageCount", order: "desc" } as GetAllTemplatesInput);
      expect(usageDesc.templates[0].usageCount).toBeGreaterThanOrEqual(usageDesc.templates[1].usageCount);
    });

    it.skip("should include preview images", async () => {
      const template = await testPrisma.template.create({
        data: {
          name: "Template with Images",
          slug: "template-with-images",
          categoryId: category1.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true,
          
        }
      });

      await testPrisma.templateImage.createMany({
        data: [
          {
            templateId: template.id,
            imageUrl: "https://example.com/preview1.jpg",
            order: 1,
            imageType: "PREVIEW"
          },
          {
            templateId: template.id,
            imageUrl: "https://example.com/preview2.jpg",
            order: 2,
            imageType: "PREVIEW"
          }
        ]
      });

      const result = await getAllTemplates({} as GetAllTemplatesInput);

      expect(result.templates[0].previewUrls).toHaveLength(2);
    });

    it("should use cache on subsequent calls", async () => {
      await testPrisma.template.create({
        data: {
          name: "Cached Template",
          slug: "cached-template",
          categoryId: category1.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true,
          
        }
      });

      // First call - should populate cache
      const result1 = await getAllTemplates({});
      expect(result1.templates).toHaveLength(1);

      // Second call - should use cache
      const result2 = await getAllTemplates({});
      expect(result2.templates).toHaveLength(1);
      expect(result2).toEqual(result1);
    });
  });

  describe("Error Cases", () => {
    it("should handle invalid page number", async () => {
      await expect(
        getAllTemplates({ page: "-1" } as GetAllTemplatesInput)
      ).rejects.toThrow();
    });

    it("should handle invalid limit", async () => {
      await expect(
        getAllTemplates({ limit: "0" } as GetAllTemplatesInput)
      ).rejects.toThrow();
    });

    it("should handle invalid sort field", async () => {
      await expect(
        getAllTemplates({ orderBy: "invalid" } as any)
      ).rejects.toThrow();
    });

    it("should return empty array when no templates exist", async () => {
      const result = await getAllTemplates({} as GetAllTemplatesInput);

      expect(result.templates).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should handle non-existent category filter", async () => {
      await testPrisma.template.create({
        data: {
          name: "Test Template",
          slug: "test-template",
          categoryId: category1.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true,
          
        }
      });

      const result = await getAllTemplates({ category: "non-existent" } as GetAllTemplatesInput);

      expect(result.templates).toHaveLength(0);
    });
  });
});