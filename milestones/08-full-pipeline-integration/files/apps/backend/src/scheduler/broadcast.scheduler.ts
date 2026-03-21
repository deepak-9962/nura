import type { BroadcastOrchestrator } from '../modules/broadcast/broadcast.orchestrator.js'
import { logger } from '../utils/logger.js'

export class BroadcastScheduler {
  private timer: NodeJS.Timeout | null = null
  private stopped = false

  constructor(
    private readonly orchestrator: BroadcastOrchestrator,
    private readonly intervalMs: number
  ) {}

  start(): void {
    if (this.timer || this.intervalMs <= 0) {
      return
    }

    this.stopped = false
    this.scheduleNext(0)

    logger.info('Broadcast scheduler started', { intervalMs: this.intervalMs })
  }

  stop(): void {
    if (!this.timer) {
      return
    }
    this.stopped = true
    clearTimeout(this.timer)
    this.timer = null
    logger.info('Broadcast scheduler stopped')
  }

  private scheduleNext(delayMs: number): void {
    if (this.stopped) {
      return
    }

    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      void this.runScheduledCycle()
    }, Math.max(0, delayMs))
  }

  private async runScheduledCycle(): Promise<void> {
    try {
      const payload = await this.orchestrator.triggerCycle()
      logger.info('Scheduled broadcast cycle completed', {
        broadcastId: payload.broadcastId,
        generatedAt: payload.generatedAt
      })
      this.scheduleNext(this.orchestrator.consumeCycleIntervalOverride(this.intervalMs))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scheduler error'
      logger.error('Scheduled broadcast cycle failed', { message })
      this.scheduleNext(Math.min(this.intervalMs, 60_000))
    }
  }
}
