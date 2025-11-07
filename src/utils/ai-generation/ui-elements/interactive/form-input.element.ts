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
# Form Input Element AI Instructions

## Overview
- **Type**: 'form-input'
- **Purpose**: Text-based input field for collecting user information
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every input field element MUST include ALL of these fields:

1. **id** - Format: 'form-input-{timestamp}-{random}' (e.g., 'form-input-1234567890-abc')
2. **type** - Literal 'form-input'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'inputType', 'label', 'placeholder'
5. **props** - Object with 'size', 'mandatory', 'withIcon'
6. **styles** - Object (can be empty {})

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.inputType | 'email' |
| content.label | 'Email' |
| content.placeholder | 'Enter your email' |
| props.size | 'lg' |
| props.mandatory | false |
| props.withIcon | true |
| styles | {} |

## ICONCONTEN PROPERTY

The iconContent property is **optional**:
- Include it when props.withIcon is true
- Omit it completely when props.withIcon is false
- When included, must have both 'type: icon' and 'value' properties
- **ONLY 2 icon values are allowed**:
  - 'EnvelopeIcon' - Use for email input fields (inputType: 'email')
  - 'UserIcon' - Use for fullname input fields (inputType: 'fullname')
- **IMPORTANT**: Do NOT use any other icon names or try to generate custom icons

## STYLES OBJECT

The styles object is flexible and powerful:
- **Accepts ANY valid CSS property**: backgroundColor, color, borderRadius, boxShadow, opacity, transform, etc.
- **All spacing must have units**: '16px', '1rem', '2em' (not plain numbers)
- **Colors can be**:
  - Theme properties: 'textColor', 'borderColor', etc. (resolved from theme)
  - Hex codes: '#3b82f6', '#FFFFFF', '#000000'
  - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
- **Theme properties work for ANY color**, not just backgroundColor/color (e.g., borderColor: 'borderColor' is valid)

## COMMON MISTAKES

❌ **WRONG**: Missing content properties
"content": { "label": "Email" }

✅ **CORRECT**: All content properties
"content": { "inputType": "email", "label": "Email", "placeholder": "Enter your email" }

---

❌ **WRONG**: Missing props properties
"props": { "size": "lg" }

✅ **CORRECT**: All props properties
"props": { "size": "lg", "mandatory": false, "withIcon": true }

---

❌ **WRONG**: Including iconContent when withIcon is false
"props": { "size": "lg", "mandatory": false, "withIcon": false },
"iconContent": { "type": "icon", "value": "EnvelopeIcon" }

✅ **CORRECT**: Omit iconContent when withIcon is false
"props": { "size": "lg", "mandatory": false, "withIcon": false },
"styles": {}

---

❌ **WRONG**: Incomplete iconContent
"iconContent": { "value": "EnvelopeIcon" }

✅ **CORRECT**: Complete iconContent when withIcon is true
"iconContent": { "type": "icon", "value": "EnvelopeIcon" }

---

❌ **WRONG**: Using invalid icon name
"iconContent": { "type": "icon", "value": "MailIcon" }

❌ **WRONG**: Using wrong icon for input type
"content": { "inputType": "email", ... },
"iconContent": { "type": "icon", "value": "UserIcon" }

✅ **CORRECT**: Use EnvelopeIcon for email, UserIcon for fullname
"content": { "inputType": "email", ... },
"iconContent": { "type": "icon", "value": "EnvelopeIcon" }

---

❌ **WRONG**: Wrong inputType
"content": { "inputType": "text", "label": "Email", "placeholder": "Enter your email" }

✅ **CORRECT**: Valid inputType
"content": { "inputType": "email", "label": "Email", "placeholder": "Enter your email" }

## USE CASE EXAMPLES

### Example 1: Email Input
{
  "id": "form-input-1234567890-abc",
  "type": "form-input",
  "name": "Form Field",
  "content": {
    "inputType": "email",
    "label": "Email",
    "placeholder": "Enter your email"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": true
  },
  "iconContent": {
    "type": "icon",
    "value": "EnvelopeIcon"
  },
  "styles": {}
}

### Example 2: Full Name Input
{
  "id": "form-input-1234567891-def",
  "type": "form-input",
  "name": "Form Field",
  "content": {
    "inputType": "fullname",
    "label": "Full name",
    "placeholder": "Enter your full name"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": true
  },
  "iconContent": {
    "type": "icon",
    "value": "UserIcon"
  },
  "styles": {}
}

### Example 3: Mandatory Email Field
{
  "id": "form-input-1234567892-ghi",
  "type": "form-input",
  "name": "Form Field",
  "content": {
    "inputType": "email",
    "label": "Email",
    "placeholder": "Enter your email"
  },
  "props": {
    "size": "lg",
    "mandatory": true,
    "withIcon": true
  },
  "iconContent": {
    "type": "icon",
    "value": "EnvelopeIcon"
  },
  "styles": {}
}

### Example 4: Input Without Icon
{
  "id": "form-input-1234567893-jkl",
  "type": "form-input",
  "name": "Form Field",
  "content": {
    "inputType": "fullname",
    "label": "Full name",
    "placeholder": "Enter your full name"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": false
  },
  "styles": {}
}

## NOTES

- ID format: 'form-input-{timestamp}-{random}' (auto-generated)
- Only 2 input types supported: 'email' and 'fullname'
- iconContent is optional - include only when withIcon is true
- **ONLY 2 icons allowed**: 'EnvelopeIcon' (for email), 'UserIcon' (for fullname)
- **Do NOT use any other icon names** - only these two or no icon at all
- Match icon to input type: EnvelopeIcon for email, UserIcon for fullname
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Colors can use theme properties or hex/rgb values
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
