import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Media Element Schema
 * Matches the exact JSON structure from frontend MediaElement
 */
export const MediaElementSchema = z.object({
  id: z.string(),
  type: z.literal('media'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    src: z.string(), // For image/icon: URL, for emoji: emoji character
    alt: z.string(), // Alt text for accessibility (only used for image/icon)
  }),
  props: z.object({
    mediaType: z.enum(['image', 'emoji', 'icon']),
    size: z.enum(['sm', 'md', 'lg', 'xl']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type MediaElement = z.infer<typeof MediaElementSchema>

export const MediaElementDefinition: ElementDefinition = {
  type: 'media',
  name: 'Media',
  category: 'Visuals & Media',
  description: 'A versatile media element that can display images, emojis, or icons',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['media'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'URL for image/icon, emoji character for emoji' },
          alt: { type: 'string', description: 'Alternative text for accessibility' },
        },
        required: ['src', 'alt'],
      },
      props: {
        type: 'object',
        properties: {
          mediaType: { type: 'string', enum: ['image', 'emoji', 'icon'] },
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
        },
        required: ['mediaType', 'size', 'borderRadius'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: MediaElementSchema,

  examples: [
    {
      id: 'media-1730000000000-abc123',
      type: 'media',
      content: {
        src: 'https://example.com/image.jpg',
        alt: 'Feature illustration',
      },
      props: {
        mediaType: 'image',
        size: 'lg',
        borderRadius: 'SOFT',
      },
      styles: {
        margin: '16px 0',
      },
    },
    {
      id: 'media-1730000000001-def456',
      type: 'media',
      content: {
        src: '🎯',
        alt: '',
      },
      props: {
        mediaType: 'emoji',
        size: 'xl',
        borderRadius: 'NONE',
      },
      styles: {
        margin: '12px',
      },
    },
  ],

  aiInstructions: `
# Media Element AI Instructions

## Overview
- **Type**: 'media'
- **Purpose**: Display images from Unsplash or emojis with flexible sizing and styling
- **Parent**: MediaWithText (this element should ONLY be used as a child inside MediaWithText element)
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every media element MUST include ALL of these fields:

1. **id** - Format: 'media-{timestamp}-{random}' (e.g., 'media-1234567890-abc')
2. **type** - Literal 'media'
3. **content** - Object with 'src' and 'alt'
4. **props** - Object with 'mediaType', 'size', 'borderRadius'
5. **styles** - Object with 'backgroundColor' (minimum required)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| id | 'media-{timestamp}-{random}' |
| type | 'media' |
| content.src | 'https://images.unsplash.com/photo-...' or emoji character |
| content.alt | 'Media description' |
| props.mediaType | 'image' |
| props.size | 'lg' |
| props.borderRadius | 'SOFT' |
| styles.backgroundColor | 'transparent' |

## COMMON MISTAKES

❌ **WRONG**: Missing content properties
{
  "content": { "src": "https://images.unsplash.com/photo-1234567890" }
}

✅ **CORRECT**: Both src and alt
{
  "content": { "src": "https://images.unsplash.com/photo-1234567890", "alt": "Product image" }
}

---

❌ **WRONG**: Missing required props
{
  "props": { "size": "lg" }
}

✅ **CORRECT**: All required props
{
  "props": { "mediaType": "image", "size": "lg", "borderRadius": "SOFT" }
}

---

❌ **WRONG**: Using 'icon' mediaType
{
  "props": { "mediaType": "icon", "size": "lg", "borderRadius": "SOFT" }
}

❌ **WRONG**: Using non-Unsplash URL for image
{
  "props": { "mediaType": "image", ... },
  "content": { "src": "https://example.com/image.jpg", "alt": "Image" }
}

✅ **CORRECT**: Only 'image' or 'emoji', and Unsplash for images
{
  "props": { "mediaType": "image", "size": "lg", "borderRadius": "SOFT" },
  "content": { "src": "https://images.unsplash.com/photo-1234567890", "alt": "Image" }
}

---

❌ **WRONG**: Emoji as URL
{
  "mediaType": "image",
  "content": { "src": "😀", "alt": "Happy face" }
}

✅ **CORRECT**: Emoji with emoji type
{
  "mediaType": "emoji",
  "content": { "src": "😀", "alt": "Happy face" }
}

---

❌ **WRONG**: Spacing without units
{
  "styles": { "marginTop": 20 }
}

✅ **CORRECT**: Spacing with units
{
  "styles": { "marginTop": "20px" }
}

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'backgroundColor', 'borderColor', 'textColor'
   - Resolved at render time from theme
   - Example: { "backgroundColor": "backgroundColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "backgroundColor": "#f3f4f6" }

**Note**: Theme properties work for ANY color property, not just backgroundColor/color.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

## CRITICAL: PARENT REQUIREMENT

- **IMPORTANT**: Media elements should ONLY be used as children inside MediaWithText elements
- **Do NOT create standalone Media elements** - they must be part of a MediaWithText container
- Media elements are automatically included when generating MediaWithText elements

## CRITICAL: MEDIA TYPE RESTRICTIONS

The mediaType prop determines how content is rendered. **ONLY 2 types are allowed**:

**1. image**: Unsplash image display
- content.src: **MUST be Unsplash URL** (https://images.unsplash.com/photo-...)
- content.alt: Descriptive alt text for accessibility
- **IMPORTANT**: Do NOT use placeholder URLs, example.com, or other image sources
- **ONLY use Unsplash images**

**2. emoji**: Display emoji character
- content.src: The emoji character itself (e.g., "😀", "🎉", "❤️")
- content.alt: Optional description (not displayed but good for accessibility)
- Emoji will be centered and sized according to size prop

**Do NOT use 'icon' type** - only 'image' (Unsplash) or 'emoji' are allowed.

## USE CASE EXAMPLES

### Example 1: Standard Unsplash Image
{
  "id": "media-1234567890-abc",
  "type": "media",
  "content": {
    "src": "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "alt": "Product showcase image"
  },
  "props": {
    "mediaType": "image",
    "size": "lg",
    "borderRadius": "SOFT"
  },
  "styles": {
    "backgroundColor": "transparent"
  }
}

### Example 2: Emoji Display
{
  "id": "media-1234567891-def",
  "type": "media",
  "content": {
    "src": "🎉",
    "alt": "Celebration emoji"
  },
  "props": {
    "mediaType": "emoji",
    "size": "xl",
    "borderRadius": "NONE"
  },
  "styles": {
    "backgroundColor": "transparent"
  }
}

### Example 3: Rounded Image with Background
{
  "id": "media-1234567893-jkl",
  "type": "media",
  "content": {
    "src": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    "alt": "User avatar"
  },
  "props": {
    "mediaType": "image",
    "size": "md",
    "borderRadius": "ROUNDED"
  },
  "styles": {
    "backgroundColor": "#f3f4f6",
    "paddingTop": "8px",
    "paddingBottom": "8px",
    "paddingLeft": "8px",
    "paddingRight": "8px"
  }
}

### Example 4: Large Hero Image
{
  "id": "media-1234567894-mno",
  "type": "media",
  "content": {
    "src": "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
    "alt": "Hero banner showing our product"
  },
  "props": {
    "mediaType": "image",
    "size": "xl",
    "borderRadius": "SOFT"
  },
  "styles": {
    "backgroundColor": "transparent",
    "marginTop": "24px",
    "marginBottom": "24px",
    "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
  }
}

### Example 5: Emoji with Background
{
  "id": "media-1234567896-stu",
  "type": "media",
  "content": {
    "src": "🔥",
    "alt": "Fire emoji"
  },
  "props": {
    "mediaType": "emoji",
    "size": "lg",
    "borderRadius": "ROUNDED"
  },
  "styles": {
    "backgroundColor": "#fef3c7",
    "paddingTop": "16px",
    "paddingBottom": "16px",
    "paddingLeft": "16px",
    "paddingRight": "16px"
  }
}

## NOTES

- ID format: 'media-{timestamp}-{random}' (auto-generated)
- **MANDATORY**: Media elements should ONLY be used as children inside MediaWithText elements
- **Do NOT create standalone Media elements** - they must be part of MediaWithText
- **ONLY 2 mediaTypes allowed**: 'image' (Unsplash only) or 'emoji'
- **Do NOT use 'icon' mediaType** - it is not supported
- For mediaType: 'image', src **MUST be Unsplash URL** (https://images.unsplash.com/photo-...)
- For mediaType: 'emoji', src should be the emoji character itself
- **Do NOT use**: placeholder URLs, example.com, or other image sources for images
- Alt text (content.alt) is important for accessibility
- Size options: 'sm', 'md', 'lg', 'xl' (progressively larger)
- Border radius: 'NONE' (square), 'SOFT' (slightly rounded), 'ROUNDED' (fully rounded/circular)
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Deep merge supported: can override nested properties
- Use borderRadius: 'ROUNDED' for circular images
  `,

  createDefault: (overrides = {}) => ({
    id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'media',
    content: {
      src: '📷',
      alt: '',
    },
    props: {
      mediaType: 'emoji',
      size: 'md',
      borderRadius: 'NONE',
    },
    styles: {
      margin: '12px',
    },
    ...overrides,
  }),
}
