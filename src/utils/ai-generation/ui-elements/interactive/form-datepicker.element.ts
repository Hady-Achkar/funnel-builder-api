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
# Form DatePicker Element AI Instructions

## Overview
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Type**: 'form-datepicker'
- **Purpose**: Date selection input field with calendar picker
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every datepicker element MUST include ALL of these fields:

1. **id** - Format: 'form-datepicker-{timestamp}-{random}' (e.g., 'form-datepicker-1234567890-abc')
2. **type** - Literal 'form-datepicker'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'label'
5. **props** - Object with 'size', 'mandatory'
6. **styles** - Object (can be empty {})

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.label | 'Date' |
| props.size | 'lg' |
| props.mandatory | false |
| styles | {} |

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
"content": {}

✅ **CORRECT**: Label must be present
"content": { "label": "Date" }

---

❌ **WRONG**: Missing props properties
"props": { "size": "lg" }

✅ **CORRECT**: All props properties
"props": { "size": "lg", "mandatory": false }

---

❌ **WRONG**: Adding unsupported properties
"props": { "size": "lg", "mandatory": false, "withIcon": true }

✅ **CORRECT**: Only size and mandatory
"props": { "size": "lg", "mandatory": false }

---

❌ **WRONG**: Missing styles object
{ "id": "...", "type": "form-datepicker", "content": {...}, "props": {...} }

✅ **CORRECT**: Include styles object
{ "id": "...", "type": "form-datepicker", "content": {...}, "props": {...}, "styles": {} }

## USE CASE EXAMPLES

### Example 1: Standard Date Field
{
  "id": "form-datepicker-1234567890-abc",
  "type": "form-datepicker",
  "name": "Form Field",
  "content": {
    "label": "Date"
  },
  "props": {
    "size": "lg",
    "mandatory": false
  },
  "styles": {}
}

### Example 2: Birth Date
{
  "id": "form-datepicker-1234567891-def",
  "type": "form-datepicker",
  "name": "Form Field",
  "content": {
    "label": "Date of Birth"
  },
  "props": {
    "size": "lg",
    "mandatory": false
  },
  "styles": {}
}

### Example 3: Mandatory Appointment Date
{
  "id": "form-datepicker-1234567892-ghi",
  "type": "form-datepicker",
  "name": "Form Field",
  "content": {
    "label": "Appointment Date"
  },
  "props": {
    "size": "lg",
    "mandatory": true
  },
  "styles": {}
}

### Example 4: Event Date (Medium)
{
  "id": "form-datepicker-1234567893-jkl",
  "type": "form-datepicker",
  "name": "Form Field",
  "content": {
    "label": "Event Date"
  },
  "props": {
    "size": "md",
    "mandatory": false
  },
  "styles": {}
}

## NOTES

- ID format: 'form-datepicker-{timestamp}-{random}' (auto-generated)
- Simplified design - no placeholder or icon support
- Calendar picker automatically appears on field interaction
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Colors can use theme properties or hex/rgb values
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
