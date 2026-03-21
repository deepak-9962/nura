import { describe, expect, it } from 'vitest';
import { RankerService } from './ranker.service.js';
describe('RankerService', () => {
    it('limits top 5 to at most two events per category', () => {
        const ranker = new RankerService();
        const now = new Date().toISOString();
        const events = Array.from({ length: 8 }).map((_, idx) => ({
            eventId: `e-${idx}`,
            headline: `Headline ${idx}`,
            summary: 'Summary',
            articles: ['a1', 'a2'],
            category: idx < 5 ? 'WORLD' : 'TECH',
            firstSeenAt: now,
            lastUpdatedAt: now,
            versionCount: 1,
            isBreaking: false,
            avgReliability: 90
        }));
        const top5 = ranker.rankTop5(events);
        const worldCount = top5.filter((e) => e.category === 'WORLD').length;
        expect(top5.length).toBeLessThanOrEqual(5);
        expect(worldCount).toBeLessThanOrEqual(2);
    });
});
