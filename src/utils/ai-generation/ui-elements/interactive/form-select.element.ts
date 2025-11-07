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
# Form Select Element AI Instructions

## Overview
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Type**: 'form-select'
- **Purpose**: Dropdown select field for choosing from predefined options
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every select element MUST include ALL of these fields:

1. **id** - Format: 'form-select-{timestamp}-{random}' (e.g., 'form-select-1234567890-abc')
2. **type** - Literal 'form-select'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'label', 'placeholder', 'options'
5. **props** - Object with 'size', 'mandatory', 'withIcon'
6. **styles** - Object (can be empty {})

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.label | 'Dropdown Menu' |
| content.placeholder | 'Choose an option' |
| content.options | ['Option 1', 'Option 2', 'Option 3'] |
| props.size | 'lg' |
| props.mandatory | false |
| props.withIcon | true |
| styles | {} |

## ICONCONTEN PROPERTY

The iconContent property is **optional**:
- Include it when props.withIcon is true
- Omit it completely when props.withIcon is false
- When included, must have both 'type: icon' and 'value' properties
- **ONLY icon allowed**: 'ListBulletsIcon'
- **IMPORTANT**: Do NOT use any other icon - only 'ListBulletsIcon' is supported

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
"content": { "label": "Select" }

✅ **CORRECT**: All content properties
"content": { "label": "Dropdown Menu", "placeholder": "Choose an option", "options": ["Option 1", "Option 2", "Option 3"] }

---

❌ **WRONG**: Empty options array
"content": { "label": "Dropdown Menu", "placeholder": "Choose an option", "options": [] }

✅ **CORRECT**: At least one option
"content": { "label": "Dropdown Menu", "placeholder": "Choose an option", "options": ["Option 1", "Option 2", "Option 3"] }

---

❌ **WRONG**: Missing props properties
"props": { "size": "lg" }

✅ **CORRECT**: All props properties
"props": { "size": "lg", "mandatory": false, "withIcon": true }

---

❌ **WRONG**: Including iconContent when withIcon is false
"props": { "size": "lg", "mandatory": false, "withIcon": false },
"iconContent": { "type": "icon", "value": "ListBulletsIcon" }

✅ **CORRECT**: Omit iconContent when withIcon is false
"props": { "size": "lg", "mandatory": false, "withIcon": false },
"styles": {}

---

❌ **WRONG**: Incomplete iconContent
"iconContent": { "value": "ListBulletsIcon" }

✅ **CORRECT**: Complete iconContent when withIcon is true
"iconContent": { "type": "icon", "value": "ListBulletsIcon" }

---

❌ **WRONG**: Using wrong icon
"iconContent": { "type": "icon", "value": "CaretDownIcon" }

✅ **CORRECT**: Only ListBulletsIcon allowed
"iconContent": { "type": "icon", "value": "ListBulletsIcon" }

## USE CASE EXAMPLES

### Example 1: Standard Dropdown
{
  "id": "form-select-1234567890-abc",
  "type": "form-select",
  "name": "Form Field",
  "content": {
    "label": "Dropdown Menu",
    "placeholder": "Choose an option",
    "options": ["Option 1", "Option 2", "Option 3"]
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": true
  },
  "iconContent": {
    "type": "icon",
    "value": "ListBulletsIcon"
  },
  "styles": {}
}

### Example 2: Country Selection
{
  "id": "form-select-1234567891-def",
  "type": "form-select",
  "name": "Form Field",
  "content": {
    "label": "Country",
    "placeholder": "Select your country",
    "options": ["United States", "United Kingdom", "Canada", "Australia"]
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": true
  },
  "iconContent": {
    "type": "icon",
    "value": "ListBulletsIcon"
  },
  "styles": {}
}

### Example 3: Mandatory Selection
{
  "id": "form-select-1234567892-ghi",
  "type": "form-select",
  "name": "Form Field",
  "content": {
    "label": "Industry",
    "placeholder": "Select your industry",
    "options": ["Technology", "Healthcare", "Finance", "Education", "Other"]
  },
  "props": {
    "size": "lg",
    "mandatory": true,
    "withIcon": true
  },
  "iconContent": {
    "type": "icon",
    "value": "ListBulletsIcon"
  },
  "styles": {}
}

### Example 4: Select Without Icon
{
  "id": "form-select-1234567893-jkl",
  "type": "form-select",
  "name": "Form Field",
  "content": {
    "label": "Preference",
    "placeholder": "Choose preference",
    "options": ["Yes", "No", "Maybe"]
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "withIcon": false
  },
  "styles": {}
}

## NOTES

- ID format: 'form-select-{timestamp}-{random}' (auto-generated)
- Options array must contain at least one string value
- iconContent is optional - include only when withIcon is true
- **ONLY icon allowed**: 'ListBulletsIcon' - do not use any other icon
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Colors can use theme properties or hex/rgb values
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
