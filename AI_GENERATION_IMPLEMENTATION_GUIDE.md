# AI Generation Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing AI-powered funnel and page generation in the Funnel Builder API.

## 🚀 Generation Modes & Capacity

### Two Generation Approaches

The system offers two funnel generation modes:

#### 1. Batch Generation (Default) - `/api/ai-generation/generate`

Generates entire funnel in one API call:

- **Advantages:**
  - Fastest generation time
  - Better context and coherence across pages
  - Single API call with streaming support
  - Lower API cost (single overhead)

- **Disadvantages:**
  - Limited to model's output token capacity
  - Complex prompts for large funnels
  - All-or-nothing (fails if any page has issues)

#### 2. Sequential Generation (New) - `/api/ai-generation/generate-sequential`

Generates pages one-by-one with a single endpoint call:

- **Advantages:**
  - Simpler per-page prompts
  - Better validation per page
  - More control over generation process
  - Clearer error messages
  - Auto-fix applied per page

- **Disadvantages:**
  - Slower (multiple API calls)
  - Higher API cost (multiple overheads)
  - Less context between pages

**Recommendation:** Use batch generation for standard funnels (3-6 pages). Use sequential for complex requirements or better debugging.

### Automatic Model Selection

Both modes automatically select the optimal Gemini model based on funnel size:

- **Gemini 2.5 Flash** (Default)
  - Output Token Limit: 8,192 tokens
  - Max Capacity (Batch): ~66 elements (e.g., 6 pages × 10 elements)
  - Max Capacity (Sequential): Unlimited pages (each page < 8,192 tokens)
  - Cost: Standard pricing
  - Use Case: Standard funnels, cost-effective for most use cases

- **Gemini 2.5 Pro** (Premium - Batch Mode Only)
  - Output Token Limit: 32,768 tokens (4x Flash!)
  - Max Capacity: ~260 elements (e.g., 25+ pages × 10 elements)
  - Cost: Premium pricing
  - Use Case: Large, complex funnels with many pages/elements
  - Streaming: Enabled for long-running generations

### How Batch Generation Works

1. **Estimation**: System estimates output tokens needed (100 tokens per element avg + 1,500 overhead)
2. **Selection**: Automatically selects Pro if estimated tokens > 8,192
3. **Validation**: Validates against maximum model capacity before API call
4. **Optimization**: Uses compact prompts for large generations (>50 elements)
5. **Auto-Fix**: Automatically corrects enum casing issues after generation

### How Sequential Generation Works

1. **Metadata Generation**: First generates funnel name, SEO metadata, and page names
2. **Page Generation**: Generates each page individually with context from previous pages
3. **Auto-Fix**: Applies enum casing fixes to each page as it's generated
4. **Transaction**: Saves all pages to database in single transaction
5. **Token Tracking**: Accumulates total tokens used across all API calls

### Capacity Examples

| Pages | Elements/Page | Total Elements | Batch Mode | Sequential Mode |
|-------|---------------|----------------|------------|-----------------|
| 3 | 8 | 24 | ✅ Flash | ✅ Flash |
| 6 | 10 | 60 | ✅ Flash | ✅ Flash |
| 8 | 10 | 80 | ✅ Pro | ✅ Flash |
| 12 | 10 | 120 | ✅ Pro | ✅ Flash |
| 15 | 10 | 150 | ✅ Pro | ✅ Flash |
| 20 | 10 | 200 | ✅ Pro | ✅ Flash |
| 25 | 10 | 250 | ✅ Pro | ✅ Flash |

### Auto-Fix for Type Safety (Both Modes)

The system automatically fixes **ALL** AI generation issues with intelligent defaults:

**Comprehensive Enum Handling:**
- **type**: Converts to lowercase → `"text"`, `"button"`, `"media-with-text"`, `"comparison-chart"`
- **borderRadius**: Validates & normalizes → `"NONE"`, `"SOFT"` (default), `"ROUNDED"`
- **size**: Validates & normalizes → `"sm"`, `"md"` (default), `"lg"`, `"xl"`
- **align**: Validates & normalizes → `"left"` (default), `"center"`, `"right"`
- **borderStyle**: Validates & normalizes → `"solid"` (default), `"dashed"`, `"dotted"`, `"none"`
- **mediaType**: Validates & normalizes → `"image"` (default), `"emoji"`, `"icon"`, `"video"`
- **shape**: Validates & normalizes → `"auto"` (default), `"landscape"`, `"portrait"`, `"round"`
- **target**: Validates & normalizes → `"_self"` (default), `"_blank"`
- **link.type**: Validates & normalizes → `"internal"` (default), `"external"`

