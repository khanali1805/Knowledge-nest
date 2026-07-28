export type PublicCategory = {
  name: string;
  slug: string;
};
export type PublicArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  category: PublicCategory;
  publishedAt: string;
  readingTime: string;
  featured: boolean;
};
export const publicCategories: PublicCategory[] = [
  { name: "Finance", slug: "finance" },
  { name: "Science", slug: "science" },
  { name: "Technology", slug: "technology" },
  { name: "Artificial Intelligence", slug: "artificial-intelligence" },
  { name: "Health", slug: "health" },
  { name: "Education", slug: "education" },
  { name: "Business", slug: "business" },
  { name: "History", slug: "history" },
  { name: "Environment", slug: "environment" },
  { name: "Space", slug: "space" },
  { name: "Psychology", slug: "psychology" },
  { name: "General Knowledge", slug: "general-knowledge" },
];
export const publicArticles: PublicArticle[] = [
  {
    id: 1,
    title: "Understanding the Basics of Personal Finance",
    slug: "understanding-the-basics-of-personal-finance",
    excerpt:
      "A practical introduction to budgeting, saving, debt management and responsible financial planning.",
    content: [
      "Personal finance is the process of managing income, expenses, savings and financial goals. A clear financial plan helps individuals understand where their money is going and how it can be used more effectively.",
      "A budget is one of the most useful financial tools. It records expected income and divides available money between essential expenses, savings, debt payments and optional spending.",
      "An emergency fund can reduce financial pressure when unexpected expenses occur. Many people build this fund gradually by saving a fixed amount from each payment they receive.",
      "Responsible debt management includes understanding interest rates, payment deadlines and the total cost of borrowing. Paying obligations on time can also support a healthier financial record.",
      "Long-term financial planning may include retirement preparation, education costs, insurance and carefully researched investments. Financial decisions should be based on personal circumstances and reliable information.",
    ],
    category: { name: "Finance", slug: "finance" },
    publishedAt: "2026-07-24",
    readingTime: "5 min read",
    featured: true,
  },
  {
    id: 2,
    title: "How Artificial Intelligence Processes Information",
    slug: "how-artificial-intelligence-processes-information",
    excerpt:
      "Learn how modern artificial intelligence systems identify patterns and generate useful outputs.",
    content: [
      "Artificial intelligence systems use data and mathematical models to identify patterns. These patterns allow a system to classify information, make predictions or generate new content.",
      "Machine learning is a major area of artificial intelligence. During training, a model processes examples and adjusts internal values to improve its performance on a defined task.",
      "The quality, relevance and balance of training data can influence model behavior. Poor data may produce unreliable, incomplete or biased results.",
      "Artificial intelligence does not understand information in exactly the same way a human does. It processes numerical representations and calculates likely relationships between them.",
      "Human review remains important when artificial intelligence is used for education, health, finance, legal matters or other areas where accuracy has serious consequences.",
    ],
    category: {
      name: "Artificial Intelligence",
      slug: "artificial-intelligence",
    },
    publishedAt: "2026-07-23",
    readingTime: "6 min read",
    featured: true,
  },
  {
    id: 3,
    title: "Why Scientific Research Uses Controlled Experiments",
    slug: "why-scientific-research-uses-controlled-experiments",
    excerpt:
      "An overview of controls, variables, observations and evidence in scientific experiments.",
    content: [
      "Controlled experiments help researchers test whether a specific factor causes a measurable change. They are designed to reduce the influence of unrelated conditions.",
      "The independent variable is the factor changed by the researcher. The dependent variable is the result being measured.",
      "A control group provides a comparison point. By comparing outcomes, researchers can determine whether the tested condition produced a meaningful difference.",
      "Repeated testing improves confidence in a result. Other researchers may also repeat an experiment to check whether similar findings can be produced.",
      "Not every scientific question can be answered with a controlled experiment. Researchers may also use observations, surveys, historical records and computer models.",
    ],
    category: { name: "Science", slug: "science" },
    publishedAt: "2026-07-22",
    readingTime: "5 min read",
    featured: true,
  },
  {
    id: 4,
    title: "A Simple Guide to Digital Privacy",
    slug: "a-simple-guide-to-digital-privacy",
    excerpt:
      "Basic steps for protecting accounts, devices and personal information online.",
    content: [
      "Digital privacy refers to the protection and responsible handling of personal information stored or shared through digital systems.",
      "Strong and unique passwords make it harder for unauthorized users to access multiple accounts. A password manager can help store complex passwords securely.",
      "Multi-factor authentication adds another verification step. This can reduce the risk of account access even when a password is exposed.",
      "Software updates often include security fixes. Keeping operating systems, browsers and applications updated can protect devices from known vulnerabilities.",
      "Users should review app permissions, privacy settings and suspicious messages before sharing personal or financial information.",
    ],
    category: { name: "Technology", slug: "technology" },
    publishedAt: "2026-07-21",
    readingTime: "5 min read",
    featured: false,
  },
  {
    id: 5,
    title: "How Sleep Supports Physical and Mental Health",
    slug: "how-sleep-supports-physical-and-mental-health",
    excerpt:
      "Learn why regular sleep is important for memory, mood, recovery and daily performance.",
    content: [
      "Sleep is a natural biological process that supports physical recovery, memory and emotional regulation.",
      "During sleep, the body performs important maintenance activities. The brain also processes information collected during the day.",
      "Insufficient sleep may affect concentration, reaction time, mood and decision-making. Long-term sleep problems may require professional medical assessment.",
      "A consistent sleep schedule, reduced evening screen use and a comfortable sleeping environment may support healthier sleep habits.",
      "Health needs differ between individuals. Persistent fatigue, breathing problems during sleep or severe insomnia should be discussed with a qualified healthcare professional.",
    ],
    category: { name: "Health", slug: "health" },
    publishedAt: "2026-07-20",
    readingTime: "4 min read",
    featured: false,
  },
  {
    id: 6,
    title: "Effective Methods for Independent Learning",
    slug: "effective-methods-for-independent-learning",
    excerpt:
      "Practical study methods for organizing information, reviewing concepts and tracking progress.",
    content: [
      "Independent learning requires clear goals, reliable resources and a consistent study routine.",
      "Breaking a large topic into smaller sections can make learning easier to manage. Each section can be reviewed before moving to the next.",
      "Active recall involves trying to remember information without immediately looking at notes. This method can reveal which areas require more study.",
      "Spaced review distributes study sessions over time instead of placing all revision into one session.",
      "Progress can be tracked with practice questions, summaries and regular self-assessment.",
    ],
    category: { name: "Education", slug: "education" },
    publishedAt: "2026-07-19",
    readingTime: "5 min read",
    featured: false,
  },
];
export function getArticleBySlug(slug: string) {
  return publicArticles.find((article) => article.slug === slug);
}
export function getCategoryBySlug(slug: string) {
  return publicCategories.find((category) => category.slug === slug);
}
export function getArticlesByCategory(slug: string) {
  return publicArticles.filter((article) => article.category.slug === slug);
}
