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
When generating a media element:
- Choose appropriate mediaType based on content:
  - 'image' for photos, illustrations, screenshots
  - 'emoji' for casual, friendly visual elements
  - 'icon' for professional, minimalist graphics
- For images: provide full URL in src and descriptive alt text
- For emojis: put emoji character in src, alt can be empty
- For icons: provide icon URL in src and descriptive alt text
- Choose size based on visual importance
- Use ROUNDED borderRadius for modern, friendly look
- Use SOFT for subtle rounding
- Use NONE for sharp, professional edges
- Add appropriate margin for spacing
- Consider using backgroundColor in styles for emoji/icon backgrounds
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
