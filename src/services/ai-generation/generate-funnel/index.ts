import {
  GEMINI_MODELS,
  selectGeminiModel,
  generateContent,
  generateContentStream,
  parseJSONFromResponse,
} from "../../../utils/ai-generation/gemini-client";
import { getPrisma } from "../../../lib/prisma";
import {
  GenerateFunnelResponseV2,
  generateFunnelRequestSchemaV2,
  GenerateFunnelResponse,
  generateFunnelRequestSchema,
  generateFunnelResponseSchema,
} from "../../../types/ai-generation/generate-funnel";
import {
  buildSystemPrompt,
  buildCompactSystemPrompt,
  buildUserPrompt,
  buildLimitedPrompt,
} from "../../../utils/ai-generation/prompt-builder";
import {
  hasEnoughTokens,
  deductTokens,
  logGeneration,
  estimateTokensForGeneration,
} from "../../../utils/ai-generation/token-tracker";
import {
  validateFunnel,
  sanitizeElements,
} from "../../../utils/ai-generation/validators";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import {
  PageType,
  UserPlan,
  AddOnType,
  BorderRadius,
  ThemeType,
  InsightType,
} from "../../../generated/prisma-client";
import { ZodError } from "zod";
import { WorkspaceValidator } from "../../../utils/workspace-utils/workspace-existence-validation";
import { WorkspaceFunnelAllocations } from "../../../utils/allocations/workspace-funnel-allocations";
import { FunnelPageAllocations } from "../../../utils/allocations/funnel-page-allocations";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import {
  generateTheme,
  ThemeColors,
} from "../../../utils/ai-generation/theme-generator";
import { cacheService } from "../../../services/cache/cache.service";
import {
  convertSeoKeywordsToString,
  convertSeoKeywordsToArray,
} from "./utils/seo-converter.util";
import { replacePageNamesInLinks } from "./utils/link-resolver.util";
import {
  extractQuizElements,
  extractFormElements,
} from "./utils/element-extractor.util";
import { updateElementServerId } from "./utils/element-updater.util";
import { sanitizeElementStyles } from "./utils/style-sanitizer.util";
import { autoFixEnumValues } from "./utils/enum-fixer.util";
import { autoFixMissingFields } from "./utils/element-fixer.util";

const prisma = getPrisma();
const MODELS = GEMINI_MODELS;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RefinementInput {
  funnelType: string;
  businessDescription: string;
  industry: string;
  targetAudience: string;
  userPrompt?: string;
  primaryColor?: string;
  secondaryColor?: string;
  preferDarkBackground?: boolean;
  workspacePlanType: UserPlan;
  addOns: Array<{
    type: AddOnType;
    quantity: number;
    status: string;
    endDate?: Date | null;
  }>;
}

interface PageStructure {
  pageName: string;
  pageType: "PAGE" | "RESULT";
  purpose: string;
  recommendedElements: number;
  keyContent: string[];
}

interface RefinedPromptOutput {
  refinedPrompt: string;
  funnelStrategy: {
    recommendedPages: number;
    recommendedElementsPerPage: number;
    reasoning: string;
  };
  pageStructure: PageStructure[];
  themeRecommendation: {
    suggestedPrimaryColor: string;
    suggestedSecondaryColor: string;
    preferDarkBackground: boolean;
    reasoning: string;
  };
  keyMessaging: string[];
  conversionStrategy: string;
  tokensUsed: number;
}

interface GeneratedFunnel {
  funnelName: string;
  seoMetadata?: {
    defaultSeoTitle: string;
    defaultSeoDescription: string;
    defaultSeoKeywords: string | string[];
  };
  pages: Array<{
    name: string;
    type: "PAGE" | "RESULT";
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string | string[];
    elements: any[];
  }>;
}

// ============================================================================
// STEP 1: PROMPT REFINEMENT (Internal Helpers)
// ============================================================================

