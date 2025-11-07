import { z } from 'zod'
import { ElementDefinition, IconContentSchema } from '../types'

/**
 * FAQ Item Element Schema
 * Matches the exact JSON structure from frontend FAQItemElement
 * Used in FAQ elements
 */
export const FAQItemElementSchema = z.object({
  id: z.string(),
  type: z.literal('faq-item'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // Two TextElements: title (question) and content (answer)
  icon: IconContentSchema,
  props: z.object({
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    openByDefault: z.boolean(),
    showIcon: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FAQItemElement = z.infer<typeof FAQItemElementSchema>

export const FAQItemElementDefinition: ElementDefinition = {
  type: 'faq-item',
  name: 'FAQ Item',
  category: 'Informative',
  description: 'A collapsible FAQ item with question and answer text',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['faq-item'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains two TextElements: title (question) and content (answer)',
        items: { type: 'object' },
      },
      icon: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['icon', 'emoji'] },
          value: { type: 'string' },
        },
        required: ['type', 'value'],
      },
      props: {
        type: 'object',
        properties: {
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
          openByDefault: { type: 'boolean' },
          showIcon: { type: 'boolean' },
        },
        required: ['borderRadius', 'openByDefault', 'showIcon'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'icon', 'props', 'styles'],
  },

  zodSchema: FAQItemElementSchema,

  examples: [
    {
      id: 'faq-item-1730000000000-abc123',
      type: 'faq-item',
      children: [
        {
          id: 'text-title-1',
          type: 'text',
          content: { label: 'How does shipping work?' },
          props: {
            size: 'md',
            align: 'left',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
        {
          id: 'text-content-1',
          type: 'text',
          content: {
            label: 'We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.',
          },
          props: {
            size: 'sm',
            align: 'left',
            borderRadius: 'NONE',
            format: { bold: false, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#666666', marginTop: '8px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      icon: {
        type: 'emoji',
        value: '📦',
      },
      props: {
        borderRadius: 'SOFT',
        openByDefault: false,
        showIcon: true,
      },
      styles: {
        marginBottom: '12px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
      },
    },
  ],

  aiInstructions: `
# FAQ Item Element AI Instructions

## Overview
- **Type**: 'faq-item'
- **Purpose**: Individual collapsible question/answer item within FAQ container
- **Has Link**: No
- **Has Children**: Yes (EXACTLY 2 TextElements: question and answer ONLY)

## REQUIRED FIELDS (MUST always be present)

Every FAQ item element MUST include ALL of these fields:

1. **id** - Format: 'faq-item-{timestamp}-{random}' (e.g., 'faq-item-1234567890-abc')
2. **type** - Literal 'faq-item'
3. **name** - String identifier (default: 'FAQ Item')
4. **icon** - Object with 'type' and 'value'
5. **props** - Object with ALL 3 properties: 'borderRadius', 'openByDefault', 'showIcon'
6. **styles** - Object with spacing and color properties
7. **children** - Array with EXACTLY 2 TextElements (one question, one answer)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'FAQ Item' |
| icon.type | 'icon' |
| icon.value | '' |
| props.borderRadius | 'SOFT' |
| props.openByDefault | false |
| props.showIcon | false |
| styles.backgroundColor | '#F0F0F0' |
| styles.paddingTop | '16px' |
| styles.paddingBottom | '16px' |
| styles.paddingLeft | '16px' |
| styles.paddingRight | '16px' |

## COMMON MISTAKES

❌ **WRONG**: Missing icon object
{
  "type": "faq-item",
  "props": { "borderRadius": "SOFT" }
}

✅ **CORRECT**: Always include icon
{
  "type": "faq-item",
  "icon": { "type": "icon", "value": "" },
  "props": { "borderRadius": "SOFT", "openByDefault": false, "showIcon": false }
}

---

❌ **WRONG**: Incomplete props object
{
  "props": { "borderRadius": "SOFT" }
}

✅ **CORRECT**: All props properties
{
  "props": { "borderRadius": "SOFT", "openByDefault": false, "showIcon": false }
}

---

❌ **WRONG**: Only one TextElement in children
{
  "children": [
    { "type": "text", "content": { "label": "Question and Answer" } }
  ]
}

❌ **WRONG**: More than 2 TextElements in children
{
  "children": [
    { "type": "text", "content": { "label": "<p>Question?</p>" } },
    { "type": "text", "content": { "label": "<p>Answer 1</p>" } },
    { "type": "text", "content": { "label": "<p>Answer 2</p>" } }
  ]
}

✅ **CORRECT**: Exactly 2 TextElements (Question + Answer)
{
  "children": [
    { "type": "text", "content": { "label": "<p>Question?</p>" } },
    { "type": "text", "content": { "label": "<p>Answer.</p>" } }
  ]
}

---

❌ **WRONG**: Spacing without units
{
  "styles": { "paddingTop": 16 }
}

✅ **CORRECT**: Spacing with units
{
  "styles": { "paddingTop": "16px" }
}

## CHILDREN ARRAY STRUCTURE

The children array MUST contain EXACTLY 2 TextElements in this order:

1. **First child**: Question TextElement
   - Type: 'text'
   - Purpose: Display the question
   - Typically left-aligned, may be bold

2. **Second child**: Answer TextElement
   - Type: 'text'
   - Purpose: Display the answer (shown when expanded)
   - Typically left-aligned, regular weight

**IMPORTANT**: Only TWO TextElements are allowed - one for the question, one for the answer. No more, no less.

## ICON OBJECT

The icon object configures optional visual indicator:
- **type**: Either 'icon' or 'emoji'
  - 'icon': Uses icon URL from API
  - 'emoji': Uses emoji character
- **value**: Icon URL or emoji character (empty string if not used)
- **Display controlled by**: props.showIcon boolean

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: padding*, margin*, etc.
- **Borders**: borderRadius, borderWidth, boxShadow, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

## CONTENT GUIDELINES

- Question should be concise and specific
- Answer should be clear and helpful
- ALWAYS include two TextElement children in order:
  1. First: Title TextElement with the question (bold, size: md)
  2. Second: Content TextElement with the answer (regular, size: sm)

## ICON GUIDELINES

Use appropriate emojis for icon that relate to the question:
- Money/pricing: 💰, 💵, 💳
- Shipping: 📦, 🚚, 🌍
- Support: 💬, 📧, 📞
- Security: 🔒, 🛡️, ✅
- Time: ⏰, ⏱️, 📅
- General: ❓, ℹ️, 📝

## DESIGN GUIDELINES

- Set openByDefault to true for the most important/common question (usually first item)
- Set openByDefault to false for all other items
- Set showIcon to true for visual appeal
- Use SOFT or ROUNDED borderRadius for modern look
- Add backgroundColor for subtle card appearance
- Add marginBottom for spacing between items
- Make question text bold and answer text regular
- Use appropriate text colors (dark for question, gray for answer)

## USE CASE EXAMPLES

### Example 1: Basic FAQ Item
{
  "id": "faq-item-1234567890-abc",
  "type": "faq-item",
  "name": "FAQ Item",
  "icon": { "type": "icon", "value": "" },
  "props": {
    "borderRadius": "SOFT",
    "openByDefault": false,
    "showIcon": false
  },
  "styles": {
    "backgroundColor": "#F0F0F0",
    "paddingTop": "16px",
    "paddingBottom": "16px",
    "paddingLeft": "16px",
    "paddingRight": "16px"
  },
  "children": [
    {
      "id": "text-1234567891-def",
      "type": "text",
      "content": { "label": "<p>How does it work?</p>" },
      "props": {
        "size": "md",
        "align": "left",
        "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "#0D1911" }
    },
    {
      "id": "text-1234567892-ghi",
      "type": "text",
      "content": { "label": "<p>It's simple: sign up, configure, and launch.</p>" },
      "props": {
        "size": "md",
        "align": "left",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "textColor" }
    }
  ]
}

### Example 2: FAQ Item with Icon (Open by Default)
{
  "id": "faq-item-1234567893-jkl",
  "type": "faq-item",
  "name": "FAQ Item",
  "icon": { "type": "emoji", "value": "💡" },
  "props": {
    "borderRadius": "ROUNDED",
    "openByDefault": true,
    "showIcon": true
  },
  "styles": {
    "backgroundColor": "#E8F5E9",
    "paddingTop": "20px",
    "paddingBottom": "20px",
    "paddingLeft": "20px",
    "paddingRight": "20px",
    "borderWidth": "1px",
    "borderColor": "#4CAF50"
  },
  "children": [
    {
      "id": "text-1234567894-mno",
      "type": "text",
      "content": { "label": "<p>What makes you different?</p>" },
      "props": {
        "size": "lg",
        "align": "left",
        "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "#2E7D32" }
    },
    {
      "id": "text-1234567895-pqr",
      "type": "text",
      "content": { "label": "<p>We focus on simplicity and excellent customer support.</p>" },
      "props": {
        "size": "md",
        "align": "left",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "#424242" }
    }
  ]
}

## NOTES

- ID format: 'faq-item-{timestamp}-{random}' (auto-generated)
- Children array MUST contain EXACTLY 2 TextElements (question and answer ONLY - no more, no less)
- Icon display is optional and controlled by showIcon prop
- Collapsible behavior: click to expand/collapse answer
- openByDefault controls initial expanded state
- Border radius follows theme patterns: NONE, SOFT, ROUNDED
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
  `,

  createDefault: (overrides = {}) => ({
    id: `faq-item-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'faq-item',
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Your question here?' },
        props: {
          size: 'md',
          align: 'left',
          borderRadius: 'NONE',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
      {
        id: `text-${Date.now() + 1}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Your answer here.' },
        props: {
          size: 'sm',
          align: 'left',
          borderRadius: 'NONE',
          format: { bold: false, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#666666', marginTop: '8px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    icon: {
      type: 'emoji',
      value: '❓',
    },
    props: {
      borderRadius: 'NONE',
      openByDefault: false,
      showIcon: true,
    },
    styles: {
      marginBottom: '10px',
    },
    ...overrides,
  }),
}
