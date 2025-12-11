import { PrismaClient } from "../src/generated/prisma-client";

const prisma = new PrismaClient();

const templateCategories = [
  {
    name: "Lead Generation",
    slug: "lead-generation",
    description: "Funnels designed to capture leads and build email lists",
    icon: "🎯",
    order: 1,
  },
  {
    name: "Sales Page",
    slug: "sales-page",
    description: "High-converting single product sales pages",
    icon: "💰",
    order: 2,
  },
  {
    name: "Course & Education",
    slug: "course-education",
    description: "Educational content and online course funnels",
    icon: "📚",
    order: 3,
  },
  {
    name: "E-commerce",
    slug: "ecommerce",
    description: "Product showcase and online store funnels",
    icon: "🛒",
    order: 4,
  },
  {
    name: "SaaS & Software",
    slug: "saas-software",
    description: "Software and subscription service funnels",
    icon: "💻",
    order: 5,
  },
  {
    name: "Webinar",
    slug: "webinar",
    description: "Registration and promotion funnels for webinars",
    icon: "🎥",
    order: 6,
  },
  {
    name: "Event & Conference",
    slug: "event-conference",
    description: "Event registration and promotion funnels",
    icon: "🎪",
    order: 7,
  },
  {
    name: "Coaching & Consulting",
    slug: "coaching-consulting",
    description: "Personal brand and service-based business funnels",
    icon: "🎤",
    order: 8,
  },
  {
    name: "Agency & B2B",
    slug: "agency-b2b",
    description: "Business-to-business and agency service funnels",
    icon: "🏢",
    order: 9,
  },
  {
    name: "Non-Profit & Charity",
    slug: "nonprofit-charity",
    description: "Donation and cause awareness funnels",
    icon: "❤️",
    order: 10,
  },
  {
    name: "Health & Fitness",
    slug: "health-fitness",
    description: "Wellness and fitness program funnels",
    icon: "💪",
    order: 11,
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    description: "Property and real estate service funnels",
    icon: "🏠",
    order: 12,
  },
  {
    name: "Restaurant & Food",
    slug: "restaurant-food",
    description: "Food service and restaurant promotion funnels",
    icon: "🍕",
    order: 13,
  },
  {
    name: "Local Business",
    slug: "local-business",
    description: "Local service and brick-and-mortar business funnels",
    icon: "🏪",
    order: 14,
  },
  {
    name: "Coming Soon",
    slug: "coming-soon",
    description: "Product launch and pre-launch capture pages",
    icon: "🚀",
    order: 15,
  },
];

async function seedTemplateCategories() {
  console.log("Starting template categories seed...");

  for (const category of templateCategories) {
    const existingCategory = await prisma.templateCategory.findUnique({
      where: { slug: category.slug },
    });

    if (existingCategory) {
      console.log(`Category "${category.name}" already exists, skipping...`);
      continue;
    }

    await prisma.templateCategory.create({
      data: category,
    });

    console.log(`Created category: ${category.name}`);
  }

  console.log("Template categories seed completed!");
}

async function main() {
  try {
    await seedTemplateCategories();
  } catch (error) {
    console.error("Error seeding template categories:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedTemplateCategories };
