import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Embed Element Schema
 * Matches the exact JSON structure from frontend EmbedElement
 */
export const EmbedElementSchema = z.object({
  id: z.string(),
  type: z.literal('embed'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: z.object({
    embedCode: z.string(), // HTML/script/iframe code to embed
  }),
  props: z.object({
    showPreview: z.boolean(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
})

export type EmbedElement = z.infer<typeof EmbedElementSchema>

export const EmbedElementDefinition: ElementDefinition = {
  type: 'embed',
  name: 'Embed',
  category: 'Visuals & Media',
  description: 'An embed element for custom HTML, scripts, iframes, and third-party content',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['embed'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          embedCode: { type: 'string', description: 'HTML/script/iframe code to embed' },
        },
        required: ['embedCode'],
      },
      props: {
        type: 'object',
        properties: {
          showPreview: { type: 'boolean', description: 'Whether to show preview or placeholder' },
        },
        required: ['showPreview'],
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: EmbedElementSchema,

  examples: [
    {
      id: 'embed-1730000000000-abc123',
      type: 'embed',
      content: {
        embedCode: '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>',
      },
      props: {
        showPreview: true,
      },
      styles: {
        margin: '20px 0',
      },
    },
    {
      id: 'embed-1730000000001-def456',
      type: 'embed',
      content: {
        embedCode: '<script async src="https://platform.twitter.com/widgets.js"></script><blockquote class="twitter-tweet"><p>Sample tweet</p></blockquote>',
      },
      props: {
        showPreview: false,
      },
      styles: {
        margin: '16px 0',
      },
    },
  ],

  aiInstructions: `
# Embed Element AI Instructions

## Overview
- **Type**: 'embed'
- **Purpose**: Create custom UI components using one complete HTML file with embedded style and script tags
- **Has Link**: No
- **Has Children**: No

**IMPORTANT - When to Use Embed:**
- **ONLY use** when user explicitly requests a custom/special UI component or widget that we don't have built-in elements for
- **Examples of appropriate use**: Custom countdown timers, interactive quizzes/polls, custom animations, special effects, unique widgets
- **Do NOT use** for standard elements we already support (videos, buttons, text, forms, images, etc.)
- **Structure**: Must be a self-contained HTML document with all CSS in style tags and all JavaScript in script tags

## REQUIRED FIELDS (MUST always be present)

Every embed element MUST include ALL of these fields:

1. **id** - Format: 'embed-{timestamp}-{random}' (e.g., 'embed-1234567890-abc')
2. **type** - Literal 'embed'
3. **content** - Object with 'embedCode'
4. **props** - Object with 'showPreview'
5. **styles** - Object with 'backgroundColor', 'padding', and 'margin' (minimum required)

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| content.embedCode | '' |
| props.showPreview | false |
| styles.backgroundColor | 'transparent' |
| styles.padding | '0px' |
| styles.margin | '0px' |

## COMMON MISTAKES

❌ **WRONG**: Missing content.embedCode
{
  "content": {}
}

✅ **CORRECT**: Include embedCode (can be empty string)
{
  "content": { "embedCode": "" }
}

---

❌ **WRONG**: Mixing styles incorrectly
{
  "styles": { "backgroundColor": "transparent", "padding": 16 }
}

✅ **CORRECT**: Spacing always needs units
{
  "styles": { "backgroundColor": "transparent", "padding": "16px" }
}

---

❌ **WRONG**: Missing props.showPreview
{
  "props": {}
}

✅ **CORRECT**: Include showPreview
{
  "props": { "showPreview": false }
}

---

❌ **WRONG**: Using number for spacing
{
  "styles": { "padding": 0, "margin": 0 }
}

✅ **CORRECT**: Spacing must be string with units
{
  "styles": { "padding": "0px", "margin": "0px" }
}

---

❌ **WRONG**: Using Embed for YouTube video
{
  "content": { "embedCode": "<iframe src=\"https://www.youtube.com/embed/abc123\"></iframe>" }
}

✅ **CORRECT**: Use Video element instead
// Use the Video element with videoUrl property - not Embed!

---

❌ **WRONG**: Using Embed for a button
{
  "content": { "embedCode": "<button>Click Me</button>" }
}

✅ **CORRECT**: Use Button element instead
// Use the Button element - not Embed!

---

❌ **WRONG**: External CSS/JS references
{
  "content": {
    "embedCode": "<link rel=\"stylesheet\" href=\"styles.css\"><script src=\"app.js\"></script>"
  }
}

✅ **CORRECT**: Embedded styles and scripts
{
  "content": {
    "embedCode": "<div><style>/* CSS here */</style><div>Content</div><script>// JS here</script></div>"
  }
}

## WHEN TO USE EMBED ELEMENT

**CRITICAL DECISION LOGIC** - Before creating an Embed element, ask yourself:

1. **Does a built-in element exist for this?**
   - Video/YouTube → Use Video element instead
   - Button/CTA → Use Button element instead
   - Text/Heading → Use Text element instead
   - Form/Input → Use Form elements instead
   - Image → Use Image element instead
   - Social icons → Use SocialLinks element instead

2. **Is the user asking for a custom/special UI component?**
   - ✅ Custom countdown timer → Use Embed
   - ✅ Interactive quiz widget → Use Embed
   - ✅ Custom animation/effect → Use Embed
   - ✅ Special calculator widget → Use Embed
   - ✅ Custom progress indicator → Use Embed

3. **Can it be built with HTML/CSS/JavaScript?**
   - If yes, and it's a custom component → Use Embed
   - If no, suggest the user needs custom development

**ONLY use Embed when:**
- User explicitly requests a custom/special UI component
- No existing builder element can fulfill the requirement
- The component can be built as self-contained HTML/CSS/JavaScript

## HTML STRUCTURE REQUIREMENTS

The embedCode must be a complete, self-contained HTML document:

**Required Structure:**
<div>
  <style>
    /* All CSS styles go here */
    .my-custom-class {
      color: #333;
    }
  </style>

  <!-- HTML content here -->
  <div class="my-custom-class">
    Content
  </div>

  <script>
    // All JavaScript code goes here
    console.log('Custom code');
  </script>
</div>

**Rules:**
- ALL CSS must be in style tags (no external stylesheets)
- ALL JavaScript must be in script tags (no external scripts)
- No external file references or CDN links
- Everything in one self-contained HTML string

## THEME PROPERTIES

Colors can be specified in two ways:

1. **Theme Properties** (preferred for consistency):
   - 'backgroundColor', 'borderColor', 'textColor', etc.
   - Resolved at render time from theme
   - Example: { "backgroundColor": "backgroundColor" }

2. **Direct Colors**:
   - Hex: '#3b82f6', '#FFFFFF', '#000000'
   - RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'
   - Example: { "backgroundColor": "#3b82f6" }

**Note**: Theme properties work for ANY color, not just backgroundColor/color.

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, borderColor, etc.
- **Spacing**: margin, padding, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: opacity, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

## USE CASE EXAMPLES

### Example 1: Custom Countdown Timer
{
  "id": "embed-1234567890-abc",
  "type": "embed",
  "content": {
    "embedCode": "<div><style>.timer{font-size:48px;font-weight:bold;text-align:center;color:#333;padding:20px;background:#f5f5f5;border-radius:8px;}</style><div class=\"timer\" id=\"countdown\">10:00</div><script>let time=600;const el=document.getElementById('countdown');setInterval(()=>{const m=Math.floor(time/60);const s=time%60;el.textContent=m+':'+(s<10?'0':'')+s;time--;if(time<0)time=600;},1000);</script></div>"
  },
  "props": {
    "showPreview": true
  },
  "styles": {
    "backgroundColor": "transparent",
    "padding": "0px",
    "margin": "0px"
  }
}

### Example 2: Interactive Quiz Widget
{
  "id": "embed-1234567891-def",
  "type": "embed",
  "content": {
    "embedCode": "<div><style>.quiz{padding:24px;background:#fff;border:2px solid #e0e0e0;border-radius:8px;}.question{font-size:18px;margin-bottom:16px;font-weight:600;}.option{padding:12px;margin:8px 0;background:#f5f5f5;border-radius:4px;cursor:pointer;transition:0.2s;}.option:hover{background:#e0e0e0;}.correct{background:#4caf50!important;color:white;}</style><div class=\"quiz\"><div class=\"question\">What is 2+2?</div><div class=\"option\" onclick=\"check(this,false)\">3</div><div class=\"option\" onclick=\"check(this,true)\">4</div><div class=\"option\" onclick=\"check(this,false)\">5</div></div><script>function check(el,correct){if(correct){el.classList.add('correct');el.textContent='✓ Correct!';setTimeout(()=>alert('Well done!'),300);}else{el.style.background='#f44336';el.style.color='white';el.textContent='✗ Try again';}}</script></div>"
  },
  "props": {
    "showPreview": true
  },
  "styles": {
    "backgroundColor": "transparent",
    "padding": "16px",
    "margin": "16px"
  }
}

### Example 3: Custom Progress Indicator
{
  "id": "embed-1234567892-ghi",
  "type": "embed",
  "content": {
    "embedCode": "<div><style>.progress-container{width:100%;background:#e0e0e0;border-radius:20px;height:30px;overflow:hidden;}.progress-bar{height:100%;background:linear-gradient(90deg,#4caf50,#8bc34a);width:0%;transition:width 0.5s;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;}</style><div class=\"progress-container\"><div class=\"progress-bar\" id=\"progress\">0%</div></div><script>let progress=0;setInterval(()=>{progress+=5;if(progress>100)progress=0;document.getElementById('progress').style.width=progress+'%';document.getElementById('progress').textContent=progress+'%';},200);</script></div>"
  },
  "props": {
    "showPreview": true
  },
  "styles": {
    "backgroundColor": "transparent",
    "padding": "20px",
    "margin": "0px"
  }
}

### Example 4: Custom Calculator Widget
{
  "id": "embed-1234567893-jkl",
  "type": "embed",
  "content": {
    "embedCode": "<div><style>.calc{max-width:300px;padding:20px;background:#2c3e50;border-radius:12px;color:white;}.calc-display{background:#34495e;padding:20px;border-radius:8px;font-size:32px;text-align:right;margin-bottom:16px;}.calc-btn{display:inline-block;width:23%;margin:1%;padding:20px;background:#3498db;border:none;border-radius:8px;color:white;font-size:18px;cursor:pointer;text-align:center;}.calc-btn:hover{background:#2980b9;}</style><div class=\"calc\"><div class=\"calc-display\" id=\"display\">0</div><div><button class=\"calc-btn\" onclick=\"clearDisplay()\">C</button><button class=\"calc-btn\" onclick=\"appendNum('7')\">7</button><button class=\"calc-btn\" onclick=\"appendNum('8')\">8</button><button class=\"calc-btn\" onclick=\"appendNum('9')\">9</button><button class=\"calc-btn\" onclick=\"appendNum('4')\">4</button><button class=\"calc-btn\" onclick=\"appendNum('5')\">5</button><button class=\"calc-btn\" onclick=\"appendNum('6')\">6</button><button class=\"calc-btn\" onclick=\"calculate()\">=</button></div></div><script>let display=document.getElementById('display');let current='0';function appendNum(n){current=current==='0'?n:current+n;display.textContent=current;}function clearDisplay(){current='0';display.textContent=current;}function calculate(){try{current=eval(current).toString();display.textContent=current;}catch(e){display.textContent='Error';}}</script></div>"
  },
  "props": {
    "showPreview": true
  },
  "styles": {
    "backgroundColor": "transparent",
    "padding": "0px",
    "margin": "16px"
  }
}

## NOTES

- ID format: 'embed-{timestamp}-{random}' (auto-generated)
- **IMPORTANT**: Embed is ONLY for custom UI components/widgets not available in the builder
- **Check existing elements first**: Video, Button, Text, Form, Image, etc. before using Embed
- **Structure requirement**: embedCode must be self-contained HTML with embedded style and script tags
- **No external references**: All CSS and JavaScript must be embedded (no CDN links or external files)
- ShowPreview controls whether embed renders or shows placeholder
- Colors: Can use theme colors ('backgroundColor') or hex codes
- All props and content properties are required
- No link support for embeds
- Deep merge supported: can override nested properties
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- BorderWidth must be STRING with units (e.g., "1px" not 1)
- Use caution with untrusted embed codes for security
  `,

  createDefault: (overrides = {}) => ({
    id: `embed-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'embed',
    content: {
      embedCode: '<div>Embed code here</div>',
    },
    props: {
      showPreview: false,
    },
    styles: {
      margin: '16px 0',
    },
    ...overrides,
  }),
}
