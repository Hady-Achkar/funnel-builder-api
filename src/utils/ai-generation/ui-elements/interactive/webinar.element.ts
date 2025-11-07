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
# Webinar Element AI Instructions

## Overview
- **Type**: 'webinar'
- **Purpose**: Video player with timed button reveal functionality
- **Has Link**: No
- **Has Children**: Yes (ButtonElement array)

## REQUIRED FIELDS (MUST always be present)

Every webinar element MUST include ALL of these fields:

1. **id** - Format: 'webinar-{timestamp}-{random}' (e.g., 'webinar-1234567890-abc')
2. **type** - Literal 'webinar'
3. **content** - Object with 'videoUrl' property
4. **props** - Object with 'showButtonAfter' nested object
5. **props.showButtonAfter** - Object with 'minutes' and 'seconds' properties
6. **styles** - Object (can be empty)
7. **children** - Array with EXACTLY one ButtonElement

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| content.videoUrl | '' |
| props.showButtonAfter.minutes | 0 |
| props.showButtonAfter.seconds | 0 |
| styles | {} |

## CHILDREN ARRAY STRUCTURE

The children array MUST contain EXACTLY ONE ButtonElement:

**IMPORTANT**: Webinar elements support ONLY ONE button - no more, no less
- **Type**: 'button'
- **Purpose**: Single action revealed after video plays for specified time
- Standard ButtonElement structure with full link configuration
- Common labels: "Continue", "Get Started", "Next Step"

## CONTENT OBJECT - VIDEO URL RULES

The content object configures the video source:

**Video URL Rules**:
- If the user provides a specific video URL in their prompt, use that exact URL in content.videoUrl
- If the user does NOT provide a video URL, content.videoUrl MUST be an empty string ''
- **Do NOT generate, make up, or use placeholder/example URLs** (like youtube.com/watch?v=..., vimeo.com/..., etc.)
- Only use a URL if the user explicitly gives you one
- Users can provide video URLs either in their prompt or through the UI later

## COMMON MISTAKES

❌ **WRONG**: Missing content object
{
  "type": "webinar",
  "props": { "showButtonAfter": { "minutes": 0, "seconds": 0 } }
}

✅ **CORRECT**: Always include content
{
  "type": "webinar",
  "content": { "videoUrl": "" },
  "props": { "showButtonAfter": { "minutes": 0, "seconds": 0 } }
}

---

❌ **WRONG**: Incomplete showButtonAfter object
{
  "props": { "showButtonAfter": { "minutes": 2 } }
}

✅ **CORRECT**: Both minutes and seconds
{
  "props": { "showButtonAfter": { "minutes": 2, "seconds": 30 } }
}

---

❌ **WRONG**: Missing children array
{
  "type": "webinar",
  "content": { "videoUrl": "" },
  "props": { "showButtonAfter": { "minutes": 0, "seconds": 0 } }
}

✅ **CORRECT**: Always include children
{
  "type": "webinar",
  "content": { "videoUrl": "" },
  "props": { "showButtonAfter": { "minutes": 0, "seconds": 0 } },
  "children": [...]
}

---

❌ **WRONG**: showButtonAfter at root level
{
  "showButtonAfter": { "minutes": 2, "seconds": 0 }
}

✅ **CORRECT**: Nested under props
{
  "props": { "showButtonAfter": { "minutes": 2, "seconds": 0 } }
}

---

❌ **WRONG**: Making up or using placeholder video URLs
{
  "content": { "videoUrl": "https://www.youtube.com/watch?v=example123" }
}

✅ **CORRECT**: Empty videoUrl when user didn't provide one
{
  "content": { "videoUrl": "" }
}

✅ **CORRECT**: Use exact URL if user provided one
{
  // User said: "Add a webinar with this video: https://youtu.be/abc123"
  "content": { "videoUrl": "https://youtu.be/abc123" }
}

---

❌ **WRONG**: Multiple buttons in children array
{
  "children": [
    { "type": "button", "content": { "label": "Continue" }, ... },
    { "type": "button", "content": { "label": "Skip" }, ... }
  ]
}

✅ **CORRECT**: EXACTLY one button
{
  "children": [
    { "type": "button", "content": { "label": "Continue" }, ... }
  ]
}

## PROPS OBJECT

