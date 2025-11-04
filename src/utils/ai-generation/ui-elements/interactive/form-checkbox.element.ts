import { z } from 'zod'
import { ElementDefinition, LinkSchema } from '../types'

/**
 * FormCheckbox Element Schema
 * Matches the exact JSON structure from frontend FormCheckboxElement
 */
export const FormCheckboxElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-checkbox'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg']),
    mandatory: z.boolean(),
    checkboxShape: z.enum(['square', 'circle']),
  }),
  link: LinkSchema.optional(),
  styles: z.record(z.string(), z.any()), // CSSProperties including textColor and checkboxColor
})

export type FormCheckboxElement = z.infer<typeof FormCheckboxElementSchema>

export const FormCheckboxElementDefinition: ElementDefinition = {
  type: 'form-checkbox',
  name: 'Form Checkbox',
  category: 'Get Responses',
  description: 'A checkbox input field for forms with optional link support in the label',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-checkbox'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string' },
        },
        required: ['label'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg'] },
          mandatory: { type: 'boolean' },
          checkboxShape: { type: 'string', enum: ['square', 'circle'] },
        },
        required: ['size', 'mandatory', 'checkboxShape'],
      },
      link: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          href: { type: 'string' },
          target: { type: 'string', enum: ['_self', '_blank'] },
          type: { type: 'string', enum: ['internal', 'external'] },
        },
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: FormCheckboxElementSchema,

  examples: [
    {
      id: 'form-checkbox-1730000000000-abc123',
      type: 'form-checkbox',
      content: {
        label: 'I agree to the Terms and Conditions',
      },
      props: {
        size: 'md',
        mandatory: true,
        checkboxShape: 'square',
      },
      link: {
        enabled: true,
        href: '/terms',
        target: '_blank',
        type: 'internal',
      },
      styles: {
        marginBottom: '16px',
        textColor: '#1a1a1a',
        checkboxColor: '#007bff',
      },
    },
  ],

  aiInstructions: `
When generating a form-checkbox element:
- Use for consent, agreements, or yes/no options
- Common labels:
  - "I agree to the Terms and Conditions"
  - "Subscribe to newsletter"
  - "I accept the Privacy Policy"
  - "Remember me"
- Set mandatory to true for required agreements (like terms acceptance)
- Use 'square' checkboxShape for standard checkboxes
- Use 'circle' checkboxShape for radio-like appearance
- Enable link when label references clickable terms/policies
- Set link target to '_blank' for external documents
- Add textColor in styles for label color
- Add checkboxColor in styles for checked state color
- Use 'md' size for standard forms
- Add marginBottom for spacing
  `,

  createDefault: (overrides = {}) => ({
    id: `form-checkbox-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-checkbox',
    content: {
      label: 'I agree to the terms',
    },
    props: {
      size: 'md',
      mandatory: false,
      checkboxShape: 'square',
    },
    link: {
      enabled: false,
      href: '',
      target: '_self',
      type: 'external',
    },
    styles: {
      marginBottom: '12px',
      textColor: '#1a1a1a',
      checkboxColor: '#007bff',
    },
    ...overrides,
  }),
}
