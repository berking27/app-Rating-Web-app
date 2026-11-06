import { foldTr } from './text.ts'
import type { AppId, Review } from './types.ts'

const STOP = new Set(
  [
    've', 'veya', 'ile', 'için', 'ama', 'fakat', 'ancak', 'ki', 'da', 'de', 'den', 'dan',
    'bir', 'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar', 'mi', 'mı', 'mu', 'mü',
    'ne', 'nasıl', 'niye', 'niçin', 'neden', 'gibi', 'kadar', 'daha', 'en', 'çok', 'az',
    'var', 'yok', 'olan', 'olarak', 'diye', 'sonra', 'önce', 'hem', 'her', 'hiç', 'değil',
    'bence', 'göre', 'üzere', 'ise', 'ya', 'evet', 'hayır', 'lütfen', 'teşekkür',
    'teşekkürler', 'merhaba', 'selam', 'şey', 'çok', 'app', 'uygulama', 'uygulamayı',
    'uygulamanın', 'uygulamada', 'uygulamadan', 'the', 'and', 'for', 'you', 'this', 'that',
    'with', 'from', 'have', 'was', 'are', 'not', 'but', 'its', 'can', 'just', 'very',
    'para', 'que', 'los', 'las', 'con', 'una', 'del', 'por', 'muy', 'esta', 'este',
    'veriyor', 'diyor', 'ediyor', 'oluyor', 'ederim', 'olmuş', 'oldu', 'olsun',
    'böyle', 'zaten', 'sadece', 'artık', 'içinde', 'üzerinden', 'yoktu', 'yoktur',
  ].map((word) => foldTr(word)),
)

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  return Math.round(average * 10) / 10
}

export function oneStarRate(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  return reviews.filter((review) => review.rating === 1).length / reviews.length
}

export function ratingCounts(reviews: Review[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const review of reviews) {
    if (review.rating >= 1 && review.rating <= 5) counts[review.rating] += 1
  }
  return counts
}

export function monthlySeries(
  reviews: Review[],
): { month: string; count: number; average: number }[] {
  const buckets = new Map<string, { count: number; sum: number }>()

  for (const review of reviews) {
    if (!review.day) continue
    const month = review.day.slice(0, 7)
    const bucket = buckets.get(month) ?? { count: 0, sum: 0 }
    bucket.count += 1
    bucket.sum += review.rating
    buckets.set(month, bucket)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month,
      count: bucket.count,
      average: Math.round((bucket.sum / bucket.count) * 10) / 10,
    }))
}

export type VersionRow = {
  appId: AppId
  version: string
  count: number
  average: number
  oneStarRate: number
}

export function versionStats(reviews: Review[]): VersionRow[] {
  const rows = new Map<string, { appId: AppId; version: string; count: number; sum: number; oneStars: number }>()

  for (const review of reviews) {
    const key = `${review.appId}:${review.version}`
    const row = rows.get(key) ?? {
      appId: review.appId,
      version: review.version,
      count: 0,
      sum: 0,
      oneStars: 0,
    }
    row.count += 1
    row.sum += review.rating
    if (review.rating === 1) row.oneStars += 1
    rows.set(key, row)
  }

  return [...rows.values()]
    .map((row) => ({
      appId: row.appId,
      version: row.version,
      count: row.count,
      average: Math.round((row.sum / row.count) * 10) / 10,
      oneStarRate: row.oneStars / row.count,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.appId.localeCompare(b.appId) ||
        a.version.localeCompare(b.version, 'tr'),
    )
}

export function topWords(reviews: Review[], limit: number): { word: string; count: number }[] {
  const counts = new Map<string, { count: number; labels: Map<string, number> }>()

  for (const review of reviews) {
    const seen = new Set<string>()
    for (const token of review.caseText.match(/[a-z0-9çğıöşüı]+/g) ?? []) {
      const key = foldTr(token)
      if (key.length < 3 || STOP.has(key) || seen.has(key)) continue
      seen.add(key)
      const bucket = counts.get(key) ?? { count: 0, labels: new Map<string, number>() }
      bucket.count += 1
      bucket.labels.set(token, (bucket.labels.get(token) ?? 0) + 1)
      counts.set(key, bucket)
    }
  }

  return [...counts.values()]
    .map((bucket) => ({
      word: [...bucket.labels.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'),
      )[0]![0],
      count: bucket.count,
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'tr'))
    .slice(0, limit)
}