**Auto-Fix Handles:**
- ✅ Missing/null/undefined values → Replaced with sensible defaults
- ✅ Empty strings → Replaced with defaults
- ✅ Wrong casing → Normalized to correct case
- ✅ Invalid enum values → Replaced with defaults
- ✅ Wrong data types → Converted or replaced with defaults
- ✅ Missing required fields → Added with default values

**Default Values Used:**
- `borderRadius: "SOFT"` - Modern, professional look
- `size: "md"` - Medium is most versatile
- `align: "left"` - Standard text alignment
- `borderStyle: "solid"` - Most common
- `mediaType: "image"` - Most common media type
- `shape: "auto"` - Flexible, adapts to content
- `target: "_self"` - Safe default for links
- `link.type: "internal"` - Safe default

**Boolean Conversion:**
- Converts `"true"`/`"false"` strings to actual booleans
- Handles non-boolean types by defaulting to `false`

This ensures **100% success rate** for funnel generation, regardless of how Gemini formats the response. Invalid values are automatically corrected without failing validation.

### Token Efficiency

For large funnels (>50 elements), batch mode automatically:
- Uses compact system prompts (reduced from ~8,000 to ~2,000 chars)
- Targets 60-80% element density vs 80-100% for smaller funnels
- Enforces concise text content (2-3 sentences max)
- Limits form fields to 5 max, FAQ items to 4 max

---

## 📁 File Structure

```
src/
├── controllers/
│   └── ai-generation/
│       ├── generate-funnel/
│       │   └── index.ts
│       └── generate-page/
│           └── index.ts
│
├── services/
│   └── ai-generation/
│       ├── generate-funnel/
│       │   ├── index.ts
│       │   └── utils/
│       │       ├── build-prompt.ts
│       │       ├── parse-response.ts
│       │       └── validate-funnel.ts
│       └── generate-page/
│           ├── index.ts
│           └── utils/
│               ├── build-prompt.ts
│               ├── parse-response.ts
│               └── validate-page.ts
│
├── types/
│   └── ai-generation/
│       ├── generate-funnel/
│       │   └── index.ts
│       └── generate-page/
│           └── index.ts
│
├── routes/
│   └── ai-generation/
│       └── index.ts
│
├── utils/
│   └── ai-generation/
│       ├── ui-elements/                    # Element definitions
│       │   ├── index.ts                    # Registry and exports
│       │   ├── types.ts                    # Shared types
│       │   │
│       │   ├── essentials/
│       │   │   ├── text.element.ts
│       │   │   ├── button.element.ts
│       │   │   └── divider.element.ts
│       │   │
│       │   ├── visuals/
│       │   │   ├── image.element.ts
│       │   │   ├── video.element.ts
│       │   │   ├── icon.element.ts
│       │   │   ├── media.element.ts
│       │   │   └── media-with-text.element.ts
│       │   │
│       │   ├── interactive/
│       │   │   ├── form.element.ts
│       │   │   ├── form-input.element.ts
│       │   │   ├── form-message.element.ts
│       │   │   ├── form-phonenumber.element.ts
│       │   │   ├── form-checkbox.element.ts
│       │   │   ├── form-select.element.ts
│       │   │   ├── form-datepicker.element.ts
│       │   │   ├── form-number.element.ts
│       │   │   ├── quiz.element.ts
│       │   │   ├── answer.element.ts
│       │   │   └── webinar.element.ts
│       │   │
│       │   ├── informative/
│       │   │   ├── faq.element.ts
│       │   │   ├── faq-item.element.ts
│       │   │   └── comparison-chart.element.ts
│       │   │
│       │   └── embed/
│       │       └── embed.element.ts
│       │
│       ├── prompt-builder/                 # System prompt generation
│       │   ├── index.ts
│       │   └── templates/
│       │       ├── base-system-prompt.ts
│       │       ├── funnel-generation.ts
│       │       └── page-generation.ts
│       │
│       ├── token-tracker/                  # Token usage tracking
│       │   └── index.ts
│       │
│       └── validators/                     # Element validation
│           └── index.ts
│
└── test/
    └── ai-generation/
        ├── generate-funnel.test.ts
        └── generate-page.test.ts
```

