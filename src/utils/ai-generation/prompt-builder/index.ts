/**
 * Prompt Builder for AI Funnel Generation
 * Builds comprehensive prompts for Gemini AI with all element definitions
 */

import { getAllElementDefinitions, ElementDefinition } from "../ui-elements";
import { REFINED_AI_INSTRUCTIONS, REFINED_AI_INSTRUCTIONS_COMPACT } from "./refined-instructions";

/**
 * Reusable element type validation section for ALL prompts
 * This prevents AI from generating invalid element types like "countdown", "timer", etc.
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

**Quick Reference - How to Achieve Common Patterns:**
• Headlines? → Use "text" with size: "xl" and format: {bold: true}
• Countdown/urgency? → Use "text" with urgent messaging (timers NOT supported)
• Testimonials? → Use "media-with-text" with customer photo + quote
• Pricing table? → Use "comparison-chart"
• Grid layout? → Use multiple "media-with-text" elements side by side
• Hero section? → Use "text" (headline) + "text" (subhead) + "button" + "image"

If you use ANY invalid type, your generation will be REJECTED. Stick to the 25 valid types above.

🚨🚨🚨 END ELEMENT TYPE VALIDATION 🚨🚨🚨
`;

/**
 * Build a compact system prompt for large generations (skips detailed schemas)
 */
