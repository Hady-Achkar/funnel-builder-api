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
# Form PhoneNumber Element AI Instructions

## Overview
- **Parent**: Form (this element should ONLY be used as a child inside Form element)
- **Type**: 'form-phonenumber'
- **Purpose**: Phone number input with country code selector
- **Has Link**: No
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every phone number element MUST include ALL of these fields:

1. **id** - Format: 'form-phonenumber-{timestamp}-{random}' (e.g., 'form-phonenumber-1234567890-abc')
2. **type** - Literal 'form-phonenumber'
3. **name** - String identifier (default: 'Form Field')
4. **content** - Object with 'label', 'placeholder'
5. **props** - Object with 'size', 'mandatory', 'showCountryFlag', 'limitToOneCountry'
6. **selectedCountry** - Object with ALL 4 properties: 'name', 'code', 'dialCode', 'flag'
7. **styles** - Object (can be empty {})

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

**IMPORTANT**: All form fields MUST include a 'name' property (default: 'Form Field')

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Form Field' |
| content.label | 'Phone number' |
| content.placeholder | 'Enter your phone number' |
| props.size | 'lg' |
| props.mandatory | false |
| props.showCountryFlag | true |
| props.limitToOneCountry | false |
| selectedCountry.code | 'en' |
| selectedCountry.name | 'English' |
| selectedCountry.icon | '/locales/icons/en.svg' |
| selectedCountry.dialCode | '+1' |
| styles | {} |

## SELECTEDCOUNTRY PROPERTY

The selectedCountry object controls the default country:
- **MUST always use this exact format** - no variations allowed:
{
  "code": "en",
  "name": "English",
  "icon": "/locales/icons/en.svg",
  "dialCode": "+1"
}
- All 4 properties are required: code, name, icon, dialCode
- **IMPORTANT**: Do NOT use any other country or format - this is the only supported configuration

## COUNTRY FLAGS AND SELECTION

- showCountryFlag: Controls visibility of country flag in the input
- limitToOneCountry: When true, disables country selector (locks to selectedCountry)

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
"content": { "label": "Phone number" }

✅ **CORRECT**: All content properties
"content": { "label": "Phone number", "placeholder": "Enter your phone number" }

---

❌ **WRONG**: Missing props properties
"props": { "size": "lg", "mandatory": false }

✅ **CORRECT**: All props properties
"props": { "size": "lg", "mandatory": false, "showCountryFlag": true, "limitToOneCountry": false }

---

❌ **WRONG**: Missing selectedCountry properties
"selectedCountry": { "code": "en", "dialCode": "+1" }

✅ **CORRECT**: All selectedCountry properties
"selectedCountry": { "code": "en", "name": "English", "icon": "/locales/icons/en.svg", "dialCode": "+1" }

---

❌ **WRONG**: Using wrong country or format
"selectedCountry": { "name": "United Arab Emirates", "code": "ar", "dialCode": "+971", "flag": "🇦🇪" }

✅ **CORRECT**: Use exact required format
"selectedCountry": { "code": "en", "name": "English", "icon": "/locales/icons/en.svg", "dialCode": "+1" }

---

❌ **WRONG**: Missing + in dialCode
"selectedCountry": { "code": "en", "name": "English", "icon": "/locales/icons/en.svg", "dialCode": "1" }

✅ **CORRECT**: Include + prefix in dialCode
"selectedCountry": { "code": "en", "name": "English", "icon": "/locales/icons/en.svg", "dialCode": "+1" }

---

❌ **WRONG**: Omitting selectedCountry object
{ "id": "...", "type": "form-phonenumber", "content": {...}, "props": {...}, "styles": {} }

✅ **CORRECT**: Include selectedCountry
{ "id": "...", "type": "form-phonenumber", "content": {...}, "props": {...}, "selectedCountry": {...}, "styles": {} }

## USE CASE EXAMPLES

### Example 1: Standard Phone Input
{
  "id": "form-phonenumber-1234567890-abc",
  "type": "form-phonenumber",
  "name": "Form Field",
  "content": {
    "label": "Phone number",
    "placeholder": "Enter your phone number"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "showCountryFlag": true,
    "limitToOneCountry": false
  },
  "selectedCountry": {
    "code": "en",
    "name": "English",
    "icon": "/locales/icons/en.svg",
    "dialCode": "+1"
  },
  "styles": {}
}

### Example 2: Mandatory Phone Input
{
  "id": "form-phonenumber-1234567891-def",
  "type": "form-phonenumber",
  "name": "Form Field",
  "content": {
    "label": "Phone number",
    "placeholder": "Enter your phone number"
  },
  "props": {
    "size": "lg",
    "mandatory": true,
    "showCountryFlag": true,
    "limitToOneCountry": false
  },
  "selectedCountry": {
    "code": "en",
    "name": "English",
    "icon": "/locales/icons/en.svg",
    "dialCode": "+1"
  },
  "styles": {}
}

### Example 3: Phone Input (Locked to One Country)
{
  "id": "form-phonenumber-1234567892-ghi",
  "type": "form-phonenumber",
  "name": "Form Field",
  "content": {
    "label": "Phone number",
    "placeholder": "Enter your phone number"
  },
  "props": {
    "size": "lg",
    "mandatory": true,
    "showCountryFlag": true,
    "limitToOneCountry": true
  },
  "selectedCountry": {
    "code": "en",
    "name": "English",
    "icon": "/locales/icons/en.svg",
    "dialCode": "+1"
  },
  "styles": {}
}

### Example 4: Phone Without Flag
{
  "id": "form-phonenumber-1234567893-jkl",
  "type": "form-phonenumber",
  "name": "Form Field",
  "content": {
    "label": "Mobile",
    "placeholder": "Enter mobile number"
  },
  "props": {
    "size": "lg",
    "mandatory": false,
    "showCountryFlag": false,
    "limitToOneCountry": false
  },
  "selectedCountry": {
    "code": "en",
    "name": "English",
    "icon": "/locales/icons/en.svg",
    "dialCode": "+1"
  },
  "styles": {}
}

## NOTES

- ID format: 'form-phonenumber-{timestamp}-{random}' (auto-generated)
- **selectedCountry MUST always use exact format**: {"code": "en", "name": "English", "icon": "/locales/icons/en.svg", "dialCode": "+1"}
- selectedCountry must include all 4 properties (code, name, icon, dialCode)
- dialCode must include the + prefix
- limitToOneCountry locks the country selector to selectedCountry
- showCountryFlag controls flag visibility
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Colors can use theme properties or hex/rgb values
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
