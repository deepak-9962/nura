import { describe, expect, it } from 'vitest';
import { VisemeService } from './viseme.service.js';
function findVisemesForWord(frames, startMs, endMs) {
    return frames
        .filter((frame) => frame.endMs > startMs && frame.startMs < endMs)
        .map((frame) => frame.id);
}
describe('VisemeService', () => {
    it('inserts closed-mouth frames for silence gaps', () => {
        const service = new VisemeService();
        const frames = service.generate([
            { word: 'vanakkam', startMs: 0, endMs: 400 },
            { word: 'seithi', startMs: 700, endMs: 1000 }
        ]);
        const hasSilence = frames.some((frame) => frame.id === 'V0' && frame.startMs <= 400 && frame.endMs >= 700);
        expect(hasSilence).toBe(true);
    });
    it('splits longer words into multiple viseme frames', () => {
        const service = new VisemeService();
        const frames = service.generate([{ word: 'thozhilnutpam', startMs: 0, endMs: 600 }]);
        expect(frames.length).toBeGreaterThan(1);
    });
    it('maps rounded and fricative sounds to distinct visemes', () => {
        const service = new VisemeService();
        const frames = service.generate([
            { word: 'oo', startMs: 0, endMs: 200 },
            { word: 'zh', startMs: 220, endMs: 420 }
        ]);
        expect(frames.some((frame) => frame.id === 'V4')).toBe(true);
        expect(frames.some((frame) => frame.id === 'V5')).toBe(true);
    });
    it('maps Tamil open vowels to wide mouth visemes', () => {
        const service = new VisemeService();
        const frames = service.generate([{ word: 'ஆனா', startMs: 0, endMs: 300 }]);
        expect(frames.some((frame) => frame.id === 'V3')).toBe(true);
    });
    it('maps Tamil front vowels to spread mouth visemes', () => {
        const service = new VisemeService();
        const frames = service.generate([{ word: 'இன்று', startMs: 0, endMs: 300 }]);
        expect(frames.some((frame) => frame.id === 'V2')).toBe(true);
    });
    it('prioritizes fricative articulation over vowels in mixed chunks', () => {
        const service = new VisemeService();
        const frames = service.generate([{ word: 'செய்தி', startMs: 0, endMs: 300 }]);
        expect(frames.some((frame) => frame.id === 'V5')).toBe(true);
    });
    it('emits emphasis score for each viseme frame within expected range', () => {
        const service = new VisemeService();
        const frames = service.generate([
            { word: 'முக்கியம்!', startMs: 0, endMs: 520 },
            { word: 'update', startMs: 540, endMs: 900 }
        ]);
        expect(frames.length).toBeGreaterThan(0);
        expect(frames.every((frame) => typeof frame.emphasis === 'number')).toBe(true);
        expect(frames.every((frame) => (frame.emphasis ?? 0) >= 0.2 && (frame.emphasis ?? 2) <= 1)).toBe(true);
    });
    it('maps required Tamil/English phoneme groups to distinct viseme buckets', () => {
        const service = new VisemeService();
        const words = [
            { word: 'ம்', startMs: 0, endMs: 120, expected: 'V0' },
            { word: 'நதி', startMs: 130, endMs: 280, expected: 'V1' },
            { word: 'இன்று', startMs: 290, endMs: 460, expected: 'V2' },
            { word: 'ஆனா', startMs: 470, endMs: 640, expected: 'V3' },
            { word: 'ஊர்', startMs: 650, endMs: 820, expected: 'V4' },
            { word: 'zh', startMs: 830, endMs: 980, expected: 'V5' }
        ];
        const frames = service.generate(words);
        for (const item of words) {
            const visemes = findVisemesForWord(frames, item.startMs, item.endMs);
            expect(visemes).toContain(item.expected);
        }
    });
    it('keeps mouth closed for deliberate pauses above 500ms', () => {
        const service = new VisemeService();
        const frames = service.generate([
            { word: 'வணக்கம்', startMs: 0, endMs: 300 },
            { word: 'தமிழகம்', startMs: 920, endMs: 1300 }
        ]);
        const hardPause = frames.find((frame) => frame.id === 'V0' && frame.startMs <= 320 && frame.endMs >= 900);
        expect(hardPause).toBeTruthy();
        expect((hardPause?.endMs ?? 0) - (hardPause?.startMs ?? 0)).toBeGreaterThan(500);
    });
    it('adapts segmentation for faster speech while preserving timing bounds', () => {
        const service = new VisemeService();
        const slow = service.generate([{ word: 'thozhilnutpam', startMs: 0, endMs: 1200 }]);
        const fast = service.generate([{ word: 'thozhilnutpam', startMs: 0, endMs: 520 }]);
        expect(fast.length).toBeGreaterThan(0);
        expect(fast.length).toBeGreaterThanOrEqual(slow.length);
        expect(fast.every((frame) => frame.startMs >= 0 && frame.endMs <= 520)).toBe(true);
    });
});