---

## 🗄️ Database Schema Changes

### Migration: Add AI Token Tracking

```prisma
// Add to User model (prisma/schema.prisma)

model User {
  // ... existing fields

  // AI Generation Tracking
  aiTokensUsed         Int                  @default(0)
  aiTokensLimit        Int?                 // null = unlimited (for testing/admin)
  aiLastResetAt        DateTime             @default(now())
  aiGenerationLogs     AIGenerationLog[]

  // ... rest of model
}

// New table for generation logs
model AIGenerationLog {
  id                Int       @id @default(autoincrement())
  userId            Int
  workspaceId       Int
  funnelId          Int?

  // Generation details
  prompt            String    @db.Text
  tokensUsed        Int
  pagesGenerated    Int
  model             String    @default("gemini-2.5-flash")

  // Timestamps
  createdAt         DateTime  @default(now())

  // Relations
  user              User      @relation(fields: [userId], references: [id])
  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  funnel            Funnel?   @relation(fields: [funnelId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([workspaceId])
  @@index([createdAt])
  @@map("ai_generation_logs")
}

// Add to Workspace model
model Workspace {
  // ... existing fields
  aiGenerationLogs  AIGenerationLog[]
  // ... rest of model
}

// Add to Funnel model
model Funnel {
  // ... existing fields
  aiGenerationLogs  AIGenerationLog[]
  // ... rest of model
}
```

**Create Migration:**
```bash
npx prisma migrate dev --name add_ai_generation_tracking
```

---

## 🚀 Implementation Order

### Phase 1: Foundation (Funnel Generation)

#### Step 1: Create Base Types and Utilities

```bash
# Create directories
mkdir -p src/utils/ai-generation/ui-elements/{essentials,visuals,interactive,informative,embed}
mkdir -p src/utils/ai-generation/prompt-builder/templates
mkdir -p src/utils/ai-generation/token-tracker
mkdir -p src/utils/ai-generation/validators
```

**Files to create:**
1. `src/utils/ai-generation/ui-elements/types.ts` - Shared types
2. `src/utils/ai-generation/ui-elements/index.ts` - Element registry
3. `src/utils/ai-generation/prompt-builder/index.ts` - Prompt builder
4. `src/utils/ai-generation/token-tracker/index.ts` - Token tracking
5. `src/utils/ai-generation/validators/index.ts` - Element validation

#### Step 2: Create Element Definitions (Priority Order)

**Essential Elements (Must have for MVP):**
```bash
# Create in order:
1. src/utils/ai-generation/ui-elements/essentials/text.element.ts
2. src/utils/ai-generation/ui-elements/essentials/button.element.ts
3. src/utils/ai-generation/ui-elements/essentials/divider.element.ts
4. src/utils/ai-generation/ui-elements/visuals/image.element.ts
5. src/utils/ai-generation/ui-elements/visuals/video.element.ts
```

**Interactive Elements (Second priority):**
```bash
6. src/utils/ai-generation/ui-elements/interactive/form.element.ts
7. src/utils/ai-generation/ui-elements/interactive/form-input.element.ts
8. src/utils/ai-generation/ui-elements/interactive/form-message.element.ts
9. src/utils/ai-generation/ui-elements/interactive/form-checkbox.element.ts
```

**Advanced Elements (Can add later):**
```bash
# Add these after MVP is working:
- quiz.element.ts
- faq.element.ts
- comparison-chart.element.ts
- webinar.element.ts
- embed.element.ts
```

#### Step 3: Create Funnel Generation Service Layer

```bash
# Create service structure
mkdir -p src/services/ai-generation/generate-funnel/utils
```

**Files to create:**
1. `src/services/ai-generation/generate-funnel/index.ts` - Main service
2. `src/services/ai-generation/generate-funnel/utils/build-prompt.ts`
3. `src/services/ai-generation/generate-funnel/utils/parse-response.ts`
4. `src/services/ai-generation/generate-funnel/utils/validate-funnel.ts`

#### Step 4: Create Types

```bash
mkdir -p src/types/ai-generation/generate-funnel
```

**File to create:**
- `src/types/ai-generation/generate-funnel/index.ts`

