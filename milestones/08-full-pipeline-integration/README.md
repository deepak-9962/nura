# Milestone 8: Full Pipeline Integration

## What it does
Combines ingestion, dedup, ranking, script, audio, viseme, and frontend playback into one continuous broadcast flow.

## Primary project areas
- apps/backend/src/modules/broadcast/broadcast.orchestrator.ts
- apps/backend/src/routes/broadcast.routes.ts
- apps/backend/src/scheduler/broadcast.scheduler.ts
- apps/web/src/App.tsx
- apps/web/src/components/AvatarPlayer.tsx

## Expected output
- Trigger Cycle produces complete end-to-end broadcast payload
- continuous scheduled updates
- synced UI (top stories, subtitles, audio, mouth animation)
