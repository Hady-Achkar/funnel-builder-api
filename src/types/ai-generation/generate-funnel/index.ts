import { z } from "zod";

export const generateFunnelRequestSchema = z.object({
  workspaceSlug: z.string().min(1, {
    message: "Workspace slug is required",
  }),
  businessDescription: z
    .string()
    .min(10, {
      message: "Business description must be at least 10 characters",
    })
    .max(8000, {
      message: "Business description must not exceed 8000 characters",
    }), // Increased to 8000 to support V2 refined prompts (300-800 words with safety buffer)
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  funnelType: z.string().optional(),
  maxPages: z.number().int().positive().optional().default(3),
  maxElementsPerPage: z.number().int().positive().max(20).optional().default(8),
  createFunnel: z.boolean().optional().default(true),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Primary color must be a valid hex color (e.g., #387e3d)",
    })
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Secondary color must be a valid hex color (e.g., #214228)",
    })
    .optional(),
  preferDarkBackground: z.boolean().optional(),
  userPrompt: z
    .string()
    .max(1000, {
      message: "User prompt must not exceed 1000 characters",
    })
    .optional(),
});

export const generateFunnelResponseSchema = z.object({
  message: z.string(),
  funnel: z.object({
    id: z.number().int().positive().optional(),
    name: z.string(),
    pages: z.array(
      z.object({
        id: z.number().int().positive().optional(),
        name: z.string(),
        type: z.enum(["PAGE", "RESULT"]),
        order: z.number().int().nonnegative().optional(),
      })
    ),
    theme: z
      .object({
        id: z.number().int().positive().optional(),
        name: z.string(),
        backgroundColor: z.string(),
        textColor: z.string(),
        buttonColor: z.string(),
        buttonTextColor: z.string(),
        borderColor: z.string(),
        optionColor: z.string(),
        fontFamily: z.string(),
        borderRadius: z.string(),
      })
      .optional(),
    seoSettings: z
      .object({
        id: z.number().int().positive().optional(),
        defaultSeoTitle: z.string().nullable(),
        defaultSeoDescription: z.string().nullable(),
        defaultSeoKeywords: z.array(z.string()), // API returns array format for frontend
      })
      .optional(),
  }),
  tokensUsed: z.number().int().nonnegative(),
  remainingTokens: z.number().int().nullable(), // Can be negative when user exceeds limit
  generationLogId: z.number().int().positive(),
  generationMode: z.literal("batch").optional(),
});

export type GenerateFunnelRequest = z.infer<typeof generateFunnelRequestSchema>;
export type GenerateFunnelResponse = z.infer<
  typeof generateFunnelResponseSchema
>;

// V2 Schema - 2-Step Prompt Refinement System
export const generateFunnelRequestSchemaV2 = z.object({
  workspaceSlug: z.string().min(1, {
    message: "Workspace slug is required",
  }),

  // REQUIRED FIELDS (User must provide)
  funnelType: z
    .string()
    .min(3, {
      message:
        "Funnel type is required (e.g., lead-generation, sales, webinar, etc.)",
    })
    .max(100, {
      message: "Funnel type must not exceed 100 characters",
    }),

  businessDescription: z
    .string()
    .min(10, {
      message: "Business description must be at least 10 characters",
    })
    .max(2000, {
      message: "Business description must not exceed 2000 characters",
    }),

  industry: z
    .string()
    .min(3, {
      message:
        "Industry is required (e.g., ecommerce, SaaS, coaching, healthcare, etc.)",
    })
    .max(100, {
      message: "Industry must not exceed 100 characters",
    }),

  targetAudience: z
    .string()
    .min(3, {
      message:
        "Target audience is required (e.g., small business owners, students, entrepreneurs, etc.)",
    })
    .max(500, {
      message: "Target audience must not exceed 500 characters",
    }),

  // OPTIONAL FIELDS (AI determines if not provided)
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Primary color must be a valid hex color (e.g., #387e3d)",
    })
    .optional(),

  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Secondary color must be a valid hex color (e.g., #214228)",
    })
    .optional(),

  preferDarkBackground: z.boolean().optional(),

  userPrompt: z
    .string()
    .max(1000, {
      message: "User prompt must not exceed 1000 characters",
    })
    .optional(),

  // SYSTEM FLAGS
  createFunnel: z.boolean().optional().default(true),
});

// V2 Response Schema (extends V1 with refinement info)
export const generateFunnelResponseSchemaV2 = generateFunnelResponseSchema.extend(
  {
    generationMode: z.enum(["2-step-refined"]).optional(),
    refinementSummary: z
      .object({
        step1Tokens: z.number().int().nonnegative(),
        step2Tokens: z.number().int().nonnegative(),
        recommendedPages: z.number().int().positive(),
        recommendedElementsPerPage: z.number().int().positive(),
      })
      .optional(),
  }
);

export type GenerateFunnelRequestV2 = z.infer<
  typeof generateFunnelRequestSchemaV2
>;
export type GenerateFunnelResponseV2 = z.infer<
  typeof generateFunnelResponseSchemaV2
>;
