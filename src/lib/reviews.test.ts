import { describe, expect, it } from 'vitest'
import { reviewsToCsv, sortReviews } from './csv.ts'
import { applyFilters, selectRating, type ReviewFilters } from './filters.ts'
import { normalizeExport, type ExportFile } from './normalize.ts'
import {
  averageRating,
  monthlySeries,
  oneStarRate,
  ratingCounts,
  topWords,
  versionStats,
} from './stats.ts'
import { matchesTheme, themeStats } from './themes.ts'

const iosFile: ExportFile = {
  appName: 'Museums of Türkiye - Official',
  exportedAt: '2026-11-06T05:42:02.376Z',
  reviewCount: 2,
  filters: {},
  reviews: [
    {
      id: 'ios-1',
      store: 'app-store',
      rating: 1,
      title: 'İzinler',
      text: 'İzinler açık ama üyelik işlemleri yapılmıyor',
      author: 'Serkan',
      country: 'tr',
      language: '',
      appVersion: '2.0.6',
      createdAt: '2026-10-29T14:46:39-07:00',
      raw: { 'im:rating': '1' },
    },
    {
      id: 'ios-2',
      store: 'app-store',
      rating: 5,
      title: 'Rehber',
      text: 'Sesli rehber ve eser bilgisi çok iyi',
      author: 'Ayse',
      country: 'de',
      language: '',
      appVersion: '',
      createdAt: '2024-03-02T08:00:00Z',
      raw: {},
    },
  ],
}

const androidFile: ExportFile = {
  appName: "MüzeKart: Türkiye'nin Müzeleri",
  exportedAt: '2026-11-06T05:42:38.130Z',
  reviewCount: 2,
  filters: {},
  reviews: [
    {
      id: 'and-1',
      store: 'play-store',
      rating: 1,
      title: '',
      text: 'Uygulama kapıda çöküyor, QR okutmuyor',
      author: 'Megi',
      country: 'tr',
      language: 'tr',
      appVersion: '2.0.4',
      createdAt: '2026-11-02T10:52:14.785Z',
      raw: {
        replyText: 'İlettik, teşekkürler',
        replyDate: '2026-11-03T00:00:00.000Z',
        thumbsUp: 4,
      },
    },
    {
      id: 'and-2',
      store: 'play-store',
      rating: 2,
      title: '',
      text: 'Çok kötü, giriş hiç edilmedi',
      author: 'Ali',
      country: 'nl',
      language: 'en',
      appVersion: null,
      createdAt: '2025-01-15T12:00:00.000Z',
      raw: { replyText: '   ', thumbsUp: 0 },
    },
  ],
}

const reviews = [
  ...normalizeExport(iosFile, 'ios'),
  ...normalizeExport(androidFile, 'android'),
]

const openFilters: ReviewFilters = {
  apps: ['ios', 'android'],
  ratings: [1, 2, 3, 4, 5],
  dateFrom: '',
  dateTo: '',
  version: '',
  country: '',
  language: '',
  query: '',
  hasReply: false,
  themeId: '',
}

describe('normalizeExport', () => {
  it('keeps store, reply, thumbs and labels empty version', () => {
    const [iosPermission, iosGuide] = normalizeExport(iosFile, 'ios')
    const [androidCrash, androidEntry] = normalizeExport(androidFile, 'android')

    expect(iosPermission?.appName).toBe('Museums of Türkiye - Official')
    expect(iosPermission?.storeLabel).toBe('App Store')
    expect(iosPermission?.version).toBe('2.0.6')
    expect(iosPermission?.replyText).toBe('')
    expect(iosGuide?.version).toBe('Sürüm yok')

    expect(androidCrash?.storeLabel).toBe('Play Store')
    expect(androidCrash?.replyText).toBe('İlettik, teşekkürler')
    expect(androidCrash?.thumbsUp).toBe(4)
    expect(androidEntry?.version).toBe('Sürüm yok')
    expect(androidEntry?.replyText).toBe('')
    expect(iosPermission?.id).not.toBe(androidCrash?.id)
  })
})

