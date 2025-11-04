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
When generating a video element:
- Always provide descriptive alt text for accessibility
- Use 'url' type for YouTube, Vimeo, or other external videos
- Use 'local' type for self-hosted video files
- Use 'landscape' shape for standard videos (16:9)
- Use 'portrait' shape for vertical videos (9:16)
- Use 'square' shape for social media style videos (1:1)
- Use 'auto' shape to maintain original aspect ratio
- Set autoplay to false by default (better UX)
- Add appropriate margin for spacing
- For YouTube URLs, use the full watch URL or embed URL
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
