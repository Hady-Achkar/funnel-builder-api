import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Form Element Schema
 * Matches the exact JSON structure from frontend FormElement
 * Container element with form field children
 */
export const FormElementSchema = z.object({
  id: z.string(),
  type: z.literal('form'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // First child: TextElement (title), middle: form fields, last: ButtonElement (submit)
  serverId: z.number().nullable(),
  integration: z.object({
    webhookEnabled: z.boolean(),
    webhookUrl: z.string(),
  }),
  props: z.record(z.string(), z.unknown()),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormElement = z.infer<typeof FormElementSchema>

export const FormElementDefinition: ElementDefinition = {
  type: 'form',
  name: 'Form',
  category: 'Get Responses',
  description: 'A container element for collecting user input with various form fields and a submit button',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'First child is TextElement (title), middle are form fields, last is ButtonElement (submit)',
        items: { type: 'object' },
      },
      serverId: { type: ['number', 'null'] },
      integration: {
        type: 'object',
        properties: {
          webhookEnabled: { type: 'boolean' },
          webhookUrl: { type: 'string' },
        },
        required: ['webhookEnabled', 'webhookUrl'],
      },
      props: { type: 'object' },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'serverId', 'integration', 'props', 'styles'],
  },

  zodSchema: FormElementSchema,

  examples: [
    {
      id: 'form-1730000000000-abc123',
      type: 'form',
      children: [
        {
          id: 'text-title-1',
          type: 'text',
          content: { label: 'Contact Us' },
          props: {
            size: 'xl',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a', marginBottom: '20px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
        {
          id: 'form-input-1',
          type: 'form-input',
          content: { inputType: 'fullname', label: 'Full Name', placeholder: 'Enter your name' },
          props: { size: 'md', mandatory: true, withIcon: false },
          styles: {},
        },
        {
          id: 'form-input-2',
          type: 'form-input',
          content: { inputType: 'email', label: 'Email', placeholder: 'your@email.com' },
          props: { size: 'md', mandatory: true, withIcon: false },
          styles: {},
        },
        {
          id: 'button-submit-1',
          type: 'button',
          content: { label: 'Submit' },
          props: {
            size: 'lg',
            align: 'center',
            borderRadius: 'SOFT',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '12px 24px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      serverId: null,
      integration: {
        webhookEnabled: false,
        webhookUrl: '',
      },
      props: {},
      styles: {
        padding: '32px',
        backgroundColor: '#ffffff',
      },
    },
  ],

  aiInstructions: `
When generating a form element:
- ALWAYS include these children in order:
  1. First: TextElement as form title/heading
  2. Middle: Form field elements (form-input, form-message, form-select, etc.)
  3. Last: ButtonElement as submit button
- Common form fields to include:
  - form-input with inputType 'fullname' for names
  - form-input with inputType 'email' for emails
  - form-message for multi-line text
  - form-phonenumber for phone numbers
  - form-checkbox for agreements/consents
  - form-select for dropdown options
- Set serverId to null (will be assigned by backend)
- Set webhookEnabled to false by default
- Leave webhookUrl empty by default
- Add padding and backgroundColor in styles for form container
- Keep form fields organized and in logical order
- Mark important fields as mandatory: true
- Use appropriate field sizes (md is standard)
- Make submit button prominent (lg size, bold, contrasting colors)
- Use center alignment for title and submit button
  `,

  createDefault: (overrides = {}) => ({
    id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form',
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Form Title' },
        props: {
          size: 'lg',
          align: 'center',
          borderRadius: 'NONE',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a', marginBottom: '16px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
      {
        id: `button-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'button',
        content: { label: 'Submit' },
        props: {
          size: 'md',
          align: 'center',
          borderRadius: 'SOFT',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '10px 20px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    serverId: null,
    integration: {
      webhookEnabled: false,
      webhookUrl: '',
    },
    props: {},
    styles: {
      padding: '24px',
    },
    ...overrides,
  }),
}
