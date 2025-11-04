import { z } from 'zod'
import { ElementDefinition, LinkSchema, FormatSchema } from '../types'

/**
 * Text Element Schema
 * Matches the exact JSON structure from frontend TextElement
 */
export const TextElementSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(), // Can include HTML content
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg', 'xl']),
    align: z.enum(['left', 'center', 'right', 'justify']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    format: FormatSchema,
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type TextElement = z.infer<typeof TextElementSchema>

export const TextElementDefinition: ElementDefinition = {
  type: 'text',
  name: 'Text',
  category: 'Essentials',
  description: 'A text element with rich formatting options including size, alignment, and text decorations',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['text'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Text content, can include HTML' },
        },
        required: ['label'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
          align: { type: 'string', enum: ['left', 'center', 'right', 'justify'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
          format: {
            type: 'object',
            properties: {
              bold: { type: 'boolean' },
              italic: { type: 'boolean' },
              underline: { type: 'boolean' },
              strikethrough: { type: 'boolean' },
            },
            required: ['bold', 'italic', 'underline', 'strikethrough'],
          },
        },
        required: ['size', 'align', 'borderRadius', 'format'],
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

  zodSchema: TextElementSchema,

  examples: [
    {
      id: 'text-1730000000000-abc123',
      type: 'text',
      content: {
        label: 'Welcome to Our Product',
      },
      props: {
        size: 'xl',
        align: 'center',
        borderRadius: 'NONE',
        format: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        },
      },
      styles: {
        color: '#1a1a1a',
        padding: '16px',
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
When generating a text element:
- Use meaningful, contextual text in the label field
- Choose appropriate size based on text hierarchy (xl for headings, lg for subheadings, md for body text)
- Align text appropriately (center for headings, left for body text)
- Use bold format for emphasis on headings
- Keep borderRadius as 'NONE' unless specifically needed for design
- Only enable links when the text needs to navigate somewhere
- Use appropriate colors in styles.color based on the theme
- Add padding in styles for proper spacing
  `,

  createDefault: (overrides = {}) => ({
    id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'text',
    content: {
      label: 'Enter your text here',
    },
    props: {
      size: 'md',
      align: 'left',
      borderRadius: 'NONE',
      format: {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
      },
    },
    styles: {
      color: '#1a1a1a',
      padding: '8px',
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
