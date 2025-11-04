import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Embed Element Schema
 * Matches the exact JSON structure from frontend EmbedElement
 */
export const EmbedElementSchema = z.object({
  id: z.string(),
  type: z.literal('embed'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    embedCode: z.string(), // HTML/script/iframe code to embed
  }),
  props: z.object({
    showPreview: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type EmbedElement = z.infer<typeof EmbedElementSchema>

export const EmbedElementDefinition: ElementDefinition = {
  type: 'embed',
  name: 'Embed',
  category: 'Visuals & Media',
  description: 'An embed element for custom HTML, scripts, iframes, and third-party content',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['embed'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          embedCode: { type: 'string', description: 'HTML/script/iframe code to embed' },
        },
        required: ['embedCode'],
      },
      props: {
        type: 'object',
        properties: {
          showPreview: { type: 'boolean', description: 'Whether to show preview or placeholder' },
        },
        required: ['showPreview'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: EmbedElementSchema,

  examples: [
    {
      id: 'embed-1730000000000-abc123',
      type: 'embed',
      content: {
        embedCode: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>',
      },
      props: {
        showPreview: true,
      },
      styles: {
        margin: '20px 0',
      },
    },
    {
      id: 'embed-1730000000001-def456',
      type: 'embed',
      content: {
        embedCode: '<script async src="https://platform.twitter.com/widgets.js"></script><blockquote class="twitter-tweet"><p>Sample tweet</p></blockquote>',
      },
      props: {
        showPreview: false,
      },
      styles: {
        margin: '16px 0',
      },
    },
  ],

  aiInstructions: `
When generating an embed element:
- Use for third-party content that requires custom HTML/scripts
- Common use cases:
  - YouTube/Vimeo video embeds (use iframe)
  - Social media posts (Twitter, Instagram, Facebook)
  - Payment buttons (Stripe, PayPal)
  - Calendly scheduling widgets
  - Google Maps
  - Typeform surveys
  - Custom HTML widgets
  - Analytics tracking codes
- Set showPreview to true for safe, renderable content (iframes, standard HTML)
- Set showPreview to false for scripts or complex code that needs careful handling
- Ensure embedCode is properly formatted HTML
- Common iframe attributes to include:
  - width and height
  - frameborder="0"
  - allowfullscreen (for videos)
  - allow (for permissions)
- Add margin for spacing
- IMPORTANT: Only embed from trusted sources
- For YouTube: Use embed URL format (youtube.com/embed/VIDEO_ID)
- For Google Maps: Use the iframe embed code from Google Maps share
- For social media: Use the official embed codes from platforms
  `,

  createDefault: (overrides = {}) => ({
    id: `embed-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'embed',
    content: {
      embedCode: '<div>Embed code here</div>',
    },
    props: {
      showPreview: false,
    },
    styles: {
      margin: '16px 0',
    },
    ...overrides,
  }),
}
