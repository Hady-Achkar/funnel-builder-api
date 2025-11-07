import { z } from 'zod'
import { ElementDefinition } from '../types'

/**
 * Comparison Chart Schema Components
 */
export const ComparisonColumnSchema = z.object({
  key: z.string(),
  title: z.string(),
  highlighted: z.boolean().optional(),
})

export const ComparisonRowSchema = z.object({
  key: z.string(),
  label: z.string(),
})

export const ComparisonCellDataSchema = z.object({
  type: z.enum(['text', 'icon']),
  value: z.union([z.string(), z.boolean()]),
})

export const ComparisonColumnDataSchema = z.record(z.string(), ComparisonCellDataSchema)

export const ComparisonChartContentSchema = z.object({
  columns: z.array(ComparisonColumnSchema),
  rows: z.array(ComparisonRowSchema),
  data: z.array(ComparisonColumnDataSchema),
})

/**
 * ComparisonChart Element Schema
 * Matches the exact JSON structure from frontend ComparisonChartElement
 */
export const ComparisonChartElementSchema = z.object({
  id: z.string(),
  type: z.literal('comparison-chart'),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  parentId: z.string().optional(),
  content: ComparisonChartContentSchema,
  props: z.object({
    highlightColor: z.string().optional(),
  }),
  styles: z.record(z.string(), z.any()), // CSSProperties
  _editingColumn: z.number().optional(),
  _editingRow: z.number().optional(),
})

export type ComparisonChartElement = z.infer<typeof ComparisonChartElementSchema>

