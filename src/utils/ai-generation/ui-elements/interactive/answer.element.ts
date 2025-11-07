import { z } from 'zod'
import { ElementDefinition, BadgeSchema, LinkSchema } from '../types'

/**
 * Answer Element Schema
 * Matches the exact JSON structure from frontend AnswerElement
 * Used in quiz elements
 */
export const AnswerElementSchema = z.object({
  id: z.string(),
  type: z.literal('answer'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // TextElement only
  content: z.object({
    src: z.string(), // Image URL, emoji character, or icon URL
    alt: z.string(), // Alt text for accessibility
  }),
  badge: BadgeSchema,
  props: z.object({
    mediaType: z.enum(['image', 'emoji', 'icon']),
    size: z.enum(['sm', 'md', 'lg']),
    selected: z.boolean().optional(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type AnswerElement = z.infer<typeof AnswerElementSchema>

export const AnswerElementDefinition: ElementDefinition = {
  type: 'answer',
  name: 'Answer',
  category: 'Surveys & Quizzes',
  description: 'An answer option element for quiz questions with media and text',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['answer'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains TextElement with answer text',
        items: { type: 'object' },
      },
      content: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Image URL, emoji character, or icon URL' },
          alt: { type: 'string', description: 'Alt text for accessibility' },
        },
        required: ['src', 'alt'],
      },
      badge: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          label: { type: 'string' },
          textColor: { type: 'string' },
          backgroundColor: { type: 'string' },
        },
        required: ['enabled', 'label', 'textColor', 'backgroundColor'],
      },
      props: {
        type: 'object',
        properties: {
          mediaType: { type: 'string', enum: ['image', 'emoji', 'icon'] },
          size: { type: 'string', enum: ['sm', 'md', 'lg'] },
          selected: { type: 'boolean' },
        },
        required: ['mediaType', 'size'],
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
    required: ['id', 'type', 'content', 'badge', 'props', 'styles', 'link'],
  },

  zodSchema: AnswerElementSchema,

  examples: [
    {
      id: 'answer-1730000000000-abc123',
      type: 'answer',
      children: [
        {
          id: 'text-child-1',
          type: 'text',
          content: { label: 'Option A' },
          props: {
            size: 'md',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: false, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      content: {
        src: '✅',
        alt: '',
      },
      badge: {
        enabled: false,
        label: '',
        textColor: '',
        backgroundColor: '',
      },
      props: {
        mediaType: 'emoji',
        size: 'md',
        selected: false,
      },
      styles: {
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
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
# Answer Element AI Instructions

## Overview
- **Type**: 'answer'
- **Purpose**: Quiz answer option with media and text
- **Parent**: Quiz (ONLY exists as child of Quiz)
- **Has Children**: Yes (TextElement for label)
- **Has Link**: Yes (data only, not applied)
- **Has Badge**: Yes (optional display)

**IMPORTANT**: Answer elements can ONLY exist as children of a Quiz parent element. They cannot be used standalone or as children of other element types.

## REQUIRED FIELDS (MUST always be present)

Every answer element MUST include ALL of these fields:

1. **id** - Format: 'answer-{timestamp}-{random}' (e.g., 'answer-1234567890-abc')
2. **type** - Literal 'answer'
3. **content** - Object with 'src' and 'alt'
4. **badge** - Object with ALL 4 properties: 'enabled', 'label', 'textColor', 'backgroundColor'
5. **props** - Object with 'mediaType', 'size', 'selected'
6. **styles** - Object with 'backgroundColor', 'paddingTop', 'paddingBottom' (minimum required)
7. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type'
8. **children** - Array with at least one TextElement for the label

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| content.src | '' |
| content.alt | 'Answer media' |
| badge.enabled | false |
| badge.label | 'Badge' |
| badge.textColor | 'textColor' |
| badge.backgroundColor | 'optionBackground' |
| props.mediaType | 'image' |
| props.size | 'md' |
| props.selected | false |
| styles.backgroundColor | '#F0F0F0' |
| styles.paddingTop | '0px' |
| styles.paddingBottom | '0px' |
| link.enabled | false |
| link.href | '' |
| link.target | '_self' |
| link.type | 'internal' |

## PARENT RELATIONSHIP

- **Answer elements can ONLY exist as children of Quiz**
- Never create an answer element at the root level
- Always include answers within the children array of a Quiz element
- Each Quiz can have multiple answer children

## CHILDREN RULES

- **MUST have at least one TextElement child** for the answer label
- The TextElement displays the answer text
- Default alignment for text is 'center'
- Default size for text is 'md'

## COMMON MISTAKES

❌ **WRONG**: Missing badge object
{
  "id": "answer-123",
  "type": "answer",
  "content": { "src": "", "alt": "Media" },
  "props": { "mediaType": "image", "size": "md", "selected": false }
}

✅ **CORRECT**: Always include badge, link, and children
{
  "id": "answer-123",
  "type": "answer",
  "content": { "src": "", "alt": "Media" },
  "badge": { "enabled": false, "label": "Badge", "textColor": "#166534", "backgroundColor": "#86efac" },
  "props": { "mediaType": "image", "size": "md", "selected": false },
  "styles": { "backgroundColor": "#F0F0F0", "paddingTop": "0px", "paddingBottom": "0px" },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" },
  "children": [{ "id": "text-456", "type": "text", ... }]
}

---

❌ **WRONG**: Using answer as standalone element
{
  "type": "answer",
  "content": { "src": "", "alt": "Media" },
  ...
}

✅ **CORRECT**: Always as child of Quiz
{
  "type": "quiz",
  "children": [
    { "type": "answer", ... },
    { "type": "answer", ... }
  ]
}

---

❌ **WRONG**: Incomplete badge object
{
  "badge": { "enabled": false }
}

✅ **CORRECT**: All badge properties
{
  "badge": { "enabled": false, "label": "Badge", "textColor": "#166534", "backgroundColor": "#86efac" }
}

---

❌ **WRONG**: Missing props.selected
{
  "props": { "mediaType": "image", "size": "md" }
}

✅ **CORRECT**: All props properties
{
  "props": { "mediaType": "image", "size": "md", "selected": false }
}

## MEDIA TYPES

- **image**: Full image as background (use content.src for image URL)
- **emoji**: Emoji character displayed above text (use content.src for emoji)
- **icon**: Icon displayed above text (use content.src for icon URL)
- Media is displayed above the text child

## BADGE BEHAVIOR

- Badge appears as an overlay on the answer when badge.enabled is true
- Displays badge.label with badge.textColor and badge.backgroundColor
- Useful for marking correct/incorrect answers or adding context
- Badge is always present in the data structure but only visible when enabled

## LINK BEHAVIOR

- **Link is data only**: The link object is stored but NOT applied to the answer element
- Link data can be used by parent Quiz or application logic
- Does not make the answer clickable on its own
- Include link data for tracking or future functionality

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, color, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

**Colors can be**:
- Theme properties: 'textColor', 'borderColor', etc. (resolved from theme)
- Hex codes: '#3b82f6', '#FFFFFF', '#000000'
- RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'

**Note**: Theme properties work for ANY color, not just backgroundColor

## USE CASE EXAMPLES

### Example 1: Image Answer
{
  "id": "answer-1234567890-abc",
  "type": "answer",
  "content": {
    "src": "/assets/quiz-answer-images/bg-answer-1.jpg",
    "alt": "Answer image"
  },
  "badge": {
    "enabled": false,
    "label": "Badge",
    "textColor": "textColor",
    "backgroundColor": "optionBackground"
  },
  "props": {
    "mediaType": "image",
    "size": "md",
    "selected": false
  },
  "styles": {
    "backgroundColor": "#F0F0F0",
    "paddingTop": "0px",
    "paddingBottom": "0px"
  },
  "link": {
    "enabled": false,
    "href": "",
    "target": "_self",
    "type": "internal"
  },
  "children": [
    {
      "id": "text-1234567890-def",
      "type": "text",
      "content": { "label": "Option A" },
      "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
      "styles": { "color": "textColor" }
    }
  ]
}

### Example 2: Emoji Answer
{
  "id": "answer-1234567891-ghi",
  "type": "answer",
  "content": {
    "src": "😊",
    "alt": "Happy emoji"
  },
  "badge": {
    "enabled": false,
    "label": "Badge",
    "textColor": "textColor",
    "backgroundColor": "optionBackground"
  },
  "props": {
    "mediaType": "emoji",
    "size": "md",
    "selected": false
  },
  "styles": {
    "backgroundColor": "#F0F0F0",
    "paddingTop": "0px",
    "paddingBottom": "0px"
  },
  "link": {
    "enabled": false,
    "href": "",
    "target": "_self",
    "type": "internal"
  },
  "children": [
    {
      "id": "text-1234567891-jkl",
      "type": "text",
      "content": { "label": "Very Happy" },
      "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
      "styles": { "color": "textColor" }
    }
  ]
}

### Example 3: Answer with Badge
{
  "id": "answer-1234567892-mno",
  "type": "answer",
  "content": {
    "src": "https://example.com/icon.svg",
    "alt": "Star icon"
  },
  "badge": {
    "enabled": true,
    "label": "Correct",
    "textColor": "#166534",
    "backgroundColor": "#86efac"
  },
  "props": {
    "mediaType": "icon",
    "size": "md",
    "selected": true
  },
  "styles": {
    "backgroundColor": "#F0F0F0",
    "paddingTop": "0px",
    "paddingBottom": "0px"
  },
  "link": {
    "enabled": false,
    "href": "",
    "target": "_self",
    "type": "internal"
  },
  "children": [
    {
      "id": "text-1234567892-pqr",
      "type": "text",
      "content": { "label": "Best Choice" },
      "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
      "styles": { "color": "textColor" }
    }
  ]
}

## CONTENT GUIDELINES

- Choose appropriate media:
  - Use **emoji** for casual, friendly quizzes (most common)
  - Use **images** for visual product choices
  - Use **icons** for professional, minimalist designs
- For emojis: put emoji character in src, leave alt empty
- For images/icons: provide URL in src and descriptive alt text
- Badge is typically disabled by default (enabled: false)
- Enable badge when you want to highlight special options (e.g., "Popular", "Recommended")
- Set selected to false (will be toggled by user interaction)
- Use 'md' size for standard answer options
- Add padding and backgroundColor for clickable card appearance
- Common emoji choices for answers:
  - Goals: 🎯, 📚, 💼, 🏆, 🚀
  - Preferences: ✅, ❤️, ⭐, 👍, 🔥
  - Categories: 📱, 💻, 🎨, 📊, 🔧
- Keep answer text concise (2-5 words ideal)

## NOTES

- ID format: 'answer-{timestamp}-{random}' (auto-generated)
- **Parent requirement**: MUST be child of Quiz element
- Children: MUST contain at least one TextElement for the label
- Media: Supports image, emoji, or icon via props.mediaType
- Badge: Always present, only visible when badge.enabled is true
- Link: Data only, not applied to the element (stored for reference)
- Selected: Use props.selected for tracking answer selection state
- Structure: [Media (top)] [TextElement (bottom)] [Badge overlay (optional)]
- Colors: Can use theme colors or hex codes
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
  `,

  createDefault: (overrides = {}) => ({
    id: `answer-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'answer',
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Answer option' },
        props: {
          size: 'md',
          align: 'center',
          borderRadius: 'NONE',
          format: { bold: false, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    content: {
      src: '💡',
      alt: '',
    },
    badge: {
      enabled: false,
      label: '',
      textColor: '',
      backgroundColor: '',
    },
    props: {
      mediaType: 'emoji',
      size: 'md',
      selected: false,
    },
    styles: {
      padding: '12px',
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
