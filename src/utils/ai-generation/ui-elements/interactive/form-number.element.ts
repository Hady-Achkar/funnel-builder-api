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
# Form Number Input Element AI Instructions

## Overview
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Type**: 'form-number'
- **Purpose**: Numeric input field with optional min/max validation
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every number input element MUST include ALL of these fields:

1. **id** - Format: 'form-number-{timestamp}-{random}' (e.g., 'form-number-1234567890-abc')
2. **type** - Literal 'form-number'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'label', 'placeholder'
5. **props** - Object with 'size', 'mandatory', 'withIcon', 'minNumber', 'maxNumber'
6. **styles** - Object (can be empty {})

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.label | 'Number' |
| content.placeholder | 'Enter your number' |
| props.size | 'lg' |
| props.mandatory | false |
| props.withIcon | true |
| props.minNumber | null |
| props.maxNumber | null |
| styles | {} |

## ICONCONTEN PROPERTY

The iconContent property is **optional**:
- Include it when props.withIcon is true
- Omit it completely when props.withIcon is false
- When included, must have both 'type: icon' and 'value' properties
- **ONLY icon allowed**: 'HashIcon'
- **IMPORTANT**: Do NOT use any other icon - only 'HashIcon' is supported

## MIN/MAX VALIDATION

The minNumber and maxNumber properties control validation:
- Use null for no limit
- Use a number value to enforce minimum/maximum
- Both can be set independently: minNumber: 0, maxNumber: null (only minimum)
- Example ranges: age (18-120), quantity (1-999), percentage (0-100)

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
"content": { "label": "Number" }

✅ **CORRECT**: All content properties
"content": { "label": "Number", "placeholder": "Enter your number" }

---

❌ **WRONG**: Missing props properties
"props": { "size": "lg", "mandatory": false, "withIcon": true }

✅ **CORRECT**: All props properties including min/max
"props": { "size": "lg", "mandatory": false, "withIcon": true, "minNumber": null, "maxNumber": null }

---

❌ **WRONG**: Using undefined instead of null
"props": { "size": "lg", "mandatory": false, "withIcon": true, "minNumber": undefined, "maxNumber": undefined }

✅ **CORRECT**: Use null for no limit
"props": { "size": "lg", "mandatory": false, "withIcon": true, "minNumber": null, "maxNumber": null }

---

❌ **WRONG**: Including iconContent when withIcon is false
"props": { "size": "lg", "mandatory": false, "withIcon": false, "minNumber": null, "maxNumber": null },
"iconContent": { "type": "icon", "value": "HashIcon" }

✅ **CORRECT**: Omit iconContent when withIcon is false
"props": { "size": "lg", "mandatory": false, "withIcon": false, "minNumber": null, "maxNumber": null },
"styles": {}

---

❌ **WRONG**: Incomplete iconContent
"iconContent": { "value": "HashIcon" }

✅ **CORRECT**: Complete iconContent when withIcon is true
"iconContent": { "type": "icon", "value": "HashIcon" }

## USE CASE EXAMPLES

### Example 1: Basic Number Input
{
  "id": "form-number-1234567890-abc",
  "type": "form-number",
  "name": "Form Field",
  "content": {
    "label": "Number",
    "placeholder": "Enter your number"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": true,
    "minNumber": null,
    "maxNumber": null
  },
  "iconContent": {
    "type": "icon",
    "value": "HashIcon"
  },
  "styles": {}
}

### Example 2: Age Input (18-120)
{
  "id": "form-number-1234567891-def",
  "type": "form-number",
  "name": "Form Field",
  "content": {
    "label": "Age",
    "placeholder": "Enter your age"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": true,
    "minNumber": 18,
    "maxNumber": 120
  },
  "iconContent": {
    "type": "icon",
    "value": "HashIcon"
  },
  "styles": {}
}

### Example 3: Quantity Input (Min 1, No Max)
{
  "id": "form-number-1234567892-ghi",
  "type": "form-number",
  "name": "Form Field",
  "content": {
    "label": "Quantity",
    "placeholder": "Enter quantity"
  },
  "props": {
    "size": "lg",
    "mandatory": true,
    "withIcon": true,
    "minNumber": 1,
    "maxNumber": null
  },
  "iconContent": {
    "type": "icon",
    "value": "HashIcon"
  },
  "styles": {}
}

### Example 4: Number Input Without Icon
{
  "id": "form-number-1234567893-jkl",
  "type": "form-number",
  "name": "Form Field",
  "content": {
    "label": "Amount",
    "placeholder": "Enter amount"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": false,
    "minNumber": 0,
    "maxNumber": 999999
  },
  "styles": {}
}

## NOTES

- ID format: 'form-number-{timestamp}-{random}' (auto-generated)
- iconContent is optional - include only when withIcon is true
- Common icon: 'HashIcon'
- minNumber and maxNumber control validation (use null for no limit)
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Colors can use theme properties or hex/rgb values
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
