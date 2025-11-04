import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * FormDatePicker Element Schema
 * Matches the exact JSON structure from frontend FormDatePickerElement
 */
export const FormDatePickerElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-datepicker'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg']),
    mandatory: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormDatePickerElement = z.infer<typeof FormDatePickerElementSchema>

export const FormDatePickerElementDefinition: ElementDefinition = {
  type: 'form-datepicker',
  name: 'Form Date Picker',
  category: 'Get Responses',
  description: 'A date picker field for forms to collect date inputs',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-datepicker'] },
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
        },
        required: ['size', 'mandatory'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: FormDatePickerElementSchema,

  examples: [
    {
      id: 'form-datepicker-1730000000000-abc123',
      type: 'form-datepicker',
      content: {
        label: 'Preferred Date',
      },
      props: {
        size: 'md',
        mandatory: true,
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
When generating a form-datepicker element:
- Use for collecting date information
- Provide clear labels indicating what date is needed
- Common use cases:
  - "Appointment Date"
  - "Birth Date"
  - "Event Date"
  - "Preferred Date"
  - "Start Date"
  - "Expiration Date"
- Set mandatory based on whether the date is required
- Use 'md' size for standard forms
- Add marginBottom in styles for spacing between fields
- Keep labels concise and clear
- Consider the context when setting mandatory (e.g., booking forms typically require dates)
  `,

  createDefault: (overrides = {}) => ({
    id: `form-datepicker-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-datepicker',
    content: {
      label: 'Select Date',
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
