import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Divider Element Schema
 * Matches the exact JSON structure from frontend DividerElement
 */
export const DividerElementSchema = z.object({
  id: z.string(),
  type: z.literal('divider'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  props: z.object({
    borderStyle: z.enum(['none', 'solid', 'dashed', 'dotted']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type DividerElement = z.infer<typeof DividerElementSchema>

export const DividerElementDefinition: ElementDefinition = {
  type: 'divider',
  name: 'Divider',
  category: 'Essentials',
  description: 'A horizontal line element for visual separation between content sections',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['divider'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      props: {
        type: 'object',
        properties: {
          borderStyle: { type: 'string', enum: ['none', 'solid', 'dashed', 'dotted'] },
        },
        required: ['borderStyle'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'props', 'styles'],
  },

  zodSchema: DividerElementSchema,

  examples: [
    {
      id: 'divider-1730000000000-abc123',
      type: 'divider',
      props: {
        borderStyle: 'solid',
      },
      styles: {
        borderColor: '#e0e0e0',
        borderWidth: '1px',
        margin: '20px 0',
      },
    },
  ],

  aiInstructions: `
When generating a divider element:
- Use 'solid' borderStyle for clean, professional dividers
- Use 'dashed' or 'dotted' for subtle, decorative separation
- Set borderColor to light gray (#e0e0e0 or similar) for subtle separation
- Use borderWidth of 1px or 2px (avoid thick dividers)
- Add appropriate margin (usually 20px or more) for spacing
- Dividers should be used between major content sections
- Keep it simple - dividers are meant to be unobtrusive
  `,

  createDefault: (overrides = {}) => ({
    id: `divider-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'divider',
    props: {
      borderStyle: 'solid',
    },
    styles: {
      borderColor: '#e0e0e0',
      borderWidth: '1px',
      margin: '20px 0',
    },
    ...overrides,
  }),
}
