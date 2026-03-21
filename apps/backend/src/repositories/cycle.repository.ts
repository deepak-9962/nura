import type { BroadcastPayload, BroadcastState } from '../types.js'
import { getDatabase } from '../db/database.js'

const LATEST_BROADCAST_KEY = 'latest_broadcast'

export class CycleRepository {
  saveCycle(payload: BroadcastPayload): void {
    const db = getDatabase()
    db.prepare(
      `
      INSERT INTO broadcast_cycles (broadcast_id, payload, generated_at, state)
      VALUES (@broadcast_id, @payload, @generated_at, @state)
      ON CONFLICT(broadcast_id) DO UPDATE SET
        payload = excluded.payload,
        generated_at = excluded.generated_at,
        state = excluded.state
      `
    ).run({
      broadcast_id: payload.broadcastId,
      payload: JSON.stringify(payload),
      generated_at: payload.generatedAt,
      state: payload.state
    })

    db.prepare(
      `
      INSERT INTO kv_store (key, value, updated_at)
      VALUES (@key, @value, @updated_at)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
      `
    ).run({
      key: LATEST_BROADCAST_KEY,
      value: JSON.stringify(payload),
      updated_at: payload.generatedAt
    })
  }

  getLatestBroadcast(): BroadcastPayload | null {
    const db = getDatabase()
    const row = db
      .prepare(
        `
        SELECT value
        FROM kv_store
        WHERE key = ?
        `
      )
      .get(LATEST_BROADCAST_KEY) as { value: string } | undefined

    return row ? (JSON.parse(row.value) as BroadcastPayload) : null
  }

  listRecentStates(limit = 10): Array<{ generatedAt: string; state: BroadcastState }> {
    const db = getDatabase()
    return db
      .prepare(
        `
        SELECT generated_at as generatedAt, state
        FROM broadcast_cycles
        ORDER BY generated_at DESC
        LIMIT ?
        `
      )
      .all(limit) as Array<{ generatedAt: string; state: BroadcastState }>
  }

  listRecentBroadcasts(limit = 3): BroadcastPayload[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        `
        SELECT payload
        FROM broadcast_cycles
        ORDER BY generated_at DESC
        LIMIT ?
        `
      )
      .all(limit) as Array<{ payload: string }>

    return rows.map((row) => JSON.parse(row.payload) as BroadcastPayload)
  }
}