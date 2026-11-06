import { casefold, foldTr } from './text.ts'
import type { AppId, Review } from './types.ts'

export const MISSING_VERSION = 'Sürüm yok'

export type RawReview = {
  id: string
  store?: string | null
  rating: number
  title?: string | null
  text?: string | null
  author?: string | null
  country?: string | null
  language?: string | null
  appVersion?: string | null
  createdAt: string
  raw?: Record<string, unknown> | null
}

function rawString(raw: Record<string, unknown> | null | undefined, key: string): string {
  const value = raw?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

export type ExportFile = {
  appName: string
  exportedAt: string
  reviewCount?: number
  filters?: unknown
  reviews: RawReview[]
}

function clean(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function normalizeExport(file: ExportFile, appId: AppId): Review[] {
  return file.reviews.map((review) => {
    const title = clean(review.title)
    const text = clean(review.text)
    const created = new Date(review.createdAt)
    const createdAtMs = Number.isNaN(created.getTime()) ? 0 : created.getTime()
    const combined = `${title} ${text}`.trim()
    const thumbsValue = review.raw?.thumbsUp
    const thumbs = typeof thumbsValue === 'number' && Number.isFinite(thumbsValue) ? thumbsValue : 0

    return {
      id: `${appId}:${review.id}`,
      appId,
      appName: file.appName,
      storeLabel: review.store === 'play-store' ? 'Play Store' : 'App Store',
      rating: review.rating,
      title,
      text,
      author: clean(review.author) || 'Anonim',
      country: clean(review.country).toLocaleLowerCase('tr-TR'),
      language: clean(review.language).toLocaleLowerCase('tr-TR'),
      version: clean(review.appVersion) || MISSING_VERSION,
      createdAt: review.createdAt,
      createdAtMs,
      day: createdAtMs ? created.toISOString().slice(0, 10) : '',
      replyText: rawString(review.raw, 'replyText'),
      replyDate: rawString(review.raw, 'replyDate'),
      thumbsUp: thumbs,
      caseText: casefold(combined),
      searchText: foldTr(combined),
    }
  })
}