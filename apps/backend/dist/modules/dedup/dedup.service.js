import { v4 as uuidv4 } from 'uuid';
import { EventRepository } from '../../repositories/event.repository.js';
function toSummary(article) {
    return `${article.title}. ${article.body.slice(0, 220)}`;
}
function tokenize(text) {
    return new Set(text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2));
}
function jaccardSimilarity(a, b) {
    const left = tokenize(a);
    const right = tokenize(b);
    if (left.size === 0 || right.size === 0) {
        return 0;
    }
    let intersection = 0;
    for (const token of left) {
        if (right.has(token)) {
            intersection += 1;
        }
    }
    const union = new Set([...left, ...right]).size;
    return union === 0 ? 0 : intersection / union;
}
function toBigrams(text) {
    const normalized = text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    const pairs = new Set();
    for (let index = 0; index < normalized.length - 1; index += 1) {
        pairs.add(normalized.slice(index, index + 2));
    }
    return pairs;
}
function bigramSimilarity(a, b) {
    const left = toBigrams(a);
    const right = toBigrams(b);
    if (left.size === 0 || right.size === 0) {
        return 0;
    }
    let overlap = 0;
    for (const pair of left) {
        if (right.has(pair)) {
            overlap += 1;
        }
    }
    return overlap / Math.max(left.size, right.size);
}
function similarityScore(article, candidate) {
    const titleScore = jaccardSimilarity(article.title, candidate.headline);
    const summaryScore = jaccardSimilarity(`${article.title} ${article.body}`, candidate.summary);
    const charScore = bigramSimilarity(article.title, candidate.headline);
    return 0.5 * titleScore + 0.35 * summaryScore + 0.15 * charScore;
}
const DEDUP_THRESHOLD = 0.42;
export class DedupService {
    events = new EventRepository();
    deduplicate(articles) {
        const knownEvents = this.events.listRecent(200);
        const eventMap = new Map();
        for (const event of knownEvents) {
            eventMap.set(event.eventId, { ...event, articles: [...event.articles] });
        }
        for (const article of articles) {
            let match = null;
            let bestScore = 0;
            for (const candidate of eventMap.values()) {
                const score = similarityScore(article, candidate);
                if (score > bestScore) {
                    bestScore = score;
                    match = candidate;
                }
            }
            const existing = bestScore >= DEDUP_THRESHOLD ? match : null;
            if (!existing) {
                const created = {
                    eventId: uuidv4(),
                    headline: article.title,
                    summary: toSummary(article),
                    articles: [article.id],
                    category: article.category,
                    firstSeenAt: article.publishedAt,
                    lastUpdatedAt: article.fetchedAt,
                    versionCount: 1,
                    isBreaking: article.reliabilityScore >= 90,
                    avgReliability: article.reliabilityScore
                };
                eventMap.set(created.eventId, created);
                continue;
            }
            if (existing.articles.includes(article.id)) {
                continue;
            }
            const previousCount = existing.articles.length;
            existing.articles.push(article.id);
            if (article.reliabilityScore >= existing.avgReliability) {
                existing.headline = article.title;
                existing.summary = toSummary(article);
            }
            existing.category = article.category;
            existing.lastUpdatedAt = article.fetchedAt;
            existing.versionCount += 1;
            existing.avgReliability = Math.round((existing.avgReliability * previousCount + article.reliabilityScore) / (previousCount + 1));
            existing.isBreaking = existing.isBreaking || article.reliabilityScore >= 88;
        }
        return [...eventMap.values()];
    }
}
