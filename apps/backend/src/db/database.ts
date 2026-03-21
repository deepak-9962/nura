import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const currentFilePath = fileURLToPath(import.meta.url)
const schemaPath = path.resolve(path.dirname(currentFilePath), 'schema.sql')
const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

let db: Database.Database | null = null

export function initDatabase(databasePath: string): Database.Database {
  const absolutePath = path.isAbsolute(databasePath)
    ? databasePath
    : path.resolve(process.cwd(), databasePath)

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })

  const connection = new Database(absolutePath)
  connection.pragma('journal_mode = WAL')
  connection.exec(schemaSql)

  db = connection
  return connection
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database is not initialized')
  }
  return db
}