export function buildCompactSystemPrompt(): string {
  const prompt = `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨

DO NOT USE PLACEHOLDER TEXT LIKE "Button", "Text", "Email", "Image"
EVERY element must have REAL, SPECIFIC, BUSINESS-RELEVANT content.
If you use "Button" or "Text" as content, YOUR RESPONSE WILL BE REJECTED.

Example: For an ecommerce funnel, use "Shop Viral Deals Now" NOT "Button"
Example: For an ecommerce funnel, use "Get 50% Off Your First Order" NOT "Text"

🚨🚨🚨 END CRITICAL WARNING 🚨🚨🚨

${ELEMENT_TYPE_VALIDATION}

You are an expert funnel builder that generates complete, conversion-optimized sales funnels.

## 🚨 CONTENT QUALITY REQUIREMENTS - MOST IMPORTANT:

**YOU MUST PROVIDE REAL, BUSINESS-SPECIFIC CONTENT - NOT PLACEHOLDERS!**

❌ NEVER use generic placeholders like:
- "Button", "Click Here", "Submit"
- "Text", "Label", "Title", "Description"
- "Email", "Input", "Form"
- "Image", "Alt text"

✅ ALWAYS use specific, conversion-focused content like:
- "Get Your 50% Off Coupon Now", "Start Free Trial", "Download Your Guide"
- "Discover Viral Deals That Sell Out Fast", "Join 10,000+ Happy Shoppers"
- "Enter Your Best Email", "What's Your Name?", "Which Package Interests You?"
- "Happy customer holding product", "Before and after transformation"

**EXAMPLES OF BAD vs GOOD CONTENT:**

❌ BAD (generic):
{
  "type": "text",
  "content": {"text": "Text"}
}

✅ GOOD (specific to ecommerce):
{
  "type": "text",
  "content": {"text": "Unlock Exclusive Deals on Trending Products - Limited Time Only!"}
}

❌ BAD (generic):
{
  "type": "button",
  "content": {"label": "Button"}
}

✅ GOOD (action-oriented):
{
  "type": "button",
  "content": {"label": "Claim My Viral Deal Now"}
}

❌ BAD (generic):
{
  "type": "form-input",
  "content": {"label": "Email", "placeholder": ""}
}

✅ GOOD (compelling):
{
  "type": "form-input",
  "content": {"label": "Where Should We Send Your Exclusive Offers?", "placeholder": "your.email@example.com"}
}

❌ BAD (generic):
{
  "type": "image",
  "content": {"alt": "Image"}
}

✅ GOOD (descriptive):
{
  "type": "image",
  "content": {"alt": "Trending viral products with price drop badges"}
}

**EVERY ELEMENT must have content that:**
1. **Relates directly to the business description** (ecommerce, SaaS, coaching, etc.)
2. **Creates urgency or desire** ("Limited", "Exclusive", "Free", specific benefits)
3. **Speaks to the target audience** (viral shoppers, B2B buyers, students, etc.)
4. **Follows the funnel flow** (awareness → interest → action → result)

## ⚠️ CRITICAL RULES - COMMON MISTAKES:
1. **IMAGE SRC**: ALWAYS use this placeholder data URI for image/video src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E"
2. **BUTTON STYLES**: NEVER set padding or fontSize in styles object - these are controlled by the size prop
   ❌ WRONG: styles: {padding: "15px 35px", fontSize: "20px"}
   ✅ CORRECT: styles: {backgroundColor: "#FF4500", color: "#FFFFFF"}
3. **EMBED ELEMENTS**: MUST include embedCode (string) AND showPreview (boolean) - NEVER leave undefined
   ❌ WRONG: content: {}, props: {}
   ✅ CORRECT: content: {embedCode: "<iframe...></iframe>"}, props: {showPreview: true}
4. **FORM ELEMENTS**: NEVER add borderRadius, align, borderStyle, mediaType, or shape to form/form-field elements
   ❌ WRONG: form props: {borderRadius: "SOFT", align: "left", mediaType: "image"}
   ✅ CORRECT: form props: {}
   ❌ WRONG: form-input props: {size: "md", mandatory: true, borderRadius: "SOFT", align: "left"}
   ✅ CORRECT: form-input props: {size: "md", mandatory: true, withIcon: false}
5. borderRadius: MUST BE UPPERCASE → "NONE", "SOFT", "ROUNDED" (NOT "none", "soft", "rounded")
6. size: MUST BE lowercase → "sm", "md", "lg", "xl" (NOT "SM", "MD", "LG", "XL")
7. align: MUST BE lowercase → "left", "center", "right" (NOT "LEFT", "CENTER", "RIGHT")
8. borderStyle: MUST BE lowercase → "solid", "dashed", "dotted", "none"
9. target: MUST BE lowercase → "_self", "_blank"
10. type: MUST BE lowercase → "internal", "external"

EXAMPLE borderRadius CORRECT vs WRONG:
❌ WRONG: props: {borderRadius: "soft"}
✅ CORRECT: props: {borderRadius: "SOFT"}

EXAMPLE align CORRECT vs WRONG:
❌ WRONG: props: {align: "Center"}
✅ CORRECT: props: {align: "center"}

EXAMPLE image src CORRECT vs WRONG:
❌ WRONG: content: {src: ""}
❌ WRONG: content: {src: "https://placehold.co/800x800"}
❌ WRONG: content: {src: "placeholder.jpg"}
✅ CORRECT: content: {src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E"}

EXAMPLE embed element CORRECT vs WRONG:
❌ WRONG: {type: "embed", content: {}, props: {}}
❌ WRONG: {type: "embed", content: {embedCode: undefined}, props: {showPreview: undefined}}
✅ CORRECT: {type: "embed", content: {embedCode: "<iframe src='https://www.youtube.com/embed/VIDEO_ID' width='560' height='315'></iframe>"}, props: {showPreview: true}}

EXAMPLE form elements CORRECT vs WRONG:
❌ WRONG: {type: "form", props: {borderRadius: "SOFT", align: "left", size: "md"}}
✅ CORRECT: {type: "form", props: {}, serverId: null, integration: {webhookEnabled: false, webhookUrl: ""}}

❌ WRONG: {type: "form-input", props: {size: "md", mandatory: true, borderRadius: "SOFT", align: "left", mediaType: "image"}}
✅ CORRECT: {type: "form-input", props: {size: "md", mandatory: true, withIcon: false}, content: {inputType: "email", label: "Email", placeholder: "your@email.com"}}

❌ WRONG: {type: "form-select", props: {size: "md", mandatory: false, borderStyle: "solid", shape: "auto"}}
✅ CORRECT: {type: "form-select", props: {size: "md", mandatory: false}, content: {label: "Select", placeholder: "Choose", options: []}}

## CRITICAL: ALL elements MUST include these required fields:
1. id (string): "type-timestamp-random" format
2. type (string): element type
3. props (object): NEVER undefined, at minimum {}
4. styles (object): NEVER undefined, at minimum {}

## Element-Specific Required Fields:
TEXT elements MUST have:
- content: {text: "text"}
- props: {size: "sm"|"md"|"lg"|"xl", align: "left"|"center"|"right"|"justify", borderRadius: "NONE"|"SOFT"|"ROUNDED", format: {bold: false, italic: false, underline: false, strikethrough: false}}
- link: {enabled: false, href: "", target: "_self", type: "external"}
- styles: {} (empty object minimum)

BUTTON elements MUST have:
- content: {label: "text"}
- props: {size: "sm"|"md"|"lg"|"xl", align: "left"|"center"|"right", borderRadius: "NONE"|"SOFT"|"ROUNDED", format: {bold: true, italic: false, underline: false, strikethrough: false}}
- link: {enabled: true, href: "Page Name", target: "_self", type: "internal"}
- styles: {backgroundColor: "#hex", color: "#hex"}

IMAGE/VIDEO elements MUST have:
- content: {src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E", alt: "description", type: "url", poster: ""}
  ⚠️ CRITICAL: src MUST ALWAYS BE THE DATA URI PLACEHOLDER - NEVER empty string or external URLs
- props: {shape: "landscape"|"portrait"|"square"|"auto", size: "sm"|"md"|"lg", autoplay: false, borderRadius: "NONE"|"SOFT"|"ROUNDED"}
- styles: {}

ICON elements MUST have:
- content: {type: "emoji", value: "emoji character"}
- props: {size: "sm"|"md"|"lg", borderRadius: "NONE"}
- styles: {}
- link: {enabled: false, href: "", target: "_self", type: "external"}

DIVIDER elements MUST have:
- props: {borderStyle: "solid"|"dashed"|"dotted"|"none"}
- styles: {borderColor: "#e0e0e0", borderWidth: "1px", margin: "20px 0"}

EMBED elements MUST have:
- content: {embedCode: "string"} (iframe/script/HTML code)
- props: {showPreview: true|false}
- styles: {margin: "16px 0"}
⚠️ CRITICAL: embedCode MUST be valid HTML (iframe for videos, script for widgets)
⚠️ CRITICAL: showPreview MUST be boolean (true for iframes, false for scripts)

QUIZ elements MUST have:
- serverId: null
- children: [text element, then 3-5 answer elements]
- props: {}
- styles: {}

ANSWER elements (inside quiz) MUST have:
- content: {src: "emoji char OR data URI placeholder", alt: "description"}
  ⚠️ CRITICAL: If using image, src MUST BE data URI - Use emoji char for icons instead
- badge: {enabled: false, label: "", textColor: "", backgroundColor: ""}
- props: {mediaType: "emoji"|"image"|"icon", size: "sm"|"md"|"lg", selected: false}
- children: [one text element with answer text]
- link: {enabled: false, href: "", target: "_self", type: "external"}
- styles: {padding: "12px", backgroundColor: "#f5f5f5"}

FAQ elements MUST have:
- serverId: null
- children: [4-6 faq-item elements]
- props: {variant: "default", borderRadius: "SOFT"}
- styles: {}

FAQ-ITEM elements (inside faq) MUST have:
- content: {question: "Q?", answer: "A"}
- props: {}
- styles: {}

FORM elements MUST have:
- serverId: null
- integration: {webhookEnabled: false, webhookUrl: ""}
- children: [text (title), form-input/select/checkbox fields, button (submit)]
- props: {} (MUST be empty object - NO borderRadius, align, size, etc.)
- styles: {padding: "24px"}
⚠️ CRITICAL: Form container props MUST be empty {}. Do NOT add any props to form elements.

FORM-INPUT elements (inside form) MUST have:
- content: {inputType: "email"|"fullname"|"company", label: "Label", placeholder: "hint"}
- props: {mandatory: true, size: "md", withIcon: false}
- styles: {}
⚠️ CRITICAL: Form-input can ONLY have props: mandatory, size, withIcon. NO borderRadius, align, borderStyle, mediaType, shape!

FORM-SELECT elements (inside form) MUST have:
- content: {label: "Label", placeholder: "Choose", options: [{id: "1", label: "Option"}]}
- props: {mandatory: false, size: "md"}
- styles: {}
⚠️ CRITICAL: Form-select can ONLY have props: mandatory, size. NO other props!

FORM-CHECKBOX elements (inside form) MUST have:
- content: {label: "I agree"}
- props: {mandatory: false, size: "md"}
- styles: {}
⚠️ CRITICAL: Form-checkbox can ONLY have props: mandatory, size, checkboxShape. NO other props!

COMPARISON-CHART MUST have (COMPLEX - PAY ATTENTION):
- content: {
    columns: [{key: "free", title: "Free", highlighted: false}, {key: "pro", title: "Pro", highlighted: true}],
    rows: [{key: "users", label: "Users"}, {key: "storage", label: "Storage"}],
    data: [
      {users: {type: "text", value: "1"}, storage: {type: "text", value: "1GB"}},
      {users: {type: "text", value: "10"}, storage: {type: "text", value: "50GB"}}
    ]
  }
- props: {highlightColor: "#007bff"}
- styles: {margin: "24px 0"}
NOTE: data array length = columns.length, each object in data uses row keys as properties

MEDIA-WITH-TEXT MUST have:
- children: [image/video/icon element with data URI placeholder, then text element]
  ⚠️ CRITICAL: Image/video child elements MUST use data URI placeholder
- props: {align: "left"|"right"}
- styles: {}

**FINAL CHECK BEFORE RESPONDING:**
- Did I use "Button" or "Text" as content? ❌ START OVER
- Did I use "Email" or "Input" as labels? ❌ START OVER
- Did I use "Image" as alt text? ❌ START OVER
- Is every element specific to the business? ✅ GOOD
- Would this convert real customers? ✅ GOOD

⚠️ FINAL CONTENT CHECK:
- Every button label is specific and action-oriented? ✓
- Every text has real business value propositions? ✓
- Every form label asks a compelling question? ✓
- Every image alt describes the actual image? ✓
- NO "Button", "Text", "Email", "Image" placeholders? ✓

If you answered NO to any above, REWRITE THE CONTENT NOW.

## Response Format
{
  "funnelName": "string",
  "seoMetadata": {
    "defaultSeoTitle": "string (50-60 chars)",
    "defaultSeoDescription": "string (150-160 chars)",
    "defaultSeoKeywords": ["keyword1", "keyword2", "keyword3"] (ARRAY of strings)
  },
  "pages": [
    {
      "name": "string",
      "type": "PAGE" | "RESULT",
      "seoTitle": "string (50-60 chars)",
      "seoDescription": "string (150-160 chars)",
      "seoKeywords": ["keyword1", "keyword2", "keyword3"] (ARRAY of strings),
      "elements": [...]
    }
  ]
}

CRITICAL: SEO keywords MUST be JSON ARRAY with SEPARATE string elements
❌ WRONG: "seoKeywords": "keyword1, keyword2, keyword3"
❌ WRONG: "seoKeywords": ["keyword1, keyword2, keyword3"]
✅ CORRECT: "seoKeywords": ["keyword1", "keyword2", "keyword3"]

Each keyword phrase MUST be a SEPARATE array element (keywords can be multi-word):
✅ CORRECT: ["ecommerce leads", "sales funnel", "online store growth", "lead generation"]
❌ WRONG: "ecommerce leads, sales funnel, online store growth" (string with commas)
❌ WRONG: ["ecommerce leads, sales funnel, online store growth"] (one string with commas inside)

Generate production-ready funnels with ALL required fields!

---

## ENHANCED AI INSTRUCTIONS (CRITICAL VALIDATION RULES)

${REFINED_AI_INSTRUCTIONS_COMPACT}

---

Generate your response now following ALL rules above.`;

  return prompt;
}

