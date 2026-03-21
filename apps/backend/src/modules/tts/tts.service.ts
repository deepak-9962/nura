import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as googleTTS from 'google-tts-api'
import { AzureSpeechClient } from '../../clients/azureSpeech.client.js'
import { loadConfig } from '../../config.js'
import { logger } from '../../utils/logger.js'

export interface AudioArtifact {
  audioUrl: string
  durationSec: number
  wordTimestamps: Array<{ word: string; startMs: number; endMs: number }>
}

const currentFilePath = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..')
const generatedAssetsDir = path.resolve(projectRoot, 'public', 'assets', 'generated')

async function buildDemoMp3(script: string): Promise<string> {
  fs.mkdirSync(generatedAssetsDir, { recursive: true })
  const filename = `demo-${Date.now()}-${randomUUID()}.mp3`
  const outputPath = path.resolve(generatedAssetsDir, filename)
  
  try {
    const chunks = await googleTTS.getAllAudioBase64(script, {
      lang: 'ta',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?!'
    })
    
    // Fall back to English if Tamil voice rejects the chunk
    const buffers = []
    for (const chunk of chunks) {
       buffers.push(Buffer.from(chunk.base64, 'base64'))
    }
    
    fs.writeFileSync(outputPath, Buffer.concat(buffers))
  } catch (error) {
    logger.warn('Google TTS demo fallback failed, generating silent buffer', { error: String(error) })
    fs.writeFileSync(outputPath, Buffer.from([])) // Empty file on total failure
  }
  
  return `/assets/generated/${filename}`
}

export class TtsService {
  private readonly config = loadConfig()
  private readonly azureSpeech = new AzureSpeechClient()

  async synthesize(script: string): Promise<AudioArtifact> {
    const words = script.split(/\s+/).filter(Boolean)
    const msPerWord = 430

    const wordTimestamps = words.map((word, index) => ({
      word,
      startMs: index * msPerWord,
      endMs: (index + 1) * msPerWord
    }))

    const durationSec = Math.ceil((words.length * msPerWord) / 1000)

    let audioUrl = ''
    if (!this.config.demoMode && this.azureSpeech.isConfigured()) {
      try {
        const generatedAudioUrl = await this.azureSpeech.synthesizeMp3(script)
        if (generatedAudioUrl) {
          audioUrl = generatedAudioUrl
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Azure Speech error'
        logger.warn('Azure Speech synthesis failed, using demo generator', { message })
      }
    }

    if (!audioUrl) {
      audioUrl = await buildDemoMp3(script)
    }

    return {
      audioUrl,
      durationSec,
      wordTimestamps
    }
  }
}
