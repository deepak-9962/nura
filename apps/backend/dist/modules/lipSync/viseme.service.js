const ROUND_VOWEL_PATTERN = /(oo|oh|ou|u|uu|o|w|உ|ஊ|ஒ|ஓ|ஔ|ு|ூ|ொ|ோ|ௌ)/giu;
const OPEN_VOWEL_PATTERN = /(aa|a|ai|அ|ஆ|ா|ஐ|ை)/giu;
const FRONT_VOWEL_PATTERN = /(ee|ii|e|i|இ|ஈ|எ|ஏ|ி|ீ|ெ|ே)/giu;
const FRICATIVE_PATTERN = /(s|sh|z|zh|ஸ|ஷ|ஶ|ச|ஜ|ழ)/giu;
const CLOSED_LIP_PATTERN = /(m|b|p|ம்|ம|ப்|ப)/giu;
const SLIGHT_OPEN_PATTERN = /(n|d|t|l|ன்|ந்|த்|ட்|ல்|ள|ல)/giu;
const LONG_SOUND_PATTERN = /(aa|ee|ii|oo|uu|ா|ீ|ூ|ே|ோ)/giu;
const HAS_LETTER_PATTERN = /[\p{L}\p{M}]/u;
const HARD_PAUSE_MS = 500;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function matchCount(input, pattern) {
    const matches = input.match(pattern);
    return matches ? matches.length : 0;
}
function splitTamilPhoneticUnits(word) {
    // Tamil consonant + optional vowel sign or pulli, plus standalone vowels.
    const units = word.match(/[அஆஇஈஉஊஎஏஐஒஓஔ]|[க-ஹ][ாிீுூெேைொோௌ்]?/gu);
    return units ?? [];
}
function splitLatinPhoneticUnits(word) {
    // Separate consonant and vowel runs to preserve articulation transitions.
    const units = word.match(/[bcdfghjklmnpqrstvwxyz]+|[aeiou]+|\d+/giu);
    return units ?? [];
}
function splitPhoneticUnits(word) {
    if (/[\u0B80-\u0BFF]/u.test(word)) {
        const tamilUnits = splitTamilPhoneticUnits(word);
        if (tamilUnits.length > 0) {
            return tamilUnits;
        }
    }
    const latinUnits = splitLatinPhoneticUnits(word);
    if (latinUnits.length > 0) {
        return latinUnits;
    }
    return [word];
}
function bucketUnits(units, segments) {
    if (segments <= 1 || units.length <= 1) {
        return [units.join('')];
    }
    const chunkSize = Math.max(1, Math.ceil(units.length / segments));
    const chunks = [];
    for (let i = 0; i < units.length; i += chunkSize) {
        chunks.push(units.slice(i, i + chunkSize).join(''));
    }
    return chunks;
}
function estimateWordStress(word, startMs, endMs) {
    const normalized = word.trim();
    const duration = Math.max(1, endMs - startMs);
    let score = 0.45;
    if (/[!?]/u.test(normalized)) {
        score += 0.24;
    }
    if (/[,:;\-]/u.test(normalized)) {
        score += 0.1;
    }
    if (matchCount(normalized.toLowerCase(), LONG_SOUND_PATTERN) > 0) {
        score += 0.12;
    }
    if (duration >= 520) {
        score += 0.16;
    }
    return clamp(score, 0.2, 1);
}
function estimateSpeechRateFactor(word, startMs, endMs, globalMedianMsPerUnit) {
    const duration = Math.max(1, endMs - startMs);
    const units = Math.max(1, splitPhoneticUnits(word).length);
    const msPerUnit = duration / units;
    if (!Number.isFinite(globalMedianMsPerUnit) || globalMedianMsPerUnit <= 0) {
        return 1;
    }
    const relativeSpeed = globalMedianMsPerUnit / msPerUnit;
    return clamp(relativeSpeed, 0.7, 1.5);
}
function median(values) {
    if (values.length === 0) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}
