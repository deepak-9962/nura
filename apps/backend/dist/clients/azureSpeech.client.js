import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../config.js';
const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), '..', '..');
const generatedAssetsDir = path.resolve(projectRoot, 'public', 'assets', 'generated');
function escapeXml(input) {
    return input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}
function buildSsml(script, voiceName) {
    return [
        '<speak version="1.0" xml:lang="ta-IN">',
        `  <voice xml:lang="ta-IN" name="${voiceName}">`,
        '    <prosody rate="-4%">',
        `      ${escapeXml(script)}`,
        '    </prosody>',
        '  </voice>',
        '</speak>'
    ].join('\n');
}
export class AzureSpeechClient {
    config = loadConfig();
    isConfigured() {
        return Boolean(this.config.azureSpeechKey && this.config.azureSpeechRegion);
    }
    async synthesizeMp3(script) {
        const key = this.config.azureSpeechKey;
        const region = this.config.azureSpeechRegion;
        const voice = this.config.azureSpeechVoice;
        if (!key || !region) {
            return null;
        }
        const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': key,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
                'User-Agent': 'nura-ai-news-anchor'
            },
            body: buildSsml(script, voice)
        });
        if (!response.ok) {
            throw new Error(`Azure Speech request failed: ${response.status}`);
        }
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        fs.mkdirSync(generatedAssetsDir, { recursive: true });
        const filename = `${Date.now()}-${randomUUID()}.mp3`;
        const filePath = path.resolve(generatedAssetsDir, filename);
        fs.writeFileSync(filePath, audioBuffer);
        return `/assets/generated/${filename}`;
    }
}
