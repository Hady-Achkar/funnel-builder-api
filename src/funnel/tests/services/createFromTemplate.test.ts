import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createFunnelFromTemplate } from "../../services/create-from-template.service";
import { TestHelpers, testPrisma } from "../../../test/helpers";
import { cacheService } from "../../../services/cache/cache.service";

describe("createFunnelFromTemplate Service", () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user for each test
    testUser = await TestHelpers.createTestUser();
  });

  afterEach(async () => {
    // Cleanup is handled by the global test setup
  });

  describe("Success Cases", () => {
    it("should create a funnel from template with all pages", async () => {
      // Create template category
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Test Category",
          slug: "test-category"
        }
      });
      
      // Create template with pages
      const template = await testPrisma.template.create({
        data: {
          name: "Test Template",
          slug: "test-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      // Create template pages with linkingIds
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Home Page",
          content: '<a href="page2">Go to page2</a><div onclick="navigateToPage(\'page2\')">Click</div>',
          order: 1,
          linkingId: "page1",
          seoTitle: "Home",
          seoDescription: "Home page",
          seoKeywords: "home, page"
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "About Page", 
          content: '<a href="page1">Back to page1</a><div data-link="page1">Back</div>',
          order: 2,
          linkingId: "page2",
          seoTitle: "About",
          seoDescription: "About page",
          seoKeywords: "about, page"
        }
      });

      // Call service
      const result = await createFunnelFromTemplate({
        templateId: template.id,
        name: "Test Funnel from Template",
        userId: testUser.id
      });

      // Verify result
      expect(result).toEqual({
        message: "Funnel created successfully"
      });

      // Verify funnel was created
      const funnel = await testPrisma.funnel.findFirst({
        where: { 
          name: "Test Funnel from Template",
          userId: testUser.id 
        },
        include: { 
          theme: true,
          pages: {
            orderBy: { order: 'asc' }
          }
        }
      });

      expect(funnel).toBeTruthy();
      expect(funnel!.name).toBe("Test Funnel from Template");
      expect(funnel!.status).toBe("DRAFT");
      expect(funnel!.userId).toBe(testUser.id);
      
      // Verify theme was created
      expect(funnel!.theme).toBeTruthy();
      expect(funnel!.themeId).toBeTruthy();

      // Verify pages were created
      expect(funnel!.pages).toHaveLength(2);
      
      const createdPage1 = funnel!.pages.find(p => p.name === "Home Page");
      const createdPage2 = funnel!.pages.find(p => p.name === "About Page");
      
      expect(createdPage1).toBeTruthy();
      expect(createdPage2).toBeTruthy();
      
      // Verify content and structure - linking IDs should be replaced with new unique IDs
      expect(createdPage1!.content).not.toContain('page2');
      expect(createdPage2!.content).not.toContain('page1');
      expect(createdPage1!.content).toContain(createdPage2!.linkingId!);
      expect(createdPage2!.content).toContain(createdPage1!.linkingId!);

      // Verify SEO data was copied
      expect(createdPage1!.seoTitle).toBe("Home");
      expect(createdPage1!.seoDescription).toBe("Home page");
      expect(createdPage1!.seoKeywords).toBe("home, page");
    });

    it("should create funnel with proper cache entries", async () => {
      // Create test data
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Cache Test Category",
          slug: "cache-test-category"
        }
      });

      const template = await testPrisma.template.create({
        data: {
          name: "Cache Test Template",
          slug: "cache-test-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Test Page",
          content: "Test content",
          order: 1,
          linkingId: "test-page"
        }
      });

      // Call service
      await createFunnelFromTemplate({
        templateId: template.id,
        name: "Cached Funnel",
        userId: testUser.id
      });

      // Get created funnel
      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Cached Funnel" }
      });

      // Verify cache entries exist
      const fullCache = await cacheService.get(`user:${testUser.id}:funnel:${funnel!.id}:full`) as any;
      const summaryCache = await cacheService.get(`user:${testUser.id}:funnel:${funnel!.id}:summary`) as any;
      
      expect(fullCache).toBeTruthy();
      expect(summaryCache).toBeTruthy();
      
      // Verify cache content
      expect(fullCache.name).toBe("Cached Funnel");
      expect(fullCache.theme).toBeTruthy();
      expect(fullCache.pages).toHaveLength(1);
      
      expect(summaryCache.name).toBe("Cached Funnel");
      expect(summaryCache.theme).toBeTruthy();
    });
  });

  describe("Error Cases", () => {
    it("should throw error for non-existent template", async () => {
      await expect(createFunnelFromTemplate({
        templateId: 999999,
        name: "Test Funnel",
        userId: testUser.id
      })).rejects.toThrow("Template not found");
    });

    it("should throw error for inactive template", async () => {
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Inactive Test Category",
          slug: "inactive-test-category"
        }
      });
      
      const template = await testPrisma.template.create({
        data: {
          name: "Inactive Template",
          slug: "inactive-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: false,
          isPublic: true
        }
      });

      await expect(createFunnelFromTemplate({
        templateId: template.id,
        name: "Test Funnel",
        userId: testUser.id
      })).rejects.toThrow("Template is not available");
    });

    it("should throw error for non-public template", async () => {
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Private Test Category",
          slug: "private-test-category"
        }
      });
      
      const template = await testPrisma.template.create({
        data: {
          name: "Private Template",
          slug: "private-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: false
        }
      });

      await expect(createFunnelFromTemplate({
        templateId: template.id,
        name: "Test Funnel",
        userId: testUser.id
      })).rejects.toThrow("Template is not available");
    });

    it("should handle templates with no pages", async () => {
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Empty Test Category",
          slug: "empty-test-category"
        }
      });
      
      const template = await testPrisma.template.create({
        data: {
          name: "Empty Template",
          slug: "empty-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });

      const result = await createFunnelFromTemplate({
        templateId: template.id,
        name: "Empty Template Funnel",
        userId: testUser.id
      });

      expect(result.message).toBe("Funnel created successfully");
      
      // Verify funnel was still created
      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Empty Template Funnel" },
        include: { pages: true, theme: true }
      });
      
      expect(funnel).toBeTruthy();
      expect(funnel!.pages).toHaveLength(0);
      expect(funnel!.theme).toBeTruthy();
    });
  });

  describe("Linking ID Replacement", () => {
    it("should replace linking IDs in various contexts", async () => {
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Linking Test Category",
          slug: "linking-test-category"
        }
      });

      const template = await testPrisma.template.create({
        data: {
          name: "Linking Test Template",
          slug: "linking-test-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Complex Page",
          content: `
            <a href="target-page">Link 1</a>
            <div onclick="navigateToPage('target-page')">Click me</div>
            <button data-link="target-page">Button</button>
            https://example.com/target-page/test
            #target-page
            ?page=target-page&other=value
          `,
          order: 1,
          linkingId: "source-page"
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Target Page",
          content: '<a href="source-page">Back</a>',
          order: 2,
          linkingId: "target-page"
        }
      });

      await createFunnelFromTemplate({
        templateId: template.id,
        name: "Complex Linking Test",
        userId: testUser.id
      });

      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Complex Linking Test" },
        include: { pages: { orderBy: { order: 'asc' } } }
      });

      const sourcePage = funnel!.pages[0];
      const targetPage = funnel!.pages[1];
      
      // Verify all contexts were replaced
      expect(sourcePage.content).toContain(targetPage.linkingId!);
      expect(sourcePage.content).not.toContain("target-page");
      
      expect(targetPage.content).toContain(sourcePage.linkingId!);
      expect(targetPage.content).not.toContain("source-page");
    });

    it("should generate unique linking IDs for each page", async () => {
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Unique IDs Test Category",
          slug: "unique-ids-test-category"
        }
      });

      const template = await testPrisma.template.create({
        data: {
          name: "Unique IDs Test Template",
          slug: "unique-ids-test-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      // Create multiple pages
      for (let i = 1; i <= 5; i++) {
        await testPrisma.templatePage.create({
          data: {
            templateId: template.id,
            name: `Page ${i}`,
            content: `Content for page ${i}`,
            order: i,
            linkingId: `page-${i}`
          }
        });
      }

      await createFunnelFromTemplate({
        templateId: template.id,
        name: "Unique IDs Test",
        userId: testUser.id
      });

      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Unique IDs Test" },
        include: { pages: true }
      });

      const linkingIds = funnel!.pages.map(p => p.linkingId).filter(Boolean);
      const uniqueLinkingIds = [...new Set(linkingIds)];
      
      // All linking IDs should be unique
      expect(linkingIds).toHaveLength(uniqueLinkingIds.length);
      
      // All should be 8 characters
      linkingIds.forEach(id => {
        if (id) {
          expect(id).toMatch(/^[a-z0-9]{8}$/);
        }
      });
    });
  });

  describe("Input Validation", () => {
    it("should validate required templateId", async () => {
      await expect(createFunnelFromTemplate({
        templateId: undefined as any,
        name: "Test Funnel",
        userId: testUser.id
      })).rejects.toThrow();
    });

    it("should validate required name", async () => {
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Validation Test Category",
          slug: "validation-test-category"
        }
      });

      const template = await testPrisma.template.create({
        data: {
          name: "Validation Test Template",
          slug: "validation-test-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      await expect(createFunnelFromTemplate({
        templateId: template.id,
        name: "",
        userId: testUser.id
      })).rejects.toThrow();
    });

    it("should validate templateId is a positive number", async () => {
      await expect(createFunnelFromTemplate({
        templateId: -1,
        name: "Test Funnel",
        userId: testUser.id
      })).rejects.toThrow();
    });
  });
});