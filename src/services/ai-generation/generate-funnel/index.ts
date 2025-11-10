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
  hasEnoughPrompts,
  deductPrompts,
  logGeneration,
} from "../../../utils/ai-generation/prompt-tracker";
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
- **recommendedPages:** Optimal number of pages for this funnel type
- **recommendedElementsPerPage:** Optimal number of elements per page
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

### Page Count Strategy:
- **Lead Generation:** 5-7 pages (landing → benefits → quiz → form → thank you)
- **Sales Funnel:** 6-8 pages (landing → product → testimonials → pricing → checkout → thank you)
- **Webinar Funnel:** 5-6 pages (landing → registration → confirmation → reminder → replay)
- **Application Funnel:** 6-8 pages (landing → benefits → qualification → form → review → thank you)

### Element Count Strategy:
- **Landing Pages:** 8-12 elements (hero, benefits, social proof, CTA)
- **Content Pages:** 7-10 elements (headlines, text, images, dividers)
- **Quiz Pages:** 5-8 elements (quiz questions + intro/outro)
- **Form Pages:** 6-9 elements (form with 3-5 fields + context)
- **Result Pages:** 5-8 elements (success message, next steps, resources)

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
1. **refinedPrompt Quality:** MUST be 300-800 words with specific, actionable details
2. **Industry Alignment:** Theme colors and strategy MUST match the industry
3. **Conversion Focus:** Every decision should optimize for user action
4. **User Journey:** Clear progression from awareness → interest → action → confirmation
5. **Flexibility:** Generate as many pages and elements as needed for optimal funnel performance

