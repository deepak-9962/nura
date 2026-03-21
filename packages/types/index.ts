export const CATEGORIES = [
  'POLITICS',
  'BUSINESS',
  'TECH',
  'SPORTS',
  'HEALTH',
  'WORLD',
  'LOCAL'
] as const

export const BROADCAST_STATES = [
  'IDLE',
  'INGESTING',
  'SCRIPTING',
  'SYNTHESIZING',
  'RENDERING',
  'BROADCASTING',
  'BREAKING_ALERT',
  'ERROR'
] as const

export type Category = (typeof CATEGORIES)[number]

export type ArticleSchema = {
  id: string
  title: string
  body: string
  source: string
  sourceUrl: string
  articleUrl: string
  publishedAt: string
  fetchedAt: string
  category: Category
  reliabilityScore: number
  language: string
  conflictFlag: boolean
}

export type NewsEvent = {
  eventId: string
  headline: string
  summary: string
  articles: string[]
  category: Category
  firstSeenAt: string
  lastUpdatedAt: string
  versionCount: number
  isBreaking: boolean
  avgReliability: number
  importanceScore?: number
}

export type BroadcastState = (typeof BROADCAST_STATES)[number]

export type BroadcastPayload = {
  broadcastId: string
  generatedAt: string
  state: BroadcastState
  top5: NewsEvent[]
  script: string
  audioUrl: string
  videoUrl: string
  subtitles: string[]
  scriptDebug?: {
    generationPath: 'azure-normal' | 'azure-strict-retry' | 'fallback'
    retries: number
    qualityViolations: number
  }
}

export type ApiError = {
  code: string
  message: string
}

export type ApiSuccessEnvelope<T> = {
  ok: true
  traceId: string
  data: T
}

export type ApiFailureEnvelope = {
  ok: false
  traceId: string
  error: ApiError
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiFailureEnvelope
