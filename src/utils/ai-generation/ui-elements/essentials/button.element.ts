import { z } from 'zod'
import { ElementDefinition, LinkSchema, FormatSchema } from '../types'

/**
 * Button Element Schema
 * Matches the exact JSON structure from frontend ButtonElement
 */
export const ButtonElementSchema = z.object({
  id: z.string(),
  type: z.literal('button'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg', 'xl']),
    align: z.enum(['left', 'center', 'right']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    format: FormatSchema,
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type ButtonElement = z.infer<typeof ButtonElementSchema>

export const ButtonElementDefinition: ElementDefinition = {
  type: 'button',
  name: 'Button',
  category: 'Essentials',
  description: 'A clickable button element with customizable appearance and link functionality',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['button'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Button text' },
        },
        required: ['label'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
          align: { type: 'string', enum: ['left', 'center', 'right'] },
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

  zodSchema: ButtonElementSchema,

  examples: [
    {
      id: 'button-1730000000000-abc123',
      type: 'button',
      content: {
        label: 'Get Started',
      },
      props: {
        size: 'lg',
        align: 'center',
        borderRadius: 'ROUNDED',
        format: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        },
      },
      styles: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        padding: '12px 24px',
        border: 'none',
      },
      link: {
        enabled: true,
        href: '/signup',
        target: '_self',
        type: 'internal',
      },
    },
  ],

  aiInstructions: `
When generating a button element:
- Use action-oriented text in the label (e.g., "Get Started", "Learn More", "Sign Up")
- Choose size based on importance (lg or xl for primary CTAs, md for secondary actions)
- Buttons are typically center aligned
- Use ROUNDED or SOFT borderRadius for modern look
- Enable bold format for button text by default
- Always enable the link and provide appropriate href
- Use contrasting colors (backgroundColor vs color) for visibility
- Add appropriate padding for clickable area
- Primary buttons should use brand colors
- Secondary buttons can use outline styles with transparent background
  `,

  createDefault: (overrides = {}) => ({
    id: `button-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'button',
    content: {
      label: 'Click Here',
    },
    props: {
      size: 'md',
      align: 'center',
      borderRadius: 'SOFT',
      format: {
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
      },
    },
    styles: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '10px 20px',
      border: 'none',
    },
    link: {
      enabled: true,
      href: '#',
      target: '_self',
      type: 'internal',
    },
    ...overrides,
  }),
}
