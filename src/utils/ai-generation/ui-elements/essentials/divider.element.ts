import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Divider Element Schema
 * Matches the exact JSON structure from frontend DividerElement
 */
export const DividerElementSchema = z.object({
  id: z.string(),
  type: z.literal('divider'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  props: z.object({
    borderStyle: z.enum(['none', 'solid', 'dashed', 'dotted']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type DividerElement = z.infer<typeof DividerElementSchema>

export const DividerElementDefinition: ElementDefinition = {
  type: 'divider',
  name: 'Divider',
  category: 'Essentials',
  description: 'A horizontal line element for visual separation between content sections',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['divider'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      props: {
        type: 'object',
        properties: {
          borderStyle: { type: 'string', enum: ['none', 'solid', 'dashed', 'dotted'] },
        },
        required: ['borderStyle'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'props', 'styles'],
  },

  zodSchema: DividerElementSchema,

  examples: [
    {
      id: 'divider-1730000000000-abc123',
      type: 'divider',
      props: {
        borderStyle: 'solid',
      },
      styles: {
        borderColor: '#e0e0e0',
        borderWidth: '1px',
        margin: '20px 0',
      },
    },
  ],

  aiInstructions: `
# Divider Element AI Instructions

## Overview
- **Type**: 'divider'
- **Purpose**: Visual separator line with customizable border styles
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every divider element MUST include ALL of these fields:

1. **id** - Format: 'divider-{timestamp}-{random}' (e.g., 'divider-1234567890-abc')
2. **type** - Literal 'divider'
3. **props** - Object with 'borderStyle'
4. **styles** - Object with 'borderColor' and 'borderWidth' (minimum required)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| id | 'divider-{timestamp}-{random}' |
| type | 'divider' |
| props.borderStyle | 'solid' |
| styles.borderColor | 'borderColor' |
| styles.borderWidth | '1px' |

## COMMON MISTAKES

❌ **WRONG**: Mixing styles incorrectly
{
  "styles": { "borderColor": "#cccccc", "marginTop": 16 }
}

✅ **CORRECT**: Spacing always needs units
{
  "styles": { "borderColor": "#cccccc", "marginTop": "16px" }
}

---

❌ **WRONG**: Using number for borderWidth
{
  "styles": { "borderWidth": 1 }
}

✅ **CORRECT**: borderWidth must be string with units
{
  "styles": { "borderWidth": "1px" }
}

---

❌ **WRONG**: Omitting props object
{
  "id": "...", "type": "divider", "styles": {...}
}

✅ **CORRECT**: Always include props
{
  "id": "...", "type": "divider", "props": { "borderStyle": "solid" }, "styles": {...}
}

---

❌ **WRONG**: Missing borderColor or borderWidth
{
  "styles": { "marginTop": "16px" }
}

✅ **CORRECT**: Include borderColor and borderWidth
{
  "styles": { "borderColor": "borderColor", "borderWidth": "1px", "marginTop": "16px" }
}

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'borderColor', 'backgroundColor', 'textColor'
   - Resolved at render time from theme
   - Example: { "borderColor": "borderColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "borderColor": "#3b82f6" }

**Note**: Theme properties work for ANY color property, not just backgroundColor/color.
Example: { "borderColor": "textColor" } is valid.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle (set via props)
- **Effects**: opacity, height, width, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

## CRITICAL: BORDER STYLE OPTIONS

The props.borderStyle prop determines the visual appearance. **4 options available**:
- **'solid'**: Clean, continuous line (most common)
- **'dashed'**: Dashed line for subtle separation
- **'dotted'**: Dotted line for decorative separation
- **'none'**: No visible border (use for spacing only)

## CRITICAL: NO LINK SUPPORT

- Divider elements do NOT have a link object
- Do NOT add link properties to divider elements
- Dividers are purely visual separators without interaction

## USE CASE EXAMPLES

### Example 1: Simple Solid Divider
{
  "id": "divider-1234567890-abc",
  "type": "divider",
  "props": {
    "borderStyle": "solid"
  },
  "styles": {
    "borderColor": "borderColor",
    "borderWidth": "1px"
  }
}

### Example 2: Dashed Divider
{
  "id": "divider-1234567891-def",
  "type": "divider",
  "props": {
    "borderStyle": "dashed"
  },
  "styles": {
    "borderColor": "borderColor",
    "borderWidth": "2px"
  }
}

### Example 3: Dotted Divider with Spacing
{
  "id": "divider-1234567892-ghi",
  "type": "divider",
  "props": {
    "borderStyle": "dotted"
  },
  "styles": {
    "borderColor": "borderColor",
    "borderWidth": "2px",
    "marginTop": "24px",
    "marginBottom": "24px"
  }
}

### Example 4: Thick Divider with Custom Color
{
  "id": "divider-1234567893-jkl",
  "type": "divider",
  "props": {
    "borderStyle": "solid"
  },
  "styles": {
    "borderColor": "#3b82f6",
    "borderWidth": "4px",
    "marginTop": "32px",
    "marginBottom": "32px"
  }
}

## NOTES

- ID format: 'divider-{timestamp}-{random}' (auto-generated)
- Colors: Can use theme colors ('borderColor') or hex codes ('#3b82f6')
- All props properties are required
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- BorderWidth must be STRING with units (e.g., "1px" not 1)
- No content or link support for dividers
- Use 'solid' borderStyle for clean, professional dividers
- Use 'dashed' or 'dotted' for subtle, decorative separation
- Set borderColor to light gray for subtle separation
- Use borderWidth of 1px or 2px (avoid thick dividers unless intentional)
- Add appropriate margin (usually 20px or more) for spacing
- Dividers should be used between major content sections
- Keep it simple - dividers are meant to be unobtrusive
  `,

  createDefault: (overrides = {}) => ({
    id: `divider-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'divider',
    props: {
      borderStyle: 'solid',
    },
    styles: {
      borderColor: '#e0e0e0',
      borderWidth: '1px',
      margin: '20px 0',
    },
    ...overrides,
  }),
}
