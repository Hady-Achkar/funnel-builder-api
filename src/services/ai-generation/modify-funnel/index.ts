import {
  GEMINI_MODELS,
  selectGeminiModel,
  generateContentStream,
  parseJSONFromResponse,
} from "../../../utils/ai-generation/gemini-client";
import { getPrisma } from "../../../lib/prisma";
import {
  ModifyFunnelRequest,
  ModifyFunnelResponse,
  modifyFunnelRequestSchema,
  modifyFunnelResponseSchema,
} from "../../../types/ai-generation/modify-funnel";
import {
  buildModifyFunnelSystemPrompt,
  buildModifyFunnelUserPrompt,
} from "../../../utils/ai-generation/prompt-builder/modify-funnel";
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
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../../errors";
import { PageType, InsightType } from "../../../generated/prisma-client";
import { ZodError } from "zod";
import { FunnelPageAllocations } from "../../../utils/allocations/funnel-page-allocations";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { cacheService } from "../../../services/cache/cache.service";
import {
  convertSeoKeywordsToString,
  convertSeoKeywordsToArray,
} from "../generate-funnel/utils/seo-converter.util";
import { replacePageNamesInLinks } from "../generate-funnel/utils/link-resolver.util";
import {
  extractQuizElements,
  extractFormElements,
} from "../generate-funnel/utils/element-extractor.util";
import { updateElementServerId } from "../generate-funnel/utils/element-updater.util";
import { sanitizeElementStyles } from "../generate-funnel/utils/style-sanitizer.util";
import { autoFixEnumValues } from "../generate-funnel/utils/enum-fixer.util";
import { autoFixMissingFields } from "../generate-funnel/utils/element-fixer.util";

const prisma = getPrisma();
const MODELS = GEMINI_MODELS;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ModifiedPage {
  id: number | null; // null for new pages, number for existing pages
  name: string;
  type: "PAGE" | "RESULT";
  order: number;
  seoTitle: string;
  seoDescription: string;
  content: any[];
}

interface ModificationResult {
  pages: ModifiedPage[];
  modificationSummary: {
    pagesModified: number;
    pagesCreated: number;
    changes: string;
  };
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Modify existing funnel using AI
 *
 * @param userId - User performing the modification
 * @param requestBody - Request body with funnelId, pageIds, userPrompt, etc.
 * @returns Modified funnel with token usage details
 */
export async function modifyFunnel(
  userId: number,
  requestBody: Record<string, unknown>
): Promise<ModifyFunnelResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    // Validate request
    const request = modifyFunnelRequestSchema.parse(requestBody);

    console.log(`[AI Funnel Modification] Starting modification for funnel ID ${request.funnelId}`);
    console.log(`[AI Funnel Modification] User prompt: "${request.userPrompt.substring(0, 100)}..."`);
    console.log(`[AI Funnel Modification] Allow new pages: ${request.allowGenerateNewPages}`);

