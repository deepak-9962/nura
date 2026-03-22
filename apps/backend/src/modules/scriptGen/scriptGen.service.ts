import type { NewsEvent } from '../../types.js'
import { AzureOpenAiClient } from '../../clients/azureOpenAi.client.js'
import { loadConfig } from '../../config.js'
import { logger } from '../../utils/logger.js'
import { evaluateTamilScriptQuality } from './tamilQuality.guard.js'

export type ScriptGenerationMeta = {
  generationPath: 'azure-normal' | 'azure-strict-retry' | 'fallback'
  retries: number
  qualityViolations: number
}

const REPEATED_BOILERPLATE_PATTERNS: RegExp[] = [
  /இந்த\s+பக்க(?:த்தில்|த)\s*பார்க்கலாம்\.?/i,
  /சமீபத்திய\s+நிகழ்வுகள்\s+பற்றிய\s+தகவல்களை?/i
]

function normalizeForDedup(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\u200B\u200C\u200D]+/g, ' ')
    .replace(/[.,!?;:"'()\[\]{}]/g, '')
    .trim()
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function stripLeadingHeadline(summary: string, headline: string): string {
  const normalizedSummary = normalizeForDedup(summary)
  const normalizedHeadline = normalizeForDedup(headline)

  if (!normalizedHeadline || !normalizedSummary.startsWith(normalizedHeadline)) {
    return summary
  }

  const escapedHeadline = headline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return summary.replace(new RegExp(`^\\s*${escapedHeadline}[\\s:.,-]*`, 'i'), '').trim()
}

function sanitizeSummary(headline: string, summary: string): string {
  const compact = summary.replace(/\s+/g, ' ').trim()
  const withoutHeadlinePrefix = stripLeadingHeadline(compact, headline)
  const parts = splitSentences(withoutHeadlinePrefix)
  const deduped: string[] = []
  const seen = new Set<string>()

  for (const part of parts) {
    const cleaned = part.replace(/\s+/g, ' ').trim()
    if (!cleaned) {
      continue
    }
    if (REPEATED_BOILERPLATE_PATTERNS.some((pattern) => pattern.test(cleaned))) {
      continue
    }

    const key = normalizeForDedup(cleaned)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(cleaned)
  }

  return deduped.join(' ')
}

export class ScriptGenService {
  private readonly config = loadConfig()
  private readonly azureOpenAi = new AzureOpenAiClient()

  async generateTamilScript(events: NewsEvent[]): Promise<{
    script: string
    subtitles: string[]
    meta: ScriptGenerationMeta
  }> {
    const intro = 'Hello! Welcome to Nura AI Live News. வணக்கம். இது நூரா ஏஐ நேரலை செய்தி ஒளிபரப்பு.'
    const outro = 'That concludes our top stories. இதுவரை முக்கிய செய்திகள். மீண்டும் சந்திப்போம். நன்றி.'

    const storyLines = events.map((event, index) => {
      const order = index + 1
      return this.toBilingualFallbackLine(event, order)
    })

    const fallbackScript = [intro, ...storyLines, outro].join(' ')
    const fallbackSubtitles = this.toSubtitles(fallbackScript)
    if (this.config.demoMode) {
      return {
        script: fallbackScript,
        subtitles: fallbackSubtitles,
        meta: {
          generationPath: 'fallback',
          retries: 0,
          qualityViolations: 0
        }
      }
    }

    try {
      const generated = await this.azureOpenAi.generateTamilScript(events)
      if (generated) {
        const quality = evaluateTamilScriptQuality(generated)
        if (quality.ok) {
          return {
            script: generated,
            subtitles: this.toSubtitles(generated),
            meta: {
              generationPath: 'azure-normal',
              retries: 0,
              qualityViolations: 0
            }
          }
        }

        logger.warn('Tamil quality guard rejected generated script; retrying strict pass', {
          violations: quality.violations.slice(0, 3)
        })

        const strictGenerated = await this.azureOpenAi.generateTamilScript(events, {
          strictTamil: true
        })

        if (strictGenerated) {
          const strictQuality = evaluateTamilScriptQuality(strictGenerated)
          if (strictQuality.ok) {
            return {
              script: strictGenerated,
              subtitles: this.toSubtitles(strictGenerated),
              meta: {
                generationPath: 'azure-strict-retry',
                retries: 1,
                qualityViolations: quality.violations.length
              }
            }
          }

          logger.warn('Strict Tamil retry still failed quality check; using fallback', {
            violations: strictQuality.violations.slice(0, 3)
          })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown script generation error'
      logger.warn('Azure OpenAI generation failed, using fallback script', { message })
    }

    const script = fallbackScript
    return {
      script,
      subtitles: fallbackSubtitles,
      meta: {
        generationPath: 'fallback',
        retries: 1,
        qualityViolations: 1
      }
    }
  }

  private toBilingualFallbackLine(event: NewsEvent, order: number): string {
    const categoryLabel = this.toTamilCategory(event.category)
    const safeHeadline = event.headline.trim() || 'Latest update'
    const safeSummary = sanitizeSummary(safeHeadline, event.summary).slice(0, 220) || safeHeadline
    const sourceCount = event.articles.length
    const breakingLineTa = event.isBreaking
      ? 'இது உடனடி கவனத்திற்கு உரிய முக்கிய செய்தி.'
      : 'இதற்கான மேலும் தகவல்கள் தொடர்ந்து வரவிருக்கின்றன.'

    return `செய்தி ${order}: ${categoryLabel} பிரிவில், ${safeHeadline}. சுருக்கம்: ${safeSummary}. ${sourceCount} மூலங்களில் இருந்து இந்த செய்தி தொகுக்கப்பட்டது. ${breakingLineTa}`
  }

  private toTamilCategory(category: NewsEvent['category']): string {
    const labels: Record<NewsEvent['category'], string> = {
      POLITICS: 'அரசியல்',
      BUSINESS: 'வணிகம்',
      TECH: 'தொழில்நுட்பம்',
      SPORTS: 'விளையாட்டு',
      HEALTH: 'சுகாதாரம்',
      WORLD: 'உலக',
      LOCAL: 'உள்ளூர்'
    }
    return labels[category]
  }

  private toSubtitles(script: string): string[] {
    const lines = splitSentences(script)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length >= 3)

    const deduped: string[] = []
    const seen = new Set<string>()
    for (const line of lines) {
      const key = normalizeForDedup(line)
      if (!key || seen.has(key)) {
        continue
      }
      seen.add(key)
      deduped.push(line)
    }

    return deduped.length > 0 ? deduped : [script]
  }
}