The props.showButtonAfter object controls button reveal timing:
- **minutes**: Number of minutes to wait (integer, default: 0)
- **seconds**: Number of seconds to wait (0-59, default: 0)
- **Example**: { minutes: 2, seconds: 30 } = buttons appear after 2:30 of playback

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, padding, margin, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

**Colors can be**:
- Theme properties: 'backgroundColor', 'textColor', 'borderColor' (resolved from theme)
- Hex codes: '#FFFFFF', '#000000'
- RGB/RGBA: 'rgba(0, 0, 0, 0.1)'

## USE CASE EXAMPLES

### Example 1: Product Demo Webinar
{
  "id": "webinar-1234567890-abc",
  "type": "webinar",
  "content": {
    "videoUrl": ""
  },
  "props": {
    "showButtonAfter": {
      "minutes": 5,
      "seconds": 0
    }
  },
  "styles": {},
  "children": [
    {
      "id": "button-1234567891-def",
      "type": "button",
      "content": { "label": "Get Started Now" },
      "props": {
        "size": "lg",
        "align": "center",
        "borderRadius": "SOFT",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "buttonTextColor", "backgroundColor": "buttonColor" },
      "link": { "enabled": true, "href": "/signup", "target": "_self", "type": "internal" }
    }
  ]
}

### Example 2: Training Video
{
  "id": "webinar-1234567892-ghi",
  "type": "webinar",
  "content": {
    "videoUrl": ""
  },
  "props": {
    "showButtonAfter": {
      "minutes": 2,
      "seconds": 30
    }
  },
  "styles": {
    "padding": "24px",
    "backgroundColor": "#F5F5F5",
    "borderRadius": "8px"
  },
  "children": [
    {
      "id": "button-1234567893-jkl",
      "type": "button",
      "content": { "label": "Continue to Next Step" },
      "props": {
        "size": "md",
        "align": "center",
        "borderRadius": "SOFT",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "buttonTextColor", "backgroundColor": "buttonColor" },
      "link": { "enabled": true, "href": "/step-2", "target": "_self", "type": "internal" }
    }
  ]
}

### Example 3: Instant Button (No Delay)
{
  "id": "webinar-1234567895-pqr",
  "type": "webinar",
  "content": {
    "videoUrl": ""
  },
  "props": {
    "showButtonAfter": {
      "minutes": 0,
      "seconds": 0
    }
  },
  "styles": {},
  "children": [
    {
      "id": "button-1234567896-stu",
      "type": "button",
      "content": { "label": "Watch Later" },
      "props": {
        "size": "md",
        "align": "center",
        "borderRadius": "SOFT",
        "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
      },
      "styles": { "color": "buttonTextColor", "backgroundColor": "buttonColor" },
      "link": { "enabled": true, "href": "/dashboard", "target": "_self", "type": "internal" }
    }
  ]
}

## CONTENT GUIDELINES

- **Video URL**: Use the exact URL if user provides one in their prompt, otherwise empty string ''
- **Do NOT generate or make up video URLs** - only use URLs explicitly provided by the user
- Include at least one ButtonElement child as the CTA
- The button will be hidden until the specified time
- Set showButtonAfter based on video content:
  - **Short pitch (2-3 min)**: Show button after 1-2 minutes
  - **Medium webinar (10-15 min)**: Show button after 5-10 minutes
  - **Long webinar (30+ min)**: Show button after 15-20 minutes
- Button should have strong CTA text:
  - "Get Special Offer"
  - "Claim Your Bonus"
  - "Register Now"
  - "Get Started Today"
- Make button prominent (xl size, bold, contrasting colors)
- Use action-oriented red/orange colors for urgency
- Add margin for spacing
- Use center alignment for buttons

## NOTES

- ID format: 'webinar-{timestamp}-{random}' (auto-generated)
- **IMPORTANT**: Children array MUST contain EXACTLY ONE ButtonElement - no more, no less
- **Video URL**: Use the exact URL if user provides one in their prompt, otherwise empty string ''
- **Do NOT generate or make up video URLs** - only use URLs explicitly provided by the user
- Video playback tracking: Button revealed after user watches for specified duration
- Time format: minutes (integer) + seconds (0-59)
- Setting both to 0 shows button immediately
- Button is hidden initially and revealed at the specified time
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
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
