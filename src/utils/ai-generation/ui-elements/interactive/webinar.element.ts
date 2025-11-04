import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Webinar Element Schema
 * Matches the exact JSON structure from frontend WebinarElement
 * Video player with timed button reveal
 */
export const WebinarElementSchema = z.object({
  id: z.string(),
  type: z.literal('webinar'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // ButtonElements
  content: z.object({
    videoUrl: z.string(), // Video URL (YouTube, Vimeo, or direct video URL)
  }),
  props: z.object({
    showButtonAfter: z.object({
      minutes: z.number(),
      seconds: z.number(),
    }),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type WebinarElement = z.infer<typeof WebinarElementSchema>

export const WebinarElementDefinition: ElementDefinition = {
  type: 'webinar',
  name: 'Webinar',
  category: 'Surveys & Quizzes',
  description: 'A video player element with timed button reveal functionality, perfect for webinars and video sales letters',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['webinar'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains ButtonElements that appear after specified time',
        items: { type: 'object' },
      },
      content: {
        type: 'object',
        properties: {
          videoUrl: { type: 'string', description: 'Video URL (YouTube, Vimeo, or direct video URL)' },
        },
        required: ['videoUrl'],
      },
      props: {
        type: 'object',
        properties: {
          showButtonAfter: {
            type: 'object',
            properties: {
              minutes: { type: 'number' },
              seconds: { type: 'number' },
            },
            required: ['minutes', 'seconds'],
          },
        },
        required: ['showButtonAfter'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: WebinarElementSchema,

  examples: [
    {
      id: 'webinar-1730000000000-abc123',
      type: 'webinar',
      children: [
        {
          id: 'button-cta-1',
          type: 'button',
          content: { label: 'Get Special Offer' },
          props: {
            size: 'xl',
            align: 'center',
            borderRadius: 'ROUNDED',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: {
            backgroundColor: '#ff4444',
            color: '#ffffff',
            padding: '16px 32px',
            marginTop: '20px',
          },
          link: { enabled: true, href: '/offer', target: '_self', type: 'internal' },
        },
      ],
      content: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      props: {
        showButtonAfter: {
          minutes: 5,
          seconds: 30,
        },
      },
      styles: {
        margin: '32px 0',
      },
    },
  ],

  aiInstructions: `
When generating a webinar element:
- Provide a valid video URL (YouTube, Vimeo, or direct video file)
- Include at least one ButtonElement child as the CTA
- The button will be hidden until the specified time
- Set showButtonAfter based on video content:
  - Short pitch (2-3 min): Show button after 1-2 minutes
  - Medium webinar (10-15 min): Show button after 5-10 minutes
  - Long webinar (30+ min): Show button after 15-20 minutes
- Button should have strong CTA text:
  - "Get Special Offer"
  - "Claim Your Bonus"
  - "Register Now"
  - "Get Started Today"
- Make button prominent (xl size, bold, contrasting colors)
- Use action-oriented red/orange colors for urgency
- Add margin for spacing
- Use center alignment for buttons
- This element is perfect for:
  - Video sales letters (VSL)
  - Training webinars
  - Product demonstrations
  - Educational content with CTAs
  `,

  createDefault: (overrides = {}) => ({
    id: `webinar-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'webinar',
    children: [
      {
        id: `button-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'button',
        content: { label: 'Learn More' },
        props: {
          size: 'lg',
          align: 'center',
          borderRadius: 'SOFT',
          format: { bold: true, italic: false, underline: false, strikethrough: false },
        },
        styles: {
          backgroundColor: '#007bff',
          color: '#ffffff',
          padding: '12px 24px',
          marginTop: '16px',
        },
        link: { enabled: true, href: '#', target: '_self', type: 'internal' },
      },
    ],
    content: {
      videoUrl: 'https://www.youtube.com/watch?v=example',
    },
    props: {
      showButtonAfter: {
        minutes: 2,
        seconds: 0,
      },
    },
    styles: {
      margin: '20px 0',
    },
    ...overrides,
  }),
}
