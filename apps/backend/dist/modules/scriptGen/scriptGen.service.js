import { AzureOpenAiClient } from '../../clients/azureOpenAi.client.js';
import { loadConfig } from '../../config.js';
import { logger } from '../../utils/logger.js';
import { evaluateTamilScriptQuality } from './tamilQuality.guard.js';
export class ScriptGenService {
    config = loadConfig();
    azureOpenAi = new AzureOpenAiClient();
    async generateTamilScript(events) {
        const intro = 'Hello! Welcome to Nura AI Live News. வணக்கம். இது நூரா ஏஐ நேரலை செய்தி ஒளிபரப்பு.';
        const outro = 'That concludes our top stories. இதுவரை முக்கிய செய்திகள். மீண்டும் சந்திப்போம். நன்றி.';
        const storyLines = events.map((event, index) => {
            const order = index + 1;
            return this.toBilingualFallbackLine(event, order);
        });
        const fallbackScript = [intro, ...storyLines, outro].join(' ');
        if (this.config.demoMode) {
            return {
                script: fallbackScript,
                subtitles: [intro, ...storyLines, outro],
                meta: {
                    generationPath: 'fallback',
                    retries: 0,
                    qualityViolations: 0
                }
            };
        }
        try {
            const generated = await this.azureOpenAi.generateTamilScript(events);
            if (generated) {
                const quality = evaluateTamilScriptQuality(generated);
                if (quality.ok) {
                    return {
                        script: generated,
                        subtitles: this.toSubtitles(generated),
                        meta: {
                            generationPath: 'azure-normal',
                            retries: 0,
                            qualityViolations: 0
                        }
                    };
                }
                logger.warn('Tamil quality guard rejected generated script; retrying strict pass', {
                    violations: quality.violations.slice(0, 3)
                });
                const strictGenerated = await this.azureOpenAi.generateTamilScript(events, {
                    strictTamil: true
                });
                if (strictGenerated) {
                    const strictQuality = evaluateTamilScriptQuality(strictGenerated);
                    if (strictQuality.ok) {
                        return {
                            script: strictGenerated,
                            subtitles: this.toSubtitles(strictGenerated),
                            meta: {
                                generationPath: 'azure-strict-retry',
                                retries: 1,
                                qualityViolations: quality.violations.length
                            }
                        };
                    }
                    logger.warn('Strict Tamil retry still failed quality check; using fallback', {
                        violations: strictQuality.violations.slice(0, 3)
                    });
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown script generation error';
            logger.warn('Azure OpenAI generation failed, using fallback script', { message });
        }
        const script = fallbackScript;
        return {
            script,
            subtitles: [intro, ...storyLines, outro],
            meta: {
                generationPath: 'fallback',
                retries: 1,
                qualityViolations: 1
            }
        };
    }
    toBilingualFallbackLine(event, order) {
        const categoryLabel = this.toTamilCategory(event.category);
        const enCategory = event.category.toLowerCase();
        const breakingLineTa = event.isBreaking
            ? 'இது உடனடி கவனத்திற்கு உரிய முக்கிய செய்தி.'
            : 'இதற்கான மேலும் தகவல்கள் தொடர்ந்து வரவிருக்கின்றன.';
        const breakingLineEn = event.isBreaking
            ? 'This is a major breaking update.'
            : 'More details will follow shortly.';
        return `Story ${order} is regarding ${enCategory}. செய்தி ${order}. ${categoryLabel} தொடர்பான முக்கிய நிலவரம் தற்போது வெளியாகியுள்ளது. ${breakingLineEn} ${breakingLineTa}`;
    }
    toTamilCategory(category) {
        const labels = {
            POLITICS: 'அரசியல்',
            BUSINESS: 'வணிகம்',
            TECH: 'தொழில்நுட்பம்',
            SPORTS: 'விளையாட்டு',
            HEALTH: 'சுகாதாரம்',
            WORLD: 'உலக',
            LOCAL: 'உள்ளூர்'
        };
        return labels[category];
    }
    toSubtitles(script) {
        const lines = script
            .split(/\.|\?|!/)
            .map((line) => line.trim())
            .filter(Boolean);
        return lines.length > 0 ? lines : [script];
    }
}
