import type { Review } from './types.ts'

export type SortKey = 'newest' | 'oldest' | 'lowest' | 'highest' | 'thumbs'

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'newest', label: 'En yeni' },
  { id: 'oldest', label: 'En eski' },
  { id: 'lowest', label: 'En düşük yıldız' },
  { id: 'highest', label: 'En yüksek yıldız' },
  { id: 'thumbs', label: 'En çok beğeni' },
]

export function sortReviews(reviews: Review[], sort: SortKey): Review[] {
  return [...reviews].sort((a, b) => {
    if (sort === 'oldest') return a.createdAtMs - b.createdAtMs
    if (sort === 'lowest') return a.rating - b.rating || b.createdAtMs - a.createdAtMs
    if (sort === 'highest') return b.rating - a.rating || b.createdAtMs - a.createdAtMs
    if (sort === 'thumbs') return b.thumbsUp - a.thumbsUp || b.createdAtMs - a.createdAtMs
    return b.createdAtMs - a.createdAtMs
  })
}

function cell(value: string | number): string {
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function reviewsToCsv(reviews: Review[]): string {
  const header = [
    'uygulama',
    'mağaza',
    'yıldız',
    'tarih',
    'sürüm',
    'ülke',
    'dil',
    'yazar',
    'başlık',
    'metin',
    'beğeni',
    'geliştirici cevabı',
  ]
  const lines = reviews.map((review) =>
    [
      review.appName,
      review.storeLabel,
      review.rating,
      review.createdAt,
      review.version,
      review.country,
      review.language,
      review.author,
      review.title,
      review.text,
      review.thumbsUp,
      review.replyText,
    ]
      .map(cell)
      .join(','),
  )

  return `\uFEFF${header.join(',')}\n${lines.join('\n')}`
}

export function downloadReviewsCsv(reviews: Review[]): void {
  const blob = new Blob([reviewsToCsv(reviews)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'magaza-yorumlari.csv'
  link.click()
  URL.revokeObjectURL(url)
}