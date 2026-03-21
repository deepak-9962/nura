# Milestone 6: Tamil Script Generation

## What it does
Generates natural Tamil broadcast script from ranked stories.

## Primary project areas
- apps/backend/src/modules/scriptGen/scriptGen.service.ts
- apps/backend/src/modules/scriptGen/tamilQuality.guard.ts
- apps/backend/src/clients/azureOpenAi.client.ts

## Expected output
- Tamil script and subtitle lines generated from top events
- quality checks and retry path
- fallback script that still reflects ranked headlines
