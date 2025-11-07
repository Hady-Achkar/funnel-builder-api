import { z } from 'zod'
import { ElementDefinition, LinkSchema, IconContentSchema } from '../types'

/**
 * Icon Element Schema
 * Matches the exact JSON structure from frontend IconElement
 */
export const IconElementSchema = z.object({
  id: z.string(),
  type: z.literal('icon'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: IconContentSchema,
  props: z.object({
    size: z.enum(['sm', 'md', 'lg', 'xl']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type IconElement = z.infer<typeof IconElementSchema>

export const IconElementDefinition: ElementDefinition = {
  type: 'icon',
  name: 'Icon',
  category: 'Visuals & Media',
  description: 'An icon element supporting both SVG icons and emoji characters',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['icon'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['icon', 'emoji'] },
          value: { type: 'string', description: 'Icon preview URL for icon type, emoji character for emoji type' },
        },
        required: ['type', 'value'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
        },
        required: ['size'],
      },
      styles: { type: 'object' },
      link: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          href: { type: 'string' },
          target: { type: 'string', enum: ['_self', '_blank'] },
          type: { type: 'string', enum: ['internal', 'external'] },
        },
        required: ['enabled', 'href', 'target', 'type'],
      },
    },
    required: ['id', 'type', 'content', 'props', 'styles', 'link'],
  },

  zodSchema: IconElementSchema,

  examples: [
    {
      id: 'icon-1730000000000-abc123',
      type: 'icon',
      content: {
        type: 'emoji',
        value: '🚀',
      },
      props: {
        size: 'lg',
      },
      styles: {
        margin: '8px',
      },
      link: {
        enabled: false,
        href: '',
        target: '_self',
        type: 'external',
      },
    },
    {
      id: 'icon-1730000000001-def456',
      type: 'icon',
      content: {
        type: 'icon',
        value: 'https://api.iconify.design/mdi/check-circle.svg',
      },
      props: {
        size: 'md',
      },
      styles: {
        color: '#28a745',
        margin: '8px',
      },
      link: {
        enabled: false,
        href: '',
        target: '_self',
        type: 'external',
      },
    },
  ],

  aiInstructions: `
# Icon Element AI Instructions

## Overview
- **Type**: 'icon'
- **Purpose**: Display emojis with link support
- **Has Link**: Yes
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every icon element MUST include ALL of these fields:

1. **id** - Format: 'icon-{timestamp}-{random}'
2. **type** - Literal 'icon'
3. **content** - Object with 'type' and 'value'
4. **content.type** - MUST be 'emoji' (see EMOJI-ONLY RESTRICTION below)
5. **content.value** - Emoji character (e.g., '😀', '🚀', '✨')
6. **props** - Object with 'size'
7. **styles** - Object with 'backgroundColor' (minimum required)
8. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type'

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| content.type | 'emoji' |
| content.value | '😀' |
| props.size | 'md' |
| styles.backgroundColor | 'transparent' |
| link.enabled | false |
| link.href | '' |
| link.target | '_self' |
| link.type | 'internal' |

## EMOJI-ONLY RESTRICTION (CRITICAL)

**MANDATORY**: The Icon element ONLY supports emojis - DO NOT use icon URLs.

### What to Use:
- ✅ content.type: 'emoji'
- ✅ content.value: Emoji character ('🚀', '✨', '💡', '🎯', '⭐', '🔥')

### What NOT to Use:
- ❌ content.type: 'icon'
- ❌ content.value: Icon URLs or icon names
- ❌ SVG icon paths
- ❌ Icon API URLs

### Why Emoji Only?
The frontend Icon component is specifically designed for emoji display. For other icon types, use the Image element with Unsplash URLs instead.

## COMMON MISTAKES

❌ **WRONG**: Missing content.type
{
  "content": { "value": "😀" }
}

✅ **CORRECT**: Include both type and value
{
  "content": { "type": "emoji", "value": "😀" }
}

---

❌ **WRONG**: Using 'icon' type (NOT SUPPORTED)
{
  "content": { "type": "icon", "value": "https://api.example.com/icon.svg" }
}

✅ **CORRECT**: Only use 'emoji' type
{
  "content": { "type": "emoji", "value": "🎨" }
}

---

❌ **WRONG**: Spacing without units
{
  "styles": { "marginTop": 16 }
}

✅ **CORRECT**: Spacing with units
{
  "styles": { "marginTop": "16px" }
}

---

❌ **WRONG**: Omitting link object
{
  "content": {...},
  "props": {...},
  "styles": {...}
}

✅ **CORRECT**: Link object always included
{
  "content": {...},
  "props": {...},
  "styles": {...},
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

## SIZE GUIDELINES

- **xl** (64px): Hero icons, primary visual elements
- **lg** (48px): Section icons, feature highlights
- **md** (32px): Inline icons, standard features
- **sm** (24px): Small inline icons, subtle indicators

## EMOJI SELECTION

**Popular Emojis**:
- Success: ✅ ⭐ 🏆 🎯 💯
- Tech: 🚀 💡 ⚡ 🔧 🛠️
- Communication: 💬 📧 📞 🔔 📢
- Business: 💰 💳 📈 📊 💼
- Positive: ❤️ 🎉 🌟 ✨ 🔥
- Arrows: ➡️ ⬅️ ⬆️ ⬇️ 🔄

## USE CASE EXAMPLES

### Example 1: Simple Inline Emoji
{
  "id": "icon-1234567890-abc",
  "type": "icon",
  "content": { "type": "emoji", "value": "😀" },
  "props": { "size": "md" },
  "styles": { "backgroundColor": "transparent" },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 2: Large Feature Icon with Background
{
  "id": "icon-1234567891-def",
  "type": "icon",
  "content": { "type": "emoji", "value": "🚀" },
  "props": { "size": "lg" },
  "styles": {
    "backgroundColor": "backgroundColor",
    "borderRadius": "50%",
    "padding": "20px"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 3: Linked Icon Button
{
  "id": "icon-1234567892-ghi",
  "type": "icon",
  "content": { "type": "emoji", "value": "🔗" },
  "props": { "size": "md" },
  "styles": { "backgroundColor": "transparent" },
  "link": { "enabled": true, "href": "/contact", "target": "_self", "type": "internal" }
}

### Example 4: Styled Icon with Shadow
{
  "id": "icon-1234567893-jkl",
  "type": "icon",
  "content": { "type": "emoji", "value": "⭐" },
  "props": { "size": "xl" },
  "styles": {
    "backgroundColor": "backgroundColor",
    "borderRadius": "16px",
    "padding": "24px",
    "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.15)"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

## NOTES

- ID format: 'icon-{timestamp}-{random}' (auto-generated)
- **MANDATORY**: content.type MUST be 'emoji' (NOT 'icon')
- **MANDATORY**: content.value is emoji character, NOT URL
- Use emojis for casual, friendly, approachable designs
- Link object always required even if link.enabled is false
- Consider adding backgroundColor and borderRadius for button-like icons
- Spacing values must include units ('16px' not 16)
  `,

  createDefault: (overrides = {}) => ({
    id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'icon',
    content: {
      type: 'emoji',
      value: '⭐',
    },
    props: {
      size: 'md',
    },
    styles: {
      margin: '8px',
    },
    link: {
      enabled: false,
      href: '',
      target: '_self',
      type: 'external',
    },
    ...overrides,
  }),
}
