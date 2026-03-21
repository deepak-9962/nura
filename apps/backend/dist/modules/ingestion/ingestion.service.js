import { loadConfig } from '../../config.js';
import { RSS_SOURCES } from '../../config/sourceRegistry.js';
import { generateSeedArticles } from '../../data/seedArticles.js';
import { ArticleRepository } from '../../repositories/article.repository.js';
import { logger } from '../../utils/logger.js';
import { NewsApiAdapter } from './adapters/newsApi.adapter.js';
import { RssAdapter } from './adapters/rss.adapter.js';
export class IngestionService {
    config = loadConfig();
    articles = new ArticleRepository();
    rssAdapter = new RssAdapter();
    newsApiAdapter = new NewsApiAdapter();
    async ingestNews() {
        const batches = [];
        for (const source of RSS_SOURCES) {
            try {
                const feedArticles = await this.rssAdapter.fetch(source.feedUrl, source.profile);
                batches.push(feedArticles);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown RSS error';
                logger.warn('RSS ingestion failed', {
                    source: source.profile.source,
                    feedUrl: source.feedUrl,
                    message
                });
            }
        }
        if (this.config.newsApiKey) {
            try {
                const apiArticles = await this.newsApiAdapter.fetch(this.config.newsApiKey);
                batches.push(apiArticles);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown NewsAPI error';
                logger.warn('NewsAPI ingestion failed', { message });
            }
        }
        const normalized = this.mergeUniqueArticles(batches.flat());
        if (normalized.length === 0) {
            logger.warn('No live articles ingested; using seed fallback');
            normalized.push(...generateSeedArticles());
        }
        this.articles.upsertMany(normalized);
        return normalized;
    }
    mergeUniqueArticles(articles) {
        const byId = new Map();
        for (const article of articles) {
            byId.set(article.id, article);
        }
        return [...byId.values()];
    }
}
