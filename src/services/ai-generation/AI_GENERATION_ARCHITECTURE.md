# AI Funnel Generation System - Complete Architecture Guide

> **Last Updated**: 2025-01-04
> **Version**: 2.0 (2-Step Refinement Architecture)

This comprehensive guide documents the complete AI funnel generation system architecture. Use this alongside [ADD_NEW_ELEMENT_GUIDE.md](../../utils/ai-generation/ui-elements/ADD_NEW_ELEMENT_GUIDE.md) for full system understanding.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Directory Structure](#directory-structure)
3. [Request Flow](#request-flow)
4. [Service Layer](#service-layer)
5. [Controller Layer](#controller-layer)
6. [Utilities Layer](#utilities-layer)
7. [UI Elements System](#ui-elements-system)
8. [Key Patterns](#key-patterns)
9. [Database Schema](#database-schema)
10. [Troubleshooting](#troubleshooting)
11. [Integration Guide](#integration-guide)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                            │
│                    POST /ai/generate                             │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                             │
│  • Authentication & Authorization                                │
│  • Request Validation                                            │
│  • Workspace & Permission Checks                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (PUBLIC)                        │
│                   generate-funnel/index.ts                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Token Estimation (BEFORE AI execution)                │  │
│  │    • Estimate Step 1 tokens (~2500-4000)                 │  │
│  │    • Estimate Step 2 tokens (~28,000)                    │  │
│  │    • Check user has enough tokens                        │  │
│  │    • Fail fast if insufficient                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. STEP 1: Prompt Refinement                             │  │
│  │    Service: refine-prompt/index.ts                       │  │
│  │    Model: Gemini Flash (fast & cheap)                    │  │
│  │    Output: Refined strategy + recommendations            │  │
│  │    Tokens: ~2500-4000                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. STEP 2: Funnel Generation                             │  │
│  │    Service: funnel-generator/index.ts (INTERNAL)         │  │
│  │    Model: Gemini Flash/Pro (auto-selected)               │  │
│  │    Output: Complete funnel with all pages                │  │
│  │    Tokens: ~10,000-30,000                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. Post-Processing Pipeline                               │  │
│  │    • Parse JSON                                           │  │
│  │    • Fix missing fields                                   │  │
│  │    • Correct enum casing                                  │  │
│  │    • Resolve page links                                   │  │
│  │    • Extract quiz/form children                           │  │
│  │    • Sanitize styles                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. Database Operations                                    │  │
│  │    • Create Funnel                                        │  │
│  │    • Create Pages (with elements)                         │  │
│  │    • Create Theme                                         │  │
│  │    • Create SEO Settings                                  │  │
│  │    • Deduct tokens                                        │  │
│  │    • Log generation                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RESPONSE                                  │
│  • Funnel ID & metadata                                          │
│  • Pages created                                                 │
│  • Theme colors                                                  │
│  • Tokens used (Step 1 + Step 2)                                │
│  • Refinement summary                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**1. Why 2-Step Refinement?**
- **Quality**: Separate analysis from generation ensures consistent, high-quality output
- **Cost**: Uses cheaper Gemini Flash for Step 1 analysis
- **Predictability**: AI analyzes requirements first, then generates with full context
- **Consistency**: Key messaging and strategy defined in Step 1, applied in Step 2

**2. Why Token Check Before Execution?**
- **User Protection**: Prevents wasted spending on partial generations
- **Fail Fast**: Immediate error if insufficient tokens (no AI calls made)
- **Transparency**: Clear cost estimate before any work begins

**3. Why Batch Mode (All Pages at Once)?**
- **Content Coherence**: Better flow and consistency across pages
- **Efficiency**: Single AI call for entire funnel (vs sequential page generation)
- **Cross-Page References**: AI can create proper page linking and content flow

**4. Why Post-Processing Pipeline?**
- **AI Unreliability**: AI sometimes generates invalid enums, missing fields, etc.
- **Consistency**: Ensures all funnels meet schema requirements
- **Safety**: Sanitizes styles to prevent layout breaking

---

## Directory Structure

```
src/
├── controllers/ai-generation/
│   ├── generate-funnel/index.ts          # POST /ai/generate
│   ├── estimate-tokens/index.ts          # POST /ai/estimate
│   ├── get-token-balance/index.ts        # GET /ai/balance
│   └── get-generation-history/index.ts   # GET /ai/history
│
├── services/ai-generation/
│   ├── generate-funnel/index.ts          # [PUBLIC] Main 2-step orchestrator
│   ├── funnel-generator/index.ts         # [INTERNAL] Batch generation engine
│   │   └── utils/
│   │       ├── element-updater.util.ts   # Updates element serverId
│   │       ├── element-fixer.util.ts     # Fixes missing required fields
│   │       ├── element-extractor.util.ts # Extracts quiz/form children
│   │       ├── enum-fixer.util.ts        # Corrects enum casing
│   │       ├── style-sanitizer.util.ts   # Removes layout-breaking styles
│   │       ├── link-resolver.util.ts     # Converts page names → linkingIds
│   │       └── seo-converter.util.ts     # Array ↔ String SEO keywords
│   ├── refine-prompt/index.ts            # Step 1: AI strategy analysis
│   ├── estimate-tokens/index.ts          # Token cost estimation
│   ├── get-token-balance/index.ts        # Balance retrieval
│   └── get-generation-history/index.ts   # Generation logs
│
├── utils/ai-generation/
│   ├── gemini-client/index.ts            # Gemini API wrapper
│   ├── prompt-builder/index.ts           # Prompt construction
│   ├── theme-generator/index.ts          # Color palette generation
│   ├── token-tracker/index.ts            # Token balance management
│   ├── validators/index.ts               # Element & funnel validation
│   └── ui-elements/                      # Element type system
│       ├── index.ts                      # Element registry
│       ├── types.ts                      # Base types
│       ├── ADD_NEW_ELEMENT_GUIDE.md      # Element integration guide
│       ├── essentials/
│       │   ├── text.element.ts
│       │   ├── button.element.ts
│       │   └── divider.element.ts
│       ├── visuals/
│       │   ├── image.element.ts
│       │   ├── video.element.ts
│       │   ├── icon.element.ts
│       │   ├── media.element.ts
│       │   └── media-with-text.element.ts
│       ├── interactive/
│       │   ├── form.element.ts
│       │   ├── form-input.element.ts
│       │   ├── form-message.element.ts
│       │   ├── form-phonenumber.element.ts
│       │   ├── form-checkbox.element.ts
│       │   ├── form-select.element.ts
│       │   ├── form-datepicker.element.ts
│       │   ├── form-number.element.ts
│       │   ├── quiz.element.ts
│       │   ├── answer.element.ts
│       │   └── webinar.element.ts
│       ├── informative/
│       │   ├── faq.element.ts
│       │   ├── faq-item.element.ts
│       │   └── comparison-chart.element.ts
│       └── embed/
│           └── embed.element.ts
│
├── types/ai-generation/
│   ├── generate-funnel/index.ts          # Request/Response schemas
│   ├── estimate-tokens/index.ts          # Estimation types
│   ├── get-token-balance/index.ts        # Balance types
│   └── get-generation-history/index.ts   # History types
│
└── routes/ai-generation/
    └── index.ts                           # Route definitions
```

### API Boundary Classification

**PUBLIC APIs** (Call from Controllers):
- `generateFunnel()` - Main entry point for funnel generation
- `refinePrompt()` - Step 1 refinement (used by generateFunnel)
- `estimateGenerationTokens()` - Token cost estimation
- `getUserTokenBalance()` - Balance retrieval
- `getUserGenerationHistory()` - History fetching

**INTERNAL APIs** (Do NOT call from Controllers):
- `generateFunnelCore()` - Batch generation engine (called by generateFunnel only)
- `generateFunnelBatch()` - Internal batch implementation

**UTILITIES** (Shared helpers):
- All functions in `utils/ai-generation/*` are shared utilities

---

## Request Flow

### Flow 1: Generate Funnel (Complete 2-Step Process)

**File**: [src/services/ai-generation/generate-funnel/index.ts](./generate-funnel/index.ts)

```typescript
// Controller entry point
POST /ai/generate
  ↓
generateFunnelController()  // Line 37
  ├─ Extract userId from req.user
  ├─ Call generateFunnel(userId, req.body)
  └─ Return 201 with response

// Main service (PUBLIC API)
generateFunnel(userId, requestBody)  // Line 41
  │
  ├─ 1. Validate Request Schema (Line 46)
  │    Schema: generateFunnelRequestSchemaV2
  │    Required: workspaceSlug, funnelType, businessDescription
  │    Optional: industry, targetAudience, colors, userPrompt
  │
  ├─ 2. Workspace & Permission Validation (Lines 54-82)
  │    ├─ WorkspaceValidator.validateWithAllocation()
  │    ├─ PermissionManager.requirePermission(CREATE_FUNNEL)
  │    └─ WorkspaceFunnelAllocations.canCreateFunnel()
  │
  ├─ 3. Token Estimation & Check (Lines 84-119) ⚠️ BEFORE AI
  │    ├─ estimateRefinePromptTokens() → ~2500-4000 tokens
  │    ├─ Estimate Step 2: 6 pages × 10 elements × 400 → ~28,000 tokens
  │    ├─ Total estimate: Step 1 + Step 2
  │    ├─ hasEnoughTokens(userId, totalEstimated)
  │    └─ If insufficient: throw BadRequestError (fail fast!)
  │
  ├─ 4. STEP 1: Refine Prompt (Lines 123-145)
  │    ├─ Call refinePrompt(input)
  │    ├─ AI analyzes requirements with Gemini Flash
  │    ├─ Returns: refined prompt + strategy + recommendations
  │    └─ Tokens used: ~2500-4000
  │
  ├─ 5. STEP 2: Generate Funnel (Lines 147-160)
  │    ├─ Build batchRequest with refined context
  │    ├─ Call generateFunnelCore(userId, batchRequest)
  │    ├─ AI generates funnel with selected model
  │    └─ Tokens used: ~10,000-30,000
  │
  ├─ 6. Calculate Total Tokens (Lines 162-167)
  │    └─ totalTokensUsed = Step1.tokens + Step2.tokens
  │
  ├─ 7. Update Generation Log (Lines 169-178)
  │    └─ Mark as "2-step-refined" with total tokens
  │
  └─ 8. Return Response (Lines 180-192)
       ├─ generationMode: "2-step-refined"
       ├─ refinementSummary: {step1Tokens, step2Tokens, ...}
       └─ tokensUsed: totalTokensUsed
```

### Flow 2: Step 1 - Prompt Refinement

**File**: [src/services/ai-generation/refine-prompt/index.ts](./refine-prompt/index.ts)

```typescript
refinePrompt(input: RefinementInput)  // Line 215
  │
  ├─ 1. Calculate Max Allowed Pages (Lines 218-222)
  │    └─ FunnelPageAllocations.calculateTotalAllocation()
  │
  ├─ 2. Build Refinement Prompt (Lines 228-236)
  │    Function: buildRefinementPrompt()
  │    Content: Business requirements + strategic guidelines
  │    Length: ~2000-4000 chars (depends on input)
  │
  ├─ 3. Call Gemini Flash (Line 240)
  │    Model: gemini-2.5-flash (fast & cheap)
  │    System: None (prompt is self-contained)
  │    User: refinement prompt
  │
  ├─ 4. Parse & Validate Response (Lines 242-266)
  │    ├─ parseJSONFromResponse() - Extract JSON
  │    ├─ JSON.parse()
  │    ├─ Validate refinedPrompt length (100-7000 chars)
  │    ├─ Validate funnelStrategy exists
  │    └─ Validate pageStructure is array
  │
  ├─ 5. Enforce Limits (Lines 268-314)
  │    ├─ Max pages: user's plan limit
  │    ├─ Min pages: 3
  │    ├─ Max total elements: 70 (capacity limit)
  │    └─ Auto-adjust if AI exceeds limits
  │
  ├─ 6. Apply User Preferences (Lines 316-332)
  │    └─ Override AI colors if user provided custom colors
  │
  └─ 7. Return RefinedPromptOutput (Lines 338-346)
       ├─ refinedPrompt: 300-800 words comprehensive description
       ├─ funnelStrategy: {pages, elementsPerPage, reasoning}
       ├─ pageStructure: Array of page recommendations
       ├─ themeRecommendation: Color palette
       ├─ keyMessaging: Core value props
       ├─ conversionStrategy: Overall strategy
       └─ tokensUsed: Actual tokens from API
```

**Refinement Output Example**:
```json
{
  "refinedPrompt": "Create a lead generation funnel for a fitness coaching business targeting busy professionals aged 30-45. The funnel should guide users through awareness of their fitness challenges, present the coach's unique methodology, build trust with success stories, and capture leads through a quiz that segments by fitness goals...",
  "funnelStrategy": {
    "recommendedPages": 6,
    "recommendedElementsPerPage": 10,
    "reasoning": "6 pages allows proper journey: landing → benefits → social proof → quiz → form → thank you. 10 elements per page provides rich content without overwhelming."
  },
  "pageStructure": [
    {
      "pageName": "Transform Your Health",
      "pageType": "PAGE",
      "purpose": "Landing page to capture attention and explain the problem",
      "recommendedElements": 10,
      "keyContent": ["Hero headline", "Problem statement", "Solution preview", "Trust badges", "CTA"]
    },
    // ... more pages
  ],
  "themeRecommendation": {
    "suggestedPrimaryColor": "#FF6B35",
    "suggestedSecondaryColor": "#004E89",
    "preferDarkBackground": false,
    "reasoning": "Energetic orange represents vitality and action, paired with trustworthy blue for credibility in fitness industry."
  },
  "keyMessaging": [
    "Busy professionals deserve efficient, science-backed fitness",
    "Transform your health in just 30 minutes a day",
    "Proven methodology with 500+ success stories"
  ],
  "conversionStrategy": "Use quiz to segment users by goals, then customize messaging in follow-up to match their specific needs.",
  "tokensUsed": 3245
}
```

### Flow 3: Step 2 - Funnel Generation

**File**: [src/services/ai-generation/funnel-generator/index.ts](./funnel-generator/index.ts)

```typescript
generateFunnelCore(userId, requestBody)  // Line 767 (PUBLIC export)
  ↓
generateFunnelBatch(userId, requestBody)  // Line 93 (INTERNAL implementation)
  │
  ├─ 1. Validate Request (Lines 98-102)
  │    Schema: generateFunnelRequestSchema
  │    Required: workspaceSlug, businessDescription
  │
  ├─ 2. Workspace & Permissions (Lines 96-157)
  │    ├─ Check workspace exists
  │    ├─ Check CREATE_FUNNEL permission
  │    ├─ Verify funnel allocation limit
  │    └─ Verify page count within allocation
  │
  ├─ 3. Token Estimation & Model Selection (Lines 159-225)
  │    ├─ Calculate totalElements (pages × elements)
  │    ├─ Detect refined prompt (>500 chars)
  │    ├─ tokensPerElement: refined=400, direct=300
  │    ├─ estimatedOutputTokens = elements × tokens + overhead
  │    ├─ selectGeminiModel(estimatedTokens, options)
  │    │   ├─ If >40 elements → Pro (quality)
  │    │   ├─ If >3000 char prompt → Pro (complexity)
  │    │   ├─ If exceeds Flash capacity → Pro (necessity)
  │    │   └─ Else → Flash (cost-effective)
  │    ├─ Pre-validate capacity (max 70 elements for Pro)
  │    └─ Log model selection
  │
  ├─ 4. Build Prompts (Lines 227-250)
  │    ├─ systemPrompt = isLarge ? compact : full
  │    ├─ userPrompt = limited or standard
  │    └─ Estimate input tokens
  │
  ├─ 5. Check Token Availability (Lines 252-259)
  │    ├─ hasEnoughTokens(totalInputOutput)
  │    └─ Throw error if insufficient
  │
  ├─ 6. Call Gemini API (Lines 261-326)
  │    ├─ Use streaming for Pro (long-running)
  │    ├─ Use standard for Flash (faster)
  │    ├─ Check for truncation (>95% of max tokens)
  │    ├─ Parse JSON response
  │    └─ Handle errors
  │
  ├─ 7. Post-Processing Pipeline (Lines 363-417)
  │    ├─ autoFixMissingFields() - Add required fields
  │    ├─ autoFixEnumValues() - Fix casing
  │    ├─ validateFunnel() - Ensure structure valid
  │    ├─ Check page count within allocation
  │    ├─ sanitizeElements() - Remove invalid elements
  │    └─ sanitizeElementStyles() - Remove bad styles
  │
  ├─ 8. Generate Theme (Lines 419-427)
  │    └─ generateTheme(colors, description, industry)
  │
  ├─ 9. Database Transaction (Lines 429-659)
  │    ├─ Pre-generate linkingIds for all pages
  │    ├─ replacePageNamesInLinks() - Resolve links
  │    ├─ Create Funnel record
  │    ├─ Create Theme record
  │    ├─ Create SeoSettings record
  │    ├─ For each page:
  │    │   ├─ extractQuizElements() → create Insight records
  │    │   ├─ extractFormElements() → create Form records
  │    │   ├─ updateElementServerId() - Link elements to records
  │    │   └─ Create Page record with elements JSON
  │    └─ Update funnel.activeThemeId
  │
  ├─ 10. Log & Deduct Tokens (Lines 661-678)
  │     ├─ logGeneration() - Create AIGenerationLog
  │     └─ deductTokens() - Update balance
  │
  └─ 11. Return Response (Lines 680-745)
        ├─ funnel: {id, name, pages, theme, seoSettings}
        ├─ tokensUsed: actualTokensUsed
        ├─ remainingTokens: after deduction
        ├─ generationLogId: log record ID
        └─ generationMode: "batch"
```

### Post-Processing Pipeline Details

**Order is Critical** (dependencies between steps):

```typescript
// 1. Fix missing required fields FIRST
autoFixMissingFields(elements)  // Ensures id, type, order exist

// 2. Fix enum casing
autoFixEnumValues(elements)  // borderRadius: UPPERCASE, size: lowercase

// 3. Validate structure
validateFunnel(funnel)  // Checks all required fields, element types

// 4. Resolve page links
replacePageNamesInLinks(elements, pageNameToLinkingId)  // "Page 2" → "page-2-1234567890-1"

// 5. Extract nested structures
extractQuizElements(elements)  // Find quiz elements, extract children
extractFormElements(elements)  // Find form elements, extract children

// 6. Update element references
updateElementServerId(elements, elementId, serverId)  // Set quiz.serverId = insightId

// 7. Sanitize styles
sanitizeElementStyles(elements)  // Remove margin, animation, transform, etc.

// 8. Convert SEO keywords
convertSeoKeywordsToString(keywords)  // Array → comma-separated string for DB
```

---

## Service Layer

### Service 1: Main Generate Funnel (PUBLIC)

**File**: [src/services/ai-generation/generate-funnel/index.ts](./generate-funnel/index.ts)

**Function**: `generateFunnel(userId: number, requestBody: Record<string, unknown>): Promise<GenerateFunnelResponseV2>`

**Purpose**: Main entry point for AI funnel generation using 2-step refinement approach.

**Request Schema** (V2):
```typescript
{
  workspaceSlug: string              // Required
  funnelType: string                 // Required: "lead-generation", "sales", etc.
  businessDescription: string        // Required: 10-8000 chars
  industry?: string                  // Optional: "ecommerce", "saas", etc.
  targetAudience?: string            // Optional: "busy professionals aged 30-45"
  primaryColor?: string              // Optional: "#FF6B35"
  secondaryColor?: string            // Optional: "#004E89"
  preferDarkBackground?: boolean     // Optional: true/false
  userPrompt?: string                // Optional: max 1000 chars
  createFunnel?: boolean             // Optional: default true
}
```

**Response Schema** (V2):
```typescript
{
  message: string
  funnel: {
    id?: number
    name: string
    pages: Array<{
      id?: number
      name: string
      type: "PAGE" | "RESULT"
      order: number
    }>
    theme: {
      id?: number
      backgroundColor: string
      textColor: string
      buttonColor: string
      buttonTextColor: string
      borderColor: string
      optionColor: string
      fontFamily: string
      borderRadius: "NONE" | "SOFT" | "ROUNDED"
    }
    seoSettings?: {
      id: number
      defaultSeoTitle: string
      defaultSeoDescription: string
      defaultSeoKeywords: string[]
    }
  }
  tokensUsed: number
  remainingTokens: number
  generationLogId: number
  generationMode: "2-step-refined"
  refinementSummary: {
    step1Tokens: number
    step2Tokens: number
    recommendedPages: number
    recommendedElementsPerPage: number
  }
}
```

**Dependencies**:
- `refinePrompt()` - Step 1 service
- `estimateRefinePromptTokens()` - Token estimation for Step 1
- `generateFunnelCore()` - Step 2 service
- `hasEnoughTokens()` - Token balance check
- `logGeneration()` - Generation logging
- `WorkspaceValidator` - Workspace validation
- `PermissionManager` - Permission checking
- `WorkspaceFunnelAllocations` - Allocation checking

**Key Logic**:
```typescript
// Token estimation BEFORE any AI work
const estimatedStep1 = estimateRefinePromptTokens(input);
const estimatedStep2 = 60 * 400 + 4000; // Conservative estimate
const total = estimatedStep1 + estimatedStep2;

if (!await hasEnoughTokens(userId, total)) {
  throw new BadRequestError("Insufficient tokens");
}

// Step 1: Refinement (safe to execute)
const refinement = await refinePrompt(input);

// Step 2: Generation (safe to execute)
const result = await generateFunnelCore(userId, batchRequest);

// Combine results
return {
  ...result,
  generationMode: "2-step-refined",
  refinementSummary: {
    step1Tokens: refinement.tokensUsed,
    step2Tokens: result.tokensUsed
  },
  tokensUsed: refinement.tokensUsed + result.tokensUsed
};
```

---

### Service 2: Prompt Refinement (Step 1)

**File**: [src/services/ai-generation/refine-prompt/index.ts](./refine-prompt/index.ts)

**Function**: `refinePrompt(input: RefinementInput): Promise<RefinedPromptOutput>`

**Purpose**: Analyzes user requirements and creates comprehensive funnel strategy.

**Input Interface**:
```typescript
interface RefinementInput {
  funnelType: string
  businessDescription: string
  industry: string
  targetAudience: string
  userPrompt?: string
  primaryColor?: string
  secondaryColor?: string
  preferDarkBackground?: boolean
  workspacePlanType: UserPlan
  addOns: Array<{
    type: AddOnType
    quantity: number
    status: string
    endDate?: Date | null
  }>
}
```

**Output Interface**:
```typescript
interface RefinedPromptOutput {
  refinedPrompt: string              // 300-800 words comprehensive description
  funnelStrategy: {
    recommendedPages: number         // 5-8 pages
    recommendedElementsPerPage: number  // 8-10 elements
    reasoning: string                // Why these numbers
  }
  pageStructure: PageStructure[]     // Recommended pages
  themeRecommendation: {
    suggestedPrimaryColor: string    // Hex color
    suggestedSecondaryColor: string  // Hex color
    preferDarkBackground: boolean
    reasoning: string
  }
  keyMessaging: string[]             // 3-5 core value propositions
  conversionStrategy: string         // Overall strategy
  tokensUsed: number                 // Actual tokens consumed
}
```

**AI Model**: Gemini 2.5 Flash (fast & cost-effective)

**Token Usage**: ~2500-4000 tokens (input + output)

**Key Validations**:
```typescript
// Enforce capacity limit
const totalElements = recommendedPages * recommendedElementsPerPage;
if (totalElements > 70) {
  // Auto-adjust to stay under 70
  if (recommendedPages > 7) {
    recommendedPages = 7;
    recommendedElementsPerPage = 10;
  } else {
    recommendedElementsPerPage = Math.floor(70 / recommendedPages);
  }
}

// Enforce page limits
if (recommendedPages > maxAllowedPages) {
  recommendedPages = maxAllowedPages;
}

// Enforce minimum pages
if (recommendedPages < 3) {
  recommendedPages = 3;
}

// Truncate overly long refined prompts
if (refinedPrompt.length > 7000) {
  refinedPrompt = refinedPrompt.substring(0, 7000);
}
```

**Token Estimation Function**:
```typescript
export function estimateRefinePromptTokens(input: RefinementInput): number {
  const prompt = buildRefinementPrompt(...);
  const inputTokens = Math.ceil(prompt.length / 4);
  const estimatedOutputTokens = 2500; // Conservative estimate
  return inputTokens + estimatedOutputTokens;
}
```

---

### Service 3: Funnel Generator (Step 2 - INTERNAL)

**File**: [src/services/ai-generation/funnel-generator/index.ts](./funnel-generator/index.ts)

**Function**: `generateFunnelCore(userId: number, requestBody: Record<string, unknown>): Promise<GenerateFunnelResponse>`

**⚠️ IMPORTANT**: This is an INTERNAL service. **DO NOT call from controllers.** Use `generateFunnel()` instead.

**Purpose**: Internal batch generation engine that creates complete funnel structure.

**Model Selection Logic**:
```typescript
function selectGeminiModel(estimatedOutputTokens, options?: {
  totalElements?: number
  promptLength?: number
}): GeminiModelType {
  const totalElements = options?.totalElements || 0;
  const promptLength = options?.promptLength || 0;

  // Quality-first: use Pro for complex funnels
  if (totalElements > 40) {
    return GEMINI_MODELS.PRO;
  }

  // Detail-first: use Pro for long refined prompts
  if (promptLength > 3000) {
    return GEMINI_MODELS.PRO;
  }

  // Capacity-based: use Pro if estimated exceeds Flash limit
  if (estimatedOutputTokens > GEMINI_MODELS.FLASH.maxOutputTokens) {
    return GEMINI_MODELS.PRO;
  }

  // Default: use Flash (cost-effective)
  return GEMINI_MODELS.FLASH;
}
```

**Token Estimation**:
```typescript
const isRefinedPrompt = businessDescription.length > 500;
const tokensPerElement = isRefinedPrompt ? 400 : 300;
const baseOverhead = isRefinedPrompt ? 4000 : 3000;
const estimatedOutputTokens = totalElements * tokensPerElement + baseOverhead;
```

**Capacity Validation**:
```typescript
// Maximum capacity: 70 elements for Gemini Pro with refined prompts
const maxElements = 70;

if (estimatedOutputTokens > GEMINI_MODELS.PRO.maxOutputTokens) {
  const maxSafeElements = Math.floor(
    (MODELS.PRO.maxOutputTokens - baseOverhead) / tokensPerElement
  );
  throw new BadRequestError(
    `This generation requires ${estimatedOutputTokens} tokens, ` +
    `which exceeds capacity. Maximum: ~${maxSafeElements} elements.`
  );
}
```

**Prompt Building Strategy**:
```typescript
// Large generations use compact system prompt (saves tokens)
const systemPrompt = totalElements > 40
  ? buildCompactSystemPrompt()  // Skips element schemas
  : buildSystemPrompt();         // Full schemas included

// Limited prompt used when maxPages specified
const userPrompt = request.maxPages
  ? buildLimitedPrompt(description, maxPages, maxElements, userPrompt)
  : buildUserPrompt(description, industry, audience, type, userPrompt);
```

**Database Transaction Pattern**:
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create funnel
  const funnel = await tx.funnel.create({ ... });

  // 2. Create theme
  const theme = await tx.theme.create({ funnelId: funnel.id, ... });

  // 3. Update funnel with active theme
  await tx.funnel.update({
    where: { id: funnel.id },
    data: { activeThemeId: theme.id }
  });

  // 4. Create SEO settings
  const seoSettings = await tx.funnelSettings.create({ funnelId: funnel.id, ... });

  // 5. Create pages with elements
  const pages = await Promise.all(
    generatedFunnel.pages.map(async (page, index) => {
      // Create Insights for quiz elements
      const quizElements = extractQuizElements(page.elements);
      for (const quiz of quizElements) {
        const insight = await tx.insight.create({ ... });
        updatedElements = updateElementServerId(elements, quiz.id, insight.id);
      }

      // Create Forms for form elements
      const formElements = extractFormElements(page.elements);
      for (const form of formElements) {
        const formRecord = await tx.form.create({ ... });
        updatedElements = updateElementServerId(elements, form.id, formRecord.id);
      }

      // Create page
      return await tx.page.create({
        data: {
          name: page.name,
          type: page.type,
          funnelId: funnel.id,
          order: index + 1,
          content: JSON.stringify(updatedElements),
          linkingId: linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: convertSeoKeywordsToString(page.seoKeywords)
        }
      });
    })
  );

  return { funnel, pages, theme, seoSettings };
});
```

---

### Service 4: Token Estimation

**File**: [src/services/ai-generation/estimate-tokens/index.ts](./estimate-tokens/index.ts)

**Function**: `estimateGenerationTokens(userId: number, requestBody: Record<string, unknown>): Promise<EstimateTokensResponse>`

**Purpose**: Estimates token cost without executing AI generation.

**Request Schema**:
```typescript
{
  businessDescription: string  // Required: 10-5000 chars
  industry?: string
  targetAudience?: string
  funnelType?: string
  maxPages?: number
}
```

**Response Schema**:
```typescript
{
  estimatedTokens: number
  userBalance: {
    tokensUsed: number
    tokensLimit: number | null
    remainingTokens: number | null
    unlimited: boolean
  }
  canGenerate: boolean
  message: string
}
```

**Estimation Formula**:
```typescript
const systemPromptTokens = 5000;  // Approximate system prompt size
const userPromptTokens = Math.ceil(promptLength / 4);
const expectedResponseTokens = numberOfPages * 1000;  // 1000 tokens per page
const bufferMultiplier = 1.2;  // 20% buffer

const total = (systemPromptTokens + userPromptTokens + expectedResponseTokens) * bufferMultiplier;
```

**Note**: This endpoint estimates for single-step generation. The 2-step refinement uses internal estimation logic in `generateFunnel()`.

---

### Service 5: Token Balance

**File**: [src/services/ai-generation/get-token-balance/index.ts](./get-token-balance/index.ts)

**Function**: `getUserTokenBalance(userId: number): Promise<GetTokenBalanceResponse>`

**Purpose**: Retrieves user's current token balance.

**Response Schema**:
```typescript
{
  tokensUsed: number
  tokensLimit: number | null     // null = unlimited
  remainingTokens: number | null // null = unlimited
  lastResetAt: Date
  unlimited: boolean
}
```

**Logic**:
```typescript
// Get or create balance record
let balance = await prisma.aITokenBalance.findUnique({
  where: { userId }
});

if (!balance) {
  balance = await prisma.aITokenBalance.create({
    data: {
      userId,
      tokensUsed: 0,
      tokensLimit: null  // null = unlimited
    }
  });
}

// Calculate remaining
const remaining = balance.tokensLimit
  ? balance.tokensLimit - balance.tokensUsed
  : null;

return {
  tokensUsed: balance.tokensUsed,
  tokensLimit: balance.tokensLimit,
  remainingTokens: remaining,
  lastResetAt: balance.lastResetAt,
  unlimited: balance.tokensLimit === null
};
```

---

### Service 6: Generation History

**File**: [src/services/ai-generation/get-generation-history/index.ts](./get-generation-history/index.ts)

**Function**: `getUserGenerationHistory(userId: number, limit: number, offset: number): Promise<GetGenerationHistoryResponse>`

**Purpose**: Retrieves paginated generation logs with statistics.

**Response Schema**:
```typescript
{
  history: Array<{
    id: number
    prompt: string
    tokensUsed: number
    pagesGenerated: number
    model: string
    createdAt: Date
    workspace: {
      id: number
      name: string
    }
    funnel: {
      id: number
      name: string
    } | null
  }>
  stats: {
    totalGenerations: number
    totalPagesGenerated: number
    totalTokensUsed: number
    generationsLast30Days: number
  }
}
```

**Query**:
```typescript
const history = await prisma.aIGenerationLog.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  skip: offset,
  take: limit,
  include: {
    workspace: { select: { id: true, name: true } },
    funnel: { select: { id: true, name: true } }
  }
});

const stats = await prisma.aIGenerationLog.aggregate({
  where: { userId },
  _count: { id: true },
  _sum: {
    pagesGenerated: true,
    tokensUsed: true
  }
});

const last30Days = await prisma.aIGenerationLog.count({
  where: {
    userId,
    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }
});
```

---

## Controller Layer

### All Endpoints

**File**: [src/routes/ai-generation/index.ts](../../routes/ai-generation/index.ts)

```typescript
const router = Router();

// Generate funnel with AI (2-step refinement)
router.post("/generate", authenticate, generateFunnelController);

// Get user's token balance
router.get("/balance", authenticate, getTokenBalanceController);

// Get generation history
router.get("/history", authenticate, getGenerationHistoryController);

// Estimate token cost
router.post("/estimate", authenticate, estimateTokensController);
```

### Controller 1: Generate Funnel

**File**: [src/controllers/ai-generation/generate-funnel/index.ts](../../controllers/ai-generation/generate-funnel/index.ts)

**Route**: `POST /ai/generate`

**Authentication**: Required (`authenticate` middleware)

**Request Body**:
```typescript
{
  workspaceSlug: string
  funnelType: string
  businessDescription: string
  industry?: string
  targetAudience?: string
  primaryColor?: string
  secondaryColor?: string
  preferDarkBackground?: boolean
  userPrompt?: string
  createFunnel?: boolean
}
```

**Response**: `201 Created`
```typescript
{
  message: string
  funnel: { ... }
  tokensUsed: number
  remainingTokens: number
  generationLogId: number
  generationMode: "2-step-refined"
  refinementSummary: { ... }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid schema, insufficient tokens, allocation exceeded
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing CREATE_FUNNEL permission
- `404 Not Found`: Workspace not found
- `500 Internal Server Error`: AI generation failure

**Controller Code**:
```typescript
export const generateFunnelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const result = await generateFunnel(userId, req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
```

---

### Controller 2: Estimate Tokens

**File**: [src/controllers/ai-generation/estimate-tokens/index.ts](../../controllers/ai-generation/estimate-tokens/index.ts)

**Route**: `POST /ai/estimate`

**Request Body**:
```typescript
{
  businessDescription: string
  industry?: string
  targetAudience?: string
  funnelType?: string
  maxPages?: number
}
```

**Response**: `200 OK`
```typescript
{
  estimatedTokens: number
  userBalance: {
    tokensUsed: number
    tokensLimit: number | null
    remainingTokens: number | null
    unlimited: boolean
  }
  canGenerate: boolean
  message: string
}
```

---

### Controller 3: Get Token Balance

**File**: [src/controllers/ai-generation/get-token-balance/index.ts](../../controllers/ai-generation/get-token-balance/index.ts)

**Route**: `GET /ai/balance`

**Response**: `200 OK`
```typescript
{
  tokensUsed: number
  tokensLimit: number | null
  remainingTokens: number | null
  lastResetAt: Date
  unlimited: boolean
}
```

---

### Controller 4: Get Generation History

**File**: [src/controllers/ai-generation/get-generation-history/index.ts](../../controllers/ai-generation/get-generation-history/index.ts)

**Route**: `GET /ai/history?limit=20&offset=0`

**Query Parameters**:
- `limit`: Number of records to return (default: 20, max: 100)
- `offset`: Number of records to skip (default: 0)

**Response**: `200 OK`
```typescript
{
  history: Array<{
    id: number
    prompt: string
    tokensUsed: number
    pagesGenerated: number
    model: string
    createdAt: Date
    workspace: { id: number, name: string }
    funnel: { id: number, name: string } | null
  }>
  stats: {
    totalGenerations: number
    totalPagesGenerated: number
    totalTokensUsed: number
    generationsLast30Days: number
  }
}
```

---

## Utilities Layer

### Utility 1: Gemini Client

**File**: [src/utils/ai-generation/gemini-client/index.ts](../../utils/ai-generation/gemini-client/index.ts)

**Purpose**: Wrapper for Google Gemini API with model selection and token tracking.

**Available Models**:
```typescript
export const GEMINI_MODELS = {
  FLASH: {
    name: "gemini-2.5-flash",
    maxOutputTokens: 8192,
    description: "Fast & cost-effective. Good for ~40 elements with images."
  },
  PRO: {
    name: "gemini-2.5-pro",
    maxOutputTokens: 32768,
    description: "Premium quality. Good for ~205 elements with images."
  }
} as const;
```

**Key Functions**:

**1. Model Selection**:
```typescript
export function selectGeminiModel(
  estimatedOutputTokens: number,
  options?: {
    totalElements?: number;
    promptLength?: number;
  }
): GeminiModelType {
  const totalElements = options?.totalElements || 0;
  const promptLength = options?.promptLength || 0;

  // Quality-first: Complex funnels need Pro for better coherence
  if (totalElements > 40) {
    return GEMINI_MODELS.PRO;
  }

  // Detail-first: Long refined prompts need Pro for full context
  if (promptLength > 3000) {
    return GEMINI_MODELS.PRO;
  }

  // Capacity-based: Use Pro if estimated exceeds Flash limit
  if (estimatedOutputTokens > GEMINI_MODELS.FLASH.maxOutputTokens) {
    return GEMINI_MODELS.PRO;
  }

  // Default: Flash (cost-effective for simple funnels)
  return GEMINI_MODELS.FLASH;
}
```

**2. Content Generation**:
```typescript
export async function generateContent(
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const model = getGeminiModel(modelName);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction
      ? { role: "system", parts: [{ text: systemInstruction }] }
      : undefined,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: GEMINI_MODELS[modelName].maxOutputTokens
    }
  });

  const response = result.response;
  const usage = getTokenUsage(result);

  return {
    text: response.text(),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens
  };
}
```

**3. Streaming Generation** (for Pro model):
```typescript
export async function generateContentStream(
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const model = getGeminiModel(modelName);

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction
      ? { role: "system", parts: [{ text: systemInstruction }] }
      : undefined,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: GEMINI_MODELS[modelName].maxOutputTokens
    }
  });

  let fullText = "";
  for await (const chunk of result.stream) {
    fullText += chunk.text();
  }

  const finalResult = await result.response;
  const usage = getTokenUsage({ response: finalResult });

  return {
    text: fullText,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens
  };
}
```

**4. JSON Parsing**:
```typescript
export function parseJSONFromResponse(responseText: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is if no patterns match
  return responseText;
}
```

---

### Utility 2: Prompt Builder

**File**: [src/utils/ai-generation/prompt-builder/index.ts](../../utils/ai-generation/prompt-builder/index.ts)

**Purpose**: Constructs comprehensive prompts for AI generation with element schemas and validation rules.

**Key Constants**:
```typescript
// Element type validation (CRITICAL - prevents AI hallucinations)
const ELEMENT_TYPE_VALIDATION = `
🚨🚨🚨 CRITICAL: VALID ELEMENT TYPES ONLY 🚨🚨🚨

Use ONLY these 25 element types:

**Essentials:** text, button, divider
**Media:** image, video, icon, media, media-with-text, embed
**Forms:** form, form-input, form-select, form-checkbox, form-phonenumber,
         form-datepicker, form-number, form-message
**Quizzes:** quiz, answer
**Content:** faq, faq-item, comparison-chart
**Advanced:** webinar

❌ INVALID TYPES (will cause validation failure):
• "countdown", "timer", "progress-bar", "spacer", "separator"
• "heading", "headline", "richtext", "paragraph", "title", "subtitle"
• "section", "container", "hero", "card", "grid", "column", "row"
• "testimonial", "slider", "carousel", "accordion", "tabs", "modal"

**How to Achieve Common Patterns:**
• Headlines → Use "text" with size: "xl" and format: {bold: true}
• Countdown/urgency → Use "text" with urgent messaging
• Testimonials → Use "media-with-text" with customer photo + quote
• Pricing table → Use "comparison-chart"
`;
```

**Prompt Functions**:

**1. Full System Prompt** (includes all element schemas):
```typescript
export function buildSystemPrompt(): string {
  return `
You are an expert funnel designer specializing in high-converting sales funnels.

${ELEMENT_TYPE_VALIDATION}

## Element Schema Definitions

### Text Element
${JSON.stringify(textElementDefinition.schema, null, 2)}

### Button Element
${JSON.stringify(buttonElementDefinition.schema, null, 2)}

// ... all 25 element schemas ...

## Critical Rules

1. **ENUM CASING (CRITICAL)**:
   - borderRadius: MUST be UPPERCASE ("NONE", "SOFT", "ROUNDED")
   - size: MUST be lowercase ("sm", "md", "lg", "xl")
   - align: MUST be lowercase ("left", "center", "right", "justify")
   - All other enums: lowercase

2. **IMAGE PLACEHOLDERS**:
   - ALWAYS use data URI placeholders for images:
     data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E
   - NEVER use external URLs or "placeholder.jpg"

3. **SEO KEYWORDS**:
   - MUST be an array of strings
   - Example: ["keyword 1", "keyword 2", "keyword 3"]
   - NOT a single string with commas

4. **REQUIRED FIELDS**:
   - Every element MUST have: id, type, order
   - id format: "{type}-{timestamp}-{random}"
   - order starts at 1, increments sequentially

5. **FUNNEL STRUCTURE**:
   - Minimum 3 pages, recommended 5-8 pages
   - Include at least 1 RESULT page (thank you/confirmation)
   - Logical flow: landing → benefits → trust → action → result

6. **STYLE RESTRICTIONS**:
   - DO NOT use: margin, animation, transform, position, float
   - Only use: color, backgroundColor, padding, border, borderRadius, fontWeight, fontSize
`;
}
```

**2. Compact System Prompt** (skips schemas to save tokens):
```typescript
export function buildCompactSystemPrompt(): string {
  return `
You are an expert funnel designer.

${ELEMENT_TYPE_VALIDATION}

Generate a complete funnel structure with valid element types only.
Follow strict enum casing rules: borderRadius=UPPERCASE, size=lowercase.
Use data URI placeholders for all images.
`;
}
```

**3. Standard User Prompt**:
```typescript
export function buildUserPrompt(
  businessDescription: string,
  industry?: string,
  targetAudience?: string,
  funnelType?: string,
  userPrompt?: string
): string {
  return `
Create a high-converting ${funnelType || "sales"} funnel for:

**Business**: ${businessDescription}
${industry ? `**Industry**: ${industry}` : ''}
${targetAudience ? `**Target Audience**: ${targetAudience}` : ''}
${userPrompt ? `\n**Additional Requirements**: ${userPrompt}` : ''}

Generate 5-8 pages with compelling content, clear CTAs, and proper funnel flow.
Include landing, benefits, social proof, conversion, and thank you pages.
`;
}
```

**4. Limited Prompt** (when maxPages specified):
```typescript
export function buildLimitedPrompt(
  businessDescription: string,
  maxPages: number,
  maxElementsPerPage: number,
  userPrompt?: string
): string {
  return `
Create a ${maxPages}-page funnel with ${maxElementsPerPage} elements per page.

**Business**: ${businessDescription}
${userPrompt ? `**Requirements**: ${userPrompt}` : ''}

CRITICAL LIMITS:
- Exactly ${maxPages} pages
- ${maxElementsPerPage} elements per page
- Total capacity: ${maxPages * maxElementsPerPage} elements
`;
}
```

**5. Step 2 Generation Prompt** (with refined context):
```typescript
export function buildStep2GenerationPrompt(input: {
  refinedPrompt: string;
  funnelStrategy: any;
  pageStructure: any[];
  keyMessaging: string[];
  conversionStrategy: string;
}): string {
  return `
Generate a complete funnel based on this comprehensive strategy:

## REFINED STRATEGY
${input.refinedPrompt}

## FUNNEL STRUCTURE
- Pages: ${input.funnelStrategy.recommendedPages}
- Elements per page: ${input.funnelStrategy.recommendedElementsPerPage}
- Reasoning: ${input.funnelStrategy.reasoning}

## PAGE BLUEPRINT
${input.pageStructure.map((page, i) => `
Page ${i + 1}: ${page.pageName} (${page.pageType})
Purpose: ${page.purpose}
Elements: ${page.recommendedElements}
Key Content: ${page.keyContent.join(', ')}
`).join('\n')}

## KEY MESSAGING (use consistently across pages)
${input.keyMessaging.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

## CONVERSION STRATEGY
${input.conversionStrategy}

Generate the complete funnel now with rich, detailed content.
`;
}
```

---

### Utility 3: Token Tracker

**File**: [src/utils/ai-generation/token-tracker/index.ts](../../utils/ai-generation/token-tracker/index.ts)

**Purpose**: Manages user token balance, deduction, and generation logging.

**Key Functions**:

**1. Get Balance**:
```typescript
export async function getTokenBalance(
  userId: number
): Promise<AITokenBalance> {
  const prisma = getPrisma();

  let balance = await prisma.aITokenBalance.findUnique({
    where: { userId }
  });

  if (!balance) {
    balance = await prisma.aITokenBalance.create({
      data: {
        userId,
        tokensUsed: 0,
        tokensLimit: null  // null = unlimited
      }
    });
  }

  return balance;
}
```

**2. Check Availability**:
```typescript
export async function hasEnoughTokens(
  userId: number,
  tokensNeeded: number
): Promise<boolean> {
  const balance = await getTokenBalance(userId);

  // Unlimited plan
  if (balance.tokensLimit === null) {
    return true;
  }

  // Check if enough remaining
  const remaining = balance.tokensLimit - balance.tokensUsed;
  return remaining >= tokensNeeded;
}
```

**3. Deduct Tokens**:
```typescript
export async function deductTokens(
  userId: number,
  tokensUsed: number,
  generationLogId?: number,
  description?: string
): Promise<{
  success: boolean;
  remainingTokens: number | null;
  balance: AITokenBalance;
}> {
  const prisma = getPrisma();

  const balance = await prisma.aITokenBalance.update({
    where: { userId },
    data: {
      tokensUsed: { increment: tokensUsed }
    }
  });

  // Log transaction
  await prisma.aITokenHistory.create({
    data: {
      userId,
      tokensChange: -tokensUsed,  // Negative for deduction
      operation: "GENERATION",
      description: description || "AI funnel generation",
      balanceAfter: balance.tokensUsed,
      generationLogId
    }
  });

  const remaining = balance.tokensLimit
    ? balance.tokensLimit - balance.tokensUsed
    : null;

  return {
    success: true,
    remainingTokens: remaining,
    balance
  };
}
```

**4. Log Generation**:
```typescript
export async function logGeneration(
  userId: number,
  workspaceId: number,
  funnelId: number | null,
  prompt: string,
  tokensUsed: number,
  pagesGenerated: number,
  model: string
): Promise<number> {
  const prisma = getPrisma();

  const log = await prisma.aIGenerationLog.create({
    data: {
      userId,
      workspaceId,
      funnelId,
      prompt: prompt.substring(0, 5000),  // Truncate long prompts
      tokensUsed,
      pagesGenerated,
      model
    }
  });

  return log.id;
}
```

**5. Estimate Tokens**:
```typescript
export function estimateTokensForGeneration(
  promptLength: number,
  numberOfPages: number
): number {
  const systemPromptTokens = 5000;
  const userPromptTokens = Math.ceil(promptLength / 4);
  const expectedResponseTokens = numberOfPages * 1000;
  const bufferMultiplier = 1.2;

  return Math.ceil(
    (systemPromptTokens + userPromptTokens + expectedResponseTokens) * bufferMultiplier
  );
}
```

---

### Utility 4: Theme Generator

**File**: [src/utils/ai-generation/theme-generator/index.ts](../../utils/ai-generation/theme-generator/index.ts)

**Purpose**: Generates color palettes using AI or algorithmic color theory.

**Interface**:
```typescript
interface GenerateThemeOptions {
  primaryColor?: string;
  secondaryColor?: string;
  preferDarkBackground?: boolean;
  businessDescription?: string;
  industry?: string;
}

interface ThemeColors {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderColor: string;
  optionColor: string;
}
```

**Main Function**:
```typescript
export async function generateTheme(
  options: GenerateThemeOptions
): Promise<ThemeColors> {
  // Strategy 1: Both colors provided → derive algorithmically
  if (options.primaryColor && options.secondaryColor) {
    return deriveThemeFromColors(
      options.primaryColor,
      options.secondaryColor,
      options.preferDarkBackground
    );
  }

  // Strategy 2: One color provided → use AI for complementary
  if (options.primaryColor || options.secondaryColor) {
    return await generateComplementaryTheme(
      options.primaryColor || options.secondaryColor!,
      options.preferDarkBackground,
      options.businessDescription,
      options.industry
    );
  }

  // Strategy 3: No colors → use AI for niche-appropriate theme
  return await generateAITheme(
    options.businessDescription || "",
    options.industry || "",
    options.preferDarkBackground
  );
}
```

**Color Utilities**:
```typescript
// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Lighten color by percentage
function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const increase = (amount: number) =>
    Math.min(255, Math.floor(amount + (255 - amount) * percent / 100));

  const r = increase(rgb.r);
  const g = increase(rgb.g);
  const b = increase(rgb.b);

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// Darken color by percentage
function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const decrease = (amount: number) =>
    Math.max(0, Math.floor(amount * (1 - percent / 100)));

  const r = decrease(rgb.r);
  const g = decrease(rgb.g);
  const b = decrease(rgb.b);

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// Check contrast ratio (WCAG AA: 4.5:1 for normal text)
function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}
```

**AI Theme Generation**:
```typescript
async function generateAITheme(
  businessDescription: string,
  industry: string,
  preferDarkBackground?: boolean
): Promise<ThemeColors> {
  const prompt = `
Generate a color palette for a ${industry} business: ${businessDescription}

Return JSON with hex colors:
{
  "primaryColor": "#RRGGBB",
  "secondaryColor": "#RRGGBB",
  "accentColor": "#RRGGBB",
  "reasoning": "Why these colors work"
}

${preferDarkBackground ? 'Prefer dark background palette.' : 'Prefer light background palette.'}
`;

  const response = await generateContent(
    GEMINI_MODELS.FLASH.name,
    prompt
  );

  const jsonString = parseJSONFromResponse(response.text);
  const aiTheme = JSON.parse(jsonString);

  return deriveThemeFromColors(
    aiTheme.primaryColor,
    aiTheme.secondaryColor,
    preferDarkBackground
  );
}
```

---

### Utility 5: Validators

**File**: [src/utils/ai-generation/validators/index.ts](../../utils/ai-generation/validators/index.ts)

**Purpose**: Validates funnel structure and element data.

**Key Functions**:

**1. Validate Element**:
```typescript
export function validateElement(element: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!element.type) errors.push("Missing 'type' field");
  if (!element.id) errors.push("Missing 'id' field");
  if (element.order === undefined) errors.push("Missing 'order' field");

  // Valid element type
  const validTypes = getAllElementTypes();
  if (element.type && !validTypes.includes(element.type)) {
    errors.push(`Unknown element type: ${element.type}`);
  }

  // Enum casing validation
  if (element.borderRadius && !['NONE', 'SOFT', 'ROUNDED'].includes(element.borderRadius)) {
    errors.push(`Invalid borderRadius: ${element.borderRadius} (must be UPPERCASE)`);
  }

  if (element.size && !['sm', 'md', 'lg', 'xl'].includes(element.size)) {
    errors.push(`Invalid size: ${element.size} (must be lowercase)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**2. Validate Page**:
```typescript
export function validatePage(page: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!page.name) errors.push("Missing 'name' field");
  if (!page.type) errors.push("Missing 'type' field");
  if (!['PAGE', 'RESULT'].includes(page.type)) {
    errors.push(`Invalid page type: ${page.type}`);
  }
  if (!Array.isArray(page.elements)) {
    errors.push("'elements' must be an array");
  }

  // Validate each element
  if (Array.isArray(page.elements)) {
    page.elements.forEach((element, index) => {
      const validation = validateElement(element);
      if (!validation.valid) {
        errors.push(`Element ${index}: ${validation.errors.join(', ')}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**3. Validate Funnel**:
```typescript
export function validateFunnel(funnel: any): {
  valid: boolean;
  errors: Array<{
    page?: number;
    errors: string[];
  }>;
} {
  const validationErrors: Array<{
    page?: number;
    errors: string[];
  }> = [];

  // Validate funnel-level fields
  const funnelErrors: string[] = [];
  if (!funnel.funnelName) funnelErrors.push("Missing 'funnelName'");
  if (!Array.isArray(funnel.pages)) funnelErrors.push("'pages' must be an array");
  if (funnel.pages && funnel.pages.length === 0) funnelErrors.push("Funnel must have at least 1 page");

  if (funnelErrors.length > 0) {
    validationErrors.push({ errors: funnelErrors });
  }

  // Validate each page
  if (Array.isArray(funnel.pages)) {
    funnel.pages.forEach((page, index) => {
      const pageValidation = validatePage(page);
      if (!pageValidation.valid) {
        validationErrors.push({
          page: index + 1,
          errors: pageValidation.errors
        });
      }
    });
  }

  return {
    valid: validationErrors.length === 0,
    errors: validationErrors
  };
}
```

**4. Sanitize Elements**:
```typescript
export function sanitizeElements(elements: any[]): any[] {
  // Filter out standalone faq-items (must be children of faq)
  const filtered = filterStandaloneFAQItems(elements);

  // Add IDs to elements missing them
  const withIds = filtered.map((element, index) => {
    if (!element.id) {
      element.id = `${element.type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    if (element.order === undefined) {
      element.order = index + 1;
    }

    // Recursively sanitize children
    if (element.children && Array.isArray(element.children)) {
      element.children = sanitizeElements(element.children);
    }

    return element;
  });

  return withIds;
}
```

---

### Utility 6: Element Utilities

**Directory**: [src/services/ai-generation/funnel-generator/utils/](./funnel-generator/utils/)

**6.1 Element Fixer** ([element-fixer.util.ts](./funnel-generator/utils/element-fixer.util.ts))

**Purpose**: Adds missing required fields to elements.

```typescript
export function autoFixMissingFields(elements: any[]): any[] {
  return elements.map((element, index) => {
    // Add missing id
    if (!element.id) {
      element.id = `${element.type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // Add missing order
    if (element.order === undefined) {
      element.order = index + 1;
    }

    // Add missing type (should never happen, but failsafe)
    if (!element.type) {
      element.type = 'text';  // Default to text
    }

    // Recursively fix children
    if (element.children && Array.isArray(element.children)) {
      element.children = autoFixMissingFields(element.children);
    }

    return element;
  });
}
```

---

**6.2 Enum Fixer** ([enum-fixer.util.ts](./funnel-generator/utils/enum-fixer.util.ts))

**Purpose**: Corrects enum value casing.

```typescript
export function autoFixEnumValues(elements: any[]): any[] {
  return elements.map(element => {
    // Fix borderRadius: MUST be UPPERCASE
    if (element.borderRadius) {
      const uppercase = element.borderRadius.toUpperCase();
      if (['NONE', 'SOFT', 'ROUNDED'].includes(uppercase)) {
        element.borderRadius = uppercase;
      } else {
        element.borderRadius = 'SOFT';  // Default
      }
    }

    // Fix size: MUST be lowercase
    if (element.size) {
      const lowercase = element.size.toLowerCase();
      if (['sm', 'md', 'lg', 'xl'].includes(lowercase)) {
        element.size = lowercase;
      } else {
        element.size = 'md';  // Default
      }
    }

    // Fix align: MUST be lowercase
    if (element.align) {
      const lowercase = element.align.toLowerCase();
      if (['left', 'center', 'right', 'justify'].includes(lowercase)) {
        element.align = lowercase;
      }
    }

    // Fix borderStyle: MUST be lowercase
    if (element.borderStyle) {
      const lowercase = element.borderStyle.toLowerCase();
      if (['solid', 'dashed', 'dotted'].includes(lowercase)) {
        element.borderStyle = lowercase;
      }
    }

    // Recursively fix children
    if (element.children && Array.isArray(element.children)) {
      element.children = autoFixEnumValues(element.children);
    }

    return element;
  });
}
```

---

**6.3 Style Sanitizer** ([style-sanitizer.util.ts](./funnel-generator/utils/style-sanitizer.util.ts))

**Purpose**: Removes layout-breaking CSS properties.

```typescript
export function sanitizeElementStyles(elements: any[]): any[] {
  const ALLOWED_STYLE_PROPERTIES = [
    'color',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'border',
    'borderTop',
    'borderRight',
    'borderBottom',
    'borderLeft',
    'borderRadius',
    'fontWeight',
    'fontSize',
    'fontFamily',
    'lineHeight',
    'textAlign',
    'textDecoration',
    'opacity'
  ];

  return elements.map(element => {
    // Sanitize element styles
    if (element.styles && typeof element.styles === 'object') {
      const sanitizedStyles: any = {};

      Object.keys(element.styles).forEach(key => {
        if (ALLOWED_STYLE_PROPERTIES.includes(key)) {
          sanitizedStyles[key] = element.styles[key];
        }
      });

      element.styles = sanitizedStyles;
    }

    // Recursively sanitize children
    if (element.children && Array.isArray(element.children)) {
      element.children = sanitizeElementStyles(element.children);
    }

    return element;
  });
}
```

**Removed Properties** (break layout):
- `margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`
- `animation`, `animationDelay`, `animationDuration`
- `transform`, `transformOrigin`
- `position`, `top`, `right`, `bottom`, `left`
- `float`, `clear`
- `width`, `height`, `maxWidth`, `maxHeight`
- `display`, `visibility`, `overflow`

---

**6.4 Link Resolver** ([link-resolver.util.ts](./funnel-generator/utils/link-resolver.util.ts))

**Purpose**: Converts page names in button links to actual linkingIds.

```typescript
export function replacePageNamesInLinks(
  elements: any[],
  pageNameToLinkingId: Map<string, string>
): any[] {
  return elements.map(element => {
    // Check button links
    if (element.type === 'button' && element.link?.enabled && element.link.href) {
      const pageName = element.link.href;
      const linkingId = pageNameToLinkingId.get(pageName);

      if (linkingId) {
        element.link.href = linkingId;
        element.link.type = 'internal';
      }
    }

    // Recursively process children
    if (element.children && Array.isArray(element.children)) {
      element.children = replacePageNamesInLinks(element.children, pageNameToLinkingId);
    }

    return element;
  });
}
```

**Example**:
```typescript
// Before
{
  type: "button",
  link: {
    enabled: true,
    href: "Thank You Page",  // AI generated with page name
    type: "internal"
  }
}

// After
{
  type: "button",
  link: {
    enabled: true,
    href: "thank-you-page-1704384000000-2",  // Actual linkingId
    type: "internal"
  }
}
```

---

**6.5 Element Extractor** ([element-extractor.util.ts](./funnel-generator/utils/element-extractor.util.ts))

**Purpose**: Extracts quiz and form elements for database creation.

```typescript
export function extractQuizElements(elements: any[]): any[] {
  const quizElements: any[] = [];

  elements.forEach(element => {
    if (element.type === 'quiz') {
      quizElements.push(element);
    }

    // Recursively check children
    if (element.children && Array.isArray(element.children)) {
      quizElements.push(...extractQuizElements(element.children));
    }
  });

  return quizElements;
}

export function extractFormElements(elements: any[]): any[] {
  const formElements: any[] = [];

  elements.forEach(element => {
    if (element.type === 'form') {
      formElements.push(element);
    }

    // Recursively check children
    if (element.children && Array.isArray(element.children)) {
      formElements.push(...extractFormElements(element.children));
    }
  });

  return formElements;
}
```

---

**6.6 Element Updater** ([element-updater.util.ts](./funnel-generator/utils/element-updater.util.ts))

**Purpose**: Updates element serverId after database record creation.

```typescript
export function updateElementServerId(
  elements: any[],
  elementId: string,
  serverId: number
): any[] {
  return elements.map(element => {
    // Update if this is the target element
    if (element.id === elementId) {
      element.serverId = serverId;
    }

    // Recursively update children
    if (element.children && Array.isArray(element.children)) {
      element.children = updateElementServerId(element.children, elementId, serverId);
    }

    return element;
  });
}
```

**Usage**:
```typescript
// After creating Insight record for quiz
const insight = await tx.insight.create({ ... });

// Update quiz element with serverId
updatedElements = updateElementServerId(
  elements,
  quizElement.id,
  insight.id
);

// Now quiz element has: { id: "quiz-123", serverId: 42, ... }
```

---

**6.7 SEO Converter** ([seo-converter.util.ts](./funnel-generator/utils/seo-converter.util.ts))

**Purpose**: Converts SEO keywords between array and string formats.

```typescript
export function convertSeoKeywordsToString(
  keywords: string | string[] | undefined
): string {
  if (!keywords) return '';

  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }

  return keywords;
}

export function convertSeoKeywordsToArray(
  keywords: string | string[] | undefined
): string[] {
  if (!keywords) return [];

  if (Array.isArray(keywords)) {
    return keywords;
  }

  return keywords.split(',').map(k => k.trim()).filter(k => k);
}
```

**Why needed**:
- AI generates: `["keyword 1", "keyword 2"]` (array)
- DB stores: `"keyword 1, keyword 2"` (string)
- API returns: `["keyword 1", "keyword 2"]` (array)

---

## UI Elements System

### Element Type Registry

**File**: [src/utils/ai-generation/ui-elements/index.ts](../../utils/ai-generation/ui-elements/index.ts)

**25 Valid Element Types**:

| Category | Element Types | File |
|----------|---------------|------|
| **Essentials** | `text`, `button`, `divider` | essentials/*.element.ts |
| **Visuals** | `image`, `video`, `icon`, `media`, `media-with-text` | visuals/*.element.ts |
| **Forms** | `form`, `form-input`, `form-message`, `form-phonenumber`, `form-checkbox`, `form-select`, `form-datepicker`, `form-number` | interactive/*.element.ts |
| **Quizzes** | `quiz`, `answer` | interactive/*.element.ts |
| **Informative** | `faq`, `faq-item`, `comparison-chart` | informative/*.element.ts |
| **Advanced** | `webinar` | interactive/*.element.ts |
| **Embed** | `embed` | embed/*.element.ts |

### Element Definition Structure

Each element has:
```typescript
interface ElementDefinition {
  schema: JSONSchema;        // Full JSON schema for validation
  examples: any[];           // Usage examples
  description: string;       // Purpose & usage
  aiInstructions: string;    // How AI should generate it
  category: string;          // Grouping
}
```

**Example** (Text Element):
```typescript
export const textElementDefinition: ElementDefinition = {
  schema: {
    type: "object",
    required: ["id", "type", "order", "content"],
    properties: {
      id: { type: "string" },
      type: { const: "text" },
      order: { type: "number" },
      content: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string" }
        }
      },
      size: {
        type: "string",
        enum: ["sm", "md", "lg", "xl"],  // MUST be lowercase
        default: "md"
      },
      align: {
        type: "string",
        enum: ["left", "center", "right", "justify"],
        default: "left"
      },
      format: {
        type: "object",
        properties: {
          bold: { type: "boolean" },
          italic: { type: "boolean" },
          underline: { type: "boolean" }
        }
      },
      borderRadius: {
        type: "string",
        enum: ["NONE", "SOFT", "ROUNDED"],  // MUST be UPPERCASE
        default: "NONE"
      },
      styles: {
        type: "object",
        properties: {
          color: { type: "string" },
          backgroundColor: { type: "string" },
          padding: { type: "string" }
        }
      }
    }
  },
  examples: [
    {
      id: "text-1704384000000-1",
      type: "text",
      order: 1,
      content: { label: "Transform Your Health Today" },
      size: "xl",
      align: "center",
      format: { bold: true },
      borderRadius: "NONE"
    }
  ],
  description: "Text element for paragraphs, headlines, and body content",
  aiInstructions: "Use for all text content. Size xl for headlines, md for body.",
  category: "essentials"
};
```

### Common AI Mistakes & Corrections

**❌ Invalid Types** (AI often hallucinates these):
```
countdown, timer, progress-bar, spacer, separator
heading, headline, richtext, paragraph, title, subtitle
section, container, hero, card, grid, column, row
testimonial, slider, carousel, accordion, tabs, modal
```

**✅ Correct Alternatives**:
```
countdown/urgency → text (with urgent messaging)
heading/headline → text (with size: "xl", format: {bold: true})
testimonial → media-with-text (customer photo + quote)
pricing table → comparison-chart
spacer → divider
container/section → Not needed (elements are flat)
```

### Element Integration Guide

**Complete guide**: [ADD_NEW_ELEMENT_GUIDE.md](../../utils/ai-generation/ui-elements/ADD_NEW_ELEMENT_GUIDE.md)

**Quick steps to add new element**:
1. Create `new-element.element.ts` in appropriate category folder
2. Define schema, examples, description, AI instructions
3. Export from category folder's index.ts
4. Export from main `ui-elements/index.ts`
5. Add to ELEMENT_TYPE_VALIDATION in prompt-builder
6. Test generation with new element type

---

## Key Patterns

### Pattern 1: 2-Step Refinement

**Why**: Quality, cost, and predictability.

**Step 1 - Analysis** (Gemini Flash, ~2500-4000 tokens):
- Fast, cheap model for analysis
- Creates comprehensive strategy
- Recommends structure
- Defines key messaging
- Returns 300-800 word refined prompt

**Step 2 - Generation** (Gemini Flash/Pro, ~10,000-30,000 tokens):
- Uses refined context for better quality
- Model auto-selected based on complexity
- Batch mode (all pages at once)
- Post-processing for consistency

**Benefits**:
- **Better Quality**: AI has full context from Step 1
- **Lower Cost**: Step 1 uses cheap Flash model
- **Predictable**: Structure defined in Step 1
- **Consistent**: Key messaging applied across all pages

---

### Pattern 2: Token Estimation & Validation

**Critical Rule**: **ALWAYS estimate and validate tokens BEFORE executing AI.**

**Why**: Prevents wasted spending on partial generations.

**Implementation**:
```typescript
// 1. Estimate Step 1
const step1Estimate = estimateRefinePromptTokens(input);

// 2. Estimate Step 2 (conservative)
const step2Estimate = 60 * 400 + 4000;  // Assume typical 6x10 funnel

// 3. Calculate total
const totalEstimate = step1Estimate + step2Estimate;

// 4. Check availability
if (!await hasEnoughTokens(userId, totalEstimate)) {
  throw new BadRequestError("Insufficient tokens");
}

// 5. Proceed safely (tokens available)
const step1Result = await refinePrompt(input);
const step2Result = await generateFunnelCore(userId, request);

// 6. Deduct actual tokens
await deductTokens(userId, step1Result.tokens + step2Result.tokens);
```

**Error Message** (user-friendly):
```
"Insufficient AI tokens to generate this funnel. Please add more tokens to your account."
```

---

### Pattern 3: Model Selection Strategy

**Decision Tree**:
```
if (totalElements > 40) {
  → Gemini Pro (quality-first for complex funnels)
}
else if (promptLength > 3000) {
  → Gemini Pro (detail-first for refined prompts)
}
else if (estimatedTokens > 8192) {
  → Gemini Pro (capacity-based necessity)
}
else {
  → Gemini Flash (cost-effective for simple funnels)
}
```

**Token Estimates**:
- **Flash**: 300 tokens/element (direct prompts)
- **Pro**: 400 tokens/element (refined prompts)
- **Overhead**: 3000-4000 tokens (structure + SEO)

**Capacity Limits**:
- **Flash**: ~40 elements max (with images)
- **Pro**: ~70 elements max (with images)

---

### Pattern 4: Post-Processing Pipeline

**Fixed Order** (dependencies):
```
1. autoFixMissingFields()      → Ensures id, type, order
2. autoFixEnumValues()          → Fixes casing
3. validateFunnel()             → Checks structure
4. replacePageNamesInLinks()    → Resolves links
5. extractQuizElements()        → Extract quizzes
6. extractFormElements()        → Extract forms
7. updateElementServerId()      → Set serverIds
8. sanitizeElementStyles()      → Remove bad styles
9. convertSeoKeywordsToString() → Array → String
```

**Why each step**:
- **autoFixMissingFields**: AI sometimes forgets required fields
- **autoFixEnumValues**: AI uses inconsistent casing
- **validateFunnel**: Catch structural errors early
- **replacePageNamesInLinks**: AI uses human-readable names, need IDs
- **extractQuiz/Form**: Create DB records for nested structures
- **updateElementServerId**: Link elements to DB records
- **sanitizeElementStyles**: Remove layout-breaking properties
- **convertSeoKeywords**: DB stores strings, API returns arrays

---

### Pattern 5: Enum Casing Rules

**CRITICAL**: Incorrect casing causes validation errors.

**Rules**:
```typescript
borderRadius: "NONE" | "SOFT" | "ROUNDED"     // UPPERCASE
size: "sm" | "md" | "lg" | "xl"               // lowercase
align: "left" | "center" | "right" | "justify" // lowercase
borderStyle: "solid" | "dashed" | "dotted"    // lowercase
target: "_self" | "_blank"                    // lowercase
type: "internal" | "external"                 // lowercase
```

**Auto-Fix**:
```typescript
if (element.borderRadius) {
  element.borderRadius = element.borderRadius.toUpperCase();
}

if (element.size) {
  element.size = element.size.toLowerCase();
}
```

---

### Pattern 6: Image Handling

**Rule**: ALWAYS use data URI placeholders.

**Correct**:
```typescript
{
  type: "image",
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E"
}
```

**Wrong**:
```typescript
{
  type: "image",
  src: "https://example.com/image.jpg"  // External URL
}

{
  type: "image",
  src: "placeholder.jpg"  // Relative path
}
```

**Why**: Users upload real images later. External URLs create dependencies and privacy issues.

---

### Pattern 7: SEO Keywords Format

**API Expects** (array):
```typescript
{
  seoKeywords: ["keyword 1", "keyword 2", "keyword 3"]
}
```

**DB Stores** (string):
```sql
seoKeywords: "keyword 1, keyword 2, keyword 3"
```

**Conversion Functions**:
```typescript
// Array → String (for DB storage)
convertSeoKeywordsToString(["a", "b", "c"]) → "a, b, c"

// String → Array (for API response)
convertSeoKeywordsToArray("a, b, c") → ["a", "b", "c"]
```

**Common AI Mistakes**:
```typescript
// ❌ Wrong: Single string with commas
seoKeywords: "keyword 1, keyword 2"

// ❌ Wrong: Array with single comma-separated string
seoKeywords: ["keyword 1, keyword 2, keyword 3"]

// ✅ Correct: Array of individual keywords
seoKeywords: ["keyword 1", "keyword 2", "keyword 3"]
```

---

### Pattern 8: Page Linking Strategy

**AI generates with human-readable names**:
```json
{
  "type": "button",
  "content": { "label": "Get Started" },
  "link": {
    "enabled": true,
    "href": "Benefits Page",  // Human-readable
    "type": "internal"
  }
}
```

**System resolves to linkingIds**:
```json
{
  "type": "button",
  "content": { "label": "Get Started" },
  "link": {
    "enabled": true,
    "href": "benefits-page-1704384000000-2",  // Actual ID
    "type": "internal"
  }
}
```

**Resolution Process**:
```typescript
// 1. Pre-generate linkingIds for all pages
const pageNameToLinkingId = new Map<string, string>();
pages.forEach((page, index) => {
  const linkingId = `${page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}-${index}`;
  pageNameToLinkingId.set(page.name, linkingId);
});

// 2. Replace page names in button links
pages.forEach(page => {
  page.elements = replacePageNamesInLinks(page.elements, pageNameToLinkingId);
});
```

---

### Pattern 9: Element Hierarchy

**Structural Elements** (contain children):
- `quiz` → contains `answer` elements
- `faq` → contains `faq-item` elements
- `form` → contains `form-input`, `form-select`, etc.
- `media-with-text` → contains `image`/`video` + `text`

**Validation Rules**:
- Standalone `faq-item` at top level → **INVALID** (auto-filtered)
- `quiz` without `answer` children → **VALID** (but empty)
- `form` without form fields → **VALID** (but useless)

**Example** (valid quiz):
```json
{
  "type": "quiz",
  "id": "quiz-123",
  "order": 5,
  "children": [
    {
      "type": "text",
      "id": "text-124",
      "order": 1,
      "content": { "label": "What's your fitness goal?" }
    },
    {
      "type": "answer",
      "id": "answer-125",
      "order": 2,
      "content": { "label": "Lose weight" }
    },
    {
      "type": "answer",
      "id": "answer-126",
      "order": 3,
      "content": { "label": "Build muscle" }
    }
  ]
}
```

**Database Creation**:
```typescript
// Extract quiz element
const quizElements = extractQuizElements(page.elements);

for (const quiz of quizElements) {
  // Create Insight record
  const insight = await tx.insight.create({
    data: {
      type: InsightType.QUIZ,
      name: "Fitness Goals Quiz",
      content: quiz.children,  // Store quiz structure
      funnelId: funnel.id
    }
  });

  // Update quiz element with serverId
  updatedElements = updateElementServerId(elements, quiz.id, insight.id);
}

// Now quiz element has: { id: "quiz-123", serverId: 42, ... }
```

---

### Pattern 10: Database Transaction Safety

**Always use transactions** for funnel creation:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create funnel
  const funnel = await tx.funnel.create({ ... });

  // 2. Create theme
  const theme = await tx.theme.create({ funnelId: funnel.id, ... });

  // 3. Create SEO settings
  const seo = await tx.funnelSettings.create({ funnelId: funnel.id, ... });

  // 4. Create pages with elements
  const pages = await Promise.all(
    pagesData.map(async (pageData) => {
      // Create nested records (Insights, Forms)
      const insights = await createInsights(tx, pageData.elements);
      const forms = await createForms(tx, pageData.elements);

      // Create page
      return await tx.page.create({
        data: {
          funnelId: funnel.id,
          name: pageData.name,
          content: JSON.stringify(pageData.elements)
        }
      });
    })
  );

  return { funnel, theme, seo, pages };
});
```

**Why transactions**:
- **Atomicity**: All-or-nothing (no partial funnels)
- **Consistency**: Foreign keys always valid
- **Rollback**: On error, nothing is saved

---

## Database Schema

### Tables Used by AI Generation

**1. Funnel**:
```sql
Funnel {
  id: Int @id @default(autoincrement())
  name: String
  slug: String @unique
  workspaceId: Int
  createdBy: Int
  activeThemeId: Int?

  workspace: Workspace @relation(...)
  user: User @relation(...)
  pages: Page[]
  theme: Theme? @relation(...)
  seoSettings: FunnelSettings?
  aiGenerationLogs: AIGenerationLog[]
}
```

**2. Page**:
```sql
Page {
  id: Int @id @default(autoincrement())
  name: String
  type: PageType (PAGE | RESULT)
  funnelId: Int
  order: Int
  content: String  // JSON stringified elements
  linkingId: String @unique
  seoTitle: String?
  seoDescription: String?
  seoKeywords: String?  // Comma-separated

  funnel: Funnel @relation(...)
}
```

**3. Theme**:
```sql
Theme {
  id: Int @id @default(autoincrement())
  name: String
  backgroundColor: String
  textColor: String
  buttonColor: String
  buttonTextColor: String
  borderColor: String
  optionColor: String
  fontFamily: String
  borderRadius: BorderRadius (NONE | SOFT | ROUNDED)
  type: ThemeType (CUSTOM | PRESET)
  funnelId: Int?

  funnel: Funnel? @relation(...)
}
```

**4. FunnelSettings**:
```sql
FunnelSettings {
  id: Int @id @default(autoincrement())
  funnelId: Int @unique
  defaultSeoTitle: String
  defaultSeoDescription: String
  defaultSeoKeywords: String  // Comma-separated
  language: String
  timezone: String
  dateFormat: String
  enableCookieConsent: Boolean
  isPasswordProtected: Boolean

  funnel: Funnel @relation(...)
}
```

**5. Insight** (for Quiz elements):
```sql
Insight {
  id: Int @id @default(autoincrement())
  type: InsightType (QUIZ)
  name: String
  description: String?
  content: Json  // Quiz structure with answers
  settings: Json
  funnelId: Int

  funnel: Funnel @relation(...)
}
```

**6. Form** (for Form elements):
```sql
Form {
  id: Int @id @default(autoincrement())
  name: String
  description: String?
  formContent: Json  // Form fields structure
  isActive: Boolean
  funnelId: Int
  webhookEnabled: Boolean
  webhookUrl: String?

  funnel: Funnel @relation(...)
  submissions: FormSubmission[]
}
```

**7. AITokenBalance**:
```sql
AITokenBalance {
  id: Int @id @default(autoincrement())
  userId: Int @unique
  tokensUsed: Int @default(0)
  tokensLimit: Int?  // null = unlimited
  lastResetAt: DateTime @default(now())

  user: User @relation(...)
  history: AITokenHistory[]
}
```

**8. AITokenHistory**:
```sql
AITokenHistory {
  id: Int @id @default(autoincrement())
  userId: Int
  tokensChange: Int  // Negative for deduction, positive for addition
  operation: String  // "GENERATION", "RESET", "MANUAL_ADJUST"
  description: String?
  balanceAfter: Int
  generationLogId: Int?
  createdAt: DateTime @default(now())

  user: User @relation(...)
  generationLog: AIGenerationLog? @relation(...)
  balance: AITokenBalance @relation(...)
}
```

**9. AIGenerationLog**:
```sql
AIGenerationLog {
  id: Int @id @default(autoincrement())
  userId: Int
  workspaceId: Int
  funnelId: Int?
  prompt: String  // Truncated to 5000 chars
  tokensUsed: Int
  pagesGenerated: Int
  model: String  // "gemini-2.5-flash (2-step-refined)"
  createdAt: DateTime @default(now())

  user: User @relation(...)
  workspace: Workspace @relation(...)
  funnel: Funnel? @relation(...)
  tokenHistory: AITokenHistory[]
}
```

---

## Troubleshooting

### Common Errors

**1. "Insufficient AI tokens"**

**Cause**: User doesn't have enough tokens for generation.

**Solution**:
- Check balance: `GET /ai/balance`
- Add tokens: Update `AITokenBalance.tokensLimit`
- Or set unlimited: `tokensLimit = null`

**Prevention**: Token check happens BEFORE any AI execution (no waste).

---

**2. "Unknown element type: countdown"**

**Cause**: AI generated invalid element type not in the 25 valid types.

**Solution**:
- Element type validation in prompt builder prevents this
- Post-processing `validateFunnel()` catches it
- Use `text` element instead for countdown/urgency

**Prevention**:
- ELEMENT_TYPE_VALIDATION constant in all prompts
- Explicit invalid type list
- Clear alternatives provided

---

**3. "Invalid borderRadius: soft (must be UPPERCASE)"**

**Cause**: AI generated lowercase enum value.

**Solution**:
- `autoFixEnumValues()` auto-corrects casing
- borderRadius → UPPERCASE
- size, align → lowercase

**Prevention**: Post-processing pipeline fixes automatically.

---

**4. "Generation may be truncated at Gemini Flash token limit"**

**Cause**: Funnel too large for selected model's output capacity.

**Solution**:
- Reduce pages or elements per page
- System suggests safe values in error message
- Or system auto-selects Pro model for large funnels

**Prevention**:
- Pre-validation checks capacity before API call
- Model selection logic prioritizes quality for complex funnels

---

**5. "Failed to parse AI refinement response"**

**Cause**: AI returned invalid JSON.

**Solution**:
- `parseJSONFromResponse()` uses regex fallback
- Retry generation
- Check if prompt is too complex

**Prevention**:
- Clear JSON format examples in prompt
- Explicit structure requirements

---

**6. "Funnel allocation limit reached"**

**Cause**: User exceeded their plan's funnel limit.

**Solution**:
- Check allocation: `WorkspaceFunnelAllocations.canCreateFunnel()`
- Upgrade plan or add funnel add-ons
- Delete unused funnels

**Prevention**: Checked BEFORE any AI execution (early validation).

---

**7. "Page count exceeds allocation"**

**Cause**: AI recommended more pages than user's plan allows.

**Solution**:
- `refinePrompt()` auto-caps to max allowed pages
- Generation fails with clear error message

**Prevention**:
- Step 1 receives max allowed pages as input
- Auto-adjustment if AI exceeds limit

---

**8. "This generation requires 34800 tokens, which exceeds capacity"**

**Cause**: Requested funnel too large even for Gemini Pro.

**Solution**:
- Reduce total elements (max 70 for Pro)
- System suggests safe combinations in error

**Prevention**:
- Pre-validation checks capacity
- Refinement prompt enforces 70-element limit

---

### Validation Failures

**Element Validation**:
```typescript
{
  valid: false,
  errors: [
    "Missing 'type' field",
    "Invalid borderRadius: soft (must be UPPERCASE)",
    "Unknown element type: countdown"
  ]
}
```

**Page Validation**:
```typescript
{
  valid: false,
  errors: [
    "Missing 'name' field",
    "Invalid page type: HOME",
    "Element 5: Unknown element type: timer"
  ]
}
```

**Funnel Validation**:
```typescript
{
  valid: false,
  errors: [
    { errors: ["Missing 'funnelName'"] },
    { page: 2, errors: ["Element 3: Invalid size: XL (must be lowercase)"] },
    { page: 4, errors: ["Missing 'name' field"] }
  ]
}
```

---

### Token Limit Issues

**Symptoms**:
- Truncated funnels (incomplete pages)
- "Exceeded token limit" errors
- Poor quality output (rushed generation)

**Diagnosis**:
```typescript
// Check estimated vs actual
console.log(`Estimated: ${estimatedTokens}`);
console.log(`Actual: ${actualTokensUsed}`);
console.log(`Model: ${selectedModel.name}`);
console.log(`Capacity: ${selectedModel.maxOutputTokens}`);
```

**Solutions**:
1. **Reduce complexity**: Fewer pages or elements
2. **Use Pro model**: Explicitly request complex funnels
3. **Simplify prompt**: Shorter refined prompts use fewer tokens
4. **Adjust estimates**: Update tokensPerElement if consistently wrong

---

### AI Output Quality Problems

**Symptoms**:
- Generic/placeholder content
- Inconsistent messaging across pages
- Missing CTAs or poor conversion flow
- Broken links between pages

**Diagnosis**:
1. Check if using 2-step refinement (quality-first)
2. Verify refined prompt quality (300-800 words)
3. Check model selection (Flash vs Pro)
4. Review post-processing logs

**Solutions**:
1. **Better input**: More detailed businessDescription
2. **Use refinement**: Always use 2-step process
3. **Force Pro**: For complex industries/audiences
4. **Adjust prompts**: Update system prompt with better examples

---

## Integration Guide

### For AI Agents

**You have TWO comprehensive guides**:

1. **THIS GUIDE** (AI_GENERATION_ARCHITECTURE.md):
   - Complete system architecture
   - Request flows and service layer
   - Utilities and patterns
   - Database schema
   - Troubleshooting

2. **ELEMENT GUIDE** ([ADD_NEW_ELEMENT_GUIDE.md](../../utils/ai-generation/ui-elements/ADD_NEW_ELEMENT_GUIDE.md)):
   - Adding new UI element types
   - Element schema structure
   - Integration with AI prompts
   - Testing and validation

**When to use which guide**:

**Use THIS guide when**:
- Understanding overall system flow
- Modifying services or controllers
- Changing token management
- Updating prompt building logic
- Debugging generation issues
- Understanding database operations

**Use ELEMENT guide when**:
- Adding new element types
- Modifying existing element schemas
- Updating AI instructions for elements
- Testing element generation

---

### Quick Reference: Where to Make Changes

**To add new element type**:
1. See [ADD_NEW_ELEMENT_GUIDE.md](../../utils/ai-generation/ui-elements/ADD_NEW_ELEMENT_GUIDE.md)
2. Create element definition file
3. Update ELEMENT_TYPE_VALIDATION in prompt-builder
4. Test generation

**To change AI behavior**:
1. Update prompts in `prompt-builder/index.ts`
2. Adjust system prompt or user prompt
3. Test with sample generation

**To modify token limits**:
1. Update model selection in `gemini-client/index.ts`
2. Adjust tokensPerElement estimates
3. Update capacity validation

**To add new validation rule**:
1. Update `validators/index.ts`
2. Add to post-processing pipeline
3. Update error messages

**To change database schema**:
1. Update Prisma schema
2. Run migration: `prisma migrate dev`
3. Update service layer database operations
4. Update type definitions

**To add new endpoint**:
1. Create controller in `controllers/ai-generation/`
2. Create service in `services/ai-generation/`
3. Add route in `routes/ai-generation/index.ts`
4. Create types in `types/ai-generation/`
5. Update this guide

---

### Testing Checklist

**Before deploying changes**:

- [ ] Unit test new utility functions
- [ ] Integration test service layer
- [ ] Test with minimal funnel (1 page, 5 elements)
- [ ] Test with typical funnel (6 pages, 10 elements)
- [ ] Test with large funnel (8 pages, 15 elements)
- [ ] Test with insufficient tokens (should fail gracefully)
- [ ] Test with invalid element types (should auto-fix or reject)
- [ ] Test with wrong enum casing (should auto-fix)
- [ ] Test database transaction rollback (simulate errors)
- [ ] Verify token deduction accuracy
- [ ] Check generation logs created correctly
- [ ] Validate SEO keywords format (array ↔ string)
- [ ] Test page linking resolution
- [ ] Verify theme generation
- [ ] Check form/quiz element creation

**Performance benchmarks**:
- Step 1 (refinement): < 10 seconds
- Step 2 (generation): < 60 seconds for typical funnel
- Total generation: < 90 seconds
- Token estimation: < 1 second
- Balance check: < 500ms

---

## Appendix

### File Reference Index

**Controllers**:
- [generate-funnel/index.ts](../../controllers/ai-generation/generate-funnel/index.ts) - Main generation endpoint
- [estimate-tokens/index.ts](../../controllers/ai-generation/estimate-tokens/index.ts) - Token estimation
- [get-token-balance/index.ts](../../controllers/ai-generation/get-token-balance/index.ts) - Balance retrieval
- [get-generation-history/index.ts](../../controllers/ai-generation/get-generation-history/index.ts) - History fetching

**Services**:
- [generate-funnel/index.ts](./generate-funnel/index.ts) - PUBLIC: 2-step orchestrator
- [funnel-generator/index.ts](./funnel-generator/index.ts) - INTERNAL: Batch engine
- [refine-prompt/index.ts](./refine-prompt/index.ts) - Step 1 refinement
- [estimate-tokens/index.ts](./estimate-tokens/index.ts) - Token estimation
- [get-token-balance/index.ts](./get-token-balance/index.ts) - Balance service
- [get-generation-history/index.ts](./get-generation-history/index.ts) - History service

**Utilities**:
- [gemini-client/index.ts](../../utils/ai-generation/gemini-client/index.ts) - Gemini API wrapper
- [prompt-builder/index.ts](../../utils/ai-generation/prompt-builder/index.ts) - Prompt construction
- [theme-generator/index.ts](../../utils/ai-generation/theme-generator/index.ts) - Color palettes
- [token-tracker/index.ts](../../utils/ai-generation/token-tracker/index.ts) - Token management
- [validators/index.ts](../../utils/ai-generation/validators/index.ts) - Validation logic
- [ui-elements/index.ts](../../utils/ai-generation/ui-elements/index.ts) - Element registry

**Element Utilities**:
- [element-fixer.util.ts](./funnel-generator/utils/element-fixer.util.ts) - Missing field fixes
- [enum-fixer.util.ts](./funnel-generator/utils/enum-fixer.util.ts) - Enum casing
- [style-sanitizer.util.ts](./funnel-generator/utils/style-sanitizer.util.ts) - Style cleanup
- [link-resolver.util.ts](./funnel-generator/utils/link-resolver.util.ts) - Page linking
- [element-extractor.util.ts](./funnel-generator/utils/element-extractor.util.ts) - Quiz/Form extraction
- [element-updater.util.ts](./funnel-generator/utils/element-updater.util.ts) - ServerId updates
- [seo-converter.util.ts](./funnel-generator/utils/seo-converter.util.ts) - SEO format conversion

**Routes**:
- [index.ts](../../routes/ai-generation/index.ts) - All 4 AI endpoints

**Types**:
- [generate-funnel/index.ts](../../types/ai-generation/generate-funnel/index.ts) - Request/Response schemas
- [estimate-tokens/index.ts](../../types/ai-generation/estimate-tokens/index.ts) - Estimation types
- [get-token-balance/index.ts](../../types/ai-generation/get-token-balance/index.ts) - Balance types
- [get-generation-history/index.ts](../../types/ai-generation/get-generation-history/index.ts) - History types

---

## Glossary

**2-Step Refinement**: Architecture pattern where AI first analyzes requirements (Step 1), then generates funnel with enriched context (Step 2).

**Batch Mode**: Generating all pages at once (vs sequential page-by-page).

**Data URI Placeholder**: SVG-based image placeholder (`data:image/svg+xml,...`) used for all AI-generated images.

**Element Type**: One of 25 valid UI component types (text, button, form, etc.).

**Gemini Flash**: Fast, cost-effective AI model (8K output tokens).

**Gemini Pro**: Premium AI model (32K output tokens, better quality).

**linkingId**: Unique identifier for pages used in internal navigation.

**Post-Processing**: Pipeline of fixes and transformations applied to AI output.

**Refined Prompt**: 300-800 word comprehensive description generated in Step 1.

**serverId**: Database record ID stored in element (for quiz/form elements).

**Token**: Unit of AI usage (roughly 4 characters = 1 token).

---

## Version History

**v2.0** (2025-01-04):
- Added 2-step refinement architecture
- Implemented token estimation before execution
- Consolidated service naming (removed V1/V2 terminology)
- Added comprehensive element type validation
- Created complete architecture guide

**v1.0** (Initial):
- Single-step batch generation
- Basic token tracking
- Element validation

---

## Support

**For questions or issues**:
1. Check this guide first
2. Review [ADD_NEW_ELEMENT_GUIDE.md](../../utils/ai-generation/ui-elements/ADD_NEW_ELEMENT_GUIDE.md) for element-related tasks
3. Check code comments in service files
4. Review Troubleshooting section above

**When reporting issues**:
- Include request body
- Include error message
- Include generation log ID (if available)
- Include token usage data
- Specify which step failed (Step 1 or Step 2)

---

**End of AI Generation Architecture Guide**
