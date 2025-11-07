import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * FAQ Element Schema
 * Matches the exact JSON structure from frontend FAQElement
 * Container element with FAQ item children
 */
export const FAQElementSchema = z.object({
  id: z.string(),
  type: z.literal('faq'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  serverId: z.number().nullable(),
  children: z.array(z.any()).optional(), // FAQItemElements
  props: z.record(z.string(), z.unknown()),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FAQElement = z.infer<typeof FAQElementSchema>

export const FAQElementDefinition: ElementDefinition = {
  type: 'faq',
  name: 'FAQ',
  category: 'Informative',
  description: 'A frequently asked questions section with collapsible accordion items',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['faq'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      serverId: { type: ['number', 'null'] },
      children: {
        type: 'array',
        description: 'Contains FAQItemElements',
        items: { type: 'object' },
      },
      props: { type: 'object' },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'serverId', 'props', 'styles'],
  },

  zodSchema: FAQElementSchema,

  examples: [
    {
      id: 'faq-1730000000000-abc123',
      type: 'faq',
      serverId: null,
      children: [
        {
          id: 'faq-item-1',
          type: 'faq-item',
          icon: { type: 'emoji', value: '❓' },
          props: { borderRadius: 'SOFT', openByDefault: false, showIcon: true },
          styles: { marginBottom: '12px' },
          children: [
            {
              id: 'text-title-1',
              type: 'text',
              content: { label: 'What is your refund policy?' },
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
              content: { label: 'We offer a 30-day money-back guarantee on all purchases.' },
              props: {
                size: 'sm',
                align: 'left',
                borderRadius: 'NONE',
                format: { bold: false, italic: false, underline: false, strikethrough: false },
              },
              styles: { color: '#666666' },
              link: { enabled: false, href: '', target: '_self', type: 'external' },
            },
          ],
        },
      ],
      props: {},
      styles: {
        padding: '24px',
      },
    },
  ],

  aiInstructions: `
# FAQ Element AI Instructions

## Overview
- **Type**: 'faq'
- **Purpose**: Container for displaying frequently asked questions in collapsible format
- **Has Link**: No
- **Has Children**: Yes (FAQItemElement array)

## REQUIRED FIELDS (MUST always be present)

Every FAQ element MUST include ALL of these fields:

1. **id** - Format: 'faq-{timestamp}-{random}' (e.g., 'faq-1234567890-abc')
2. **type** - Literal 'faq'
3. **serverId** - Either null or a number (default: null)
4. **props** - Empty object {}
5. **styles** - Object with spacing and color properties
6. **children** - Array of FAQItemElements (at least 1)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| serverId | null |
| props | {} |
| styles.backgroundColor | 'transparent' |
| styles.marginTop | '0px' |
| styles.marginBottom | '0px' |
| styles.marginLeft | '0px' |
| styles.marginRight | '0px' |
| styles.paddingTop | '0px' |
| styles.paddingBottom | '0px' |
| styles.paddingLeft | '0px' |
| styles.paddingRight | '0px' |

## COMMON MISTAKES

❌ **WRONG**: Props is not empty
{
  "props": { "someProp": "value" }
}

✅ **CORRECT**: Props must be empty
{
  "props": {}
}

---

❌ **WRONG**: Missing serverId
{
  "type": "faq",
  "props": {},
  "styles": {}
}

✅ **CORRECT**: Always include serverId
{
  "type": "faq",
  "serverId": null,
  "props": {},
  "styles": {}
}

---

❌ **WRONG**: FAQItem missing icon object
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

❌ **WRONG**: FAQItem children in wrong structure
{
  "children": [
    { "type": "text", "content": { "label": "Question and Answer" } }
  ]
}

✅ **CORRECT**: Two separate TextElements
{
  "children": [
    { "type": "text", "content": { "label": "<p>Question?</p>" } },
    { "type": "text", "content": { "label": "<p>Answer.</p>" } }
  ]
}

## CHILDREN ARRAY STRUCTURE

The children array contains FAQItemElements:

**Each FAQItemElement** has:
- Type: 'faq-item'
- Contains 2 TextElement children: question (title) and answer (content)
- Has icon configuration (optional display)
- Has props: borderRadius, openByDefault, showIcon

**FAQItem Children Order**:
1. First TextElement: Question text
2. Second TextElement: Answer text

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, etc.
- **Spacing**: margin*, padding*, gap, etc.
- **Borders**: borderRadius, boxShadow, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

## FAQ CONTENT GUIDELINES

- Include multiple FAQItemElements as children (typically 4-8 items)
- Each FAQ item should address common customer questions
- Common FAQ topics:
  - Pricing and refunds
  - Shipping and delivery
  - Product features
  - Account management
  - Technical support
  - Security and privacy
- Order questions from most to least common
- Keep answers concise but informative
- First item can have openByDefault: true to guide users

## USE CASE EXAMPLES

### Example 1: Product FAQ
{
  "id": "faq-1234567890-abc",
  "type": "faq",
  "serverId": null,
  "props": {},
  "styles": {
    "backgroundColor": "transparent",
    "marginTop": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "marginRight": "0px",
    "paddingTop": "0px",
    "paddingBottom": "0px",
    "paddingLeft": "0px",
    "paddingRight": "0px"
  },
  "children": [
    {
      "id": "faq-item-1234567891-def",
      "type": "faq-item",
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
          "id": "text-1234567892-ghi",
          "type": "text",
          "content": { "label": "<p>How do I get started?</p>" },
          "props": {
            "size": "md",
            "align": "left",
            "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
          },
          "styles": { "color": "#0D1911" }
        },
        {
          "id": "text-1234567893-jkl",
          "type": "text",
          "content": { "label": "<p>Simply sign up and follow our onboarding guide.</p>" },
          "props": {
            "size": "md",
            "align": "left",
            "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
          },
          "styles": { "color": "textColor" }
        }
      ]
    },
    {
      "id": "faq-item-1234567894-mno",
      "type": "faq-item",
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
          "id": "text-1234567895-pqr",
          "type": "text",
          "content": { "label": "<p>What payment methods do you accept?</p>" },
          "props": {
            "size": "md",
            "align": "left",
            "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
          },
          "styles": { "color": "#0D1911" }
        },
        {
          "id": "text-1234567896-stu",
          "type": "text",
          "content": { "label": "<p>We accept all major credit cards and PayPal.</p>" },
          "props": {
            "size": "md",
            "align": "left",
            "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
          },
          "styles": { "color": "textColor" }
        }
      ]
    }
  ]
}

## NOTES

- ID format: 'faq-{timestamp}-{random}' (auto-generated)
- Children array contains FAQItemElements only
- Each FAQItem has exactly 2 TextElement children (question and answer)
- The props object is always empty {}
- The serverId is used for backend integration (null by default)
- FAQItems are collapsible/expandable accordions
- Icon display is optional per FAQ item
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- This element is perfect for:
  - Product pages
  - Pricing pages
  - Support sections
  - Landing pages
  `,

  createDefault: (overrides = {}) => ({
    id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'faq',
    serverId: null,
    children: [],
    props: {},
    styles: {
      padding: '20px',
    },
    ...overrides,
  }),
}
