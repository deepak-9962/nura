# Milestone 3: Live News Ingestion

## What it does
Fetches latest news from web/internet sources and normalizes article data.

## Primary project areas
- apps/backend/src/modules/ingestion/ingestion.service.ts
- apps/backend/src/modules/ingestion/adapters/rss.adapter.ts
- apps/backend/src/modules/ingestion/adapters/newsApi.adapter.ts
- apps/backend/src/config/sourceRegistry.ts
- apps/backend/src/config.ts

## Expected output
- latest articles from configured RSS/API sources
- reliability/source metadata in article records
- live-news-only behavior available by config