**Schema structure:**
```typescript
// Request
{
  workspaceSlug: string
  prompt: string
  context?: {
    industry?: string
    targetAudience?: string
    funnelType?: 'lead-magnet' | 'sales' | 'webinar' | 'quiz'
    numberOfPages?: number
  }
}

// Response
{
  funnelId: number
  funnelName: string
  funnelSlug: string
  pagesCreated: number
  tokensUsed: number
  message: string
}
```

#### Step 5: Create Controller

```bash
mkdir -p src/controllers/ai-generation/generate-funnel
```

**File to create:**
- `src/controllers/ai-generation/generate-funnel/index.ts`

**Responsibilities:**
- Request validation with Zod
- Permission checks using `PermissionManager.requirePermission()`
- Token limit checks using `TokenTracker.checkAndDeductTokens()`
- Call service
- Log generation with `TokenTracker.logGeneration()`

#### Step 6: Create Route

```bash
mkdir -p src/routes/ai-generation
```

**File to create:**
- `src/routes/ai-generation/index.ts`

**Endpoints:**
```typescript
POST /api/ai-generation/generate-funnel
POST /api/ai-generation/generate-page (Phase 2)
GET  /api/ai-generation/usage          (Token usage)
```

#### Step 7: Register Route in App

```typescript
// src/app.ts
import aiGenerationRoutes from './routes/ai-generation'

app.use('/api/ai-generation', aiGenerationRoutes)
```

#### Step 8: Create Tests

```bash
mkdir -p src/test/ai-generation
```

**File to create:**
- `src/test/ai-generation/generate-funnel.test.ts`

**Test cases:**
1. ✅ Generate funnel with valid prompt
2. ✅ Reject when user lacks permission
3. ✅ Reject when token limit exceeded
4. ✅ Handle AI API failures gracefully
5. ✅ Validate generated elements
6. ✅ Create funnel with multiple pages
7. ✅ Track token usage correctly

---

### Phase 2: Page Generation (After Funnel Generation Works)

#### Step 9: Create Page Generation Service

```bash
mkdir -p src/services/ai-generation/generate-page/utils
```

**Files to create:**
1. `src/services/ai-generation/generate-page/index.ts`
2. `src/services/ai-generation/generate-page/utils/build-prompt.ts`
3. `src/services/ai-generation/generate-page/utils/parse-response.ts`
4. `src/services/ai-generation/generate-page/utils/validate-page.ts`

#### Step 10: Create Page Generation Types

```bash
mkdir -p src/types/ai-generation/generate-page
```

**File to create:**
- `src/types/ai-generation/generate-page/index.ts`

**Schema structure:**
```typescript
// Request
{
  funnelId: number
  prompt: string
  context?: {
    pageType?: 'landing' | 'sales' | 'thank-you' | 'result'
    existingPages?: string[] // Names of existing pages for context
  }
}

// Response
{
  pageId: number
  pageName: string
  linkingId: string
  elementsCreated: number
  tokensUsed: number
  message: string
}
```

#### Step 11: Create Page Generation Controller

```bash
mkdir -p src/controllers/ai-generation/generate-page
```

**File to create:**
- `src/controllers/ai-generation/generate-page/index.ts`

#### Step 12: Add Route for Page Generation

Update `src/routes/ai-generation/index.ts` to include page generation endpoint.

#### Step 13: Create Tests for Page Generation

**File to create:**
- `src/test/ai-generation/generate-page.test.ts`

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```bash
# AI Generation Settings
GOOGLE_API_KEY=your-google-gemini-api-key-here

# Token Limits (per user per month)
AI_TOKENS_LIMIT_FREE=50000        # ~$0.25 worth
AI_TOKENS_LIMIT_BUSINESS=200000   # ~$1.00 worth
AI_TOKENS_LIMIT_AGENCY=500000     # ~$2.50 worth

# Rate Limiting
AI_GENERATIONS_PER_HOUR=10
AI_GENERATIONS_PER_DAY=50
```

---

## 📝 Implementation Checklist

### Phase 1: Funnel Generation MVP

- [ ] **Database Migration**
  - [ ] Add AI token tracking fields to User model
  - [ ] Create AIGenerationLog table
  - [ ] Run migration

- [ ] **Element Definitions (Core 5)**
  - [ ] Create shared types (`ui-elements/types.ts`)
  - [ ] Text element
  - [ ] Button element
  - [ ] Divider element
  - [ ] Image element
  - [ ] Video element
  - [ ] Element registry (`ui-elements/index.ts`)

