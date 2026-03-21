function toViseme(word) {
    const normalized = word.toLowerCase().trim();
    if (normalized.length === 0 || /^\p{P}+$/u.test(normalized)) {
        return 'V0';
    }
    if (/(oo|uu|u|o|ோ|ூ|ு|ொ|ோ)/u.test(normalized)) {
        return 'V4';
    }
    if (/(aa|a|ா|அ|ஆ|ஓ|ஒ)/u.test(normalized)) {
        return 'V3';
    }
    if (/(ee|ii|e|i|ே|ெ|ீ|ி)/u.test(normalized)) {
        return 'V2';
    }
    if (/(s|sh|z|zh|ஸ|ஷ|ச|ஜ)/u.test(normalized)) {
        return 'V5';
    }
    return 'V1';
}
function splitWord(word, segments) {
    if (segments <= 1 || word.length <= 1) {
        return [word];
    }
    const chunkSize = Math.max(1, Math.ceil(word.length / segments));
    const chunks = [];
    for (let i = 0; i < word.length; i += chunkSize) {
        chunks.push(word.slice(i, i + chunkSize));
    }
    return chunks;
}
function mergeAdjacent(frames) {
    const merged = [];
    for (const frame of frames) {
        const previous = merged[merged.length - 1];
        if (previous && previous.id === frame.id && previous.endMs >= frame.startMs) {
            previous.endMs = Math.max(previous.endMs, frame.endMs);
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
        const frames = [];
        let previousEnd = Math.max(0, sorted[0].startMs);
        for (const item of sorted) {
            if (item.startMs > previousEnd) {
                frames.push({
                    id: 'V0',
                    startMs: previousEnd,
                    endMs: item.startMs
                });
            }
            const duration = Math.max(1, item.endMs - item.startMs);
            const segmentCount = Math.max(1, Math.min(3, Math.ceil(item.word.length / 4)));
            const chunks = splitWord(item.word, segmentCount);
            const segmentDuration = duration / chunks.length;
            chunks.forEach((chunk, index) => {
                const startMs = Math.round(item.startMs + index * segmentDuration);
                const endMs = index === chunks.length - 1
                    ? item.endMs
                    : Math.round(item.startMs + (index + 1) * segmentDuration);
                frames.push({
                    id: toViseme(chunk),
                    startMs,
                    endMs
                });
            });
            previousEnd = Math.max(previousEnd, item.endMs);
        }
        return mergeAdjacent(frames);
    }
}
