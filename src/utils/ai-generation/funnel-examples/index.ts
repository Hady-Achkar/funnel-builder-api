/**
 * Funnel Examples Library
 *
 * This file contains real-world funnel examples that the AI can use as inspiration
 * when generating new funnels. Examples are categorized by industry and funnel type.
 */

export interface FunnelExample {
  id: string
  name: string
  description: string
  industry: string
  funnelType: string
  targetAudience: string
  pages: Array<{
    name: string
    purpose: string
    elements: any[]
  }>
  designNotes?: string
  conversionTips?: string
}

/**
 * Get relevant examples based on user's funnel requirements
 */
export function getRelevantExamples(params: {
  industry?: string
  funnelType?: string
  targetAudience?: string
  maxExamples?: number
}): FunnelExample[] {
  const { industry, funnelType, maxExamples = 3 } = params

  let examples = FUNNEL_EXAMPLES

  // Filter by industry if provided
  if (industry) {
    examples = examples.filter(
      (ex) => ex.industry.toLowerCase() === industry.toLowerCase()
    )
  }

  // Filter by funnel type if provided
  if (funnelType) {
    examples = examples.filter(
      (ex) => ex.funnelType.toLowerCase() === funnelType.toLowerCase()
    )
  }

  // If no matches, return general examples
  if (examples.length === 0) {
    examples = FUNNEL_EXAMPLES.filter((ex) => ex.industry === 'General')
  }

  // Return limited number of examples
  return examples.slice(0, maxExamples)
}

/**
 * Format examples for AI prompt injection
 */
export function formatExamplesForPrompt(examples: FunnelExample[]): string {
  if (examples.length === 0) return ''

  let prompt = '\n\n## INSPIRATION EXAMPLES\n\n'
  prompt += 'Here are some successful funnel examples for inspiration:\n\n'

  examples.forEach((example, index) => {
    prompt += `### Example ${index + 1}: ${example.name}\n\n`
    prompt += `**Description**: ${example.description}\n`
    prompt += `**Industry**: ${example.industry}\n`
    prompt += `**Type**: ${example.funnelType}\n`
    prompt += `**Target**: ${example.targetAudience}\n\n`

    prompt += '**Page Structure**:\n'
    example.pages.forEach((page, pageIndex) => {
      prompt += `${pageIndex + 1}. ${page.name} - ${page.purpose}\n`
      prompt += `   Elements: ${page.elements.map((el) => el.type).join(', ')}\n`
    })

    if (example.designNotes) {
      prompt += `\n**Design Notes**: ${example.designNotes}\n`
    }

    if (example.conversionTips) {
      prompt += `**Conversion Tips**: ${example.conversionTips}\n`
    }

    prompt += '\n---\n\n'
  })

  prompt +=
    '**IMPORTANT**: Use these as INSPIRATION only. Create a unique funnel tailored to the user\'s specific requirements. Do NOT copy these examples directly!\n\n'

  return prompt
}

/**
 * Funnel Examples Database
 */