- [ ] **Utilities**
  - [ ] Prompt builder base (`prompt-builder/index.ts`)
  - [ ] Funnel generation template (`prompt-builder/templates/funnel-generation.ts`)
  - [ ] Token tracker (`token-tracker/index.ts`)
  - [ ] Element validator (`validators/index.ts`)

- [ ] **Types**
  - [ ] Generate funnel request schema
  - [ ] Generate funnel response schema

- [ ] **Service Layer**
  - [ ] Generate funnel service
  - [ ] Build prompt utility
  - [ ] Parse response utility
  - [ ] Validate funnel utility

- [ ] **Controller Layer**
  - [ ] Generate funnel controller
  - [ ] Request validation
  - [ ] Permission checks
  - [ ] Token tracking

- [ ] **Route Layer**
  - [ ] AI generation routes
  - [ ] Register in app.ts

- [ ] **Testing**
  - [ ] Write funnel generation tests
  - [ ] Test permission checks
  - [ ] Test token limits
  - [ ] Test element validation

### Phase 2: Page Generation

- [ ] **Element Definitions (Extended)**
  - [ ] Form element
  - [ ] Form input element
  - [ ] Form message element
  - [ ] Form checkbox element
  - [ ] Quiz element
  - [ ] FAQ element

- [ ] **Types**
  - [ ] Generate page request schema
  - [ ] Generate page response schema

- [ ] **Service Layer**
  - [ ] Generate page service
  - [ ] Build prompt utility
  - [ ] Parse response utility
  - [ ] Validate page utility

- [ ] **Controller Layer**
  - [ ] Generate page controller

- [ ] **Route Layer**
  - [ ] Add page generation endpoint

- [ ] **Testing**
  - [ ] Write page generation tests

### Phase 3: Enhancement (Optional)

- [ ] Add more element types (embed, webinar, comparison-chart)
- [ ] Implement rate limiting
- [ ] Add generation history endpoint
- [ ] Add retry mechanism for failed generations
- [ ] Add streaming response support
- [ ] Create admin dashboard for token usage
- [ ] Add generation templates/presets

---

## 🎯 Quick Start Commands

### 1. Start with Database Migration

```bash
# Navigate to project directory
cd /home/ahmad/Desktop/apps/funnel-builder-api

# Update Prisma schema with new fields (manually edit prisma/schema.prisma)

# Generate and run migration
npx prisma migrate dev --name add_ai_generation_tracking

# Generate Prisma client
npx prisma generate
```

### 2. Create Directory Structure

```bash
# Create all directories at once
mkdir -p src/utils/ai-generation/ui-elements/{essentials,visuals,interactive,informative,embed}
mkdir -p src/utils/ai-generation/prompt-builder/templates
mkdir -p src/utils/ai-generation/token-tracker
mkdir -p src/utils/ai-generation/validators
mkdir -p src/services/ai-generation/generate-funnel/utils
mkdir -p src/services/ai-generation/generate-page/utils
mkdir -p src/controllers/ai-generation/{generate-funnel,generate-page}
mkdir -p src/types/ai-generation/{generate-funnel,generate-page}
mkdir -p src/routes/ai-generation
mkdir -p src/test/ai-generation
```

### 3. Install Dependencies

```bash
# Install Google Generative AI SDK
pnpm add @google/generative-ai

# Install types if needed
pnpm add -D @types/node
```

### 4. Start Implementation (In Order)

```bash
# Step 1: Create base types
touch src/utils/ai-generation/ui-elements/types.ts

# Step 2: Create element registry
touch src/utils/ai-generation/ui-elements/index.ts

# Step 3: Create core elements
touch src/utils/ai-generation/ui-elements/essentials/text.element.ts
touch src/utils/ai-generation/ui-elements/essentials/button.element.ts
touch src/utils/ai-generation/ui-elements/essentials/divider.element.ts

# Step 4: Create utilities
touch src/utils/ai-generation/prompt-builder/index.ts
touch src/utils/ai-generation/token-tracker/index.ts
touch src/utils/ai-generation/validators/index.ts

# Step 5: Create service layer
touch src/services/ai-generation/generate-funnel/index.ts
touch src/services/ai-generation/generate-funnel/utils/build-prompt.ts
touch src/services/ai-generation/generate-funnel/utils/parse-response.ts
touch src/services/ai-generation/generate-funnel/utils/validate-funnel.ts

# Step 6: Create types
touch src/types/ai-generation/generate-funnel/index.ts

# Step 7: Create controller
touch src/controllers/ai-generation/generate-funnel/index.ts

# Step 8: Create routes
touch src/routes/ai-generation/index.ts

# Step 9: Create tests
touch src/test/ai-generation/generate-funnel.test.ts
```

