# Complete Guide: Adding New UI Elements to AI Funnel Builder

This guide provides **step-by-step instructions** for adding new UI elements to the AI funnel generation system. Follow this guide to ensure new elements work seamlessly with the AI and are properly integrated.

---

## 📋 Quick Start Checklist

When adding a new element, you need to:

1. ✅ Create element definition file in `src/utils/ai-generation/ui-elements/definitions/`
2. ✅ Register element in `src/utils/ai-generation/ui-elements/registry.ts`
3. ✅ Update element type validation in `src/utils/ai-generation/prompt-builder/index.ts`
4. ✅ Add to element type list in validator (if needed)
5. ✅ Test generation with new element type

---

## 📁 File Structure

```
src/utils/ai-generation/ui-elements/
├── ADD_NEW_ELEMENT_GUIDE.md          ← This file
├── index.ts                          ← Main export file
├── registry.ts                       ← Element registry (register new elements here)
├── types.ts                          ← Shared TypeScript types
└── definitions/                      ← Element definitions
    ├── text.ts                       ← Example: Text element
    ├── button.ts                     ← Example: Button element
    ├── image.ts                      ← Example: Image element
    ├── form.ts                       ← Example: Form element
    ├── quiz.ts                       ← Example: Quiz element
    └── [your-new-element].ts         ← Your new element goes here
```

---

## 🎯 Step-by-Step: Adding a New Element

### Step 1: Create Element Definition File

Create a new file: `src/utils/ai-generation/ui-elements/definitions/[element-name].ts`

#### Template Structure:

```typescript
import { ElementDefinition } from "../types";

/**
 * [Element Name] - [Brief Description]
 *
 * Use cases:
 * - [Use case 1]
 * - [Use case 2]
 * - [Use case 3]
 */
export const [elementName]Element: ElementDefinition = {
  type: "[element-type]",  // lowercase, hyphenated (e.g., "countdown-timer")
  description: "[What this element does and when to use it]",

  // Common use cases that help AI understand when to use this element
  useCases: [
    "[Use case 1: e.g., 'Display urgency with countdown']",
    "[Use case 2: e.g., 'Show time-limited offers']",
    "[Use case 3: e.g., 'Event registration deadlines']",
  ],

  // JSON schema for the element structure
  schema: {
    type: "object",
    required: ["id", "type", "props", "styles", "content", "link"],
    properties: {
      id: {
        type: "string",
        description: "Unique identifier (format: 'type-timestamp-random')",
      },
      type: {
        type: "string",
        enum: ["[element-type]"],
        description: "Must be '[element-type]'",
      },
      props: {
        type: "object",
        required: [],  // Add required props here
        properties: {
          // Define all props here
          // Common props: size, align, borderRadius, etc.
        },
      },
      styles: {
        type: "object",
        description: "CSS-in-JS styles (backgroundColor, color, margin, padding, etc.)",
        properties: {
          // Add allowed style properties
        },
      },
      content: {
        type: "object",
        required: [],  // Add required content fields
        properties: {
          // Define content structure
        },
      },
      link: {
        type: "object",
        required: ["enabled", "href", "target", "type"],
        properties: {
          enabled: { type: "boolean" },
          href: { type: "string" },
          target: { type: "string", enum: ["_self", "_blank"] },
          type: { type: "string", enum: ["internal", "external"] },
        },
      },
    },
  },

  // Concrete examples that AI can learn from
  examples: [
    {
      description: "[Example 1 description]",
      code: {
        id: "[element-type]-1234567890-abc",
        type: "[element-type]",
        props: {
          // Example props
        },
        styles: {
          // Example styles
        },
        content: {
          // Example content
        },
        link: {
          enabled: false,
          href: "",
          target: "_self",
          type: "internal",
        },
      },
    },
    {
      description: "[Example 2 description]",
      code: {
        // Second example
      },
    },
  ],

  // Common mistakes to avoid (helps AI generate correctly)
  commonMistakes: [
    {
      wrong: {
        // Example of WRONG usage
      },
      reason: "[Why this is wrong]",
      correct: {
        // Example of CORRECT usage
      },
    },
  ],

  // Related elements that work well together
  relatedElements: ["[related-type-1]", "[related-type-2]"],
};
```