function toViseme(word) {
    const normalized = word.toLowerCase().trim().replace(/[^\p{L}\p{M}]+/gu, '');
    if (normalized.length === 0 || !HAS_LETTER_PATTERN.test(normalized)) {
        return 'V0';
    }
    const scoreV0 = matchCount(normalized, CLOSED_LIP_PATTERN) * 1.6;
    const scoreV1 = matchCount(normalized, SLIGHT_OPEN_PATTERN) * 1.2;
    const scoreV2 = matchCount(normalized, FRONT_VOWEL_PATTERN) * 1.3;
    const scoreV3 = matchCount(normalized, OPEN_VOWEL_PATTERN) * 1.25;
    const scoreV4 = matchCount(normalized, ROUND_VOWEL_PATTERN);
    const scoreV5 = matchCount(normalized, FRICATIVE_PATTERN) * 1.5;
    if (scoreV0 > 0 && scoreV0 >= scoreV1 + scoreV2 + scoreV3 + scoreV4 + scoreV5) {
        return 'V0';
    }
    const ranked = [
        ['V0', scoreV0],
        ['V1', scoreV1],
        ['V2', scoreV2],
        ['V3', scoreV3],
        ['V4', scoreV4],
        ['V5', scoreV5]
    ];
    const [bestViseme, bestScore] = ranked.reduce((best, current) => {
        if (current[1] > best[1]) {
            return current;
        }
        return best;
    });
    if (bestScore > 0) {
        return bestViseme;
    }
    return 'V1';
}
function splitWord(word, segments) {
    if (segments <= 1 || word.length <= 1) {
        return [word];
    }
    const units = splitPhoneticUnits(word);
    return bucketUnits(units, segments);
}
function mergeAdjacent(frames) {
    const merged = [];
    for (const frame of frames) {
        const previous = merged[merged.length - 1];
        if (previous && previous.id === frame.id && previous.endMs >= frame.startMs) {
            previous.endMs = Math.max(previous.endMs, frame.endMs);
            previous.emphasis = Math.max(previous.emphasis, frame.emphasis);
            continue;
        }
        if (frame.endMs > frame.startMs) {
            merged.push({ ...frame });
        }
    }
    return merged;
}
export class VisemeService {
    generate(wordTimestamps) {
        if (wordTimestamps.length === 0) {
            return [];
        }
        const sorted = [...wordTimestamps].sort((a, b) => a.startMs - b.startMs);
        const msPerUnitSeries = sorted
            .map((item) => {
            const units = Math.max(1, splitPhoneticUnits(item.word).length);
            const duration = Math.max(1, item.endMs - item.startMs);
            return duration / units;
        })
            .filter((value) => Number.isFinite(value) && value > 0);
        const globalMedianMsPerUnit = median(msPerUnitSeries);
        const frames = [];
        let previousEnd = Math.max(0, sorted[0].startMs);
        for (const item of sorted) {
            if (item.startMs > previousEnd) {
                const pauseDuration = item.startMs - previousEnd;
                frames.push({
                    id: 'V0',
                    startMs: previousEnd,
                    endMs: item.startMs,
                    emphasis: pauseDuration >= HARD_PAUSE_MS ? 0.2 : 0.24
                });
            }
            const duration = Math.max(1, item.endMs - item.startMs);
            const rateFactor = estimateSpeechRateFactor(item.word, item.startMs, item.endMs, globalMedianMsPerUnit);
            const baseSegments = Math.max(1, Math.min(4, Math.ceil(splitPhoneticUnits(item.word).length / 2)));
            const segmentCount = Math.max(1, Math.min(5, Math.round(baseSegments * rateFactor)));
            const chunks = splitWord(item.word, segmentCount);
            const segmentDuration = duration / chunks.length;
            const stress = estimateWordStress(item.word, item.startMs, item.endMs);
            chunks.forEach((chunk, index) => {
                const startMs = Math.round(item.startMs + index * segmentDuration);
                const endMs = index === chunks.length - 1
                    ? item.endMs
                    : Math.round(item.startMs + (index + 1) * segmentDuration);
                const chunkPos = chunks.length <= 1 ? 1 : index / (chunks.length - 1);
                const centerBoost = 1 - Math.abs(chunkPos * 2 - 1);
                const paceAdjusted = stress * (0.86 + 0.14 * centerBoost) * (0.92 + rateFactor * 0.08);
                const emphasis = clamp(paceAdjusted, 0.2, 1);
                frames.push({
                    id: toViseme(chunk),
                    startMs,
                    endMs,
                    emphasis
                });
            });
            previousEnd = Math.max(previousEnd, item.endMs);
        }
        return mergeAdjacent(frames);
    }
}
