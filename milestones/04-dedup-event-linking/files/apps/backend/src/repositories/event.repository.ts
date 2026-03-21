import type { NewsEvent } from '../types.js'
import { getDatabase } from '../db/database.js'

export class EventRepository {
  upsertMany(events: NewsEvent[]): void {
    if (events.length === 0) {
      return
    }

    const db = getDatabase()
    const stmt = db.prepare(
      `
      INSERT INTO events (event_id, payload, updated_at)
      VALUES (@event_id, @payload, @updated_at)
      ON CONFLICT(event_id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
      `
    )

    const tx = db.transaction((rows: NewsEvent[]) => {
      for (const event of rows) {
        stmt.run({
          event_id: event.eventId,
          payload: JSON.stringify(event),
          updated_at: event.lastUpdatedAt
        })
      }
    })

    tx(events)
  }

  listRecent(limit = 50): NewsEvent[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        `
        SELECT payload
        FROM events
        ORDER BY updated_at DESC
        LIMIT ?
        `
      )
      .all(limit) as Array<{ payload: string }>

    return rows.map((row) => JSON.parse(row.payload) as NewsEvent)
  }
}