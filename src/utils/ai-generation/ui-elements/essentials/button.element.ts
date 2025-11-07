import { z } from 'zod'
import { ElementDefinition, LinkSchema, FormatSchema } from '../types'

/**
 * Button Element Schema
 * Matches the exact JSON structure from frontend ButtonElement
 */
export const ButtonElementSchema = z.object({
  id: z.string(),
  type: z.literal('button'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg', 'xl']),
    align: z.enum(['left', 'center', 'right']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    format: FormatSchema,
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type ButtonElement = z.infer<typeof ButtonElementSchema>

export const ButtonElementDefinition: ElementDefinition = {
  type: 'button',
  name: 'Button',
  category: 'Essentials',
  description: 'A clickable button element with customizable appearance and link functionality',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['button'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Button text' },
        },
        required: ['label'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
          align: { type: 'string', enum: ['left', 'center', 'right'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
          format: {
            type: 'object',
            properties: {
              bold: { type: 'boolean' },
              italic: { type: 'boolean' },
              underline: { type: 'boolean' },
              strikethrough: { type: 'boolean' },
            },
            required: ['bold', 'italic', 'underline', 'strikethrough'],
          },
        },
        required: ['size', 'align', 'borderRadius', 'format'],
      },
      styles: { type: 'object' },
      link: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          href: { type: 'string' },
          target: { type: 'string', enum: ['_self', '_blank'] },
          type: { type: 'string', enum: ['internal', 'external'] },
        },
        required: ['enabled', 'href', 'target', 'type'],
      },
    },
    required: ['id', 'type', 'content', 'props', 'styles', 'link'],
  },

  zodSchema: ButtonElementSchema,

  examples: [
    {
      id: 'button-1730000000000-abc123',
      type: 'button',
      content: {
        label: 'Get Started',
      },
      props: {
        size: 'lg',
        align: 'center',
        borderRadius: 'ROUNDED',
        format: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        },
      },
      styles: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        padding: '12px 24px',
        border: 'none',
      },
      link: {
        enabled: true,
        href: '/signup',
        target: '_self',
        type: 'internal',
      },
    },
  ],

  aiInstructions: `
# Button Element AI Instructions

## Overview
- **Type**: 'button'
- **Purpose**: Call-to-action button with link support
- **Has Link**: Yes
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every button element MUST include ALL of these fields:

1. **id** - Format: 'button-{timestamp}-{random}' (e.g., 'button-1234567890-abc')
2. **type** - Literal 'button'
3. **content** - Object with 'label' property
4. **props** - Object with 'size', 'align', 'borderRadius', 'format'
5. **props.format** - Object with ALL 4 booleans: 'bold', 'italic', 'underline', 'strikethrough'
6. **styles** - Object with 'color' and 'backgroundColor' (minimum required)
7. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type'

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| props.size | 'md' |
| props.align | 'center' |
| props.borderRadius | 'SOFT' |
| props.format.bold | false |
| props.format.italic | false |
| props.format.underline | false |
| props.format.strikethrough | false |
| styles.color | 'buttonTextColor' |
| styles.backgroundColor | 'buttonColor' |
| link.enabled | false |
| link.href | '' |
| link.target | '_self' |
| link.type | 'internal' |

## COMMON MISTAKES

❌ **WRONG**: Missing format properties
{
  "format": { "bold": true }
}

✅ **CORRECT**: All format properties present
{
  "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
}

---

❌ **WRONG**: Spacing without units
{
  "styles": { "marginTop": 16 }
}

✅ **CORRECT**: Spacing with units
{
  "styles": { "marginTop": "16px" }
}

---

❌ **WRONG**: Omitting link object
{
  "content": {...},
  "props": {...},
  "styles": {...}
}

✅ **CORRECT**: Link object always included
{
  "content": {...},
  "props": {...},
  "styles": {...},
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

---

❌ **WRONG**: Incomplete link object
{
  "link": { "enabled": false }
}

✅ **CORRECT**: All link properties present
{
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'buttonColor', 'buttonTextColor', 'textColor', 'borderColor'
   - Resolved at render time from theme
   - Example: { "backgroundColor": "buttonColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "backgroundColor": "#3b82f6" }

**Note**: Theme properties work for ANY color property, not just backgroundColor/color.
Example: { "borderColor": "buttonColor" } is valid.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, color, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

## CONTENT GUIDELINES

- Use **action-oriented text** in the label (e.g., "Get Started", "Learn More", "Sign Up")
- **Be specific**: "Shop Viral Deals Now" NOT "Click Here"
- **Avoid generic text**: NOT "Button" or "Submit"

## SIZE GUIDELINES

- **xl**: Hero CTAs, most important actions
- **lg**: Primary CTAs, main conversions
- **md**: Secondary actions, normal buttons
- **sm**: Tertiary actions, less important buttons

## USE CASE EXAMPLES

### Example 1: Primary CTA Button
{
  "id": "button-1234567890-abc",
  "type": "button",
  "content": { "label": "Get Started" },
  "props": {
    "size": "lg",
    "align": "center",
    "borderRadius": "SOFT",
    "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "buttonTextColor",
    "backgroundColor": "buttonColor"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 2: Secondary Outline Button
{
  "id": "button-1234567891-def",
  "type": "button",
  "content": { "label": "Learn More" },
  "props": {
    "size": "md",
    "align": "center",
    "borderRadius": "SOFT",
    "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "textColor",
    "backgroundColor": "transparent",
    "borderWidth": "1px",
    "borderColor": "borderColor",
    "borderStyle": "solid"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 3: Internal Navigation Link
{
  "id": "button-1234567892-ghi",
  "type": "button",
  "content": { "label": "Next" },
  "props": {
    "size": "md",
    "align": "center",
    "borderRadius": "SOFT",
    "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "buttonTextColor",
    "backgroundColor": "buttonColor"
  },
  "link": { "enabled": true, "href": "/next-page", "target": "_self", "type": "internal" }
}

### Example 4: External Link Button
{
  "id": "button-1234567893-jkl",
  "type": "button",
  "content": { "label": "Visit Site" },
  "props": {
    "size": "md",
    "align": "center",
    "borderRadius": "SOFT",
    "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "buttonTextColor",
    "backgroundColor": "buttonColor"
  },
  "link": { "enabled": true, "href": "https://example.com", "target": "_blank", "type": "external" }
}

## NOTES

- ID format: 'button-{timestamp}-{random}' (auto-generated)
- Buttons are typically center aligned
- Use ROUNDED or SOFT borderRadius for modern look
- Primary buttons should use theme colors for consistency
- Secondary buttons can use outline styles with transparent background
- Always provide meaningful href when link is enabled
  `,

  createDefault: (overrides = {}) => ({
    id: `button-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'button',
    content: {
      label: 'Click Here',
    },
    props: {
      size: 'md',
      align: 'center',
      borderRadius: 'SOFT',
      format: {
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
      },
    },
    styles: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '10px 20px',
      border: 'none',
    },
    link: {
      enabled: true,
      href: '#',
      target: '_self',
      type: 'internal',
    },
    ...overrides,
  }),
}
