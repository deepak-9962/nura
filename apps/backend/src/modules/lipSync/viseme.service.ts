export interface VisemeFrame {
  id: 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
  startMs: number
  endMs: number
  emphasis: number
}

const ROUND_VOWEL_PATTERN = /(oo|oh|ou|u|o|w|உ|ஊ|ஒ|ஓ|ஔ|ு|ூ|ொ|ோ|ௌ)/giu
const OPEN_VOWEL_PATTERN = /(aa|a|ai|அ|ஆ|ா|ஐ|ை)/giu
const FRONT_VOWEL_PATTERN = /(ee|ii|e|i|இ|ஈ|எ|ஏ|ி|ீ|ெ|ே)/giu
const FRICATIVE_PATTERN = /(s|sh|z|zh|ch|j|ஸ|ஷ|ச|ஜ|ஶ|ழ)/giu
const CLOSED_LIP_PATTERN = /(m|p|b|f|v|w|ம்|ப்|ப்|ம|ப|வ)/giu
const LONG_SOUND_PATTERN = /(aa|ee|ii|oo|uu|ா|ீ|ூ|ே|ோ)/giu

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function matchCount(input: string, pattern: RegExp): number {
  const matches = input.match(pattern)
  return matches ? matches.length : 0
}

function splitTamilPhoneticUnits(word: string): string[] {
  // Tamil consonant + optional vowel sign or pulli, plus standalone vowels.
  const units = word.match(/[அஆஇஈஉஊஎஏஐஒஓஔ]|[க-ஹ][ாிீுூெேைொோௌ்]?/gu)
  return units ?? []
}

function splitLatinPhoneticUnits(word: string): string[] {
  // Separate consonant and vowel runs to preserve articulation transitions.
  const units = word.match(/[bcdfghjklmnpqrstvwxyz]+|[aeiou]+|\d+/giu)
  return units ?? []
}

function splitPhoneticUnits(word: string): string[] {
  if (/[\u0B80-\u0BFF]/u.test(word)) {
    const tamilUnits = splitTamilPhoneticUnits(word)
    if (tamilUnits.length > 0) {
      return tamilUnits
    }
  }

  const latinUnits = splitLatinPhoneticUnits(word)
  if (latinUnits.length > 0) {
    return latinUnits
  }

  return [word]
}

function bucketUnits(units: string[], segments: number): string[] {
  if (segments <= 1 || units.length <= 1) {
    return [units.join('')]
  }

  const chunkSize = Math.max(1, Math.ceil(units.length / segments))
  const chunks: string[] = []

  for (let i = 0; i < units.length; i += chunkSize) {
    chunks.push(units.slice(i, i + chunkSize).join(''))
  }

  return chunks
}

function estimateWordStress(word: string, startMs: number, endMs: number): number {
  const normalized = word.trim()
  const duration = Math.max(1, endMs - startMs)
  let score = 0.45

  if (/[!?]/u.test(normalized)) {
    score += 0.24
  }
  if (/[,:;\-]/u.test(normalized)) {
    score += 0.1
  }
  if (matchCount(normalized.toLowerCase(), LONG_SOUND_PATTERN) > 0) {
    score += 0.12
  }
  if (duration >= 520) {
    score += 0.16
  }

  return clamp(score, 0.2, 1)
}

function toViseme(word: string): VisemeFrame['id'] {
  const normalized = word.toLowerCase().trim().replace(/[^\p{L}\p{M}]+/gu, '')

  if (normalized.length === 0 || /^\p{P}+$/u.test(normalized)) {
    return 'V0'
  }

  const scoreV5 = matchCount(normalized, FRICATIVE_PATTERN) * 1.4
  const scoreV4 = matchCount(normalized, ROUND_VOWEL_PATTERN)
  const scoreV3 = matchCount(normalized, OPEN_VOWEL_PATTERN)
  const scoreV2 = matchCount(normalized, FRONT_VOWEL_PATTERN)
  const scoreV1 = matchCount(normalized, CLOSED_LIP_PATTERN) + (normalized.includes('்') ? 0.5 : 0)

  const ranked: Array<[VisemeFrame['id'], number]> = [
    ['V5', scoreV5],
    ['V4', scoreV4],
    ['V3', scoreV3],
    ['V2', scoreV2],
    ['V1', scoreV1]
  ]

  const [bestViseme, bestScore] = ranked.reduce((best, current) =>
    current[1] > best[1] ? current : best
  )

  if (bestScore > 0) {
    return bestViseme
  }

  return 'V1'
}

function splitWord(word: string, segments: number): string[] {
  if (segments <= 1 || word.length <= 1) {
    return [word]
  }

  const units = splitPhoneticUnits(word)
  return bucketUnits(units, segments)
}

function mergeAdjacent(frames: VisemeFrame[]): VisemeFrame[] {
  const merged: VisemeFrame[] = []

  for (const frame of frames) {
    const previous = merged[merged.length - 1]
    if (previous && previous.id === frame.id && previous.endMs >= frame.startMs) {
      previous.endMs = Math.max(previous.endMs, frame.endMs)
      previous.emphasis = Math.max(previous.emphasis, frame.emphasis)
      continue
    }
    if (frame.endMs > frame.startMs) {
      merged.push({ ...frame })
    }
  }

  return merged
}

export class VisemeService {
  generate(wordTimestamps: Array<{ word: string; startMs: number; endMs: number }>): VisemeFrame[] {
    if (wordTimestamps.length === 0) {
      return []
    }

    const sorted = [...wordTimestamps].sort((a, b) => a.startMs - b.startMs)
    const frames: VisemeFrame[] = []
    let previousEnd = Math.max(0, sorted[0].startMs)

    for (const item of sorted) {
      if (item.startMs > previousEnd) {
        frames.push({
          id: 'V0',
          startMs: previousEnd,
          endMs: item.startMs,
          emphasis: 0.2
        })
      }

      const duration = Math.max(1, item.endMs - item.startMs)
      const segmentCount = Math.max(1, Math.min(3, Math.ceil(item.word.length / 4)))
      const chunks = splitWord(item.word, segmentCount)
      const segmentDuration = duration / chunks.length
      const stress = estimateWordStress(item.word, item.startMs, item.endMs)

      chunks.forEach((chunk, index) => {
        const startMs = Math.round(item.startMs + index * segmentDuration)
        const endMs =
          index === chunks.length - 1
            ? item.endMs
            : Math.round(item.startMs + (index + 1) * segmentDuration)

        const chunkPos = chunks.length <= 1 ? 1 : index / (chunks.length - 1)
        const centerBoost = 1 - Math.abs(chunkPos * 2 - 1)
        const emphasis = clamp(stress * (0.86 + 0.14 * centerBoost), 0.2, 1)

        frames.push({
          id: toViseme(chunk),
          startMs,
          endMs,
          emphasis
        })
      })

      previousEnd = Math.max(previousEnd, item.endMs)
    }

    return mergeAdjacent(frames)
  }
}
