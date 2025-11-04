import { z } from 'zod'
import { ElementDefinition, IconContentSchema } from '../types'

/**
 * FAQ Item Element Schema
 * Matches the exact JSON structure from frontend FAQItemElement
 * Used in FAQ elements
 */
export const FAQItemElementSchema = z.object({
  id: z.string(),
  type: z.literal('faq-item'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // Two TextElements: title (question) and content (answer)
  icon: IconContentSchema,
  props: z.object({
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    openByDefault: z.boolean(),
    showIcon: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FAQItemElement = z.infer<typeof FAQItemElementSchema>

export const FAQItemElementDefinition: ElementDefinition = {
  type: 'faq-item',
  name: 'FAQ Item',
  category: 'Informative',
  description: 'A collapsible FAQ item with question and answer text',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['faq-item'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains two TextElements: title (question) and content (answer)',
        items: { type: 'object' },
      },
      icon: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['icon', 'emoji'] },
          value: { type: 'string' },
        },
        required: ['type', 'value'],
      },
      props: {
        type: 'object',
        properties: {
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
          openByDefault: { type: 'boolean' },
          showIcon: { type: 'boolean' },
        },
        required: ['borderRadius', 'openByDefault', 'showIcon'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'icon', 'props', 'styles'],
  },

  zodSchema: FAQItemElementSchema,

  examples: [
    {
      id: 'faq-item-1730000000000-abc123',
      type: 'faq-item',
      children: [
        {
          id: 'text-title-1',
          type: 'text',
          content: { label: 'How does shipping work?' },
          props: {
            size: 'md',
            align: 'left',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
        {
          id: 'text-content-1',
          type: 'text',
          content: {
            label: 'We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.',
          },
          props: {
            size: 'sm',
            align: 'left',
            borderRadius: 'NONE',
            format: { bold: false, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#666666', marginTop: '8px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      icon: {
        type: 'emoji',
        value: '📦',
      },
      props: {
        borderRadius: 'SOFT',
        openByDefault: false,
        showIcon: true,
      },
      styles: {
        marginBottom: '12px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
      },
    },
  ],

  aiInstructions: `
When generating an faq-item element:
- ALWAYS include two TextElement children in order:
  1. First: Title TextElement with the question (bold, size: md)
  2. Second: Content TextElement with the answer (regular, size: sm)
- Question should be concise and specific
- Answer should be clear and helpful
- Use appropriate emojis for icon that relate to the question:
  - Money/pricing: 💰, 💵, 💳
  - Shipping: 📦, 🚚, 🌍
  - Support: 💬, 📧, 📞
  - Security: 🔒, 🛡️, ✅
  - Time: ⏰, ⏱️, 📅
  - General: ❓, ℹ️, 📝
- Set openByDefault to true for the most important/common question (usually first item)
- Set openByDefault to false for all other items
- Set showIcon to true for visual appeal
- Use SOFT or ROUNDED borderRadius for modern look
- Add backgroundColor for subtle card appearance
- Add marginBottom for spacing between items
- Make question text bold and answer text regular
- Use appropriate text colors (dark for question, gray for answer)
  `,

  createDefault: (overrides = {}) => ({
    id: `faq-item-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'faq-item',
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Your question here?' },
        props: {
          size: 'md',
          align: 'left',
          borderRadius: 'NONE',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
      {
        id: `text-${Date.now() + 1}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Your answer here.' },
        props: {
          size: 'sm',
          align: 'left',
          borderRadius: 'NONE',
          format: { bold: false, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#666666', marginTop: '8px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    icon: {
      type: 'emoji',
      value: '❓',
    },
    props: {
      borderRadius: 'NONE',
      openByDefault: false,
      showIcon: true,
    },
    styles: {
      marginBottom: '10px',
    },
    ...overrides,
  }),
}
