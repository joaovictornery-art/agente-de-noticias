export const sources = [
  {
    name: "OpenAI News",
    type: "html",
    url: "https://openrss.org/openai.com/news/rss.xml",
    baseUrl: "https://openai.com",
    linkSelector: 'a[href*="openai.com/index/"]',
    includePatterns: ["openai.com/index/"],
    sourceWeight: 5
  },
  {
    name: "Anthropic News",
    type: "html",
    url: "https://www.anthropic.com/news",
    baseUrl: "https://www.anthropic.com",
    linkSelector: 'a[href^="/news/"]',
    includePatterns: ["/news/"],
    sourceWeight: 5
  },
  {
    name: "Google AI Blog",
    type: "rss",
    url: "https://blog.google/technology/ai/rss/",
    sourceWeight: 4
  },
  {
    name: "TechCrunch AI",
    type: "rss",
    url: "https://techcrunch.com/feed/",
    sourceWeight: 3,
    requiredKeywords: [
      "ai",
      "artificial intelligence",
      "machine learning",
      "openai",
      "anthropic",
      "google",
      "gemini",
      "automation",
      "automação",
      "agent",
      "agents"
    ]
  }
];
