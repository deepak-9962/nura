import type { NewsEvent } from '../types'

interface StoryCardProps {
  event: NewsEvent
}

export function StoryCard({ event }: StoryCardProps) {
  return (
    <article className="story-card">
      <h3>{event.headline}</h3>
      <p>{event.summary}</p>
      <div className="story-meta">
        <span>{event.category}</span>
        <span>Reliability {event.avgReliability}</span>
      </div>
    </article>
  )
}