const FUNNEL_EXAMPLES: FunnelExample[] = [
  {
    id: 'saas-trial-1',
    name: 'SaaS Free Trial Funnel',
    description:
      'High-converting funnel for getting users to sign up for a free trial',
    industry: 'Technology',
    funnelType: 'Lead Generation',
    targetAudience: 'B2B software buyers',
    pages: [
      {
        name: 'Landing Page',
        purpose: 'Capture attention and explain value proposition',
        elements: [
          { type: 'image', description: 'Hero image or product screenshot' },
          { type: 'text', description: 'Compelling headline' },
          { type: 'text', description: 'Subheadline with key benefits' },
          { type: 'button', description: 'CTA: Start Free Trial' },
          { type: 'text', description: 'Social proof section' },
          { type: 'image', description: 'Company logos (trusted by)' },
          { type: 'text', description: 'Feature highlights (3 columns)' },
          { type: 'button', description: 'Secondary CTA' },
        ],
      },
      {
        name: 'Sign Up Page',
        purpose: 'Collect user information with minimal friction',
        elements: [
          { type: 'text', description: 'Page title' },
          { type: 'text', description: 'Benefits reminder' },
          {
            type: 'form',
            description: 'Simple form with name, email, password',
          },
          { type: 'text', description: 'Privacy reassurance' },
        ],
      },
      {
        name: 'Thank You Page',
        purpose: 'Confirm signup and guide next steps',
        elements: [
          { type: 'text', description: 'Success message' },
          { type: 'text', description: 'Next steps instructions' },
          { type: 'button', description: 'Go to Dashboard' },
          { type: 'text', description: 'Support information' },
        ],
      },
    ],
    designNotes:
      'Use bright, modern colors. Keep forms minimal (3-4 fields max). Include trust signals throughout.',
    conversionTips:
      'Highlight "no credit card required". Use urgency with limited-time offers. Show real customer testimonials.',
  },

  {
    id: 'ecommerce-product-1',
    name: 'E-commerce Product Launch',
    description: 'Funnel for launching a new product with pre-orders',
    industry: 'E-commerce',
    funnelType: 'Sales',
    targetAudience: 'Online shoppers',
    pages: [
      {
        name: 'Product Announcement',
        purpose: 'Build excitement and showcase product',
        elements: [
          { type: 'text', description: 'Attention-grabbing headline' },
          { type: 'image', description: 'Product hero image' },
          { type: 'text', description: 'Product description and benefits' },
          { type: 'button', description: 'Pre-order Now' },
          { type: 'image', description: 'Product gallery (3-4 images)' },
          { type: 'text', description: 'Detailed specifications' },
          { type: 'text', description: 'Customer reviews' },
          { type: 'button', description: 'Add to Cart CTA' },
        ],
      },
      {
        name: 'Checkout Page',
        purpose: 'Capture order and payment information',
        elements: [
          { type: 'text', description: 'Order summary' },
          { type: 'form', description: 'Shipping information form' },
          { type: 'form', description: 'Payment details form' },
          { type: 'button', description: 'Complete Order' },
          { type: 'text', description: 'Security badges' },
        ],
      },
      {
        name: 'Order Confirmation',
        purpose: 'Confirm purchase and upsell',
        elements: [
          { type: 'text', description: 'Thank you message' },
          { type: 'text', description: 'Order details' },
          { type: 'text', description: 'Shipping information' },
          { type: 'text', description: 'Recommended products' },
          { type: 'button', description: 'Continue Shopping' },
        ],
      },
    ],
    designNotes:
      'Use high-quality product images. Ensure mobile-responsive design. Clear pricing and shipping info.',
    conversionTips:
      'Offer early-bird discount. Show scarcity (limited quantity). Include money-back guarantee.',
  },

  {
    id: 'service-consultation-1',
    name: 'Professional Services Consultation Funnel',
    description: 'Funnel for booking consultations with service providers',
    industry: 'Professional Services',
    funnelType: 'Lead Generation',
    targetAudience: 'Business owners seeking professional services',
    pages: [
      {
        name: 'Service Overview',
        purpose: 'Explain services and build credibility',
        elements: [
          { type: 'text', description: 'Professional headline' },
          { type: 'text', description: 'Service description' },
          { type: 'image', description: 'Professional photo or office image' },
          { type: 'text', description: 'Services list' },
          { type: 'text', description: 'Case studies/results' },
          { type: 'button', description: 'Book Free Consultation' },
          { type: 'text', description: 'Credentials and certifications' },
        ],
      },
      {
        name: 'Consultation Booking',
        purpose: 'Collect lead information and schedule call',
        elements: [
          { type: 'text', description: 'Booking form title' },
          { type: 'form', description: 'Contact form with phone, email, name' },
          {
            type: 'form-select',
            description: 'Service interest dropdown',
          },
          { type: 'form-datepicker', description: 'Preferred date/time' },
          { type: 'button', description: 'Schedule Consultation' },
        ],
      },
      {
        name: 'Confirmation Page',
        purpose: 'Confirm booking and provide preparation info',
        elements: [
          { type: 'text', description: 'Confirmation message' },
          { type: 'text', description: 'Meeting details' },
          { type: 'text', description: 'Preparation checklist' },
          { type: 'button', description: 'Add to Calendar' },
          { type: 'text', description: 'Contact information' },
        ],
      },
    ],
    designNotes:
      'Professional, trustworthy design. Use testimonials prominently. Clean, minimal layout.',
    conversionTips:
      'Emphasize "free" consultation. Show expertise through credentials. Make booking process simple.',
  },

  {
    id: 'webinar-registration-1',
    name: 'Educational Webinar Funnel',
    description: 'Funnel for registering attendees for live webinar',
    industry: 'Education',
    funnelType: 'Event Registration',
    targetAudience: 'Professionals seeking to learn new skills',
    pages: [
      {
        name: 'Webinar Landing Page',
        purpose: 'Explain webinar value and drive registrations',
        elements: [
          { type: 'text', description: 'Webinar title and date' },
          { type: 'text', description: 'What attendees will learn' },
          { type: 'image', description: 'Host photo and credentials' },
          { type: 'text', description: 'Webinar agenda' },
          { type: 'button', description: 'Register Now (Free)' },
          { type: 'text', description: 'Previous attendee testimonials' },
          { type: 'button', description: 'Reserve My Spot' },
        ],
      },
      {
        name: 'Registration Form',
        purpose: 'Collect attendee information',
        elements: [
          { type: 'text', description: 'Registration form title' },
          {
            type: 'form',
            description: 'Form with name, email, company, role',
          },
          { type: 'form-checkbox', description: 'Consent for reminders' },
          { type: 'button', description: 'Complete Registration' },
        ],
      },
      {
        name: 'Registration Success',
        purpose: 'Confirm registration and increase attendance',
        elements: [
          { type: 'text', description: "You're registered!" },
          { type: 'text', description: 'Webinar details and calendar invite' },
          { type: 'button', description: 'Add to Calendar' },
          { type: 'text', description: 'What to do next' },
          { type: 'button', description: 'Share with colleagues' },
        ],
      },
    ],
    designNotes:
      'Use countdown timer. Show host credibility. Include preview of content.',
    conversionTips:
      'Limited spots messaging. Show live registration count. Offer replay for registrants.',
  },

  {
    id: 'general-newsletter-1',
    name: 'Newsletter Signup Funnel',
    description: 'Simple funnel for growing email list',
    industry: 'General',
    funnelType: 'Lead Generation',
    targetAudience: 'General audience interested in content',
    pages: [
      {
        name: 'Signup Page',
        purpose: 'Convince visitors to subscribe',
        elements: [
          { type: 'text', description: 'Compelling headline' },
          { type: 'text', description: 'Benefits of subscribing' },
          { type: 'form', description: 'Email and name form' },
          { type: 'text', description: 'What subscribers will get' },
          { type: 'text', description: 'Frequency and content preview' },
          { type: 'text', description: 'Privacy policy reassurance' },
        ],
      },
      {
        name: 'Welcome Page',
        purpose: 'Confirm subscription and set expectations',
        elements: [
          { type: 'text', description: 'Welcome message' },
          { type: 'text', description: 'Check your email message' },
          { type: 'text', description: 'What to expect next' },
          { type: 'button', description: 'Follow on social media' },
        ],
      },
    ],
    designNotes:
      'Clean, focused design. Minimal distractions. Clear value proposition.',
    conversionTips:
      'Offer lead magnet. Show subscriber count. Include sample newsletter.',
  },
]
