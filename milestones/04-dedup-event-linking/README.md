# Milestone 4: De-duplication and Event Linking

## What it does
Removes duplicates and clusters related stories into unified events.

## Primary project areas
- apps/backend/src/modules/dedup/dedup.service.ts
- apps/backend/src/modules/dedup/dedup.service.test.ts
- apps/backend/src/modules/broadcast/broadcast.orchestrator.ts
- apps/backend/src/repositories/event.repository.ts

## Expected output
- duplicated articles merged into event groups
- cleaner event stream for ranking and script generation
- event versioning updates over repeated cycles
