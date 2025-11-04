import { z } from 'zod'
import { ElementDefinition, BadgeSchema, LinkSchema } from '../types'

/**
 * Answer Element Schema
 * Matches the exact JSON structure from frontend AnswerElement
 * Used in quiz elements
 */
export const AnswerElementSchema = z.object({
  id: z.string(),
  type: z.literal('answer'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // TextElement only
  content: z.object({
    src: z.string(), // Image URL, emoji character, or icon URL
    alt: z.string(), // Alt text for accessibility
  }),
  badge: BadgeSchema,
  props: z.object({
    mediaType: z.enum(['image', 'emoji', 'icon']),
    size: z.enum(['sm', 'md', 'lg']),
    selected: z.boolean().optional(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type AnswerElement = z.infer<typeof AnswerElementSchema>

export const AnswerElementDefinition: ElementDefinition = {
  type: 'answer',
  name: 'Answer',
  category: 'Surveys & Quizzes',
  description: 'An answer option element for quiz questions with media and text',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['answer'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains TextElement with answer text',
        items: { type: 'object' },
      },
      content: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Image URL, emoji character, or icon URL' },
          alt: { type: 'string', description: 'Alt text for accessibility' },
        },
        required: ['src', 'alt'],
      },
      badge: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          label: { type: 'string' },
          textColor: { type: 'string' },
          backgroundColor: { type: 'string' },
        },
        required: ['enabled', 'label', 'textColor', 'backgroundColor'],
      },
      props: {
        type: 'object',
        properties: {
          mediaType: { type: 'string', enum: ['image', 'emoji', 'icon'] },
          size: { type: 'string', enum: ['sm', 'md', 'lg'] },
          selected: { type: 'boolean' },
        },
        required: ['mediaType', 'size'],
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
    required: ['id', 'type', 'content', 'badge', 'props', 'styles', 'link'],
  },

  zodSchema: AnswerElementSchema,

  examples: [
    {
      id: 'answer-1730000000000-abc123',
      type: 'answer',
      children: [
        {
          id: 'text-child-1',
          type: 'text',
          content: { label: 'Option A' },
          props: {
            size: 'md',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: false, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      content: {
        src: '✅',
        alt: '',
      },
      badge: {
        enabled: false,
        label: '',
        textColor: '',
        backgroundColor: '',
      },
      props: {
        mediaType: 'emoji',
        size: 'md',
        selected: false,
      },
      styles: {
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
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
When generating an answer element:
- ALWAYS include a TextElement child with the answer text
- Choose appropriate media:
  - Use emoji for casual, friendly quizzes (most common)
  - Use images for visual product choices
  - Use icons for professional, minimalist designs
- For emojis: put emoji character in src, leave alt empty
- For images/icons: provide URL in src and descriptive alt text
- Badge is typically disabled by default (enabled: false)
- Enable badge when you want to highlight special options (e.g., "Popular", "Recommended")
- Set selected to false (will be toggled by user interaction)
- Use 'md' size for standard answer options
- Add padding and backgroundColor for clickable card appearance
- Common emoji choices for answers:
  - Goals: 🎯, 📚, 💼, 🏆, 🚀
  - Preferences: ✅, ❤️, ⭐, 👍, 🔥
  - Categories: 📱, 💻, 🎨, 📊, 🔧
- Keep answer text concise (2-5 words ideal)
- Link is present for data consistency but typically not used
  `,

  createDefault: (overrides = {}) => ({
    id: `answer-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'answer',
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Answer option' },
        props: {
          size: 'md',
          align: 'center',
          borderRadius: 'NONE',
          format: { bold: false, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    content: {
      src: '💡',
      alt: '',
    },
    badge: {
      enabled: false,
      label: '',
      textColor: '',
      backgroundColor: '',
    },
    props: {
      mediaType: 'emoji',
      size: 'md',
      selected: false,
    },
    styles: {
      padding: '12px',
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
