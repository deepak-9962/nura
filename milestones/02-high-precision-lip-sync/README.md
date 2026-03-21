# Milestone 2: High-Precision Lip Sync

## What it does
Improves lip sync quality to phoneme/viseme-level mouth-shape accuracy.

## Primary project areas
- apps/backend/src/modules/lipSync/viseme.service.ts
- apps/backend/src/modules/lipSync/viseme.service.test.ts
- apps/web/src/components/AvatarPlayer.tsx
- packages/types/index.ts

## Expected output
- viseme timeline generated from word timing
- mouth shapes driven by viseme IDs instead of only amplitude
- smoother and more human-like transitions
