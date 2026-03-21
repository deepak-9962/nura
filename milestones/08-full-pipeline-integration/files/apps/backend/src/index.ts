import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v4 as uuidv4 } from 'uuid'
import { loadConfig } from './config.js'
import { initDatabase } from './db/database.js'
import { BroadcastOrchestrator } from './modules/broadcast/broadcast.orchestrator.js'
import { createBroadcastRouter } from './routes/broadcast.routes.js'
import { BroadcastScheduler } from './scheduler/broadcast.scheduler.js'
import { logger } from './utils/logger.js'

const app = express()
const config = loadConfig()
const currentFilePath = fileURLToPath(import.meta.url)
const publicAssetsDir = path.resolve(path.dirname(currentFilePath), '..', 'public', 'assets')

initDatabase(config.databasePath)

app.use(cors())
app.use(express.json())
app.use('/assets', express.static(publicAssetsDir))
app.use((req, _res, next) => {
  req.traceId = req.header('x-trace-id') ?? uuidv4()
  next()
})

const orchestrator = new BroadcastOrchestrator()
const scheduler = new BroadcastScheduler(orchestrator, config.broadcastIntervalMinutes * 60 * 1000)
scheduler.start()

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    traceId: req.traceId,
    data: {
      service: 'ai-news-anchor-backend'
    }
  })
})

app.use('/api/broadcast', createBroadcastRouter(orchestrator))

app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error'
  logger.error('Unhandled request error', { traceId: req.traceId, message })
  res.status(500).json({
    ok: false,
    traceId: req.traceId,
    error: {
      code: 'INTERNAL_ERROR',
      message
    }
  })
})

app.listen(config.port, () => {
  logger.info('Backend started', { port: config.port })
})

function shutdown(signal: string): void {
  logger.info('Shutting down backend', { signal })
  scheduler.stop()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
