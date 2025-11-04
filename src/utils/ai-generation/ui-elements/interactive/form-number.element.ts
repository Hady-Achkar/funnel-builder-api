import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Form Number Input Icon Content Schema
 */
export const FormNumberInputIconContentSchema = z.object({
  type: z.literal('icon'),
  value: z.string(), // Phosphor icon name
})

/**
 * FormNumberInput Element Schema
 * Matches the exact JSON structure from frontend FormNumberInputElement
 */
export const FormNumberInputElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-number'),
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
    withIcon: z.boolean(),
    minNumber: z.number().nullable(),
    maxNumber: z.number().nullable(),
  }),
  iconContent: FormNumberInputIconContentSchema.optional(),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormNumberInputElement = z.infer<typeof FormNumberInputElementSchema>

export const FormNumberInputElementDefinition: ElementDefinition = {
  type: 'form-number',
  name: 'Form Number',
  category: 'Get Responses',
  description: 'A numeric input field with optional min/max validation',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-number'] },
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
          withIcon: { type: 'boolean' },
          minNumber: { type: ['number', 'null'] },
          maxNumber: { type: ['number', 'null'] },
        },
        required: ['size', 'mandatory', 'withIcon', 'minNumber', 'maxNumber'],
      },
      iconContent: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['icon'] },
          value: { type: 'string' },
        },
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: FormNumberInputElementSchema,

  examples: [
    {
      id: 'form-number-1730000000000-abc123',
      type: 'form-number',
      content: {
        label: 'Age',
        placeholder: 'Enter your age',
      },
      props: {
        size: 'md',
        mandatory: true,
        withIcon: true,
        minNumber: 18,
        maxNumber: 100,
      },
      iconContent: {
        type: 'icon',
        value: 'HashIcon',
      },
      styles: {
        marginBottom: '16px',
      },
    },
    {
      id: 'form-number-1730000000001-def456',
      type: 'form-number',
      content: {
        label: 'Quantity',
        placeholder: 'How many?',
      },
      props: {
        size: 'md',
        mandatory: false,
        withIcon: false,
        minNumber: 1,
        maxNumber: null,
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
When generating a form-number element:
- Use for numeric inputs only
- Provide clear labels indicating what number is needed
- Use helpful placeholders showing expected format or range
- Common use cases:
  - Age: minNumber: 18, maxNumber: 100
  - Quantity: minNumber: 1, maxNumber: null
  - Rating: minNumber: 1, maxNumber: 5
  - Years of experience: minNumber: 0, maxNumber: 50
  - Budget: minNumber: 0, maxNumber: null
- Set minNumber and maxNumber to null for no limits
- Use withIcon: true for visual enhancement
- Common icon: 'HashIcon'
- Set mandatory based on whether the number is required
- Use 'md' size for standard forms
- Add marginBottom in styles for spacing
- Consider validation ranges appropriate for the context
  `,

  createDefault: (overrides = {}) => ({
    id: `form-number-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-number',
    content: {
      label: 'Number',
      placeholder: 'Enter a number',
    },
    props: {
      size: 'md',
      mandatory: false,
      withIcon: false,
      minNumber: null,
      maxNumber: null,
    },
    styles: {
      marginBottom: '12px',
    },
    ...overrides,
  }),
}
