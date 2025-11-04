import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Form Input Icon Content Schema
 */
export const FormInputIconContentSchema = z.object({
  type: z.literal('icon'),
  value: z.string(), // Phosphor icon name
})

/**
 * FormInput Element Schema
 * Matches the exact JSON structure from frontend FormInputElement
 */
export const FormInputElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-input'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    inputType: z.enum(['email', 'fullname']),
    label: z.string(),
    placeholder: z.string(),
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg']),
    mandatory: z.boolean(),
    withIcon: z.boolean(),
  }),
  iconContent: FormInputIconContentSchema.optional(),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormInputElement = z.infer<typeof FormInputElementSchema>

export const FormInputElementDefinition: ElementDefinition = {
  type: 'form-input',
  name: 'Form Input',
  category: 'Get Responses',
  description: 'A text input field for forms supporting email and fullname input types',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-input'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          inputType: { type: 'string', enum: ['email', 'fullname'] },
          label: { type: 'string' },
          placeholder: { type: 'string' },
        },
        required: ['inputType', 'label', 'placeholder'],
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

  zodSchema: FormInputElementSchema,

  examples: [
    {
      id: 'form-input-1730000000000-abc123',
      type: 'form-input',
      content: {
        inputType: 'email',
        label: 'Email Address',
        placeholder: 'your@email.com',
      },
      props: {
        size: 'md',
        mandatory: true,
        withIcon: true,
      },
      iconContent: {
        type: 'icon',
        value: 'EnvelopeIcon',
      },
      styles: {
        marginBottom: '16px',
      },
    },
    {
      id: 'form-input-1730000000001-def456',
      type: 'form-input',
      content: {
        inputType: 'fullname',
        label: 'Full Name',
        placeholder: 'John Doe',
      },
      props: {
        size: 'md',
        mandatory: true,
        withIcon: false,
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
When generating a form-input element:
- Use inputType 'email' for email addresses
- Use inputType 'fullname' for names
- Provide clear, descriptive labels
- Use helpful placeholders that show expected format
- Set mandatory to true for required fields
- Use withIcon: true for visual enhancement (optional)
- Common icon names for Phosphor icons:
  - 'EnvelopeIcon' for email
  - 'UserIcon' for fullname
- Use 'md' size for standard forms
- Add marginBottom in styles for spacing between fields
- Keep labels concise but descriptive
  `,

  createDefault: (overrides = {}) => ({
    id: `form-input-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-input',
    content: {
      inputType: 'email',
      label: 'Email',
      placeholder: 'Enter your email',
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