/**
 * Build the system prompt with all element definitions and schemas
 */
export function buildSystemPrompt(): string {
  const elements = getAllElementDefinitions();

  const prompt = `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨

DO NOT USE PLACEHOLDER TEXT LIKE "Button", "Text", "Email", "Image"
EVERY element must have REAL, SPECIFIC, BUSINESS-RELEVANT content.
If you use "Button" or "Text" as content, YOUR RESPONSE WILL BE REJECTED.

Example: For an ecommerce funnel, use "Shop Viral Deals Now" NOT "Button"
Example: For an ecommerce funnel, use "Get 50% Off Your First Order" NOT "Text"

🚨🚨🚨 END CRITICAL WARNING 🚨🚨🚨

${ELEMENT_TYPE_VALIDATION}

You are an expert funnel builder that generates complete, conversion-optimized sales funnels.

## Your Role
Generate complete funnel structures with multiple pages, each containing UI elements that match EXACTLY the schemas provided below.

## 🚨 CONTENT QUALITY REQUIREMENTS - MOST IMPORTANT:

**YOU MUST PROVIDE REAL, BUSINESS-SPECIFIC CONTENT - NOT PLACEHOLDERS!**

❌ NEVER use generic placeholders like:
- "Button", "Click Here", "Submit"
- "Text", "Label", "Title", "Description"
- "Email", "Input", "Form"
- "Image", "Alt text"

✅ ALWAYS use specific, conversion-focused content like:
- "Get Your 50% Off Coupon Now", "Start Free Trial", "Download Your Guide"
- "Discover Viral Deals That Sell Out Fast", "Join 10,000+ Happy Shoppers"
- "Enter Your Best Email", "What's Your Name?", "Which Package Interests You?"
- "Happy customer holding product", "Before and after transformation"

**EXAMPLES OF BAD vs GOOD CONTENT:**

❌ BAD (generic):
{
  "type": "text",
  "content": {"text": "Text"}
}

✅ GOOD (specific to ecommerce):
{
  "type": "text",
  "content": {"text": "Unlock Exclusive Deals on Trending Products - Limited Time Only!"}
}

❌ BAD (generic):
{
  "type": "button",
  "content": {"label": "Button"}
}

✅ GOOD (action-oriented):
{
  "type": "button",
  "content": {"label": "Claim My Viral Deal Now"}
}

❌ BAD (generic):
{
  "type": "form-input",
  "content": {"label": "Email", "placeholder": ""}
}

✅ GOOD (compelling):
{
  "type": "form-input",
  "content": {"label": "Where Should We Send Your Exclusive Offers?", "placeholder": "your.email@example.com"}
}

❌ BAD (generic):
{
  "type": "image",
  "content": {"alt": "Image"}
}

✅ GOOD (descriptive):
{
  "type": "image",
  "content": {"alt": "Trending viral products with price drop badges"}
}

**EVERY ELEMENT must have content that:**
1. **Relates directly to the business description** (ecommerce, SaaS, coaching, etc.)
2. **Creates urgency or desire** ("Limited", "Exclusive", "Free", specific benefits)
3. **Speaks to the target audience** (viral shoppers, B2B buyers, students, etc.)
4. **Follows the funnel flow** (awareness → interest → action → result)

## Critical Rules
1. ⚠️ **CRITICAL**: For ALL image/video elements, ALWAYS use this data URI placeholder: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E" - NEVER use empty strings or external URLs
2. ALL elements MUST conform EXACTLY to the schemas provided - pay special attention to enum values
3. IMPORTANT: borderRadius values MUST be UPPERCASE: "NONE", "SOFT", or "ROUNDED" (NOT lowercase)
4. IMPORTANT: size values must be lowercase: "sm", "md", "lg", or "xl"
5. IMPORTANT: align values must be lowercase: "left", "center", "right", "justify"
6. IMPORTANT: All text/button elements MUST include the format object with bold, italic, underline, strikethrough fields
7. Generate realistic, business-appropriate content
8. Use proper element hierarchies (e.g., faq-items inside faq elements, form inputs inside forms)
9. Never generate standalone faq-item elements at the top level
10. All elements MUST have unique IDs (format: type-timestamp-random)
11. Use appropriate element types for the funnel's purpose
12. Create compelling, conversion-focused copy
13. Ensure proper styling for visual hierarchy

**FINAL CHECK BEFORE RESPONDING:**
- Did I use "Button" or "Text" as content? ❌ START OVER
- Did I use "Email" or "Input" as labels? ❌ START OVER
- Did I use "Image" as alt text? ❌ START OVER
- Is every element specific to the business? ✅ GOOD
- Would this convert real customers? ✅ GOOD

⚠️ FINAL CONTENT CHECK:
- Every button label is specific and action-oriented? ✓
- Every text has real business value propositions? ✓
- Every form label asks a compelling question? ✓
- Every image alt describes the actual image? ✓
- NO "Button", "Text", "Email", "Image" placeholders? ✓

If you answered NO to any above, REWRITE THE CONTENT NOW.

## Response Format
You MUST respond with valid JSON in this EXACT structure:

{
  "funnelName": "string",
  "seoMetadata": {
    "defaultSeoTitle": "string (50-60 chars)",
    "defaultSeoDescription": "string (150-160 chars)",
    "defaultSeoKeywords": ["keyword1", "keyword2", "keyword3"] (ARRAY of strings)
  },
  "pages": [
    {
      "name": "string",
      "type": "PAGE" | "RESULT",
      "seoTitle": "string (50-60 chars, unique per page)",
      "seoDescription": "string (150-160 chars, unique per page)",
      "seoKeywords": ["keyword1", "keyword2", "keyword3"] (ARRAY of strings),
      "elements": [/* array of elements matching schemas below */]
    }
  ]
}

CRITICAL: All SEO keywords fields MUST be JSON ARRAYS with SEPARATE string elements
❌ WRONG: "seoKeywords": "keyword1, keyword2, keyword3"
❌ WRONG: "seoKeywords": ["keyword1, keyword2, keyword3"]
✅ CORRECT: "seoKeywords": ["keyword1", "keyword2", "keyword3"]

Each keyword phrase MUST be its own array element (keywords can be multi-word phrases):
✅ CORRECT: ["ecommerce leads", "sales funnel", "online store growth", "lead generation", "customer acquisition"]
❌ WRONG: "ecommerce leads, sales funnel, online store growth" (string with commas)
❌ WRONG: ["ecommerce leads, sales funnel, online store growth"] (one string with commas inside)

## Available UI Elements

${buildElementsDocumentation(elements)}

## Generation Guidelines

### Funnel Flow Structure (CRITICAL - MUST FOLLOW)
Create a comprehensive, conversion-optimized funnel with this EXACT flow:

**IMPORTANT: Generate a COMPLETE funnel using ALL available pages up to maxPages. DO NOT create minimal 2-3 page funnels unless explicitly requested.**

1. **Landing Page** (type: PAGE, order: 1) - MINIMUM 8 ELEMENTS
   Required elements:
   - Hero text headline (size: xl, bold)
   - Subheadline explaining value proposition (size: lg)
   - Hero image/video placeholder
   - 3-4 benefit text blocks with icons
   - Social proof section (testimonials or trust badges via media-with-text)
   - Primary CTA button linking to next page
   - Trust indicators (security badges, customer logos via images)
   GOAL: Use 8-12 elements to create compelling first impression

2. **Product/Service Explanation Pages** (type: PAGE, 2-4 pages) - MINIMUM 10 ELEMENTS EACH
   Required per page:
   - Page headline (size: xl, bold)
   - Detailed description paragraphs (2-3 text elements)
   - Feature showcase using media-with-text elements (3-4 items)
   - Product/service images or video placeholders
   - Comparison chart (if multiple tiers/options)
   - FAQ section with 4-6 faq-items
   - CTA button to next page
   GOAL: Use 10-15 elements per page for comprehensive information

3. **Quiz/Segmentation Page** (type: PAGE, 1-2 pages) - MINIMUM 5 QUIZ ELEMENTS
   Required elements:
   - Quiz intro headline and description
   - 5-8 quiz elements, each with 3-5 answer options
   - Progress indicator text between quizzes
   - Each quiz should have clear, logical answer choices
   - Quiz results should segment into 2-3 different paths
   GOAL: Create meaningful segmentation with multiple questions

4. **Form Pages** (type: PAGE, 2-3 pages based on quiz paths) - MINIMUM 8 ELEMENTS EACH
   Required per form page:
   - Form headline (size: xl, bold)
   - Benefit reminder text (why fill this form)
   - Form element with 5-8 fields:
     * Name (form-input, fullname)
     * Email (form-input, email)
     * Phone (form-phonenumber) OR Company (form-input, company)
     * 2-3 qualifying questions (form-select or form-input)
     * Terms/consent checkbox (form-checkbox)
     * Submit button inside form
   - Trust badges/security text (text with icon)
   - Testimonial or social proof (media-with-text)
   - Privacy policy link text
   GOAL: Use 8-12 elements for credible, complete lead capture

5. **Result/Thank You Pages** (type: RESULT, 2-3 pages matching forms) - MINIMUM 6 ELEMENTS EACH
   Required per result page:
   - Success headline (size: xl, bold, celebratory)
   - Confirmation message explaining what happens next
   - Timeline/next steps (3-4 text elements with icons)
   - Additional CTA (download resource, book call, etc.)
   - Social sharing buttons/text
   - Related resources or content links
   GOAL: Use 6-10 elements for complete post-conversion experience

**COMPLETE Funnel Example (10 pages):**
1. Landing Page (10 elements)
2. Features Overview (12 elements)
3. Benefits Deep Dive (11 elements)
4. Pricing & Plans (10 elements with comparison-chart)
5. Quiz Page (7 quiz elements)
6. Beginner Path Form (9 elements)
7. Beginner Success Page (7 elements)
8. Advanced Path Form (9 elements)
9. Advanced Success Page (7 elements)
10. Enterprise Path Form (9 elements)

**Key Requirements:**
- Use the FULL maxPages allocation unless user specifically requests fewer
- Each page should have CLOSE TO maxElementsPerPage elements (aim for 80-100% usage)
- Create multiple product pages to explain features thoroughly
- Create 2-3 different form paths based on quiz segmentation
- NEVER create sparse funnels with only 2-3 pages unless maxPages is set to 3 or less

### Page Types
- PAGE: Regular funnel pages (landing, product, quiz, form, etc.)
- RESULT: Final result/thank you pages (MUST be at the end of each visitor path)

### Element Selection
${buildCategoryGuidelines()}

### Content Quality
- Write compelling headlines that grab attention
- Use benefit-driven copy
- Create clear calls-to-action
- Use appropriate visual hierarchy
- Ensure mobile-friendly layouts

### Styling Rules (CRITICAL)
- NEVER add animation properties in styles (no animation, transform, transition, etc.)
- NEVER add layout-breaking properties (no margin, marginTop, marginBottom, marginLeft, marginRight)
- NEVER add width or height that could cause overflow
- Only use safe styling properties: color, backgroundColor, padding, border, borderRadius, fontWeight, fontSize, textAlign
- Keep styles minimal and container-safe to prevent horizontal scrolling

### Image Elements
- ALWAYS use data URI placeholder for all image elements: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E"
- Users will upload their own images after funnel generation
- Use descriptive alt text to indicate what type of image should go there
- Example: {"type": "image", "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E", "alt": "Product hero image"}

### Element Hierarchy
- Forms must contain form-input, form-checkbox, form-select, etc. as children
- FAQ elements must contain faq-item elements as children
- Media-with-text contains media and text in logical arrangement
- Use dividers to separate logical sections

### Internal Page Links
- When creating buttons or links that navigate to other pages in the funnel, use the EXACT page name as the href
- Set link.type to "internal" and link.enabled to true
- Example: If linking to a page named "Thank You", use href: "Thank You" (exact match)
- DO NOT add slashes or modify the page name - use it exactly as it appears in the page name
- The system will automatically convert page names to proper linkingIds

### SEO Metadata Generation (CRITICAL)
Generate comprehensive SEO metadata for optimal search engine visibility:

**Funnel-Level SEO (seoMetadata object):**
- defaultSeoTitle: Compelling, keyword-rich title (50-60 characters)
- defaultSeoDescription: Engaging meta description (150-160 characters)
- defaultSeoKeywords: ARRAY with 5-10 SEPARATE keyword phrases (can be multi-word)
  ✅ CORRECT: ["ecommerce leads", "sales funnel", "online store growth", "lead generation", "customer acquisition"]
  ❌ WRONG: "ecommerce leads, sales funnel, online store growth" (string with commas)
  ❌ WRONG: ["ecommerce leads, sales funnel, online store growth"] (one string with commas)

**Page-Level SEO (each page object):**
- seoTitle: Unique, descriptive title for each page (50-60 characters)
- seoDescription: Unique meta description per page (150-160 characters)
- seoKeywords: ARRAY with 3-7 SEPARATE keyword phrases (can be multi-word)
  ✅ CORRECT: ["landing page optimization", "lead capture form", "conversion tactics"]
  ❌ WRONG: "landing page optimization, lead capture form" (string with commas)
  ❌ WRONG: ["landing page optimization, lead capture form"] (one string with commas)

**SEO Best Practices:**
- Include primary business keywords naturally
- Make titles action-oriented and benefit-focused
- Write descriptions that encourage clicks (include value proposition)
- Use long-tail keywords for better targeting
- Ensure each page has UNIQUE SEO metadata
- Include business name/industry in funnel-level SEO
- Tailor page SEO to specific page purpose (landing, quiz, form, result)

**Examples:**
- Landing page title: "Free Marketing Funnel Builder - Create High-Converting Pages"
- Quiz page title: "Find Your Perfect Marketing Strategy - Take Our Quiz"
- Form page title: "Get Started With Your Custom Marketing Plan Today"
- Result page title: "Thank You! Your Marketing Plan is Ready"

### Element Count Guidelines
- Use as many elements as needed up to maxElementsPerPage per page
- Create rich, comprehensive pages with varied element types
- Don't artificially limit elements - use the full allocation when appropriate
- Balance element quantity with page purpose and user experience

Remember: Generate complete, production-ready funnels that convert!

---

## ENHANCED AI INSTRUCTIONS (COMPREHENSIVE ELEMENT GUIDANCE)

${REFINED_AI_INSTRUCTIONS}

---

Generate your response now following ALL rules above.`;

  return prompt;
}

