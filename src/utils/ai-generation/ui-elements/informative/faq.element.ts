import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * FAQ Element Schema
 * Matches the exact JSON structure from frontend FAQElement
 * Container element with FAQ item children
 */
export const FAQElementSchema = z.object({
  id: z.string(),
  type: z.literal('faq'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  serverId: z.number().nullable(),
  children: z.array(z.any()).optional(), // FAQItemElements
  props: z.record(z.string(), z.unknown()),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FAQElement = z.infer<typeof FAQElementSchema>

export const FAQElementDefinition: ElementDefinition = {
  type: 'faq',
  name: 'FAQ',
  category: 'Informative',
  description: 'A frequently asked questions section with collapsible accordion items',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['faq'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      serverId: { type: ['number', 'null'] },
      children: {
        type: 'array',
        description: 'Contains FAQItemElements',
        items: { type: 'object' },
      },
      props: { type: 'object' },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'serverId', 'props', 'styles'],
  },

  zodSchema: FAQElementSchema,

  examples: [
    {
      id: 'faq-1730000000000-abc123',
      type: 'faq',
      serverId: null,
      children: [
        {
          id: 'faq-item-1',
          type: 'faq-item',
          icon: { type: 'emoji', value: '❓' },
          props: { borderRadius: 'SOFT', openByDefault: false, showIcon: true },
          styles: { marginBottom: '12px' },
          children: [
            {
              id: 'text-title-1',
              type: 'text',
              content: { label: 'What is your refund policy?' },
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
              content: { label: 'We offer a 30-day money-back guarantee on all purchases.' },
              props: {
                size: 'sm',
                align: 'left',
                borderRadius: 'NONE',
                format: { bold: false, italic: false, underline: false, strikethrough: false },
              },
              styles: { color: '#666666' },
              link: { enabled: false, href: '', target: '_self', type: 'external' },
            },
          ],
        },
      ],
      props: {},
      styles: {
        padding: '24px',
      },
    },
  ],

  aiInstructions: `
When generating an FAQ element:
- Include multiple FAQItemElements as children (typically 4-8 items)
- Set serverId to null (will be assigned by backend)
- Each FAQ item should address common customer questions
- Common FAQ topics:
  - Pricing and refunds
  - Shipping and delivery
  - Product features
  - Account management
  - Technical support
  - Security and privacy
- Order questions from most to least common
- Keep answers concise but informative
- First item can have openByDefault: true to guide users
- Add padding for spacing
- This element is perfect for:
  - Product pages
  - Pricing pages
  - Support sections
  - Landing pages
  `,

  createDefault: (overrides = {}) => ({
    id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'faq',
    serverId: null,
    children: [],
    props: {},
    styles: {
      padding: '20px',
    },
    ...overrides,
  }),
}
