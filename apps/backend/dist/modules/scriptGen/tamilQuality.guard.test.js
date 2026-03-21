import { describe, expect, it } from 'vitest';
import { evaluateTamilScriptQuality } from './tamilQuality.guard.js';
describe('evaluateTamilScriptQuality', () => {
    it('accepts spoken Tamil-heavy content', () => {
        const script = 'வணக்கம். இன்று உலக அரசியல் நிலவரம் குறித்து முக்கிய தகவல்களை வழங்குகிறோம். பல்வேறு நம்பகமான மூலங்களின் அடிப்படையில் இந்த புதுப்பிப்பு தயாரிக்கப்பட்டுள்ளது.';
        const result = evaluateTamilScriptQuality(script);
        expect(result.ok).toBe(true);
        expect(result.violations).toHaveLength(0);
    });
    it('rejects English-heavy lines', () => {
        const script = 'Welcome to the Tamil bulletin. This line is mostly English words and should fail the quality rule. நன்றி.';
        const result = evaluateTamilScriptQuality(script);
        expect(result.ok).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
    });
});