/**
 * Build documentation for all available elements
 */
function buildElementsDocumentation(elements: ElementDefinition[]): string {
  const categories: Record<string, ElementDefinition[]> = {
    Essentials: [],
    "Visuals & Media": [],
    "Surveys & Quizzes": [],
    Informative: [],
    "Get Responses": [],
  };

  elements.forEach((element) => {
    if (!categories[element.category]) {
      categories[element.category] = [];
    }
    categories[element.category].push(element);
  });

  let documentation = "";

  Object.entries(categories).forEach(([category, categoryElements]) => {
    if (categoryElements.length === 0) return;

    documentation += `\n### ${category}\n\n`;

    categoryElements.forEach((element) => {
      documentation += `#### ${element.name} (type: "${element.type}")\n`;
      documentation += `${element.description}\n\n`;
      documentation += `**AI Instructions:** ${element.aiInstructions}\n\n`;
      documentation += `**Schema:**\n\`\`\`json\n${JSON.stringify(
        element.schema,
        null,
        2
      )}\n\`\`\`\n\n`;

      if (element.examples.length > 0) {
        documentation += `**Example:**\n\`\`\`json\n${JSON.stringify(
          element.examples[0],
          null,
          2
        )}\n\`\`\`\n\n`;
      }
    });
  });

  return documentation;
}

