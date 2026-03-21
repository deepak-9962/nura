import { loadConfig } from '../config.js';
function buildPrompt(events, options) {
    const bulletLines = events.map((event, index) => {
        const n = index + 1;
        return `${n}. Headline: ${event.headline}\nSummary: ${event.summary}\nCategory: ${event.category}\nReliability: ${event.avgReliability}`;
    });
    const strictLines = options.strictTamil
        ? [
            '- Hard rule: rewrite every sentence in Tamil script except proper nouns.',
            '- If any line contains many English words, rewrite that line fully in Tamil.',
            '- Prefer Tamil equivalents for terms like government, election, policy, technology, market.'
        ]
        : [];
    return [
        'Generate a Tamil live-news anchor script.',
        'Constraints:',
        '- Rewrite all content fully in Tamil language only.',
        '- Do not use English words, except proper nouns (person/place names).',
        '- Use naturally spoken Tamil suitable for a news anchor.',
        '- Do not produce translated literal Tamil; keep it fluent and conversational.',
        '- Keep script between 140 and 220 Tamil words.',
        '- Include intro and outro lines.',
        '- Use natural spoken Tamil; avoid markdown or numbering.',
        '- Mention that facts are based on available source reports.',
        ...strictLines,
        '- Return plain text only.',
        '',
        'News events:',
        ...bulletLines
    ].join('\n');
}
export class AzureOpenAiClient {
    config = loadConfig();
    async generateTamilScript(events, options = {}) {
        const endpoint = this.config.azureOpenAiEndpoint;
        const apiKey = this.config.azureOpenAiApiKey;
        const deployment = this.config.azureOpenAiDeployment;
        const apiVersion = this.config.azureOpenAiApiVersion;
        if (!endpoint || !apiKey || !deployment) {
            return null;
        }
        const url = new URL(`${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions`);
        url.searchParams.set('api-version', apiVersion);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                temperature: options.strictTamil ? 0.15 : 0.3,
                max_tokens: 700,
                messages: [
                    {
                        role: 'system',
                        content: [
                            'You are a Tamil TV news anchor script writer.',
                            'Rewrite ALL content fully in Tamil language only.',
                            'Do NOT include any English words except proper nouns (names of people/places).',
                            'Write naturally as spoken Tamil, not translated text.',
                            options.strictTamil ? 'This is a strict correction pass. Remove English-heavy phrasing.' : '',
                            'Return plain text only.'
                        ]
                            .filter(Boolean)
                            .join(' ')
                    },
                    {
                        role: 'user',
                        content: buildPrompt(events, options)
                    }
                ]
            })
        });
        if (!response.ok) {
            throw new Error(`Azure OpenAI request failed: ${response.status}`);
        }
        const payload = (await response.json());
        const content = payload.choices?.[0]?.message?.content?.trim() ?? '';
        return content || null;
    }
}
