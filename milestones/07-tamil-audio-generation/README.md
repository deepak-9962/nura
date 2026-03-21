# Milestone 7: Tamil Audio Generation

## What it does
Converts generated script into natural Tamil speech audio.

## Primary project areas
- apps/backend/src/modules/tts/tts.service.ts
- apps/backend/src/clients/azureSpeech.client.ts
- apps/backend/public/assets/generated

## Expected output
- audio artifact URL for each cycle
- word timestamp data for lip sync
- fallback audio generation path when cloud TTS is unavailable
