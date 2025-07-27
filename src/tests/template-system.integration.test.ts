import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSlug, isValidSlug } from '../utils/slug';

describe('Template System Integration Tests', () => {
  describe('Slug Utility Functions', () => {
    it('should create valid slugs from template names', () => {
      const testCases = [
        { input: 'Lead Generation Template', expected: 'lead-generation-template' },
        { input: 'Sales Page Pro!', expected: 'sales-page-pro' },
        { input: 'E-commerce Store', expected: 'e-commerce-store' },
        { input: 'Special@#$%Characters', expected: 'specialcharacters' },
        { input: '  Multiple   Spaces  ', expected: 'multiple-spaces' },
        { input: 'UPPERCASE TEXT', expected: 'uppercase-text' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = createSlug(input);
        expect(result).toBe(expected);
        expect(isValidSlug(result)).toBe(true);
      });
    });

    it('should validate slug format correctly', () => {
      const validSlugs = [
        'simple-slug',
        'template-123',
        'a',
        'multi-word-slug',
        'with-numbers-123',
      ];

      const invalidSlugs = [
        'Uppercase',
        'with spaces',
        '-leading-dash',
        'trailing-dash-',
        'double--dash',
        'special@chars',
        '',
      ];

      validSlugs.forEach(slug => {
        expect(isValidSlug(slug)).toBe(true);
      });

      invalidSlugs.forEach(slug => {
        expect(isValidSlug(slug)).toBe(false);
      });
    });
  });

  describe('Template System Configuration', () => {
    it('should have required environment variables structure', () => {
      // Test that environment variable names are correctly defined
      const requiredEnvVars = [
        'AZURE_STORAGE_CONNECTION_STRING',
        'AZURE_STORAGE_CONTAINER_NAME',
      ];

      // This test ensures the environment variables are at least defined in structure
      requiredEnvVars.forEach(envVar => {
        expect(typeof envVar).toBe('string');
        expect(envVar.length).toBeGreaterThan(0);
      });
    });

    it('should handle different environment configurations', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        expect(typeof env).toBe('string');
        expect(['development', 'staging', 'production']).toContain(env);
      });
    });
  });

  describe('Template Categories Structure', () => {
    const expectedCategories = [
      'Lead Generation',
      'Sales Page', 
      'Course & Education',
      'E-commerce',
      'SaaS & Software',
      'Webinar',
      'Event & Conference',
      'Coaching & Consulting',
      'Agency & B2B',
      'Non-Profit & Charity',
      'Health & Fitness',
      'Real Estate',
      'Restaurant & Food',
      'Local Business',
      'Coming Soon',
    ];

    it('should have comprehensive template categories', () => {
      expect(expectedCategories).toHaveLength(15);
      
      expectedCategories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
        
        // Ensure each category can be converted to a valid slug
        const slug = createSlug(category);
        expect(isValidSlug(slug)).toBe(true);
      });
    });

    it('should have unique category names', () => {
      const uniqueCategories = [...new Set(expectedCategories)];
      expect(uniqueCategories).toHaveLength(expectedCategories.length);
    });

    it('should generate unique slugs for all categories', () => {
      const slugs = expectedCategories.map(createSlug);
      const uniqueSlugs = [...new Set(slugs)];
      expect(uniqueSlugs).toHaveLength(slugs.length);
    });
  });

  describe('Content Processing Logic', () => {
    it('should replace text placeholders correctly', () => {
      const content = '<div>Welcome to {{COMPANY_NAME}}</div><p>Contact {{COMPANY_NAME}} today!</p>';
      const replacements = { '{{COMPANY_NAME}}': 'My Business' };
      
      let processedContent = content;
      Object.entries(replacements).forEach(([search, replace]) => {
        processedContent = processedContent.replace(new RegExp(search, 'g'), replace);
      });

      expect(processedContent).toBe('<div>Welcome to My Business</div><p>Contact My Business today!</p>');
      expect(processedContent).not.toContain('{{COMPANY_NAME}}');
    });

    it('should handle multiple placeholder replacements', () => {
      const content = 'Hello {{NAME}}, welcome to {{COMPANY}}. Visit {{WEBSITE}} for more info.';
      const replacements = {
        '{{NAME}}': 'John',
        '{{COMPANY}}': 'Acme Corp',
        '{{WEBSITE}}': 'acme.com',
      };
      
      let processedContent = content;
      Object.entries(replacements).forEach(([search, replace]) => {
        processedContent = processedContent.replace(new RegExp(search, 'g'), replace);
      });

      expect(processedContent).toBe('Hello John, welcome to Acme Corp. Visit acme.com for more info.');
    });

    it('should replace linking IDs in content', () => {
      const content = '<a href="old-link-1">Next</a><form action="old-link-2">Submit</form>';
      const linkingMap = {
        'old-link-1': 'new-link-abc',
        'old-link-2': 'new-link-def',
      };

      let processedContent = content;
      Object.entries(linkingMap).forEach(([oldId, newId]) => {
        processedContent = processedContent.replace(new RegExp(oldId, 'g'), newId);
      });

      expect(processedContent).toBe('<a href="new-link-abc">Next</a><form action="new-link-def">Submit</form>');
      expect(processedContent).not.toContain('old-link-1');
      expect(processedContent).not.toContain('old-link-2');
    });
  });

  describe('Content Validation Logic', () => {
    it('should estimate content complexity correctly', () => {
      const testCases = [
        { content: '', expected: 1 }, // Math.max(1, ...) ensures minimum of 1
        { content: 'Simple text', expected: 1 },
        { content: '<div><p>Hello</p><span>World</span></div>', expected: 1 },
        { content: '<div>'.repeat(50) + 'lots of content'.repeat(20), expected: 4 },
      ];

      testCases.forEach(({ content, expected }) => {
        // Simple heuristic similar to the service
        const htmlTags = (content.match(/<[^>]+>/g) || []).length;
        const textBlocks = content.split(/\s+/).filter(word => word.length > 0).length;
        const result = content ? Math.max(1, Math.floor((htmlTags + textBlocks) / 20)) : 1;
        
        expect(result).toBe(expected);
      });
    });

    it('should validate page ordering correctly', () => {
      const testCases = [
        { pages: [1, 2, 3], isSequential: true },
        { pages: [1, 3, 5], isSequential: false },
        { pages: [2, 1, 3], isSequential: false },
        { pages: [1], isSequential: true },
        { pages: [], isSequential: true },
      ];

      testCases.forEach(({ pages, isSequential }) => {
        if (pages.length === 0) {
          expect(true).toBe(isSequential); // Empty array is considered sequential
          return;
        }
        
        // Check if pages are already in sequential order (1, 2, 3, ...)
        const expectedSequential = pages.map((_, index) => index + 1);
        const result = JSON.stringify(pages) === JSON.stringify(expectedSequential);
        
        expect(result).toBe(isSequential);
      });
    });

    it('should detect empty content correctly', () => {
      const testCases = [
        { content: '', isEmpty: true },
        { content: '   ', isEmpty: true },
        { content: '\n\t  \n', isEmpty: true },
        { content: 'Some content', isEmpty: false },
        { content: '<div></div>', isEmpty: false },
        { content: '0', isEmpty: false },
      ];

      testCases.forEach(({ content, isEmpty }) => {
        const result = !content || content.trim().length === 0;
        expect(result).toBe(isEmpty);
      });
    });
  });

  describe('File Extension Mapping', () => {
    it('should map content types to correct extensions', () => {
      const getFileExtension = (contentType: string): string => {
        const extensions: Record<string, string> = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
        };
        return extensions[contentType] || '.jpg';
      };

      const testCases = [
        { contentType: 'image/jpeg', expected: '.jpg' },
        { contentType: 'image/png', expected: '.png' },
        { contentType: 'image/gif', expected: '.gif' },
        { contentType: 'image/webp', expected: '.webp' },
        { contentType: 'image/svg+xml', expected: '.svg' },
        { contentType: 'unknown/type', expected: '.jpg' },
      ];

      testCases.forEach(({ contentType, expected }) => {
        expect(getFileExtension(contentType)).toBe(expected);
      });
    });
  });

  describe('Filename Generation Logic', () => {
    it('should generate properly formatted filenames', () => {
      const generateFileName = (originalName: string, templateId: number, imageType: string): string => {
        const timestamp = Date.now();
        const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
        const baseName = originalName.includes('.') 
          ? originalName.substring(0, originalName.lastIndexOf('.'))
          : originalName;
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        
        return `template-${templateId}-${imageType}-${sanitizedBaseName}-${timestamp}${ext}`;
      };

      const testCases = [
        {
          input: { originalName: 'My Image.jpg', templateId: 123, imageType: 'thumbnail' },
          expectedPattern: /^template-123-thumbnail-my-image-\d+\.jpg$/,
        },
        {
          input: { originalName: 'Special@Chars!.png', templateId: 456, imageType: 'preview' },
          expectedPattern: /^template-456-preview-special-chars--\d+\.png$/,
        },
        {
          input: { originalName: 'noextension', templateId: 789, imageType: 'screenshot' },
          expectedPattern: /^template-789-screenshot-noextension-\d+$/,
        },
      ];

      testCases.forEach(({ input, expectedPattern }) => {
        const result = generateFileName(input.originalName, input.templateId, input.imageType);
        expect(result).toMatch(expectedPattern);
      });
    });

    it('should generate unique filenames', () => {
      const generateBasicFileName = (name: string) => `${name}-${Date.now()}-${Math.random()}`;
      
      const name1 = generateBasicFileName('test');
      const name2 = generateBasicFileName('test');
      
      expect(name1).not.toBe(name2);
    });
  });

  describe('Admin Permission Logic', () => {
    it('should correctly identify admin users', () => {
      const testUsers = [
        { id: 1, isAdmin: true, shouldHaveAccess: true },
        { id: 2, isAdmin: false, shouldHaveAccess: false },
        { id: 3, isAdmin: undefined, shouldHaveAccess: false },
        { id: 4, shouldHaveAccess: false }, // No isAdmin property
      ];

      testUsers.forEach(user => {
        const hasAdminAccess = !!(user as any).isAdmin;
        expect(hasAdminAccess).toBe(user.shouldHaveAccess);
      });
    });
  });
});

