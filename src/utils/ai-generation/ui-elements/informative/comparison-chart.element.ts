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
When generating a comparison-chart element:
- Create 2-4 columns for different plans/products
- Highlight the recommended/most popular column (typically the middle one)
- Include 4-8 rows for key features
- Use consistent column keys and row keys
- For data array, ensure it matches the column order
- Cell data types:
  - 'text' type: Use for specific values (e.g., "10 users", "50GB", "Unlimited")
  - 'icon' type: Use for yes/no features (true = checkmark, false = X)
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
