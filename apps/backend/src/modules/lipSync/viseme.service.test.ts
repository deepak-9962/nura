import { describe, expect, it } from 'vitest'
import { VisemeService } from './viseme.service.js'

describe('VisemeService', () => {
  it('inserts closed-mouth frames for silence gaps', () => {
    const service = new VisemeService()

    const frames = service.generate([
      { word: 'vanakkam', startMs: 0, endMs: 400 },
      { word: 'seithi', startMs: 700, endMs: 1000 }
    ])

    const hasSilence = frames.some((frame) => frame.id === 'V0' && frame.startMs <= 400 && frame.endMs >= 700)
    expect(hasSilence).toBe(true)
  })

  it('splits longer words into multiple viseme frames', () => {
    const service = new VisemeService()
    const frames = service.generate([{ word: 'thozhilnutpam', startMs: 0, endMs: 600 }])

    expect(frames.length).toBeGreaterThan(1)
  })

  it('maps rounded and fricative sounds to distinct visemes', () => {
    const service = new VisemeService()
    const frames = service.generate([
      { word: 'oo', startMs: 0, endMs: 200 },
      { word: 'zh', startMs: 220, endMs: 420 }
    ])

    expect(frames.some((frame) => frame.id === 'V4')).toBe(true)
    expect(frames.some((frame) => frame.id === 'V5')).toBe(true)
  })

  it('maps Tamil open vowels to wide mouth visemes', () => {
    const service = new VisemeService()
    const frames = service.generate([{ word: 'ஆனா', startMs: 0, endMs: 300 }])

    expect(frames.some((frame) => frame.id === 'V3')).toBe(true)
  })

  it('maps Tamil front vowels to spread mouth visemes', () => {
    const service = new VisemeService()
    const frames = service.generate([{ word: 'இன்று', startMs: 0, endMs: 300 }])

    expect(frames.some((frame) => frame.id === 'V2')).toBe(true)
  })

  it('prioritizes fricative articulation over vowels in mixed chunks', () => {
    const service = new VisemeService()
    const frames = service.generate([{ word: 'செய்தி', startMs: 0, endMs: 300 }])

    expect(frames.some((frame) => frame.id === 'V5')).toBe(true)
  })

  it('emits emphasis score for each viseme frame within expected range', () => {
    const service = new VisemeService()
    const frames = service.generate([
      { word: 'முக்கியம்!', startMs: 0, endMs: 520 },
      { word: 'update', startMs: 540, endMs: 900 }
    ])

    expect(frames.length).toBeGreaterThan(0)
    expect(frames.every((frame) => typeof frame.emphasis === 'number')).toBe(true)
    expect(frames.every((frame) => (frame.emphasis ?? 0) >= 0.2 && (frame.emphasis ?? 2) <= 1)).toBe(true)
  })
})
