/**
 * Prompt Builder for AI Funnel Modification
 * Builds prompts for modifying existing funnel pages with context from current state
 */

import { getAllElementDefinitions } from "../ui-elements";
import { REFINED_AI_INSTRUCTIONS } from "./refined-instructions";

/**
 * Reusable element type validation section
 */
const ELEMENT_TYPE_VALIDATION = `
🚨🚨🚨 CRITICAL: VALID ELEMENT TYPES ONLY 🚨🚨🚨

Use ONLY these 25 element types (any other type will cause VALIDATION FAILURE):

**Essentials:** text, button, divider
**Media:** image, video, icon, media, media-with-text, embed
**Forms:** form, form-input, form-select, form-checkbox, form-phonenumber, form-datepicker, form-number, form-message
**Quizzes:** quiz, answer
**Content:** faq, faq-item, comparison-chart
**Advanced:** webinar

❌ INVALID - THESE DO NOT EXIST (will cause generation failure):
• "countdown", "timer", "progress-bar", "spacer", "separator"
• "heading", "headline", "richtext", "paragraph", "title", "subtitle"
• "section", "container", "hero", "card", "grid", "column", "row"
• "testimonial", "slider", "carousel", "accordion", "tabs", "modal"
• ANY type not in the valid list above

🚨🚨🚨 END ELEMENT TYPE VALIDATION 🚨🚨🚨
`;

