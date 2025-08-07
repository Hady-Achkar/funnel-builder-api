import { PrismaClient, User, Funnel, Domain, Page, Theme, Template, TemplateCategory } from "../generated/prisma-client";
import bcrypt from "bcryptjs";
import { DomainType, DomainStatus, FunnelStatus, BorderRadius, SslStatus } from "../generated/prisma-client";

// Factory for creating test data with sensible defaults
export class TestFactory {
  constructor(private prisma: PrismaClient) {}

  // User factory
  async createUser(overrides: Partial<{
    email: string;
    name: string;
    password: string;
    isAdmin: boolean;
    maximumFunnels: number;
  }> = {}): Promise<User> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const hashedPassword = await bcrypt.hash(overrides.password || "password123", 10);

    return this.prisma.user.create({
      data: {
        email: overrides.email || `test-${timestamp}-${randomId}@example.com`,
        name: overrides.name || "Test User",
        password: hashedPassword,
        isAdmin: overrides.isAdmin || false,
        maximumFunnels: overrides.maximumFunnels,
      },
    });
  }

  // Theme factory
  async createTheme(overrides: Partial<{
    name: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    borderColor: string;
    optionColor: string;
    fontFamily: string;
    borderRadius: BorderRadius;
  }> = {}): Promise<Theme> {
    const timestamp = Date.now();
    
    return this.prisma.theme.create({
      data: {
        name: overrides.name || `Test Theme ${timestamp}`,
        backgroundColor: overrides.backgroundColor || "#0e1e12",
        textColor: overrides.textColor || "#d4ecd0",
        buttonColor: overrides.buttonColor || "#387e3d",
        buttonTextColor: overrides.buttonTextColor || "#e8f5e9",
        borderColor: overrides.borderColor || "#214228",
        optionColor: overrides.optionColor || "#16331b",
        fontFamily: overrides.fontFamily || "Inter, sans-serif",
        borderRadius: overrides.borderRadius || BorderRadius.SOFT,
      },
    });
  }

  // Funnel factory
  async createFunnel(userId: number, overrides: Partial<{
    name: string;
    status: FunnelStatus;
    themeId: number;
    templateId: number;
  }> = {}): Promise<Funnel> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Create theme if not provided
    let themeId = overrides.themeId;
    if (!themeId) {
      const theme = await this.createTheme();
      themeId = theme.id;
    }

    return this.prisma.funnel.create({
      data: {
        name: overrides.name || `Test Funnel ${timestamp}-${randomId}`,
        status: overrides.status || FunnelStatus.DRAFT,
        userId,
        themeId,
        templateId: overrides.templateId,
      },
      include: {
        theme: true,
        pages: true,
        domainConnections: true,
      },
    });
  }

  // Domain factory
  async createDomain(userId: number, overrides: Partial<{
    hostname: string;
    type: DomainType;
    status: DomainStatus;
    sslStatus: SslStatus;
    cloudflareHostnameId: string;
    cloudflareZoneId: string;
    cloudflareRecordId: string;
    verificationToken: string;
  }> = {}): Promise<Domain> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);

    return this.prisma.domain.create({
      data: {
        hostname: overrides.hostname || `test-${timestamp}-${randomId}.example.com`,
        type: overrides.type || DomainType.CUSTOM_DOMAIN,
        status: overrides.status || DomainStatus.PENDING,
        sslStatus: overrides.sslStatus || SslStatus.PENDING,
        userId,
        cloudflareHostnameId: overrides.cloudflareHostnameId,
        cloudflareZoneId: overrides.cloudflareZoneId,
        cloudflareRecordId: overrides.cloudflareRecordId,
        verificationToken: overrides.verificationToken,
      },
    });
  }

  // Page factory
  async createPage(funnelId: number, overrides: Partial<{
    name: string;
    content: string;
    order: number;
    linkingId: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    visits: number;
  }> = {}): Promise<Page> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Get the next order if not provided
    let order = overrides.order;
    if (order === undefined) {
      const existingPages = await this.prisma.page.findMany({
        where: { funnelId },
        orderBy: { order: "desc" },
        take: 1,
      });
      order = existingPages.length > 0 ? existingPages[0].order + 1 : 0;
    }

    return this.prisma.page.create({
      data: {
        name: overrides.name || `Test Page ${timestamp}`,
        content: overrides.content || "<h1>Test Page Content</h1>",
        order,
        linkingId: overrides.linkingId || `page-${timestamp}-${randomId}`,
        seoTitle: overrides.seoTitle,
        seoDescription: overrides.seoDescription,
        seoKeywords: overrides.seoKeywords,
        visits: overrides.visits || 0,
        funnelId,
      },
    });
  }

  // Template Category factory
  async createTemplateCategory(overrides: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    order: number;
    isActive: boolean;
  }> = {}): Promise<TemplateCategory> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    return this.prisma.templateCategory.create({
      data: {
        name: overrides.name || `Test Category ${timestamp}`,
        slug: overrides.slug || `test-category-${timestamp}-${randomId}`,
        description: overrides.description || "Test category description",
        icon: overrides.icon || "📁",
        order: overrides.order || 0,
        isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      },
    });
  }

  // Template factory
  async createTemplate(categoryId: number, createdByUserId: number, overrides: Partial<{
    name: string;
    slug: string;
    description: string;
    thumbnailImage: string;
    tags: string[];
    usageCount: number;
    isActive: boolean;
    isPublic: boolean;
    metadata: any;
  }> = {}): Promise<Template> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    return this.prisma.template.create({
      data: {
        name: overrides.name || `Test Template ${timestamp}`,
        slug: overrides.slug || `test-template-${timestamp}-${randomId}`,
        description: overrides.description || "Test template description",
        categoryId,
        thumbnailImage: overrides.thumbnailImage,
        tags: overrides.tags || ["test", "template"],
        usageCount: overrides.usageCount || 0,
        isActive: overrides.isActive !== undefined ? overrides.isActive : true,
        isPublic: overrides.isPublic !== undefined ? overrides.isPublic : true,
        createdByUserId,
        metadata: overrides.metadata,
      },
      include: {
        category: true,
        pages: true,
        previewImages: true,
      },
    });
  }

  // Funnel-Domain connection factory
  async connectFunnelToDomain(funnelId: number, domainId: number, isActive = true) {
    return this.prisma.funnelDomain.create({
      data: {
        funnelId,
        domainId,
        isActive,
      },
    });
  }

  // Session factory
  async createSession(funnelId: number, overrides: Partial<{
    sessionId: string;
    visitedPages: number[];
    interactions: any;
  }> = {}) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    return this.prisma.session.create({
      data: {
        sessionId: overrides.sessionId || `session-${timestamp}-${randomId}`,
        funnelId,
        visitedPages: overrides.visitedPages || [],
        interactions: overrides.interactions || {},
      },
    });
  }

  // Bulk creation helpers
  async createUsersWithFunnels(count: number): Promise<User[]> {
    const users: User[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = await this.createUser({
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
      });
      
      // Create 2 funnels per user
      for (let j = 0; j < 2; j++) {
        const funnel = await this.createFunnel(user.id, {
          name: `User ${i + 1} Funnel ${j + 1}`,
        });
        
        // Create 3 pages per funnel
        for (let k = 0; k < 3; k++) {
          await this.createPage(funnel.id, {
            name: `Page ${k + 1}`,
            order: k,
          });
        }
      }
      
      users.push(user);
    }
    
    return users;
  }

  // Cleanup helper
  async cleanupUser(userId: number): Promise<void> {
    // Get all funnels for the user to clean up themes
    const funnels = await this.prisma.funnel.findMany({
      where: { userId },
      select: { themeId: true },
    });
    
    // Delete user (cascades to funnels, pages, domains, etc.)
    await this.prisma.user.delete({
      where: { id: userId },
    });
    
    // Clean up orphaned themes
    const themeIds = funnels
      .map(f => f.themeId)
      .filter((id): id is number => id !== null);
    
    if (themeIds.length > 0) {
      await this.prisma.theme.deleteMany({
        where: { id: { in: themeIds } },
      });
    }
  }
}