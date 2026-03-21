export type TamilQualityViolation = {
  line: string
  englishRatio: number
  reason: string
}

export type TamilQualityResult = {
  ok: boolean
  violations: TamilQualityViolation[]
}

const LINE_SPLIT_PATTERN = /[\n.!?]+/
const MIN_REVIEWABLE_LETTERS = 18
const MAX_ENGLISH_RATIO = 0.85 // Raised to accommodate both English and Tamil text

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function englishWordCount(line: string): number {
  return (line.match(/\b[A-Za-z]{3,}\b/g) ?? []).length
}

export function evaluateTamilScriptQuality(script: string): TamilQualityResult {
  const lines = script
    .split(LINE_SPLIT_PATTERN)
    .map((line) => line.trim())
    .filter(Boolean)

  const violations: TamilQualityViolation[] = []

  for (const line of lines) {
    const tamilLetters = (line.match(/[\u0B80-\u0BFF]/g) ?? []).length
    const englishLetters = (line.match(/[A-Za-z]/g) ?? []).length
    const reviewableLetters = tamilLetters + englishLetters

    if (reviewableLetters < MIN_REVIEWABLE_LETTERS) {
      continue
    }

    const ratio = englishLetters / reviewableLetters
    const wordCount = englishWordCount(line)

    if (ratio > MAX_ENGLISH_RATIO) {
      violations.push({
        line,
        englishRatio: round(ratio),
        reason: 'high-english-ratio'
      })
      continue
    }

    if (wordCount >= 4 && englishLetters >= tamilLetters) {
      violations.push({
        line,
        englishRatio: round(ratio),
        reason: 'too-many-english-words'
      })
    }
  }

  return {
    ok: violations.length === 0,
    violations
  }
}
