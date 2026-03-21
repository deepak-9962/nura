export const SOURCE_REGISTRY = {
    'BBC News Tamil': {
        source: 'BBC News Tamil',
        sourceUrl: 'https://www.bbc.com/tamil',
        reliabilityScore: 88,
        defaultLanguage: 'ta'
    },
    'The Hindu': {
        source: 'The Hindu',
        sourceUrl: 'https://www.thehindu.com',
        reliabilityScore: 86,
        defaultLanguage: 'en'
    },
    Reuters: {
        source: 'Reuters',
        sourceUrl: 'https://www.reuters.com',
        reliabilityScore: 91,
        defaultLanguage: 'en'
    },
    GNews: {
        source: 'GNews',
        sourceUrl: 'https://gnews.io',
        reliabilityScore: 72,
        defaultLanguage: 'en'
    }
};
export const RSS_SOURCES = [
    {
        feedUrl: 'https://www.bbc.com/tamil/index.xml',
        profile: SOURCE_REGISTRY['BBC News Tamil']
    },
    {
        feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
        profile: SOURCE_REGISTRY['The Hindu']
    }
];
export const CATEGORY_KEYWORDS = {
    POLITICS: ['government', 'parliament', 'minister', 'election', 'policy'],
    BUSINESS: ['market', 'stock', 'economy', 'finance', 'trade', 'business'],
    TECH: ['ai', 'technology', 'software', 'startup', 'digital', 'cyber'],
    SPORTS: ['cricket', 'football', 'match', 'league', 'tournament', 'sports'],
    HEALTH: ['health', 'hospital', 'vaccine', 'medical', 'disease', 'wellness'],
    WORLD: ['world', 'global', 'international', 'diplomatic', 'war', 'united nations'],
    LOCAL: ['chennai', 'tamil nadu', 'district', 'local', 'city', 'metro']
};