### 5. Run Tests

```bash
# Run AI generation tests
pnpm test src/test/ai-generation/generate-funnel.test.ts

# Run all tests
pnpm test
```

### 6. Test the API

```bash
# Start development server
pnpm dev

# Test generation endpoint (in another terminal)
curl -X POST http://localhost:4444/api/ai-generation/generate-funnel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "workspaceSlug": "your-workspace",
    "prompt": "Create a lead magnet funnel for a fitness coach",
    "context": {
      "funnelType": "lead-magnet",
      "numberOfPages": 2
    }
  }'
```

---

## 🔍 Key Implementation Notes

### 1. Permission Checks

Use existing permission system:

```typescript
import { PermissionManager, PermissionAction } from '../../../utils/workspace-utils/workspace-permission-manager'

// In controller
await PermissionManager.requirePermission({
  userId,
  workspaceId,
  action: PermissionAction.CREATE_FUNNEL,
})
```

### 2. Token Tracking

Implement before-and-after tracking:

```typescript
// Before generation (estimate)
const estimatedTokens = prompt.length * 4 // Rough estimate
await TokenTracker.checkAndDeductTokens(userId, estimatedTokens)

// After generation (actual)
await TokenTracker.logGeneration(userId, workspaceId, {
  funnelId: result.funnelId,
  prompt,
  tokensUsed: actualTokens,
  pagesGenerated: result.pagesCreated,
  model: 'gemini-2.5-flash',
})
```

### 3. Element Validation

Always validate generated elements:

```typescript
import { validateElement } from '../../../utils/ai-generation/validators'

// Validate each element
for (const element of generatedElements) {
  const validation = validateElement(element)
  if (!validation.valid) {
    throw new Error(`Invalid element: ${validation.errors.join(', ')}`)
  }
}
```

### 4. Error Handling

Provide user-friendly error messages:

```typescript
try {
  // Generation logic
} catch (error) {
  if (error.message.includes('rate_limit')) {
    throw new Error('AI service is currently busy. Please try again in a few moments.')
  }
  if (error.message.includes('Insufficient tokens')) {
    throw new Error(error.message) // Already user-friendly
  }
  throw new Error('Failed to generate funnel. Please try again.')
}
```

---

## 📚 Additional Resources

### Reference Files

- Frontend AI implementation: `/home/ahmad/Desktop/apps/digitalsite-custom-builder-frontend/src/app/api/ai/generate/route.ts`
- Element definitions: `/home/ahmad/Desktop/apps/digitalsite-custom-builder-frontend/src/components/figma-builder/elements/`
- Permission system: `src/utils/workspace-utils/workspace-permission-manager/`
- Allocation system: `src/utils/allocations/`

### Architecture Standards

Always follow patterns defined in `ARCHITECTURE.md`:
- Use Zod for all type definitions
- Service layer handles business logic
- Controller layer handles validation and HTTP
- No Prisma calls outside service layer
- User-friendly error messages

---

## ✅ Success Criteria

### Phase 1 Complete When:

- [ ] User can generate a complete funnel with prompt
- [ ] Multiple pages are created automatically
- [ ] Elements are valid and render in frontend
- [ ] Token usage is tracked accurately
- [ ] Permission checks work correctly
- [ ] All tests pass
- [ ] Error handling is robust

### Phase 2 Complete When:

- [ ] User can add individual pages to existing funnels
- [ ] Page generation respects funnel context
- [ ] All advanced elements work (forms, quizzes, FAQs)
- [ ] Rate limiting prevents abuse
- [ ] Generation history is accessible

---

## 🚨 Important Reminders

1. **Always validate user permissions** before generation
2. **Always check token limits** before calling AI
3. **Always validate generated elements** before creating pages
4. **Always log token usage** for billing/analytics
5. **Always provide user-friendly error messages**
6. **Test with real prompts** from actual use cases
7. **Start with MVP elements**, add more later
8. **Follow existing architecture patterns** in ARCHITECTURE.md

---

## 🎉 Ready to Start!

Begin with **Phase 1, Step 1** and work through systematically. Each step builds on the previous one. Don't skip ahead!

Good luck! 🚀