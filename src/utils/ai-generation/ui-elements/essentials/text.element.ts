import { z } from 'zod'
import { ElementDefinition, LinkSchema, FormatSchema } from '../types'

/**
 * Text Element Schema
 * Matches the exact JSON structure from frontend TextElement
 */
export const TextElementSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    label: z.string(), // Can include HTML content
  }),
  props: z.object({
    size: z.enum(['sm', 'md', 'lg', 'xl']),
    align: z.enum(['left', 'center', 'right', 'justify']),
    borderRadius: z.enum(['NONE', 'SOFT', 'ROUNDED']),
    format: FormatSchema,
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  link: LinkSchema,
})

export type TextElement = z.infer<typeof TextElementSchema>

export const TextElementDefinition: ElementDefinition = {
  type: 'text',
  name: 'Text',
  category: 'Essentials',
  description: 'A text element with rich formatting options including size, alignment, and text decorations',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['text'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Text content, can include HTML' },
        },
        required: ['label'],
      },
      props: {
        type: 'object',
        properties: {
          size: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
          align: { type: 'string', enum: ['left', 'center', 'right', 'justify'] },
          borderRadius: { type: 'string', enum: ['NONE', 'SOFT', 'ROUNDED'] },
          format: {
            type: 'object',
            properties: {
              bold: { type: 'boolean' },
              italic: { type: 'boolean' },
              underline: { type: 'boolean' },
              strikethrough: { type: 'boolean' },
            },
            required: ['bold', 'italic', 'underline', 'strikethrough'],
          },
        },
        required: ['size', 'align', 'borderRadius', 'format'],
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

  zodSchema: TextElementSchema,

  examples: [
    {
      id: 'text-1730000000000-abc123',
      type: 'text',
      content: {
        label: 'Welcome to Our Product',
      },
      props: {
        size: 'xl',
        align: 'center',
        borderRadius: 'NONE',
        format: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        },
      },
      styles: {
        color: '#1a1a1a',
        padding: '16px',
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
# Text Element AI Instructions

## Overview
- **Type**: 'text'
- **Purpose**: Rich text content with HTML support and formatting options
- **Has Link**: Yes
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every text element MUST include ALL of these fields:

1. **id** - Format: 'text-{timestamp}-{random}' (e.g., 'text-1234567890-abc')
2. **type** - Literal 'text'
3. **content** - Object with 'label'
4. **content.label** - Text or HTML content
5. **props** - Object with 'size', 'align', 'borderRadius', 'format'
6. **props.format** - Object with ALL 4 booleans: 'bold', 'italic', 'underline', 'strikethrough'
7. **styles** - Object with 'color' (minimum required)
8. **link** - Object with ALL 4 properties: 'enabled', 'href', 'target', 'type'

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| props.size | 'md' |
| props.align | 'left' |
| props.borderRadius | 'NONE' |
| props.format.bold | false |
| props.format.italic | false |
| props.format.underline | false |
| props.format.strikethrough | false |
| styles.color | 'textColor' |
| link.enabled | false |
| link.href | '' |
| link.target | '_self' |
| link.type | 'internal' |

## COMMON MISTAKES

❌ **WRONG**: Missing format properties
{
  "format": { "bold": true }
}

✅ **CORRECT**: All format properties present
{
  "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
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

---

❌ **WRONG**: Incomplete link object
{
  "link": { "enabled": false }
}

✅ **CORRECT**: All link properties present
{
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

---

❌ **WRONG**: Plain text in content.label
{
  "content": { "label": "Hello World" }
}

✅ **CORRECT**: HTML-wrapped content
{
  "content": { "label": "<p>Hello World</p>" }
}

## HTML CONTENT SUPPORT (CRITICAL)

The **content.label** field supports full HTML markup for rich text content:

### Supported HTML Tags:
- **Paragraphs**: <p>Text</p>
- **Headings**: <h1>, <h2>, <h3>, <h4>, <h5>, <h6>
- **Formatting**: <strong>, <em>, <u>, <s>
- **Lists**: <ul>, <ol>, <li>
- **Line breaks**: <br>
- **Spans**: <span> for inline styling

### HTML Best Practices:
- ✅ Always wrap content in HTML tags: <p>Text</p> NOT just Text
- ✅ Use semantic tags: <h1> for main headlines, <p> for paragraphs
- ✅ Properly close all tags
- ✅ Use <strong> for bold, <em> for italic within HTML

### Example with HTML:
{
  "content": {
    "label": "<h1>Welcome to <strong>Our Product</strong></h1><p>Discover amazing features that will transform your business.</p>"
  }
}

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'textColor', 'backgroundColor', 'borderColor'
   - Resolved at render time from theme
   - Example: { "color": "textColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "color": "#1a1a1a" }

**Note**: Theme properties work for ANY color property, not just color/backgroundColor.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: color, backgroundColor, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, transform, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em', '100%'
- ❌ Wrong: 16, 1, 2, 100

**CRITICAL**: Border widths MUST be strings with units:
- ✅ Correct: borderWidth: "1px", borderWidth: "2px"
- ❌ Wrong: borderWidth: 1, borderWidth: 2

## TEXT HIERARCHY (CRITICAL)

Choose size based on the text's role in the content hierarchy:

- **xl**: Main headlines, hero text, page titles
  - Use with h1 tags: <h1>Main Headline</h1>
  - Center alignment typical
  - Bold format recommended
  - Example: "Discover the Future of AI"

- **lg**: Subheadings, section titles, important callouts
  - Use with h2/h3 tags: <h2>Section Title</h2>
  - Center or left alignment
  - Bold format optional
  - Example: "Our Key Features"

- **md**: Body text, paragraphs, normal content
  - Use with p tags: <p>Paragraph text</p>
  - Left or justify alignment
  - No bold format usually
  - Example: "We help businesses grow with innovative solutions."

- **sm**: Captions, fine print, secondary information
  - Use with p or span tags
  - Left alignment typical
  - No formatting usually
  - Example: "*Terms and conditions apply"

## ALIGNMENT GUIDELINES

- **left**: Body paragraphs, normal text, lists
- **center**: Headlines, calls-to-action, hero text
- **right**: Dates, attribution, pull quotes
- **justify**: Long-form content, articles, documentation

## FORMAT PROPERTIES GUIDELINES

### When to Use Each Format:
- **bold**: Headlines, emphasis, important words
- **italic**: Quotes, emphasis, foreign words
- **underline**: Links (when link.enabled is true), key terms
- **strikethrough**: Discounts, old prices, crossed-out text

**Note**: Format properties affect the entire text element. For inline formatting, use HTML tags within content.label instead.

## BORDER RADIUS GUIDELINES

- **NONE**: Default for text (most common)
- **SOFT**: Text with background, card-like text blocks
- **ROUNDED**: Call-out boxes, notification text, badges

## CONTENT GUIDELINES

### Be Specific and Contextual:
- ✅ Good: "<p>Join 50,000+ entrepreneurs growing their business with our platform</p>"
- ✅ Good: "<h1>Transform Your Marketing in 30 Days</h1>"
- ❌ Bad: "<p>Text</p>", "<p>Content goes here</p>", "<p>Lorem ipsum</p>"

### Use Meaningful Headlines:
- ✅ Good: <h2>Why Choose Our Solution?</h2>
- ❌ Bad: <h2>Features</h2>, <h2>Section 2</h2>

### Write Action-Oriented Text:
- ✅ Good: "<p>Start your free trial today—no credit card required</p>"
- ❌ Bad: "<p>You can try our product for free</p>"

## USE CASE EXAMPLES

### Example 1: Simple Body Paragraph
{
  "id": "text-1234567890-abc",
  "type": "text",
  "content": {
    "label": "<p>Our platform helps businesses streamline their operations and boost productivity with intelligent automation.</p>"
  },
  "props": {
    "size": "md",
    "align": "left",
    "borderRadius": "NONE",
    "format": { "bold": false, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "textColor"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 2: Hero Headline
{
  "id": "text-1234567891-def",
  "type": "text",
  "content": {
    "label": "<h1>Welcome to the <strong>Future</strong> of Business</h1>"
  },
  "props": {
    "size": "xl",
    "align": "center",
    "borderRadius": "NONE",
    "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "textColor",
    "marginBottom": "24px"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

### Example 3: Linked Call-to-Action Text
{
  "id": "text-1234567892-ghi",
  "type": "text",
  "content": {
    "label": "<p>Click here to learn more about our services</p>"
  },
  "props": {
    "size": "md",
    "align": "center",
    "borderRadius": "NONE",
    "format": { "bold": false, "italic": false, "underline": true, "strikethrough": false }
  },
  "styles": {
    "color": "textColor"
  },
  "link": { "enabled": true, "href": "/services", "target": "_self", "type": "internal" }
}

### Example 4: Styled Text Block with Background
{
  "id": "text-1234567893-jkl",
  "type": "text",
  "content": {
    "label": "<p><strong>Limited Time Offer:</strong> Get 50% off your first month when you sign up today!</p>"
  },
  "props": {
    "size": "lg",
    "align": "center",
    "borderRadius": "SOFT",
    "format": { "bold": true, "italic": false, "underline": false, "strikethrough": false }
  },
  "styles": {
    "color": "textColor",
    "backgroundColor": "backgroundColor",
    "padding": "20px",
    "borderWidth": "1px",
    "borderColor": "borderColor",
    "borderStyle": "solid"
  },
  "link": { "enabled": false, "href": "", "target": "_self", "type": "internal" }
}

## NOTES

- ID format: 'text-{timestamp}-{random}' (auto-generated)
- **Content.label supports full HTML markup** - always wrap in HTML tags
- Use semantic HTML tags: <h1> for headings, <p> for paragraphs
- For inline formatting, use HTML tags (<strong>, <em>) instead of format props
- Choose size based on text hierarchy (xl=headlines, lg=subheadings, md=body, sm=captions)
- Align center for headlines, left for body text
- borderRadius usually 'NONE' for text (use SOFT/ROUNDED only with backgrounds)
- Link object always required even if link.enabled is false
- All format properties required (even if all false)
- Spacing values must include units ('16px' not 16)
- Border widths must be strings with units ("1px" not 1)
- Use theme properties for colors when possible for consistency
  `,

  createDefault: (overrides = {}) => ({
    id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'text',
    content: {
      label: 'Enter your text here',
    },
    props: {
      size: 'md',
      align: 'left',
      borderRadius: 'NONE',
      format: {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
      },
    },
    styles: {
      color: '#1a1a1a',
      padding: '8px',
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
