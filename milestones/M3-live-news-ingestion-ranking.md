# M3 - Live News Ingestion and Ranking

## Objective
Fetch latest internet news and rank top stories with category diversity.

## Scope
- RSS ingestion from configured sources
- Optional NewsAPI ingestion when key is configured
- Event deduplication and ranking
- Enforce live-news behavior in production-like runs

## Key Areas
- `apps/backend/src/modules/ingestion/ingestion.service.ts`
- `apps/backend/src/modules/ingestion/adapters/rss.adapter.ts`
- `apps/backend/src/modules/ingestion/adapters/newsApi.adapter.ts`
- `apps/backend/src/modules/ranker/ranker.service.ts`
- `apps/backend/src/config/sourceRegistry.ts`
- `apps/backend/src/config.ts`

## Status
Completed

## Notes
- `LIVE_NEWS_ONLY` can be used to avoid silent seed fallback during live cycles.
