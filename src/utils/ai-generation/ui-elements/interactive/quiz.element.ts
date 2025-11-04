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
When generating a quiz element:
- ALWAYS include these children in order:
  1. First: TextElement as the question
  2. Rest: AnswerElements (typically 2-4 options)
- Make the question clear and specific
- Use center alignment for better UX
- Choose size based on answer count:
  - sm: 1 column (vertical stack)
  - md: 2 columns
  - lg: 3 columns
  - xl: 4 columns
- Use SOFT or ROUNDED borderRadius for modern look
- Set serverId to null (will be assigned by backend)
- Each AnswerElement should have:
  - Media (emoji/icon/image) for visual appeal
  - TextElement child with the answer text
- Keep answers concise and mutually exclusive
- Use appropriate emojis that relate to the answer
- Add padding for spacing
- Common quiz topics: goals, preferences, interests, pain points
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
