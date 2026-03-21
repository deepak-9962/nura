# M4 - Script, Audio, and Viseme Pipeline

## Objective
Generate script/audio from ranked events and emit viseme timeline for lip sync.

## Scope
- Script generation from ranked `top5` stories
- Audio synthesis and word timestamps
- Viseme frame generation from timestamps
- Broadcast payload persistence and API return

## Key Areas
- `apps/backend/src/modules/scriptGen/scriptGen.service.ts`
- `apps/backend/src/modules/tts/tts.service.ts`
- `apps/backend/src/modules/lipSync/viseme.service.ts`
- `apps/backend/src/modules/broadcast/broadcast.orchestrator.ts`
- `packages/types/index.ts`

## Status
Completed
