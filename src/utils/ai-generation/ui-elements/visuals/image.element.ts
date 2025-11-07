import { z } from 'zod'
import { ElementDefinition, LinkSchema } from '../types'

/**
 * Image Element Schema
 * Matches the exact JSON structure from frontend ImageElement
 */
export const ImageElementSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    src: z.string(), // Image URL
    alt: z.string(), // Alternative text
  }),
  props: z.object({
    shape: z.enum(['landscape', 'portrait', 'round', 'auto']),
    size: z.enum(['sm', 'md', 'lg', 'xl']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type ImageElement = z.infer<typeof ImageElementSchema>

export const ImageElementDefinition: ElementDefinition = {
  type: 'image',
  name: 'Image',
  category: 'Visuals & Media',
  description: 'An image element with flexible sizing and shape options',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['image'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Image URL' },
          alt: { type: 'string', description: 'Alternative text for accessibility' },
        },
        required: ['src', 'alt'],
      },
      props: {
        type: 'object',
        properties: {
          shape: { type: 'string', enum: ['landscape', 'portrait', 'round', 'auto'] },
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
        },
        required: ['shape', 'size'],
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

  zodSchema: ImageElementSchema,

  examples: [
    {
      id: 'image-1730000000000-abc123',
      type: 'image',
      content: {
        src: 'https://example.com/product-image.jpg',
        alt: 'Product showcase image',
      },
      props: {
        shape: 'landscape',
        size: 'lg',
      },
      styles: {
        margin: '16px 0',
      },
      link: {
        enabled: false,
        href: '',
        target: '_self',
        type: 'external',
      },
    },
  ],

  aiInstructions: `
# Image Element AI Instructions

## Overview
- **Type**: 'image'
- **Purpose**: Display images from Unsplash with flexible shapes and sizes, with link support
- **Has Link**: Yes
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every image element MUST include ALL of these fields:

1. **id** - Format: 'image-{timestamp}-{random}' (e.g., 'image-1234567890-abc')
2. **type** - Literal 'image'
3. **content** - Object with 'src' and 'alt'
4. **content.src** - Unsplash URL ONLY (see Unsplash Requirements below)
5. **content.alt** - Descriptive alternative text for accessibility
6. **props** - Object with 'shape' and 'size'
7. **styles** - Object with 'backgroundColor' (minimum required)
8. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type'

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| props.shape | 'landscape' |
| props.size | 'md' |
| styles.backgroundColor | 'transparent' |
| link.enabled | false |
| link.href | '' |
| link.target | '_self' |
| link.type | 'internal' |

## COMMON MISTAKES

❌ **WRONG**: Missing content.alt property
{
  "content": { "src": "https://images.unsplash.com/photo-1234567890" }
}

✅ **CORRECT**: Include both src and alt
{
  "content": { "src": "https://images.unsplash.com/photo-1234567890", "alt": "Mountain landscape" }
}

---

❌ **WRONG**: Using non-Unsplash URLs
{
  "content": { "src": "https://example.com/image.jpg", "alt": "Description" }
}

❌ **WRONG**: Using placeholder services
{
  "content": { "src": "https://via.placeholder.com/600", "alt": "Description" }
}

✅ **CORRECT**: Only use Unsplash URLs
{
  "content": { "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", "alt": "Mountain landscape" }
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

## UNSPLASH REQUIREMENTS (CRITICAL)

**MANDATORY**: All image URLs MUST be from Unsplash only.

### What to Use:
- ✅ Unsplash URLs: 'https://images.unsplash.com/photo-[id]'
- ✅ With parameters: 'https://images.unsplash.com/photo-[id]?w=800&q=80'

### What NOT to Use:
- ❌ Placeholder services (placeholder.com, via.placeholder.com, placekitten.com)
- ❌ Generic example URLs (example.com/image.jpg)
- ❌ Local file paths or relative URLs
- ❌ Other image hosting services (imgur, cloudinary, etc.)
- ❌ Data URIs or base64 encoded images

### Example Valid Unsplash IDs:
- 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4' (mountain landscape)
- 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' (profile)
- 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' (product)
- 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba' (hero image)

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'backgroundColor', 'borderColor', 'textColor'
   - Resolved at render time from theme
   - Example: { "backgroundColor": "backgroundColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "backgroundColor": "#f0f0f0" }

**Note**: Theme properties work for ANY color property, not just backgroundColor.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

**CRITICAL**: Border widths MUST be strings with units:
- ✅ Correct: borderWidth: "1px", borderWidth: "2px"
- ❌ Wrong: borderWidth: 1, borderWidth: 2

## SHAPE GUIDELINES

Choose shape based on image purpose and aspect ratio:

- **landscape**: Wide images
  - Banners and hero images
  - Panoramic photos
  - Header images
  - Wide product shots

- **portrait**: Tall images
  - Phone screenshots
  - Full-body photos
  - Vertical product shots
  - Magazine covers

- **round**: Circular images
  - Profile pictures
  - Avatars
  - Team member photos
  - Icon-style images

- **auto**: Original aspect ratio
  - When preserving exact dimensions is critical
  - Mixed content with various ratios
  - User-uploaded images

## SIZE GUIDELINES

Choose size based on importance and layout position:

- **xl**: Hero images, primary visuals, full-width banners
- **lg**: Featured images, important product shots, section headers
- **md**: Standard content images, inline photos, medium emphasis
- **sm**: Thumbnails, list items, avatar images, minimal space

## ALT TEXT BEST PRACTICES

Always provide descriptive alt text for accessibility:

- ✅ Good: "Woman working on laptop in modern office"
- ✅ Good: "Red Nike running shoes on wooden surface"
- ✅ Good: "Mountain landscape at sunset with orange sky"
- ❌ Bad: "Image", "Photo", "Picture"
- ❌ Bad: Empty string ""
- ❌ Bad: File name "img_1234.jpg"

## USE CASE EXAMPLES

### Example 1: Simple Landscape Hero Image
{
  "id": "image-1234567890-abc",
  "type": "image",
  "content": {
    "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "alt": "Beautiful mountain landscape at sunrise"
  },
  "props": {
    "shape": "landscape",
    "size": "xl"
  },
  "styles": {
    "backgroundColor": "transparent"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 2: Round Profile Image with Border
{
  "id": "image-1234567891-def",
  "type": "image",
  "content": {
    "src": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    "alt": "Professional headshot of team member"
  },
  "props": {
    "shape": "round",
    "size": "sm"
  },
  "styles": {
    "backgroundColor": "transparent",
    "borderWidth": "2px",
    "borderColor": "borderColor",
    "borderStyle": "solid"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 3: Linked Product Image
{
  "id": "image-1234567892-ghi",
  "type": "image",
  "content": {
    "src": "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "alt": "Premium wireless headphones on marble surface"
  },
  "props": {
    "shape": "landscape",
    "size": "lg"
  },
  "styles": {
    "backgroundColor": "transparent"
  },
  "link": { "enabled": true, "href": "/product/headphones", "target": "_self", "type": "internal" }
}

### Example 4: Styled Image with Shadow
{
  "id": "image-1234567893-jkl",
  "type": "image",
  "content": {
    "src": "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
    "alt": "Modern workspace with laptop and coffee"
  },
  "props": {
    "shape": "auto",
    "size": "md"
  },
  "styles": {
    "backgroundColor": "transparent",
    "borderRadius": "16px",
    "boxShadow": "0 10px 30px rgba(0, 0, 0, 0.2)",
    "marginTop": "24px",
    "marginBottom": "24px"
  },
  "link": { "enabled": true, "href": "https://example.com/workspace", "target": "_blank", "type": "external" }
}

## NOTES

- ID format: 'image-{timestamp}-{random}' (auto-generated)
- **MANDATORY**: All image URLs MUST be from Unsplash (https://images.unsplash.com/...)
- **Do NOT use**: placeholder services, example.com URLs, local paths, or other image sources
- Always provide descriptive alt text for accessibility (not "image" or empty)
- Shape options control aspect ratio and rendering
- Link object is always required even if link.enabled is false
- Spacing values must always include units ('16px' not 16)
- Border widths must be strings with units ("1px" not 1)
- Use theme properties for colors when possible for consistency
  `,

  createDefault: (overrides = {}) => ({
    id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'image',
    content: {
      src: 'https://via.placeholder.com/800x600',
      alt: 'Placeholder image',
    },
    props: {
      shape: 'landscape',
      size: 'md',
    },
    styles: {
      margin: '12px 0',
    },
    link: {
      enabled: false,
      href: '',
      target: '_self',
      type: 'external',
    },
    ...overrides,
  }),
}
