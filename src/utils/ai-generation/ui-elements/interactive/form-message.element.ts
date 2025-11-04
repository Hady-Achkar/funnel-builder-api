import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * FormMessage Element Schema
 * Matches the exact JSON structure from frontend FormMessageElement
 */
export const FormMessageElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-message'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
    placeholder: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg']),
    mandatory: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormMessageElement = z.infer<typeof FormMessageElementSchema>

export const FormMessageElementDefinition: ElementDefinition = {
  type: 'form-message',
  name: 'Form Message',
  category: 'Get Responses',
  description: 'A multi-line textarea field for collecting longer text responses in forms',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-message'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          placeholder: { type: 'string' },
        },
        required: ['label', 'placeholder'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg'] },
          mandatory: { type: 'boolean' },
        },
        required: ['size', 'mandatory'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: FormMessageElementSchema,

  examples: [
    {
      id: 'form-message-1730000000000-abc123',
      type: 'form-message',
      content: {
        label: 'Message',
        placeholder: 'Tell us more about your inquiry...',
      },
      props: {
        size: 'lg',
        mandatory: false,
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
When generating a form-message element:
- Use for collecting longer, detailed text responses
- Provide clear labels indicating what information is needed
- Use helpful placeholders that guide the user
- Common use cases: comments, feedback, detailed questions, additional information
- Set mandatory based on whether the field is required
- Use 'lg' size for more prominent message fields
- Use 'md' or 'sm' for compact forms
- Add marginBottom in styles for spacing
- Label examples: "Message", "Comments", "Additional Details", "Your Question"
- Placeholder should encourage detailed responses
  `,

  createDefault: (overrides = {}) => ({
    id: `form-message-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-message',
    content: {
      label: 'Message',
      placeholder: 'Enter your message here...',
    },
    props: {
      size: 'md',
      mandatory: false,
    },
    styles: {
      marginBottom: '12px',
    },
    ...overrides,
  }),
}
