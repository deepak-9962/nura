import type { ArticleSchema } from '../types.js'
import { getDatabase } from '../db/database.js'

export class ArticleRepository {
  upsertMany(articles: ArticleSchema[]): void {
    if (articles.length === 0) {
      return
    }

    const db = getDatabase()
    const stmt = db.prepare(
      `
      INSERT INTO articles (id, payload, fetched_at)
      VALUES (@id, @payload, @fetched_at)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        fetched_at = excluded.fetched_at
      `
    )

    const tx = db.transaction((rows: ArticleSchema[]) => {
      for (const article of rows) {
        stmt.run({
          id: article.id,
          payload: JSON.stringify(article),
          fetched_at: article.fetchedAt
        })
      }
    })

    tx(articles)
  }

  listRecent(limit = 50): ArticleSchema[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        `
        SELECT payload
        FROM articles
        ORDER BY fetched_at DESC
        LIMIT ?
        `
      )
      .all(limit) as Array<{ payload: string }>

    return rows.map((row) => JSON.parse(row.payload) as ArticleSchema)
  }
}