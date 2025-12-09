# Duplicate Funnel Service Guide

This document explains the complete flow of the `duplicateFunnel` function, including all validations, data transformations, and the serverId replacement mechanism.

## Overview

The duplicate funnel service creates an independent copy of an existing funnel. It can duplicate to the same workspace or a different workspace (cross-workspace duplication). The duplicated funnel has completely isolated analytics - forms and insights are duplicated with new IDs.

## Function Signature

```typescript
duplicateFunnel(
  userId: number,
  params: { workspaceSlug: string; funnelSlug: string },
  data: DuplicateFunnelRequest
): Promise<{
  response: DuplicateFunnelResponse;
  workspaceId: number;
  workspaceSlug: string;
  funnelSlug: string;
}>
```

## Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DUPLICATE FUNNEL FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. FETCH ORIGINAL FUNNEL                                       │
│     └── Include: pages, activeTheme, settings, insights         │
│                                                                 │
│  2. DETERMINE TARGET WORKSPACE                                  │
│     └── Same workspace OR different workspace (from body)       │
│                                                                 │
│  3. PERMISSION CHECKS                                           │
│     ├── VIEW_FUNNEL on source workspace                         │
│     └── CREATE_FUNNEL on target workspace (if different)        │
│                                                                 │
│  4. ALLOCATION CHECK                                            │
│     └── Verify target workspace has funnel slots available      │
│                                                                 │
│  5. GENERATE UNIQUE NAME & SLUG                                 │
│     ├── Name: "Original Name - copy" (or - copy 2, etc.)        │
│     └── Slug: generated from name, unique in workspace          │
│                                                                 │
│  6. FETCH FORMS (separate query - no Prisma relation)           │
│                                                                 │
│  7. DATABASE TRANSACTION                                        │
│     ├── Create new Theme (copy of original)                     │
│     ├── Create new Funnel (status: DRAFT)                       │
│     ├── Link Theme to Funnel                                    │
│     ├── Duplicate Settings (exclude tracking IDs)               │
│     ├── Duplicate Forms → Build formIdMap                       │
│     ├── Duplicate Insights → Build insightIdMap                 │
│     └── Duplicate Pages (with serverId replacement)             │
│                                                                 │
│  8. CACHE INVALIDATION                                          │
│     └── Clear target workspace funnel caches                    │
│                                                                 │
│  9. RETURN RESPONSE                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Steps

### Step 1: Fetch Original Funnel

```typescript
const originalFunnel = await prisma.funnel.findFirst({
  where: {
    slug: params.funnelSlug,
    workspace: { slug: params.workspaceSlug },
  },
  include: {
    pages: { orderBy: { order: "asc" } },
    activeTheme: true,
    settings: true,
    insights: true,
    workspace: { select: { id: true, slug: true } },
  },
});
```

**Includes:**

- `pages` - All pages ordered by their position
- `activeTheme` - Current theme configuration
- `settings` - SEO, tracking, localization settings
- `insights` - Quiz/choice components for analytics
- `workspace` - Source workspace info

### Step 2: Determine Target Workspace

```typescript
let targetWorkspaceId = originalFunnel.workspaceId;

if (data.workspaceSlug) {
  const targetWorkspaceBySlug = await validateTargetWorkspace(
    prisma,
    data.workspaceSlug
  );
  if (targetWorkspaceBySlug) {
    targetWorkspaceId = targetWorkspaceBySlug.id;
  }
}
```

- If `workspaceSlug` is provided in request body → duplicate to that workspace
- If not provided → duplicate to same workspace

### Step 3: Permission Checks

```typescript
// Always check: can user view the original funnel?
await PermissionManager.requirePermission({
  userId,
  workspaceId: originalFunnel.workspaceId,
  action: PermissionAction.VIEW_FUNNEL,
});

// If cross-workspace: can user create funnel in target?
if (targetWorkspaceId !== originalFunnel.workspaceId) {
  await PermissionManager.requirePermission({
    userId,
    workspaceId: targetWorkspaceId,
    action: PermissionAction.CREATE_FUNNEL,
  });
}
```

### Step 4: Allocation Check

```typescript
const canCreateFunnel = WorkspaceFunnelAllocations.canCreateFunnel(
  currentFunnelCount,
  {
    workspacePlanType: workspace.owner.plan,
    addOns: workspace.owner.addOns,
  }
);
```

Checks if target workspace has available funnel slots based on:

- Owner's subscription plan (FREE, PRO, BUSINESS, etc.)
- Any add-on funnel slots purchased

### Step 5: Generate Unique Name & Slug

**Name Generation:**

