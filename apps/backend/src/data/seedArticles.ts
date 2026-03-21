import type { ArticleSchema, Category } from '../types.js'

const now = Date.now()

const categoryCycle: Category[] = ['WORLD', 'POLITICS', 'TECH', 'BUSINESS', 'SPORTS', 'HEALTH', 'LOCAL']

export function generateSeedArticles(): ArticleSchema[] {
  const baseStories = [
    'Global markets open higher amid policy optimism',
    'State government launches flood response program',
    'AI model released for low-resource Tamil NLP',
    'Cricket league final set after close semi-final',
    'Hospital network announces vaccine drive',
    'Metro rail extension reaches trial phase',
    'Parliament session focuses on digital safety bill'
  ]

  return Array.from({ length: 24 }).map((_, index) => {
    const category = categoryCycle[index % categoryCycle.length]
    const source = ['BBC Tamil', 'The Hindu', 'Puthiya Thalaimurai', 'GNews'][index % 4]

    return {
      id: `article-${index + 1}`,
      title: `${baseStories[index % baseStories.length]} #${Math.floor(index / 3) + 1}`,
      body: `Detailed coverage for story ${index + 1}. This body simulates normalized content limited to 2000 chars.`,
      source,
      sourceUrl: `https://example.com/${source.toLowerCase().replace(/\s+/g, '-')}`,
      articleUrl: `https://example.com/article/${index + 1}`,
      publishedAt: new Date(now - index * 3_600_000).toISOString(),
      fetchedAt: new Date(now).toISOString(),
      category,
      reliabilityScore: 60 + (index % 4) * 10,
      language: index % 3 === 0 ? 'ta' : 'en',
      conflictFlag: false
    }
  })
}
