# M5 - Human-like Lip Sync and Stability

## Objective
Improve realism and runtime robustness for lip sync in the web avatar.

## Scope
- Phoneme-aware viseme mapping refinements
- Frontend viseme playback integration by audio timeline
- Fallback mouth movement when viseme timeline gaps/end
- Audio graph stability (`createMediaElementSource` reuse)

## Key Areas
- `apps/web/src/components/AvatarPlayer.tsx`
- `apps/backend/src/modules/lipSync/viseme.service.ts`
- `apps/backend/src/modules/lipSync/viseme.service.test.ts`
- `apps/backend/src/modules/broadcast/broadcast.orchestrator.ts`

## Status
Completed

## Verification
- Backend viseme tests passing
- Web build passing