- First copy: `"Original Name - copy"`
- Second copy: `"Original Name - copy 2"`
- Third copy: `"Original Name - copy 3"`
- etc.

**Slug Generation:**

- Generated from the final name
- Ensured unique within target workspace
- If slug exists, appends `-1`, `-2`, etc.

### Step 6: Fetch Forms

```typescript
const originalForms = await prisma.form.findMany({
  where: { funnelId: originalFunnel.id },
});
```

Forms are fetched separately because there's no direct Prisma relation defined between Funnel and Form models.

### Step 7: Database Transaction

All database operations are wrapped in a transaction for atomicity.

#### 7.1 Create Theme

```typescript
const newTheme = await tx.theme.create({
  data: {
    name: originalFunnel.activeTheme?.name,
    backgroundColor: originalFunnel.activeTheme?.backgroundColor,
    // ... all theme properties copied
    type: $Enums.ThemeType.CUSTOM,
    funnelId: null, // Set after funnel creation
  },
});
```

#### 7.2 Create Funnel

```typescript
const newFunnel = await tx.funnel.create({
  data: {
    name: finalFunnelName,
    slug: uniqueSlug,
    status: $Enums.FunnelStatus.DRAFT, // Always DRAFT
    workspaceId: targetWorkspaceId,
    createdBy: userId, // User who duplicated, not original creator
    activeThemeId: newTheme.id,
  },
});
```

**Important:** Status is always set to `DRAFT` regardless of original status.

#### 7.3 Duplicate Settings

```typescript
await tx.funnelSettings.create({
  data: {
    funnelId: newFunnel.id,
    defaultSeoTitle: originalFunnel.settings.defaultSeoTitle,
    // ... most settings copied
    googleAnalyticsId: null, // NOT copied
    facebookPixelId: null, // NOT copied
  },
});
```

**Excluded from copy:**

- `googleAnalyticsId` - Tracking should be unique per funnel
- `facebookPixelId` - Pixel should be unique per funnel

#### 7.4 Duplicate Forms

```typescript
const formIdMap = new Map<number, number>();
for (const form of originalForms) {
  const newForm = await tx.form.create({
    data: {
      name: form.name,
      description: form.description,
      formContent: form.formContent,
      isActive: form.isActive,
      funnelId: newFunnel.id,
      webhookUrl: null, // NOT copied
      webhookEnabled: false, // NOT copied
      webhookHeaders: {}, // NOT copied
      webhookSecret: null, // NOT copied
    },
  });
  formIdMap.set(form.id, newForm.id);
}
```

**Excluded from copy:**

- Webhook configuration (URL, headers, secret)
- Webhook statistics

**Result:** `formIdMap` maps old form IDs to new form IDs:

```
{ 1 → 5, 2 → 6 }
```

#### 7.5 Duplicate Insights

```typescript
const insightIdMap = new Map<number, number>();
for (const insight of originalFunnel.insights) {
  const newInsight = await tx.insight.create({
    data: {
      type: insight.type, // QUIZ, SINGLE_CHOICE, MULTIPLE_CHOICE
      name: insight.name,
      description: insight.description,
      content: insight.content, // Questions/answers structure
      settings: insight.settings,
      funnelId: newFunnel.id,
    },
  });
  insightIdMap.set(insight.id, newInsight.id);
}
```

**Result:** `insightIdMap` maps old insight IDs to new insight IDs:

```
{ 1 → 10, 2 → 11, 3 → 12 }
```

#### 7.6 Duplicate Pages with ServerId Replacement

```typescript
const serverIdMap: ServerIdMap = {
  forms: formIdMap,
  insights: insightIdMap,
};

for (const originalPage of originalFunnel.pages) {
  // Replace server IDs for forms/insights to ensure independent analytics
  const updatedContent = replaceServerIdsInContent(
    originalPage.content,
    serverIdMap
  );

  await tx.page.create({
    data: {
      name: originalPage.name,
      content: updatedContent,
      order: originalPage.order,
      type: originalPage.type,
      funnelId: newFunnel.id,
      linkingId: originalPage.linkingId, // Keep original linkingId
      seoTitle: originalPage.seoTitle,
      seoDescription: originalPage.seoDescription,
      seoKeywords: originalPage.seoKeywords,
    },
  });
}
```

**Note on linkingIds:** LinkingIds are kept the same as the original because they only need to be unique within a single funnel. Since the duplicated funnel is a separate entity, having the same linkingIds doesn't cause any conflicts.

### Step 8: Cache Invalidation