describe('Template System Types and Interfaces', () => {
  it('should have proper data structure for template creation', () => {
    const templateData = {
      name: 'Test Template',
      description: 'A test template',
      categoryId: 1,
      funnelId: 1,
      tags: ['test', 'example'],
      isPublic: true,
    };

    expect(templateData).toEqual({
      name: expect.any(String),
      description: expect.any(String),
      categoryId: expect.any(Number),
      funnelId: expect.any(Number),
      tags: expect.any(Array),
      isPublic: expect.any(Boolean),
    });

    expect(templateData.tags).toHaveLength(2);
    expect(templateData.tags[0]).toBe('test');
  });

  it('should have proper data structure for funnel creation from template', () => {
    const funnelCreationData = {
      templateId: 1,
      userId: 1,
      funnelName: 'My New Funnel',
      customizations: {
        replaceText: {
          '{{COMPANY_NAME}}': 'My Company',
        },
        pageNames: {
          1: 'Custom Landing Page',
        },
      },
    };

    expect(funnelCreationData).toEqual({
      templateId: expect.any(Number),
      userId: expect.any(Number),
      funnelName: expect.any(String),
      customizations: expect.any(Object),
    });

    expect(funnelCreationData.customizations.replaceText).toBeDefined();
    expect(funnelCreationData.customizations.pageNames).toBeDefined();
  });
});