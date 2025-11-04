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
When generating an image element:
- Always provide a descriptive alt text for accessibility
- Use 'landscape' shape for wide images (banners, hero images)
- Use 'portrait' shape for tall images (phone screenshots)
- Use 'round' shape for profile pictures or avatars
- Use 'auto' shape to maintain original aspect ratio
- Choose size based on importance (xl for hero images, lg for featured images, md for content images)
- Add appropriate margin for spacing
- Only enable link if the image should navigate somewhere
- Consider the context when setting the src URL
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
