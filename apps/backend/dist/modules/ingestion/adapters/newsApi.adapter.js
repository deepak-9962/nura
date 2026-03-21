import { createHash } from 'node:crypto';
import { CATEGORY_KEYWORDS, SOURCE_REGISTRY } from '../../../config/sourceRegistry.js';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';
function classifyCategory(title, body) {
    const text = `${title} ${body}`.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((keyword) => text.includes(keyword))) {
            return category;
        }
    }
    return 'WORLD';
}
function makeArticleId(articleUrl, publishedAt) {
    return createHash('sha1').update(`${articleUrl}|${publishedAt}`).digest('hex');
}
function clampBody(text) {
    if (text.length <= 2000) {
        return text;
    }
    return `${text.slice(0, 1997)}...`;
}
export class NewsApiAdapter {
    async fetch(apiKey, language = 'en') {
        const url = new URL(NEWS_API_URL);
        url.searchParams.set('language', language);
        url.searchParams.set('pageSize', '20');
        const response = await fetch(url, {
            headers: {
                'X-Api-Key': apiKey
            }
        });
        if (!response.ok) {
            throw new Error(`NewsAPI request failed: ${response.status}`);
        }
        const payload = (await response.json());
        const now = new Date().toISOString();
        const defaultSource = SOURCE_REGISTRY.GNews;
        const articles = [];
        for (const item of payload.articles ?? []) {
            const title = item.title?.trim() ?? '';
            if (!title) {
                continue;
            }
            const body = clampBody((item.content ?? item.description ?? '').trim());
            const articleUrl = item.url?.trim() ?? defaultSource.sourceUrl;
            const publishedAt = item.publishedAt ?? now;
            articles.push({
                id: makeArticleId(articleUrl, publishedAt),
                title,
                body,
                source: item.source?.name?.trim() || defaultSource.source,
                sourceUrl: defaultSource.sourceUrl,
                articleUrl,
                publishedAt,
                fetchedAt: now,
                category: classifyCategory(title, body),
                reliabilityScore: defaultSource.reliabilityScore,
                language,
                conflictFlag: false
            });
        }
        return articles;
    }
}