function buildRefinementPrompt(request: {
  funnelType: string;
  businessDescription: string;
  industry: string;
  targetAudience: string;
  userPrompt?: string;
  maxAllowedPages: number;
}): string {
  return `You are an expert funnel strategist with deep knowledge of conversion optimization, user psychology, and industry best practices.

## Your Mission:
Analyze the business requirements below and create a comprehensive, detailed funnel strategy that maximizes conversions.

## Business Requirements:
- **Funnel Type:** ${request.funnelType}
- **Business Description:** ${request.businessDescription}
- **Industry:** ${request.industry}
- **Target Audience:** ${request.targetAudience}
${
  request.userPrompt
    ? `- **Additional Requirements:** ${request.userPrompt}`
    : ""
}

## Output Requirements:

You MUST return a JSON object with this EXACT structure:

\`\`\`json
{
  "refinedPrompt": "string (300-800 words)",
  "funnelStrategy": {
    "recommendedPages": number,
    "recommendedElementsPerPage": number,
    "reasoning": "string"
  },
  "pageStructure": [
    {
      "pageName": "string",
      "pageType": "PAGE" | "RESULT",
      "purpose": "string",
      "recommendedElements": number,
      "keyContent": ["string", "string", ...]
    }
  ],
  "themeRecommendation": {
    "suggestedPrimaryColor": "#RRGGBB",
    "suggestedSecondaryColor": "#RRGGBB",
    "preferDarkBackground": boolean,
    "reasoning": "string"
  },
  "keyMessaging": [
    "string",
    "string",
    "string"
  ],
  "conversionStrategy": "string"
}
\`\`\`

## Field Descriptions:

### 1. refinedPrompt (MOST IMPORTANT)
A comprehensive, 300-800 word English description that includes:
- Complete funnel flow and user journey
- Detailed content strategy for each page
- Specific calls-to-action and conversion tactics
- Value propositions and messaging themes
- Visual and design recommendations
- How pages connect and guide the user

⚠️ **CRITICAL: Maximum 800 words (approximately 5000 characters). Do NOT exceed this limit.**

This prompt will be given to another AI to generate the actual funnel, so be EXTREMELY detailed and specific within the word limit.

### 2. funnelStrategy
- **recommendedPages:** Number between 5 and ${
    request.maxAllowedPages
  } (CRITICAL LIMIT)
- **recommendedElementsPerPage:** Number between 8 and 15
- **reasoning:** Why these numbers are optimal for this specific funnel

### 3. pageStructure
An array describing each page in the funnel:
- **pageName:** Descriptive, conversion-focused name
- **pageType:** "PAGE" for regular pages, "RESULT" for thank you/confirmation pages
- **purpose:** What this page achieves in the user journey
- **recommendedElements:** How many elements this page needs
- **keyContent:** Array of specific content pieces this page should have

### 4. themeRecommendation
- **suggestedPrimaryColor:** Hex color that matches industry/psychology
- **suggestedSecondaryColor:** Complementary hex color
- **preferDarkBackground:** true/false based on industry conventions
- **reasoning:** Why these colors work for this business

### 5. keyMessaging
3-5 core value propositions or messaging points that should be repeated across all pages for consistency.

### 6. conversionStrategy
Brief description of the overall conversion strategy and how the funnel guides users to action.

## Strategic Guidelines:

### Page Count Strategy (OPTIMIZED FOR PERFORMANCE):
⚠️ **CRITICAL: Total elements (pages × elements/page) must NOT exceed 70 for reliable generation.**

- **Lead Generation:** 5-7 pages with 8-10 elements/page (landing → benefits → quiz → form → thank you)
- **Sales Funnel:** 6-8 pages with 8-10 elements/page (landing → product → testimonials → pricing → checkout → thank you)
- **Webinar Funnel:** 5-6 pages with 8-10 elements/page (landing → registration → confirmation → reminder → replay)
- **Application Funnel:** 6-8 pages with 8-10 elements/page (landing → benefits → qualification → form → review → thank you)

### Element Count Strategy (CONSERVATIVE):
- **Landing Pages:** 8-10 elements (hero, benefits, social proof, CTA)
- **Content Pages:** 7-9 elements (headlines, text, images, dividers)
- **Quiz Pages:** 5-7 elements (quiz questions + intro/outro)
- **Form Pages:** 6-8 elements (form with 3-5 fields + context)
- **Result Pages:** 5-7 elements (success message, next steps, resources)

**Safe Combinations (total ≤ 70 elements):**
- 7 pages × 10 elements = 70 ✓
- 6 pages × 11 elements = 66 ✓
- 8 pages × 8 elements = 64 ✓
- 5 pages × 12 elements = 60 ✓

### Funnel Flow Best Practices:
1. Start with compelling landing page (AIDA: Attention, Interest, Desire, Action)
2. Build trust with 2-3 educational/benefit pages
3. Segment users with quiz (if applicable)
4. Capture leads with multi-step forms (reduces friction)
5. Create multiple result pages (for different user segments)
6. Always include at least 2 form pages and 2 result pages

### Industry-Specific Considerations:
- **Ecommerce:** Focus on product benefits, urgency, social proof
- **SaaS:** Focus on problem-solution, features, pricing tiers
- **Coaching/Consulting:** Focus on authority, results, testimonials
- **Real Estate:** Focus on listings, comparisons, scheduling
- **Healthcare:** Focus on credentials, patient outcomes, ease of access

## Critical Rules:
1. **MAXIMUM CAPACITY:** Total elements (recommendedPages × recommendedElementsPerPage) must NOT exceed 70
2. **Page Count:** Recommend 5-8 pages (up to ${
    request.maxAllowedPages
  } if lower than 8)
3. **Elements Per Page:** Recommend 8-10 elements per page (never more than 12)
4. **refinedPrompt Quality:** MUST be 300-800 words with specific, actionable details
5. **Industry Alignment:** Theme colors and strategy MUST match the industry
6. **Conversion Focus:** Every decision should optimize for user action
7. **User Journey:** Clear progression from awareness → interest → action → confirmation

⚠️ **BEFORE RETURNING:** Calculate (recommendedPages × recommendedElementsPerPage). If > 70, reduce pages or elements to stay under 70.

Generate the comprehensive strategy now.`;
}

/**
 * Estimate tokens needed for prompt refinement (Step 1) without executing AI
 * @internal
 */
function estimateRefinePromptTokens(input: RefinementInput): number {
  const maxAllowedPages = FunnelPageAllocations.calculateTotalAllocation({
    workspacePlanType: input.workspacePlanType,
    addOns: input.addOns,
  });

  const prompt = buildRefinementPrompt({
    funnelType: input.funnelType,
    businessDescription: input.businessDescription,
    industry: input.industry,
    targetAudience: input.targetAudience,
    userPrompt: input.userPrompt,
    maxAllowedPages,
  });

  const inputTokens = Math.ceil(prompt.length / 4);
  const estimatedOutputTokens = 2500;
  return inputTokens + estimatedOutputTokens;
}

/**
 * Refine user prompt into comprehensive funnel strategy (Step 1)
 * @internal
 */
