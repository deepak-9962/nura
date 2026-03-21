import type { NewsEvent } from '../../types.js'

function calculateScore(event: NewsEvent): number {
  const hoursSinceFirstSeen = Math.max(0, (Date.now() - Date.parse(event.firstSeenAt)) / 3_600_000)
  const recencyScore = 1 / (1 + hoursSinceFirstSeen)
  const reliabilityScore = event.avgReliability / 100
  const frequencyScore = Math.min(event.articles.length / 10, 1)
  const breakingBonus = event.isBreaking ? 1 : 0

  return (
    0.35 * recencyScore +
    0.3 * reliabilityScore +
    0.25 * frequencyScore +
    0.1 * breakingBonus
  )
}

export class RankerService {
  rankTop5(events: NewsEvent[]): NewsEvent[] {
    const scored = events
      .map((event) => ({ ...event, importanceScore: Number(calculateScore(event).toFixed(4)) }))
      .sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))

    const categoryCount: Record<string, number> = {}
    const picked: NewsEvent[] = []

    for (const event of scored) {
      const current = categoryCount[event.category] ?? 0
      if (current >= 2) {
        continue
      }
      picked.push(event)
      categoryCount[event.category] = current + 1
      if (picked.length === 5) {
        break
      }
    }

    return picked
  }
}