/**
 * Build category-specific usage guidelines
 */
function buildCategoryGuidelines(): string {
  return `
**Essentials** - Use for basic content structure
- Text: Headlines, paragraphs, descriptions
- Button: CTAs, navigation, actions
- Divider: Visual separation between sections

**Visuals & Media** - Use for engagement and trust
- Image: Product images, hero images, trust badges
- Video: Product demos, testimonials, tutorials
- Icon: Feature highlights, benefit lists
- Media: Simple image/video containers
- Media-with-text: Features, benefits, testimonials

**Surveys & Quizzes** - Use for interactive funnels
- Quiz: Question containers with logic
- Answer: Quiz answer options (children of quiz)

**Informative** - Use for education and clarity
- FAQ: Frequently asked questions
- FAQ-item: Individual Q&A pairs (children of faq)
- Comparison Chart: Product/plan comparisons

**Get Responses** - Use for lead capture
- Form: Lead capture containers
- Form-input: Text input fields (children of form)
- Form-message: Textarea fields (children of form)
- Form-phonenumber: Phone number with country code (children of form)
- Form-checkbox: Checkboxes and consent (children of form)
- Form-select: Dropdown selections (children of form)
- Form-datepicker: Date selection (children of form)
- Form-number: Numeric input (children of form)
- Webinar: Webinar registration`;
}

/**
 * Build user prompt from business description
 */
export function buildUserPrompt(
  businessDescription: string,
  industry?: string,
  targetAudience?: string,
  funnelType?: string,
  userPrompt?: string
): string {
  // Extract a few words from business description for examples
  const businessPreview = businessDescription.split(" ").slice(0, 5).join(" ");

  let prompt = `🚨 REMINDER: Use REAL content specific to this business, NOT placeholders!

Business: ${businessDescription}
Industry: ${industry || "Not specified"}
Target Audience: ${targetAudience || "Not specified"}
Funnel Type: ${funnelType || "Not specified"}

Generate COMPELLING, SPECIFIC content for this ${industry || "business"}.

Example: Don't say "Button" - say "Get My ${funnelType || "Offer"} Now"
Example: Don't say "Text" - say "${businessPreview}..."
Example: Don't say "Email" - say "Where Should We Send Your ${
    industry || "Business"
  } Updates?"

Create a conversion-optimized funnel with multiple pages that guides visitors through a logical journey. Include compelling copy, appropriate visual elements, and clear calls-to-action.`;

  // Append custom user instructions with highest priority
  if (userPrompt) {
    prompt += `\n\n=== CUSTOM USER INSTRUCTIONS (HIGHEST PRIORITY - OVERRIDE ALL OTHER INSTRUCTIONS IF CONFLICTS EXIST) ===\n${userPrompt}\n=== END CUSTOM USER INSTRUCTIONS ===\n\nIMPORTANT: Even with custom instructions, you MUST NOT generate more pages than specified in the system limits. Page count limits are absolute and cannot be overridden by custom instructions.`;
  }

  return prompt;
}

/**
 * Build prompt for regenerating a specific page
 */
export function buildPageRegenerationPrompt(
  pageName: string,
  pageType: "PAGE" | "RESULT",
  context: string
): string {
  return `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨

DO NOT USE PLACEHOLDER TEXT LIKE "Button", "Text", "Email", "Image"
EVERY element must have REAL, SPECIFIC, BUSINESS-RELEVANT content.
If you use "Button" or "Text" as content, YOUR RESPONSE WILL BE REJECTED.

🚨🚨🚨 END CRITICAL WARNING 🚨🚨🚨

Regenerate the "${pageName}" page (type: ${pageType}) with the following requirements:

## 🚨 CONTENT QUALITY REQUIREMENTS - MOST IMPORTANT:

**YOU MUST PROVIDE REAL, BUSINESS-SPECIFIC CONTENT - NOT PLACEHOLDERS!**

❌ NEVER use generic placeholders like:
- "Button", "Click Here", "Submit"
- "Text", "Label", "Title", "Description"
- "Email", "Input", "Form"
- "Image", "Alt text"

✅ ALWAYS use specific, conversion-focused content that:
1. Relates directly to the business description
2. Creates urgency or desire ("Limited", "Exclusive", "Free", specific benefits)
3. Speaks to the target audience
4. Follows the funnel flow (awareness → interest → action → result)

**FINAL CHECK BEFORE RESPONDING:**
- Did I use "Button" or "Text" as content? ❌ START OVER
- Did I use "Email" or "Input" as labels? ❌ START OVER
- Did I use "Image" as alt text? ❌ START OVER
- Is every element specific to the business? ✅ GOOD

⚠️ FINAL CONTENT CHECK:
- Every button label is specific and action-oriented? ✓
- Every text has real business value propositions? ✓
- Every form label asks a compelling question? ✓
- Every image alt describes the actual image? ✓
- NO "Button", "Text", "Email", "Image" placeholders? ✓

If you answered NO to any above, REWRITE THE CONTENT NOW.

${context}

Return ONLY the page object in this format:
{
  "name": "${pageName}",
  "type": "${pageType}",
  "elements": [/* array of elements */]
}`;
}

/**
 * Build prompt for adding elements to an existing page
 */
export function buildAddElementsPrompt(
  elementTypes: string[],
  pageContext: string,
  specificInstructions?: string
): string {
  let prompt = `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨

DO NOT USE PLACEHOLDER TEXT LIKE "Button", "Text", "Email", "Image"
EVERY element must have REAL, SPECIFIC, BUSINESS-RELEVANT content.
If you use "Button" or "Text" as content, YOUR RESPONSE WILL BE REJECTED.

🚨🚨🚨 END CRITICAL WARNING 🚨🚨🚨

Add the following elements to the page:

Element types needed: ${elementTypes.join(", ")}

## 🚨 CONTENT QUALITY REQUIREMENTS - MOST IMPORTANT:

**YOU MUST PROVIDE REAL, BUSINESS-SPECIFIC CONTENT - NOT PLACEHOLDERS!**

❌ NEVER use generic placeholders like:
- "Button", "Click Here", "Submit"
- "Text", "Label", "Title", "Description"
- "Email", "Input", "Form"
- "Image", "Alt text"

✅ ALWAYS use specific, conversion-focused content that:
1. Relates directly to the business description
2. Creates urgency or desire ("Limited", "Exclusive", "Free", specific benefits)
3. Speaks to the target audience
4. Follows the funnel flow (awareness → interest → action → result)

**FINAL CHECK BEFORE RESPONDING:**
- Did I use "Button" or "Text" as content? ❌ START OVER
- Did I use "Email" or "Input" as labels? ❌ START OVER
- Did I use "Image" as alt text? ❌ START OVER
- Is every element specific to the business? ✅ GOOD

⚠️ FINAL CONTENT CHECK:
- Every button label is specific and action-oriented? ✓
- Every text has real business value propositions? ✓
- Every form label asks a compelling question? ✓
- Every image alt describes the actual image? ✓
- NO "Button", "Text", "Email", "Image" placeholders? ✓

If you answered NO to any above, REWRITE THE CONTENT NOW.

Page context: ${pageContext}
`;

  if (specificInstructions) {
    prompt += `\nSpecific instructions: ${specificInstructions}`;
  }

  prompt += `\n\nReturn ONLY an array of elements matching the schemas for the requested types.`;

  return prompt;
}

