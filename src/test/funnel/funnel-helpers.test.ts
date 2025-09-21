import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateSlug,
  generateDateSlug,
  validateSlugFormat,
  validateSlugUniqueness,
  generateUniqueSlug,
} from "../../helpers/funnel/shared/slug.helper";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError } from "../../errors";

vi.mock("../../lib/prisma");

describe("Funnel Helper Functions Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("generateSlug", () => {
    it("should generate valid slug from normal string", () => {
      expect(generateSlug("My Awesome Funnel")).toBe("my-awesome-funnel");
      expect(generateSlug("Test 123 Funnel")).toBe("test-123-funnel");
      expect(generateSlug("  Spaces  Everywhere  ")).toBe("spaces-everywhere");
    });

    it("should replace underscores with hyphens", () => {
      expect(generateSlug("test_with_underscores")).toBe("test-with-underscores");
      expect(generateSlug("mixed_spaces and_underscores")).toBe("mixed-spaces-and-underscores");
    });

    it("should remove multiple consecutive hyphens", () => {
      expect(generateSlug("test---multiple---hyphens")).toBe("test-multiple-hyphens");
      expect(generateSlug("spaces   and    gaps")).toBe("spaces-and-gaps");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(generateSlug("-leading-hyphen")).toBe("leading-hyphen");
      expect(generateSlug("trailing-hyphen-")).toBe("trailing-hyphen");
      expect(generateSlug("-both-sides-")).toBe("both-sides");
    });

    it("should throw error for invalid characters", () => {
      expect(() => generateSlug("Test@#$%Funnel")).toThrow(BadRequestError);
      expect(() => generateSlug("Funnel!")).toThrow("invalid characters");
      expect(() => generateSlug("Emoji 😀 Funnel")).toThrow("invalid characters");
    });

    it("should throw error for empty or invalid input", () => {
      expect(() => generateSlug("")).toThrow(BadRequestError);
      expect(() => generateSlug(null as any)).toThrow(BadRequestError);
      expect(() => generateSlug(undefined as any)).toThrow(BadRequestError);
    });

    it("should throw error if resulting slug is empty", () => {
      expect(() => generateSlug("@#$%^&*()")).toThrow("invalid characters");
    });
  });

  describe("generateDateSlug", () => {
    it("should generate date slug with seconds", () => {
      const date = new Date("2024-03-15T14:30:45");
      const slug = generateDateSlug(date);
      expect(slug).toBe("15-03-2024-14-30-45");
    });

    it("should pad single digits with zeros", () => {
      const date = new Date("2024-01-05T09:05:08");
      const slug = generateDateSlug(date);
      expect(slug).toBe("05-01-2024-09-05-08");
    });

    it("should use current date when no date provided", () => {
      const slug = generateDateSlug();
      expect(slug).toMatch(/^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}$/);
    });

    it("should generate unique slugs for different times", () => {
      const date1 = new Date("2024-03-15T14:30:45");
      const date2 = new Date("2024-03-15T14:30:46");
      const slug1 = generateDateSlug(date1);
      const slug2 = generateDateSlug(date2);
      expect(slug1).not.toBe(slug2);
    });
  });

  describe("validateSlugFormat", () => {
    it("should validate correct slug formats", () => {
      expect(validateSlugFormat("valid-slug")).toBe(true);
      expect(validateSlugFormat("another-valid-slug-123")).toBe(true);
      expect(validateSlugFormat("123-numbers-first")).toBe(true);
      expect(validateSlugFormat("single")).toBe(true);
    });

    it("should reject invalid slug formats", () => {
      expect(validateSlugFormat("Invalid-Slug")).toBe(false);
      expect(validateSlugFormat("slug with spaces")).toBe(false);
      expect(validateSlugFormat("-leading-hyphen")).toBe(false);
      expect(validateSlugFormat("trailing-hyphen-")).toBe(false);
      expect(validateSlugFormat("slug--double--hyphen")).toBe(false);
      expect(validateSlugFormat("slug_with_underscore")).toBe(false);
    });

    it("should reject empty or invalid input", () => {
      expect(validateSlugFormat("")).toBe(false);
      expect(validateSlugFormat(null as any)).toBe(false);
      expect(validateSlugFormat(undefined as any)).toBe(false);
      expect(validateSlugFormat(123 as any)).toBe(false);
    });
  });

  describe("validateSlugUniqueness", () => {
    it("should return true if slug is unique", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      const isUnique = await validateSlugUniqueness("unique-slug", 1);
      expect(isUnique).toBe(true);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          workspaceId: 1,
          slug: "unique-slug",
        },
        select: { id: true },
      });
    });

    it("should return false if slug exists", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({ id: 1 });

      const isUnique = await validateSlugUniqueness("existing-slug", 1);
      expect(isUnique).toBe(false);
    });

    it("should exclude specific funnel ID when checking", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await validateSlugUniqueness("slug", 1, 123);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          workspaceId: 1,
          slug: "slug",
          id: { not: 123 },
        },
        select: { id: true },
      });
    });
  });

  describe("generateUniqueSlug", () => {
    it("should return base slug if unique", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      const slug = await generateUniqueSlug("unique-slug", 1);
      expect(slug).toBe("unique-slug");
    });

    it("should append number if base slug exists", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueSlug("existing-slug", 1);
      expect(slug).toBe("existing-slug-1");
    });

    it("should increment number until unique slug found", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 })
        .mockResolvedValueOnce({ id: 3 })
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueSlug("popular-slug", 1);
      expect(slug).toBe("popular-slug-3");
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledTimes(4);
    });

    it("should exclude funnel ID when updating", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      const slug = await generateUniqueSlug("my-slug", 1, 456);
      expect(slug).toBe("my-slug");
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          workspaceId: 1,
          slug: "my-slug",
          id: { not: 456 },
        },
        select: { id: true },
      });
    });

    it("should throw error for invalid slug format", async () => {
      await expect(
        generateUniqueSlug("Invalid Slug!", 1)
      ).rejects.toThrow(BadRequestError);

      await expect(
        generateUniqueSlug("-invalid-", 1)
      ).rejects.toThrow("invalid characters");
    });

    it("should handle high collision scenarios", async () => {
      let callCount = 0;
      mockPrisma.funnel.findFirst.mockImplementation(() => {
        callCount++;
        return callCount < 10 ? Promise.resolve({ id: callCount }) : Promise.resolve(null);
      });

      const slug = await generateUniqueSlug("very-popular", 1);
      expect(slug).toBe("very-popular-9");
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledTimes(10);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle full slug generation flow", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      const name = "My New Funnel 2024";
      const baseSlug = generateSlug(name);
      expect(baseSlug).toBe("my-new-funnel-2024");

      const isValid = validateSlugFormat(baseSlug);
      expect(isValid).toBe(true);

      const uniqueSlug = await generateUniqueSlug(baseSlug, 1);
      expect(uniqueSlug).toBe("my-new-funnel-2024");
    });

    it("should handle date-based slug generation", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      const dateSlug = generateDateSlug(new Date("2024-12-25T10:30:45"));
      expect(dateSlug).toBe("25-12-2024-10-30-45");

      const isValid = validateSlugFormat(dateSlug);
      expect(isValid).toBe(true);

      const uniqueSlug = await generateUniqueSlug(dateSlug, 1);
      expect(uniqueSlug).toBe("25-12-2024-10-30-45");
    });
  });
});