import { z } from 'zod'
import { ElementDefinition, LinkSchema, IconContentSchema } from '../types'

/**
 * Icon Element Schema
 * Matches the exact JSON structure from frontend IconElement
 */
export const IconElementSchema = z.object({
  id: z.string(),
  type: z.literal('icon'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: IconContentSchema,
  props: z.object({
    size: z.enum(['sm', 'md', 'lg', 'xl']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type IconElement = z.infer<typeof IconElementSchema>

export const IconElementDefinition: ElementDefinition = {
  type: 'icon',
  name: 'Icon',
  category: 'Visuals & Media',
  description: 'An icon element supporting both SVG icons and emoji characters',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['icon'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['icon', 'emoji'] },
          value: { type: 'string', description: 'Icon preview URL for icon type, emoji character for emoji type' },
        },
        required: ['type', 'value'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
        },
        required: ['size'],
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

  zodSchema: IconElementSchema,

  examples: [
    {
      id: 'icon-1730000000000-abc123',
      type: 'icon',
      content: {
        type: 'emoji',
        value: '🚀',
      },
      props: {
        size: 'lg',
      },
      styles: {
        margin: '8px',
      },
      link: {
        enabled: false,
        href: '',
        target: '_self',
        type: 'external',
      },
    },
    {
      id: 'icon-1730000000001-def456',
      type: 'icon',
      content: {
        type: 'icon',
        value: 'https://api.iconify.design/mdi/check-circle.svg',
      },
      props: {
        size: 'md',
      },
      styles: {
        color: '#28a745',
        margin: '8px',
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
When generating an icon element:
- For emoji type: use appropriate emoji characters (e.g., 🚀, ✨, 💡, ✅)
- For icon type: use icon URLs from icon APIs or local icon files
- Choose size based on visual hierarchy (xl for hero sections, lg for features, md for inline)
- Use emojis for casual, friendly designs
- Use SVG icons for professional, branded designs
- Add appropriate margin for spacing
- Consider using backgroundColor in styles for circular icon backgrounds
- Set color in styles for icon tint (works with SVG icons)
- Only enable link if the icon should be clickable
  `,

  createDefault: (overrides = {}) => ({
    id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'icon',
    content: {
      type: 'emoji',
      value: '⭐',
    },
    props: {
      size: 'md',
    },
    styles: {
      margin: '8px',
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
