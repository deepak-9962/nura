type RequiredConfig = {
  demoMode: boolean
  liveNewsOnly: boolean
  port: number
  broadcastIntervalMinutes: number
  databasePath: string
  newsApiKey: string | null
  azureOpenAiApiKey: string | null
  azureOpenAiEndpoint: string | null
  azureOpenAiDeployment: string | null
  azureOpenAiApiVersion: string
  azureSpeechKey: string | null
  azureSpeechRegion: string | null
  azureSpeechVoice: string
}

export function loadConfig(): RequiredConfig {
  const demoMode = (process.env.DEMO_MODE ?? 'false').toLowerCase() === 'true'
  const liveNewsOnly = (process.env.LIVE_NEWS_ONLY ?? 'true').toLowerCase() === 'true'
  const port = Number(process.env.PORT ?? '4000')
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('PORT must be a positive number')
  }

  const broadcastIntervalMinutes = Number(process.env.BROADCAST_INTERVAL_MINUTES ?? '30')
  if (!Number.isFinite(broadcastIntervalMinutes) || broadcastIntervalMinutes <= 0) {
    throw new Error('BROADCAST_INTERVAL_MINUTES must be a positive number')
  }

  return {
    demoMode,
    liveNewsOnly,
    port,
    broadcastIntervalMinutes,
    databasePath: process.env.DATABASE_PATH ?? 'apps/backend/data/news-anchor.sqlite',
    newsApiKey: process.env.NEWS_API_KEY ?? null,
    azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY ?? null,
    azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT ?? null,
    azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? null,
    azureOpenAiApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21',
    azureSpeechKey: process.env.AZURE_SPEECH_KEY ?? null,
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION ?? null,
    azureSpeechVoice: process.env.AZURE_SPEECH_VOICE ?? 'ta-IN-PallaviNeural'
  }
}