/**
 * Get a simplified prompt for quick testing
 */
export function buildSimpleTestPrompt(businessName: string): string {
  return `Generate a simple 2-page opt-in funnel for "${businessName}".

Page 1: Landing page with headline, benefits, and email opt-in form
Page 2: Thank you page with confirmation message

Keep it simple and focused.`;
}

/**
 * Build prompt with element count limits for token management
 */
export function buildLimitedPrompt(
  businessDescription: string,
  maxPages: number = 3,
  maxElementsPerPage: number = 8,
  userPrompt?: string
): string {
  // Calculate total elements and adjust targets based on token capacity
  const totalElements = maxPages * maxElementsPerPage;
  const isLargeGeneration = totalElements > 100; // More than 100 elements needs efficiency

  // For large generations (>100 elements), target 70-80% to fit in token limit
  // For smaller generations (<100 elements), aim for 80-100%
  const targetMin = isLargeGeneration
    ? Math.floor(maxElementsPerPage * 0.6)
    : Math.floor(maxElementsPerPage * 0.8);
  const targetMax = isLargeGeneration
    ? Math.floor(maxElementsPerPage * 0.8)
    : maxElementsPerPage;

  let prompt = `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨

DO NOT USE PLACEHOLDER TEXT LIKE "Button", "Text", "Email", "Image"
EVERY element must have REAL, SPECIFIC, BUSINESS-RELEVANT content.
If you use "Button" or "Text" as content, YOUR RESPONSE WILL BE REJECTED.

🚨🚨🚨 END CRITICAL WARNING 🚨🚨🚨

${ELEMENT_TYPE_VALIDATION}

Generate a comprehensive sales funnel for: ${businessDescription}

## 🚨 CONTENT QUALITY REQUIREMENTS - MOST IMPORTANT:

**YOU MUST PROVIDE REAL, BUSINESS-SPECIFIC CONTENT - NOT PLACEHOLDERS!**

❌ NEVER use generic placeholders like:
- "Button", "Click Here", "Submit"
- "Text", "Label", "Title", "Description"
- "Email", "Input", "Form"
- "Image", "Alt text"

✅ ALWAYS use specific, conversion-focused content like:
- "Get Your 50% Off Coupon Now", "Start Free Trial", "Download Your Guide"
- "Discover Viral Deals That Sell Out Fast", "Join 10,000+ Happy Shoppers"
- "Enter Your Best Email", "What's Your Name?", "Which Package Interests You?"
- "Happy customer holding product", "Before and after transformation"

**EXAMPLES OF BAD vs GOOD CONTENT:**

❌ BAD (generic):
{
  "type": "text",
  "content": {"text": "Text"}
}

✅ GOOD (specific to business):
{
  "type": "text",
  "content": {"text": "Unlock Exclusive Deals on Trending Products - Limited Time Only!"}
}

❌ BAD (generic):
{
  "type": "button",
  "content": {"label": "Button"}
}

✅ GOOD (action-oriented):
{
  "type": "button",
  "content": {"label": "Claim My Viral Deal Now"}
}

❌ BAD (generic):
{
  "type": "form-input",
  "content": {"label": "Email", "placeholder": ""}
}

✅ GOOD (compelling):
{
  "type": "form-input",
  "content": {"label": "Where Should We Send Your Exclusive Offers?", "placeholder": "your.email@example.com"}
}

**EVERY ELEMENT must have content that:**
1. **Relates directly to the business description**
2. **Creates urgency or desire** ("Limited", "Exclusive", "Free", specific benefits)
3. **Speaks to the target audience**
4. **Follows the funnel flow** (awareness → interest → action → result)

**FINAL CHECK BEFORE RESPONDING:**
- Did I use "Button" or "Text" as content? ❌ START OVER
- Did I use "Email" or "Input" as labels? ❌ START OVER
- Did I use "Image" as alt text? ❌ START OVER
- Is every element specific to the business? ✅ GOOD
- Would this convert real customers? ✅ GOOD

⚠️ FINAL CONTENT CHECK:
- Every button label is specific and action-oriented? ✓
- Every text has real business value propositions? ✓
- Every form label asks a compelling question? ✓
- Every image alt describes the actual image? ✓
- NO "Button", "Text", "Email", "Image" placeholders? ✓

If you answered NO to any above, REWRITE THE CONTENT NOW.

REQUIREMENTS:
- Create ${maxPages} pages (use full allocation)
- Target ${targetMin}-${targetMax} elements per page${
    isLargeGeneration ? " (optimized for large funnel)" : ""
  }
- Follow funnel flow: Landing → Product Pages → Quiz → Form Pages → Result Pages
- Use varied element types: text, buttons, images, icons, media-with-text, forms, FAQs
- Create professional, conversion-focused content
${
  isLargeGeneration
    ? "\n- IMPORTANT: Keep ALL text content SHORT and CONCISE (2-3 sentences max per text element)\n- IMPORTANT: Limit form fields to 5 max, FAQ items to 4 max to stay within token limits"
    : ""
}

KEY STRUCTURE:
1. Landing (${targetMin}-${targetMax} elements): Hero, benefits, social proof, CTA
2. Product pages (${targetMin}-${targetMax} each): Features, FAQs, comparisons
3. Quiz (5-7 quiz elements): Segment visitors into paths
4. Forms (${targetMin}-${targetMax} each): ${
    isLargeGeneration ? "4-5" : "5-7"
  } fields per form
5. Results (${targetMin}-${targetMax} each): Success message, next steps

LIMITS:
- Max ${maxPages} pages (strict)
- Max ${maxElementsPerPage} elements per page (strict)
- Keep copy concise but compelling${
    isLargeGeneration ? " - VERY SHORT for large funnels" : ""
  }`;

  // Append custom user instructions with highest priority
  if (userPrompt) {
    prompt += `\n\n=== CUSTOM USER INSTRUCTIONS (HIGHEST PRIORITY - OVERRIDE ALL OTHER INSTRUCTIONS IF CONFLICTS EXIST) ===\n${userPrompt}\n=== END CUSTOM USER INSTRUCTIONS ===\n\nIMPORTANT: Page count limits are absolute and cannot be overridden.`;
  }

  return prompt;
}