---

### Step 1.5: Import Frontend AI Instructions (If Available)

**NEW**: If a corresponding `.instructions.md` file exists in the frontend repository, you should import those AI-specific instructions to ensure consistency and comprehensive AI guidance.

#### Check for Frontend Instructions

Look for: `/digitalsite-custom-builder-frontend/src/components/figma-ui/{ElementName}/{element}.instructions.md`

**Available frontend instruction files** (as of 2025-01):
- `Button/button.instructions.md` ✅
- `Text/text.instructions.md` ✅
- `Image/image.instructions.md` ✅
- `Icon/icon.instructions.md` ✅
- `Divider/divider.instructions.md` ✅
- `Video/video.instructions.md` ✅

#### Extract and Adapt Instructions

When a frontend instruction file exists, follow these steps:

1. **Read the frontend file** and identify these key sections:
   - **Overview**: Type, purpose, has link, has children
   - **AI JSON Structure**: Complete example with all required fields
   - **Properties Table**: Property, type, options, default values
   - **AI Generation Rules**: Required fields list
   - **Common Mistakes**: Wrong ❌ vs Correct ✅ examples
   - **Common Use Cases**: 3-5 complete JSON examples
   - **Notes**: Additional context

2. **Adapt for backend AI consumption**:
   - ✅ **Keep**: All AI-focused guidance, rules, examples, and mistakes
   - ❌ **Remove**: React/component implementation details, TypeScript interfaces, file import paths
   - ✅ **Keep**: Default values, theme properties, styles guidance
   - ❌ **Remove**: Frontend-specific notes about Tiptap, Next.js Image, component props

3. **Convert to inline markdown** in the `aiInstructions` field:

```typescript
export const [elementName]Element: ElementDefinition = {
  type: "[element-type]",
  description: "[description]",

  // ... schema definition ...

  aiInstructions: `
# {Element} Element AI Instructions

## Overview
- **Type**: '{type}'
- **Purpose**: [description]
- **Has Link**: [Yes/No]
- **Has Children**: [Yes/No]

## REQUIRED FIELDS (MUST always be present)

Every {element} element MUST include ALL of these fields:

1. **id** - Format: '{type}-{timestamp}-{random}'
2. **type** - Literal '{type}'
3. **content** - Object with [list required content fields]
4. **props** - Object with [list required props]
5. **styles** - Object with [minimum required styles]
6. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type' (if element supports links)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| props.{prop1} | {default1} |
| props.{prop2} | {default2} |
| ... | ... |

(Copy the full properties table from frontend instructions)

## COMMON MISTAKES

❌ **WRONG**: [Description of mistake 1]
{
  // wrong example
}

✅ **CORRECT**: [Description of fix]
{
  // correct example
}

---

❌ **WRONG**: [Description of mistake 2]
{
  // wrong example
}

✅ **CORRECT**: [Description of fix]
{
  // correct example
}

