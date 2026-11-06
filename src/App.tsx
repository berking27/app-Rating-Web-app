import { useEffect, useMemo, useState } from 'react'
import { Filters } from './components/Filters.tsx'
import { Overview } from './components/Overview.tsx'
import { ReviewList } from './components/ReviewList.tsx'
import { Themes } from './components/Themes.tsx'
import { sortReviews, type SortKey } from './lib/csv.ts'
import { applyFilters, defaultFilters, type ReviewFilters } from './lib/filters.ts'
import { formatCount, formatDay } from './lib/format.ts'
import { loadReviews } from './lib/load.ts'
import type { AppId, Review } from './lib/types.ts'

type Tab = 'overview' | 'themes' | 'reviews'
type WordBand = 'low' | 'high'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Özet' },
  { id: 'themes', label: 'Temalar' },
  { id: 'reviews', label: 'Yorumlar' },
]

export default function App() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [exportedAt, setExportedAt] = useState<Record<AppId, string>>({ ios: '', android: '' })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters)
  const [tab, setTab] = useState<Tab>('overview')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    loadReviews()
      .then((loaded) => {
        if (cancelled) return
        setReviews(loaded.reviews)
        setExportedAt(loaded.exportedAt)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setMessage(error instanceof Error ? error.message : 'Yorumlar yüklenemedi')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => applyFilters(reviews, filters), [reviews, filters])
  const themeBase = useMemo(
    () => applyFilters(reviews, { ...filters, themeId: '' }),
    [reviews, filters],
  )
  const sorted = useMemo(() => sortReviews(filtered, sort), [filtered, sort])

  function changeFilters(next: ReviewFilters) {
    setFilters(next)
    setPage(1)
  }

  function inspectWord(word: string, band: WordBand) {
    changeFilters({
      ...filters,
      query: word,
      themeId: '',
      ratings: band === 'low' ? [1, 2] : [4, 5],
    })
    setTab('reviews')
  }

  function selectTheme(themeId: string) {
    if (filters.themeId === themeId) {
      changeFilters({ ...filters, themeId: '' })
      return
    }
    changeFilters({ ...filters, themeId })
    setTab('reviews')
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <p className="eyebrow light">MüzeKart · Museums of Türkiye</p>
          <h1>Mağaza yorumları</h1>
          <p className="lede">
            App Store ve Play Store dışa aktarmaları tarayıcıda filtrelenir.
            {status === 'ready' && (
              <>
                {' '}
                App Store {formatDay(exportedAt.ios)} · Play Store {formatDay(exportedAt.android)} ·{' '}
                {formatCount(reviews.length)} yorum yüklendi.
              </>
            )}
          </p>
        </div>
      </header>
      <main className="wrap main">
        {status === 'loading' && <p className="panel empty">Yorumlar yükleniyor…</p>}
        {status === 'error' && <p className="panel empty">{message}</p>}
        {status === 'ready' && (
          <>
            <Filters
              reviews={reviews}
              filters={filters}
              resultCount={filtered.length}
              onChange={changeFilters}
            />
            <div className="tabs" role="tablist" aria-label="Görünüm">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={tab === item.id}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
            >
              {tab === 'overview' && (
                <Overview reviews={filtered} apps={filters.apps} onInspectWord={inspectWord} />
              )}
              {tab === 'themes' && (
                <Themes
                  reviews={themeBase}
                  activeThemeId={filters.themeId}
                  onSelectTheme={selectTheme}
                />
              )}
              {tab === 'reviews' && (
                <ReviewList
                  reviews={sorted}
                  sort={sort}
                  page={page}
                  onSort={(next) => {
                    setSort(next)
                    setPage(1)
                  }}
                  onPage={setPage}
                />
              )}
            </div>
          </>
        )}
      </main>
    </>
  )
}