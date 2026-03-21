import { createHash } from 'node:crypto'
import Parser from 'rss-parser'
import type { ArticleSchema, Category } from '../../../types.js'
import { CATEGORY_KEYWORDS, type SourceProfile } from '../../../config/sourceRegistry.js'

type RssFeed = {
  title?: string
  link?: string
  items?: RssItem[]
}

type RssItem = {
  title?: string
  content?: string
  contentSnippet?: string
  link?: string
  isoDate?: string
  pubDate?: string
}

const parser = new Parser<Record<string, never>, RssItem>()

function classifyCategory(title: string, body: string): Category {
  const text = `${title} ${body}`.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<[Category, string[]]>) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category
    }
  }
  return 'WORLD'
}

function makeArticleId(articleUrl: string, publishedAt: string): string {
  return createHash('sha1').update(`${articleUrl}|${publishedAt}`).digest('hex')
}

function clampBody(text: string): string {
  if (text.length <= 2000) {
    return text
  }
  return `${text.slice(0, 1997)}...`
}

export class RssAdapter {
  async fetch(feedUrl: string, profile: SourceProfile): Promise<ArticleSchema[]> {
    const feed = (await parser.parseURL(feedUrl)) as RssFeed
    const now = new Date().toISOString()

    const articles: ArticleSchema[] = []
    for (const item of feed.items ?? []) {
      const title = item.title?.trim() ?? ''
      if (!title) {
        continue
      }

      const body = clampBody((item.contentSnippet ?? item.content ?? '').trim())
      const articleUrl = item.link?.trim() ?? feed.link ?? profile.sourceUrl
      const publishedAt = item.isoDate ?? item.pubDate ?? now

      articles.push({
        id: makeArticleId(articleUrl, publishedAt),
        title,
        body,
        source: profile.source,
        sourceUrl: profile.sourceUrl,
        articleUrl,
        publishedAt,
        fetchedAt: now,
        category: classifyCategory(title, body),
        reliabilityScore: profile.reliabilityScore,
        language: profile.defaultLanguage,
        conflictFlag: false
      })
    }

    return articles
  }
}
