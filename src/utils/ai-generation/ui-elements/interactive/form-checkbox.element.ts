import { z } from 'zod'
import { ElementDefinition, LinkSchema } from '../types'

/**
 * FormCheckbox Element Schema
 * Matches the exact JSON structure from frontend FormCheckboxElement
 */
export const FormCheckboxElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-checkbox'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg']),
    mandatory: z.boolean(),
    checkboxShape: z.enum(['square', 'circle']),
  }),
  link: LinkSchema.optional(),
  styles: z.record(z.string(), z.any()), // CSSProperties including textColor and checkboxColor
})

export type FormCheckboxElement = z.infer<typeof FormCheckboxElementSchema>

export const FormCheckboxElementDefinition: ElementDefinition = {
  type: 'form-checkbox',
  name: 'Form Checkbox',
  category: 'Get Responses',
  description: 'A checkbox input field for forms with optional link support in the label',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-checkbox'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string' },
        },
        required: ['label'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg'] },
          mandatory: { type: 'boolean' },
          checkboxShape: { type: 'string', enum: ['square', 'circle'] },
        },
        required: ['size', 'mandatory', 'checkboxShape'],
      },
      link: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          href: { type: 'string' },
          target: { type: 'string', enum: ['_self', '_blank'] },
          type: { type: 'string', enum: ['internal', 'external'] },
        },
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: FormCheckboxElementSchema,

  examples: [
    {
      id: 'form-checkbox-1730000000000-abc123',
      type: 'form-checkbox',
      content: {
        label: 'I agree to the Terms and Conditions',
      },
      props: {
        size: 'md',
        mandatory: true,
        checkboxShape: 'square',
      },
      link: {
        enabled: true,
        href: '/terms',
        target: '_blank',
        type: 'internal',
      },
      styles: {
        marginBottom: '16px',
        textColor: '#1a1a1a',
        checkboxColor: '#007bff',
      },
    },
  ],

  aiInstructions: `
# Form Checkbox Element AI Instructions

## Overview
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Type**: 'form-checkbox'
- **Purpose**: Checkbox input for agreements, confirmations, and boolean selections
- **Has Link**: No (but label can contain a link via link property)
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every checkbox element MUST include ALL of these fields:

1. **id** - Format: 'form-checkbox-{timestamp}-{random}' (e.g., 'form-checkbox-1234567890-abc')
2. **type** - Literal 'form-checkbox'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'label'
5. **props** - Object with 'size', 'mandatory', 'checkboxShape'
6. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type'
7. **styles** - Object with 'color' and 'backgroundColor' (minimum required)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.label | 'I have read and accept the Privacy Policy' |
| props.size | 'md' |
| props.mandatory | false |
| props.checkboxShape | 'square' |
| link.enabled | false |
| link.href | '' |
| link.target | '_self' |
| link.type | 'internal' |
| styles.color | 'textColor' |
| styles.backgroundColor | 'buttonColor' |

## STYLES OBJECT

The styles object is flexible and powerful:
- **Accepts ANY valid CSS property**: backgroundColor, color, borderRadius, boxShadow, opacity, transform, etc.
- **All spacing must have units**: '16px', '1rem', '2em' (not plain numbers)
- **Colors can be**:
  - Theme properties: 'textColor', 'buttonColor', 'borderColor', etc. (resolved from theme)
  - Hex codes: '#3b82f6', '#FFFFFF', '#000000'
  - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
- **Theme properties work for ANY color**, not just backgroundColor/color (e.g., borderColor: 'buttonColor' is valid)

## COMMON MISTAKES

❌ **WRONG**: Missing content properties
"content": {}

✅ **CORRECT**: Label must be present
"content": { "label": "I have read and accept the Privacy Policy" }

---

❌ **WRONG**: Missing props properties
"props": { "size": "md" }

✅ **CORRECT**: All props properties
"props": { "size": "md", "mandatory": false, "checkboxShape": "square" }

---

❌ **WRONG**: Omitting link object
{ "content": {...}, "props": {...}, "styles": {...} }

✅ **CORRECT**: Always include link
{ "content": {...}, "props": {...}, "link": {...}, "styles": {...} }

---

❌ **WRONG**: Incomplete link object
"link": { "enabled": false }

✅ **CORRECT**: All link properties
"link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }

---

❌ **WRONG**: Invalid checkboxShape
"props": { "size": "md", "mandatory": false, "checkboxShape": "rounded" }

✅ **CORRECT**: Valid checkboxShape
"props": { "size": "md", "mandatory": false, "checkboxShape": "square" }

## USE CASE EXAMPLES

### Example 1: Privacy Policy Agreement
{
  "id": "form-checkbox-1234567890-abc",
  "type": "form-checkbox",
  "name": "Form Field",
  "content": {
    "label": "I have read and accept the Privacy Policy"
  },
  "props": {
    "size": "md",
    "mandatory": false,
    "checkboxShape": "square"
  },
  "link": {
    "enabled": false,
    "href": "",
    "target": "_self",
    "type": "internal"
  },
  "styles": {
    "color": "textColor",
    "backgroundColor": "buttonColor"
  }
}

### Example 2: Terms with Link
{
  "id": "form-checkbox-1234567891-def",
  "type": "form-checkbox",
  "name": "Form Field",
  "content": {
    "label": "I agree to the Terms and Conditions"
  },
  "props": {
    "size": "md",
    "mandatory": false,
    "checkboxShape": "square"
  },
  "link": {
    "enabled": true,
    "href": "/terms",
    "target": "_blank",
    "type": "internal"
  },
  "styles": {
    "color": "textColor",
    "backgroundColor": "buttonColor"
  }
}

### Example 3: Mandatory Checkbox (Circle)
{
  "id": "form-checkbox-1234567892-ghi",
  "type": "form-checkbox",
  "name": "Form Field",
  "content": {
    "label": "I consent to receive marketing emails"
  },
  "props": {
    "size": "md",
    "mandatory": true,
    "checkboxShape": "circle"
  },
  "link": {
    "enabled": false,
    "href": "",
    "target": "_self",
    "type": "internal"
  },
  "styles": {
    "color": "textColor",
    "backgroundColor": "buttonColor"
  }
}

### Example 4: Newsletter Subscription
{
  "id": "form-checkbox-1234567893-jkl",
  "type": "form-checkbox",
  "name": "Form Field",
  "content": {
    "label": "Subscribe to our newsletter"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "checkboxShape": "square"
  },
  "link": {
    "enabled": false,
    "href": "",
    "target": "_self",
    "type": "internal"
  },
  "styles": {
    "color": "textColor",
    "backgroundColor": "buttonColor"
  }
}

## NOTES

- ID format: 'form-checkbox-{timestamp}-{random}' (auto-generated)
- checkboxShape: 'square' (rounded corners) or 'circle' (circular)
- link object is always required (even if disabled) - used for making label text clickable
- When link is enabled, the label text becomes clickable
- Colors: Can use theme colors ('textColor', 'buttonColor') or hex codes ('#3b82f6')
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
  `,

  createDefault: (overrides = {}) => ({
    id: `form-checkbox-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-checkbox',
    content: {
      label: 'I agree to the terms',
    },
    props: {
      size: 'md',
      mandatory: false,
      checkboxShape: 'square',
    },
    link: {
      enabled: false,
      href: '',
      target: '_self',
      type: 'external',
    },
    styles: {
      marginBottom: '12px',
      textColor: '#1a1a1a',
      checkboxColor: '#007bff',
    },
    ...overrides,
  }),
}
