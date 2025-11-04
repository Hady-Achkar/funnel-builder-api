import { z } from 'zod'
import { ElementDefinition, SelectedCountrySchema } from '../types'

/**
 * FormPhoneNumber Element Schema
 * Matches the exact JSON structure from frontend FormPhoneNumberElement
 */
export const FormPhoneNumberElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-phonenumber'),
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
    showCountryFlag: z.boolean(),
    limitToOneCountry: z.boolean(),
  }),
  selectedCountry: SelectedCountrySchema,
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormPhoneNumberElement = z.infer<typeof FormPhoneNumberElementSchema>

export const FormPhoneNumberElementDefinition: ElementDefinition = {
  type: 'form-phonenumber',
  name: 'Form Phone Number',
  category: 'Get Responses',
  description: 'A phone number input field with country code selector',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-phonenumber'] },
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
          showCountryFlag: { type: 'boolean' },
          limitToOneCountry: { type: 'boolean' },
        },
        required: ['size', 'mandatory', 'showCountryFlag', 'limitToOneCountry'],
      },
      selectedCountry: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          dialCode: { type: 'string' },
        },
        required: ['code', 'name', 'icon', 'dialCode'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'selectedCountry', 'styles'],
  },

  zodSchema: FormPhoneNumberElementSchema,

  examples: [
    {
      id: 'form-phonenumber-1730000000000-abc123',
      type: 'form-phonenumber',
      content: {
        label: 'Phone Number',
        placeholder: '123 456 7890',
      },
      props: {
        size: 'md',
        mandatory: true,
        showCountryFlag: true,
        limitToOneCountry: false,
      },
      selectedCountry: {
        code: 'US',
        name: 'United States',
        icon: '🇺🇸',
        dialCode: '+1',
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
When generating a form-phonenumber element:
- Provide clear label like "Phone Number" or "Contact Number"
- Use placeholder that shows format without country code (e.g., "123 456 7890")
- Set showCountryFlag to true for better UX
- Set limitToOneCountry to true if targeting specific region, false for international
- Common countries for selectedCountry:
  - US: { code: 'US', name: 'United States', icon: '🇺🇸', dialCode: '+1' }
  - GB: { code: 'GB', name: 'United Kingdom', icon: '🇬🇧', dialCode: '+44' }
  - AE: { code: 'AE', name: 'United Arab Emirates', icon: '🇦🇪', dialCode: '+971' }
  - CA: { code: 'CA', name: 'Canada', icon: '🇨🇦', dialCode: '+1' }
- Use 'md' size for standard forms
- Set mandatory based on whether phone is required
- Add marginBottom for spacing
  `,

  createDefault: (overrides = {}) => ({
    id: `form-phonenumber-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-phonenumber',
    content: {
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
    },
    props: {
      size: 'md',
      mandatory: false,
      showCountryFlag: true,
      limitToOneCountry: false,
    },
    selectedCountry: {
      code: 'US',
      name: 'United States',
      icon: '🇺🇸',
      dialCode: '+1',
    },
    styles: {
      marginBottom: '12px',
    },
    ...overrides,
  }),
}
