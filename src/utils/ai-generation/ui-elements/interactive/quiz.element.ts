import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Quiz Element Schema
 * Matches the exact JSON structure from frontend QuizElement
 * Container element with question text and answer elements as children
 */
export const QuizElementSchema = z.object({
  id: z.string(),
  type: z.literal('quiz'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  serverId: z.number().nullable(),
  children: z.array(z.any()).optional(), // TextElement (question) + AnswerElements
  props: z.object({
    align: z.enum(['left', 'center', 'right']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    size: z.enum(['sm', 'md', 'lg', 'xl']), // Controls grid columns
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type QuizElement = z.infer<typeof QuizElementSchema>

export const QuizElementDefinition: ElementDefinition = {
  type: 'quiz',
  name: 'Quiz',
  category: 'Surveys & Quizzes',
  description: 'An interactive quiz element with a question and multiple answer options displayed in a grid',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['quiz'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      serverId: { type: ['number', 'null'] },
      children: {
        type: 'array',
        description: 'Contains TextElement (question) and AnswerElements',
        items: { type: 'object' },
      },
      props: {
        type: 'object',
        properties: {
          align: { type: 'string', enum: ['left', 'center', 'right'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
        },
        required: ['align', 'borderRadius', 'size'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'serverId', 'props', 'styles'],
  },

  zodSchema: QuizElementSchema,

  examples: [
    {
      id: 'quiz-1730000000000-abc123',
      type: 'quiz',
      serverId: null,
      children: [
        {
          id: 'text-question-1',
          type: 'text',
          content: { label: 'What is your primary goal?' },
          props: {
            size: 'lg',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a', marginBottom: '24px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
        {
          id: 'answer-1',
          type: 'answer',
          content: { src: '🎯', alt: '' },
          badge: { enabled: false, label: '', textColor: '', backgroundColor: '' },
          props: { mediaType: 'emoji', size: 'md', selected: false },
          styles: { padding: '16px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
          children: [
            {
              id: 'text-answer-1',
              type: 'text',
              content: { label: 'Grow my business' },
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
        },
        {
          id: 'answer-2',
          type: 'answer',
          content: { src: '📚', alt: '' },
          badge: { enabled: false, label: '', textColor: '', backgroundColor: '' },
          props: { mediaType: 'emoji', size: 'md', selected: false },
          styles: { padding: '16px' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
          children: [
            {
              id: 'text-answer-2',
              type: 'text',
              content: { label: 'Learn new skills' },
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
        },
      ],
      props: {
        align: 'center',
        borderRadius: 'SOFT',
        size: 'md',
      },
      styles: {
        padding: '32px',
      },
    },
  ],

  aiInstructions: `
# Quiz Element AI Instructions

## Overview
- **Type**: 'quiz'
- **Purpose**: Container for displaying a quiz question with visual answer options in grid layout
- **Has Link**: No
- **Has Children**: Yes (TextElement question + AnswerElements)

## REQUIRED FIELDS (MUST always be present)

Every quiz element MUST include ALL of these fields:

1. **id** - Format: 'quiz-{timestamp}-{random}' (e.g., 'quiz-1234567890-abc')
2. **type** - Literal 'quiz'
3. **name** - String identifier (default: 'Quiz')
4. **serverId** - Either null or a number (default: null)
5. **props** - Object with ALL 3 properties: 'align', 'borderRadius', 'size'
6. **styles** - Object with at least 'backgroundColor'
7. **children** - Array with: [TextElement question, AnswerElements]

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| name | 'Quiz' |
| serverId | null |
| props.align | 'center' |
| props.borderRadius | 'SOFT' |
| props.size | 'lg' |
| styles.backgroundColor | 'transparent' |

## CHILDREN ARRAY STRUCTURE

The children array MUST follow this order:

1. **First child**: TextElement (question)
   - Type: 'text'
   - Purpose: Display the quiz question
   - Typically center-aligned
   - Example label: "Which scene appeals most to you?"

2. **Remaining children**: AnswerElements (variable count, typically 2-4)
   - Type: 'answer'
   - Purpose: Display visual answer options in grid layout
   - Each contains a TextElement child for the answer label
   - Each has optional image in content.src
   - Grid columns determined by size prop

## ANSWER ELEMENT STRUCTURE

Each answer element MUST include:
- **content**: Object with 'src' (image URL) and 'alt' (accessibility text)
- **props**: Object with 'borderRadius'
- **styles**: Object with styling properties
- **children**: Array with single TextElement for label

## COMMON MISTAKES

❌ **WRONG**: Incomplete props object
{
  "props": { "align": "center" }
}

✅ **CORRECT**: All props properties
{
  "props": { "align": "center", "borderRadius": "SOFT", "size": "lg" }
}

---

❌ **WRONG**: Missing serverId
{
  "type": "quiz",
  "props": {},
  "styles": {}
}

✅ **CORRECT**: Always include serverId
{
  "type": "quiz",
  "serverId": null,
  "props": {},
  "styles": {}
}

---

❌ **WRONG**: Answer missing content object
{
  "type": "answer",
  "props": { "borderRadius": "SOFT" }
}

✅ **CORRECT**: Answer with complete content
{
  "type": "answer",
  "content": { "src": "", "alt": "Answer" },
  "props": { "borderRadius": "SOFT" }
}

---

❌ **WRONG**: Answer without TextElement child
{
  "type": "answer",
  "content": { "src": "", "alt": "Answer label" }
}

✅ **CORRECT**: Answer with TextElement child
{
  "type": "answer",
  "content": { "src": "", "alt": "" },
  "children": [
    { "type": "text", "content": { "label": "Answer label" } }
  ]
}

## PROPS DETAILS

- **align**: Controls horizontal alignment of content ('left', 'center', 'right')
- **borderRadius**: Border radius style for answer cards ('NONE', 'SOFT', 'ROUNDED')
- **size**: Controls grid columns:
  - 'sm': 1 column (stacked)
  - 'md': 2 columns
  - 'lg': 2-3 columns
  - 'xl': 3-4 columns

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, padding, margin, gap, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Other**: borderRadius, boxShadow, opacity, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

**Colors can be**:
- Theme properties: 'backgroundColor', 'textColor', 'borderColor' (resolved from theme)
- Hex codes: '#FFFFFF', '#000000'
- RGB/RGBA: 'rgba(0, 0, 0, 0.1)'

## USE CASE EXAMPLES

### Example 1: Visual Preference Quiz
{
  "id": "quiz-1234567890-abc",
  "type": "quiz",
  "name": "Quiz",
  "serverId": null,
  "props": {
    "align": "center",
    "borderRadius": "ROUNDED",
    "size": "lg"
  },
  "styles": {
    "backgroundColor": "transparent"
  },
  "children": [
    {
      "id": "text-1234567891-def",
      "type": "text",
      "content": { "label": "Which style do you prefer?" },
      "props": {
        "size": "lg",
        "align": "center",
        "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "#0D1911" }
    },
    {
      "id": "answer-1234567892-ghi",
      "type": "answer",
      "content": { "src": "https://example.com/modern.jpg", "alt": "Modern" },
      "props": { "borderRadius": "ROUNDED" },
      "styles": { "backgroundColor": "#FFFFFF" },
      "children": [
        {
          "id": "text-1234567893-jkl",
          "type": "text",
          "content": { "label": "Modern" },
          "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
          "styles": { "color": "textColor" }
        }
      ]
    },
    {
      "id": "answer-1234567894-mno",
      "type": "answer",
      "content": { "src": "https://example.com/classic.jpg", "alt": "Classic" },
      "props": { "borderRadius": "ROUNDED" },
      "styles": { "backgroundColor": "#FFFFFF" },
      "children": [
        {
          "id": "text-1234567895-pqr",
          "type": "text",
          "content": { "label": "Classic" },
          "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
          "styles": { "color": "textColor" }
        }
      ]
    }
  ]
}

### Example 2: Goals Quiz with Emojis
{
  "id": "quiz-1234567896-stu",
  "type": "quiz",
  "name": "Quiz",
  "serverId": null,
  "props": {
    "align": "center",
    "borderRadius": "SOFT",
    "size": "md"
  },
  "styles": {
    "backgroundColor": "transparent",
    "padding": "24px"
  },
  "children": [
    {
      "id": "text-1234567897-vwx",
      "type": "text",
      "content": { "label": "What's your primary goal?" },
      "props": {
        "size": "lg",
        "align": "center",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "textColor" }
    },
    {
      "id": "answer-1234567898-yza",
      "type": "answer",
      "content": { "src": "🎯", "alt": "" },
      "props": { "borderRadius": "SOFT" },
      "styles": { "backgroundColor": "#F5F5F5" },
      "children": [
        {
          "id": "text-1234567899-bcd",
          "type": "text",
          "content": { "label": "Grow Business" },
          "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
          "styles": { "color": "textColor" }
        }
      ]
    },
    {
      "id": "answer-1234567900-efg",
      "type": "answer",
      "content": { "src": "📚", "alt": "" },
      "props": { "borderRadius": "SOFT" },
      "styles": { "backgroundColor": "#F5F5F5" },
      "children": [
        {
          "id": "text-1234567901-hij",
          "type": "text",
          "content": { "label": "Learn Skills" },
          "props": { "size": "md", "align": "center", "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false } },
          "styles": { "color": "textColor" }
        }
      ]
    }
  ]
}

## CONTENT GUIDELINES

- Make quiz questions **clear and specific**
- Use **center alignment** for better UX
- Choose size based on answer count:
  - sm: 1 column (vertical stack)
  - md: 2 columns
  - lg: 3 columns
  - xl: 4 columns
- Use **SOFT or ROUNDED borderRadius** for modern look
- Each AnswerElement should have:
  - Media (emoji/icon/image) for visual appeal
  - TextElement child with the answer text
- Keep answers **concise and mutually exclusive**
- Use appropriate emojis that relate to the answer
- Common quiz topics: goals, preferences, interests, pain points

## NOTES

- ID format: 'quiz-{timestamp}-{random}' (auto-generated)
- Children array must contain: question TextElement and at least one AnswerElement
- First child is always TextElement (question)
- AnswerElements displayed in responsive grid layout
- Grid columns controlled by size prop
- The serverId is used for backend integration and tracking (null by default)
- Each answer can have an optional background image (content.src)
- AnswerElements contain TextElement children for labels
- Border radius applies to answer cards
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
  `,

  createDefault: (overrides = {}) => ({
    id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'quiz',
    serverId: null,
    children: [
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'What is your question?' },
        props: {
          size: 'lg',
          align: 'center',
          borderRadius: 'NONE',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: { color: '#1a1a1a', marginBottom: '20px' },
        link: { enabled: false, href: '', target: '_self', type: 'external' },
      },
    ],
    props: {
      align: 'center',
      borderRadius: 'NONE',
      size: 'md',
    },
    styles: {
      padding: '24px',
    },
    ...overrides,
  }),
}
