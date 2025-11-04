import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Form Select Icon Content Schema
 */
export const FormSelectIconContentSchema = z.object({
  type: z.literal('icon'),
  value: z.string(), // Phosphor icon name
})

/**
 * FormSelect Element Schema
 * Matches the exact JSON structure from frontend FormSelectElement
 */
export const FormSelectElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-select'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(),
    placeholder: z.string(),
    options: z.array(z.string()),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg']),
    mandatory: z.boolean(),
    withIcon: z.boolean(),
  }),
  iconContent: FormSelectIconContentSchema.optional(),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormSelectElement = z.infer<typeof FormSelectElementSchema>

export const FormSelectElementDefinition: ElementDefinition = {
  type: 'form-select',
  name: 'Form Select',
  category: 'Get Responses',
  description: 'A dropdown select field for forms with predefined options',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-select'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          placeholder: { type: 'string' },
          options: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['label', 'placeholder', 'options'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg'] },
          mandatory: { type: 'boolean' },
          withIcon: { type: 'boolean' },
        },
        required: ['size', 'mandatory', 'withIcon'],
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

  zodSchema: FormSelectElementSchema,

  examples: [
    {
      id: 'form-select-1730000000000-abc123',
      type: 'form-select',
      content: {
        label: 'Choose a Plan',
        placeholder: 'Select your plan',
        options: ['Free', 'Basic', 'Pro', 'Enterprise'],
      },
      props: {
        size: 'md',
        mandatory: true,
        withIcon: true,
      },
      iconContent: {
        type: 'icon',
        value: 'ListBulletsIcon',
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
When generating a form-select element:
- Use for multiple choice questions with predefined options
- Provide clear, descriptive labels
- Use placeholder to guide selection (e.g., "Select an option...")
- Provide 3-7 options for best UX (too many? consider searchable dropdown)
- Common use cases:
  - Plan selection: ['Free', 'Basic', 'Pro', 'Enterprise']
  - Country selection: ['United States', 'United Kingdom', 'Canada', ...]
  - Industry selection: ['Technology', 'Healthcare', 'Finance', ...]
  - How did you hear about us: ['Google', 'Social Media', 'Friend', 'Other']
- Set mandatory based on whether selection is required
- Use withIcon: true for visual enhancement
- Common icon names: 'ListBulletsIcon', 'CaretDownIcon'
- Use 'md' size for standard forms
- Add marginBottom for spacing
- Options should be clear and mutually exclusive
  `,

  createDefault: (overrides = {}) => ({
    id: `form-select-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-select',
    content: {
      label: 'Select an option',
      placeholder: 'Choose one...',
      options: ['Option 1', 'Option 2', 'Option 3'],
    },
    props: {
      size: 'md',
      mandatory: false,
      withIcon: false,
    },
    styles: {
      marginBottom: '12px',
    },
    ...overrides,
  }),
}
