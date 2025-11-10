import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Form Element Schema
 * Matches the exact JSON structure from frontend FormElement
 * Container element with form field children
 */
export const FormElementSchema = z.object({
  id: z.string(),
  type: z.literal('form'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // First child: TextElement (title), middle: form fields, last: ButtonElement (submit)
  serverId: z.number().nullable(),
  integration: z.object({
    webhookEnabled: z.boolean(),
    webhookUrl: z.string(),
  }),
  props: z.record(z.string(), z.unknown()),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormElement = z.infer<typeof FormElementSchema>

export const FormElementDefinition: ElementDefinition = {
  type: 'form',
  name: 'Form',
  category: 'Get Responses',
  description: 'A container element for collecting user input with various form fields and a submit button',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'First child is TextElement (title), middle are form fields, last is ButtonElement (submit)',
        items: { type: 'object' },
      },
      serverId: { type: ['number', 'null'] },
      integration: {
        type: 'object',
        properties: {
          webhookEnabled: { type: 'boolean' },
          webhookUrl: { type: 'string' },
        },
        required: ['webhookEnabled', 'webhookUrl'],
      },
      props: { type: 'object' },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'serverId', 'integration', 'props', 'styles'],
  },

  zodSchema: FormElementSchema,

  examples: [
    {
      id: 'form-1730000000000-abc123',
      type: 'form',
      children: [
        {
          id: 'text-title-1',
          type: 'text',
          content: { label: 'Contact Us' },
          props: {
            size: 'xl',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a', marginBottom: '20px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
        {
          id: 'form-input-1',
          type: 'form-input',
          content: { inputType: 'fullname', label: 'Full Name', placeholder: 'Enter your name' },
          props: { size: 'md', mandatory: true, withIcon: false },
          styles: {},
        },
        {
          id: 'form-input-2',
          type: 'form-input',
          content: { inputType: 'email', label: 'Email', placeholder: 'your@email.com' },
          props: { size: 'md', mandatory: true, withIcon: false },
          styles: {},
        },
        {
          id: 'form-input-3',
          type: 'form-message',
          content: { label: 'Message', placeholder: 'Your message here...' },
          props: { size: 'md', mandatory: false, withIcon: false },
          styles: {},
        },
        {
          id: 'button-submit-1',
          type: 'button',
          content: { label: 'Submit' },
          props: {
            size: 'lg',
            align: 'center',
            borderRadius: 'SOFT',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '12px 24px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      serverId: null,
      integration: {
        webhookEnabled: false,
        webhookUrl: '',
      },
      props: {},
      styles: {
        padding: '32px',
        backgroundColor: '#ffffff',
      },
    },
  ],

  aiInstructions: `
# Form Element AI Instructions

## Overview
- **Type**: 'form'
- **Purpose**: Container for collecting user input with form fields and submit button
- **Has Link**: No
- **Has Children**: Yes (MUST have TextElement as first child, form fields in middle, ButtonElement as last child)

## REQUIRED FIELDS (MUST always be present)

Every form element MUST include ALL of these fields:

1. **id** - Format: 'form-{timestamp}-{random}' (e.g., 'form-1234567890-abc')
2. **type** - Literal 'form'
3. **serverId** - Either null or a number (default: null)
4. **integration** - Object with 'webhookEnabled' and 'webhookUrl'
5. **props** - Empty object {}
6. **styles** - Object with at least 'backgroundColor'
7. **children** - Array that MUST start with TextElement (title), end with ButtonElement (submit)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| serverId | null |
| integration.webhookEnabled | false |
| integration.webhookUrl | '' |
| props | {} |
| styles.backgroundColor | 'transparent' |
| children | [TextElement, ...fields, ButtonElement] |

## CHILDREN ARRAY STRUCTURE

The children array MUST follow this order:

1. **First child**: TextElement (form title) - **REQUIRED**
   - Type: 'text'
   - Purpose: Display form heading
   - Default content: "Contact Form"
   - **MANDATORY**: Every form MUST start with a TextElement

2. **Middle children**: Form field elements (MINIMUM 3 REQUIRED)
   - Types: 'form-input', 'form-message', 'form-checkbox', 'form-phonenumber', 'form-select', 'form-datepicker', 'form-number'
   - Purpose: Collect user input
   - Each field has its own structure
   - **MANDATORY**: MINIMUM 3 form fields REQUIRED - choose appropriate fields based on funnel type

3. **Last child**: ButtonElement (submit button) - **REQUIRED**
   - Type: 'button'
   - Purpose: Submit form data
   - Default label: "Submit"
   - **MANDATORY**: Every form MUST end with a ButtonElement

**IMPORTANT**: The first child MUST always be a TextElement and the last child MUST always be a ButtonElement. This structure is non-negotiable.

### ⚠️ CRITICAL: Minimum Form Fields Requirement

**Every form MUST have at LEAST 3 form fields between the TextElement and ButtonElement!**

❌ **NEVER DO THIS** (empty form - CRITICAL ERROR!):
"children": [
  { "type": "text", "content": { "label": "Contact Us" }, ... },
  { "type": "button", "content": { "label": "Submit" }, ... }
]

❌ **NEVER DO THIS** (only 1-2 fields - insufficient!):
"children": [
  { "type": "text", "content": { "label": "Contact Us" }, ... },
  { "type": "form-input", ... },
  { "type": "button", "content": { "label": "Submit" }, ... }
]

✅ **ALWAYS DO THIS** (minimum 3 form fields):
"children": [
  { "type": "text", "content": { "label": "Contact Us" }, ... },
  { "type": "form-input", ... },
  { "type": "form-input", ... },
  { "type": "form-input", ... },
  { "type": "button", "content": { "label": "Submit" }, ... }
]

**This is a CRITICAL requirement. Forms without at least 3 fields are useless and will break the user experience!**

Choose appropriate form fields based on the funnel type:
- Lead generation: name, email, phone
- Contact form: name, email, message
- Newsletter: email, name, preferences
- Registration: fullname, email, password
- Survey: question1, question2, question3

## COMMON MISTAKES

❌ **WRONG**: Missing integration object
{
  "type": "form",
  "props": {},
  "styles": {}
}

✅ **CORRECT**: Always include integration
{
  "type": "form",
  "integration": { "webhookEnabled": false, "webhookUrl": "" },
  "props": {},
  "styles": {}
}

---

❌ **WRONG**: Props is not an empty object
"props": { "someProp": "value" }

✅ **CORRECT**: Props must be empty
"props": {}

---

❌ **WRONG**: Missing children array
{
  "type": "form",
  "props": {},
  "styles": {}
}

✅ **CORRECT**: Always include children
{
  "type": "form",
  "props": {},
  "styles": {},
  "children": [...]
}

---

❌ **WRONG**: Empty form with no form fields (CRITICAL ERROR!)
"children": [
  { "type": "text", "content": { "label": "Sign Up" }, ... },
  { "type": "button", "content": { "label": "Submit" }, ... }
]

❌ **WRONG**: Form with only 1-2 fields (insufficient!)
"children": [
  { "type": "text", "content": { "label": "Contact Us" }, ... },
  { "type": "form-input", "content": { "inputType": "email", "label": "Email" }, ... },
  { "type": "button", "content": { "label": "Send" }, ... }
]

✅ **CORRECT**: Form with MINIMUM 3 form fields
"children": [
  { "type": "text", "content": { "label": "Contact Us" }, ... },
  { "type": "form-input", "content": { "inputType": "fullname", "label": "Name" }, ... },
  { "type": "form-input", "content": { "inputType": "email", "label": "Email" }, ... },
  { "type": "form-message", "content": { "label": "Message", "placeholder": "Your message" }, ... },
  { "type": "button", "content": { "label": "Send" }, ... }
]

**CRITICAL**: Every form MUST have at least 3 form fields. Forms without sufficient fields are useless!

---

❌ **WRONG**: Missing TextElement at start
"children": [
  { "type": "form-input", ... },
  { "type": "button", ... }
]

❌ **WRONG**: Missing ButtonElement at end
"children": [
  { "type": "text", ... },
  { "type": "form-input", ... }
]

❌ **WRONG**: ButtonElement not at the end
"children": [
  { "type": "text", ... },
  { "type": "button", ... },
  { "type": "form-input", ... }
]

❌ **WRONG**: TextElement not at the start
"children": [
  { "type": "form-input", ... },
  { "type": "text", ... },
  { "type": "button", ... }
]

✅ **CORRECT**: TextElement first, form fields middle, ButtonElement last
"children": [
  { "type": "text", "content": { "label": "Form Title" }, ... },
  { "type": "form-input", ... },
  { "type": "button", "content": { "label": "Submit" }, ... }
]

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, color, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

**Colors can be**:
- Theme properties: 'backgroundColor', 'textColor', 'borderColor' (resolved from theme)
- Hex codes: '#FFFFFF', '#000000'
- RGB/RGBA: 'rgba(0, 0, 0, 0.5)'

## USE CASE EXAMPLES

### Example 1: Contact Form
{
  "id": "form-1234567890-abc",
  "type": "form",
  "serverId": null,
  "integration": {
    "webhookEnabled": false,
    "webhookUrl": ""
  },
  "props": {},
  "styles": {
    "backgroundColor": "transparent"
  },
  "children": [
    {
      "id": "text-1234567891-def",
      "type": "text",
      "content": { "label": "Get in Touch" },
      "props": {
        "size": "lg",
        "align": "center",
        "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "#0D1911" }
    },
    {
      "id": "input-1234567892-ghi",
      "type": "form-input",
      "content": { "inputType": "fullname", "label": "Full Name", "placeholder": "Enter your full name" },
      "props": { "size": "md", "mandatory": true, "withIcon": false },
      "styles": {}
    },
    {
      "id": "input-1234567893-jkl",
      "type": "form-input",
      "content": { "inputType": "email", "label": "Email", "placeholder": "your@email.com" },
      "props": { "size": "md", "mandatory": true, "withIcon": false },
      "styles": {}
    },
    {
      "id": "message-1234567894-mno",
      "type": "form-message",
      "content": { "label": "Message", "placeholder": "How can we help you?" },
      "props": { "size": "md", "mandatory": true, "withIcon": false },
      "styles": {}
    },
    {
      "id": "button-1234567895-pqr",
      "type": "button",
      "content": { "label": "Send Message" },
      "props": {
        "size": "md",
        "align": "center",
        "borderRadius": "SOFT",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "buttonTextColor", "backgroundColor": "buttonColor" },
      "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
    }
  ]
}

### Example 2: Newsletter Signup
{
  "id": "form-1234567896-stu",
  "type": "form",
  "serverId": null,
  "integration": {
    "webhookEnabled": true,
    "webhookUrl": "https://example.com/webhook"
  },
  "props": {},
  "styles": {
    "backgroundColor": "#f5f5f5",
    "padding": "24px",
    "borderRadius": "8px"
  },
  "children": [
    {
      "id": "text-1234567897-vwx",
      "type": "text",
      "content": { "label": "Subscribe to Newsletter" },
      "props": {
        "size": "md",
        "align": "center",
        "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "#0D1911" }
    },
    {
      "id": "input-1234567898-yz1",
      "type": "form-input",
      "content": { "inputType": "fullname", "label": "Name", "placeholder": "Your name" },
      "props": { "size": "md", "mandatory": true, "withIcon": false },
      "styles": {}
    },
    {
      "id": "input-1234567899-234",
      "type": "form-input",
      "content": { "inputType": "email", "label": "Email", "placeholder": "your@email.com" },
      "props": { "size": "md", "mandatory": true, "withIcon": false },
      "styles": {}
    },
    {
      "id": "select-1234567900-567",
      "type": "form-select",
      "content": { "label": "Interests", "placeholder": "Select your interests", "options": ["Technology", "Business", "Design", "Marketing"] },
      "props": { "size": "md", "mandatory": false, "withIcon": true },
      "iconContent": { "type": "icon", "value": "ListBulletsIcon" },
      "styles": {}
    },
    {
      "id": "button-1234567901-890",
      "type": "button",
      "content": { "label": "Subscribe" },
      "props": {
        "size": "md",
        "align": "center",
        "borderRadius": "SOFT",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "buttonTextColor", "backgroundColor": "buttonColor" },
      "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
    }
  ]
}

## NOTES

- ID format: 'form-{timestamp}-{random}' (auto-generated)
- **MANDATORY**: First child MUST be TextElement (title), last child MUST be ButtonElement (submit)
- **MANDATORY**: MINIMUM 3 form fields REQUIRED between TextElement and ButtonElement
- Children array structure is non-negotiable: TextElement → minimum 3 form fields → ButtonElement
- Form fields in middle can be any combination of input types: 'form-input', 'form-message', 'form-checkbox', 'form-phonenumber', 'form-select', 'form-datepicker', 'form-number'
- Choose appropriate fields based on funnel type and purpose
- Empty forms or forms with less than 3 fields are NOT acceptable
- The props object is always empty {}
- The serverId is used to link form to backend storage (null by default)
- Webhook integration allows sending form data to external services
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
  `,

  createDefault: (overrides = {}) => ({
    id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form',
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Form Title' },
        props: {
          size: 'lg',
          align: 'center',
          borderRadius: 'NONE',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a', marginBottom: '16px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
      {
        id: `form-input-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'form-input',
        content: { inputType: 'fullname', label: 'Name', placeholder: 'Enter your name' },
        props: { size: 'md', mandatory: true, withIcon: false },
        styles: {},
      },
      {
        id: `form-input-${Date.now() + 1}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'form-input',
        content: { inputType: 'email', label: 'Email', placeholder: 'your@email.com' },
        props: { size: 'md', mandatory: true, withIcon: false },
        styles: {},
      },
      {
        id: `form-message-${Date.now() + 2}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'form-message',
        content: { label: 'Message', placeholder: 'Your message here...' },
        props: { size: 'md', mandatory: false, withIcon: false },
        styles: {},
      },
      {
        id: `button-${Date.now() + 3}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'button',
        content: { label: 'Submit' },
        props: {
          size: 'md',
          align: 'center',
          borderRadius: 'SOFT',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '10px 20px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    serverId: null,
    integration: {
      webhookEnabled: false,
      webhookUrl: '',
    },
    props: {},
    styles: {
      padding: '24px',
    },
    ...overrides,
  }),
}
