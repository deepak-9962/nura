import { createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { CATEGORY_KEYWORDS } from '../../../config/sourceRegistry.js';
const parser = new Parser();
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
export class RssAdapter {
    async fetch(feedUrl, profile) {
        const feed = (await parser.parseURL(feedUrl));
        const now = new Date().toISOString();
        const articles = [];
        for (const item of feed.items ?? []) {
            const title = item.title?.trim() ?? '';
            if (!title) {
                continue;
            }
            const body = clampBody((item.contentSnippet ?? item.content ?? '').trim());
            const articleUrl = item.link?.trim() ?? feed.link ?? profile.sourceUrl;
            const publishedAt = item.isoDate ?? item.pubDate ?? now;
            articles.push({
                id: makeArticleId(articleUrl, publishedAt),
                title,
                body,
                source: profile.source,
                sourceUrl: profile.sourceUrl,
                articleUrl,
                publishedAt,
                fetchedAt: now,
                category: classifyCategory(title, body),
                reliabilityScore: profile.reliabilityScore,
                language: profile.defaultLanguage,
                conflictFlag: false
            });
        }
        return articles;
    }
}
