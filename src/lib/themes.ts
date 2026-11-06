import type { Review } from './types.ts'

type Keyword = {
  text: string
  ascii?: string
  mode: 'stem' | 'word'
}

export type ThemeDefinition = {
  id: string
  label: string
  keywords: Keyword[]
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'giris',
    label: 'Giriş ve QR',
    keywords: [
      { text: 'giriş', ascii: 'giris', mode: 'stem' },
      { text: 'giremi', ascii: 'giremi', mode: 'stem' },
      { text: 'qr', mode: 'word' },
      { text: 'bilet', mode: 'stem' },
      { text: 'turnike', mode: 'stem' },
      { text: 'okut', mode: 'stem' },
      { text: 'kapı', ascii: 'kapi', mode: 'stem' },
    ],
  },
  {
    id: 'uyelik',
    label: 'Üyelik ve hesap',
    keywords: [
      { text: 'üyelik', ascii: 'uyelik', mode: 'stem' },
      { text: 'kayıt', ascii: 'kayit', mode: 'stem' },
      { text: 'üye', ascii: 'uye', mode: 'word' },
      { text: 'şifre', ascii: 'sifre', mode: 'stem' },
      { text: 'tc', mode: 'word' },
      { text: 'kimlik', mode: 'stem' },
      { text: 'otp', mode: 'word' },
      { text: 'doğrulama', ascii: 'dogrulama', mode: 'stem' },
    ],
  },
  {
    id: 'izinler',
    label: 'İzinler',
    keywords: [
      { text: 'izin', mode: 'stem' },
      { text: 'konum', mode: 'stem' },
      { text: 'bildirim', mode: 'stem' },
      { text: 'kamera', mode: 'stem' },
      { text: 'fotoğraf', ascii: 'fotograf', mode: 'stem' },
    ],
  },
  {
    id: 'cokme',
    label: 'Çökme ve hata',
    keywords: [
      { text: 'çök', mode: 'stem' },
      { text: 'hata', mode: 'stem' },
      { text: 'açılm', ascii: 'acilm', mode: 'stem' },
      { text: 'donuyor', ascii: 'donuyor', mode: 'stem' },
      { text: 'çalışm', ascii: 'calism', mode: 'stem' },
      { text: 'crash', mode: 'stem' },
    ],
  },
  {
    id: 'guncelleme',
    label: 'Güncelleme',
    keywords: [
      { text: 'güncelle', ascii: 'guncelle', mode: 'stem' },
      { text: 'sürüm', ascii: 'surum', mode: 'stem' },
      { text: 'update', mode: 'stem' },
    ],
  },
  {
    id: 'hiz',
    label: 'Hız',
    keywords: [
      { text: 'yavaş', ascii: 'yavas', mode: 'stem' },
      { text: 'kasma', mode: 'stem' },
      { text: 'beklet', mode: 'stem' },
    ],
  },
  {
    id: 'icerik',
    label: 'Müze içeriği',
    keywords: [
      { text: 'müze', ascii: 'muze', mode: 'stem' },
      { text: 'eser', mode: 'stem' },
      { text: 'rehber', mode: 'stem' },
      { text: 'sesli', mode: 'stem' },
      { text: 'bilgi', mode: 'stem' },
      { text: 'harita', mode: 'stem' },
    ],
  },
  {
    id: 'dil',
    label: 'Dil',
    keywords: [
      { text: 'dil', mode: 'word' },
      { text: 'ingilizce', mode: 'stem' },
      { text: 'çeviri', ascii: 'ceviri', mode: 'stem' },
      { text: 'language', mode: 'stem' },
    ],
  },
]

const TOKEN = /[a-z0-9çğıöşüı]+/g
const CRASH_ASCII = /(?:^|[^a-z0-9çğıöşüı])cok(?:uyor|tu|du|me|tü|dü)/

function tokens(value: string): string[] {
  return value.match(TOKEN) ?? []
}

function hits(haystack: string, needle: string, mode: Keyword['mode']): boolean {
  if (mode === 'stem') return haystack.includes(needle)
  return tokens(haystack).some(
    (token) => token === needle || (needle.length >= 3 && token.startsWith(needle)),
  )
}

export function matchesTheme(review: Review, themeId: string): boolean {
  const theme = THEMES.find((item) => item.id === themeId)
  if (!theme) return false

  for (const keyword of theme.keywords) {
    if (hits(review.caseText, keyword.text, keyword.mode)) return true
    if (keyword.ascii && hits(review.searchText, keyword.ascii, keyword.mode)) return true
  }

  return themeId === 'cokme' && CRASH_ASCII.test(review.caseText)
}

export type ThemeStat = {
  id: string
  label: string
  count: number
  lowCount: number
  ratings: Record<number, number>
  topVersions: { version: string; count: number }[]
  samples: Review[]
}

export function themeStats(reviews: Review[], themeId: string): ThemeStat {
  const theme = THEMES.find((item) => item.id === themeId)
  const matched = reviews.filter((review) => matchesTheme(review, themeId))
  const low = matched.filter((review) => review.rating <= 2)
  const versions = new Map<string, number>()

  for (const review of matched) {
    versions.set(review.version, (versions.get(review.version) ?? 0) + 1)
  }

  const pool = low.length > 0 ? low : matched
  const samples = [...pool].sort((a, b) => b.text.length - a.text.length).slice(0, 3)
  const ratings: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const review of matched) {
    if (review.rating >= 1 && review.rating <= 5) ratings[review.rating] += 1
  }

  return {
    id: themeId,
    label: theme?.label ?? themeId,
    count: matched.length,
    lowCount: low.length,
    ratings,
    topVersions: [...versions.entries()]
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count || a.version.localeCompare(b.version, 'tr'))
      .slice(0, 3),
    samples,
  }
}