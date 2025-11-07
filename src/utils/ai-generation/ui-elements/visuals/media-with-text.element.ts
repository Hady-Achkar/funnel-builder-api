import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * MediaWithText Element Schema
 * Matches the exact JSON structure from frontend MediaWithTextElement
 * Container element with MediaElement and TextElement as children
 */
export const MediaWithTextElementSchema = z.object({
  id: z.string(),
  type: z.literal('media-with-text'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // Array of MediaElement and TextElement
  props: z.object({
    align: z.enum(['left', 'center', 'right']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type MediaWithTextElement = z.infer<typeof MediaWithTextElementSchema>

export const MediaWithTextElementDefinition: ElementDefinition = {
  type: 'media-with-text',
  name: 'Media With Text',
  category: 'Visuals & Media',
  description: 'A container element that combines media (image/emoji/icon) with text in a cohesive layout',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['media-with-text'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains MediaElement and TextElement children',
        items: { type: 'object' },
      },
      props: {
        type: 'object',
        properties: {
          align: { type: 'string', enum: ['left', 'center', 'right'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
        },
        required: ['align', 'borderRadius'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'props', 'styles'],
  },

  zodSchema: MediaWithTextElementSchema,

  examples: [
    {
      id: 'media-with-text-1730000000000-abc123',
      type: 'media-with-text',
      children: [
        {
          id: 'media-child-1',
          type: 'media',
          content: { src: '✨', alt: '' },
          props: { mediaType: 'emoji', size: 'lg', borderRadius: 'NONE' },
          styles: {},
        },
        {
          id: 'text-child-1',
          type: 'text',
          content: { label: 'Premium Feature' },
          props: {
            size: 'lg',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      props: {
        align: 'center',
        borderRadius: 'SOFT',
      },
      styles: {
        padding: '24px',
        backgroundColor: '#f5f5f5',
      },
    },
  ],

  aiInstructions: `
# Media With Text Element AI Instructions

## Overview
- **Type**: 'media-with-text'
- **Purpose**: Container that combines media (image/video/emoji) with text content
- **Has Link**: No
- **Has Children**: Yes (EXACTLY one MediaElement + one TextElement)

## REQUIRED FIELDS (MUST always be present)

Every media-with-text element MUST include ALL of these fields:

1. **id** - Format: 'media-with-text-{timestamp}-{random}'
2. **type** - Literal 'media-with-text'
3. **props** - Object with ALL 2 properties: 'align', 'borderRadius'
4. **styles** - Object with at least 'backgroundColor'
5. **children** - Array with EXACTLY 2 elements: [one MediaElement, one TextElement]

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| props.align | 'center' |
| props.borderRadius | 'SOFT' |
| styles.backgroundColor | 'transparent' |

## CHILDREN STRUCTURE RULES (CRITICAL)

The **children** array has STRICT requirements:

### Requirements:
1. **EXACTLY 2 children** (no more, no less)
2. **First child (index 0)**: MediaElement with type='media'
3. **Second child (index 1)**: TextElement with type='text'
4. **Order matters**: Media MUST come before Text

### Children Validation Checklist:
- ✅ children.length === 2
- ✅ children[0].type === 'media'
- ✅ children[1].type === 'text'
- ✅ children[0] has complete MediaElement structure
- ✅ children[1] has complete TextElement structure

## COMMON MISTAKES

❌ **WRONG**: Incomplete props object
{
  "props": { "align": "center" }
}

✅ **CORRECT**: All props properties present
{
  "props": { "align": "center", "borderRadius": "SOFT" }
}

---

❌ **WRONG**: Only one child
{
  "children": [
    { "type": "text", ... }
  ]
}

❌ **WRONG**: More than 2 children
{
  "children": [
    { "type": "media", ... },
    { "type": "text", ... },
    { "type": "text", ... }
  ]
}

❌ **WRONG**: Multiple Media elements
{
  "children": [
    { "type": "media", ... },
    { "type": "media", ... }
  ]
}

✅ **CORRECT**: Exactly ONE Media + ONE Text
{
  "children": [
    { "type": "media", ... },
    { "type": "text", ... }
  ]
}

---

❌ **WRONG**: Children in wrong order (Text before Media)
{
  "children": [
    { "type": "text", ... },
    { "type": "media", ... }
  ]
}

✅ **CORRECT**: MediaElement first, TextElement second
{
  "children": [
    { "type": "media", ... },
    { "type": "text", ... }
  ]
}

---

❌ **WRONG**: MediaElement missing required content properties
{
  "children": [
    {
      "type": "media",
      "content": { "src": "" }
    }
  ]
}

✅ **CORRECT**: Complete MediaElement content object
{
  "children": [
    {
      "type": "media",
      "content": { "src": "", "alt": "", "type": "image" },
      "props": { "borderRadius": "SOFT", "objectFit": "cover" },
      "styles": { "width": "100%", "height": "auto" }
    }
  ]
}

---

❌ **WRONG**: TextElement missing format properties
{
  "children": [
    ...,
    {
      "type": "text",
      "props": { "size": "md", "align": "center" }
    }
  ]
}

✅ **CORRECT**: Complete TextElement with all required props
{
  "children": [
    ...,
    {
      "type": "text",
      "content": { "label": "<p>Text</p>" },
      "props": {
        "size": "md",
        "align": "center",
        "borderRadius": "NONE",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "textColor" },
      "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
    }
  ]
}

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'backgroundColor', 'textColor', 'borderColor'
   - Resolved at render time from theme
   - Example: { "backgroundColor": "backgroundColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.1)'
   - Example: { "backgroundColor": "#f5f5f5" }

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: padding, paddingTop, paddingBottom, margin, marginTop, marginBottom, gap
- **Layout**: flexDirection, alignItems, justifyContent
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '24px'
- ❌ Wrong: 16, 1, 2, 24

## ALIGN GUIDELINES

Choose alignment based on layout intent:

- **center**: Feature cards, highlights, callouts (most common)
- **left**: Content sections, informational blocks, left-aligned layouts
- **right**: Special layouts, right-aligned designs (use sparingly)

## BORDER RADIUS GUIDELINES

- **SOFT**: Modern, friendly appearance (most common)
- **ROUNDED**: Playful, prominent cards
- **NONE**: Clean, minimal design

## PARENT-CHILD COORDINATION

The parent MediaWithText provides layout context for its children:

### Parent Responsibilities:
- Controls overall alignment (align prop)
- Provides container styling (backgroundColor, padding, borderRadius)
- Creates visual grouping

### Child MediaElement:
- Should have complete content object (src, alt, type)
- Should have props (borderRadius, objectFit)
- Should have styles (width, height)
- Media type can be: 'image' (Unsplash URL), 'emoji' (emoji character), 'video' (empty src usually)

### Child TextElement:
- Should have HTML content in label
- Should have complete format object
- Should have size matching emphasis level
- Should have alignment matching parent or content intent

## MEDIA TYPE GUIDELINES

For the MediaElement child, choose appropriate type:

- **emoji**: Friendly, approachable designs (✨, 🚀, 💡, 🎯)
- **image**: Professional, detailed content (Unsplash URLs)
- **video**: Video testimonials, demos (usually empty src)

## TEXT SIZE COORDINATION

Match text size to the element's importance:

- **xl**: Hero features, primary value props
- **lg**: Feature highlights, important benefits
- **md**: Standard features, supporting details
- **sm**: Subtle features, minor details

## USE CASE EXAMPLES

### Example 1: Feature Card with Emoji
{
  "id": "media-with-text-1234567890-abc",
  "type": "media-with-text",
  "props": {
    "align": "center",
    "borderRadius": "SOFT"
  },
  "styles": {
    "backgroundColor": "transparent",
    "padding": "24px"
  },
  "children": [
    {
      "id": "media-1234567891-def",
      "type": "media",
      "content": {
        "src": "🚀",
        "alt": "",
        "type": "emoji"
      },
      "props": {
        "borderRadius": "NONE",
        "objectFit": "cover"
      },
      "styles": {
        "width": "100%",
        "height": "auto"
      }
    },
    {
      "id": "text-1234567892-ghi",
      "type": "text",
      "content": {
        "label": "<h3>Lightning Fast Performance</h3><p>Experience speeds up to 10x faster than competitors</p>"
      },
      "props": {
        "size": "lg",
        "align": "center",
        "borderRadius": "NONE",
        "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": {
        "color": "textColor"
      },
      "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
    }
  ]
}

### Example 2: Benefit Card with Background
{
  "id": "media-with-text-1234567893-jkl",
  "type": "media-with-text",
  "props": {
    "align": "center",
    "borderRadius": "ROUNDED"
  },
  "styles": {
    "backgroundColor": "backgroundColor",
    "padding": "32px",
    "borderWidth": "1px",
    "borderColor": "borderColor",
    "borderStyle": "solid"
  },
  "children": [
    {
      "id": "media-1234567894-mno",
      "type": "media",
      "content": {
        "src": "💡",
        "alt": "",
        "type": "emoji"
      },
      "props": {
        "borderRadius": "NONE",
        "objectFit": "cover"
      },
      "styles": {
        "width": "100%",
        "height": "auto"
      }
    },
    {
      "id": "text-1234567895-pqr",
      "type": "text",
      "content": {
        "label": "<h4>Smart Insights</h4><p>AI-powered analytics reveal opportunities you never knew existed</p>"
      },
      "props": {
        "size": "md",
        "align": "center",
        "borderRadius": "NONE",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": {
        "color": "textColor"
      },
      "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
    }
  ]
}

## NOTES

- ID format: 'media-with-text-{timestamp}-{random}' (auto-generated)
- **MANDATORY**: Children array MUST contain EXACTLY 2 elements
- **MANDATORY**: First child MUST be MediaElement (type='media')
- **MANDATORY**: Second child MUST be TextElement (type='text')
- **DO NOT** add multiple Media or Text elements - only one of each
- Layout is vertical stack (media on top, text below)
- Parent provides container styling, children provide content
- Use for: feature highlights, benefits, testimonials, value propositions
- Works great with emojis for friendly designs
- Works great with Unsplash images for professional content
- Keep text concise and impactful
- Consider adding padding and backgroundColor for card-like appearance
  `,

  createDefault: (overrides = {}) => ({
    id: `media-with-text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'media-with-text',
    children: [
      {
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'media',
        content: { src: '🎯', alt: '' },
        props: { mediaType: 'emoji', size: 'md', borderRadius: 'NONE' },
        styles: {},
      },
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Feature Title' },
        props: {
          size: 'md',
          align: 'center',
          borderRadius: 'NONE',
          format: { bold: false, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    props: {
      align: 'center',
      borderRadius: 'NONE',
    },
    styles: {
      padding: '16px',
    },
    ...overrides,
  }),
}