describe('applyFilters', () => {
  it('filters by app, stars, version, country, language, reply and Turkish search', () => {
    expect(applyFilters(reviews, { ...openFilters, apps: ['ios'] })).toHaveLength(2)
    expect(applyFilters(reviews, { ...openFilters, ratings: [5] }).map((review) => review.id)).toEqual([
      'ios:ios-2',
    ])
    expect(applyFilters(reviews, { ...openFilters, ratings: [] })).toHaveLength(reviews.length)
    expect(selectRating([], 1)).toEqual([1])
    expect(selectRating([1], 3)).toEqual([1, 3])
    expect(selectRating([1, 3], 1)).toEqual([3])
    expect(selectRating([3], 3)).toEqual([])
    expect(applyFilters(reviews, { ...openFilters, version: 'Sürüm yok' })).toHaveLength(2)
    expect(applyFilters(reviews, { ...openFilters, country: 'tr' })).toHaveLength(2)
    expect(applyFilters(reviews, { ...openFilters, language: '__none__' })).toHaveLength(2)
    expect(applyFilters(reviews, { ...openFilters, language: 'en' }).map((review) => review.author)).toEqual([
      'Ali',
    ])
    expect(applyFilters(reviews, { ...openFilters, hasReply: true })).toHaveLength(1)
    expect(applyFilters(reviews, { ...openFilters, query: 'İZİN' }).map((review) => review.title)).toEqual([
      'İzinler',
    ])
    const crashOnly = normalizeExport(
      {
        ...iosFile,
        reviews: [
          { ...iosFile.reviews[0]!, id: 'crash', title: '', text: 'Uygulama çöküyor' },
          { ...iosFile.reviews[0]!, id: 'praise', title: '', text: 'Çok güzel bir deneyim' },
        ],
      },
      'ios',
    )
    expect(applyFilters(crashOnly, { ...openFilters, query: 'çök' }).map((review) => review.text)).toEqual([
      'Uygulama çöküyor',
    ])
    expect(
      applyFilters(reviews, { ...openFilters, dateFrom: '2026-10-01', dateTo: '2026-10-31' }),
    ).toHaveLength(1)
  })
})

describe('themes', () => {
  it('matches stems without treating çok as a crash and without matching dil inside edildi', () => {
    const byAuthor = Object.fromEntries(reviews.map((review) => [review.author, review]))

    expect(matchesTheme(byAuthor.Megi!, 'cokme')).toBe(true)
    expect(matchesTheme(byAuthor.Megi!, 'giris')).toBe(true)
    expect(matchesTheme(byAuthor.Ali!, 'cokme')).toBe(false)
    expect(matchesTheme(byAuthor.Ali!, 'giris')).toBe(true)
    expect(matchesTheme(byAuthor.Serkan!, 'izinler')).toBe(true)
    expect(matchesTheme(byAuthor.Serkan!, 'uyelik')).toBe(true)
    expect(matchesTheme(byAuthor.Ayse!, 'icerik')).toBe(true)

    const falseDil = normalizeExport(
      {
        ...iosFile,
        reviews: [
          {
            ...iosFile.reviews[0]!,
            id: 'dil',
            title: '',
            text: 'İşlem edildi ama sonuç yok',
          },
        ],
      },
      'ios',
    )[0]!
    expect(matchesTheme(falseDil, 'dil')).toBe(false)

    const realDil = normalizeExport(
      {
        ...iosFile,
        reviews: [
          {
            ...iosFile.reviews[0]!,
            id: 'dil2',
            title: '',
            text: 'Dil seçeneği yok',
          },
        ],
      },
      'ios',
    )[0]!
    expect(matchesTheme(realDil, 'dil')).toBe(true)
  })

  it('counts low ratings, top versions and sample quotes', () => {
    const stats = themeStats(reviews, 'giris')
    expect(stats.count).toBe(2)
    expect(stats.lowCount).toBe(2)
    expect(stats.topVersions.map((row) => row.version).sort()).toEqual(['2.0.4', 'Sürüm yok'])
    expect(stats.samples.length).toBeGreaterThan(0)
    expect(stats.samples.length).toBeLessThanOrEqual(3)
  })
})

describe('stats', () => {
  it('summarizes ratings, months, versions and distinctive words', () => {
    expect(averageRating(reviews)).toBe(2.3)
    expect(oneStarRate(reviews)).toBe(0.5)
    expect(ratingCounts(reviews)).toEqual({ 1: 2, 2: 1, 3: 0, 4: 0, 5: 1 })

    const months = monthlySeries(reviews)
    expect(months.map((month) => month.month)).toEqual(['2024-03', '2025-01', '2026-10', '2026-11'])
    expect(months[0]?.count).toBe(1)
    expect(months[0]?.average).toBe(5)

    const versions = versionStats(reviews)
    expect(versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ appId: 'ios', version: 'Sürüm yok', count: 1, average: 5, oneStarRate: 0 }),
        expect.objectContaining({
          appId: 'android',
          version: 'Sürüm yok',
          count: 1,
          average: 2,
          oneStarRate: 0,
        }),
        expect.objectContaining({ appId: 'ios', version: '2.0.6', count: 1, oneStarRate: 1 }),
      ]),
    )

    const words = topWords(
      reviews.filter((review) => review.rating <= 2),
      8,
    )
    expect(words.map((entry) => entry.word)).toContain('izinler')
    expect(words.map((entry) => entry.word)).not.toContain('cok')
  })
})

describe('csv and sort', () => {
  it('sorts by rating and writes an escaped spreadsheet file', () => {
    const lowest = sortReviews(reviews, 'lowest')
    expect(lowest[0]?.rating).toBe(1)
    expect(lowest.at(-1)?.rating).toBe(5)

    const thumbs = sortReviews(reviews, 'thumbs')
    expect(thumbs[0]?.author).toBe('Megi')

    const csv = reviewsToCsv([
      {
        ...reviews[0]!,
        title: 'Satır "bir"',
        text: 'ilk\nikinci',
      },
    ])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('"Satır ""bir"""')
    expect(csv).toContain('"ilk\nikinci"')
  })
})
