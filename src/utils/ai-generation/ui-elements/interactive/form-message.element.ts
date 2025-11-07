import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * FormMessage Element Schema
 * Matches the exact JSON structure from frontend FormMessageElement
 */
export const FormMessageElementSchema = z.object({
  id: z.string(),
  type: z.literal('form-message'),
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
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type FormMessageElement = z.infer<typeof FormMessageElementSchema>

export const FormMessageElementDefinition: ElementDefinition = {
  type: 'form-message',
  name: 'Form Message',
  category: 'Get Responses',
  description: 'A multi-line textarea field for collecting longer text responses in forms',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['form-message'] },
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
        },
        required: ['size', 'mandatory'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: FormMessageElementSchema,

  examples: [
    {
      id: 'form-message-1730000000000-abc123',
      type: 'form-message',
      content: {
        label: 'Message',
        placeholder: 'Tell us more about your inquiry...',
      },
      props: {
        size: 'lg',
        mandatory: false,
      },
      styles: {
        marginBottom: '16px',
      },
    },
  ],

  aiInstructions: `
# Form Message Element AI Instructions

## Overview
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Type**: 'form-message'
- **Purpose**: Multi-line text input for messages, comments, and longer text
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every textarea/message element MUST include ALL of these fields:

1. **id** - Format: 'form-message-{timestamp}-{random}' (e.g., 'form-message-1234567890-abc')
2. **type** - Literal 'form-message'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'label', 'placeholder'
5. **props** - Object with 'size', 'mandatory'
6. **styles** - Object (can be empty {})

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.label | 'Message' |
| content.placeholder | 'Enter your message' |
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
"content": { "label": "Message" }

✅ **CORRECT**: All content properties
"content": { "label": "Message", "placeholder": "Enter your message" }

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
{ "id": "...", "type": "form-message", "content": {...}, "props": {...} }

✅ **CORRECT**: Include styles object
{ "id": "...", "type": "form-message", "content": {...}, "props": {...}, "styles": {} }

## USE CASE EXAMPLES

### Example 1: Standard Message Field
{
  "id": "form-message-1234567890-abc",
  "type": "form-message",
  "name": "Form Field",
  "content": {
    "label": "Message",
    "placeholder": "Enter your message"
  },
  "props": {
    "size": "lg",
    "mandatory": false
  },
  "styles": {}
}

### Example 2: Comments Field
{
  "id": "form-message-1234567891-def",
  "type": "form-message",
  "name": "Form Field",
  "content": {
    "label": "Comments",
    "placeholder": "Share your thoughts..."
  },
  "props": {
    "size": "lg",
    "mandatory": false
  },
  "styles": {}
}

### Example 3: Mandatory Feedback
{
  "id": "form-message-1234567892-ghi",
  "type": "form-message",
  "name": "Form Field",
  "content": {
    "label": "Feedback",
    "placeholder": "Please provide your feedback"
  },
  "props": {
    "size": "lg",
    "mandatory": true
  },
  "styles": {}
}

### Example 4: Description Field (Medium)
{
  "id": "form-message-1234567893-jkl",
  "type": "form-message",
  "name": "Form Field",
  "content": {
    "label": "Description",
    "placeholder": "Describe your requirements"
  },
  "props": {
    "size": "md",
    "mandatory": false
  },
  "styles": {}
}

## NOTES

- ID format: 'form-message-{timestamp}-{random}' (auto-generated)
- Simplified design - no icon support (clean textarea)
- Multi-line input automatically expands as user types
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Colors can use theme properties or hex/rgb values
  `,

  createDefault: (overrides = {}) => ({
    id: `form-message-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'form-message',
    content: {
      label: 'Message',
      placeholder: 'Enter your message here...',
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