Generate the comprehensive strategy now.`;
}

/**
 * Estimate prompts needed for prompt refinement (Step 1)
 * Note: In the new prompt-based model, each AI call = 1 prompt regardless of size
 * @internal
 */
function estimateRefinePromptPrompts(input: RefinementInput): number {
  // Step 1 (refinement) = 1 prompt
  return 1;
}

/**
 * Refine user prompt into comprehensive funnel strategy (Step 1)
 * @internal
 */
async function refinePrompt(
  input: RefinementInput
): Promise<RefinedPromptOutput> {
  console.log(`[Refine Prompt] Generating refinement strategy...`);

  // Build refinement prompt
  const prompt = buildRefinementPrompt({
    funnelType: input.funnelType,
    businessDescription: input.businessDescription,
    industry: input.industry,
    targetAudience: input.targetAudience,
    userPrompt: input.userPrompt,
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

    // Ensure minimum pages
    if (parsed.funnelStrategy.recommendedPages < 3) {
      console.warn(
        `[Refine Prompt] AI recommended only ${parsed.funnelStrategy.recommendedPages} pages. Setting minimum to 3.`
      );
      parsed.funnelStrategy.recommendedPages = 3;
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

    // Detect refined prompts by length (>500 chars = likely from refinement step)
    const isRefinedPrompt = request.businessDescription.length > 500;
    const isLargeGeneration = isRefinedPrompt; // Refined prompts are more complex

    // Select appropriate model (always use Pro for best quality)
    const selectedModel = MODELS.PRO;
    const MAX_OUTPUT_TOKENS = selectedModel.maxOutputTokens;

    // Log model selection for debugging
    console.log(
      `[AI Generation - Batch] Using ${selectedModel.name} (prompt length: ${
        request.businessDescription.length
      } chars)${
        isRefinedPrompt
          ? ` [Refined Context]`
          : ` [Direct]`
      }`
    );

    // Build prompts
    const systemPrompt = isLargeGeneration
      ? buildCompactSystemPrompt()
      : buildSystemPrompt();
    const userPrompt = buildUserPrompt(
      request.businessDescription,
      request.industry,
      request.targetAudience,
      request.funnelType,
      request.userPrompt
    );

    // Check if user has enough prompts (1 prompt per generation)
    const canGenerate = await hasEnoughPrompts(userId, 1);
    if (!canGenerate) {
      throw new BadRequestError(
        `Insufficient AI prompts. This generation requires 1 prompt.`
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
        // Return error with token usage info (but DON'T deduct tokens - user shouldn't pay for failed generation)
        const error: any = new BadRequestError(
          `Generation may be truncated at Gemini Pro token limit (${MAX_OUTPUT_TOKENS}). Used ${actualTokensUsed} tokens (not charged). ` +
            `Please try simplifying your request or reducing the funnel complexity.`
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

    // Create funnel in database (always after allocation checks pass)
    let funnelId: number;
    let createdPages: Array<{
      id: number;
      name: string;
      type: PageType;
      order: number;
      content: string;
      elements: any[];
    }> = [];
    let createdTheme: any;
    let createdSeoSettings: any;

    {
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

    // Log the generation (track actual tokens for analytics, prompts for billing)
    const generationLogId = await logGeneration(
      userId,
      workspace.id,
      funnelId || null,
      request.businessDescription,
      actualTokensUsed, // Track actual API token usage for analytics
      1, // promptsUsed = 1 for this generation
      generatedFunnel.pages.length,
      selectedModel.name
    );

    // Deduct prompts from user's balance (always 1 prompt per generation)
    const promptResult = await deductPrompts(
      userId,
      1, // Always deduct 1 prompt
      generationLogId,
      `Generated funnel: ${generatedFunnel.funnelName}`
    );

    // Build response
    const response = {
      message: "Funnel generated and saved successfully",
      funnel: {
        id: funnelId,
        name: generatedFunnel.funnelName,
        pages: createdPages.map((page) => ({
          id: page.id,
          name: page.name,
          type:
            page.type === PageType.RESULT
              ? ("RESULT" as const)
              : ("PAGE" as const),
          order: page.order,
        })),
        theme: {
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
        },
        seoSettings: {
          id: createdSeoSettings.id,
          defaultSeoTitle: createdSeoSettings.defaultSeoTitle,
          defaultSeoDescription: createdSeoSettings.defaultSeoDescription,
          defaultSeoKeywords: convertSeoKeywordsToArray(
            createdSeoSettings.defaultSeoKeywords
          ),
        },
      },
      promptsUsed: 1, // Always 1 prompt per generation
      remainingPrompts: promptResult.remainingPrompts,
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

  // 4. Check prompt availability (2-step process = 1 prompt total for user)
  console.log("[AI Funnel Generation] Checking prompt availability...");

  // In the new prompt-based model: 2-step refined generation = 1 prompt (transparent to user)
  const totalPromptsNeeded = 1;

  // 5. Check prompt availability
  const canGenerate = await hasEnoughPrompts(userId, totalPromptsNeeded);
  if (!canGenerate) {
    throw new BadRequestError(
      "Insufficient AI prompts to generate this funnel. Please add more prompts to your account."
    );
  }

  console.log(
    "[AI Funnel Generation] Prompt check passed. Starting generation..."
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
    primaryColor: refinedOutput.themeRecommendation.suggestedPrimaryColor,
    secondaryColor: refinedOutput.themeRecommendation.suggestedSecondaryColor,
    preferDarkBackground:
      refinedOutput.themeRecommendation.preferDarkBackground,
    userPrompt: undefined,
  };

  const batchResult = await generateFunnelBatch(userId, batchRequest);

  console.log(
    `[AI Funnel Generation] Step 2 Complete - ${batchResult.promptsUsed} prompt used`
  );

  // 8. Calculate total tokens (for analytics) and prompts (for billing)
  const totalTokensUsed = refinedOutput.tokensUsed + (batchResult as any).actualTokensUsed || 0;
  const totalPromptsUsed = 1; // 2-step refinement = 1 prompt total

  console.log(
    `[AI Funnel Generation] Total: ${totalPromptsUsed} prompt used (${totalTokensUsed} API tokens for analytics)`
  );

  // 9. Update generation log with complete information
  if (batchResult.generationLogId) {
    await prisma.aIGenerationLog.update({
      where: { id: batchResult.generationLogId },
      data: {
        actualTokensUsed: totalTokensUsed,
        promptsUsed: totalPromptsUsed,
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
      step2Tokens: (batchResult as any).actualTokensUsed || 0,
      recommendedPages: refinedOutput.funnelStrategy.recommendedPages,
      recommendedElementsPerPage:
        refinedOutput.funnelStrategy.recommendedElementsPerPage,
    },
    promptsUsed: totalPromptsUsed,
  };
}