export const ComparisonChartElementDefinition: ElementDefinition = {
  type: 'comparison-chart',
  name: 'Comparison Chart',
  category: 'Informative',
  description: 'A comparison table for displaying features across different plans or products',

  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string', enum: ['comparison-chart'] },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
      parentId: { type: 'string' },
      content: {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                title: { type: 'string' },
                highlighted: { type: 'boolean' },
              },
            },
          },
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
              },
            },
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['text', 'icon'] },
                  value: { type: ['string', 'boolean'] },
                },
              },
            },
          },
        },
      },
      props: {
        type: 'object',
        properties: {
          highlightColor: { type: 'string' },
        },
      },
      styles: { type: 'object' },
    },
    required: ['id', 'type', 'content', 'props', 'styles'],
  },

  zodSchema: ComparisonChartElementSchema,

  examples: [
    {
      id: 'comparison-chart-1730000000000-abc123',
      type: 'comparison-chart',
      content: {
        columns: [
          { key: 'free', title: 'Free', highlighted: false },
          { key: 'pro', title: 'Pro', highlighted: true },
          { key: 'enterprise', title: 'Enterprise', highlighted: false },
        ],
        rows: [
          { key: 'users', label: 'Users' },
          { key: 'storage', label: 'Storage' },
          { key: 'support', label: '24/7 Support' },
          { key: 'api', label: 'API Access' },
        ],
        data: [
          {
            users: { type: 'text', value: '1' },
            storage: { type: 'text', value: '1GB' },
            support: { type: 'icon', value: false },
            api: { type: 'icon', value: false },
          },
          {
            users: { type: 'text', value: '10' },
            storage: { type: 'text', value: '50GB' },
            support: { type: 'icon', value: true },
            api: { type: 'icon', value: true },
          },
          {
            users: { type: 'text', value: 'Unlimited' },
            storage: { type: 'text', value: 'Unlimited' },
            support: { type: 'icon', value: true },
            api: { type: 'icon', value: true },
          },
        ],
      },
      props: {
        highlightColor: '#007bff',
      },
      styles: {
        margin: '32px 0',
      },
    },
  ],

  aiInstructions: `
# Comparison Chart Element AI Instructions

## Overview
- **Type**: 'comparison-chart'
- **Purpose**: Display comparison table with columns, rows, and data (supports text and icons)
- **Has Children**: No

## REQUIRED FIELDS (MUST always be present)

Every comparison chart element MUST include ALL of these fields:

1. **id** - Format: 'comparison-chart-{timestamp}-{random}' (e.g., 'comparison-chart-1234567890-abc')
2. **type** - Literal 'comparison-chart'
3. **content** - Object with 'columns', 'rows', and 'data' arrays
4. **content.columns** - Array of column objects (each with 'key', 'title', 'highlighted')
5. **content.rows** - Array of row objects (each with 'key', 'label')
6. **content.data** - Array of data objects (one per column, matching column count)
7. **props** - Object with 'highlightColor'
8. **styles** - Object with spacing and color properties

**CRITICAL**: Even if a property is not being used, it MUST still be present with its default value.

## DEFAULT VALUES

| Property | Default |
|----------|---------|
| props.highlightColor | '#3b82f6' |
| styles.backgroundColor | 'transparent' |
| styles.color | 'textColor' |
| styles.marginTop | '0px' |
| styles.marginBottom | '0px' |
| styles.marginLeft | '0px' |
| styles.marginRight | '0px' |
| styles.paddingTop | '16px' |
| styles.paddingBottom | '16px' |
| styles.paddingLeft | '16px' |
| styles.paddingRight | '16px' |

## CONTENT STRUCTURE

The content object has three interconnected arrays:

### 1. columns: Defines table columns
- Each column MUST have: 'key' (unique), 'title' (display text), 'highlighted' (boolean)
- key must be unique across all columns
- highlighted: true shows a colored border on the column

### 2. rows: Defines table rows
- Each row MUST have: 'key' (unique), 'label' (display text)
- key must be unique across all rows

### 3. data: Contains cell data for each column
- Array length MUST match columns.length
- Each data object corresponds to a column (index-matched)
- Each data object contains properties named after row keys
- Each cell MUST have: 'type' ('text' or 'icon'), 'value' (string or boolean)
- For type: 'icon': value is boolean (true = check mark, false = X mark)
- For type: 'text': value is string (any text content)

## COMMON MISTAKES

❌ **WRONG**: Data array length doesn't match columns
{
  "columns": [{ "key": "col1", "title": "Basic" }, { "key": "col2", "title": "Pro" }],
  "data": [{ "row1": { "type": "text", "value": "Test" } }]
}

✅ **CORRECT**: Data array matches columns (2 columns = 2 data objects)
{
  "columns": [{ "key": "col1", "title": "Basic" }, { "key": "col2", "title": "Pro" }],
  "data": [
    { "row1": { "type": "text", "value": "Limited" } },
    { "row1": { "type": "text", "value": "Unlimited" } }
  ]
}

---

❌ **WRONG**: Missing cell data properties
{
  "data": [
    { "row1": { "value": true } }
  ]
}

✅ **CORRECT**: Both type and value present
{
  "data": [
    { "row1": { "type": "icon", "value": true } }
  ]
}

---

❌ **WRONG**: Incomplete column object
{
  "columns": [{ "key": "col1", "title": "Basic" }]
}

✅ **CORRECT**: All column properties
{
  "columns": [{ "key": "col1", "title": "Basic", "highlighted": false }]
}

---

❌ **WRONG**: Wrong value type for icon
{
  "type": "icon", "value": "true"
}

✅ **CORRECT**: Boolean value for icons
{
  "type": "icon", "value": true
}

---

❌ **WRONG**: Data keys don't match row keys
{
  "rows": [{ "key": "feature1", "label": "Feature" }],
  "data": [{ "wrongKey": { "type": "text", "value": "Test" } }]
}

✅ **CORRECT**: Data keys match row keys
{
  "rows": [{ "key": "feature1", "label": "Feature" }],
  "data": [{ "feature1": { "type": "text", "value": "Test" } }]
}

## STYLES OBJECT

The styles object accepts **ANY valid CSS property**:
- **Colors**: backgroundColor, color, borderColor, etc.
- **Spacing**: margin, marginTop, marginBottom, padding, paddingLeft, etc.
- **Borders**: borderWidth, borderColor, borderStyle, borderRadius
- **Effects**: boxShadow, opacity, etc.

**CRITICAL**: All spacing values MUST have units:
- ✅ Correct: '16px', '1rem', '2em'
- ❌ Wrong: 16, 1, 2

**Colors can be**:
- Theme properties: 'textColor', 'backgroundColor', 'borderColor' (resolved from theme)
- Hex codes: '#3b82f6', '#FFFFFF', '#000000'
- RGB/RGBA: 'rgb(59, 130, 246)', 'rgba(0, 0, 0, 0.5)'

**Note**: Theme properties work for ANY color, not just specific fields

## USE CASE EXAMPLES

### Example 1: Simple 2-Column Comparison
{
  "id": "comparison-chart-1234567890-abc",
  "type": "comparison-chart",
  "content": {
    "columns": [
      { "key": "free", "title": "Free", "highlighted": false },
      { "key": "paid", "title": "Paid", "highlighted": true }
    ],
    "rows": [
      { "key": "feature1", "label": "Feature 1" },
      { "key": "feature2", "label": "Feature 2" },
      { "key": "support", "label": "Support" }
    ],
    "data": [
      {
        "feature1": { "type": "icon", "value": true },
        "feature2": { "type": "icon", "value": false },
        "support": { "type": "text", "value": "Email" }
      },
      {
        "feature1": { "type": "icon", "value": true },
        "feature2": { "type": "icon", "value": true },
        "support": { "type": "text", "value": "24/7" }
      }
    ]
  },
  "props": {
    "highlightColor": "#3b82f6"
  },
  "styles": {
    "backgroundColor": "transparent",
    "color": "textColor",
    "marginTop": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "marginRight": "0px",
    "paddingTop": "16px",
    "paddingBottom": "16px",
    "paddingLeft": "16px",
    "paddingRight": "16px"
  }
}

### Example 2: 3-Column Pricing Comparison
{
  "id": "comparison-chart-1234567891-def",
  "type": "comparison-chart",
  "content": {
    "columns": [
      { "key": "basic", "title": "Basic", "highlighted": false },
      { "key": "pro", "title": "Pro", "highlighted": true },
      { "key": "enterprise", "title": "Enterprise", "highlighted": false }
    ],
    "rows": [
      { "key": "users", "label": "Users" },
      { "key": "storage", "label": "Storage" },
      { "key": "api", "label": "API Access" },
      { "key": "support", "label": "Support" }
    ],
    "data": [
      {
        "users": { "type": "text", "value": "1-5" },
        "storage": { "type": "text", "value": "10 GB" },
        "api": { "type": "icon", "value": false },
        "support": { "type": "text", "value": "Email" }
      },
      {
        "users": { "type": "text", "value": "1-50" },
        "storage": { "type": "text", "value": "100 GB" },
        "api": { "type": "icon", "value": true },
        "support": { "type": "text", "value": "Priority" }
      },
      {
        "users": { "type": "text", "value": "Unlimited" },
        "storage": { "type": "text", "value": "Unlimited" },
        "api": { "type": "icon", "value": true },
        "support": { "type": "text", "value": "24/7 Dedicated" }
      }
    ]
  },
  "props": {
    "highlightColor": "#10b981"
  },
  "styles": {
    "backgroundColor": "transparent",
    "color": "textColor",
    "marginTop": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px",
    "marginRight": "0px",
    "paddingTop": "20px",
    "paddingBottom": "20px",
    "paddingLeft": "20px",
    "paddingRight": "20px"
  }
}

### Example 3: Feature Comparison with Custom Styling
{
  "id": "comparison-chart-1234567892-ghi",
  "type": "comparison-chart",
  "content": {
    "columns": [
      { "key": "competitor", "title": "Competitor", "highlighted": false },
      { "key": "us", "title": "Our Product", "highlighted": true }
    ],
    "rows": [
      { "key": "feature1", "label": "Easy Setup" },
      { "key": "feature2", "label": "Fast Performance" },
      { "key": "feature3", "label": "Great Support" },
      { "key": "feature4", "label": "Affordable" }
    ],
    "data": [
      {
        "feature1": { "type": "icon", "value": false },
        "feature2": { "type": "icon", "value": true },
        "feature3": { "type": "icon", "value": false },
        "feature4": { "type": "icon", "value": true }
      },
      {
        "feature1": { "type": "icon", "value": true },
        "feature2": { "type": "icon", "value": true },
        "feature3": { "type": "icon", "value": true },
        "feature4": { "type": "icon", "value": true }
      }
    ]
  },
  "props": {
    "highlightColor": "#8b5cf6"
  },
  "styles": {
    "backgroundColor": "#fafafa",
    "color": "#1f2937",
    "marginTop": "24px",
    "marginBottom": "24px",
    "marginLeft": "0px",
    "marginRight": "0px",
    "paddingTop": "24px",
    "paddingBottom": "24px",
    "paddingLeft": "24px",
    "paddingRight": "24px",
    "borderRadius": "12px",
    "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
  }
}

## CONTENT GUIDELINES

- Create **2-4 columns** for different plans/products
- Highlight the **recommended/most popular column** (typically the middle one)
- Include **4-8 rows** for key features
- Use consistent column keys and row keys
- For data array, ensure it matches the column order
- Cell data types:
  - **'text' type**: Use for specific values (e.g., "10 users", "50GB", "Unlimited")
  - **'icon' type**: Use for yes/no features (true = checkmark, false = X)
- Common comparison categories:
  - Pricing tiers (Free, Basic, Pro, Enterprise)
  - Product versions (Starter, Professional, Business)
  - Service levels (Bronze, Silver, Gold)
- Common features to compare:
  - Number of users/seats
  - Storage/bandwidth limits
  - Support availability
  - API access
  - Advanced features
  - Integrations
- Set highlightColor to brand color (typically blue: #007bff)
- Add margin for spacing

## NOTES

- ID format: 'comparison-chart-{timestamp}-{random}' (auto-generated)
- Data array length MUST match columns array length
- Each data object corresponds to one column (by index)
- Data object keys MUST match row keys
- Cell type 'icon' uses boolean values: true = check, false = X
- Cell type 'text' uses string values for any text content
- Use highlighted: true on columns to show colored border
- highlightColor prop controls the color of highlighted column borders
- Spacing: Always use strings with units ('16px', '1rem', etc.)
- Deep merge supported: can override nested properties
- Keys must be unique within their array (column keys, row keys)
- This element is perfect for:
  - Pricing pages
  - Product comparison pages
  - Feature matrices
  - Plan selection
  `,

  createDefault: (overrides = {}) => ({
    id: `comparison-chart-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    type: 'comparison-chart',
    content: {
      columns: [
        { key: 'basic', title: 'Basic', highlighted: false },
        { key: 'pro', title: 'Pro', highlighted: true },
      ],
      rows: [
        { key: 'feature1', label: 'Feature 1' },
        { key: 'feature2', label: 'Feature 2' },
      ],
      data: [
        {
          feature1: { type: 'icon', value: true },
          feature2: { type: 'icon', value: false },
        },
        {
          feature1: { type: 'icon', value: true },
          feature2: { type: 'icon', value: true },
        },
      ],
    },
    props: {
      highlightColor: '#007bff',
    },
    styles: {
      margin: '24px 0',
    },
    ...overrides,
  }),
}
