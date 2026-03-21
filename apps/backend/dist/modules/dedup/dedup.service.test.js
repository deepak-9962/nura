import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DedupService } from './dedup.service.js';
import { initDatabase } from '../../db/database.js';
function makeArticle(overrides) {
    return {
        id: overrides.id ?? 'a-1',
        title: overrides.title ?? 'Chennai metro extension enters trial run',
        body: overrides.body ??
            'Officials confirmed that the Chennai metro extension entered trial operations today with public safety inspections underway.',
        source: overrides.source ?? 'The Hindu',
        sourceUrl: overrides.sourceUrl ?? 'https://www.thehindu.com',
        articleUrl: overrides.articleUrl ?? 'https://example.com/a-1',
        publishedAt: overrides.publishedAt ?? '2026-03-21T10:00:00.000Z',
        fetchedAt: overrides.fetchedAt ?? '2026-03-21T10:05:00.000Z',
        category: overrides.category ?? 'LOCAL',
        reliabilityScore: overrides.reliabilityScore ?? 82,
        language: overrides.language ?? 'en',
        conflictFlag: overrides.conflictFlag ?? false
    };
}
describe('DedupService', () => {
    const tempDbPath = path.join(os.tmpdir(), `nura-dedup-test-${Date.now()}.sqlite`);
    initDatabase(tempDbPath);
    it('merges semantically similar articles into one event', () => {
        const dedup = new DedupService();
        const first = makeArticle({
            id: 'a-1',
            title: 'Chennai metro extension enters trial run',
            articleUrl: 'https://example.com/a-1'
        });
        const second = makeArticle({
            id: 'a-2',
            title: 'Trial operations begin for Chennai metro extension',
            articleUrl: 'https://example.com/a-2',
            source: 'BBC Tamil',
            sourceUrl: 'https://www.bbc.com/tamil',
            reliabilityScore: 88
        });
        const events = dedup.deduplicate([first, second]);
        const merged = events.find((event) => event.articles.includes('a-1'));
        expect(merged).toBeDefined();
        expect(merged?.articles).toContain('a-2');
        expect(merged?.versionCount).toBe(2);
    });
    it('prefers higher-reliability headline when updating an event', () => {
        const dedup = new DedupService();
        const lowReliability = makeArticle({
            id: 'a-10',
            title: 'Initial local reports mention heavy rain warning',
            reliabilityScore: 62,
            articleUrl: 'https://example.com/a-10'
        });
        const highReliability = makeArticle({
            id: 'a-11',
            title: 'State weather center issues confirmed heavy rain warning',
            reliabilityScore: 91,
            articleUrl: 'https://example.com/a-11',
            source: 'Reuters'
        });
        const events = dedup.deduplicate([lowReliability, highReliability]);
        expect(events).toHaveLength(1);
        expect(events[0].headline).toBe(highReliability.title);
        expect(events[0].isBreaking).toBe(true);
    });
    it('does not increment version for duplicate article ids', () => {
        const dedup = new DedupService();
        const article = makeArticle({ id: 'same-id', articleUrl: 'https://example.com/same-id' });
        const events = dedup.deduplicate([article, article]);
        expect(events).toHaveLength(1);
        expect(events[0].versionCount).toBe(1);
        expect(events[0].articles).toHaveLength(1);
    });
});