async function refinePrompt(
  input: RefinementInput
): Promise<RefinedPromptOutput> {
  // Calculate user's max allowed pages
  const maxAllowedPages = FunnelPageAllocations.calculateTotalAllocation({
    workspacePlanType: input.workspacePlanType,
    addOns: input.addOns,
  });

  console.log(`[Refine Prompt] Max allowed pages for user: ${maxAllowedPages}`);

  // Build refinement prompt
  const prompt = buildRefinementPrompt({
    funnelType: input.funnelType,
    businessDescription: input.businessDescription,
    industry: input.industry,
    targetAudience: input.targetAudience,
    userPrompt: input.userPrompt,
    maxAllowedPages,
  });

  // Call Gemini Pro for analysis
  try {
    const response = await generateContent(GEMINI_MODELS.PRO.name, prompt);

    const jsonString = parseJSONFromResponse(response.text);
    const parsed = JSON.parse(jsonString);

    // Validate output structure
    if (!parsed.refinedPrompt || parsed.refinedPrompt.length < 100) {
      throw new BadRequestError(
        "AI failed to generate comprehensive refined prompt (too short)"
      );
    }

    // Enforce maximum length (800 words ≈ 5000 chars, but allow up to 7000 for safety)
    if (parsed.refinedPrompt.length > 7000) {
      console.warn(
        `[Refine Prompt] AI generated refined prompt that is too long (${parsed.refinedPrompt.length} chars). Truncating to 7000 chars.`
      );
      parsed.refinedPrompt = parsed.refinedPrompt.substring(0, 7000);
    }

    if (!parsed.funnelStrategy || !parsed.funnelStrategy.recommendedPages) {
      throw new BadRequestError("AI failed to generate funnel strategy");
    }

    if (
      !Array.isArray(parsed.pageStructure) ||
      parsed.pageStructure.length === 0
    ) {
      throw new BadRequestError("AI failed to generate page structure");
    }

    // Enforce page limit
    if (parsed.funnelStrategy.recommendedPages > maxAllowedPages) {
      console.warn(
        `[Refine Prompt] AI recommended ${parsed.funnelStrategy.recommendedPages} pages, but user limit is ${maxAllowedPages}. Capping to limit.`
      );
      parsed.funnelStrategy.recommendedPages = maxAllowedPages;

      // Also trim page structure if needed
      if (parsed.pageStructure.length > maxAllowedPages) {
        parsed.pageStructure = parsed.pageStructure.slice(0, maxAllowedPages);
      }
    }

    // Ensure minimum pages
    if (parsed.funnelStrategy.recommendedPages < 3) {
      console.warn(
        `[Refine Prompt] AI recommended only ${parsed.funnelStrategy.recommendedPages} pages. Setting minimum to 3.`
      );
      parsed.funnelStrategy.recommendedPages = 3;
    }

    // Enforce 70-element capacity limit (for Gemini Pro with refined prompts at 400 tokens/element)
    const totalElements =
      parsed.funnelStrategy.recommendedPages *
      parsed.funnelStrategy.recommendedElementsPerPage;

    if (totalElements > 70) {
      console.warn(
        `[Refine Prompt] AI recommended ${totalElements} total elements (${parsed.funnelStrategy.recommendedPages} pages × ${parsed.funnelStrategy.recommendedElementsPerPage} elements), which exceeds 70-element limit. Adjusting...`
      );

      // Prioritize keeping more pages with fewer elements (better UX)
      if (parsed.funnelStrategy.recommendedPages > 7) {
        // Too many pages - reduce pages to 7
        parsed.funnelStrategy.recommendedPages = 7;
        parsed.funnelStrategy.recommendedElementsPerPage = 10;
      } else {
        // Reduce elements per page to fit under 70
        parsed.funnelStrategy.recommendedElementsPerPage = Math.floor(
          70 / parsed.funnelStrategy.recommendedPages
        );
      }

      console.warn(
        `[Refine Prompt] Adjusted to ${
          parsed.funnelStrategy.recommendedPages
        } pages × ${
          parsed.funnelStrategy.recommendedElementsPerPage
        } elements = ${
          parsed.funnelStrategy.recommendedPages *
          parsed.funnelStrategy.recommendedElementsPerPage
        } total elements`
      );
    }

    // Use user-provided colors if available, otherwise use AI recommendations
    const finalTheme = {
      suggestedPrimaryColor:
        input.primaryColor ||
        parsed.themeRecommendation?.suggestedPrimaryColor ||
        "#387e3d",
      suggestedSecondaryColor:
        input.secondaryColor ||
        parsed.themeRecommendation?.suggestedSecondaryColor ||
        "#214228",
      preferDarkBackground:
        input.preferDarkBackground !== undefined
          ? input.preferDarkBackground
          : parsed.themeRecommendation?.preferDarkBackground || false,
      reasoning:
        parsed.themeRecommendation?.reasoning || "Default theme colors",
    };

    console.log(
      `[Refine Prompt] Successfully refined. Recommended: ${parsed.funnelStrategy.recommendedPages} pages, ${parsed.funnelStrategy.recommendedElementsPerPage} elements/page. Tokens used: ${response.totalTokens}`
    );

    return {
      refinedPrompt: parsed.refinedPrompt,
      funnelStrategy: parsed.funnelStrategy,
      pageStructure: parsed.pageStructure,
      themeRecommendation: finalTheme,
      keyMessaging: parsed.keyMessaging || [],
      conversionStrategy: parsed.conversionStrategy || "",
      tokensUsed: response.totalTokens,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      throw new BadRequestError(
        `Failed to parse AI refinement response. AI may have returned invalid JSON.`
      );
    }

    throw new BadRequestError(
      `Failed to refine prompt: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ============================================================================
// STEP 2: BATCH GENERATION (Internal Helper)
// ============================================================================

async function generateFunnelBatch(
  userId: number,
  requestBody: Record<string, unknown>
): Promise<GenerateFunnelResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    // Validate request
    const request = generateFunnelRequestSchema.parse(requestBody);

    const prisma = getPrisma();

    // Validate workspace existence and get allocation data
    const workspace = await WorkspaceValidator.validateWithAllocation(
      prisma,
      request.workspaceSlug
    );

    // Check permission using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: workspace.id,
      action: PermissionAction.CREATE_FUNNEL,
    });

    // Check funnel allocation limit EARLY before any AI processing
    const currentFunnelCount = await prisma.funnel.count({
      where: { workspaceId: workspace.id },
    });

    const canCreateFunnel = WorkspaceFunnelAllocations.canCreateFunnel(
      currentFunnelCount,
      {
        workspacePlanType: workspace.owner.plan,
        addOns: workspace.owner.addOns,
      }
    );

    if (!canCreateFunnel) {
      const summary = WorkspaceFunnelAllocations.getAllocationSummary(
        currentFunnelCount,
        {
          workspacePlanType: workspace.owner.plan,
          addOns: workspace.owner.addOns,
        }
      );

      throw new BadRequestError(
        `You've reached the maximum of ${summary.totalAllocation} ${
          summary.totalAllocation === 1 ? "funnel" : "funnels"
        } for this workspace. ` +
          `To create more funnels, upgrade your plan or add extra funnel slots.`
      );
    }

    // Validate requested page count doesn't exceed the allowed limit per funnel
    if (request.maxPages) {
      const maxAllowedPages = FunnelPageAllocations.calculateTotalAllocation({
        workspacePlanType: workspace.owner.plan,
        addOns: workspace.owner.addOns,
      });

      if (request.maxPages > maxAllowedPages) {
        throw new BadRequestError(
          `You've requested ${request.maxPages} ${
            request.maxPages === 1 ? "page" : "pages"
          }, but your plan allows up to ${maxAllowedPages} ${
            maxAllowedPages === 1 ? "page" : "pages"
          } per funnel. ` + `Please try with ${maxAllowedPages} or fewer pages.`
        );
      }
    }

    // Calculate estimated output tokens BEFORE generating to prevent wasted API calls
    const totalElements =
      (request.maxPages || 3) * (request.maxElementsPerPage || 8);
    const isLargeGeneration = totalElements > 40; // More than 40 elements needs optimization

    // Estimate output tokens needed (VERY conservative with data URI placeholders)
    // Real-world data shows WITH data URIs:
    // - Data URI placeholder adds ~35 tokens per image/video element
    // - Complex elements (forms, quizzes with images, FAQs) = 300-500 tokens
    // - Medium elements (text, buttons, media-with-text with images) = 200-300 tokens
    // - Simple elements (text, buttons, icons without images) = 100-150 tokens
    // - AI generates MUCH more detailed content when given short/vague descriptions
    // Average VERY conservatively at 300 tokens per element (accounts for rich content + data URIs)
    // Plus page structure, SEO metadata, funnel wrapper (~3000 tokens for safety)

    // REFINED PROMPT DETECTION: When businessDescription is a refined prompt (300-800 words),
    // the AI generates much richer, more detailed content. This can DOUBLE the output size.
    // Detect refined prompts by length (>500 chars = likely from refinement step)
    const isRefinedPrompt = request.businessDescription.length > 500;
    const tokensPerElement = isRefinedPrompt ? 400 : 300; // Refined uses 400, direct uses 300
    const baseOverhead = isRefinedPrompt ? 4000 : 3000; // Refined has richer structure

    const estimatedOutputTokens =
      totalElements * tokensPerElement + baseOverhead;

    // Select appropriate model based on complexity, size, and token requirements
    const selectedModel = selectGeminiModel(estimatedOutputTokens, {
      totalElements,
      promptLength: request.businessDescription.length,
    });
    const MAX_OUTPUT_TOKENS = selectedModel.maxOutputTokens;

    // Log model selection for debugging
    console.log(
      `[AI Generation - Batch] Using Gemini Pro model for ${totalElements} elements (estimated ${estimatedOutputTokens} output tokens, prompt length: ${
        request.businessDescription.length
      } chars)${
        isRefinedPrompt
          ? ` [Refined Context - Using ${tokensPerElement} tokens/element]`
          : ` [Direct - Using ${tokensPerElement} tokens/element]`
      }`
    );

    // Pre-validate: Check if generation will exceed even Pro's output token limit
    if (estimatedOutputTokens > MODELS.PRO.maxOutputTokens) {
      // Calculate maximum safe values using actual tokensPerElement estimate
      const maxSafeElements = Math.floor(
        (MODELS.PRO.maxOutputTokens - baseOverhead) / tokensPerElement
      );
      const suggestedMaxPages = Math.floor(
        maxSafeElements / (request.maxElementsPerPage || 8)
      );
      const suggestedMaxElements = Math.floor(
        maxSafeElements / (request.maxPages || 3)
      );

      throw new BadRequestError(
        `This generation requires approximately ${estimatedOutputTokens} output tokens, which exceeds even our largest model's capacity (${MODELS.PRO.maxOutputTokens} tokens). ` +
          `Maximum capacity: ~${maxSafeElements} elements (e.g., ${Math.floor(
            maxSafeElements / 10
          )} pages × 10 elements). ` +
          `Try one of these options:\n` +
          `• Reduce pages to ${suggestedMaxPages} or fewer (keeping ${request.maxElementsPerPage} elements per page)\n` +
          `• Reduce elements per page to ${suggestedMaxElements} or fewer (keeping ${request.maxPages} pages)\n` +
          `• Recommended: ${Math.min(
            24,
            suggestedMaxPages
          )} pages with ${Math.min(10, suggestedMaxElements)} elements each`
      );
    }

    // Build prompts
    const systemPrompt = isLargeGeneration
      ? buildCompactSystemPrompt()
      : buildSystemPrompt();
    const userPrompt = request.maxPages
      ? buildLimitedPrompt(
          request.businessDescription,
          request.maxPages,
          request.maxElementsPerPage || 8,
          request.userPrompt
        )
      : buildUserPrompt(
          request.businessDescription,
          request.industry,
          request.targetAudience,
          request.funnelType,
          request.userPrompt
        );

    // Estimate input token usage
    const estimatedInputTokens = estimateTokensForGeneration(
      systemPrompt.length + userPrompt.length,
      request.maxPages || 3
    );

    // Check if user has enough tokens (input + estimated output)
    const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;
    const canGenerate = await hasEnoughTokens(userId, totalEstimatedTokens);
    if (!canGenerate) {
      throw new BadRequestError(
        `Insufficient AI tokens. Estimated ${totalEstimatedTokens} tokens needed for this generation (${estimatedInputTokens} input + ${estimatedOutputTokens} output).`
      );
    }

    // Call Gemini API with selected model
    let generatedFunnel: GeneratedFunnel;
    let actualTokensUsed: number;

    try {
      // Always use streaming for Pro to handle long-running generations
      let response: {
        text: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      };

      // Use streaming for better handling of large responses
      response = await generateContentStream(
        selectedModel.name,
        userPrompt,
        systemPrompt
      );

      // Extract token usage
      actualTokensUsed = response.totalTokens;

      // Gemini doesn't have explicit stop_reason, check if output seems truncated
      // by comparing output tokens to max limit
      const isLikelyTruncated =
        response.outputTokens >= MAX_OUTPUT_TOKENS * 0.95;

      if (isLikelyTruncated) {
        // Calculate safe suggestions using actual tokensPerElement estimate
        const maxSafeElements = Math.floor(
          (MAX_OUTPUT_TOKENS - baseOverhead) / tokensPerElement
        );
        const suggestedPages = Math.floor(
          maxSafeElements / (request.maxElementsPerPage || 8)
        );
        const suggestedElements = Math.floor(
          maxSafeElements / (request.maxPages || 3)
        );

        // Return error with token usage info (but DON'T deduct tokens - user shouldn't pay for failed generation)
        const error: any = new BadRequestError(
          `Generation may be truncated at Gemini Pro token limit (${MAX_OUTPUT_TOKENS}). Used ${actualTokensUsed} tokens (not charged). ` +
            `Try: ${suggestedPages} pages × ${request.maxElementsPerPage} elements, or ${request.maxPages} pages × ${suggestedElements} elements.`
        );
        error.tokensWasted = actualTokensUsed;
        error.metadata = {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: actualTokensUsed,
          model: selectedModel.name,
        };
        throw error;
      }

      // Parse response using Gemini-aware JSON extraction
      const jsonString = parseJSONFromResponse(response.text);
      if (!jsonString) {
        console.error(
          "AI response did not contain JSON:",
          response.text.substring(0, 500)
        );
        throw new BadRequestError(
          "AI response did not contain valid JSON. Please try again or adjust your requirements."
        );
      }

      try {
        generatedFunnel = JSON.parse(jsonString);
      } catch (parseError) {
        console.error(
          "Failed to parse AI JSON response:",
          jsonString.substring(0, 500)
        );
        console.error("Parse error:", parseError);
        throw new BadRequestError(
          "AI generated invalid JSON. Please try reducing the complexity of your request (fewer pages or elements per page)."
        );
      }
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(
        `Failed to generate funnel: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Auto-fix missing required fields FIRST (before enum fixing)
    generatedFunnel.pages = generatedFunnel.pages.map((page) => ({
      ...page,
      elements: autoFixMissingFields(page.elements),
    }));

    // Auto-fix common enum casing issues before validation
    generatedFunnel.pages = generatedFunnel.pages.map((page) => ({
      ...page,
      elements: autoFixEnumValues(page.elements),
    }));

    // Validate generated funnel structure
    const validation = validateFunnel(generatedFunnel);
    if (!validation.valid) {
      const errorMessages = validation.errors
        .map((err) => {
          const prefix = err.page ? `Page ${err.page}` : "Funnel";
          return `${prefix}: ${err.errors.join(", ")}`;
        })
        .join("; ");

      throw new BadRequestError(
        `AI generated invalid funnel structure: ${errorMessages}`
      );
    }

    // Validate that generated funnel doesn't exceed page limit
    const maxAllowedPages = FunnelPageAllocations.calculateTotalAllocation({
      workspacePlanType: workspace.owner.plan,
      addOns: workspace.owner.addOns,
    });

    if (generatedFunnel.pages.length > maxAllowedPages) {
      throw new BadRequestError(
        `Your funnel has ${generatedFunnel.pages.length} ${
          generatedFunnel.pages.length === 1 ? "page" : "pages"
        }, but your plan allows up to ${maxAllowedPages} ${
          maxAllowedPages === 1 ? "page" : "pages"
        } per funnel. ` +
          `Please try again with ${maxAllowedPages} or fewer pages.`
      );
    }

    // Sanitize elements (remove standalone faq-items, ensure IDs, etc.)
    generatedFunnel.pages = generatedFunnel.pages.map((page) => ({
      ...page,
      elements: sanitizeElements(page.elements),
    }));

    // Sanitize element styles (remove animations, margins, and layout-breaking properties)
    generatedFunnel.pages = generatedFunnel.pages.map((page) => ({
      ...page,
      elements: sanitizeElementStyles(page.elements),
    }));

    // Generate theme for the funnel
    const themeColors = await generateTheme({
      primaryColor: request.primaryColor,
      secondaryColor: request.secondaryColor,
      preferDarkBackground: request.preferDarkBackground,
      businessDescription: request.businessDescription,
      industry: request.industry,
    });

    // Create funnel in database if requested
    let funnelId: number | undefined;
    let createdPages: Array<{
      id: number;
      name: string;
      type: PageType;
      order: number;
      content: string;
      elements: any[];
    }> = [];
    let createdTheme: any = undefined;
    let createdSeoSettings: any = undefined;

    if (request.createFunnel) {
      // Pre-generate linkingIds for all pages to enable cross-page linking
      const timestamp = Date.now();
      const pageNameToLinkingId = new Map<string, string>();
      generatedFunnel.pages.forEach((page, index) => {
        const linkingId = `${page.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}-${timestamp}-${index}`;
        pageNameToLinkingId.set(page.name, linkingId);
      });

      // Replace page name references in element links with actual linkingIds
      generatedFunnel.pages.forEach((page) => {
        page.elements = replacePageNamesInLinks(
          page.elements,
          pageNameToLinkingId
        );
      });

      const result = await prisma.$transaction(async (tx) => {
        // Create funnel with required fields
        // Generate unique slug from funnel name
        const slug = generatedFunnel.funnelName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Check if funnel name already exists in workspace and make it unique if needed
        let funnelName = generatedFunnel.funnelName;
        const existingFunnel = await tx.funnel.findFirst({
          where: {
            workspaceId: workspace.id,
            name: funnelName,
          },
        });

        // If name exists, append timestamp to make it unique
        if (existingFunnel) {
          funnelName = `${
            generatedFunnel.funnelName
          } (${new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })})`;
        }

        const funnel = await tx.funnel.create({
          data: {
            name: funnelName,
            slug: `${slug}-${timestamp}`, // Ensure uniqueness
            workspaceId: workspace.id,
            createdBy: userId,
          },
        });

        // Create custom theme for this funnel
        const theme = await tx.theme.create({
          data: {
            name: `${funnelName} Theme`,
            backgroundColor: themeColors.backgroundColor,
            textColor: themeColors.textColor,
            buttonColor: themeColors.buttonColor,
            buttonTextColor: themeColors.buttonTextColor,
            borderColor: themeColors.borderColor,
            optionColor: themeColors.optionColor,
            fontFamily: "Inter, sans-serif",
            borderRadius: BorderRadius.SOFT,
            type: ThemeType.CUSTOM,
            funnelId: funnel.id,
          },
        });

        // Update funnel to use this theme as active theme
        await tx.funnel.update({
          where: { id: funnel.id },
          data: { activeThemeId: theme.id },
        });

        // Create FunnelSettings with AI-generated SEO metadata
        const funnelSettings = await tx.funnelSettings.create({
          data: {
            funnelId: funnel.id,
            defaultSeoTitle:
              generatedFunnel.seoMetadata?.defaultSeoTitle ||
              `${generatedFunnel.funnelName} - High-Converting Sales Funnel`,
            defaultSeoDescription:
              generatedFunnel.seoMetadata?.defaultSeoDescription ||
              `Discover ${generatedFunnel.funnelName} and transform your business with our conversion-optimized funnel. Get started today!`,
            defaultSeoKeywords:
              convertSeoKeywordsToString(
                generatedFunnel.seoMetadata?.defaultSeoKeywords
              ) ||
              (request.industry
                ? `${request.industry}, sales funnel, conversion, ${generatedFunnel.funnelName}`
                : `sales funnel, conversion, ${generatedFunnel.funnelName}`),
            language: "en",
            timezone: "UTC",
            dateFormat: "DD.MM.YYYY",
            enableCookieConsent: false,
            isPasswordProtected: false,
          },
        });

        // Create pages with pre-generated linkingIds
        const pages = await Promise.all(
          generatedFunnel.pages.map(async (page, index) => {
            const linkingId = pageNameToLinkingId.get(page.name)!;

            // First, create Insights and Forms for elements on this page
            let updatedElements = [...page.elements];

            // Extract and create Insights for quiz elements
            const quizElements = extractQuizElements(page.elements);
            for (const quizElement of quizElements) {
              // Extract question text from first child (TextElement)
              const questionElement = quizElement.children?.find(
                (child: any) => child.type === "text"
              );
              const questionText =
                questionElement?.content?.label || "Quiz Question";

              const insight = await tx.insight.create({
                data: {
                  type: InsightType.QUIZ,
                  name: questionText.substring(0, 255), // Truncate to max length
                  description: `Auto-generated quiz from ${page.name}`,
                  content: quizElement.children || [],
                  settings: {},
                  funnelId: funnel.id,
                },
              });

              // Update the quiz element with the serverId
              updatedElements = updateElementServerId(
                updatedElements,
                quizElement.id,
                insight.id
              );
            }

            // Extract and create Forms for form elements
            const formElements = extractFormElements(page.elements);
            for (const formElement of formElements) {
              // Extract form title from first child (TextElement)
              const titleElement = formElement.children?.find(
                (child: any) => child.type === "text"
              );
              const formTitle = titleElement?.content?.label || "Form";

              const form = await tx.form.create({
                data: {
                  name: formTitle.substring(0, 255), // Truncate to max length
                  description: `Auto-generated form from ${page.name}`,
                  formContent: formElement.children || [],
                  isActive: true,
                  funnelId: funnel.id,
                  webhookEnabled:
                    formElement.integration?.webhookEnabled || false,
                  webhookUrl: formElement.integration?.webhookUrl || null,
                },
              });

              // Update the form element with the serverId
              updatedElements = updateElementServerId(
                updatedElements,
                formElement.id,
                form.id
              );
            }

            const createdPage = await tx.page.create({
              data: {
                name: page.name,
                type: page.type === "RESULT" ? PageType.RESULT : PageType.PAGE,
                funnelId: funnel.id,
                order: index + 1,
                content: JSON.stringify(updatedElements),
                linkingId: linkingId,
                seoTitle:
                  page.seoTitle ||
                  `${page.name} - ${generatedFunnel.funnelName}`,
                seoDescription:
                  page.seoDescription ||
                  `Explore ${page.name} and take the next step in your journey with ${generatedFunnel.funnelName}.`,
                seoKeywords:
                  convertSeoKeywordsToString(page.seoKeywords) ||
                  convertSeoKeywordsToString(
                    generatedFunnel.seoMetadata?.defaultSeoKeywords
                  ) ||
                  "",
              },
            });

            return {
              id: createdPage.id,
              name: createdPage.name,
              type: createdPage.type,
              order: createdPage.order,
              content: createdPage.content,
              elements: updatedElements,
            };
          })
        );

        return { funnel, pages, theme, funnelSettings };
      });

      funnelId = result.funnel.id;
      createdPages = result.pages;
      createdTheme = result.theme;
      createdSeoSettings = result.funnelSettings;

      // Invalidate workspace funnels cache
      await cacheService.del(`workspace:${workspace.id}:funnels:all`);
      await cacheService.del(`workspace:${workspace.id}:funnels:list`);
      await cacheService.del(
        `user:${userId}:workspace:${workspace.id}:funnels`
      );
    }

    // Log the generation
    const generationLogId = await logGeneration(
      userId,
      workspace.id,
      funnelId || null,
      request.businessDescription,
      actualTokensUsed,
      generatedFunnel.pages.length,
      selectedModel.name
    );

    // Deduct tokens from user's balance
    const tokenResult = await deductTokens(
      userId,
      actualTokensUsed,
      generationLogId,
      `Generated funnel: ${generatedFunnel.funnelName}`
    );

    // Build response
    const response = {
      message: request.createFunnel
        ? "Funnel generated and saved successfully"
        : "Funnel generated successfully (not saved)",
      funnel: {
        id: funnelId,
        name: generatedFunnel.funnelName,
        pages: request.createFunnel
          ? createdPages.map((page) => ({
              id: page.id,
              name: page.name,
              type:
                page.type === PageType.RESULT
                  ? ("RESULT" as const)
                  : ("PAGE" as const),
              order: page.order,
            }))
          : generatedFunnel.pages.map((page, index) => ({
              name: page.name,
              type: page.type,
              order: index + 1,
            })),
        theme: createdTheme
          ? {
              id: createdTheme.id,
              name: createdTheme.name,
              backgroundColor: createdTheme.backgroundColor,
              textColor: createdTheme.textColor,
              buttonColor: createdTheme.buttonColor,
              buttonTextColor: createdTheme.buttonTextColor,
              borderColor: createdTheme.borderColor,
              optionColor: createdTheme.optionColor,
              fontFamily: createdTheme.fontFamily,
              borderRadius: createdTheme.borderRadius,
            }
          : {
              name: "AI Generated Theme",
              backgroundColor: themeColors.backgroundColor,
              textColor: themeColors.textColor,
              buttonColor: themeColors.buttonColor,
              buttonTextColor: themeColors.buttonTextColor,
              borderColor: themeColors.borderColor,
              optionColor: themeColors.optionColor,
              fontFamily: "Inter, sans-serif",
              borderRadius: BorderRadius.SOFT,
            },
        seoSettings:
          request.createFunnel && createdSeoSettings
            ? {
                id: createdSeoSettings.id,
                defaultSeoTitle: createdSeoSettings.defaultSeoTitle,
                defaultSeoDescription: createdSeoSettings.defaultSeoDescription,
                defaultSeoKeywords: convertSeoKeywordsToArray(
                  createdSeoSettings.defaultSeoKeywords
                ),
              }
            : undefined,
      },
      tokensUsed: actualTokensUsed,
      remainingTokens: tokenResult.remainingTokens,
      generationLogId,
      generationMode: "batch" as const,
    };

    return generateFunnelResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
}

// ============================================================================
// PUBLIC API: Main Entry Point
// ============================================================================

/**
 * Generate funnel using 2-step refinement process
 *
 * @param userId - User performing the generation
 * @param requestBody - Request body (validated against schema)
 * @returns Generated funnel with refinement summary
 *
 * @public This is the ONLY exported function - main API for funnel generation
 */
export async function generateFunnel(
  userId: number,
  requestBody: Record<string, unknown>
): Promise<GenerateFunnelResponseV2> {
  // 1. Validate request
  const request = generateFunnelRequestSchemaV2.parse(requestBody);

  console.log("[AI Funnel Generation] Starting 2-step refinement process");
  console.log(`[AI Funnel Generation] Funnel Type: ${request.funnelType}`);
  console.log(`[AI Funnel Generation] Industry: ${request.industry}`);
  console.log(
    `[AI Funnel Generation] Target Audience: ${request.targetAudience}`
  );

  // 2. Get workspace and check permissions
  const workspace = await WorkspaceValidator.validateWithAllocation(
    prisma,
    request.workspaceSlug
  );

  await PermissionManager.requirePermission({
    userId,
    workspaceId: workspace.id,
    action: PermissionAction.CREATE_FUNNEL,
  });

  // 3. Check funnel allocation
  const currentFunnelCount = await prisma.funnel.count({
    where: { workspaceId: workspace.id },
  });

  const canCreateFunnel = WorkspaceFunnelAllocations.canCreateFunnel(
    currentFunnelCount,
    {
      workspacePlanType: workspace.owner.plan,
      addOns: workspace.owner.addOns,
    }
  );

  if (!canCreateFunnel) {
    throw new BadRequestError(
      "Funnel allocation limit reached for this workspace"
    );
  }

  // 4. Estimate total token cost BEFORE any AI execution
  console.log("[AI Funnel Generation] Checking token availability...");

  const estimatedStep1Tokens = estimateRefinePromptTokens({
    funnelType: request.funnelType,
    businessDescription: request.businessDescription,
    industry: request.industry,
    targetAudience: request.targetAudience,
    userPrompt: request.userPrompt,
    primaryColor: request.primaryColor,
    secondaryColor: request.secondaryColor,
    preferDarkBackground: request.preferDarkBackground,
    workspacePlanType: workspace.owner.plan,
    addOns: workspace.owner.addOns,
  });

  const typicalPages = 6;
  const typicalElementsPerPage = 10;
  const totalElements = typicalPages * typicalElementsPerPage;
  const tokensPerElement = 400;
  const baseOverhead = 4000;
  const estimatedStep2Tokens = totalElements * tokensPerElement + baseOverhead;
  const totalEstimatedTokens = estimatedStep1Tokens + estimatedStep2Tokens;

  // 5. Check token availability
  const canGenerate = await hasEnoughTokens(userId, totalEstimatedTokens);
  if (!canGenerate) {
    throw new BadRequestError(
      "Insufficient AI tokens to generate this funnel. Please add more tokens to your account."
    );
  }

  console.log(
    "[AI Funnel Generation] Token check passed. Starting generation..."
  );

  // 6. STEP 1: Refine Prompt
  console.log("[AI Funnel Generation] STEP 1: Analyzing your requirements...");

  const refinedOutput = await refinePrompt({
    funnelType: request.funnelType,
    businessDescription: request.businessDescription,
    industry: request.industry,
    targetAudience: request.targetAudience,
    userPrompt: request.userPrompt,
    primaryColor: request.primaryColor,
    secondaryColor: request.secondaryColor,
    preferDarkBackground: request.preferDarkBackground,
    workspacePlanType: workspace.owner.plan,
    addOns: workspace.owner.addOns,
  });

  console.log(
    `[AI Funnel Generation] Step 1 Complete - ${refinedOutput.tokensUsed} tokens used`
  );
  console.log(
    `[AI Funnel Generation] Recommended: ${refinedOutput.funnelStrategy.recommendedPages} pages, ${refinedOutput.funnelStrategy.recommendedElementsPerPage} elements/page`
  );

  // 7. STEP 2: Generate Funnel
  console.log(
    "[AI Funnel Generation] STEP 2: Generating funnel with refined context..."
  );

  const batchRequest = {
    workspaceSlug: request.workspaceSlug,
    businessDescription: refinedOutput.refinedPrompt,
    industry: request.industry,
    targetAudience: request.targetAudience,
    maxPages: refinedOutput.funnelStrategy.recommendedPages,
    maxElementsPerPage: refinedOutput.funnelStrategy.recommendedElementsPerPage,
    primaryColor: refinedOutput.themeRecommendation.suggestedPrimaryColor,
    secondaryColor: refinedOutput.themeRecommendation.suggestedSecondaryColor,
    preferDarkBackground:
      refinedOutput.themeRecommendation.preferDarkBackground,
    userPrompt: undefined,
    createFunnel: request.createFunnel,
  };

  const batchResult = await generateFunnelBatch(userId, batchRequest);

  console.log(
    `[AI Funnel Generation] Step 2 Complete - ${batchResult.tokensUsed} tokens used`
  );

  // 8. Calculate total tokens
  const totalTokensUsed = refinedOutput.tokensUsed + batchResult.tokensUsed;

  console.log(
    `[AI Funnel Generation] Total tokens used: ${totalTokensUsed} (Step 1: ${refinedOutput.tokensUsed}, Step 2: ${batchResult.tokensUsed})`
  );

  // 9. Update generation log
  if (batchResult.generationLogId) {
    await prisma.aIGenerationLog.update({
      where: { id: batchResult.generationLogId },
      data: {
        tokensUsed: totalTokensUsed,
        model: "gemini-2.5-pro (2-step-refined)",
      },
    });
  }

  // 10. Return response
  return {
    ...batchResult,
    generationMode: "2-step-refined",
    refinementSummary: {
      step1Tokens: refinedOutput.tokensUsed,
      step2Tokens: batchResult.tokensUsed,
      recommendedPages: refinedOutput.funnelStrategy.recommendedPages,
      recommendedElementsPerPage:
        refinedOutput.funnelStrategy.recommendedElementsPerPage,
    },
    tokensUsed: totalTokensUsed,
  };
}