```typescript
await cacheService.del(`workspace:${targetWorkspaceId}:funnels:all`);
await cacheService.del(`workspace:${targetWorkspaceId}:funnels:list`);
await cacheService.del(
  `user:${userId}:workspace:${targetWorkspaceId}:funnels`
);
```

Clears cached funnel lists so the new funnel appears immediately.

---

## Server ID Replacement (Deep Dive)

### The Problem

Page content contains interactive elements (forms, quizzes, choice components) that reference database records via `serverId`:

```json
{
  "id": "element-123",
  "type": "form",
  "serverId": 1,
  "children": [...]
}
```

If we copy content as-is, both funnels would share the same Form/Insight records, causing:

- Mixed analytics data
- Form submissions going to both funnels
- Quiz results being shared

### The Solution

Create new Form/Insight records and update `serverId` references in the content.

### Element Types

| Element Type      | Database Table                  | Example serverId |
| ----------------- | ------------------------------- | ---------------- |
| `form`            | Form                            | `"serverId": 1`  |
| `quiz`            | Insight (type: QUIZ)            | `"serverId": 2`  |
| `single-choice`   | Insight (type: SINGLE_CHOICE)   | `"serverId": 3`  |
| `multiple-choice` | Insight (type: MULTIPLE_CHOICE) | `"serverId": 4`  |

### Replacement Utility

Located at: `src/utils/funnel-utils/server-id-replacement/index.ts`

```typescript
interface ServerIdMap {
  forms: Map<number, number>; // oldFormId → newFormId
  insights: Map<number, number>; // oldInsightId → newInsightId
}

function replaceServerIdsInContent(
  content: string | null,
  serverIdMap: ServerIdMap
): string | null;
```

### How It Works

1. **Parse** the JSON content string into an array of elements
2. **Traverse** the element tree recursively
3. **Check** each element for `serverId` and `type` fields
4. **Replace** based on element type:
   - `form` → look up in `serverIdMap.forms`
   - `quiz`, `single-choice`, `multiple-choice` → look up in `serverIdMap.insights`
5. **Stringify** and return the updated content

### Example Transformation

**Before (Original Content):**

```json
[
  {
    "id": "element-1",
    "type": "form",
    "serverId": 1,
    "children": [...]
  },
  {
    "id": "element-2",
    "type": "quiz",
    "serverId": 2,
    "children": [...]
  }
]
```

**Server ID Maps:**

```
formIdMap: { 1 → 5 }
insightIdMap: { 2 → 10 }
```

**After (Duplicated Content):**

```json
[
  {
    "id": "element-1",
    "type": "form",
    "serverId": 5,
    "children": [...]
  },
  {
    "id": "element-2",
    "type": "quiz",
    "serverId": 10,
    "children": [...]
  }
]
```

---

## What Gets Duplicated vs. What Doesn't

### ✅ Duplicated

| Item              | Notes                               |
| ----------------- | ----------------------------------- |
| Funnel basic info | Name (with " - copy"), new slug     |
| Theme             | Full copy as new CUSTOM theme       |
| Pages             | All pages with order preserved      |
| Page content      | With serverId replacements          |
| Page linkingIds   | Kept the same (unique within funnel)|
| Page SEO          | Title, description, keywords        |
| Funnel Settings   | Most settings (see exceptions)      |
| Forms             | New records with content/structure  |
| Insights          | New records (quizzes, choices)      |

### ❌ NOT Duplicated

| Item                | Reason                                  |
| ------------------- | --------------------------------------- |
| `googleAnalyticsId` | Each funnel should have unique tracking |
| `facebookPixelId`   | Each funnel should have unique pixel    |
| Form webhooks       | User should configure new webhooks      |
| Domain connections  | Domains are funnel-specific             |
| Form submissions    | These belong to original funnel         |
| Insight submissions | These belong to original funnel         |
| Visit statistics    | Fresh funnel starts at 0                |
| Published status    | Always starts as DRAFT                  |

---

## Error Scenarios

| Error                             | Cause                                   |
| --------------------------------- | --------------------------------------- |
| "Funnel not found"                | Original funnel doesn't exist           |
| "Target workspace does not exist" | Invalid target workspace slug           |
| Permission denied                 | User lacks VIEW_FUNNEL or CREATE_FUNNEL |
| "You've reached the maximum..."   | Target workspace at funnel limit        |

---

## Related Files

- `src/services/funnel/duplicate/index.ts` - Main service
- `src/services/funnel/duplicate/utils/` - Helper functions
- `src/utils/funnel-utils/server-id-replacement/` - ServerId utilities
- `src/utils/allocations/workspace-funnel-allocations.ts` - Funnel limits
- `src/utils/workspace-utils/workspace-permission-manager/` - Permissions
