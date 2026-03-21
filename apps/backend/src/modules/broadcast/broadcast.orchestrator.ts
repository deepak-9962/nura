import { v4 as uuidv4 } from 'uuid'
import { generateSeedArticles } from '../../data/seedArticles.js'
import { DedupService } from '../dedup/dedup.service.js'
import { IngestionService } from '../ingestion/ingestion.service.js'
import { VisemeService } from '../lipSync/viseme.service.js'
import { RankerService } from '../ranker/ranker.service.js'
import { ScriptGenService } from '../scriptGen/scriptGen.service.js'
import { TtsService } from '../tts/tts.service.js'
import { CycleRepository } from '../../repositories/cycle.repository.js'
import { EventRepository } from '../../repositories/event.repository.js'
import { logger } from '../../utils/logger.js'
import type { ArticleSchema, NewsEvent } from '../../types.js'
import type { BroadcastPayload, BroadcastState } from '../../types.js'

export class BroadcastOrchestrator {
  private state: BroadcastState = 'IDLE'
  private current: BroadcastPayload | null = null
  private cycleInFlight: Promise<BroadcastPayload> | null = null
  private breakOverrideRequested = false

  private readonly ingestion = new IngestionService()
  private readonly dedup = new DedupService()
  private readonly ranker = new RankerService()
  private readonly scriptGen = new ScriptGenService()
  private readonly tts = new TtsService()
  private readonly viseme = new VisemeService()
  private readonly cycles = new CycleRepository()
  private readonly events = new EventRepository()

  constructor() {
    this.current = this.cycles.getLatestBroadcast()
    if (this.current) {
      this.state = this.current.state
    }
  }

  async triggerCycle(): Promise<BroadcastPayload> {
    if (this.cycleInFlight) {
      return this.cycleInFlight
    }

    this.cycleInFlight = this.runCycle().finally(() => {
      this.cycleInFlight = null
    })

    return this.cycleInFlight
  }

  consumeCycleIntervalOverride(defaultIntervalMs: number): number {
    if (!this.breakOverrideRequested) {
      return defaultIntervalMs
    }

    this.breakOverrideRequested = false
    return Math.min(defaultIntervalMs, 5 * 60 * 1000)
  }

  private async runCycle(): Promise<BroadcastPayload> {
    this.state = 'INGESTING'
    let articles: ArticleSchema[] = []
    try {
      articles = await this.ingestion.ingestNews()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ingestion error'
      logger.error('Ingestion failed; falling back to seed articles', { message })
      articles = generateSeedArticles()
    }

    let events: NewsEvent[] = []
    try {
      events = this.dedup.deduplicate(articles)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown dedup error'
      logger.error('Deduplication failed; using basic event conversion', { message })
      events = this.toBasicEvents(articles)
    }

    try {
      this.events.upsertMany(events)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown event persistence error'
      logger.error('Event persistence failed; continuing cycle', { message })
    }

    let rankedEvents: NewsEvent[]
    try {
      rankedEvents = this.ranker.rankTop5(events)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ranking error'
      logger.error('Ranking failed; using latest available events', { message })
      rankedEvents = events.slice(0, 5)
    }

    const top5 = this.applyRepeatPrevention(rankedEvents)

    if (top5.some((event) => event.isBreaking)) {
      this.breakOverrideRequested = true
    }

    this.state = 'SCRIPTING'
    let script = 'வணக்கம். தற்போது முக்கிய செய்திகள் இல்லை. மேலும் தகவல்களுக்கு காத்திருக்கவும்.'
    let subtitles: string[] = [script]
    let meta: BroadcastPayload['scriptDebug'] = {
      generationPath: 'fallback',
      retries: 0,
      qualityViolations: 0
    }

    try {
      const generated = await this.scriptGen.generateTamilScript(top5)
      script = generated.script
      subtitles = generated.subtitles
      meta = generated.meta
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown script generation error'
      logger.error('Script generation failed; using emergency fallback script', { message })
    }

    this.state = 'SYNTHESIZING'
    let audioUrl = this.current?.audioUrl ?? ''
    let wordTimestamps: Array<{ word: string; startMs: number; endMs: number }> = []

    try {
      const audio = await this.tts.synthesize(script)
      audioUrl = audio.audioUrl
      wordTimestamps = audio.wordTimestamps
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown synthesis error'
      logger.error('TTS synthesis failed; continuing with previous audio if available', { message })
    }

    this.state = 'RENDERING'
    let visemeFrames: BroadcastPayload['visemeFrames'] = []
    try {
      visemeFrames = this.viseme.generate(wordTimestamps)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown viseme generation error'
      logger.error('Viseme generation failed; continuing broadcast without lip keyframes', { message })
    }

    this.state = 'BROADCASTING'
    this.current = {
      broadcastId: uuidv4(),
      generatedAt: new Date().toISOString(),
      state: this.state,
      top5,
      script,
      audioUrl,
      videoUrl: '/assets/mock-anchor-video.mp4',
      subtitles,
      visemeFrames,
      scriptDebug: meta
    }

    try {
      this.cycles.saveCycle(this.current)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown cycle persistence error'
      logger.error('Cycle persistence failed', { message })
    }

    return this.current
  }

  private toBasicEvents(articles: ArticleSchema[]): NewsEvent[] {
    return articles.slice(0, 20).map((article) => ({
      eventId: article.id,
      headline: article.title,
      summary: `${article.title}. ${article.body.slice(0, 180)}`,
      articles: [article.id],
      category: article.category,
      firstSeenAt: article.publishedAt,
      lastUpdatedAt: article.fetchedAt,
      versionCount: 1,
      isBreaking: article.reliabilityScore >= 90,
      avgReliability: article.reliabilityScore
    }))
  }

  private applyRepeatPrevention(events: NewsEvent[]): NewsEvent[] {
    if (events.length <= 1) {
      return events.slice(0, 5)
    }

    const recent = this.cycles.listRecentBroadcasts(3)
    const lastBroadcastVersion = new Map<string, number>()

    for (const cycle of recent) {
      for (const event of cycle.top5) {
        const previous = lastBroadcastVersion.get(event.eventId) ?? 0
        if (event.versionCount > previous) {
          lastBroadcastVersion.set(event.eventId, event.versionCount)
        }
      }
    }

    const filtered = events.filter((event) => {
      const previousVersion = lastBroadcastVersion.get(event.eventId)
      return previousVersion === undefined || event.versionCount > previousVersion
    })

    if (filtered.length >= 5) {
      return filtered.slice(0, 5)
    }

    const top5 = [...filtered]
    for (const event of events) {
      if (top5.some((picked) => picked.eventId === event.eventId)) {
        continue
      }
      top5.push(event)
      if (top5.length === 5) {
        break
      }
    }

    return top5
  }

  getCurrent(): BroadcastPayload | null {
    return this.current
  }

  getState(): BroadcastState {
    if (this.breakOverrideRequested) {
      return 'BREAKING_ALERT'
    }
    return this.state
  }
}