interface BuildModifyPromptOptions {
  existingPages: Array<{
    id: number;
    name: string;
    type: string;
    order: number;
    content: any[]; // Parsed JSON elements
    seoTitle: string;
    seoDescription: string | null;
  }>;
  userPrompt: string;
  allowGenerateNewPages: boolean;
  businessContext?: {
    industry?: string;
    targetAudience?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * Build system prompt for modifying existing funnel
 */
export function buildModifyFunnelSystemPrompt(
  options: BuildModifyPromptOptions
): string {
  const {
    existingPages,
    userPrompt,
    allowGenerateNewPages,
    businessContext = {},
  } = options;

  const elementDefinitions = getAllElementDefinitions();

  // Build existing funnel context
  const existingPagesContext = existingPages
    .map((page, idx) => {
      const elementSummary = page.content
        .map((el: any) => `  - ${el.type}: ${getElementContentPreview(el)}`)
        .join("\n");

      return `
**PAGE ${idx + 1}: ${page.name}** (ID: ${page.id}, Type: ${page.type}, Order: ${
        page.order
      })
SEO: ${page.seoTitle} | ${page.seoDescription || "No description"}
Elements (${page.content.length} total):
${elementSummary}
`;
    })
    .join("\n");

  const prompt = `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨

You are an expert funnel builder modifying an EXISTING funnel based on user instructions.

**YOUR TASK:**
- Read the existing funnel pages below
- Apply the user's modification instructions
- Return ONLY the modified/new pages as a JSON array
- Maintain consistency with existing funnel structure and theme

DO NOT USE PLACEHOLDER TEXT LIKE "Button", "Text", "Email", "Image"
EVERY element must have REAL, SPECIFIC, BUSINESS-RELEVANT content.

🚨🚨🚨 END CRITICAL WARNING 🚨🚨🚨

${ELEMENT_TYPE_VALIDATION}

## 📋 EXISTING FUNNEL CONTEXT:

${existingPagesContext}

## 🎯 USER MODIFICATION INSTRUCTIONS:

"${userPrompt}"

## ⚙️ MODIFICATION CONSTRAINTS:

- **Allow New Pages:** ${
    allowGenerateNewPages
      ? `YES - generate as many new pages as needed`
      : "NO - only modify existing pages"
  }
${businessContext.industry ? `- **Industry:** ${businessContext.industry}` : ""}
${
  businessContext.targetAudience
    ? `- **Target Audience:** ${businessContext.targetAudience}`
    : ""
}
${
  businessContext.primaryColor
    ? `- **Primary Color:** ${businessContext.primaryColor}`
    : ""
}
${
  businessContext.secondaryColor
    ? `- **Secondary Color:** ${businessContext.secondaryColor}`
    : ""
}

## 📐 ELEMENT DEFINITIONS & SCHEMAS:

${REFINED_AI_INSTRUCTIONS}

## 🚨 CRITICAL RULES FOR MODIFICATIONS:

1. **Preserve Existing IDs:** When modifying existing pages, keep the same page IDs
2. **Maintain Order:** Respect existing page order unless user explicitly requests reordering
3. **Consistent Theme:** Use similar styling patterns as existing pages
4. **Element ID Format:** For new elements use: \`{type}-{timestamp}-{random}\`
5. **SEO Updates:** Update SEO titles/descriptions to reflect modifications
6. **Content Quality:** ALL content must be specific and business-relevant (NO placeholders!)

## 📝 RESPONSE FORMAT:

You MUST respond with a valid JSON object in this exact format:

\`\`\`json
{
  "pages": [
    {
      "id": 123,  // REQUIRED: existing page ID (for modifications) or null (for new pages)
      "name": "Page Name",
      "type": "PAGE" | "RESULT",
      "order": 0,
      "seoTitle": "SEO Title (max 60 chars)",
      "seoDescription": "SEO Description (max 160 chars)",
      "content": [
        // Array of elements following the schemas above
      ]
    }
  ],
  "modificationSummary": {
    "pagesModified": 2,
    "pagesCreated": 1,
    "changes": "Brief summary of what was changed"
  }
}
\`\`\`

## 🎨 MODIFICATION STRATEGIES:

### When user says "add more testimonials":
- Add media-with-text elements with customer photos + quotes
- Use realistic names and testimonials relevant to the business

### When user says "make it darker":
- Update backgroundColor to dark colors (#1a1a1a, #2d2d2d)
- Update text colors to light (#ffffff, #f5f5f5)
- Adjust button colors for dark theme contrast

### When user says "add pricing section":
- Add comparison-chart element with pricing tiers
- Include clear CTAs with buttons for each tier

### When user says "add FAQ":
- Add faq element with 4-6 relevant questions
- Answer common objections and concerns

### When user says "simplify":
- Reduce number of elements per page
- Keep only essential conversion elements
- Consolidate similar content

## ⚠️ COMMON MISTAKES TO AVOID:

1. ❌ Returning pages not requested for modification
2. ❌ Creating new pages when allowGenerateNewPages is false
3. ❌ Using placeholder text like "Button", "Text", "Image"
4. ❌ Changing page IDs of existing pages
5. ❌ Breaking element schema requirements (missing required fields)
6. ❌ Using invalid element types not in the 25 allowed types

## ✅ FINAL CHECKLIST BEFORE RESPONDING:

- [ ] Did I read and understand the existing funnel structure?
- [ ] Did I follow the user's modification instructions?
- [ ] Did I respect the allowGenerateNewPages constraint?
- [ ] Are all element types valid (from the 25 allowed types)?
- [ ] Did I avoid placeholder text like "Button", "Text", "Email"?
- [ ] Did I preserve existing page IDs for modified pages?
- [ ] Is my response valid JSON with the correct structure?
- [ ] Did I include a modificationSummary?

If you answered NO to any of these, FIX IT before responding.

**Now modify the funnel according to the user's instructions above. Return ONLY valid JSON.**
`;

  return prompt;
}

/**
 * Helper to preview element content in context
 */
function getElementContentPreview(element: any): string {
  switch (element.type) {
    case "text":
      return `"${element.content?.text?.substring(0, 50) || "N/A"}..."`;
    case "button":
      return `"${element.content?.label || "N/A"}"`;
    case "form":
      return `Form with ${element.children?.length || 0} children`;
    case "quiz":
      return `Quiz with ${
        element.children?.filter((c: any) => c.type === "answer").length || 0
      } answers`;
    case "faq":
      return `FAQ with ${element.children?.length || 0} items`;
    case "image":
    case "video":
      return `${element.content?.alt || "Media"}`;
    case "comparison-chart":
      return `Chart with ${element.content?.columns?.length || 0} columns`;
    default:
      return element.type;
  }
}

/**
 * Build user prompt for modification (sent to AI as user message)
 */
export function buildModifyFunnelUserPrompt(userInstructions: string): string {
  return `Modify the funnel according to these instructions:\n\n${userInstructions}\n\nReturn the result as valid JSON following the response format specified in the system prompt.`;
}
