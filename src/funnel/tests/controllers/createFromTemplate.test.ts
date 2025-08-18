import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createServer } from "../../../app";
import { TestHelpers, testPrisma } from "../../../test/helpers";

describe("createFunnelFromTemplate Controller", () => {
  let app: ReturnType<typeof createServer>;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Create the app instance
    app = createServer();
    // Create a test user for each test
    testUser = await TestHelpers.createTestUser();
    // Generate JWT token for authentication
    authToken = TestHelpers.generateJWTToken(testUser.id);
  });

  afterEach(async () => {
    // Cleanup is handled by the global test setup
  });

  describe("POST /funnels/from-template/:templateId", () => {
    it("should create funnel from template successfully", async () => {
      // Create test data
      const category = await testPrisma.templateCategory.create({
        data: {
          name: "Test Category",
          slug: "test-category"
        }
      });

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
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Template Page",
          content: '<div>Template content</div>',
          order: 1,
          linkingId: "template-page"
        }
      });

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "My New Funnel" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Funnel created successfully");

      // Verify funnel was created in database
      const funnel = await testPrisma.funnel.findFirst({
        where: { 
          name: "My New Funnel",
          userId: testUser.id 
        },
        include: { 
          pages: true,
          theme: true
        }
      });

      expect(funnel).toBeTruthy();
      expect(funnel!.pages).toHaveLength(1);
      expect(funnel!.theme).toBeTruthy();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/funnels/from-template/1")
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain("Access token required");
    });

    it("should return 400 for invalid template ID", async () => {
      const response = await request(app)
        .post("/api/funnels/from-template/invalid")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Valid template ID is required");
    });

    it("should return 400 for missing template ID", async () => {
      const response = await request(app)
        .post("/api/funnels/from-template/")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(404); // Route not found
    });

    it("should return 400 for missing funnel name", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
      });
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

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Funnel name is required");
    });

    it("should return 400 for empty funnel name", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
      });
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

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Funnel name is required");
    });

    it("should return 404 for non-existent template", async () => {
      const response = await request(app)
        .post("/api/funnels/from-template/999999")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Template not found");
    });

    it("should return 404 for inactive template", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
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

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Template is not available");
    });

    it("should return 404 for non-public template", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
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

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Funnel" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Template is not available");
    });

    it("should handle templates with multiple pages", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
      });
      const template = await testPrisma.template.create({
        data: {
          name: "Multi-page Template",
          slug: "multi-page-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      // Create multiple template pages
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Home",
          content: '<a href="about">Go to About</a>',
          order: 1,
          linkingId: "home"
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "About",
          content: '<a href="home">Back to Home</a>',
          order: 2,
          linkingId: "about"
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Contact",
          content: '<a href="home">Home</a> | <a href="about">About</a>',
          order: 3,
          linkingId: "contact"
        }
      });

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Multi-page Funnel" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify all pages were created
      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Multi-page Funnel" },
        include: { 
          pages: { orderBy: { order: 'asc' } }
        }
      });

      expect(funnel!.pages).toHaveLength(3);
      expect(funnel!.pages[0].name).toBe("Home");
      expect(funnel!.pages[1].name).toBe("About");
      expect(funnel!.pages[2].name).toBe("Contact");
    });

    it("should preserve page order from template", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
      });
      const template = await testPrisma.template.create({
        data: {
          name: "Ordered Template",
          slug: "ordered-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      // Create pages in non-sequential order
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Third Page",
          content: 'Third',
          order: 3,
          linkingId: "third"
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "First Page",
          content: 'First',
          order: 1,
          linkingId: "first"
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "Second Page",
          content: 'Second',
          order: 2,
          linkingId: "second"
        }
      });

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Ordered Funnel" });

      expect(response.status).toBe(201);

      // Verify pages maintain correct order
      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Ordered Funnel" },
        include: { 
          pages: { orderBy: { order: 'asc' } }
        }
      });

      expect(funnel!.pages[0].name).toBe("First Page");
      expect(funnel!.pages[0].order).toBe(1);
      expect(funnel!.pages[1].name).toBe("Second Page");
      expect(funnel!.pages[1].order).toBe(2);
      expect(funnel!.pages[2].name).toBe("Third Page");
      expect(funnel!.pages[2].order).toBe(3);
    });

    it("should handle template with no pages", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
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

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Empty Template Funnel" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify funnel was created even with no pages
      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "Empty Template Funnel" },
        include: { pages: true, theme: true }
      });

      expect(funnel).toBeTruthy();
      expect(funnel!.pages).toHaveLength(0);
      expect(funnel!.theme).toBeTruthy(); // Theme should still be created
    });

    it("should copy all page SEO data from template", async () => {
      const category = await testPrisma.templateCategory.create({
        data: { name: "Test Category", slug: "test-category" }
      });
      const template = await testPrisma.template.create({
        data: {
          name: "SEO Template",
          slug: "seo-template",
          categoryId: category.id,
          createdByUserId: testUser.id,
          isActive: true,
          isPublic: true
        }
      });
      
      await testPrisma.templatePage.create({
        data: {
          templateId: template.id,
          name: "SEO Page",
          content: 'SEO content',
          order: 1,
          linkingId: "seo-page",
          seoTitle: "SEO Page Title",
          seoDescription: "This is an SEO optimized page",
          seoKeywords: "seo, keywords, test"
        }
      });

      const response = await request(app)
        .post(`/api/funnels/from-template/${template.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "SEO Funnel" });

      expect(response.status).toBe(201);

      const funnel = await testPrisma.funnel.findFirst({
        where: { name: "SEO Funnel" },
        include: { pages: true }
      });

      const page = funnel!.pages[0];
      expect(page.seoTitle).toBe("SEO Page Title");
      expect(page.seoDescription).toBe("This is an SEO optimized page");
      expect(page.seoKeywords).toBe("seo, keywords, test");
    });
  });
});