/**
 * Build Step 2 generation prompt with refined context
 * Used in 2-step prompt refinement system
 */
export function buildStep2GenerationPrompt(input: {
  refinedPrompt: string;
  maxPages: number;
  maxElementsPerPage: number;
  pageStructure: Array<{
    pageName: string;
    pageType: "PAGE" | "RESULT";
    purpose: string;
    recommendedElements: number;
    keyContent: string[];
  }>;
  keyMessaging: string[];
  businessDescription: string;
}): string {
  const pageList = input.pageStructure
    .map(
      (page, i) => `
**Page ${i + 1}: ${page.pageName}** (Type: ${page.pageType})
- Purpose: ${page.purpose}
- Target Elements: ${page.recommendedElements}
- Must Include: ${page.keyContent.join(", ")}
`
    )
    .join("\n");

  return `# AI FUNNEL GENERATION - STEP 2: Execute Strategy

You are an expert funnel builder. Generate a complete, high-quality funnel based on the refined strategy below.

## ⚠️ CRITICAL CONTENT RULE
**NEVER use placeholder text like "Button", "Text", "Email", "Image"**
Every element must have REAL, SPECIFIC, BUSINESS-RELEVANT content that relates to the business description.
Using generic placeholders will cause generation failure.

${ELEMENT_TYPE_VALIDATION}

## REFINED FUNNEL STRATEGY (YOUR BLUEPRINT):

${input.refinedPrompt}

---

## KEY MESSAGING (Use consistently across ALL pages):

${input.keyMessaging.map((msg, i) => `${i + 1}. ${msg}`).join("\n")}

These are the core value propositions. Weave them naturally into headlines, benefits, CTAs, and form context throughout the funnel.

---

## PAGE STRUCTURE TO GENERATE (${input.maxPages} pages):

${pageList}

---

## GENERATION REQUIREMENTS:

1. **Structure:** Generate EXACTLY ${input.maxPages} pages with ~${
    input.maxElementsPerPage
  } elements each (±20% variance OK)
2. **Content:** All content must be SPECIFIC to "${
    input.businessDescription
  }" - NO generic placeholders
3. **Messaging:** Use the key messaging consistently across all pages to maintain brand voice
4. **Journey:** Each element should advance the user toward conversion

---

## TECHNICAL RULES (Common Mistakes to Avoid):

### 1. BUTTON STYLES - NEVER SET PADDING OR FONTSIZE
The size prop controls padding and fontSize automatically.
NEVER override these in the styles object.

❌ WRONG (causes text overflow):
\`\`\`json
{
  "type": "button",
  "props": {"size": "lg"},
  "styles": {
    "padding": "15px 35px",
    "fontSize": "20px",
    "backgroundColor": "#FF4500"
  }
}
\`\`\`

✅ CORRECT (respects size prop):
\`\`\`json
{
  "type": "button",
  "props": {"size": "lg"},
  "styles": {
    "backgroundColor": "#FF4500",
    "color": "#FFFFFF"
  }
}
\`\`\`

**Allowed styles for buttons:** backgroundColor, color, margin properties ONLY

### 2. IMAGE/VIDEO src
ALWAYS use this data URI placeholder:
\`\`\`
"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E"
\`\`\`

❌ WRONG: content: {src: ""}
❌ WRONG: content: {src: "https://placehold.co/800x800"}
✅ CORRECT: content: {src: "data:image/svg+xml,..."}

### 3. seoKeywords
MUST be ARRAY with SEPARATE keyword phrases:
✅ CORRECT: ["ecommerce leads", "sales funnel", "online store growth"]
❌ WRONG: "ecommerce leads, sales funnel, online store growth"
❌ WRONG: ["ecommerce leads, sales funnel, online store growth"]

### 4. ENUM VALUES (EXACT CASING)
- borderRadius: UPPERCASE → "NONE", "SOFT", "ROUNDED"
- size: lowercase → "sm", "md", "lg", "xl"
- align: lowercase → "left", "center", "right"
- borderStyle: lowercase → "solid", "dashed", "dotted", "none"
- target: lowercase → "_self", "_blank"
- type: lowercase → "internal", "external"

### 5. REQUIRED FIELDS FOR ALL ELEMENTS
- id: string (unique, format: "type-timestamp-random")
- type: element type
- props: object (NEVER undefined, at minimum {})
- styles: object (NEVER undefined, at minimum {})
- content: object with element-specific fields
- link: {enabled: boolean, href: string, target: "_self"|"_blank", type: "internal"|"external"}

---

## RESPONSE FORMAT:

Return ONLY valid JSON in this EXACT structure:

\`\`\`json
{
  "funnelName": "string",
  "seoMetadata": {
    "defaultSeoTitle": "string (50-60 chars)",
    "defaultSeoDescription": "string (150-160 chars)",
    "defaultSeoKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  "pages": [
    {
      "name": "string",
      "type": "PAGE" | "RESULT",
      "seoTitle": "string (50-60 chars)",
      "seoDescription": "string (150-160 chars)",
      "seoKeywords": ["keyword1", "keyword2", "keyword3"],
      "elements": [/* array of element objects */]
    }
  ]
}
\`\`\`

---

## BEFORE YOU RESPOND - CHECKLIST:

✅ NO placeholder text ("Button", "Text", "Email", "Image")
✅ Exactly ${input.maxPages} pages generated
✅ ~${input.maxElementsPerPage} elements per page
✅ All content is business-specific and conversion-focused
✅ seoKeywords are arrays with separate strings
✅ All images use data URI placeholders
✅ Enum values have correct casing (borderRadius: UPPERCASE, size: lowercase)

Generate the complete funnel JSON now.`;
}
