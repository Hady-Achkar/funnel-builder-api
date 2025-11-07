import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Video Element Schema
 * Matches the exact JSON structure from frontend VideoElement
 */
export const VideoElementSchema = z.object({
  id: z.string(),
  type: z.literal('video'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    src: z.string(), // Video URL (local, YouTube, or any URL)
    alt: z.string(), // Alternative text
    type: z.enum(['local', 'url']), // Video source type
  }),
  props: z.object({
    shape: z.enum(['landscape', 'portrait', 'square', 'auto']),
    autoplay: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type VideoElement = z.infer<typeof VideoElementSchema>

export const VideoElementDefinition: ElementDefinition = {
  type: 'video',
  name: 'Video',
  category: 'Visuals & Media',
  description: 'A video element with support for local and external video sources',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['video'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Video URL (local, YouTube, Vimeo, or direct URL)' },
          alt: { type: 'string', description: 'Alternative text for accessibility' },
          type: { type: 'string', enum: ['local', 'url'] },
        },
        required: ['src', 'alt', 'type'],
      },
      props: {
        type: 'object',
        properties: {
          shape: { type: 'string', enum: ['landscape', 'portrait', 'square', 'auto'] },
          autoplay: { type: 'boolean' },
        },
        required: ['shape', 'autoplay'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: VideoElementSchema,

  examples: [
    {
      id: 'video-1730000000000-abc123',
      type: 'video',
      content: {
        src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        alt: 'Product demo video',
        type: 'url',
      },
      props: {
        shape: 'landscape',
        autoplay: false,
      },
      styles: {
        margin: '20px 0',
      },
    },
  ],

  aiInstructions: `
# Video Element AI Instructions

## Overview
- **Type**: 'video'
- **Purpose**: Display videos from URL sources with flexible shapes
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every video element MUST include ALL of these fields:

1. **id** - Format: 'video-{timestamp}-{random}' (e.g., 'video-1234567890-abc')
2. **type** - Literal 'video'
3. **content** - Object with 'src', 'alt', and 'type'
4. **props** - Object with 'shape' and 'autoplay'
5. **styles** - Object with 'backgroundColor' (minimum required)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| id | 'video-{timestamp}-{random}' |
| type | 'video' |
| content.src | '' |
| content.alt | '' |
| content.type | 'url' |
| props.shape | 'landscape' |
| props.autoplay | false |
| styles.backgroundColor | 'transparent' |

## COMMON MISTAKES

❌ **WRONG**: Missing content properties
{
  "content": { "src": "" }
}

✅ **CORRECT**: Include src, alt, and type
{
  "content": { "src": "", "alt": "Video description", "type": "url" }
}

---

❌ **WRONG**: Using local type
{
  "content": { "src": "/videos/demo.mp4", "alt": "Demo", "type": "local" }
}

❌ **WRONG**: Making up or using placeholder URLs
{
  "content": { "src": "https://www.youtube.com/watch?v=example123", "alt": "Video", "type": "url" }
}

✅ **CORRECT**: Empty src when user didn't provide URL
{
  "content": { "src": "", "alt": "Video description", "type": "url" }
}

✅ **CORRECT**: Use exact URL if user provided one
{
  // User said: "Add a video with this link: https://youtu.be/abc123"
  "content": { "src": "https://youtu.be/abc123", "alt": "Video", "type": "url" }
}

---

❌ **WRONG**: Mixing styles incorrectly
{
  "styles": { "backgroundColor": "#000000", "marginTop": 16 }
}

✅ **CORRECT**: Spacing always needs units
{
  "styles": { "backgroundColor": "#000000", "marginTop": "16px" }
}

---

❌ **WRONG**: Missing props.autoplay
{
  "props": { "shape": "landscape" }
}

✅ **CORRECT**: Include all props
{
  "props": { "shape": "landscape", "autoplay": false }
}

---

❌ **WRONG**: Using number for borderWidth
{
  "styles": { "borderWidth": 2 }
}

✅ **CORRECT**: borderWidth must be string with units
{
  "styles": { "borderWidth": "2px" }
}

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'backgroundColor', 'borderColor', 'textColor'
   - Resolved at render time from theme
   - Example: { "borderColor": "backgroundColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "backgroundColor": "#000000" }

**Note**: Theme properties work for ANY color property, not just backgroundColor/color.
Example: { "borderColor": "textColor" } is valid.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

## CRITICAL: CONTENT TYPE AND SOURCE RULES

- **IMPORTANT**: content.type MUST always be 'url'
- **Do NOT use 'local' type** - local video sources are not supported for AI generation
- **Source URL Rules**:
  - If the user provides a specific video URL in their prompt, use that exact URL in content.src
  - If the user does NOT provide a video URL, content.src MUST be an empty string ''
  - **Do NOT generate, make up, or use placeholder/example URLs** (like youtube.com/watch?v=..., vimeo.com/..., etc.)
  - Only use a URL if the user explicitly gives you one
- Users can provide video URLs either in their prompt or through the UI later

## USE CASE EXAMPLES

### Example 1: Landscape Video
{
  "id": "video-1234567890-abc",
  "type": "video",
  "content": {
    "src": "",
    "alt": "Video description",
    "type": "url"
  },
  "props": {
    "shape": "landscape",
    "autoplay": false
  },
  "styles": {
    "backgroundColor": "transparent"
  }
}

### Example 2: Autoplay Video
{
  "id": "video-1234567891-def",
  "type": "video",
  "content": {
    "src": "",
    "alt": "Promotional video",
    "type": "url"
  },
  "props": {
    "shape": "landscape",
    "autoplay": true
  },
  "styles": {
    "backgroundColor": "transparent"
  }
}

### Example 3: Square Video with Border
{
  "id": "video-1234567892-ghi",
  "type": "video",
  "content": {
    "src": "",
    "alt": "Demo video",
    "type": "url"
  },
  "props": {
    "shape": "square",
    "autoplay": false
  },
  "styles": {
    "backgroundColor": "transparent",
    "borderWidth": "2px",
    "borderColor": "borderColor",
    "borderRadius": "8px"
  }
}

### Example 4: Portrait Video with Shadow
{
  "id": "video-1234567893-jkl",
  "type": "video",
  "content": {
    "src": "",
    "alt": "Story video",
    "type": "url"
  },
  "props": {
    "shape": "portrait",
    "autoplay": false
  },
  "styles": {
    "backgroundColor": "#000000",
    "borderRadius": "16px",
    "boxShadow": "0 10px 30px rgba(0, 0, 0, 0.3)",
    "padding": "8px"
  }
}

## NOTES

- ID format: 'video-{timestamp}-{random}' (auto-generated)
- **IMPORTANT**: content.type MUST always be 'url' - do NOT use 'local' type
- **Source URL**: Use the exact URL if user provides one in their prompt, otherwise empty string ''
- **Do NOT generate or make up video URLs** - only use URLs explicitly provided by the user
- Content requires src (user's URL or empty), alt (alternative text), and type ('url')
- Shape options: landscape (wide), portrait (tall), square (1:1), auto (original aspect ratio)
- Autoplay controls whether video starts automatically
- Colors: Can use theme colors ('backgroundColor') or hex codes ('#3b82f6')
- All props and content properties are required
- No link support for videos
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- BorderWidth must be STRING with units (e.g., "1px" not 1)
  `,

  createDefault: (overrides = {}) => ({
    id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'video',
    content: {
      src: 'https://www.youtube.com/watch?v=example',
      alt: 'Video content',
      type: 'url',
    },
    props: {
      shape: 'landscape',
      autoplay: false,
    },
    styles: {
      margin: '16px 0',
    },
    ...overrides,
  }),
}
