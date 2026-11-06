import { excerpt, formatCount, formatPercent } from '../lib/format.ts'
import { THEMES, themeStats } from '../lib/themes.ts'
import type { Review } from '../lib/types.ts'
import { Stars } from './Stars.tsx'

type ThemesProps = {
  reviews: Review[]
  activeThemeId: string
  onSelectTheme: (themeId: string) => void
}

export function Themes({ reviews, activeThemeId, onSelectTheme }: ThemesProps) {
  const cards = THEMES.map((theme) => ({
    theme,
    stat: themeStats(reviews, theme.id),
  })).sort((a, b) => b.stat.count - a.stat.count || a.theme.label.localeCompare(b.theme.label, 'tr'))

  return (
    <div className="stack">
      <p className="hint theme-intro">
        Bir yorum birden fazla temaya girebilir. Sözlükte olmayan şikayetler özet sekmesindeki kelime listesindedir.
      </p>
      <div className="theme-grid">
        {cards.map(({ theme, stat }) => {
          const active = theme.id === activeThemeId
          const lowShare = stat.count === 0 ? 0 : stat.lowCount / stat.count
          return (
            <article key={theme.id} className={active ? 'panel theme-card is-active' : 'panel theme-card'}>
              <header className="theme-head">
                <h2>{theme.label}</h2>
                <p className="metric-value metric-value-small">{formatCount(stat.count)}</p>
              </header>
              <p className="keywords">{theme.keywords.map((keyword) => keyword.text).join(' · ')}</p>
              <p className="metric-note">
                {stat.count === 0
                  ? 'Eşleşme yok'
                  : `${formatPercent(lowShare)} kadarı 1–2 yıldız (${formatCount(stat.lowCount)})`}
              </p>
              {stat.count > 0 && (
                <div className="mix" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <span
                      key={rating}
                      className={`mix-part tone-${rating}`}
                      style={{ width: `${((stat.ratings[rating] ?? 0) / stat.count) * 100}%` }}
                    />
                  ))}
                </div>
              )}
              {stat.topVersions.length > 0 && (
                <p className="hint">
                  Sürümler:{' '}
                  {stat.topVersions
                    .map((row) => `${row.version} (${formatCount(row.count)})`)
                    .join(', ')}
                </p>
              )}
              <ul className="quotes">
                {stat.samples.map((review) => (
                  <li key={review.id}>
                    <Stars rating={review.rating} />
                    <p>{excerpt(review.text || review.title)}</p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="chip"
                aria-pressed={active}
                disabled={stat.count === 0}
                onClick={() => onSelectTheme(theme.id)}
              >
                {active ? 'Temayı kaldır' : 'Yorumları aç'}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}