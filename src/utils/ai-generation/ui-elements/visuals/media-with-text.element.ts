import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * MediaWithText Element Schema
 * Matches the exact JSON structure from frontend MediaWithTextElement
 * Container element with MediaElement and TextElement as children
 */
export const MediaWithTextElementSchema = z.object({
  id: z.string(),
  type: z.literal('media-with-text'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  children: z.array(z.any()).optional(), // Array of MediaElement and TextElement
  props: z.object({
    align: z.enum(['left', 'center', 'right']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type MediaWithTextElement = z.infer<typeof MediaWithTextElementSchema>

export const MediaWithTextElementDefinition: ElementDefinition = {
  type: 'media-with-text',
  name: 'Media With Text',
  category: 'Visuals & Media',
  description: 'A container element that combines media (image/emoji/icon) with text in a cohesive layout',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['media-with-text'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      children: {
        type: 'array',
        description: 'Contains MediaElement and TextElement children',
        items: { type: 'object' },
      },
      props: {
        type: 'object',
        properties: {
          align: { type: 'string', enum: ['left', 'center', 'right'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
        },
        required: ['align', 'borderRadius'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'props', 'styles'],
  },

  zodSchema: MediaWithTextElementSchema,

  examples: [
    {
      id: 'media-with-text-1730000000000-abc123',
      type: 'media-with-text',
      children: [
        {
          id: 'media-child-1',
          type: 'media',
          content: { src: '✨', alt: '' },
          props: { mediaType: 'emoji', size: 'lg', borderRadius: 'NONE' },
          styles: {},
        },
        {
          id: 'text-child-1',
          type: 'text',
          content: { label: 'Premium Feature' },
          props: {
            size: 'lg',
            align: 'center',
            borderRadius: 'NONE',
            format: { bold: true, italic: false, underline: false, strikethrough: false },
          },
          styles: { color: '#1a1a1a' },
          link: { enabled: false, href: '', target: '_self', type: 'external' },
        },
      ],
      props: {
        align: 'center',
        borderRadius: 'SOFT',
      },
      styles: {
        padding: '24px',
        backgroundColor: '#f5f5f5',
      },
    },
  ],

  aiInstructions: `
When generating a media-with-text element:
- Always include both a MediaElement and TextElement as children
- The MediaElement typically comes first (displayed above text)
- Use center alignment for feature cards and highlights
- Use left alignment for content sections
- Use right alignment sparingly for special layouts
- Choose borderRadius to match design style (SOFT for modern, NONE for clean)
- Add padding in styles for internal spacing
- Consider using backgroundColor for card-like appearance
- The media should visually support the text message
- Use emojis in MediaElement for friendly, approachable designs
- Use images in MediaElement for professional, detailed content
- Keep text concise and impactful
- This element works great for feature highlights, benefits, or testimonials
  `,

  createDefault: (overrides = {}) => ({
    id: `media-with-text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'media-with-text',
    children: [
      {
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'media',
        content: { src: '🎯', alt: '' },
        props: { mediaType: 'emoji', size: 'md', borderRadius: 'NONE' },
        styles: {},
      },
      {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        type: 'text',
        content: { label: 'Feature Title' },
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
    props: {
      align: 'center',
      borderRadius: 'NONE',
    },
    styles: {
      padding: '16px',
    },
    ...overrides,
  }),
}