(Include 3-5 common mistakes from frontend instructions)

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - List theme color names: 'buttonColor', 'textColor', 'borderColor', etc.
   - Resolved at render time from theme
   - Example: { "backgroundColor": "buttonColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "backgroundColor": "#3b82f6" }

**Note**: Theme properties work for ANY color property, not just backgroundColor/color.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, color, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

## [ELEMENT-SPECIFIC GUIDELINES]

(Add any element-specific guidance from frontend instructions)
- For Button: Content guidelines, size guidelines
- For Text: HTML content support, text hierarchy
- For Image: Accessibility requirements, shape usage
- For Icon: Dual mode (icon vs emoji)
- For Video: Content type (local vs url), autoplay rules
- For Divider: Border style options

## USE CASE EXAMPLES

### Example 1: [Scenario 1]
{
  "id": "{type}-1234567890-abc",
  "type": "{type}",
  // ... complete JSON from frontend instructions
}

### Example 2: [Scenario 2]
{
  // ... complete JSON from frontend instructions
}

### Example 3: [Scenario 3]
{
  // ... complete JSON from frontend instructions
}

### Example 4: [Scenario 4]
{
  // ... complete JSON from frontend instructions
}

(Include all 3-5 use case examples from frontend instructions)

## NOTES

- ID format: '{type}-{timestamp}-{random}' (auto-generated)
- [Additional notes from frontend instructions]
  `,

  createDefault: (overrides = {}) => ({
    // ... default implementation
  }),
};
```

#### Key Sections to Include

Based on analysis of existing frontend instructions, **EVERY element must include these 7 sections**:

1. **Overview** (4 properties)
   - Type
   - Purpose
   - Has Link (Yes/No)
   - Has Children (Yes/No)

2. **REQUIRED FIELDS** (Critical!)
   - List ALL required fields with numbering
   - Emphasize field completeness
   - Include the "CRITICAL" note about default values

3. **DEFAULT VALUES** (Table format)
   - Complete property-to-default mapping
   - Use markdown table format
   - Include ALL props, not just common ones

4. **COMMON MISTAKES** (3-5 examples)
   - Use ❌ and ✅ symbols
   - Show wrong vs correct code examples
   - Separate with `---` horizontal rules

5. **THEME PROPERTIES** (Color guidance)
   - Explain theme property names
   - Show when to use theme vs hex
   - Note that theme works for ANY color property

6. **STYLES OBJECT** (CSS flexibility)
   - State "accepts ANY valid CSS property"
   - Emphasize units requirement
   - List common style categories

7. **USE CASE EXAMPLES** (4+ examples)
   - Complete, valid JSON for each
   - Cover different scenarios
   - Use real-world contexts

#### Benefits of This Approach

✅ **Consistency**: Frontend and backend use same AI instructions
✅ **Completeness**: No missing fields or partial objects
✅ **Error Prevention**: Common mistakes section prevents issues proactively
✅ **Quality**: AI generates better, more realistic elements
✅ **Maintenance**: Single source of truth (frontend) drives backend

#### Example: Button Element

See `/src/utils/ai-generation/ui-elements/essentials/button.element.ts` for a complete example of imported frontend instructions. The button element now has:
- 200+ lines of comprehensive AI instructions (vs 10 lines before)
- 7 required field definitions
- 4 common mistakes with wrong/correct examples
- Complete default values table
- Theme properties guidance
- 4 use case examples (Primary CTA, Secondary, Internal Link, External Link)

**Result**: Dramatic improvement in AI generation quality and significant reduction in validation errors.

---

### Step 2: Register Element in Registry

Open: `src/utils/ai-generation/ui-elements/registry.ts`

Add import and registration:

```typescript
// Add import at top
import { [elementName]Element } from "./definitions/[element-name]";

// Add to ELEMENT_REGISTRY object
export const ELEMENT_REGISTRY: Record<string, ElementDefinition> = {
  // ... existing elements
  "[element-type]": [elementName]Element,
};
```

**Example:**
```typescript
import { countdownTimerElement } from "./definitions/countdown-timer";

export const ELEMENT_REGISTRY: Record<string, ElementDefinition> = {
  text: textElement,
  button: buttonElement,
  image: imageElement,
  "countdown-timer": countdownTimerElement,  // ← New element
};
```

---

### Step 3: Update Element Type Validation

Open: `src/utils/ai-generation/prompt-builder/index.ts`

Update the `ELEMENT_TYPE_VALIDATION` constant (around line 12-42):

#### 3A. Add to Valid Types List

```typescript
const ELEMENT_TYPE_VALIDATION = `
🚨🚨🚨 CRITICAL: VALID ELEMENT TYPES ONLY 🚨🚨🚨

Use ONLY these 25 element types (any other type will cause VALIDATION FAILURE):

**Essentials:** text, button, divider
**Media:** image, video, icon, media, media-with-text, embed
**Forms:** form, form-input, form-select, form-checkbox, form-phonenumber, form-datepicker, form-number, form-message
**Quizzes:** quiz, answer
**Content:** faq, faq-item, comparison-chart
**Advanced:** webinar
**[Your Category]:** [element-type]  ← Add your element here

...
`;
```

#### 3B. Add Quick Reference (if needed)

If your element replaces a common pattern, add a reference:

```typescript
**Quick Reference - How to Achieve Common Patterns:**
• Headlines? → Use "text" with size: "xl" and format: {bold: true}
• Countdown/urgency? → Use "countdown-timer" with endDate  ← Add reference
• Testimonials? → Use "media-with-text" with customer photo + quote
```

---

### Step 4: Test Your New Element

#### 4A. Build the Project

```bash
npm run build
```

If build succeeds, your element is properly registered!

#### 4B. Test AI Generation

Create a test request that should use your new element:

```json
{
  "workspaceSlug": "test-workspace",
  "funnelType": "Sales",
  "businessDescription": "A sales funnel with [scenario where your element should be used]. [Mention keywords that should trigger your element type].",
  "industry": "test",
  "targetAudience": "test users"
}
```

#### 4C. Verify Output

Check that:
1. ✅ AI generates your new element type correctly
2. ✅ All required fields are present
3. ✅ Props match your schema
4. ✅ Content is specific (not placeholder text)
5. ✅ No validation errors occur

---

## 📝 Detailed Element Specification Guide

### Props Structure

Define props that control the element's appearance and behavior:

```typescript
props: {
  type: "object",
  properties: {
    // SIZE (optional but recommended for consistency)
    size: {
      type: "string",
      enum: ["sm", "md", "lg", "xl"],
      description: "Element size (controls font-size, padding, spacing)",
    },

    // ALIGNMENT (for text-based elements)
    align: {
      type: "string",
      enum: ["left", "center", "right"],
      description: "Text/content alignment",
    },

    // BORDER RADIUS (for visual consistency)
    borderRadius: {
      type: "string",
      enum: ["NONE", "SOFT", "ROUNDED"],
      description: "Corner rounding (UPPERCASE required)",
    },

    // Add element-specific props
    [yourProp]: {
      type: "[string|number|boolean|object]",
      description: "[What this prop does]",
    },
  },
},
```

#### ⚠️ Important Prop Rules:

1. **Size enum**: Always lowercase (`"sm"`, `"md"`, `"lg"`, `"xl"`)
2. **borderRadius enum**: Always UPPERCASE (`"NONE"`, `"SOFT"`, `"ROUNDED"`)
3. **align enum**: Always lowercase (`"left"`, `"center"`, `"right"`)
4. **Never use props to control padding/fontSize** if you have a `size` prop

---

### Styles Structure

Styles are CSS-in-JS properties:

```typescript
styles: {
  type: "object",
  description: "CSS-in-JS styles for custom appearance",
  properties: {
    // Colors
    backgroundColor: { type: "string", description: "Background color (hex: #RRGGBB)" },
    color: { type: "string", description: "Text/foreground color (hex: #RRGGBB)" },
    borderColor: { type: "string", description: "Border color (hex: #RRGGBB)" },

    // Spacing
    margin: { type: "string", description: "Margin (e.g., '20px 0')" },
    marginTop: { type: "string" },
    marginBottom: { type: "string" },
    marginLeft: { type: "string" },
    marginRight: { type: "string" },
    padding: { type: "string", description: "Padding (e.g., '15px 20px')" },

    // Borders
    borderWidth: { type: "string", description: "Border width (e.g., '2px')" },
    borderStyle: {
      type: "string",
      enum: ["solid", "dashed", "dotted", "none"],
      description: "Border style (lowercase required)"
    },

    // Add element-specific styles
  },
},
```

#### ⚠️ Important Style Rules:

1. **Colors**: Always use hex format (`#RRGGBB`)
2. **Units**: Always include units (`20px`, `1.5em`, `100%`)
3. **borderStyle**: Always lowercase
4. **Avoid**: Don't use `fontSize` or `padding` in styles if controlled by `size` prop

---

### Content Structure

Define the actual content/data for the element:

```typescript
content: {
  type: "object",
  required: ["[required-field-1]", "[required-field-2]"],
  properties: {
    // For text content
    text: {
      type: "string",
      description: "The actual text to display (NEVER use 'Text' as placeholder)",
    },

    // For images
    src: {
      type: "string",
      description: "Image source (use data URI placeholder)",
      default: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E",
    },
    alt: {
      type: "string",
      description: "Image alt text (describe what the image shows)",
    },

    // For rich text/formatting
    format: {
      type: "object",
      properties: {
        bold: { type: "boolean" },
        italic: { type: "boolean" },
        underline: { type: "boolean" },
      },
    },

    // Add element-specific content fields
  },
},
```

#### ⚠️ Important Content Rules:

1. **NEVER use placeholder text**: Not "Text", "Button", "Email", "Image"
2. **Images**: Always use the data URI placeholder for `src`
3. **Alt text**: Must describe the actual image content
4. **Be specific**: "Shop Viral Deals Now" NOT "Click Here"

---

### Link Structure (Standard for All Elements)

Every element has an optional link:

```typescript
link: {
  type: "object",
  required: ["enabled", "href", "target", "type"],
  properties: {
    enabled: {
      type: "boolean",
      description: "Whether the element has a link"
    },
    href: {
      type: "string",
      description: "Link destination (URL or internal path)"
    },
    target: {
      type: "string",
      enum: ["_self", "_blank"],
      description: "How to open the link (lowercase required)"
    },
    type: {
      type: "string",
      enum: ["internal", "external"],
      description: "Link type (lowercase required)"
    },
  },
},
```

---

## 🎨 Image/Icon Assets

If your element uses images or icons, use the **standard data URI placeholder**:

```typescript
"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E"
```

This creates a gray placeholder rectangle that can be replaced by the frontend.

### For Different Sizes:

- **Square**: `width='600' height='600'`
- **Landscape**: `width='800' height='600'`
- **Portrait**: `width='600' height='800'`
- **Wide**: `width='1200' height='400'`
- **Icon**: `width='64' height='64'`

---

## 📚 Real Examples from Existing Elements

### Example 1: Simple Element (Text)

```typescript
export const textElement: ElementDefinition = {
  type: "text",
  description: "Display text content with various sizes and formatting",
  useCases: [
    "Headlines and titles",
    "Body paragraphs",
    "Subheadings",
    "Captions and labels",
  ],
  schema: {
    type: "object",
    required: ["id", "type", "props", "styles", "content", "link"],
    properties: {
      id: { type: "string" },
      type: { type: "string", enum: ["text"] },
      props: {
        type: "object",
        properties: {
          size: {
            type: "string",
            enum: ["sm", "md", "lg", "xl"],
          },
          align: {
            type: "string",
            enum: ["left", "center", "right"],
          },
        },
      },
      styles: {
        type: "object",
        properties: {
          color: { type: "string" },
          backgroundColor: { type: "string" },
          margin: { type: "string" },
          padding: { type: "string" },
        },
      },
      content: {
        type: "object",
        required: ["text"],
        properties: {
          text: {
            type: "string",
            description: "The text to display (be specific, not 'Text')",
          },
          format: {
            type: "object",
            properties: {
              bold: { type: "boolean" },
              italic: { type: "boolean" },
              underline: { type: "boolean" },
            },
          },
        },
      },
      link: { /* standard link object */ },
    },
  },
  examples: [
    {
      description: "Large bold headline for landing page",
      code: {
        id: "text-1234567890-abc",
        type: "text",
        props: {
          size: "xl",
          align: "center",
        },
        styles: {
          color: "#1F2937",
          marginBottom: "20px",
        },
        content: {
          text: "Discover Viral Products Before They Sell Out",
          format: {
            bold: true,
            italic: false,
            underline: false,
          },
        },
        link: {
          enabled: false,
          href: "",
          target: "_self",
          type: "internal",
        },
      },
    },
  ],
  commonMistakes: [
    {
      wrong: {
        content: { text: "Text" },
      },
      reason: "Using placeholder text instead of specific content",
      correct: {
        content: { text: "Get 50% Off Your First Order Today" },
      },
    },
  ],
  relatedElements: ["button", "image", "divider"],
};
```

### Example 2: Complex Element (Form)

```typescript
export const formElement: ElementDefinition = {
  type: "form",
  description: "Multi-field form for capturing user data",
  useCases: [
    "Lead capture forms",
    "Contact forms",
    "Registration forms",
    "Survey forms",
  ],
  schema: {
    type: "object",
    required: ["id", "type", "props", "styles", "content", "link"],
    properties: {
      id: { type: "string" },
      type: { type: "string", enum: ["form"] },
      props: {
        type: "object",
        properties: {
          borderRadius: {
            type: "string",
            enum: ["NONE", "SOFT", "ROUNDED"],
          },
        },
      },
      styles: {
        type: "object",
        properties: {
          backgroundColor: { type: "string" },
          padding: { type: "string" },
          borderColor: { type: "string" },
          borderWidth: { type: "string" },
        },
      },
      content: {
        type: "object",
        required: ["submitButtonText", "fields"],
        properties: {
          submitButtonText: {
            type: "string",
            description: "CTA text for submit button (be specific)",
          },
          fields: {
            type: "array",
            description: "Array of form field objects",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["form-input", "form-select", "form-checkbox"] },
                // ... field properties
              },
            },
          },
        },
      },
      link: { /* standard link object */ },
    },
  },
  examples: [
    {
      description: "Email capture form with name and email fields",
      code: {
        id: "form-1234567890-xyz",
        type: "form",
        props: {
          borderRadius: "SOFT",
        },
        styles: {
          backgroundColor: "#FFFFFF",
          padding: "30px",
          borderColor: "#E5E7EB",
          borderWidth: "1px",
        },
        content: {
          submitButtonText: "Get My VIP Access",
          fields: [
            {
              id: "form-input-1234567890-001",
              type: "form-input",
              props: { size: "md" },
              content: {
                label: "What's Your Name?",
                placeholder: "Enter your first name",
                required: true,
              },
            },
            {
              id: "form-input-1234567890-002",
              type: "form-input",
              props: { size: "md" },
              content: {
                label: "Best Email for Daily Deals?",
                placeholder: "you@example.com",
                required: true,
              },
            },
          ],
        },
        link: {
          enabled: false,
          href: "",
          target: "_self",
          type: "internal",
        },
      },
    },
  ],
  commonMistakes: [
    {
      wrong: {
        content: {
          submitButtonText: "Submit",
          fields: [
            { content: { label: "Email" } },
          ],
        },
      },
      reason: "Generic labels and button text",
      correct: {
        content: {
          submitButtonText: "Start My Free Trial",
          fields: [
            { content: { label: "What's your best email?" } },
          ],
        },
      },
    },
  ],
  relatedElements: ["form-input", "form-select", "form-checkbox", "button"],
};
```

---

## 🚨 Common Pitfalls to Avoid

### 1. Wrong Enum Casing

❌ **WRONG:**
```typescript
props: {
  size: "MD",              // Should be lowercase
  borderRadius: "soft",    // Should be UPPERCASE
}
```

✅ **CORRECT:**
```typescript
props: {
  size: "md",              // lowercase
  borderRadius: "SOFT",    // UPPERCASE
}
```

### 2. Placeholder Text

❌ **WRONG:**
```typescript
content: {
  text: "Text",
  buttonLabel: "Button",
  placeholder: "Email",
}
```

✅ **CORRECT:**
```typescript
content: {
  text: "Join 50,000+ Trendsetters Getting Exclusive Deals",
  buttonLabel: "Get My VIP Access Now",
  placeholder: "Enter your best email address",
}
```

### 3. Missing Data URI for Images

❌ **WRONG:**
```typescript
content: {
  src: "",                              // Empty
  src: "https://placehold.co/800x600", // External URL
}
```

✅ **CORRECT:**
```typescript
content: {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E",
  alt: "Customer unboxing viral product with excitement",
}
```

### 4. Overriding Size Prop with Styles

❌ **WRONG:**
```typescript
props: { size: "lg" },
styles: {
  fontSize: "20px",    // Don't override size prop
  padding: "15px 30px", // Don't override size prop
}
```

✅ **CORRECT:**
```typescript
props: { size: "lg" },
styles: {
  backgroundColor: "#FF4500",  // Only colors and margins
  color: "#FFFFFF",
  marginBottom: "20px",
}
```

---

## 🤖 AI Integration Instructions

When you provide element specifications to an AI Agent, use this format:

### Prompt Template:

```
I need to add a new UI element to the AI funnel builder system.

**Element Type:** [element-type-name]
**Category:** [Essentials|Media|Forms|Quizzes|Content|Advanced|Other]
**Description:** [What this element does]

**Use Cases:**
- [Use case 1]
- [Use case 2]
- [Use case 3]

**Props:**
- [prop1]: [type] - [description]
- [prop2]: [type] - [description]
- ...

**Content Fields:**
- [field1]: [type] (required/optional) - [description]
- [field2]: [type] (required/optional) - [description]
- ...

**Examples:**
1. [Example scenario 1]
   [Describe what the element should look like]

2. [Example scenario 2]
   [Describe what the element should look like]

**Related Elements:** [element1], [element2]

**Common Mistakes:**
- [Mistake 1 to avoid]
- [Mistake 2 to avoid]

Please follow the guide in `src/utils/ai-generation/ui-elements/ADD_NEW_ELEMENT_GUIDE.md` to:
1. Create the element definition file
2. Register it in the registry
3. Update the element type validation
4. Test the integration

Provide the complete TypeScript code for the element definition.
```

---

## 📋 Pre-Flight Checklist

Before considering your new element complete:

- [ ] Element definition file created in `definitions/`
- [ ] **Checked for frontend instructions file** (Step 1.5)
- [ ] **Imported comprehensive AI instructions** from frontend (if available)
- [ ] **All 7 required sections included** in aiInstructions:
  - [ ] Overview (Type, Purpose, Has Link, Has Children)
  - [ ] REQUIRED FIELDS (numbered list with CRITICAL note)
  - [ ] DEFAULT VALUES (complete table)
  - [ ] COMMON MISTAKES (3-5 wrong/correct pairs with ❌ ✅)
  - [ ] THEME PROPERTIES (color guidance)
  - [ ] STYLES OBJECT (CSS flexibility + units requirement)
  - [ ] USE CASE EXAMPLES (4+ complete JSON examples)
- [ ] Element registered in `registry.ts`
- [ ] Element type added to `ELEMENT_TYPE_VALIDATION` in prompt-builder
- [ ] Element category listed (Essentials, Media, Forms, etc.)
- [ ] Quick reference added (if replaces common pattern)
- [ ] All enums use correct casing (size: lowercase, borderRadius: UPPERCASE)
- [ ] Examples include specific, non-placeholder content
- [ ] Common mistakes section documents pitfalls
- [ ] Related elements listed
- [ ] Data URI placeholder used for images
- [ ] `npm run build` succeeds without errors
- [ ] Test generation includes the new element
- [ ] Generated element validates successfully

---

## 🎓 Learning from Existing Elements

Review these files for complete, production-ready examples:

- **Simple elements**: `definitions/text.ts`, `definitions/button.ts`, `definitions/divider.ts`
- **Media elements**: `definitions/image.ts`, `definitions/video.ts`, `definitions/media-with-text.ts`
- **Interactive elements**: `definitions/form.ts`, `definitions/quiz.ts`
- **Content elements**: `definitions/faq.ts`, `definitions/comparison-chart.ts`
- **Advanced elements**: `definitions/webinar.ts`

---

## 🔄 Maintenance

### When to Update Elements

Update element definitions when:
- Frontend adds new props or content fields
- Common mistakes are discovered during testing
- New use cases emerge
- Related elements are added/removed

### Versioning

If making breaking changes to an element:
1. Consider creating a new element type (e.g., `button-v2`)
2. Deprecate the old element gradually
3. Update all prompts to prefer the new version
4. Document migration path in this guide

---

## 📞 Support

If you encounter issues:

1. **Build errors**: Check TypeScript types and imports
2. **AI not using element**: Add more prominent examples and use cases
3. **Validation errors**: Review enum casing and required fields
4. **Placeholder text**: Add to `commonMistakes` section

---

## 🎉 Success Criteria

Your element is successfully integrated when:

✅ `npm run build` succeeds
✅ AI generates the element when contextually appropriate
✅ Generated elements pass validation
✅ Content is specific and relevant (no placeholders)
✅ Props and styles match schema exactly
✅ Element works well with related elements

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
**Maintainer:** Development Team