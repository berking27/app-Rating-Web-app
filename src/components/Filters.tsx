import { defaultFilters, selectRating, type ReviewFilters } from '../lib/filters.ts'
import { compareVersions, formatCount } from '../lib/format.ts'
import { THEMES } from '../lib/themes.ts'
import { APP_CHOICE, APP_ORDER, type AppId, type Review } from '../lib/types.ts'

type FiltersProps = {
  reviews: Review[]
  filters: ReviewFilters
  resultCount: number
  onChange: (filters: ReviewFilters) => void
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'))
}

export function Filters({ reviews, filters, resultCount, onChange }: FiltersProps) {
  const versions = unique(reviews.map((review) => review.version)).sort(compareVersions)
  const countries = unique(reviews.map((review) => review.country))
  const languages = unique(reviews.map((review) => review.language))
  const hasUnspecifiedLanguage = reviews.some((review) => !review.language)
  const activeTheme = THEMES.find((theme) => theme.id === filters.themeId)

  function toggleApp(appId: AppId) {
    const selected = new Set(filters.apps)
    if (selected.has(appId)) selected.delete(appId)
    else selected.add(appId)
    onChange({ ...filters, apps: APP_ORDER.filter((candidate) => selected.has(candidate)) })
  }

  function chooseRating(rating: number) {
    onChange({ ...filters, ratings: selectRating(filters.ratings, rating) })
  }

  return (
    <section className="filters" aria-label="Filtreler">
      <div className="filter-row">
        <fieldset>
          <legend>Uygulama</legend>
          <div className="chip-row">
            {APP_ORDER.map((appId) => (
              <button
                key={appId}
                type="button"
                className="chip"
                aria-pressed={filters.apps.includes(appId)}
                onClick={() => toggleApp(appId)}
              >
                {APP_CHOICE[appId]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Yıldız</legend>
          <div className="chip-row">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                className="chip star-chip"
                aria-pressed={filters.ratings.includes(rating)}
                onClick={() => chooseRating(rating)}
              >
                {rating} ★
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="filter-grid">
        <label className="search-field">
          Arama
          <input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Başlık veya yorum metni"
          />
        </label>
        <label>
          Başlangıç
          <input
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
          />
        </label>
        <label>
          Bitiş
          <input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
          />
        </label>
        <label>
          Sürüm
          <select
            value={filters.version}
            onChange={(event) => onChange({ ...filters, version: event.target.value })}
          >
            <option value="">Tüm sürümler</option>
            {versions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ülke
          <select
            value={filters.country}
            onChange={(event) => onChange({ ...filters, country: event.target.value })}
          >
            <option value="">Tüm ülkeler</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country.toLocaleUpperCase('tr-TR')}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dil
          <select
            value={filters.language}
            onChange={(event) => onChange({ ...filters, language: event.target.value })}
          >
            <option value="">Tüm diller</option>
            {hasUnspecifiedLanguage && <option value="__none__">Belirtilmemiş</option>}
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={filters.hasReply}
            onChange={(event) => onChange({ ...filters, hasReply: event.target.checked })}
          />
          Geliştirici yanıtı olanlar
        </label>
      </div>

      <div className="filter-foot">
        <p>
          <strong>{formatCount(resultCount)}</strong> yorum
          {activeTheme ? ` · tema: ${activeTheme.label}` : ''}
        </p>
        <div className="chip-row">
          {activeTheme && (
            <button
              type="button"
              className="chip"
              aria-pressed="true"
              onClick={() => onChange({ ...filters, themeId: '' })}
            >
              Temayı kaldır
            </button>
          )}
          <button type="button" className="text-button" onClick={() => onChange(defaultFilters)}>
            Filtreleri sıfırla
          </button>
        </div>
      </div>
      <p className="hint">iOS kayıtlarında dil alanı boş. O dosyada ülke filtresi daha güvenilir.</p>
    </section>
  )
}