    // Fetch funnel with pages and workspace (workspace is extracted from funnel)
    const funnel = await prisma.funnel.findUnique({
      where: { id: request.funnelId },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
        workspace: {
          include: {
            owner: {
              include: {
                addOns: true,
              },
            },
          },
        },
      },
    });

    if (!funnel) {
      throw new NotFoundError(`Funnel with ID ${request.funnelId} not found`);
    }

    // Extract workspace from funnel (no need for separate workspaceSlug parameter)
    const workspace = funnel.workspace;

    // Check permission using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: workspace.id,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // CRITICAL: Validate page allocations BEFORE any processing
    // Calculate maximum allowed pages for this workspace's plan
    const maxAllowedPages = FunnelPageAllocations.calculateTotalAllocation({
      workspacePlanType: workspace.owner.plan,
      addOns: workspace.owner.addOns,
    });

    // Check 1: Validate existing funnel doesn't already exceed page limit
    const currentPageCount = funnel.pages.length;
    if (currentPageCount > maxAllowedPages) {
      throw new BadRequestError(
        `This funnel currently has ${currentPageCount} ${
          currentPageCount === 1 ? "page" : "pages"
        }, but your plan allows a maximum of ${maxAllowedPages} ${
          maxAllowedPages === 1 ? "page" : "pages"
        } per funnel. ` +
          `Please delete ${
            currentPageCount - maxAllowedPages
          } ${
            currentPageCount - maxAllowedPages === 1 ? "page" : "pages"
          } before modifying this funnel.`
      );
    }

    // Check 2: If generating new pages, validate it won't exceed allocation
    if (request.allowGenerateNewPages) {
      const potentialNewPages = request.maxNewPages || 3;
      const totalPagesAfterModification = currentPageCount + potentialNewPages;

      if (totalPagesAfterModification > maxAllowedPages) {
        throw new BadRequestError(
          `Creating ${potentialNewPages} new ${
            potentialNewPages === 1 ? "page" : "pages"
          } would exceed your plan's limit of ${maxAllowedPages} ${
            maxAllowedPages === 1 ? "page" : "pages"
          } per funnel. ` +
            `Current pages: ${currentPageCount}. You can create up to ${
              maxAllowedPages - currentPageCount
            } more ${
              maxAllowedPages - currentPageCount === 1 ? "page" : "pages"
            }. ` +
            `Try reducing maxNewPages to ${
              maxAllowedPages - currentPageCount
            } or fewer.`
        );
      }
    }

    console.log(
      `[AI Funnel Modification] Page allocation check passed: ${currentPageCount}/${maxAllowedPages} pages`
    );

    // Filter pages to modify (if pageIds specified, only those pages; otherwise all pages)
    const pagesToModify = request.pageIds
      ? funnel.pages.filter((page) => request.pageIds!.includes(page.id))
      : funnel.pages;

    if (pagesToModify.length === 0) {
      throw new BadRequestError("No pages found to modify");
    }

    console.log(`[AI Funnel Modification] Modifying ${pagesToModify.length} pages`);

    // Parse page content for context (happens AFTER allocation checks)
    const existingPagesContext = pagesToModify.map((page) => ({
      id: page.id,
      name: page.name,
      type: page.type,
      order: page.order,
      content: JSON.parse(page.content),
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
    }));

    // Calculate estimated output tokens
    // For modifications, estimate based on number of pages being modified + potential new pages
    const totalPagesToGenerate =
      pagesToModify.length +
      (request.allowGenerateNewPages ? request.maxNewPages || 3 : 0);
    const totalElements =
      totalPagesToGenerate * (request.maxElementsPerPage || 8);
    const tokensPerElement = 350; // Slightly higher for modifications (more context)
    const baseOverhead = 4000;
    const estimatedOutputTokens =
      totalElements * tokensPerElement + baseOverhead;

    // Select appropriate model
    const selectedModel = selectGeminiModel(estimatedOutputTokens, {
      totalElements,
      promptLength: request.userPrompt.length,
    });
    const MAX_OUTPUT_TOKENS = selectedModel.maxOutputTokens;

    console.log(
      `[AI Funnel Modification] Using ${selectedModel.name} for ${totalElements} elements (estimated ${estimatedOutputTokens} output tokens)`
    );

    // Pre-validate: Check if generation will exceed model's output token limit
    if (estimatedOutputTokens > MODELS.PRO.maxOutputTokens) {
      const maxSafeElements = Math.floor(
        (MODELS.PRO.maxOutputTokens - baseOverhead) / tokensPerElement
      );
      const suggestedMaxPages = Math.floor(
        maxSafeElements / (request.maxElementsPerPage || 8)
      );

      throw new BadRequestError(
        `This modification requires approximately ${estimatedOutputTokens} output tokens, which exceeds model capacity (${MODELS.PRO.maxOutputTokens} tokens). ` +
          `Try reducing the scope: modify fewer pages or reduce maxElementsPerPage to ${Math.floor(
            maxSafeElements / pagesToModify.length
          )} or fewer.`
      );
    }

    // Build prompts
    const systemPrompt = buildModifyFunnelSystemPrompt({
      existingPages: existingPagesContext,
      userPrompt: request.userPrompt,
      allowGenerateNewPages: request.allowGenerateNewPages || false,
      maxNewPages: request.maxNewPages,
      maxElementsPerPage: request.maxElementsPerPage,
    });

    const userPrompt = buildModifyFunnelUserPrompt(request.userPrompt);

    // Estimate input token usage
    const estimatedInputTokens = estimateTokensForGeneration(
      systemPrompt.length + userPrompt.length,
      totalPagesToGenerate
    );

    // Check if user has enough tokens (input + estimated output)
    const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;
    const canGenerate = await hasEnoughTokens(userId, totalEstimatedTokens);
    if (!canGenerate) {
      throw new BadRequestError(
        `Insufficient AI tokens. Estimated ${totalEstimatedTokens} tokens needed for this modification (${estimatedInputTokens} input + ${estimatedOutputTokens} output).`
      );
    }

    // Call Gemini API
    let modificationResult: ModificationResult;
    let actualTokensUsed: number;

    try {
      const response = await generateContentStream(
        selectedModel.name,
        userPrompt,
        systemPrompt
      );

      actualTokensUsed = response.totalTokens;

      // Check for truncation
      const isLikelyTruncated =
        response.outputTokens >= MAX_OUTPUT_TOKENS * 0.95;

      if (isLikelyTruncated) {
        const error: any = new BadRequestError(
          `Modification may be truncated at token limit (${MAX_OUTPUT_TOKENS}). Used ${actualTokensUsed} tokens (not charged). ` +
            `Try reducing the scope: modify fewer pages or reduce maxElementsPerPage.`
        );
        error.tokensWasted = actualTokensUsed;
        throw error;
      }

      // Parse response
      const jsonString = parseJSONFromResponse(response.text);
      if (!jsonString) {
        console.error(
          "AI response did not contain JSON:",
          response.text.substring(0, 500)
        );
        throw new BadRequestError(
          "AI response did not contain valid JSON. Please try again or simplify your request."
        );
      }

      try {
        modificationResult = JSON.parse(jsonString);
      } catch (parseError) {
        console.error(
          "Failed to parse AI JSON response:",
          jsonString.substring(0, 500)
        );
        throw new BadRequestError(
          "AI generated invalid JSON. Please try simplifying your modification request."
        );
      }
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(
        `Failed to modify funnel: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Validate modification result
    if (!modificationResult.pages || modificationResult.pages.length === 0) {
      throw new BadRequestError(
        "AI did not return any modified pages. Please try rephrasing your modification request."
      );
    }

    // Auto-fix missing required fields FIRST
    modificationResult.pages = modificationResult.pages.map((page) => ({
      ...page,
      content: autoFixMissingFields(page.content),
    }));

    // Auto-fix common enum casing issues
    modificationResult.pages = modificationResult.pages.map((page) => ({
      ...page,
      content: autoFixEnumValues(page.content),
    }));

    // Validate generated pages structure
    const validation = validateFunnel({
      funnelName: funnel.name,
      pages: modificationResult.pages.map((p) => ({
        name: p.name,
        type: p.type,
        elements: p.content,
      })),
    });

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

    // Sanitize elements
    modificationResult.pages = modificationResult.pages.map((page) => ({
      ...page,
      content: sanitizeElements(page.content),
    }));

    // Sanitize element styles
    modificationResult.pages = modificationResult.pages.map((page) => ({
      ...page,
      content: sanitizeElementStyles(page.content),
    }));

    // Separate new pages from modified pages
    const newPages = modificationResult.pages.filter((p) => p.id === null);
    const modifiedPages = modificationResult.pages.filter((p) => p.id !== null);

    console.log(
      `[AI Funnel Modification] Modified ${modifiedPages.length} pages, created ${newPages.length} new pages`
    );

    // Validate new page count doesn't exceed limits
    if (newPages.length > (request.maxNewPages || 3)) {
      throw new BadRequestError(
        `AI generated ${newPages.length} new pages, but maxNewPages is ${
          request.maxNewPages || 3
        }. This shouldn't happen - please try again.`
      );
    }

    // CRITICAL: Post-generation validation - ensure total pages don't exceed allocation
    // This is a safety check in case AI ignores constraints or user has edge case data
    const totalPagesAfterGeneration = currentPageCount + newPages.length;
    if (totalPagesAfterGeneration > maxAllowedPages) {
      throw new BadRequestError(
        `Modification would result in ${totalPagesAfterGeneration} total ${
          totalPagesAfterGeneration === 1 ? "page" : "pages"
        }, but your plan allows maximum ${maxAllowedPages} ${
          maxAllowedPages === 1 ? "page" : "pages"
        } per funnel. ` +
          `AI generated ${newPages.length} new ${
            newPages.length === 1 ? "page" : "pages"
          }, which would exceed your limit. This shouldn't happen - please try again with fewer new pages.`
      );
    }

    console.log(
      `[AI Funnel Modification] Post-generation validation passed: ${totalPagesAfterGeneration}/${maxAllowedPages} total pages`
    );

    // Update database
    let updatedPagesList: Array<{
      id: number;
      name: string;
      type: PageType;
      order: number;
      isNew?: boolean;
      wasModified?: boolean;
    }> = [];

    await prisma.$transaction(async (tx) => {
      // Pre-generate linkingIds for new pages
      const timestamp = Date.now();
      const pageNameToLinkingId = new Map<string, string>();

      newPages.forEach((page, index) => {
        const linkingId = `${page.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}-${timestamp}-${index}`;
        pageNameToLinkingId.set(page.name, linkingId);
      });

      // Replace page name references in element links
      [...modifiedPages, ...newPages].forEach((page) => {
        page.content = replacePageNamesInLinks(
          page.content,
          pageNameToLinkingId
        );
      });

      // Update modified pages
      for (const page of modifiedPages) {
        if (!page.id) continue; // Safety check

        // Extract and create/update Insights and Forms
        let updatedElements = [...page.content];

        // Handle quiz elements
        const quizElements = extractQuizElements(page.content);
        for (const quizElement of quizElements) {
          const questionElement = quizElement.children?.find(
            (child: any) => child.type === "text"
          );
          const questionText =
            questionElement?.content?.label || "Quiz Question";

          // If quiz already has serverId, update it; otherwise create new
          if (quizElement.serverId) {
            await tx.insight.update({
              where: { id: quizElement.serverId },
              data: {
                name: questionText.substring(0, 255),
                content: quizElement.children || [],
              },
            });
          } else {
            const insight = await tx.insight.create({
              data: {
                type: InsightType.QUIZ,
                name: questionText.substring(0, 255),
                description: `Modified quiz from ${page.name}`,
                content: quizElement.children || [],
                settings: {},
                funnelId: funnel.id,
              },
            });

            updatedElements = updateElementServerId(
              updatedElements,
              quizElement.id,
              insight.id
            );
          }
        }

        // Handle form elements
        const formElements = extractFormElements(page.content);
        for (const formElement of formElements) {
          const titleElement = formElement.children?.find(
            (child: any) => child.type === "text"
          );
          const formTitle = titleElement?.content?.label || "Form";

          if (formElement.serverId) {
            await tx.form.update({
              where: { id: formElement.serverId },
              data: {
                name: formTitle.substring(0, 255),
                formContent: formElement.children || [],
                webhookEnabled:
                  formElement.integration?.webhookEnabled || false,
                webhookUrl: formElement.integration?.webhookUrl || null,
              },
            });
          } else {
            const form = await tx.form.create({
              data: {
                name: formTitle.substring(0, 255),
                description: `Modified form from ${page.name}`,
                formContent: formElement.children || [],
                isActive: true,
                funnelId: funnel.id,
                webhookEnabled:
                  formElement.integration?.webhookEnabled || false,
                webhookUrl: formElement.integration?.webhookUrl || null,
              },
            });

            updatedElements = updateElementServerId(
              updatedElements,
              formElement.id,
              form.id
            );
          }
        }

        // Update page
        const updatedPage = await tx.page.update({
          where: { id: page.id },
          data: {
            name: page.name,
            type: page.type === "RESULT" ? PageType.RESULT : PageType.PAGE,
            content: JSON.stringify(updatedElements),
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            order: page.order,
          },
        });

        updatedPagesList.push({
          id: updatedPage.id,
          name: updatedPage.name,
          type: updatedPage.type,
          order: updatedPage.order,
          wasModified: true,
        });
      }

      // Create new pages
      for (const page of newPages) {
        const linkingId = pageNameToLinkingId.get(page.name)!;
        let updatedElements = [...page.content];

        // Create Insights and Forms for new page elements
        const quizElements = extractQuizElements(page.content);
        for (const quizElement of quizElements) {
          const questionElement = quizElement.children?.find(
            (child: any) => child.type === "text"
          );
          const questionText =
            questionElement?.content?.label || "Quiz Question";

          const insight = await tx.insight.create({
            data: {
              type: InsightType.QUIZ,
              name: questionText.substring(0, 255),
              description: `Auto-generated quiz from ${page.name}`,
              content: quizElement.children || [],
              settings: {},
              funnelId: funnel.id,
            },
          });

          updatedElements = updateElementServerId(
            updatedElements,
            quizElement.id,
            insight.id
          );
        }

        const formElements = extractFormElements(page.content);
        for (const formElement of formElements) {
          const titleElement = formElement.children?.find(
            (child: any) => child.type === "text"
          );
          const formTitle = titleElement?.content?.label || "Form";

          const form = await tx.form.create({
            data: {
              name: formTitle.substring(0, 255),
              description: `Auto-generated form from ${page.name}`,
              formContent: formElement.children || [],
              isActive: true,
              funnelId: funnel.id,
              webhookEnabled: formElement.integration?.webhookEnabled || false,
              webhookUrl: formElement.integration?.webhookUrl || null,
            },
          });

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
            order: page.order,
            content: JSON.stringify(updatedElements),
            linkingId: linkingId,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            seoKeywords: "",
          },
        });

        updatedPagesList.push({
          id: createdPage.id,
          name: createdPage.name,
          type: createdPage.type,
          order: createdPage.order,
          isNew: true,
        });
      }
    });

    // Invalidate caches
    await cacheService.del(`workspace:${workspace.id}:funnels:all`);
    await cacheService.del(`workspace:${workspace.id}:funnels:list`);
    await cacheService.del(`user:${userId}:workspace:${workspace.id}:funnels`);

    // Log the generation
    const generationLogId = await logGeneration(
      userId,
      workspace.id,
      funnel.id,
      `MODIFY: ${request.userPrompt}`,
      actualTokensUsed,
      modifiedPages.length + newPages.length,
      selectedModel.name
    );

    // Deduct tokens from user's balance
    const tokenResult = await deductTokens(
      userId,
      actualTokensUsed,
      generationLogId,
      `Modified funnel: ${funnel.name}`
    );

    // Count total elements modified/created
    const totalElementsModified = modifiedPages.reduce(
      (sum, p) => sum + p.content.length,
      0
    );
    const totalElementsCreated = newPages.reduce(
      (sum, p) => sum + p.content.length,
      0
    );

    // Build response
    const response = {
      message: "Funnel modified successfully",
      funnel: {
        id: funnel.id,
        name: funnel.name,
        pages: updatedPagesList.map((page) => ({
          id: page.id,
          name: page.name,
          type:
            page.type === PageType.RESULT
              ? ("RESULT" as const)
              : ("PAGE" as const),
          order: page.order,
          isNew: page.isNew,
          wasModified: page.wasModified,
        })),
      },
      tokensUsed: actualTokensUsed,
      remainingTokens: tokenResult.remainingTokens,
      generationLogId,
      modificationSummary: {
        pagesModified: modifiedPages.length,
        pagesCreated: newPages.length,
        totalElementsModified,
        totalElementsCreated,
      },
    };

    console.log(`[AI Funnel Modification] Successfully completed. Tokens used: ${actualTokensUsed}`);

    return modifyFunnelResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
